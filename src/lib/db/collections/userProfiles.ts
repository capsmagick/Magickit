import db from '../dbClient';
import { ObjectId } from 'mongodb';
import type { UserProfile } from '../models';

/**
 * User Profiles Collection
 * Manages extended user profile data that complements Better Auth's user model
 */
export class UserProfilesCollection {
  private collection = db.collection<UserProfile>('userProfiles');

  constructor() {
    this.ensureIndexes();
  }

  /**
   * Ensure required indexes exist
   */
  private async ensureIndexes() {
    try {
      await Promise.all([
        // Index on userId for fast lookups
        this.collection.createIndex({ userId: 1 }, { unique: true }),
        // Index on createdAt for sorting
        this.collection.createIndex({ createdAt: -1 }),
        // Index on updatedAt for sorting
        this.collection.createIndex({ updatedAt: -1 }),
        // Text index for searching bio and location
        this.collection.createIndex({ 
          bio: 'text', 
          location: 'text' 
        })
      ]);
    } catch (error) {
      console.error('Error creating userProfiles indexes:', error);
    }
  }

  /**
   * Create a new user profile
   */
  async create(profileData: Omit<UserProfile, '_id' | 'createdAt' | 'updatedAt'>): Promise<UserProfile> {
    const profile: UserProfile = {
      _id: new ObjectId().toString(),
      ...profileData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.collection.insertOne(profile);
    return profile;
  }

  /**
   * Get user profile by user ID
   */
  async getByUserId(userId: string): Promise<UserProfile | null> {
    return await this.collection.findOne({ userId });
  }

  /**
   * Update user profile
   */
  async update(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    return await this.collection.findOneAndUpdate(
      { userId },
      { 
        $set: { 
          ...updates, 
          updatedAt: new Date() 
        } 
      },
      { returnDocument: 'after' }
    );
  }

  /**
   * Delete user profile
   */
  async delete(userId: string): Promise<boolean> {
    const result = await this.collection.deleteOne({ userId });
    return result.deletedCount > 0;
  }

  /**
   * Search user profiles
   */
  async search(query: string, limit: number = 20): Promise<UserProfile[]> {
    return await this.collection
      .find({ 
        $text: { $search: query } 
      })
      .limit(limit)
      .toArray();
  }

  /**
   * Get profiles by theme preference
   */
  async getByTheme(theme: 'light' | 'dark' | 'system'): Promise<UserProfile[]> {
    return await this.collection
      .find({ 'preferences.theme': theme })
      .toArray();
  }

  /**
   * Get profiles with notification preferences
   */
  async getByNotificationPreference(
    type: 'email' | 'push' | 'marketing',
    enabled: boolean
  ): Promise<UserProfile[]> {
    const query: any = {};
    query[`preferences.notifications.${type}`] = enabled;
    
    return await this.collection
      .find(query)
      .toArray();
  }

  /**
   * Bulk update preferences
   */
  async bulkUpdatePreferences(
    userIds: string[],
    preferences: Partial<UserProfile['preferences']>
  ): Promise<{ modifiedCount: number }> {
    const result = await this.collection.updateMany(
      { userId: { $in: userIds } },
      { 
        $set: { 
          preferences,
          updatedAt: new Date() 
        } 
      }
    );

    return { modifiedCount: result.modifiedCount };
  }

  /**
   * Get statistics about user profiles
   */
  async getStatistics() {
    const pipeline = [
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          byTheme: {
            $push: '$preferences.theme'
          },
          withBio: {
            $sum: {
              $cond: [
                { $and: [{ $ne: ['$bio', null] }, { $ne: ['$bio', ''] }] },
                1,
                0
              ]
            }
          },
          withLocation: {
            $sum: {
              $cond: [
                { $and: [{ $ne: ['$location', null] }, { $ne: ['$location', ''] }] },
                1,
                0
              ]
            }
          },
          withWebsite: {
            $sum: {
              $cond: [
                { $and: [{ $ne: ['$website', null] }, { $ne: ['$website', ''] }] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $project: {
          total: 1,
          withBio: 1,
          withLocation: 1,
          withWebsite: 1,
          themeStats: {
            $reduce: {
              input: '$byTheme',
              initialValue: { light: 0, dark: 0, system: 0 },
              in: {
                light: {
                  $cond: [
                    { $eq: ['$$this', 'light'] },
                    { $add: ['$$value.light', 1] },
                    '$$value.light'
                  ]
                },
                dark: {
                  $cond: [
                    { $eq: ['$$this', 'dark'] },
                    { $add: ['$$value.dark', 1] },
                    '$$value.dark'
                  ]
                },
                system: {
                  $cond: [
                    { $eq: ['$$this', 'system'] },
                    { $add: ['$$value.system', 1] },
                    '$$value.system'
                  ]
                }
              }
            }
          }
        }
      }
    ];

    const result = await this.collection.aggregate(pipeline).toArray();
    return result[0] || {
      total: 0,
      withBio: 0,
      withLocation: 0,
      withWebsite: 0,
      themeStats: { light: 0, dark: 0, system: 0 }
    };
  }
}

// Export singleton instance
export const userProfilesCollection = new UserProfilesCollection();