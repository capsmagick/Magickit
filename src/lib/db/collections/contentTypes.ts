import { ObjectId } from 'mongodb';
import dbClient from '../dbClient.js';
import type { ContentType, ContentField } from '../models.js';

// Internal type that uses ObjectId for database operations
interface ContentTypeDocument extends Omit<ContentType, '_id' | 'fields'> {
    _id: ObjectId;
    fields: ContentFieldDocument[];
}

interface ContentFieldDocument extends Omit<ContentField, '_id'> {
    _id: ObjectId;
}

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
            const collection = dbClient.collection<ContentTypeDocument>(COLLECTION_NAME);

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

            const documents = await cursor.toArray();
            const total = await collection.countDocuments(filter);

            // Convert ObjectId to string for client compatibility
            const contentTypes: ContentType[] = documents.map(doc => ({
                ...doc,
                _id: doc._id.toString(),
                fields: doc.fields.map(field => ({
                    ...field,
                    _id: field._id.toString()
                }))
            }));

            return { contentTypes, total };
        } catch (error) {
            console.error('Error fetching content types:', error);
            throw new Error('Failed to fetch content types');
        }
    }

    /**
     * Get a single content type by ID
     */
    static async findById(id: string | ObjectId): Promise<ContentType | null> {
        try {
            const collection = dbClient.collection<ContentTypeDocument>(COLLECTION_NAME);

            const objectId = typeof id === 'string' ? new ObjectId(id) : id;
            const document = await collection.findOne({ _id: objectId });

            if (!document) return null;

            // Convert ObjectId to string for client compatibility
            const contentType: ContentType = {
                ...document,
                _id: document._id.toString(),
                fields: document.fields.map(field => ({
                    ...field,
                    _id: field._id.toString()
                }))
            };

            return contentType;
        } catch (error) {
            console.error('Error fetching content type:', error);
            throw new Error('Failed to fetch content type');
        }
    }

    /**
     * Get a single content type by slug
     */
    static async findBySlug(slug: string): Promise<ContentType | null> {
        try {
            const collection = dbClient.collection<ContentTypeDocument>(COLLECTION_NAME);

            const document = await collection.findOne({ slug });
            
            if (!document) return null;

            // Convert ObjectId to string for client compatibility
            const contentType: ContentType = {
                ...document,
                _id: document._id.toString(),
                fields: document.fields.map(field => ({
                    ...field,
                    _id: field._id.toString()
                }))
            };

            return contentType;
        } catch (error) {
            console.error('Error fetching content type by slug:', error);
            throw new Error('Failed to fetch content type');
        }
    }

    /**
     * Create a new content type
     */
    static async create(contentTypeData: Omit<ContentType, '_id' | 'createdAt' | 'updatedAt'>): Promise<ContentType> {
        try {
            const collection = dbClient.collection<ContentTypeDocument>(COLLECTION_NAME);

            // Check if slug already exists
            const existingContentType = await collection.findOne({ slug: contentTypeData.slug });
            if (existingContentType) {
                throw new Error('A content type with this slug already exists');
            }

            // Assign IDs to fields
            const fieldsWithIds: ContentFieldDocument[] = contentTypeData.fields.map((field, index) => ({
                ...field,
                _id: new ObjectId(),
                order: field.order ?? index
            }));

            const now = new Date();
            const newContentTypeDocument: ContentTypeDocument = {
                _id: new ObjectId(),
                ...contentTypeData,
                fields: fieldsWithIds,
                createdAt: now,
                updatedAt: now
            };

            const result = await collection.insertOne(newContentTypeDocument);
            
            if (!result.acknowledged) {
                throw new Error('Failed to create content type');
            }

            // Convert back to client format
            const newContentType: ContentType = {
                ...newContentTypeDocument,
                _id: newContentTypeDocument._id.toString(),
                fields: newContentTypeDocument.fields.map(field => ({
                    ...field,
                    _id: field._id.toString()
                }))
            };

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
    static async update(id: string | ObjectId, updateData: Partial<Omit<ContentType, '_id' | 'createdAt'>>): Promise<ContentType | null> {
        try {
            const collection = dbClient.collection<ContentTypeDocument>(COLLECTION_NAME);

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

            // If updating fields, ensure they have IDs and convert to ObjectId
            let fieldsUpdate: ContentFieldDocument[] | undefined;
            if (updateData.fields) {
                fieldsUpdate = updateData.fields.map((field, index) => ({
                    ...field,
                    _id: field._id ? new ObjectId(field._id) : new ObjectId(),
                    order: field.order ?? index
                }));
            }

            const updateDoc: any = {
                ...updateData,
                updatedAt: new Date()
            };

            if (fieldsUpdate) {
                updateDoc.fields = fieldsUpdate;
            }

            const result = await collection.findOneAndUpdate(
                { _id: objectId },
                { $set: updateDoc },
                { returnDocument: 'after' }
            );

            if (!result) {
                throw new Error('Content type not found');
            }

            // Convert back to client format
            const updatedContentType: ContentType = {
                ...result,
                _id: result._id.toString(),
                fields: result.fields.map(field => ({
                    ...field,
                    _id: field._id.toString()
                }))
            };

            return updatedContentType;
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
    static async delete(id: string | ObjectId): Promise<boolean> {
        try {
            const collection = dbClient.collection<ContentTypeDocument>(COLLECTION_NAME);
            const contentInstancesCollection = dbClient.collection('contentInstances');

            const objectId = typeof id === 'string' ? new ObjectId(id) : id;

            // Check if there are any content instances using this type
            // Convert objectId to string for the query since contentTypeId is stored as string
            const instanceCount = await contentInstancesCollection.countDocuments({ 
                contentTypeId: objectId.toString() 
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