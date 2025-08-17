import { ObjectId } from 'mongodb';
import dbClient from '../dbClient.js';
import type { MediaFile, MediaVariant } from '../models.js';

const COLLECTION_NAME = 'mediaFiles';

/**
 * Media Files Collection Handler
 * Provides CRUD operations for media files with proper error handling
 */
export class MediaFilesCollection {
    /**
     * Get all media files with optional filtering and pagination
     */
    static async findAll(options: {
        folderId?: ObjectId | null;
        mimeType?: string;
        uploadedBy?: ObjectId;
        tags?: string[];
        limit?: number;
        skip?: number;
        sortBy?: 'filename' | 'originalName' | 'createdAt' | 'updatedAt' | 'size';
        sortOrder?: 'asc' | 'desc';
    } = {}) {
        try {
            const collection = dbClient.collection<MediaFile>(COLLECTION_NAME);

            // Build filter
            const filter: any = {};
            if (options.folderId !== undefined) {
                filter.folderId = options.folderId;
            }
            if (options.mimeType) {
                filter.mimeType = { $regex: options.mimeType, $options: 'i' };
            }
            if (options.uploadedBy) filter.uploadedBy = options.uploadedBy;
            if (options.tags && options.tags.length > 0) {
                filter.tags = { $in: options.tags };
            }

            // Build sort
            const sort: any = {};
            const sortField = options.sortBy || 'createdAt';
            const sortDirection = options.sortOrder === 'asc' ? 1 : -1;
            sort[sortField] = sortDirection;

            const cursor = collection
                .find(filter)
                .sort(sort);

            if (options.skip) cursor.skip(options.skip);
            if (options.limit) cursor.limit(options.limit);

            const files = await cursor.toArray();
            const total = await collection.countDocuments(filter);

            return { files, total };
        } catch (error) {
            console.error('Error fetching media files:', error);
            throw new Error('Failed to fetch media files');
        }
    }

    /**
     * Get a single media file by ID
     */
    static async findById(id: string | ObjectId) {
        try {
            const collection = dbClient.collection<MediaFile>(COLLECTION_NAME);

            const objectId = typeof id === 'string' ? new ObjectId(id) : id;
            const file = await collection.findOne({ _id: objectId });

            return file;
        } catch (error) {
            console.error('Error fetching media file:', error);
            throw new Error('Failed to fetch media file');
        }
    }

    /**
     * Get a single media file by S3 key
     */
    static async findByS3Key(s3Key: string) {
        try {
            const collection = dbClient.collection<MediaFile>(COLLECTION_NAME);

            const file = await collection.findOne({ s3Key });
            return file;
        } catch (error) {
            console.error('Error fetching media file by S3 key:', error);
            throw new Error('Failed to fetch media file');
        }
    }

    /**
     * Create a new media file
     */
    static async create(fileData: Omit<MediaFile, '_id' | 'createdAt' | 'updatedAt'>) {
        try {
            const collection = dbClient.collection<MediaFile>(COLLECTION_NAME);

            // Check if S3 key already exists
            const existingFile = await collection.findOne({ s3Key: fileData.s3Key });
            if (existingFile) {
                throw new Error('A file with this S3 key already exists');
            }

            // Assign IDs to variants
            const variantsWithIds = fileData.variants.map(variant => ({
                ...variant,
                _id: variant._id || new ObjectId()
            }));

            const now = new Date();
            const newFile: MediaFile = {
                _id: new ObjectId(),
                ...fileData,
                variants: variantsWithIds,
                createdAt: now,
                updatedAt: now
            };

            const result = await collection.insertOne(newFile);
            
            if (!result.acknowledged) {
                throw new Error('Failed to create media file');
            }

            return newFile;
        } catch (error) {
            console.error('Error creating media file:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to create media file');
        }
    }

    /**
     * Update an existing media file
     */
    static async update(id: string | ObjectId, updateData: Partial<Omit<MediaFile, '_id' | 'createdAt'>>) {
        try {
            const collection = dbClient.collection<MediaFile>(COLLECTION_NAME);

            const objectId = typeof id === 'string' ? new ObjectId(id) : id;

            // If updating S3 key, check for conflicts
            if (updateData.s3Key) {
                const existingFile = await collection.findOne({ 
                    s3Key: updateData.s3Key, 
                    _id: { $ne: objectId } 
                });
                if (existingFile) {
                    throw new Error('A file with this S3 key already exists');
                }
            }

            // If updating variants, ensure they have IDs
            if (updateData.variants) {
                updateData.variants = updateData.variants.map(variant => ({
                    ...variant,
                    _id: variant._id || new ObjectId()
                }));
            }

            const result = await collection.updateOne(
                { _id: objectId },
                { 
                    $set: { 
                        ...updateData, 
                        updatedAt: new Date() 
                    } 
                }
            );

            if (result.matchedCount === 0) {
                throw new Error('Media file not found');
            }

            return await this.findById(objectId);
        } catch (error) {
            console.error('Error updating media file:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to update media file');
        }
    }

    /**
     * Delete a media file
     */
    static async delete(id: string | ObjectId) {
        try {
            const collection = dbClient.collection<MediaFile>(COLLECTION_NAME);

            const objectId = typeof id === 'string' ? new ObjectId(id) : id;
            const result = await collection.deleteOne({ _id: objectId });

            if (result.deletedCount === 0) {
                throw new Error('Media file not found');
            }

            return true;
        } catch (error) {
            console.error('Error deleting media file:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to delete media file');
        }
    }

