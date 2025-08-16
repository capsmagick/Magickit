import { ObjectId } from 'mongodb';
import dbClient from '../dbClient.js';
import type { BlogPost } from '../models.js';

const COLLECTION_NAME = 'blogPosts';

/**
 * Blog Posts Collection Handler
 * Provides CRUD operations for blog posts with proper error handling
 */
export class BlogPostsCollection {
    /**
     * Get all blog posts with optional filtering and pagination
     */
    static async findAll(options: {
        status?: BlogPost['status'];
        featured?: boolean;
        author?: ObjectId;
        limit?: number;
        skip?: number;
        sortBy?: 'createdAt' | 'publishedAt' | 'title';
        sortOrder?: 'asc' | 'desc';
    } = {}) {
        try {
            const collection = dbClient.collection<BlogPost>(COLLECTION_NAME);

            // Build filter
            const filter: any = {};
            if (options.status) filter.status = options.status;
            if (options.featured !== undefined) filter.featured = options.featured;
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

            const posts = await cursor.toArray();
            const total = await collection.countDocuments(filter);

            return { posts, total };
        } catch (error) {
            console.error('Error fetching blog posts:', error);
            throw new Error('Failed to fetch blog posts');
        }
    }

    /**
     * Get a single blog post by ID
     */
    static async findById(id: string | ObjectId) {
        try {
            const collection = dbClient.collection<BlogPost>(COLLECTION_NAME);

            const objectId = typeof id === 'string' ? new ObjectId(id) : id;
            const post = await collection.findOne({ _id: objectId });

            return post;
        } catch (error) {
            console.error('Error fetching blog post:', error);
            throw new Error('Failed to fetch blog post');
        }
    }

    /**
     * Get a single blog post by slug
     */
    static async findBySlug(slug: string) {
        try {
            const collection = dbClient.collection<BlogPost>(COLLECTION_NAME);

            const post = await collection.findOne({ slug });
            return post;
        } catch (error) {
            console.error('Error fetching blog post by slug:', error);
            throw new Error('Failed to fetch blog post');
        }
    }

    /**
     * Create a new blog post
     */
    static async create(postData: Omit<BlogPost, '_id' | 'createdAt' | 'updatedAt'>) {
        try {
            const collection = dbClient.collection<BlogPost>(COLLECTION_NAME);

            // Check if slug already exists
            const existingPost = await collection.findOne({ slug: postData.slug });
            if (existingPost) {
                throw new Error('A post with this slug already exists');
            }

            const now = new Date();
            const newPost: BlogPost = {
                _id: new ObjectId(),
                ...postData,
                createdAt: now,
                updatedAt: now
            };

            const result = await collection.insertOne(newPost);
            
            if (!result.acknowledged) {
                throw new Error('Failed to create blog post');
            }

            return newPost;
        } catch (error) {
            console.error('Error creating blog post:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to create blog post');
        }
    }

    /**
     * Update an existing blog post
     */
    static async update(id: string | ObjectId, updateData: Partial<Omit<BlogPost, '_id' | 'createdAt'>>) {
        try {
            const collection = dbClient.collection<BlogPost>(COLLECTION_NAME);

            const objectId = typeof id === 'string' ? new ObjectId(id) : id;

            // If updating slug, check for conflicts
            if (updateData.slug) {
                const existingPost = await collection.findOne({ 
                    slug: updateData.slug, 
                    _id: { $ne: objectId } 
                });
                if (existingPost) {
                    throw new Error('A post with this slug already exists');
                }
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
                throw new Error('Blog post not found');
            }

            return await this.findById(objectId);
        } catch (error) {
            console.error('Error updating blog post:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to update blog post');
        }
    }

    /**
     * Delete a blog post
     */
    static async delete(id: string | ObjectId) {
        try {
            const collection = dbClient.collection<BlogPost>(COLLECTION_NAME);

            const objectId = typeof id === 'string' ? new ObjectId(id) : id;
            const result = await collection.deleteOne({ _id: objectId });

            if (result.deletedCount === 0) {
                throw new Error('Blog post not found');
            }

            return true;
        } catch (error) {
            console.error('Error deleting blog post:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to delete blog post');
        }
    }

    /**
     * Generate a unique slug from title
     */
    static async generateSlug(title: string, excludeId?: ObjectId): Promise<string> {
        try {
            const collection = dbClient.collection<BlogPost>(COLLECTION_NAME);

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

                const existingPost = await collection.findOne(filter);
                if (!existingPost) {
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
     * Get published posts for public display
     */
    static async getPublishedPosts(options: {
        featured?: boolean;
        limit?: number;
        skip?: number;
        tags?: string[];
    } = {}) {
        const filter: any = { status: 'published' };
        if (options.featured !== undefined) filter.featured = options.featured;
        if (options.tags && options.tags.length > 0) {
            filter.tags = { $in: options.tags };
        }

        return this.findAll({
            ...options,
            status: 'published',
            sortBy: 'publishedAt',
            sortOrder: 'desc'
        });
    }

    /**
     * Search blog posts
     */
    static async search(query: string, options: {
        status?: BlogPost['status'];
        limit?: number;
        skip?: number;
    } = {}) {
        try {
            const collection = dbClient.collection<BlogPost>(COLLECTION_NAME);

            const filter: any = {
                $or: [
                    { title: { $regex: query, $options: 'i' } },
                    { excerpt: { $regex: query, $options: 'i' } },
                    { content: { $regex: query, $options: 'i' } },
                    { tags: { $regex: query, $options: 'i' } }
                ]
            };

            if (options.status) {
                filter.status = options.status;
            }

            const cursor = collection
                .find(filter)
                .sort({ createdAt: -1 });

            if (options.skip) cursor.skip(options.skip);
            if (options.limit) cursor.limit(options.limit);

            const posts = await cursor.toArray();
            const total = await collection.countDocuments(filter);

            return { posts, total };
        } catch (error) {
            console.error('Error searching blog posts:', error);
            throw new Error('Failed to search blog posts');
        }
    }
}