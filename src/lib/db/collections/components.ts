import { ObjectId } from 'mongodb';
import dbClient from '../dbClient.js';
import type { 
    ComponentUsage, 
    ComponentVersion, 
    ComponentCategory,
    ComponentPreview,
    ComponentTemplate
} from '../models/component.js';

// ============================================================================
// Component Usage Collection
// ============================================================================

export class ComponentUsageCollection {
    private static collection = dbClient.collection<ComponentUsage>('componentUsage');

    /**
     * Track component usage
     */
    static async trackUsage(usage: Omit<ComponentUsage, '_id'>): Promise<ComponentUsage> {
        const result = await this.collection.insertOne(usage as ComponentUsage);
        return { _id: result.insertedId, ...usage };
    }

    /**
     * Remove usage tracking
     */
    static async removeUsage(componentId: ObjectId, usedInId: ObjectId): Promise<boolean> {
        const result = await this.collection.deleteOne({
            componentId,
            usedInId
        });
        return result.deletedCount > 0;
    }

    /**
     * Get component usage
     */
    static async getUsage(componentId: ObjectId): Promise<ComponentUsage[]> {
        return await this.collection
            .find({ componentId })
            .sort({ updatedAt: -1 })
            .toArray();
    }

    /**
     * Get usage count for component
     */
    static async getUsageCount(componentId: ObjectId): Promise<number> {
        return await this.collection.countDocuments({ componentId });
    }

    /**
     * Find where component is used
     */
    static async findUsages(componentId: ObjectId): Promise<ComponentUsage[]> {
        return await this.collection
            .find({ componentId })
            .toArray();
    }
}

// ============================================================================
// Component Versions Collection
// ============================================================================

export class ComponentVersionsCollection {
    private static collection = dbClient.collection<ComponentVersion>('componentVersions');

    /**
     * Create component version
     */
    static async create(version: Omit<ComponentVersion, '_id'>): Promise<ComponentVersion> {
        const result = await this.collection.insertOne(version as ComponentVersion);
        return { _id: result.insertedId, ...version };
    }

    /**
     * Get component versions
     */
    static async getVersions(componentId: ObjectId, limit: number = 10): Promise<ComponentVersion[]> {
        return await this.collection
            .find({ componentId })
            .sort({ version: -1 })
            .limit(limit)
            .toArray();
    }

    /**
     * Get specific version
     */
    static async getVersion(componentId: ObjectId, version: number): Promise<ComponentVersion | null> {
        return await this.collection.findOne({ componentId, version });
    }

    /**
     * Get latest version
     */
    static async getLatestVersion(componentId: ObjectId): Promise<ComponentVersion | null> {
        return await this.collection
            .findOne({ componentId }, { sort: { version: -1 } });
    }

    /**
     * Delete component versions
     */
    static async deleteVersions(componentId: ObjectId): Promise<boolean> {
        const result = await this.collection.deleteMany({ componentId });
        return result.deletedCount > 0;
    }
}

// ============================================================================
// Component Categories Collection
// ============================================================================

export class ComponentCategoriesCollection {
    private static collection = dbClient.collection<ComponentCategory>('componentCategories');

    /**
     * Get all categories
     */
    static async findAll(): Promise<ComponentCategory[]> {
        return await this.collection
            .find({})
            .sort({ order: 1, name: 1 })
            .toArray();
    }

    /**
     * Get category by slug
     */
    static async findBySlug(slug: string): Promise<ComponentCategory | null> {
        return await this.collection.findOne({ slug });
    }

    /**
     * Create category
     */
    static async create(category: Omit<ComponentCategory, '_id'>): Promise<ComponentCategory> {
        const result = await this.collection.insertOne(category as ComponentCategory);
        return { _id: result.insertedId, ...category };
    }

    /**
     * Update category
     */
    static async update(id: ObjectId, updates: Partial<ComponentCategory>): Promise<ComponentCategory | null> {
        const result = await this.collection.findOneAndUpdate(
            { _id: id },
            { $set: { ...updates, updatedAt: new Date() } },
            { returnDocument: 'after' }
        );
        return result;
    }

    /**
     * Delete category
     */
    static async delete(id: ObjectId): Promise<boolean> {
        const result = await this.collection.deleteOne({ _id: id });
        return result.deletedCount > 0;
    }

    /**
     * Get categories hierarchy
     */
    static async getHierarchy(): Promise<ComponentCategory[]> {
        const categories = await this.findAll();
        return this.buildHierarchy(categories);
    }

    /**
     * Build category hierarchy
     */
    private static buildHierarchy(categories: ComponentCategory[]): ComponentCategory[] {
        const categoryMap = new Map<string, ComponentCategory & { children?: ComponentCategory[] }>();
        const rootCategories: ComponentCategory[] = [];

        // Create map of all categories
        categories.forEach(category => {
            categoryMap.set(category._id.toString(), { ...category, children: [] });
        });

        // Build hierarchy
        categories.forEach(category => {
            const categoryWithChildren = categoryMap.get(category._id.toString())!;
            
            if (category.parentId) {
                const parent = categoryMap.get(category.parentId.toString());
                if (parent) {
                    parent.children!.push(categoryWithChildren);
                } else {
                    rootCategories.push(categoryWithChildren);
                }
            } else {
                rootCategories.push(categoryWithChildren);
            }
        });

        return rootCategories;
    }
}

