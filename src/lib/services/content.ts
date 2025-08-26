import { ObjectId } from 'mongodb';
import {
    contentTypesCollection,
    contentInstancesCollection,
    contentVersionsCollection
} from '$lib/db/collections';
import type {
    ContentType,
    ContentInstance,
    ContentVersion,
    ContentField
} from '$lib/db/models';
import {
    validateContentData,
    generateSlug,
    isValidObjectId
} from '$lib/db/models';
import { cacheService, CacheKeys, CacheInvalidation } from './cache';
import { performanceService } from './performance';

// ============================================================================
// Content Management Service
// ============================================================================

export class ContentManagementService {
    /**
     * Create a new content type
     */
    static async createContentType(
        data: Omit<ContentType, '_id' | 'createdAt' | 'updatedAt'>,
        createdBy: string
    ): Promise<ObjectId | null> {
        try {
            // Ensure slug is unique
            const existingType = await contentTypesCollection.findOne({ slug: data.slug });
            if (existingType) {
                throw new Error(`Content type with slug '${data.slug}' already exists`);
            }

            const contentType: Omit<ContentType, '_id'> = {
                ...data,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const result = await contentTypesCollection.insertOne(contentType as ContentType);
            return result.insertedId;
        } catch (error) {
            console.error('Error creating content type:', error);
            return null;
        }
    }

    /**
     * Update an existing content type
     */
    static async updateContentType(
        id: string,
        updates: Partial<Omit<ContentType, '_id' | 'createdAt' | 'updatedAt'>>,
        updatedBy: string
    ): Promise<boolean> {
        try {
            if (!isValidObjectId(id)) {
                throw new Error('Invalid content type ID');
            }

            const objectId = new ObjectId(id);

            // If updating slug, ensure it's unique
            if (updates.slug) {
                const existingType = await contentTypesCollection.findOne({
                    slug: updates.slug,
                    _id: { $ne: objectId }
                });
                if (existingType) {
                    throw new Error(`Content type with slug '${updates.slug}' already exists`);
                }
            }

            const updateData = {
                ...updates,
                updatedAt: new Date()
            };

            const result = await contentTypesCollection.updateOne(
                { _id: objectId },
                { $set: updateData }
            );

            return result.modifiedCount > 0;
        } catch (error) {
            console.error('Error updating content type:', error);
            return false;
        }
    }

    /**
     * Delete a content type (only if no content instances exist)
     */
    static async deleteContentType(id: string, deletedBy: string): Promise<boolean> {
        try {
            if (!isValidObjectId(id)) {
                throw new Error('Invalid content type ID');
            }

            const objectId = new ObjectId(id);

            // Check if any content instances exist for this type
            const instanceCount = await contentInstancesCollection.countDocuments({
                contentTypeId: objectId
            });

            if (instanceCount > 0) {
                throw new Error('Cannot delete content type with existing content instances');
            }

            // Don't allow deleting system types
            const contentType = await contentTypesCollection.findOne({ _id: objectId });
            if (contentType?.isSystemType) {
                throw new Error('Cannot delete system content types');
            }

            const result = await contentTypesCollection.deleteOne({ _id: objectId });
            return result.deletedCount > 0;
        } catch (error) {
            console.error('Error deleting content type:', error);
            return false;
        }
    }

    /**
     * Get all content types
     */
    static async getContentTypes(): Promise<ContentType[]> {
        try {
            return await contentTypesCollection
                .find({})
                .sort({ name: 1 })
                .toArray();
        } catch (error) {
            console.error('Error getting content types:', error);
            return [];
        }
    }

    /**
     * Get content type by ID
     */
    static async getContentTypeById(id: string): Promise<ContentType | null> {
        try {
            if (!isValidObjectId(id)) {
                return null;
            }

            return await contentTypesCollection.findOne({ _id: new ObjectId(id) });
        } catch (error) {
            console.error('Error getting content type by ID:', error);
            return null;
        }
    }

    /**
     * Get content type by slug
     */
    static async getContentTypeBySlug(slug: string): Promise<ContentType | null> {
        try {
            return await contentTypesCollection.findOne({ slug });
        } catch (error) {
            console.error('Error getting content type by slug:', error);
            return null;
        }
    }

    /**
     * Create a new content instance
     */
    static async createContentInstance(
        data: Omit<ContentInstance, '_id' | 'createdAt' | 'updatedAt' | 'version'>,
        createdBy: string
    ): Promise<ObjectId | null> {
        try {
            // Validate content type exists
            const contentType = await contentTypesCollection.findOne({
                _id: data.contentTypeId
            });
            if (!contentType) {
                throw new Error('Content type not found');
            }

            // Validate content data against content type
            const validation = validateContentData(contentType, data.data);
            if (!validation.isValid) {
                throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
            }

            // Ensure slug is unique
            const existingContent = await contentInstancesCollection.findOne({
                slug: data.slug
            });
            if (existingContent) {
                throw new Error(`Content with slug '${data.slug}' already exists`);
            }

            const contentInstance: Omit<ContentInstance, '_id'> = {
                ...data,
                version: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const result = await contentInstancesCollection.insertOne(contentInstance as ContentInstance);

            // Create initial version
            await this.createContentVersion(
                result.insertedId.toString(),
                data.data,
                createdBy,
                'Initial version'
            );

            return result.insertedId;
        } catch (error) {
            console.error('Error creating content instance:', error);
            return null;
        }
    }

    /**
     * Update a content instance with cache invalidation
     */
    static async updateContentInstance(
        id: string,
        updates: Partial<Omit<ContentInstance, '_id' | 'createdAt' | 'updatedAt' | 'version'>>,
        updatedBy: string,
        changeNote?: string
    ): Promise<boolean> {
        try {
            if (!isValidObjectId(id)) {
                throw new Error('Invalid content instance ID');
            }

            const objectId = new ObjectId(id);
            const existingContent = await contentInstancesCollection.findOne({ _id: objectId });

            if (!existingContent) {
                throw new Error('Content instance not found');
            }

            // If updating data, validate against content type
            if (updates.data) {
                const contentType = await contentTypesCollection.findOne({
                    _id: existingContent.contentTypeId
                });
                if (contentType) {
                    const validation = validateContentData(contentType, updates.data);
                    if (!validation.isValid) {
                        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
                    }
                }
            }

            // If updating slug, ensure it's unique
            if (updates.slug && updates.slug !== existingContent.slug) {
                const existingSlug = await contentInstancesCollection.findOne({
                    slug: updates.slug,
                    _id: { $ne: objectId }
                });
                if (existingSlug) {
                    throw new Error(`Content with slug '${updates.slug}' already exists`);
                }
            }

            const updateData = {
                ...updates,
                lastModifiedBy: new ObjectId(updatedBy),
                version: existingContent.version + 1,
                updatedAt: new Date()
            };

            const result = await contentInstancesCollection.updateOne(
                { _id: objectId },
                { $set: updateData }
            );

            // Create version if data was updated
            if (updates.data && result.modifiedCount > 0) {
                await this.createContentVersion(
                    id,
                    updates.data,
                    updatedBy,
                    changeNote || 'Content updated'
                );
            }

            // Invalidate cache for updated content
            if (result.modifiedCount > 0) {
                await CacheInvalidation.invalidateContent(
                    updates.slug || existingContent.slug,
                    existingContent.contentTypeId.toString()
                );
                
                // If slug changed, also invalidate old slug
                if (updates.slug && updates.slug !== existingContent.slug) {
                    await CacheInvalidation.invalidateContent(existingContent.slug);
                }
            }

            return result.modifiedCount > 0;
        } catch (error) {
            console.error('Error updating content instance:', error);
            return false;
        }
    }

    /**
     * Delete a content instance
     */
    static async deleteContentInstance(id: string, deletedBy: string): Promise<boolean> {
        try {
            if (!isValidObjectId(id)) {
                throw new Error('Invalid content instance ID');
            }

            const objectId = new ObjectId(id);

            // Delete all versions first
            await contentVersionsCollection.deleteMany({ contentInstanceId: objectId });

            // Delete the content instance
            const result = await contentInstancesCollection.deleteOne({ _id: objectId });
            return result.deletedCount > 0;
        } catch (error) {
            console.error('Error deleting content instance:', error);
            return false;
        }
    }

    /**
     * Get content instances with filtering and pagination
     */
    static async getContentInstances(
        filters: {
            contentTypeId?: string;
            status?: ContentInstance['status'];
            author?: string;
            search?: string;
        } = {},
        options: {
            limit?: number;
            skip?: number;
            sortBy?: 'createdAt' | 'updatedAt' | 'publishedAt' | 'title';
            sortOrder?: 'asc' | 'desc';
        } = {}
    ): Promise<{ instances: ContentInstance[]; total: number }> {
        try {
            const query: any = {};

            if (filters.contentTypeId && isValidObjectId(filters.contentTypeId)) {
                query.contentTypeId = new ObjectId(filters.contentTypeId);
            }
            if (filters.status) {
                query.status = filters.status;
            }
            if (filters.author && isValidObjectId(filters.author)) {
                query.author = new ObjectId(filters.author);
            }
            if (filters.search) {
                query.$text = { $search: filters.search };
            }

            const { limit = 20, skip = 0, sortBy = 'updatedAt', sortOrder = 'desc' } = options;
            const sortDirection = sortOrder === 'asc' ? 1 : -1;

            const [instances, total] = await Promise.all([
                contentInstancesCollection
                    .find(query)
                    .sort({ [sortBy]: sortDirection })
                    .limit(limit)
                    .skip(skip)
                    .toArray(),
                contentInstancesCollection.countDocuments(query)
            ]);

            return { instances, total };
        } catch (error) {
            console.error('Error getting content instances:', error);
            return { instances: [], total: 0 };
        }
    }

    /**
     * Get content instance by ID
     */
    static async getContentInstanceById(id: string): Promise<ContentInstance | null> {
        try {
            if (!isValidObjectId(id)) {
                return null;
            }

            return await contentInstancesCollection.findOne({ _id: new ObjectId(id) });
        } catch (error) {
            console.error('Error getting content instance by ID:', error);
            return null;
        }
    }

    /**
     * Get content instance by slug (published only) with caching
     */
    static async getContentInstanceBySlug(slug: string): Promise<ContentInstance | null> {
        try {
            // Try cache first
            const cacheKey = CacheKeys.content(slug);
            const cached = await cacheService.get<ContentInstance>(cacheKey);
            
            if (cached) {
                return cached;
            }

            // Cache miss - query database
            const content = await contentInstancesCollection.findOne({
                slug,
                status: 'published',
                $or: [
                    { publishedAt: { $lte: new Date() } },
                    { publishedAt: { $exists: false } }
                ]
            });

            // Cache the result (including null results to prevent repeated queries)
            if (content) {
                await cacheService.set(cacheKey, content, 15 * 60 * 1000); // 15 minutes
            }

            return content;
        } catch (error) {
            console.error('Error getting content instance by slug:', error);
            return null;
        }
    }

    /**
     * Publish a content instance with cache invalidation
     */
    static async publishContentInstance(
        id: string,
        publishedBy: string,
        publishedAt?: Date
    ): Promise<boolean> {
        try {
            if (!isValidObjectId(id)) {
                throw new Error('Invalid content instance ID');
            }

            const objectId = new ObjectId(id);
            const content = await contentInstancesCollection.findOne({ _id: objectId });
            
            if (!content) {
                throw new Error('Content instance not found');
            }

            const publishDate = publishedAt || new Date();

            const result = await contentInstancesCollection.updateOne(
                { _id: objectId },
                {
                    $set: {
                        status: 'published',
                        publishedAt: publishDate,
                        lastModifiedBy: new ObjectId(publishedBy),
                        updatedAt: new Date()
                    }
                }
            );

            // Invalidate cache when content is published
            if (result.modifiedCount > 0) {
                await CacheInvalidation.invalidateContent(
                    content.slug,
                    content.contentTypeId.toString()
                );
            }

            return result.modifiedCount > 0;
        } catch (error) {
            console.error('Error publishing content instance:', error);
            return false;
        }
    }

    /**
     * Archive a content instance
     */
    static async archiveContentInstance(id: string, archivedBy: string): Promise<boolean> {
        try {
            if (!isValidObjectId(id)) {
                throw new Error('Invalid content instance ID');
            }

            const objectId = new ObjectId(id);

            const result = await contentInstancesCollection.updateOne(
                { _id: objectId },
                {
                    $set: {
                        status: 'archived',
                        lastModifiedBy: new ObjectId(archivedBy),
                        updatedAt: new Date()
                    }
                }
            );

            return result.modifiedCount > 0;
        } catch (error) {
            console.error('Error archiving content instance:', error);
            return false;
        }
    }

    /**
     * Create a content version
     */
    static async createContentVersion(
        contentInstanceId: string,
        data: Record<string, any>,
        author: string,
        changeNote?: string
    ): Promise<ObjectId | null> {
        try {
            if (!isValidObjectId(contentInstanceId) || !isValidObjectId(author)) {
                throw new Error('Invalid ID provided');
            }

            const contentInstance = await contentInstancesCollection.findOne({
                _id: new ObjectId(contentInstanceId)
            });
            if (!contentInstance) {
                throw new Error('Content instance not found');
            }

            const version: Omit<ContentVersion, '_id'> = {
                contentInstanceId: new ObjectId(contentInstanceId),
                version: contentInstance.version,
                data,
                author: new ObjectId(author),
                changeNote,
                createdAt: new Date()
            };

            const result = await contentVersionsCollection.insertOne(version as ContentVersion);
            return result.insertedId;
        } catch (error) {
            console.error('Error creating content version:', error);
            return null;
        }
    }

    /**
     * Get content versions for an instance
     */
    static async getContentVersions(
        contentInstanceId: string,
        limit: number = 10
    ): Promise<ContentVersion[]> {
        try {
            if (!isValidObjectId(contentInstanceId)) {
                return [];
            }

            return await contentVersionsCollection
                .find({ contentInstanceId: new ObjectId(contentInstanceId) })
                .sort({ version: -1 })
                .limit(limit)
                .toArray();
        } catch (error) {
            console.error('Error getting content versions:', error);
            return [];
        }
    }

    /**
     * Restore content to a specific version
     */
    static async restoreContentVersion(
        contentInstanceId: string,
        version: number,
        restoredBy: string
    ): Promise<boolean> {
        try {
            if (!isValidObjectId(contentInstanceId) || !isValidObjectId(restoredBy)) {
                throw new Error('Invalid ID provided');
            }

            const contentVersion = await contentVersionsCollection.findOne({
                contentInstanceId: new ObjectId(contentInstanceId),
                version
            });

            if (!contentVersion) {
                throw new Error('Content version not found');
            }

            return await this.updateContentInstance(
                contentInstanceId,
                { data: contentVersion.data },
                restoredBy,
                `Restored to version ${version}`
            );
        } catch (error) {
            console.error('Error restoring content version:', error);
            return false;
        }
    }

    /**
     * Get content statistics
     */
    static async getContentStatistics(): Promise<{
        totalTypes: number;
        totalInstances: number;
        publishedInstances: number;
        draftInstances: number;
        archivedInstances: number;
    }> {
        try {
            const [
                totalTypes,
                totalInstances,
                publishedInstances,
                draftInstances,
                archivedInstances
            ] = await Promise.all([
                contentTypesCollection.countDocuments(),
                contentInstancesCollection.countDocuments(),
                contentInstancesCollection.countDocuments({ status: 'published' }),
                contentInstancesCollection.countDocuments({ status: 'draft' }),
                contentInstancesCollection.countDocuments({ status: 'archived' })
            ]);

            return {
                totalTypes,
                totalInstances,
                publishedInstances,
                draftInstances,
                archivedInstances
            };
        } catch (error) {
            console.error('Error getting content statistics:', error);
            return {
                totalTypes: 0,
                totalInstances: 0,
                publishedInstances: 0,
                draftInstances: 0,
                archivedInstances: 0
            };
        }
    }

    /**
     * Generate unique slug from title
     */
    static async generateUniqueSlug(title: string, excludeId?: string): Promise<string> {
        try {
            let baseSlug = generateSlug(title);
            let slug = baseSlug;
            let counter = 1;

            while (true) {
                const query: any = { slug };
                if (excludeId && isValidObjectId(excludeId)) {
                    query._id = { $ne: new ObjectId(excludeId) };
                }

                const existing = await contentInstancesCollection.findOne(query);
                if (!existing) {
                    return slug;
                }

                slug = `${baseSlug}-${counter}`;
                counter++;
            }
        } catch (error) {
            console.error('Error generating unique slug:', error);
            return generateSlug(title);
        }
    }
}

// Export singleton instance
export const contentService = ContentManagementService;