import { ObjectId } from 'mongodb';
import dbClient from '../dbClient.js';
import type { ContentType, ContentField } from '../models.js';

const COLLECTION_NAME = 'contentTypes';

/**
 * Content Types Collection Handler
 * Provides CRUD operations for content types with proper error handling
 */
export class ContentTypesCollection {
    /**
     * Get all content types with optional filtering and pagination
     */
    static async findAll(options: {
        isSystemType?: boolean;
        limit?: number;
        skip?: number;
        sortBy?: 'name' | 'createdAt' | 'updatedAt';
        sortOrder?: 'asc' | 'desc';
    } = {}) {
        try {
            const collection = dbClient.collection<ContentType>(COLLECTION_NAME);

            // Build filter
            const filter: any = {};
            if (options.isSystemType !== undefined) filter.isSystemType = options.isSystemType;

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

            const contentTypes = await cursor.toArray();
            const total = await collection.countDocuments(filter);

            return { contentTypes, total };
        } catch (error) {
            console.error('Error fetching content types:', error);
            throw new Error('Failed to fetch content types');
        }
    }

    /**
     * Get a single content type by ID
     */
    static async findById(id: string | ObjectId) {
        try {
            const collection = dbClient.collection<ContentType>(COLLECTION_NAME);

            const objectId = typeof id === 'string' ? new ObjectId(id) : id;
            const contentType = await collection.findOne({ _id: objectId });

            return contentType;
        } catch (error) {
            console.error('Error fetching content type:', error);
            throw new Error('Failed to fetch content type');
        }
    }

    /**
     * Get a single content type by slug
     */
    static async findBySlug(slug: string) {
        try {
            const collection = dbClient.collection<ContentType>(COLLECTION_NAME);

            const contentType = await collection.findOne({ slug });
            return contentType;
        } catch (error) {
            console.error('Error fetching content type by slug:', error);
            throw new Error('Failed to fetch content type');
        }
    }

    /**
     * Create a new content type
     */
    static async create(contentTypeData: Omit<ContentType, '_id' | 'createdAt' | 'updatedAt'>) {
        try {
            const collection = dbClient.collection<ContentType>(COLLECTION_NAME);

            // Check if slug already exists
            const existingContentType = await collection.findOne({ slug: contentTypeData.slug });
            if (existingContentType) {
                throw new Error('A content type with this slug already exists');
            }

            // Assign IDs to fields
            const fieldsWithIds = contentTypeData.fields.map((field, index) => ({
                ...field,
                _id: new ObjectId(),
                order: field.order ?? index
            }));

            const now = new Date();
            const newContentType: ContentType = {
                _id: new ObjectId(),
                ...contentTypeData,
                fields: fieldsWithIds,
                createdAt: now,
                updatedAt: now
            };

            const result = await collection.insertOne(newContentType);
            
            if (!result.acknowledged) {
                throw new Error('Failed to create content type');
            }

            return newContentType;
        } catch (error) {
            console.error('Error creating content type:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to create content type');
        }
    }

    /**
     * Update an existing content type
     */
    static async update(id: string | ObjectId, updateData: Partial<Omit<ContentType, '_id' | 'createdAt'>>) {
        try {
            const collection = dbClient.collection<ContentType>(COLLECTION_NAME);

            const objectId = typeof id === 'string' ? new ObjectId(id) : id;

            // If updating slug, check for conflicts
            if (updateData.slug) {
                const existingContentType = await collection.findOne({ 
                    slug: updateData.slug, 
                    _id: { $ne: objectId } 
                });
                if (existingContentType) {
                    throw new Error('A content type with this slug already exists');
                }
            }

            // If updating fields, ensure they have IDs
            if (updateData.fields) {
                updateData.fields = updateData.fields.map((field, index) => ({
                    ...field,
                    _id: field._id || new ObjectId(),
                    order: field.order ?? index
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
                throw new Error('Content type not found');
            }

            return await this.findById(objectId);
        } catch (error) {
            console.error('Error updating content type:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to update content type');
        }
    }

    /**
     * Delete a content type
     */
    static async delete(id: string | ObjectId) {
        try {
            const collection = dbClient.collection<ContentType>(COLLECTION_NAME);
            const contentInstancesCollection = dbClient.collection('contentInstances');

            const objectId = typeof id === 'string' ? new ObjectId(id) : id;

            // Check if there are any content instances using this type
            const instanceCount = await contentInstancesCollection.countDocuments({ 
                contentTypeId: objectId 
            });

            if (instanceCount > 0) {
                throw new Error(`Cannot delete content type: ${instanceCount} content instances are using this type`);
            }

            const result = await collection.deleteOne({ _id: objectId });

            if (result.deletedCount === 0) {
                throw new Error('Content type not found');
            }

            return true;
        } catch (error) {
            console.error('Error deleting content type:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to delete content type');
        }
    }

    /**
     * Generate a unique slug from name
     */
    static async generateSlug(name: string, excludeId?: ObjectId): Promise<string> {
        try {
            const collection = dbClient.collection<ContentType>(COLLECTION_NAME);

            // Create base slug from name
            let baseSlug = name
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

                const existingContentType = await collection.findOne(filter);
                if (!existingContentType) {
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
     * Search content types
     */
    static async search(query: string, options: {
        limit?: number;
        skip?: number;
    } = {}) {
        try {
            const collection = dbClient.collection<ContentType>(COLLECTION_NAME);

            const filter: any = {
                $or: [
                    { name: { $regex: query, $options: 'i' } },
                    { description: { $regex: query, $options: 'i' } },
                    { slug: { $regex: query, $options: 'i' } }
                ]
            };

            const cursor = collection
                .find(filter)
                .sort({ createdAt: -1 });

            if (options.skip) cursor.skip(options.skip);
            if (options.limit) cursor.limit(options.limit);

            const contentTypes = await cursor.toArray();
            const total = await collection.countDocuments(filter);

            return { contentTypes, total };
        } catch (error) {
            console.error('Error searching content types:', error);
            throw new Error('Failed to search content types');
        }
    }

    /**
     * Get system content types (built-in types)
     */
    static async getSystemTypes() {
        return this.findAll({ isSystemType: true });
    }

    /**
     * Get custom content types (user-defined types)
     */
    static async getCustomTypes() {
        return this.findAll({ isSystemType: false });
    }
}