import { ObjectId } from 'mongodb';
import dbClient from '../dbClient.js';
import type { ContentVersion } from '../models.js';

const COLLECTION_NAME = 'contentVersions';

// Internal type that uses ObjectId for database operations
interface ContentVersionDocument extends Omit<ContentVersion, '_id' | 'contentInstanceId' | 'author'> {
    _id: ObjectId;
    contentInstanceId: string; // Keep as string since it references ContentInstance._id
    author: string; // Keep as string since it references user ID
}

/**
 * Content Versions Collection Handler
 * Provides CRUD operations for content versions with proper error handling
 */
export class ContentVersionsCollection {
    /**
     * Get all content versions with optional filtering and pagination
     */
    static async findAll(options: {
        contentInstanceId?: string;
        author?: string;
        limit?: number;
        skip?: number;
        sortBy?: 'version' | 'createdAt';
        sortOrder?: 'asc' | 'desc';
    } = {}) {
        try {
            const collection = dbClient.collection<ContentVersionDocument>(COLLECTION_NAME);

            // Build filter
            const filter: any = {};
            if (options.contentInstanceId) filter.contentInstanceId = options.contentInstanceId;
            if (options.author) filter.author = options.author;

            // Build sort
            const sort: any = {};
            const sortField = options.sortBy || 'version';
            const sortDirection = options.sortOrder === 'asc' ? 1 : -1;
            sort[sortField] = sortDirection;

            const cursor = collection
                .find(filter)
                .sort(sort);

            if (options.skip) cursor.skip(options.skip);
            if (options.limit) cursor.limit(options.limit);

            const versions = await cursor.toArray();
            const total = await collection.countDocuments(filter);

            return { versions, total };
        } catch (error) {
            console.error('Error fetching content versions:', error);
            throw new Error('Failed to fetch content versions');
        }
    }

    /**
     * Get a single content version by ID
     */
    static async findById(id: string | ObjectId): Promise<ContentVersion | null> {
        try {
            const collection = dbClient.collection<ContentVersionDocument>(COLLECTION_NAME);

            const objectId = typeof id === 'string' ? new ObjectId(id) : id;
            const document = await collection.findOne({ _id: objectId });

            if (!document) return null;

            // Convert ObjectId to string for client compatibility
            const version: ContentVersion = {
                ...document,
                _id: document._id.toString()
            };

            return version;
        } catch (error) {
            console.error('Error fetching content version:', error);
            throw new Error('Failed to fetch content version');
        }
    }

    /**
     * Get versions for a specific content instance
     */
    static async findByContentInstanceId(contentInstanceId: string, options: {
        limit?: number;
        skip?: number;
        sortOrder?: 'asc' | 'desc';
    } = {}) {
        return this.findAll({
            contentInstanceId,
            ...options,
            sortBy: 'version',
            sortOrder: options.sortOrder || 'desc'
        });
    }

    /**
     * Get a specific version of content
     */
    static async findByContentAndVersion(contentInstanceId: string | ObjectId, version: number) {
        try {
            const collection = dbClient.collection<ContentVersion>(COLLECTION_NAME);

            const objectId = typeof contentInstanceId === 'string' ? new ObjectId(contentInstanceId) : contentInstanceId;
            const contentVersion = await collection.findOne({ 
                contentInstanceId: objectId, 
                version 
            });

            return contentVersion;
        } catch (error) {
            console.error('Error fetching content version:', error);
            throw new Error('Failed to fetch content version');
        }
    }

    /**
     * Create a new content version
     */
    static async create(versionData: Omit<ContentVersion, '_id' | 'createdAt'>) {
        try {
            const collection = dbClient.collection<ContentVersion>(COLLECTION_NAME);

            // Check if version already exists for this content
            const existingVersion = await collection.findOne({
                contentInstanceId: versionData.contentInstanceId,
                version: versionData.version
            });

            if (existingVersion) {
                throw new Error('A version with this number already exists for this content');
            }

            const now = new Date();
            const newVersion: ContentVersion = {
                _id: new ObjectId(),
                ...versionData,
                createdAt: now
            };

            const result = await collection.insertOne(newVersion);
            
            if (!result.acknowledged) {
                throw new Error('Failed to create content version');
            }

            return newVersion;
        } catch (error) {
            console.error('Error creating content version:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to create content version');
        }
    }

