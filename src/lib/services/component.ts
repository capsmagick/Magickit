import { ObjectId } from 'mongodb';
import { 
    contentInstancesCollection, 
    contentVersionsCollection,
    contentTypesCollection 
} from '$lib/db/collections';
import type { 
    Component, 
    ComponentUsage, 
    ComponentVersion, 
    ComponentCategory,
    ComponentPreview,
    ComponentTemplate
} from '$lib/db/models/component';
import type { ContentInstance } from '$lib/db/models';
import { contentService } from './content';
import dbClient from '$lib/db/dbClient';

// ============================================================================
// Component Management Service
// ============================================================================

export class ComponentManagementService {
    private static componentUsageCollection = dbClient.collection<ComponentUsage>('componentUsage');
    private static componentVersionsCollection = dbClient.collection<ComponentVersion>('componentVersions');
    private static componentCategoriesCollection = dbClient.collection<ComponentCategory>('componentCategories');
    private static componentPreviewsCollection = dbClient.collection<ComponentPreview>('componentPreviews');
    private static componentTemplatesCollection = dbClient.collection<ComponentTemplate>('componentTemplates');

    /**
     * Get all components with enhanced filtering and sorting
     */
    static async getComponents(filters: {
        category?: string;
        subcategory?: string;
        tags?: string[];
        difficulty?: 'beginner' | 'intermediate' | 'advanced';
        reviewStatus?: 'pending' | 'approved' | 'needs_work';
        search?: string;
        maintainer?: string;
    } = {}, options: {
        limit?: number;
        skip?: number;
        sortBy?: 'name' | 'created' | 'updated' | 'usage' | 'rating' | 'popularity';
        sortOrder?: 'asc' | 'desc';
    } = {}): Promise<{ components: Component[]; total: number }> {
        try {
            const query: any = {
                'data.isComponent': true,
                status: 'published' // Only show published components
            };

            // Apply filters
            if (filters.category) {
                query['data.category'] = filters.category;
            }
            if (filters.subcategory) {
                query['data.subcategory'] = filters.subcategory;
            }
            if (filters.tags && filters.tags.length > 0) {
                query['data.componentMetadata.tags'] = { $in: filters.tags };
            }
            if (filters.difficulty) {
                query['data.componentMetadata.difficulty'] = filters.difficulty;
            }
            if (filters.reviewStatus) {
                query['data.componentMetadata.reviewStatus'] = filters.reviewStatus;
            }
            if (filters.maintainer) {
                query['data.componentMetadata.maintainer'] = new ObjectId(filters.maintainer);
            }
            if (filters.search) {
                query.$text = { $search: filters.search };
            }

            // Build sort
            const { sortBy = 'updated', sortOrder = 'desc' } = options;
            let sort: any = {};
            
            switch (sortBy) {
                case 'name':
                    sort = { title: sortOrder === 'asc' ? 1 : -1 };
                    break;
                case 'created':
                    sort = { createdAt: sortOrder === 'asc' ? 1 : -1 };
                    break;
                case 'updated':
                    sort = { updatedAt: sortOrder === 'asc' ? 1 : -1 };
                    break;
                case 'usage':
                    sort = { 'data.componentMetadata.usageCount': sortOrder === 'asc' ? 1 : -1 };
                    break;
                case 'rating':
                    sort = { 'data.componentMetadata.rating': sortOrder === 'asc' ? 1 : -1 };
                    break;
                case 'popularity':
                    // For popularity, we'll sort by a combination of usage and rating
                    sort = { 
                        'data.componentMetadata.usageCount': -1,
                        'data.componentMetadata.rating': -1,
                        updatedAt: -1
                    };
                    break;
                default:
                    sort = { updatedAt: -1 };
            }

            const { limit = 20, skip = 0 } = options;

            const [components, total] = await Promise.all([
                contentInstancesCollection
                    .find(query)
                    .sort(sort)
                    .limit(limit)
                    .skip(skip)
                    .toArray(),
                contentInstancesCollection.countDocuments(query)
            ]);

            return { 
                components: components as Component[], 
                total 
            };
        } catch (error) {
            console.error('Error getting components:', error);
            return { components: [], total: 0 };
        }
    }

