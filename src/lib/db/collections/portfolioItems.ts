import { ObjectId } from 'mongodb';
import dbClient from '../dbClient.js';
import type { PortfolioItem } from '../models.js';

const COLLECTION_NAME = 'portfolioItems';

/**
 * Portfolio Items Collection Handler
 * Provides CRUD operations for portfolio items with proper error handling
 */
export class PortfolioItemsCollection {
    /**
     * Get all portfolio items with optional filtering and pagination
     */
    static async findAll(options: {
        featured?: boolean;
        category?: string;
        technologies?: string[];
        limit?: number;
        skip?: number;
        sortBy?: 'createdAt' | 'title';
        sortOrder?: 'asc' | 'desc';
    } = {}) {
        try {
            const collection = dbClient.collection<PortfolioItem>(COLLECTION_NAME);

            // Build filter
            const filter: any = {};
            if (options.featured !== undefined) filter.featured = options.featured;
            if (options.category) filter.category = options.category;
            if (options.technologies && options.technologies.length > 0) {
                filter.technologies = { $in: options.technologies };
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

            const items = await cursor.toArray();
            const total = await collection.countDocuments(filter);

            return { items, total };
        } catch (error) {
            console.error('Error fetching portfolio items:', error);
            throw new Error('Failed to fetch portfolio items');
        }
    }

    /**
     * Get a single portfolio item by ID
     */
    static async findById(id: string | ObjectId) {
        try {
            const collection = dbClient.collection<PortfolioItem>(COLLECTION_NAME);

            const objectId = typeof id === 'string' ? new ObjectId(id) : id;
            const item = await collection.findOne({ _id: objectId });

            return item;
        } catch (error) {
            console.error('Error fetching portfolio item:', error);
            throw new Error('Failed to fetch portfolio item');
        }
    }

    /**
     * Create a new portfolio item
     */
    static async create(itemData: Omit<PortfolioItem, '_id' | 'createdAt' | 'updatedAt'>) {
        try {
            const collection = dbClient.collection<PortfolioItem>(COLLECTION_NAME);

            const now = new Date();
            const newItem: PortfolioItem = {
                _id: new ObjectId(),
                ...itemData,
                createdAt: now,
                updatedAt: now
            };

            const result = await collection.insertOne(newItem);
            
            if (!result.acknowledged) {
                throw new Error('Failed to create portfolio item');
            }

            return newItem;
        } catch (error) {
            console.error('Error creating portfolio item:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to create portfolio item');
        }
    }

    /**
     * Update an existing portfolio item
     */
    static async update(id: string | ObjectId, updateData: Partial<Omit<PortfolioItem, '_id' | 'createdAt'>>) {
        try {
            const collection = dbClient.collection<PortfolioItem>(COLLECTION_NAME);

            const objectId = typeof id === 'string' ? new ObjectId(id) : id;

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
                throw new Error('Portfolio item not found');
            }

            return await this.findById(objectId);
        } catch (error) {
            console.error('Error updating portfolio item:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to update portfolio item');
        }
    }

    /**
     * Delete a portfolio item
     */
    static async delete(id: string | ObjectId) {
        try {
            const collection = dbClient.collection<PortfolioItem>(COLLECTION_NAME);

            const objectId = typeof id === 'string' ? new ObjectId(id) : id;
            const result = await collection.deleteOne({ _id: objectId });

            if (result.deletedCount === 0) {
                throw new Error('Portfolio item not found');
            }

            return true;
        } catch (error) {
            console.error('Error deleting portfolio item:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to delete portfolio item');
        }
    }

    /**
     * Get all unique categories
     */
    static async getCategories() {
        try {
            const collection = dbClient.collection<PortfolioItem>(COLLECTION_NAME);
            const categories = await collection.distinct('category');
            return categories.sort();
        } catch (error) {
            console.error('Error fetching categories:', error);
            throw new Error('Failed to fetch categories');
        }
    }

    /**
     * Get all unique technologies
     */
    static async getTechnologies() {
        try {
            const collection = dbClient.collection<PortfolioItem>(COLLECTION_NAME);
            const technologies = await collection.distinct('technologies');
            return technologies.sort();
        } catch (error) {
            console.error('Error fetching technologies:', error);
            throw new Error('Failed to fetch technologies');
        }
    }

    /**
     * Search portfolio items
     */
    static async search(query: string, options: {
        limit?: number;
        skip?: number;
    } = {}) {
        try {
            const collection = dbClient.collection<PortfolioItem>(COLLECTION_NAME);

            const filter: any = {
                $or: [
                    { title: { $regex: query, $options: 'i' } },
                    { description: { $regex: query, $options: 'i' } },
                    { technologies: { $regex: query, $options: 'i' } },
                    { category: { $regex: query, $options: 'i' } }
                ]
            };

            const cursor = collection
                .find(filter)
                .sort({ createdAt: -1 });

            if (options.skip) cursor.skip(options.skip);
            if (options.limit) cursor.limit(options.limit);

            const items = await cursor.toArray();
            const total = await collection.countDocuments(filter);

            return { items, total };
        } catch (error) {
            console.error('Error searching portfolio items:', error);
            throw new Error('Failed to search portfolio items');
        }
    }
}