import db from '../dbClient';
import { ObjectId } from 'mongodb';
import type { AuditLog } from '../models';

/**
 * Audit Logs Collection
 * Manages audit trail for user activities and system changes
 */
export class AuditLogsCollection {
  private collection = db.collection<AuditLog>('auditLogs');

  constructor() {
    this.ensureIndexes();
  }

  /**
   * Ensure required indexes exist
   */
  private async ensureIndexes() {
    try {
      await Promise.all([
        // Index on userId for user-specific queries
        this.collection.createIndex({ userId: 1 }),
        // Index on timestamp for chronological queries
        this.collection.createIndex({ timestamp: -1 }),
        // Index on action for filtering by action type
        this.collection.createIndex({ action: 1 }),
        // Index on resource for filtering by resource type
        this.collection.createIndex({ resource: 1 }),
        // Index on success for filtering by success/failure
        this.collection.createIndex({ success: 1 }),
        // Compound index for user activity queries
        this.collection.createIndex({ userId: 1, timestamp: -1 }),
        // Compound index for resource-specific queries
        this.collection.createIndex({ resource: 1, resourceId: 1, timestamp: -1 }),
        // TTL index to automatically delete old logs (optional - 90 days)
        this.collection.createIndex({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 })
      ]);
    } catch (error) {
      console.error('Error creating auditLogs indexes:', error);
    }
  }

  /**
   * Create a new audit log entry
   */
  async create(logData: Omit<AuditLog, '_id' | 'timestamp'>): Promise<AuditLog> {
    const auditLog: AuditLog = {
      _id: new ObjectId().toString(),
      ...logData,
      timestamp: new Date()
    };

    await this.collection.insertOne(auditLog);
    return auditLog;
  }

  /**
   * Get audit logs for a specific user
   */
  async getByUserId(
    userId: string, 
    options: {
      limit?: number;
      skip?: number;
      action?: string;
      resource?: string;
      success?: boolean;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<AuditLog[]> {
    const {
      limit = 50,
      skip = 0,
      action,
      resource,
      success,
      startDate,
      endDate
    } = options;

    const query: any = { userId };

    if (action) query.action = action;
    if (resource) query.resource = resource;
    if (success !== undefined) query.success = success;
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = startDate;
      if (endDate) query.timestamp.$lte = endDate;
    }

    return await this.collection
      .find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
  }

  /**
   * Get audit logs for a specific resource
   */
  async getByResource(
    resource: string,
    resourceId?: string,
    options: {
      limit?: number;
      skip?: number;
      action?: string;
      userId?: string;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<AuditLog[]> {
    const {
      limit = 50,
      skip = 0,
      action,
      userId,
      startDate,
      endDate
    } = options;

    const query: any = { resource };
    
    if (resourceId) query.resourceId = resourceId;
    if (action) query.action = action;
    if (userId) query.userId = userId;
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = startDate;
      if (endDate) query.timestamp.$lte = endDate;
    }

    return await this.collection
      .find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
  }

  /**
   * Get recent audit logs
   */
  async getRecent(limit: number = 100): Promise<AuditLog[]> {
    return await this.collection
      .find({})
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
  }

  /**
   * Get audit log statistics
   */
  async getStatistics(days: number = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const pipeline = [
      {
        $match: {
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          successful: {
            $sum: { $cond: ['$success', 1, 0] }
          },
          failed: {
            $sum: { $cond: ['$success', 0, 1] }
          },
          byAction: {
            $push: '$action'
          },
          byResource: {
            $push: '$resource'
          },
          uniqueUsers: {
            $addToSet: '$userId'
          }
        }
      },
      {
        $project: {
          total: 1,
          successful: 1,
          failed: 1,
          uniqueUsers: { $size: '$uniqueUsers' },
          actionStats: {
            $reduce: {
              input: '$byAction',
              initialValue: {},
              in: {
                $mergeObjects: [
                  '$$value',
                  {
                    $arrayToObject: [
                      [
                        {
                          k: '$$this',
                          v: {
                            $add: [
                              { $ifNull: [{ $getField: { field: '$$this', input: '$$value' } }, 0] },
                              1
                            ]
                          }
                        }
                      ]
                    ]
                  }
                ]
              }
            }
          },
          resourceStats: {
            $reduce: {
              input: '$byResource',
              initialValue: {},
              in: {
                $mergeObjects: [
                  '$$value',
                  {
                    $arrayToObject: [
                      [
                        {
                          k: '$$this',
                          v: {
                            $add: [
                              { $ifNull: [{ $getField: { field: '$$this', input: '$$value' } }, 0] },
                              1
                            ]
                          }
                        }
                      ]
                    ]
                  }
                ]
              }
            }
          }
        }
      }
    ];

    const result = await this.collection.aggregate(pipeline).toArray();
    return result[0] || {
      total: 0,
      successful: 0,
      failed: 0,
      uniqueUsers: 0,
      actionStats: {},
      resourceStats: {}
    };
  }

  /**
   * Get activity timeline for a user
   */
  async getUserActivityTimeline(
    userId: string,
    days: number = 30
  ): Promise<Array<{ date: string; count: number; actions: string[] }>> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const pipeline = [
      {
        $match: {
          userId,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$timestamp'
            }
          },
          count: { $sum: 1 },
          actions: { $addToSet: '$action' }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          date: '$_id',
          count: 1,
          actions: 1,
          _id: 0
        }
      }
    ];

    return await this.collection.aggregate(pipeline).toArray();
  }

  /**
   * Get security-related audit logs
   */
  async getSecurityLogs(
    options: {
      limit?: number;
      skip?: number;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<AuditLog[]> {
    const {
      limit = 100,
      skip = 0,
      startDate,
      endDate
    } = options;

    const securityActions = [
      'login_failed',
      'login_success',
      'logout',
      'password_changed',
      'email_changed',
      'role_changed',
      'user_banned',
      'user_unbanned',
      'session_terminated',
      'permission_denied'
    ];

    const query: any = {
      action: { $in: securityActions }
    };

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = startDate;
      if (endDate) query.timestamp.$lte = endDate;
    }

    return await this.collection
      .find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
  }

  /**
   * Delete old audit logs (manual cleanup)
   */
  async deleteOldLogs(olderThanDays: number = 90): Promise<number> {
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    
    const result = await this.collection.deleteMany({
      timestamp: { $lt: cutoffDate }
    });

    return result.deletedCount;
  }

  /**
   * Get failed login attempts for security monitoring
   */
  async getFailedLoginAttempts(
    timeWindow: number = 60, // minutes
    limit: number = 100
  ): Promise<Array<{ ipAddress: string; count: number; lastAttempt: Date }>> {
    const startTime = new Date(Date.now() - timeWindow * 60 * 1000);

    const pipeline = [
      {
        $match: {
          action: 'login_failed',
          timestamp: { $gte: startTime }
        }
      },
      {
        $group: {
          _id: '$ipAddress',
          count: { $sum: 1 },
          lastAttempt: { $max: '$timestamp' }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: limit
      },
      {
        $project: {
          ipAddress: '$_id',
          count: 1,
          lastAttempt: 1,
          _id: 0
        }
      }
    ];

    return await this.collection.aggregate(pipeline).toArray();
  }
}

// Export singleton instance
export const auditLogsCollection = new AuditLogsCollection();