    /**
     * Create a new version automatically (increments version number)
     */
    static async createNewVersion(
        contentInstanceId: string | ObjectId,
        data: Record<string, any>,
        author: ObjectId,
        changeNote?: string
    ) {
        try {
            const collection = dbClient.collection<ContentVersion>(COLLECTION_NAME);

            const objectId = typeof contentInstanceId === 'string' ? new ObjectId(contentInstanceId) : contentInstanceId;

            // Get the latest version number
            const latestVersion = await collection
                .findOne(
                    { contentInstanceId: objectId },
                    { sort: { version: -1 } }
                );

            const nextVersion = latestVersion ? latestVersion.version + 1 : 1;

            return await this.create({
                contentInstanceId: objectId,
                version: nextVersion,
                data,
                author,
                changeNote
            });
        } catch (error) {
            console.error('Error creating new version:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to create new version');
        }
    }

    /**
     * Delete a content version
     */
    static async delete(id: string | ObjectId) {
        try {
            const collection = dbClient.collection<ContentVersion>(COLLECTION_NAME);

            const objectId = typeof id === 'string' ? new ObjectId(id) : id;
            const result = await collection.deleteOne({ _id: objectId });

            if (result.deletedCount === 0) {
                throw new Error('Content version not found');
            }

            return true;
        } catch (error) {
            console.error('Error deleting content version:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to delete content version');
        }
    }

    /**
     * Delete all versions for a content instance
     */
    static async deleteByContentInstanceId(contentInstanceId: string | ObjectId) {
        try {
            const collection = dbClient.collection<ContentVersion>(COLLECTION_NAME);

            const objectId = typeof contentInstanceId === 'string' ? new ObjectId(contentInstanceId) : contentInstanceId;
            const result = await collection.deleteMany({ contentInstanceId: objectId });

            return {
                deletedCount: result.deletedCount
            };
        } catch (error) {
            console.error('Error deleting content versions:', error);
            throw new Error('Failed to delete content versions');
        }
    }

    /**
     * Get version history with author information
     */
    static async getVersionHistory(contentInstanceId: string | ObjectId, options: {
        limit?: number;
        skip?: number;
    } = {}) {
        try {
            const collection = dbClient.collection<ContentVersion>(COLLECTION_NAME);

            const objectId = typeof contentInstanceId === 'string' ? new ObjectId(contentInstanceId) : contentInstanceId;

            const pipeline: any[] = [
                { $match: { contentInstanceId: objectId } },
                {
                    $lookup: {
                        from: 'users', // Better Auth users collection
                        localField: 'author',
                        foreignField: '_id',
                        as: 'authorInfo'
                    }
                },
                {
                    $addFields: {
                        authorInfo: { $arrayElemAt: ['$authorInfo', 0] }
                    }
                },
                { $sort: { version: -1 } }
            ];

            if (options.skip) pipeline.push({ $skip: options.skip });
            if (options.limit) pipeline.push({ $limit: options.limit });

            const versions = await collection.aggregate(pipeline).toArray();
            const total = await collection.countDocuments({ contentInstanceId: objectId });

            return { versions, total };
        } catch (error) {
            console.error('Error fetching version history:', error);
            throw new Error('Failed to fetch version history');
        }
    }

    /**
     * Compare two versions
     */
    static async compareVersions(
        contentInstanceId: string | ObjectId,
        version1: number,
        version2: number
    ) {
        try {
            const collection = dbClient.collection<ContentVersion>(COLLECTION_NAME);

            const objectId = typeof contentInstanceId === 'string' ? new ObjectId(contentInstanceId) : contentInstanceId;

            const [v1, v2] = await Promise.all([
                collection.findOne({ contentInstanceId: objectId, version: version1 }),
                collection.findOne({ contentInstanceId: objectId, version: version2 })
            ]);

            if (!v1 || !v2) {
                throw new Error('One or both versions not found');
            }

            return {
                version1: v1,
                version2: v2,
                comparison: {
                    // Basic comparison - could be enhanced with detailed diff
                    dataChanged: JSON.stringify(v1.data) !== JSON.stringify(v2.data),
                    changeNote1: v1.changeNote,
                    changeNote2: v2.changeNote,
                    author1: v1.author,
                    author2: v2.author,
                    createdAt1: v1.createdAt,
                    createdAt2: v2.createdAt
                }
            };
        } catch (error) {
            console.error('Error comparing versions:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to compare versions');
        }
    }

