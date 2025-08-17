import { ObjectId } from 'mongodb';
import dbClient from '../dbClient.js';
import type { MediaFolder } from '../models.js';

const COLLECTION_NAME = 'mediaFolders';

/**
 * Media Folders Collection Handler
 * Provides CRUD operations for media folders with proper error handling
 */
export class MediaFoldersCollection {
    /**
     * Get all media folders with optional filtering and pagination
     */
    static async findAll(options: {
        parentId?: ObjectId | null;
        createdBy?: ObjectId;
        limit?: number;
        skip?: number;
        sortBy?: 'name' | 'createdAt' | 'updatedAt';
        sortOrder?: 'asc' | 'desc';
    } = {}) {
        try {
            const collection = dbClient.collection<MediaFolder>(COLLECTION_NAME);

            // Build filter
            const filter: any = {};
            if (options.parentId !== undefined) {
                filter.parentId = options.parentId;
            }
            if (options.createdBy) filter.createdBy = options.createdBy;

            // Build sort
            const sort: any = {};
            const sortField = options.sortBy || 'name';
            const sortDirection = options.sortOrder === 'asc' ? 1 : -1;
            sort[sortField] = sortDirection;

            const cursor = collection
                .find(filter)
                .sort(sort);

            if (options.skip) cursor.skip(options.skip);
            if (options.limit) cursor.limit(options.limit);

            const folders = await cursor.toArray();
            const total = await collection.countDocuments(filter);

            return { folders, total };
        } catch (error) {
            console.error('Error fetching media folders:', error);
            throw new Error('Failed to fetch media folders');
        }
    }

    /**
     * Get a single media folder by ID
     */
    static async findById(id: string | ObjectId) {
        try {
            const collection = dbClient.collection<MediaFolder>(COLLECTION_NAME);

            const objectId = typeof id === 'string' ? new ObjectId(id) : id;
            const folder = await collection.findOne({ _id: objectId });

            return folder;
        } catch (error) {
            console.error('Error fetching media folder:', error);
            throw new Error('Failed to fetch media folder');
        }
    }

    /**
     * Get a single media folder by path
     */
    static async findByPath(path: string) {
        try {
            const collection = dbClient.collection<MediaFolder>(COLLECTION_NAME);

            const folder = await collection.findOne({ path });
            return folder;
        } catch (error) {
            console.error('Error fetching media folder by path:', error);
            throw new Error('Failed to fetch media folder');
        }
    }

    /**
     * Create a new media folder
     */
    static async create(folderData: Omit<MediaFolder, '_id' | 'createdAt' | 'updatedAt' | 'path'>) {
        try {
            const collection = dbClient.collection<MediaFolder>(COLLECTION_NAME);

            // Generate path based on parent
            let path = folderData.name;
            if (folderData.parentId) {
                const parentFolder = await this.findById(folderData.parentId);
                if (!parentFolder) {
                    throw new Error('Parent folder not found');
                }
                path = `${parentFolder.path}/${folderData.name}`;
            }

            // Check if path already exists
            const existingFolder = await collection.findOne({ path });
            if (existingFolder) {
                throw new Error('A folder with this path already exists');
            }

            const now = new Date();
            const newFolder: MediaFolder = {
                _id: new ObjectId(),
                ...folderData,
                path,
                createdAt: now,
                updatedAt: now
            };

            const result = await collection.insertOne(newFolder);
            
            if (!result.acknowledged) {
                throw new Error('Failed to create media folder');
            }

            return newFolder;
        } catch (error) {
            console.error('Error creating media folder:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to create media folder');
        }
    }

    /**
     * Update an existing media folder
     */
    static async update(id: string | ObjectId, updateData: Partial<Omit<MediaFolder, '_id' | 'createdAt' | 'path'>>) {
        try {
            const collection = dbClient.collection<MediaFolder>(COLLECTION_NAME);

            const objectId = typeof id === 'string' ? new ObjectId(id) : id;

            // Get current folder
            const currentFolder = await this.findById(objectId);
            if (!currentFolder) {
                throw new Error('Media folder not found');
            }

            // If updating name or parent, recalculate path
            let newPath = currentFolder.path;
            if (updateData.name || updateData.parentId !== undefined) {
                const name = updateData.name || currentFolder.name;
                
                if (updateData.parentId !== undefined) {
                    if (updateData.parentId) {
                        const parentFolder = await this.findById(updateData.parentId);
                        if (!parentFolder) {
                            throw new Error('Parent folder not found');
                        }
                        newPath = `${parentFolder.path}/${name}`;
                    } else {
                        newPath = name;
                    }
                } else if (updateData.name) {
                    const pathParts = currentFolder.path.split('/');
                    pathParts[pathParts.length - 1] = name;
                    newPath = pathParts.join('/');
                }

                // Check if new path already exists
                if (newPath !== currentFolder.path) {
                    const existingFolder = await collection.findOne({ path: newPath });
                    if (existingFolder) {
                        throw new Error('A folder with this path already exists');
                    }
                }
            }

            const result = await collection.updateOne(
                { _id: objectId },
                { 
                    $set: { 
                        ...updateData,
                        path: newPath,
                        updatedAt: new Date() 
                    } 
                }
            );

            if (result.matchedCount === 0) {
                throw new Error('Media folder not found');
            }

            // Update paths of all child folders if path changed
            if (newPath !== currentFolder.path) {
                await this.updateChildPaths(currentFolder.path, newPath);
            }

            return await this.findById(objectId);
        } catch (error) {
            console.error('Error updating media folder:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to update media folder');
        }
    }