// ============================================================================
// Component Previews Collection
// ============================================================================

export class ComponentPreviewsCollection {
    private static collection = dbClient.collection<ComponentPreview>('componentPreviews');

    /**
     * Create preview
     */
    static async create(preview: Omit<ComponentPreview, '_id'>): Promise<ComponentPreview> {
        // Deactivate existing previews of same type
        await this.collection.updateMany(
            { 
                componentId: preview.componentId, 
                previewType: preview.previewType 
            },
            { $set: { isActive: false } }
        );

        const result = await this.collection.insertOne(preview as ComponentPreview);
        return { _id: result.insertedId, ...preview };
    }

    /**
     * Get active preview
     */
    static async getActivePreview(
        componentId: ObjectId, 
        previewType: ComponentPreview['previewType']
    ): Promise<ComponentPreview | null> {
        return await this.collection.findOne({
            componentId,
            previewType,
            isActive: true
        });
    }

    /**
     * Get all previews for component
     */
    static async getPreviews(componentId: ObjectId): Promise<ComponentPreview[]> {
        return await this.collection
            .find({ componentId })
            .sort({ generatedAt: -1 })
            .toArray();
    }

    /**
     * Delete previews
     */
    static async deletePreviews(componentId: ObjectId): Promise<boolean> {
        const result = await this.collection.deleteMany({ componentId });
        return result.deletedCount > 0;
    }
}

// ============================================================================
// Component Templates Collection
// ============================================================================

export class ComponentTemplatesCollection {
    private static collection = dbClient.collection<ComponentTemplate>('componentTemplates');

    /**
     * Get all templates
     */
    static async findAll(): Promise<ComponentTemplate[]> {
        return await this.collection
            .find({})
            .sort({ name: 1 })
            .toArray();
    }

    /**
     * Get templates by category
     */
    static async findByCategory(category: string): Promise<ComponentTemplate[]> {
        return await this.collection
            .find({ category })
            .sort({ name: 1 })
            .toArray();
    }

    /**
     * Get template by ID
     */
    static async findById(id: ObjectId): Promise<ComponentTemplate | null> {
        return await this.collection.findOne({ _id: id });
    }

    /**
     * Create template
     */
    static async create(template: Omit<ComponentTemplate, '_id'>): Promise<ComponentTemplate> {
        const result = await this.collection.insertOne(template as ComponentTemplate);
        return { _id: result.insertedId, ...template };
    }

    /**
     * Update template
     */
    static async update(id: ObjectId, updates: Partial<ComponentTemplate>): Promise<ComponentTemplate | null> {
        const result = await this.collection.findOneAndUpdate(
            { _id: id },
            { $set: { ...updates, updatedAt: new Date() } },
            { returnDocument: 'after' }
        );
        return result;
    }

    /**
     * Delete template
     */
    static async delete(id: ObjectId): Promise<boolean> {
        const result = await this.collection.deleteOne({ _id: id });
        return result.deletedCount > 0;
    }

    /**
     * Get system templates
     */
    static async getSystemTemplates(): Promise<ComponentTemplate[]> {
        return await this.collection
            .find({ isSystemTemplate: true })
            .sort({ name: 1 })
            .toArray();
    }

    /**
     * Get user templates
     */
    static async getUserTemplates(createdBy: ObjectId): Promise<ComponentTemplate[]> {
        return await this.collection
            .find({ 
                isSystemTemplate: false,
                createdBy 
            })
            .sort({ createdAt: -1 })
            .toArray();
    }
}

// ============================================================================
// Initialize Component Collections
// ============================================================================

export async function initializeComponentCollections(): Promise<void> {
    try {
        // Create indexes for component usage
        await ComponentUsageCollection['collection'].createIndexes([
            { key: { componentId: 1 } },
            { key: { usedInId: 1 } },
            { key: { componentId: 1, usedInId: 1 }, unique: true },
            { key: { updatedAt: -1 } }
        ]);

        // Create indexes for component versions
        await ComponentVersionsCollection['collection'].createIndexes([
            { key: { componentId: 1 } },
            { key: { componentId: 1, version: -1 }, unique: true },
            { key: { createdAt: -1 } }
        ]);

        // Create indexes for component categories
        await ComponentCategoriesCollection['collection'].createIndexes([
            { key: { slug: 1 }, unique: true },
            { key: { parentId: 1 } },
            { key: { order: 1 } }
        ]);

        // Create indexes for component previews
        await ComponentPreviewsCollection['collection'].createIndexes([
            { key: { componentId: 1 } },
            { key: { componentId: 1, previewType: 1 } },
            { key: { isActive: 1 } },
            { key: { generatedAt: -1 } }
        ]);

        // Create indexes for component templates
        await ComponentTemplatesCollection['collection'].createIndexes([
            { key: { category: 1 } },
            { key: { isSystemTemplate: 1 } },
            { key: { createdBy: 1 } },
            { key: { name: 1 } }
        ]);

        console.log('Component collections initialized successfully');
    } catch (error) {
        console.error('Error initializing component collections:', error);
        throw error;
    }
}