    /**
     * Get component by ID with usage tracking
     */
    static async getComponentById(id: string): Promise<Component | null> {
        try {
            const component = await contentInstancesCollection.findOne({
                _id: new ObjectId(id),
                'data.isComponent': true
            });

            if (!component) return null;

            // Update usage tracking
            await this.updateComponentMetadata(id, {
                lastViewed: new Date()
            });

            return component as Component;
        } catch (error) {
            console.error('Error getting component by ID:', error);
            return null;
        }
    }

    /**
     * Create a new component with enhanced metadata
     */
    static async createComponent(
        data: Omit<ContentInstance, '_id' | 'createdAt' | 'updatedAt' | 'version'> & {
            componentMetadata?: Partial<Component['componentMetadata']>;
        },
        createdBy: string
    ): Promise<ObjectId | null> {
        try {
            // Ensure component-specific data structure
            const componentData = {
                ...data,
                data: {
                    ...data.data,
                    isComponent: true,
                    category: data.data?.category || 'content',
                    componentMetadata: {
                        category: data.data?.category || 'content',
                        tags: data.componentMetadata?.tags || [],
                        difficulty: data.componentMetadata?.difficulty || 'beginner',
                        compatibility: data.componentMetadata?.compatibility || [],
                        dependencies: data.componentMetadata?.dependencies || [],
                        usageCount: 0,
                        hasPreview: false,
                        downloads: 0,
                        maintainer: new ObjectId(createdBy),
                        reviewStatus: 'pending',
                        isBreakingChange: false,
                        ...data.componentMetadata
                    }
                },
                status: 'published' as const // Components are typically published
            };

            const componentId = await contentService.createContentInstance(componentData, createdBy);

            if (componentId) {
                // Create initial component version
                await this.createComponentVersion(
                    componentId.toString(),
                    componentData.data,
                    createdBy,
                    'Initial component version',
                    'minor',
                    false
                );

                // Initialize component category if it doesn't exist
                await this.ensureComponentCategory(componentData.data.category);
            }

            return componentId;
        } catch (error) {
            console.error('Error creating component:', error);
            return null;
        }
    }

    /**
     * Update component with versioning
     */
    static async updateComponent(
        id: string,
        updates: Partial<ContentInstance> & {
            componentMetadata?: Partial<Component['componentMetadata']>;
        },
        updatedBy: string,
        changeNote?: string,
        changeType: 'major' | 'minor' | 'patch' = 'minor',
        isBreakingChange: boolean = false
    ): Promise<boolean> {
        try {
            // Get current component
            const currentComponent = await this.getComponentById(id);
            if (!currentComponent) return false;

            // Merge component metadata
            const updatedData = {
                ...updates.data,
                componentMetadata: {
                    ...currentComponent.data.componentMetadata,
                    ...updates.componentMetadata,
                    isBreakingChange,
                    lastReviewed: new Date()
                }
            };

            const updateResult = await contentService.updateContentInstance(
                id,
                {
                    ...updates,
                    data: updatedData
                },
                updatedBy,
                changeNote
            );

            if (updateResult) {
                // Create component version
                await this.createComponentVersion(
                    id,
                    updatedData,
                    updatedBy,
                    changeNote || 'Component updated',
                    changeType,
                    isBreakingChange
                );

                // Update usage tracking if component structure changed
                if (isBreakingChange) {
                    await this.notifyComponentUsage(id, 'breaking_change');
                }
            }

            return updateResult;
        } catch (error) {
            console.error('Error updating component:', error);
            return false;
        }
    }

    /**
     * Delete component with usage validation
     */
    static async deleteComponent(id: string, deletedBy: string): Promise<boolean> {
        try {
            // Check if component is being used
            const usageCount = await this.componentUsageCollection.countDocuments({
                componentId: new ObjectId(id)
            });

            if (usageCount > 0) {
                throw new Error(`Cannot delete component: it is being used in ${usageCount} places`);
            }

            // Delete component versions
            await this.componentVersionsCollection.deleteMany({
                componentId: new ObjectId(id)
            });

            // Delete component previews
            await this.componentPreviewsCollection.deleteMany({
                componentId: new ObjectId(id)
            });

            // Delete the component
            return await contentService.deleteContentInstance(id, deletedBy);
        } catch (error) {
            console.error('Error deleting component:', error);
            return false;
        }
    }