    /**
     * Move media file to different folder
     */
    static async moveToFolder(id: string | ObjectId, folderId: ObjectId | null) {
        try {
            const collection = dbClient.collection<MediaFile>(COLLECTION_NAME);

            const objectId = typeof id === 'string' ? new ObjectId(id) : id;

            // Verify folder exists if folderId is provided
            if (folderId) {
                const foldersCollection = dbClient.collection('mediaFolders');
                const folder = await foldersCollection.findOne({ _id: folderId });
                if (!folder) {
                    throw new Error('Target folder not found');
                }
            }

            const result = await collection.updateOne(
                { _id: objectId },
                { 
                    $set: { 
                        folderId,
                        updatedAt: new Date() 
                    } 
                }
            );

            if (result.matchedCount === 0) {
                throw new Error('Media file not found');
            }

            return await this.findById(objectId);
        } catch (error) {
            console.error('Error moving media file:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to move media file');
        }
    }

    /**
     * Search media files
     */
    static async search(query: string, options: {
        folderId?: ObjectId | null;
        mimeType?: string;
        limit?: number;
        skip?: number;
    } = {}) {
        try {
            const collection = dbClient.collection<MediaFile>(COLLECTION_NAME);

            const filter: any = {
                $text: { $search: query }
            };

            if (options.folderId !== undefined) {
                filter.folderId = options.folderId;
            }
            if (options.mimeType) {
                filter.mimeType = { $regex: options.mimeType, $options: 'i' };
            }

            const cursor = collection
                .find(filter, { score: { $meta: 'textScore' } })
                .sort({ score: { $meta: 'textScore' } });

            if (options.skip) cursor.skip(options.skip);
            if (options.limit) cursor.limit(options.limit);

            const files = await cursor.toArray();
            const total = await collection.countDocuments(filter);

            return { files, total };
        } catch (error) {
            console.error('Error searching media files:', error);
            throw new Error('Failed to search media files');
        }
    }

    /**
     * Get files by MIME type category
     */
    static async getByMimeTypeCategory(category: 'image' | 'video' | 'audio' | 'document', options: {
        folderId?: ObjectId | null;
        limit?: number;
        skip?: number;
    } = {}) {
        const mimeTypePatterns = {
            image: 'image/',
            video: 'video/',
            audio: 'audio/',
            document: '(application/pdf|application/msword|application/vnd.openxmlformats-officedocument)'
        };

        return this.findAll({
            ...options,
            mimeType: mimeTypePatterns[category]
        });
    }

    /**
     * Get all unique tags
     */
    static async getAllTags() {
        try {
            const collection = dbClient.collection<MediaFile>(COLLECTION_NAME);
            const tags = await collection.distinct('tags');
            return tags.sort();
        } catch (error) {
            console.error('Error fetching tags:', error);
            throw new Error('Failed to fetch tags');
        }
    }

    /**
     * Get storage statistics
     */
    static async getStorageStats() {
        try {
            const collection = dbClient.collection<MediaFile>(COLLECTION_NAME);

            const stats = await collection.aggregate([
                {
                    $group: {
                        _id: null,
                        totalFiles: { $sum: 1 },
                        totalSize: { $sum: '$size' },
                        avgSize: { $avg: '$size' },
                        maxSize: { $max: '$size' },
                        minSize: { $min: '$size' }
                    }
                }
            ]).toArray();

            const mimeTypeStats = await collection.aggregate([
                {
                    $group: {
                        _id: '$mimeType',
                        count: { $sum: 1 },
                        totalSize: { $sum: '$size' }
                    }
                },
                { $sort: { count: -1 } }
            ]).toArray();

            return {
                overall: stats[0] || {
                    totalFiles: 0,
                    totalSize: 0,
                    avgSize: 0,
                    maxSize: 0,
                    minSize: 0
                },
                byMimeType: mimeTypeStats
            };
        } catch (error) {
            console.error('Error getting storage stats:', error);
            throw new Error('Failed to get storage stats');
        }
    }

    /**
     * Bulk update tags for multiple files
     */
    static async bulkUpdateTags(fileIds: ObjectId[], tags: string[]) {
        try {
            const collection = dbClient.collection<MediaFile>(COLLECTION_NAME);

            const result = await collection.updateMany(
                { _id: { $in: fileIds } },
                { 
                    $set: { 
                        tags,
                        updatedAt: new Date() 
                    } 
                }
            );

            return {
                matchedCount: result.matchedCount,
                modifiedCount: result.modifiedCount
            };
        } catch (error) {
            console.error('Error bulk updating tags:', error);
            throw new Error('Failed to bulk update tags');
        }
    }

    /**
     * Bulk move files to folder
     */
    static async bulkMoveToFolder(fileIds: ObjectId[], folderId: ObjectId | null) {
        try {
            const collection = dbClient.collection<MediaFile>(COLLECTION_NAME);

            // Verify folder exists if folderId is provided
            if (folderId) {
                const foldersCollection = dbClient.collection('mediaFolders');
                const folder = await foldersCollection.findOne({ _id: folderId });
                if (!folder) {
                    throw new Error('Target folder not found');
                }
            }

            const result = await collection.updateMany(
                { _id: { $in: fileIds } },
                { 
                    $set: { 
                        folderId,
                        updatedAt: new Date() 
                    } 
                }
            );

            return {
                matchedCount: result.matchedCount,
                modifiedCount: result.modifiedCount
            };
        } catch (error) {
            console.error('Error bulk moving files:', error);
            throw new Error('Failed to bulk move files');
        }
    }
}