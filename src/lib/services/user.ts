import db from '$lib/db/dbClient';
import { ObjectId } from 'mongodb';
import type { UserProfile, AuditLog } from '$lib/db/models';

/**
 * Enhanced User Management Service
 * Connects to Better Auth user data and provides additional functionality
 */
export class UserManagementService {
  private usersCollection = db.collection('user'); // Better Auth collection
  private userProfilesCollection = db.collection<UserProfile>('userProfiles');
  private auditLogsCollection = db.collection<AuditLog>('auditLogs');
  private sessionsCollection = db.collection('session'); // Better Auth collection

  /**
   * Get all users with enhanced profile data
   */
  async getAllUsers(options: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: 'active' | 'banned' | 'all';
    sortBy?: 'name' | 'email' | 'createdAt' | 'lastActivity';
    sortOrder?: 'asc' | 'desc';
  } = {}) {
    const {
      page = 1,
      limit = 50,
      search = '',
      role = '',
      status = 'all',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    try {
      // Build query
      const query: any = {};

      // Search filter
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      // Role filter
      if (role) {
        query.role = role;
      }

      // Status filter
      if (status === 'banned') {
        query.banned = true;
      } else if (status === 'active') {
        query.banned = { $ne: true };
      }

      // Sort configuration
      const sortConfig: any = {};
      sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Get users with pagination
      const users = await this.usersCollection
        .find(query)
        .sort(sortConfig)
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray();

      // Get total count
      const total = await this.usersCollection.countDocuments(query);

      // Enhance users with profile data and activity info
      const enhancedUsers = await Promise.all(
        users.map(async (user) => {
          const [profile, lastActivity, sessionCount] = await Promise.all([
            this.getUserProfile(user.id),
            this.getLastActivity(user.id),
            this.getActiveSessionCount(user.id)
          ]);

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
            emailVerified: user.emailVerified,
            banned: user.banned || false,
            banReason: user.banReason,
            banExpires: user.banExpires,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            lastActivity,
            sessionCount,
            profile: profile ? {
              bio: profile.bio,
              location: profile.location,
              website: profile.website,
              socialLinks: profile.socialLinks,
              preferences: profile.preferences
            } : null
          };
        })
      );

      return {
        users: enhancedUsers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting users:', error);
      throw new Error('Failed to retrieve users');
    }
  }

  /**
   * Get user by ID with enhanced data
   */
  async getUserById(userId: string) {
    try {
      const user = await this.usersCollection.findOne({ id: userId });
      if (!user) return null;

      const [profile, lastActivity, sessionCount, sessions] = await Promise.all([
        this.getUserProfile(userId),
        this.getLastActivity(userId),
        this.getActiveSessionCount(userId),
        this.getUserSessions(userId)
      ]);

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        emailVerified: user.emailVerified,
        banned: user.banned || false,
        banReason: user.banReason,
        banExpires: user.banExpires,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastActivity,
        sessionCount,
        sessions,
        profile: profile ? {
          bio: profile.bio,
          location: profile.location,
          website: profile.website,
          socialLinks: profile.socialLinks,
          preferences: profile.preferences
        } : null
      };
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw new Error('Failed to retrieve user');
    }
  }

  /**
   * Update user profile data
   */
  async updateUserProfile(userId: string, profileData: Partial<UserProfile>, updatedBy: string) {
    try {
      const existingProfile = await this.userProfilesCollection.findOne({ userId });
      
      if (existingProfile) {
        // Update existing profile
        const result = await this.userProfilesCollection.findOneAndUpdate(
          { userId },
          {
            $set: {
              ...profileData,
              updatedAt: new Date()
            }
          },
          { returnDocument: 'after' }
        );

        // Log the update
        await this.logUserActivity(userId, 'profile_updated', {
          updatedBy,
          changes: profileData
        });

        return result;
      } else {
        // Create new profile
        const newProfile: UserProfile = {
          _id: new ObjectId().toString(),
          userId,
          bio: profileData.bio || '',
          location: profileData.location || '',
          website: profileData.website || '',
          socialLinks: profileData.socialLinks || {},
          preferences: profileData.preferences || {
            theme: 'system',
            notifications: {
              email: true,
              push: true,
              marketing: false
            }
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await this.userProfilesCollection.insertOne(newProfile);

        // Log the creation
        await this.logUserActivity(userId, 'profile_created', {
          createdBy: updatedBy
        });

        return newProfile;
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new Error('Failed to update user profile');
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      return await this.userProfilesCollection.findOne({ userId });
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  /**
   * Get user's last activity
   */
  async getLastActivity(userId: string): Promise<Date | null> {
    try {
      // Check sessions for last activity
      const lastSession = await this.sessionsCollection
        .findOne(
          { userId },
          { sort: { updatedAt: -1 } }
        );

      if (lastSession) {
        return lastSession.updatedAt || lastSession.createdAt;
      }

      // Fallback to audit logs
      const lastAudit = await this.auditLogsCollection
        .findOne(
          { userId },
          { sort: { timestamp: -1 } }
        );

      return lastAudit?.timestamp || null;
    } catch (error) {
      console.error('Error getting last activity:', error);
      return null;
    }
  }

  /**
   * Get active session count for user
   */
  async getActiveSessionCount(userId: string): Promise<number> {
    try {
      const now = new Date();
      return await this.sessionsCollection.countDocuments({
        userId,
        expiresAt: { $gt: now }
      });
    } catch (error) {
      console.error('Error getting session count:', error);
      return 0;
    }
  }

  /**
   * Get user sessions with details
   */
  async getUserSessions(userId: string, limit: number = 10) {
    try {
      const sessions = await this.sessionsCollection
        .find({ userId })
        .sort({ updatedAt: -1 })
        .limit(limit)
        .toArray();

      return sessions.map(session => ({
        id: session.id,
        token: session.token,
        userAgent: session.userAgent,
        ipAddress: session.ipAddress,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        expiresAt: session.expiresAt,
        isActive: session.expiresAt > new Date()
      }));
    } catch (error) {
      console.error('Error getting user sessions:', error);
      return [];
    }
  }

  /**
   * Terminate user session
   */
  async terminateSession(sessionId: string, terminatedBy: string) {
    try {
      const session = await this.sessionsCollection.findOne({ id: sessionId });
      if (!session) {
        throw new Error('Session not found');
      }

      // Delete the session
      await this.sessionsCollection.deleteOne({ id: sessionId });

      // Log the termination
      await this.logUserActivity(session.userId, 'session_terminated', {
        sessionId,
        terminatedBy,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent
      });

      return true;
    } catch (error) {
      console.error('Error terminating session:', error);
      throw new Error('Failed to terminate session');
    }
  }

  /**
   * Terminate all user sessions
   */
  async terminateAllUserSessions(userId: string, terminatedBy: string) {
    try {
      const sessions = await this.sessionsCollection.find({ userId }).toArray();
      
      // Delete all sessions
      const result = await this.sessionsCollection.deleteMany({ userId });

      // Log the termination
      await this.logUserActivity(userId, 'all_sessions_terminated', {
        sessionCount: result.deletedCount,
        terminatedBy
      });

      return result.deletedCount;
    } catch (error) {
      console.error('Error terminating all sessions:', error);
      throw new Error('Failed to terminate sessions');
    }
  }

  /**
   * Get user statistics
   */
  async getUserStatistics() {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [
        totalUsers,
        newToday,
        newThisMonth,
        activeUsers,
        bannedUsers,
        roleStats
      ] = await Promise.all([
        this.usersCollection.countDocuments({}),
        this.usersCollection.countDocuments({ createdAt: { $gte: today } }),
        this.usersCollection.countDocuments({ createdAt: { $gte: thisMonth } }),
        this.getActiveUsersCount(),
        this.usersCollection.countDocuments({ banned: true }),
        this.getRoleStatistics()
      ]);

      return {
        total: totalUsers,
        newToday,
        newThisMonth,
        active: activeUsers,
        banned: bannedUsers,
        byRole: roleStats
      };
    } catch (error) {
      console.error('Error getting user statistics:', error);
      throw new Error('Failed to retrieve user statistics');
    }
  }

  /**
   * Get active users count (users with sessions in last 24 hours)
   */
  async getActiveUsersCount(): Promise<number> {
    try {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const activeUserIds = await this.sessionsCollection.distinct('userId', {
        updatedAt: { $gte: yesterday }
      });
      return activeUserIds.length;
    } catch (error) {
      console.error('Error getting active users count:', error);
      return 0;
    }
  }

  /**
   * Get role statistics
   */
  async getRoleStatistics() {
    try {
      const pipeline = [
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            role: '$_id',
            count: 1,
            _id: 0
          }
        },
        {
          $sort: { count: -1 }
        }
      ];

      const result = await this.usersCollection.aggregate(pipeline).toArray();
      return result;
    } catch (error) {
      console.error('Error getting role statistics:', error);
      return [];
    }
  }

  /**
   * Log user activity for audit trail
   */
  async logUserActivity(
    userId: string,
    action: string,
    details: Record<string, any> = {},
    request?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ) {
    try {
      const auditLog: AuditLog = {
        _id: new ObjectId().toString(),
        userId,
        action,
        resource: 'user',
        resourceId: userId,
        details,
        ipAddress: request?.ipAddress || 'unknown',
        userAgent: request?.userAgent || 'unknown',
        timestamp: new Date(),
        success: true
      };

      await this.auditLogsCollection.insertOne(auditLog);
    } catch (error) {
      console.error('Error logging user activity:', error);
      // Don't throw error for logging failures
    }
  }

  /**
   * Get user activity history
   */
  async getUserActivityHistory(userId: string, limit: number = 50) {
    try {
      const activities = await this.auditLogsCollection
        .find({ userId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();

      return activities.map(activity => ({
        id: activity._id,
        action: activity.action,
        resource: activity.resource,
        details: activity.details,
        ipAddress: activity.ipAddress,
        userAgent: activity.userAgent,
        timestamp: activity.timestamp,
        success: activity.success
      }));
    } catch (error) {
      console.error('Error getting user activity history:', error);
      return [];
    }
  }

  /**
   * Bulk update user preferences
   */
  async bulkUpdateUserPreferences(
    userIds: string[],
    preferences: Partial<UserProfile['preferences']>,
    updatedBy: string
  ) {
    try {
      const results = await Promise.all(
        userIds.map(async (userId) => {
          try {
            const existingProfile = await this.userProfilesCollection.findOne({ userId });
            
            if (existingProfile) {
              await this.userProfilesCollection.updateOne(
                { userId },
                {
                  $set: {
                    'preferences': {
                      ...existingProfile.preferences,
                      ...preferences
                    },
                    updatedAt: new Date()
                  }
                }
              );
            } else {
              // Create new profile with preferences
              const newProfile: UserProfile = {
                _id: new ObjectId().toString(),
                userId,
                preferences: {
                  theme: 'system',
                  notifications: {
                    email: true,
                    push: true,
                    marketing: false
                  },
                  ...preferences
                },
                createdAt: new Date(),
                updatedAt: new Date()
              };

              await this.userProfilesCollection.insertOne(newProfile);
            }

            // Log the update
            await this.logUserActivity(userId, 'preferences_bulk_updated', {
              updatedBy,
              preferences
            });

            return { userId, success: true };
          } catch (error) {
            console.error(`Error updating preferences for user ${userId}:`, error);
            return { userId, success: false, error: error.message };
          }
        })
      );

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      return {
        successful,
        failed,
        results
      };
    } catch (error) {
      console.error('Error bulk updating user preferences:', error);
      throw new Error('Failed to bulk update user preferences');
    }
  }

  /**
   * Get session analytics
   */
  async getSessionAnalytics(days: number = 30) {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const [
        totalSessions,
        activeSessions,
        uniqueUsers,
        sessionsByDay,
        topUserAgents,
        topLocations
      ] = await Promise.all([
        this.sessionsCollection.countDocuments({ createdAt: { $gte: startDate } }),
        this.sessionsCollection.countDocuments({ 
          createdAt: { $gte: startDate },
          expiresAt: { $gt: new Date() }
        }),
        this.sessionsCollection.distinct('userId', { createdAt: { $gte: startDate } }).then(ids => ids.length),
        this.getSessionsByDay(startDate),
        this.getTopUserAgents(startDate),
        this.getTopLocations(startDate)
      ]);

      return {
        totalSessions,
        activeSessions,
        uniqueUsers,
        sessionsByDay,
        topUserAgents,
        topLocations,
        averageSessionDuration: await this.getAverageSessionDuration(startDate)
      };
    } catch (error) {
      console.error('Error getting session analytics:', error);
      throw new Error('Failed to retrieve session analytics');
    }
  }

  /**
   * Get sessions by day for analytics
   */
  private async getSessionsByDay(startDate: Date) {
    try {
      const pipeline = [
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt'
              }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ];

      const result = await this.sessionsCollection.aggregate(pipeline).toArray();
      return result.map(item => ({
        date: item._id,
        count: item.count
      }));
    } catch (error) {
      console.error('Error getting sessions by day:', error);
      return [];
    }
  }

  /**
   * Get top user agents
   */
  private async getTopUserAgents(startDate: Date, limit: number = 10) {
    try {
      const pipeline = [
        {
          $match: {
            createdAt: { $gte: startDate },
            userAgent: { $exists: true, $ne: null }
          }
        },
        {
          $group: {
            _id: '$userAgent',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        },
        {
          $limit: limit
        }
      ];

      const result = await this.sessionsCollection.aggregate(pipeline).toArray();
      return result.map(item => ({
        userAgent: item._id,
        count: item.count
      }));
    } catch (error) {
      console.error('Error getting top user agents:', error);
      return [];
    }
  }

  /**
   * Get top locations (simplified - would need IP geolocation in production)
   */
  private async getTopLocations(startDate: Date, limit: number = 10) {
    try {
      const pipeline = [
        {
          $match: {
            createdAt: { $gte: startDate },
            ipAddress: { $exists: true, $ne: null }
          }
        },
        {
          $group: {
            _id: '$ipAddress',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        },
        {
          $limit: limit
        }
      ];

      const result = await this.sessionsCollection.aggregate(pipeline).toArray();
      return result.map(item => ({
        location: `Location for ${item._id}`, // Would be resolved via IP geolocation
        count: item.count
      }));
    } catch (error) {
      console.error('Error getting top locations:', error);
      return [];
    }
  }

  /**
   * Get average session duration
   */
  private async getAverageSessionDuration(startDate: Date): Promise<number> {
    try {
      const pipeline = [
        {
          $match: {
            createdAt: { $gte: startDate },
            updatedAt: { $exists: true }
          }
        },
        {
          $project: {
            duration: {
              $subtract: ['$updatedAt', '$createdAt']
            }
          }
        },
        {
          $group: {
            _id: null,
            averageDuration: { $avg: '$duration' }
          }
        }
      ];

      const result = await this.sessionsCollection.aggregate(pipeline).toArray();
      return result[0]?.averageDuration || 0;
    } catch (error) {
      console.error('Error getting average session duration:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const userManagementService = new UserManagementService();