    /**
     * Track component usage
     */
    static async trackComponentUsage(
        componentId: string,
        usedInId: string,
        usedInType: 'page' | 'component' | 'template',
        usedInTitle: string,
        usedInSlug: string,
        fieldName?: string,
        position?: number
    ): Promise<boolean> {
        try {
            const usage: Omit<ComponentUsage, '_id'> = {
                componentId: new ObjectId(componentId),
                usedInId: new ObjectId(usedInId),
                usedInType,
                usedInTitle,
                usedInSlug,
                fieldName,
                position,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Check if usage already exists
            const existingUsage = await this.componentUsageCollection.findOne({
                componentId: usage.componentId,
                usedInId: usage.usedInId,
                fieldName: usage.fieldName,
                position: usage.position
            });

            if (existingUsage) {
                // Update existing usage
                await this.componentUsageCollection.updateOne(
                    { _id: existingUsage._id },
                    { $set: { updatedAt: new Date() } }
                );
            } else {
                // Create new usage record
                await this.componentUsageCollection.insertOne(usage as ComponentUsage);
                
                // Increment usage count
                await this.updateComponentMetadata(componentId, {
                    usageCount: { $inc: 1 },
                    lastUsed: new Date()
                });
            }

            return true;
        } catch (error) {
            console.error('Error tracking component usage:', error);
            return false;
        }
    }

    /**
     * Remove component usage tracking
     */
    static async removeComponentUsage(
        componentId: string,
        usedInId: string,
        fieldName?: string,
        position?: number
    ): Promise<boolean> {
        try {
            const query: any = {
                componentId: new ObjectId(componentId),
                usedInId: new ObjectId(usedInId)
            };

            if (fieldName) query.fieldName = fieldName;
            if (position !== undefined) query.position = position;

            const result = await this.componentUsageCollection.deleteOne(query);

            if (result.deletedCount > 0) {
                // Decrement usage count
                await this.updateComponentMetadata(componentId, {
                    usageCount: { $inc: -1 }
                });
            }

            return result.deletedCount > 0;
        } catch (error) {
            console.error('Error removing component usage:', error);
            return false;
        }
    }

    /**
     * Get component usage information
     */
    static async getComponentUsage(componentId: string): Promise<ComponentUsage[]> {
        try {
            return await this.componentUsageCollection
                .find({ componentId: new ObjectId(componentId) })
                .sort({ updatedAt: -1 })
                .toArray();
        } catch (error) {
            console.error('Error getting component usage:', error);
            return [];
        }
    }

    /**
     * Create component version
     */
    static async createComponentVersion(
        componentId: string,
        data: Record<string, any>,
        author: string,
        changeNote: string,
        changeType: 'major' | 'minor' | 'patch',
        isBreakingChange: boolean,
        migrationNotes?: string
    ): Promise<ObjectId | null> {
        try {
            // Get current version number
            const latestVersion = await this.componentVersionsCollection
                .findOne(
                    { componentId: new ObjectId(componentId) },
                    { sort: { version: -1 } }
                );

            const version = latestVersion ? latestVersion.version + 1 : 1;

            const componentVersion: Omit<ComponentVersion, '_id'> = {
                componentId: new ObjectId(componentId),
                version,
                data,
                author: new ObjectId(author),
                changeNote,
                changeType,
                isBreakingChange,
                migrationNotes,
                createdAt: new Date()
            };

            const result = await this.componentVersionsCollection.insertOne(componentVersion as ComponentVersion);
            return result.insertedId;
        } catch (error) {
            console.error('Error creating component version:', error);
            return null;
        }
    }

    /**
     * Get component versions
     */
    static async getComponentVersions(componentId: string, limit: number = 10): Promise<ComponentVersion[]> {
        try {
            return await this.componentVersionsCollection
                .find({ componentId: new ObjectId(componentId) })
                .sort({ version: -1 })
                .limit(limit)
                .toArray();
        } catch (error) {
            console.error('Error getting component versions:', error);
            return [];
        }
    }

    /**
     * Restore component to specific version
     */
    static async restoreComponentVersion(
        componentId: string,
        version: number,
        restoredBy: string
    ): Promise<boolean> {
        try {
            const componentVersion = await this.componentVersionsCollection.findOne({
                componentId: new ObjectId(componentId),
                version
            });

            if (!componentVersion) {
                throw new Error('Component version not found');
            }

            return await this.updateComponent(
                componentId,
                { data: componentVersion.data },
                restoredBy,
                `Restored to version ${version}`,
                'patch',
                false
            );
        } catch (error) {
            console.error('Error restoring component version:', error);
            return false;
        }
    }

    /**
     * Get component categories
     */
    static async getComponentCategories(): Promise<ComponentCategory[]> {
        try {
            return await this.componentCategoriesCollection
                .find({})
                .sort({ order: 1, name: 1 })
                .toArray();
        } catch (error) {
            console.error('Error getting component categories:', error);
            return [];
        }
    }

    /**
     * Create component category
     */
    static async createComponentCategory(
        data: Omit<ComponentCategory, '_id' | 'createdAt' | 'updatedAt'>
    ): Promise<ObjectId | null> {
        try {
            const category: Omit<ComponentCategory, '_id'> = {
                ...data,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const result = await this.componentCategoriesCollection.insertOne(category as ComponentCategory);
            return result.insertedId;
        } catch (error) {
            console.error('Error creating component category:', error);
            return null;
        }
    }

    /**
     * Ensure component category exists
     */
    static async ensureComponentCategory(categorySlug: string): Promise<void> {
        try {
            const existingCategory = await this.componentCategoriesCollection.findOne({
                slug: categorySlug
            });

            if (!existingCategory) {
                // Create default category
                await this.createComponentCategory({
                    name: categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1),
                    slug: categorySlug,
                    description: `Components in the ${categorySlug} category`,
                    order: 999,
                    isSystemCategory: false
                });
            }
        } catch (error) {
            console.error('Error ensuring component category:', error);
        }
    }

    /**
     * Generate component preview
     */
    static async generateComponentPreview(
        componentId: string,
        previewType: 'screenshot' | 'html' | 'json',
        previewData: string,
        viewport: { width: number; height: number; device?: string }
    ): Promise<ObjectId | null> {
        try {
            // Deactivate existing previews
            await this.componentPreviewsCollection.updateMany(
                { componentId: new ObjectId(componentId), previewType },
                { $set: { isActive: false } }
            );

            const preview: Omit<ComponentPreview, '_id'> = {
                componentId: new ObjectId(componentId),
                previewType,
                previewData,
                viewport,
                generatedAt: new Date(),
                isActive: true
            };

            const result = await this.componentPreviewsCollection.insertOne(preview as ComponentPreview);

            // Update component metadata
            await this.updateComponentMetadata(componentId, {
                hasPreview: true,
                previewUrl: previewType === 'screenshot' ? previewData : undefined
            });

            return result.insertedId;
        } catch (error) {
            console.error('Error generating component preview:', error);
            return null;
        }
    }

    /**
     * Get component preview
     */
    static async getComponentPreview(
        componentId: string,
        previewType: 'screenshot' | 'html' | 'json'
    ): Promise<ComponentPreview | null> {
        try {
            return await this.componentPreviewsCollection.findOne({
                componentId: new ObjectId(componentId),
                previewType,
                isActive: true
            });
        } catch (error) {
            console.error('Error getting component preview:', error);
            return null;
        }
    }

    /**
     * Update component metadata
     */
    private static async updateComponentMetadata(
        componentId: string,
        metadata: Record<string, any>
    ): Promise<boolean> {
        try {
            const updateFields: Record<string, any> = {};
            
            for (const [key, value] of Object.entries(metadata)) {
                updateFields[`data.componentMetadata.${key}`] = value;
            }

            const result = await contentInstancesCollection.updateOne(
                { _id: new ObjectId(componentId) },
                { $set: updateFields }
            );

            return result.modifiedCount > 0;
        } catch (error) {
            console.error('Error updating component metadata:', error);
            return false;
        }
    }

    /**
     * Notify about component usage changes
     */
    private static async notifyComponentUsage(
        componentId: string,
        eventType: 'breaking_change' | 'deprecated' | 'updated'
    ): Promise<void> {
        try {
            // Get all usage instances
            const usages = await this.getComponentUsage(componentId);
            
            // Here you could implement notifications to maintainers
            // of content that uses this component
            console.log(`Component ${componentId} ${eventType} affects ${usages.length} instances`);
            
            // TODO: Implement actual notification system
            // - Email notifications
            // - In-app notifications
            // - Slack/Discord webhooks
        } catch (error) {
            console.error('Error notifying component usage:', error);
        }
    }

    /**
     * Get component statistics
     */
    static async getComponentStatistics(): Promise<{
        totalComponents: number;
        componentsByCategory: Record<string, number>;
        componentsByDifficulty: Record<string, number>;
        componentsByReviewStatus: Record<string, number>;
        mostUsedComponents: Array<{ id: string; title: string; usageCount: number }>;
        recentComponents: Array<{ id: string; title: string; createdAt: Date }>;
    }> {
        try {
            const [
                totalComponents,
                componentsByCategory,
                componentsByDifficulty,
                componentsByReviewStatus,
                mostUsedComponents,
                recentComponents
            ] = await Promise.all([
                // Total components
                contentInstancesCollection.countDocuments({ 'data.isComponent': true }),
                
                // Components by category
                contentInstancesCollection.aggregate([
                    { $match: { 'data.isComponent': true } },
                    { $group: { _id: '$data.category', count: { $sum: 1 } } }
                ]).toArray(),
                
                // Components by difficulty
                contentInstancesCollection.aggregate([
                    { $match: { 'data.isComponent': true } },
                    { $group: { _id: '$data.componentMetadata.difficulty', count: { $sum: 1 } } }
                ]).toArray(),
                
                // Components by review status
                contentInstancesCollection.aggregate([
                    { $match: { 'data.isComponent': true } },
                    { $group: { _id: '$data.componentMetadata.reviewStatus', count: { $sum: 1 } } }
                ]).toArray(),
                
                // Most used components
                contentInstancesCollection.find(
                    { 'data.isComponent': true },
                    { projection: { title: 1, 'data.componentMetadata.usageCount': 1 } }
                )
                .sort({ 'data.componentMetadata.usageCount': -1 })
                .limit(10)
                .toArray(),
                
                // Recent components
                contentInstancesCollection.find(
                    { 'data.isComponent': true },
                    { projection: { title: 1, createdAt: 1 } }
                )
                .sort({ createdAt: -1 })
                .limit(10)
                .toArray()
            ]);

            return {
                totalComponents,
                componentsByCategory: Object.fromEntries(
                    componentsByCategory.map(item => [item._id || 'uncategorized', item.count])
                ),
                componentsByDifficulty: Object.fromEntries(
                    componentsByDifficulty.map(item => [item._id || 'beginner', item.count])
                ),
                componentsByReviewStatus: Object.fromEntries(
                    componentsByReviewStatus.map(item => [item._id || 'pending', item.count])
                ),
                mostUsedComponents: mostUsedComponents.map(comp => ({
                    id: comp._id.toString(),
                    title: comp.title,
                    usageCount: comp.data?.componentMetadata?.usageCount || 0
                })),
                recentComponents: recentComponents.map(comp => ({
                    id: comp._id.toString(),
                    title: comp.title,
                    createdAt: comp.createdAt
                }))
            };
        } catch (error) {
            console.error('Error getting component statistics:', error);
            return {
                totalComponents: 0,
                componentsByCategory: {},
                componentsByDifficulty: {},
                componentsByReviewStatus: {},
                mostUsedComponents: [],
                recentComponents: []
            };
        }
    }

    /**
     * Search components with advanced filters
     */
    static async searchComponents(
        query: string,
        filters: {
            categories?: string[];
            tags?: string[];
            difficulty?: string[];
            reviewStatus?: string[];
        } = {},
        options: {
            limit?: number;
            skip?: number;
        } = {}
    ): Promise<{ components: Component[]; total: number }> {
        try {
            const searchQuery: any = {
                'data.isComponent': true,
                $text: { $search: query }
            };

            // Apply filters
            if (filters.categories && filters.categories.length > 0) {
                searchQuery['data.category'] = { $in: filters.categories };
            }
            if (filters.tags && filters.tags.length > 0) {
                searchQuery['data.componentMetadata.tags'] = { $in: filters.tags };
            }
            if (filters.difficulty && filters.difficulty.length > 0) {
                searchQuery['data.componentMetadata.difficulty'] = { $in: filters.difficulty };
            }
            if (filters.reviewStatus && filters.reviewStatus.length > 0) {
                searchQuery['data.componentMetadata.reviewStatus'] = { $in: filters.reviewStatus };
            }

            const { limit = 20, skip = 0 } = options;

            const [components, total] = await Promise.all([
                contentInstancesCollection
                    .find(searchQuery)
                    .sort({ score: { $meta: 'textScore' } })
                    .limit(limit)
                    .skip(skip)
                    .toArray(),
                contentInstancesCollection.countDocuments(searchQuery)
            ]);

            return { 
                components: components as Component[], 
                total 
            };
        } catch (error) {
            console.error('Error searching components:', error);
            return { components: [], total: 0 };
        }
    }
}

// Export singleton instance
export const componentService = ComponentManagementService;