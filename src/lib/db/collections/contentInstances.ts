import { ObjectId } from 'mongodb';
import dbClient from '../dbClient.js';
import type { ContentInstance } from '../models.js';

const COLLECTION_NAME = 'contentInstances';

/**
 * Content Instances Collection Handler
 * Provides CRUD operations for content instances with proper error handling
 */
export class ContentInstancesCollection {
    /**
     * Get all content instances with optional filtering and pagination
     */
    static async findAll(options: {
        contentTypeId?: ObjectId;
        status?: ContentInstance['status'];
        author?: ObjectId;
        limit?: number;
        skip?: number;
        sortBy?: 'createdAt' | 'updatedAt' | 'publishedAt' | 'title';
        sortOrder?: 'asc' | 'desc';
    } = {}) {
        try {
            const collection = dbClient.collection<ContentInstance>(COLLECTION_NAME);

            // Build filter
            const filter: any = {};
            if (options.contentTypeId) filter.contentTypeId = options.contentTypeId;
            if (options.status) filter.status = options.status;
            if (options.author) filter.author = options.author;

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

            const instances = await cursor.toArray();
            const total = await collection.countDocuments(filter);

            return { instances, total };
        } catch (error) {
            console.error('Error fetching content instances:', error);
            throw new Error('Failed to fetch content instances');
        }
    }

    /**
     * Get a single content instance by ID
     */
    static async findById(id: string | ObjectId) {
        try {
            const collection = dbClient.collection<ContentInstance>(COLLECTION_NAME);

            const objectId = typeof id === 'string' ? new ObjectId(id) : id;
            const instance = await collection.findOne({ _id: objectId });

            return instance;
        } catch (error) {
            console.error('Error fetching content instance:', error);
            throw new Error('Failed to fetch content instance');
        }
    }

    /**
     * Get a single content instance by slug
     */
    static async findBySlug(slug: string, status?: ContentInstance['status']) {
        try {
            const collection = dbClient.collection<ContentInstance>(COLLECTION_NAME);

            const filter: any = { slug };
            if (status) filter.status = status;

            const instance = await collection.findOne(filter);
            return instance;
        } catch (error) {
            console.error('Error fetching content instance by slug:', error);
            throw new Error('Failed to fetch content instance');
        }
    }

    /**
     * Get published content instance by slug (for public pages)
     */
    static async findPublishedBySlug(slug: string) {
        return this.findBySlug(slug, 'published');
    }

    /**
     * Create a new content instance
     */
    static async create(instanceData: Omit<ContentInstance, '_id' | 'createdAt' | 'updatedAt' | 'version'>) {
        try {
            const collection = dbClient.collection<ContentInstance>(COLLECTION_NAME);

            // Check if slug already exists
            const existingInstance = await collection.findOne({ slug: instanceData.slug });
            if (existingInstance) {
                throw new Error('A content instance with this slug already exists');
            }

            const now = new Date();
            const newInstance: ContentInstance = {
                _id: new ObjectId(),
                ...instanceData,
                version: 1,
                createdAt: now,
                updatedAt: now
            };

            const result = await collection.insertOne(newInstance);
            
            if (!result.acknowledged) {
                throw new Error('Failed to create content instance');
            }

            // Create initial version
            await this.createVersion(newInstance._id, newInstance.data, instanceData.author, 'Initial version');

            return newInstance;
        } catch (error) {
            console.error('Error creating content instance:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to create content instance');
        }
    }

    /**
     * Update an existing content instance
     */
    static async update(
        id: string | ObjectId, 
        updateData: Partial<Omit<ContentInstance, '_id' | 'createdAt' | 'version'>>,
        userId: ObjectId,
        changeNote?: string
    ) {
        try {
            const collection = dbClient.collection<ContentInstance>(COLLECTION_NAME);

            const objectId = typeof id === 'string' ? new ObjectId(id) : id;

            // Get current instance for versioning
            const currentInstance = await this.findById(objectId);
            if (!currentInstance) {
                throw new Error('Content instance not found');
            }

            // If updating slug, check for conflicts
            if (updateData.slug && updateData.slug !== currentInstance.slug) {
                const existingInstance = await collection.findOne({ 
                    slug: updateData.slug, 
                    _id: { $ne: objectId } 
                });
                if (existingInstance) {
                    throw new Error('A content instance with this slug already exists');
                }
            }

            // Increment version if data changed
            const newVersion = updateData.data ? currentInstance.version + 1 : currentInstance.version;

            const result = await collection.updateOne(
                { _id: objectId },
                { 
                    $set: { 
                        ...updateData,
                        lastModifiedBy: userId,
                        version: newVersion,
                        updatedAt: new Date() 
                    } 
                }
            );

            if (result.matchedCount === 0) {
                throw new Error('Content instance not found');
            }

            // Create version if data changed
            if (updateData.data) {
                await this.createVersion(objectId, updateData.data, userId, changeNote);
            }

            return await this.findById(objectId);
        } catch (error) {
            console.error('Error updating content instance:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to update content instance');
        }
    }