    /**
     * Get latest version for content
     */
    static async getLatestVersion(contentInstanceId: string | ObjectId) {
        try {
            const collection = dbClient.collection<ContentVersion>(COLLECTION_NAME);

            const objectId = typeof contentInstanceId === 'string' ? new ObjectId(contentInstanceId) : contentInstanceId;

            const latestVersion = await collection
                .findOne(
                    { contentInstanceId: objectId },
                    { sort: { version: -1 } }
                );

            return latestVersion;
        } catch (error) {
            console.error('Error fetching latest version:', error);
            throw new Error('Failed to fetch latest version');
        }
    }

    /**
     * Restore content to a specific version
     */
    static async restoreToVersion(
        contentInstanceId: string | ObjectId,
        version: number,
        restoredBy: ObjectId,
        changeNote?: string
    ) {
        try {
            const versionToRestore = await this.findByContentAndVersion(contentInstanceId, version);
            
            if (!versionToRestore) {
                throw new Error('Version not found');
            }

            // Create a new version with the restored data
            const restoredVersion = await this.createNewVersion(
                contentInstanceId,
                versionToRestore.data,
                restoredBy,
                changeNote || `Restored to version ${version}`
            );

            return restoredVersion;
        } catch (error) {
            console.error('Error restoring to version:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to restore to version');
        }
    }

    /**
     * Clean up old versions (keep only last N versions per content)
     */
    static async cleanupOldVersions(versionsToKeep: number = 10) {
        try {
            const collection = dbClient.collection<ContentVersion>(COLLECTION_NAME);

            // Get all content instances with their version counts
            const contentInstances = await collection.aggregate([
                {
                    $group: {
                        _id: '$contentInstanceId',
                        versionCount: { $sum: 1 }
                    }
                },
                {
                    $match: {
                        versionCount: { $gt: versionsToKeep }
                    }
                }
            ]).toArray();

            let totalDeleted = 0;

            // For each content instance with too many versions
            for (const instance of contentInstances) {
                const versionsToDelete = instance.versionCount - versionsToKeep;
                
                // Get the oldest versions to delete
                const oldVersions = await collection
                    .find({ contentInstanceId: instance._id })
                    .sort({ version: 1 })
                    .limit(versionsToDelete)
                    .toArray();

                const versionIds = oldVersions.map(v => v._id);
                
                const deleteResult = await collection.deleteMany({
                    _id: { $in: versionIds }
                });

                totalDeleted += deleteResult.deletedCount;
            }

            return {
                deletedCount: totalDeleted,
                processedInstances: contentInstances.length
            };
        } catch (error) {
            console.error('Error cleaning up old versions:', error);
            throw new Error('Failed to cleanup old versions');
        }
    }

    /**
     * Get version statistics
     */
    static async getVersionStatistics() {
        try {
            const collection = dbClient.collection<ContentVersion>(COLLECTION_NAME);

            const pipeline = [
                {
                    $group: {
                        _id: '$contentInstanceId',
                        versionCount: { $sum: 1 },
                        latestVersion: { $max: '$version' },
                        firstCreated: { $min: '$createdAt' },
                        lastModified: { $max: '$createdAt' }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalContentInstances: { $sum: 1 },
                        totalVersions: { $sum: '$versionCount' },
                        avgVersionsPerContent: { $avg: '$versionCount' },
                        maxVersionsPerContent: { $max: '$versionCount' },
                        minVersionsPerContent: { $min: '$versionCount' }
                    }
                }
            ];

            const results = await collection.aggregate(pipeline).toArray();
            const stats = results[0] || {
                totalContentInstances: 0,
                totalVersions: 0,
                avgVersionsPerContent: 0,
                maxVersionsPerContent: 0,
                minVersionsPerContent: 0
            };

            return {
                ...stats,
                avgVersionsPerContent: Math.round(stats.avgVersionsPerContent * 100) / 100
            };
        } catch (error) {
            console.error('Error getting version statistics:', error);
            throw new Error('Failed to get version statistics');
        }
    }
}