    /**
     * Delete a media folder
     */
    static async delete(id: string | ObjectId) {
        try {
            const collection = dbClient.collection<MediaFolder>(COLLECTION_NAME);
            const mediaFilesCollection = dbClient.collection('mediaFiles');

            const objectId = typeof id === 'string' ? new ObjectId(id) : id;

            // Get folder to check for children
            const folder = await this.findById(objectId);
            if (!folder) {
                throw new Error('Media folder not found');
            }

            // Check for child folders
            const childFolders = await collection.countDocuments({ parentId: objectId });
            if (childFolders > 0) {
                throw new Error('Cannot delete folder: it contains subfolders');
            }

            // Check for media files
            const mediaFiles = await mediaFilesCollection.countDocuments({ folderId: objectId });
            if (mediaFiles > 0) {
                throw new Error('Cannot delete folder: it contains media files');
            }

            const result = await collection.deleteOne({ _id: objectId });

            if (result.deletedCount === 0) {
                throw new Error('Media folder not found');
            }

            return true;
        } catch (error) {
            console.error('Error deleting media folder:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to delete media folder');
        }
    }

    /**
     * Get folder hierarchy (breadcrumb path)
     */
    static async getFolderHierarchy(id: string | ObjectId): Promise<MediaFolder[]> {
        try {
            const collection = dbClient.collection<MediaFolder>(COLLECTION_NAME);
            const objectId = typeof id === 'string' ? new ObjectId(id) : id;

            const hierarchy: MediaFolder[] = [];
            let currentFolder = await this.findById(objectId);

            while (currentFolder) {
                hierarchy.unshift(currentFolder);
                if (currentFolder.parentId) {
                    currentFolder = await this.findById(currentFolder.parentId);
                } else {
                    break;
                }
            }

            return hierarchy;
        } catch (error) {
            console.error('Error getting folder hierarchy:', error);
            throw new Error('Failed to get folder hierarchy');
        }
    }

    /**
     * Get root folders (folders without parent)
     */
    static async getRootFolders() {
        return this.findAll({ parentId: null });
    }

    /**
     * Get child folders of a specific folder
     */
    static async getChildFolders(parentId: ObjectId | null) {
        return this.findAll({ parentId });
    }

    /**
     * Search media folders
     */
    static async search(query: string, options: {
        limit?: number;
        skip?: number;
    } = {}) {
        try {
            const collection = dbClient.collection<MediaFolder>(COLLECTION_NAME);

            const filter: any = {
                $or: [
                    { name: { $regex: query, $options: 'i' } },
                    { description: { $regex: query, $options: 'i' } },
                    { path: { $regex: query, $options: 'i' } }
                ]
            };

            const cursor = collection
                .find(filter)
                .sort({ name: 1 });

            if (options.skip) cursor.skip(options.skip);
            if (options.limit) cursor.limit(options.limit);

            const folders = await cursor.toArray();
            const total = await collection.countDocuments(filter);

            return { folders, total };
        } catch (error) {
            console.error('Error searching media folders:', error);
            throw new Error('Failed to search media folders');
        }
    }

    /**
     * Update child folder paths when parent path changes
     */
    private static async updateChildPaths(oldParentPath: string, newParentPath: string) {
        try {
            const collection = dbClient.collection<MediaFolder>(COLLECTION_NAME);

            // Find all folders that start with the old parent path
            const childFolders = await collection.find({
                path: { $regex: `^${oldParentPath}/` }
            }).toArray();

            // Update each child folder's path
            for (const childFolder of childFolders) {
                const newChildPath = childFolder.path.replace(oldParentPath, newParentPath);
                await collection.updateOne(
                    { _id: childFolder._id },
                    { $set: { path: newChildPath, updatedAt: new Date() } }
                );
            }
        } catch (error) {
            console.error('Error updating child paths:', error);
            throw new Error('Failed to update child paths');
        }
    }
}