    /**
     * Delete a content instance
     */
    static async delete(id: string | ObjectId) {
        try {
            const collection = dbClient.collection<ContentInstance>(COLLECTION_NAME);
            const versionsCollection = dbClient.collection('contentVersions');

            const objectId = typeof id === 'string' ? new ObjectId(id) : id;

            // Delete all versions first
            await versionsCollection.deleteMany({ contentInstanceId: objectId });

            // Delete the instance
            const result = await collection.deleteOne({ _id: objectId });

            if (result.deletedCount === 0) {
                throw new Error('Content instance not found');
            }

            return true;
        } catch (error) {
            console.error('Error deleting content instance:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to delete content instance');
        }
    }

    /**
     * Publish a content instance
     */
    static async publish(id: string | ObjectId, userId: ObjectId) {
        try {
            const collection = dbClient.collection<ContentInstance>(COLLECTION_NAME);

            const objectId = typeof id === 'string' ? new ObjectId(id) : id;

            const result = await collection.updateOne(
                { _id: objectId },
                { 
                    $set: { 
                        status: 'published',
                        publishedAt: new Date(),
                        lastModifiedBy: userId,
                        updatedAt: new Date() 
                    } 
                }
            );

            if (result.matchedCount === 0) {
                throw new Error('Content instance not found');
            }

            return await this.findById(objectId);
        } catch (error) {
            console.error('Error publishing content instance:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to publish content instance');
        }
    }

    /**
     * Unpublish a content instance
     */
    static async unpublish(id: string | ObjectId, userId: ObjectId) {
        try {
            const collection = dbClient.collection<ContentInstance>(COLLECTION_NAME);

            const objectId = typeof id === 'string' ? new ObjectId(id) : id;

            const result = await collection.updateOne(
                { _id: objectId },
                { 
                    $set: { 
                        status: 'draft',
                        lastModifiedBy: userId,
                        updatedAt: new Date() 
                    },
                    $unset: {
                        publishedAt: 1
                    }
                }
            );

            if (result.matchedCount === 0) {
                throw new Error('Content instance not found');
            }

            return await this.findById(objectId);
        } catch (error) {
            console.error('Error unpublishing content instance:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to unpublish content instance');
        }
    }

    /**
     * Generate a unique slug from title
     */
    static async generateSlug(title: string, excludeId?: ObjectId): Promise<string> {
        try {
            const collection = dbClient.collection<ContentInstance>(COLLECTION_NAME);

            // Create base slug from title
            let baseSlug = title
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
                .replace(/\s+/g, '-') // Replace spaces with hyphens
                .replace(/-+/g, '-') // Replace multiple hyphens with single
                .trim();

            // Remove leading/trailing hyphens
            baseSlug = baseSlug.replace(/^-+|-+$/g, '');

            let slug = baseSlug;
            let counter = 1;

            // Check for existing slugs and append number if needed
            while (true) {
                const filter: any = { slug };
                if (excludeId) {
                    filter._id = { $ne: excludeId };
                }

                const existingInstance = await collection.findOne(filter);
                if (!existingInstance) {
                    break;
                }

                slug = `${baseSlug}-${counter}`;
                counter++;
            }

            return slug;
        } catch (error) {
            console.error('Error generating slug:', error);
            throw new Error('Failed to generate slug');
        }
    }

    /**
     * Search content instances
     */
    static async search(query: string, options: {
        contentTypeId?: ObjectId;
        status?: ContentInstance['status'];
        limit?: number;
        skip?: number;
    } = {}) {
        try {
            const collection = dbClient.collection<ContentInstance>(COLLECTION_NAME);

            const filter: any = {
                $text: { $search: query }
            };

            if (options.contentTypeId) filter.contentTypeId = options.contentTypeId;
            if (options.status) filter.status = options.status;

            const cursor = collection
                .find(filter, { score: { $meta: 'textScore' } })
                .sort({ score: { $meta: 'textScore' } });

            if (options.skip) cursor.skip(options.skip);
            if (options.limit) cursor.limit(options.limit);

            const instances = await cursor.toArray();
            const total = await collection.countDocuments(filter);

            return { instances, total };
        } catch (error) {
            console.error('Error searching content instances:', error);
            throw new Error('Failed to search content instances');
        }
    }

    /**
     * Get published instances for public display
     */
    static async getPublishedInstances(options: {
        contentTypeId?: ObjectId;
        limit?: number;
        skip?: number;
    } = {}) {
        return this.findAll({
            ...options,
            status: 'published',
            sortBy: 'publishedAt',
            sortOrder: 'desc'
        });
    }

    /**
     * Create a content version
     */
    private static async createVersion(
        contentInstanceId: ObjectId,
        data: Record<string, any>,
        author: ObjectId,
        changeNote?: string
    ) {
        try {
            const versionsCollection = dbClient.collection('contentVersions');

            // Get current version number
            const latestVersion = await versionsCollection
                .findOne(
                    { contentInstanceId },
                    { sort: { version: -1 } }
                );

            const version = latestVersion ? latestVersion.version + 1 : 1;

            const contentVersion = {
                _id: new ObjectId(),
                contentInstanceId,
                version,
                data,
                author,
                changeNote,
                createdAt: new Date()
            };

            await versionsCollection.insertOne(contentVersion);
            return contentVersion;
        } catch (error) {
            console.error('Error creating content version:', error);
            throw new Error('Failed to create content version');
        }
    }
}