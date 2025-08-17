import { ObjectId } from 'mongodb';
import sharp from 'sharp';
import { 
  mediaFilesCollection, 
  mediaFoldersCollection 
} from '$lib/db/collections';
import type { 
  MediaFile, 
  MediaFolder, 
  MediaVariant, 
  MediaMetadata 
} from '$lib/db/models';
import { 
  isValidObjectId, 
  formatFileSize, 
  buildFolderPath,
  DEFAULT_IMAGE_VARIANTS,
  MEDIA_TYPES
} from '$lib/db/models';

// ============================================================================
// Media Management Service with Sharp Integration
// ============================================================================

interface ProcessedImage {
  original: {
    buffer: Buffer;
    width: number;
    height: number;
    format: string;
    size: number;
  };
  variants: Array<{
    name: string;
    buffer: Buffer;
    width: number;
    height: number;
    format: string;
    quality: number;
    size: number;
  }>;
  metadata: MediaMetadata;
}

export class MediaManagementService {
  /**
   * Process an image file using Sharp
   */
  static async processImage(
    buffer: Buffer, 
    filename: string,
    options: {
      generateVariants?: boolean;
      customVariants?: Array<{ name: string; width: number; height?: number; quality?: number }>;
    } = {}
  ): Promise<ProcessedImage> {
    try {
      const { generateVariants = true, customVariants } = options;
      
      // Get image metadata
      const image = sharp(buffer);
      const metadata = await image.metadata();
      
      if (!metadata.width || !metadata.height) {
        throw new Error('Invalid image: unable to determine dimensions');
      }

      // Process original image (optimize without resizing)
      const optimizedOriginal = await image
        .jpeg({ quality: 95, mozjpeg: true })
        .toBuffer();

      const processed: ProcessedImage = {
        original: {
          buffer: optimizedOriginal,
          width: metadata.width,
          height: metadata.height,
          format: 'jpeg',
          size: optimizedOriginal.length
        },
        variants: [],
        metadata: {
          exif: metadata.exif ? this.parseExifData(metadata.exif) : undefined,
          colorProfile: metadata.icc ? 'embedded' : undefined,
          hasTransparency: metadata.hasAlpha || false,
          averageColor: await this.extractAverageColor(image),
          dominantColors: await this.extractDominantColors(image)
        }
      };

      // Generate variants if requested
      if (generateVariants) {
        const variants = customVariants || DEFAULT_IMAGE_VARIANTS;
        
        for (const variant of variants) {
          try {
            const variantBuffer = await this.createImageVariant(
              buffer,
              variant.name,
              variant.width,
              variant.height,
              variant.quality || 90
            );
            
            processed.variants.push(variantBuffer);
          } catch (error) {
            console.warn(`Failed to create variant ${variant.name}:`, error);
          }
        }

        // Create WebP variants for better compression
        try {
          const webpVariant = await this.createWebPVariant(buffer, 'webp', {
            width: Math.min(metadata.width, 1920),
            quality: 85
          });
          processed.variants.push(webpVariant);
        } catch (error) {
          console.warn('Failed to create WebP variant:', error);
        }
      }

      return processed;
    } catch (error) {
      console.error('Error processing image:', error);
      throw error;
    }
  }

  /**
   * Create an image variant with specific dimensions
   */
  private static async createImageVariant(
    buffer: Buffer,
    name: string,
    width: number,
    height?: number,
    quality: number = 90
  ): Promise<{
    name: string;
    buffer: Buffer;
    width: number;
    height: number;
    format: string;
    quality: number;
    size: number;
  }> {
    const processed = await sharp(buffer)
      .resize(width, height, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer({ resolveWithObject: true });

    return {
      name,
      buffer: processed.data,
      width: processed.info.width,
      height: processed.info.height,
      format: 'jpeg',
      quality,
      size: processed.data.length
    };
  }

  /**
   * Create a WebP variant for better compression
   */
  private static async createWebPVariant(
    buffer: Buffer,
    name: string,
    options: { width: number; quality: number }
  ): Promise<{
    name: string;
    buffer: Buffer;
    width: number;
    height: number;
    format: string;
    quality: number;
    size: number;
  }> {
    const processed = await sharp(buffer)
      .resize(options.width, null, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .webp({ quality: options.quality })
      .toBuffer({ resolveWithObject: true });

    return {
      name,
      buffer: processed.data,
      width: processed.info.width,
      height: processed.info.height,
      format: 'webp',
      quality: options.quality,
      size: processed.data.length
    };
  }

  /**
   * Extract average color from image
   */
  private static async extractAverageColor(image: sharp.Sharp): Promise<string> {
    try {
      const { dominant } = await image
        .resize(1, 1)
        .raw()
        .toBuffer({ resolveWithObject: true });
      
      const [r, g, b] = Array.from(dominant);
      return `rgb(${r}, ${g}, ${b})`;
    } catch (error) {
      return 'rgb(128, 128, 128)'; // Default gray
    }
  }

  /**
   * Extract dominant colors from image
   */
  private static async extractDominantColors(image: sharp.Sharp): Promise<string[]> {
    try {
      // This is a simplified implementation
      // In production, you might want to use a more sophisticated color extraction library
      const colors = ['#000000', '#ffffff']; // Placeholder
      return colors;
    } catch (error) {
      return ['#000000', '#ffffff'];
    }
  }

  /**
   * Parse EXIF data
   */
  private static parseExifData(exif: Buffer): Record<string, any> {
    try {
      // This is a simplified implementation
      // In production, you might want to use a library like 'exif-parser'
      return {
        parsed: true,
        size: exif.length
      };
    } catch (error) {
      return {};
    }
  }

  /**
   * Validate file type and size
   */
  static validateFile(
    file: { name: string; size: number; type: string },
    allowedTypes: string[] = ['image/*']
  ): { isValid: boolean; error?: string } {
    // Check file size
    const maxSize = this.getMaxSizeForType(file.type);
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `File size exceeds maximum allowed size of ${formatFileSize(maxSize)}`
      };
    }

    // Check file type
    const isAllowed = allowedTypes.some(allowedType => {
      if (allowedType.endsWith('/*')) {
        const category = allowedType.replace('/*', '');
        return file.type.startsWith(category + '/');
      }
      return file.type === allowedType;
    });

    if (!isAllowed) {
      return {
        isValid: false,
        error: `File type '${file.type}' is not allowed`
      };
    }

    return { isValid: true };
  }

  /**
   * Get maximum file size for a given type
   */
  private static getMaxSizeForType(mimeType: string): number {
    if (mimeType.startsWith('image/')) {
      return MEDIA_TYPES.image.maxSize;
    } else if (mimeType.startsWith('video/')) {
      return MEDIA_TYPES.video.maxSize;
    } else if (mimeType.startsWith('audio/')) {
      return MEDIA_TYPES.audio.maxSize;
    } else if (mimeType === 'application/pdf') {
      return MEDIA_TYPES.document.maxSize;
    }
    return 10 * 1024 * 1024; // 10MB default
  }

  /**
   * Create a media folder
   */
  static async createFolder(
    name: string,
    parentId: string | null,
    createdBy: string
  ): Promise<ObjectId | null> {
    try {
      // Validate parent folder if provided
      let parentFolder: MediaFolder | null = null;
      if (parentId) {
        if (!isValidObjectId(parentId)) {
          throw new Error('Invalid parent folder ID');
        }
        parentFolder = await mediaFoldersCollection.findOne({ _id: new ObjectId(parentId) });
        if (!parentFolder) {
          throw new Error('Parent folder not found');
        }
      }

      // Check for duplicate folder names in the same parent
      const existingFolder = await mediaFoldersCollection.findOne({
        name,
        parentId: parentId ? new ObjectId(parentId) : null
      });

      if (existingFolder) {
        throw new Error('Folder with this name already exists in the parent directory');
      }

      // Build folder path
      const path = parentFolder 
        ? `${parentFolder.path}/${name}`
        : `/${name}`;

      const folder: Omit<MediaFolder, '_id'> = {
        name,
        parentId: parentId ? new ObjectId(parentId) : undefined,
        path,
        description: undefined,
        createdBy: new ObjectId(createdBy),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await mediaFoldersCollection.insertOne(folder as MediaFolder);
      return result.insertedId;
    } catch (error) {
      console.error('Error creating media folder:', error);
      return null;
    }
  }

  /**
   * Update a media folder
   */
  static async updateFolder(
    id: string,
    updates: { name?: string; description?: string },
    updatedBy: string
  ): Promise<boolean> {
    try {
      if (!isValidObjectId(id)) {
        throw new Error('Invalid folder ID');
      }

      const objectId = new ObjectId(id);
      const folder = await mediaFoldersCollection.findOne({ _id: objectId });
      
      if (!folder) {
        throw new Error('Folder not found');
      }

      // If updating name, check for duplicates and update path
      if (updates.name && updates.name !== folder.name) {
        const existingFolder = await mediaFoldersCollection.findOne({
          name: updates.name,
          parentId: folder.parentId || null,
          _id: { $ne: objectId }
        });

        if (existingFolder) {
          throw new Error('Folder with this name already exists in the parent directory');
        }

        // Update path for this folder and all subfolders
        const oldPath = folder.path;
        const newPath = folder.parentId 
          ? folder.path.replace(`/${folder.name}`, `/${updates.name}`)
          : `/${updates.name}`;

        // Update all subfolders' paths
        await mediaFoldersCollection.updateMany(
          { path: { $regex: `^${oldPath}/` } },
          { $set: { path: { $regex: [`^${oldPath}/`, `${newPath}/`] } } }
        );

        updates = { ...updates, path: newPath } as any;
      }

      const result = await mediaFoldersCollection.updateOne(
        { _id: objectId },
        { 
          $set: { 
            ...updates, 
            updatedAt: new Date() 
          } 
        }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error updating media folder:', error);
      return false;
    }
  }

  /**
   * Delete a media folder (only if empty)
   */
  static async deleteFolder(id: string, deletedBy: string): Promise<boolean> {
    try {
      if (!isValidObjectId(id)) {
        throw new Error('Invalid folder ID');
      }

      const objectId = new ObjectId(id);

      // Check if folder has any files
      const fileCount = await mediaFilesCollection.countDocuments({ folderId: objectId });
      if (fileCount > 0) {
        throw new Error('Cannot delete folder containing files');
      }

      // Check if folder has any subfolders
      const subfolderCount = await mediaFoldersCollection.countDocuments({ parentId: objectId });
      if (subfolderCount > 0) {
        throw new Error('Cannot delete folder containing subfolders');
      }

      const result = await mediaFoldersCollection.deleteOne({ _id: objectId });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting media folder:', error);
      return false;
    }
  }

  /**
   * Get media folders
   */
  static async getFolders(parentId?: string): Promise<MediaFolder[]> {
    try {
      const query: any = {};
      
      if (parentId) {
        if (!isValidObjectId(parentId)) {
          return [];
        }
        query.parentId = new ObjectId(parentId);
      } else {
        query.parentId = { $exists: false };
      }

      return await mediaFoldersCollection
        .find(query)
        .sort({ name: 1 })
        .toArray();
    } catch (error) {
      console.error('Error getting media folders:', error);
      return [];
    }
  }

  /**
   * Get folder hierarchy
   */
  static async getFolderHierarchy(): Promise<MediaFolder[]> {
    try {
      const allFolders = await mediaFoldersCollection
        .find({})
        .sort({ path: 1 })
        .toArray();

      return allFolders;
    } catch (error) {
      console.error('Error getting folder hierarchy:', error);
      return [];
    }
  }

  /**
   * Create a media file record (without actual file upload)
   */
  static async createMediaFile(
    data: Omit<MediaFile, '_id' | 'createdAt' | 'updatedAt'>,
    uploadedBy: string
  ): Promise<ObjectId | null> {
    try {
      const mediaFile: Omit<MediaFile, '_id'> = {
        ...data,
        uploadedBy: new ObjectId(uploadedBy),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await mediaFilesCollection.insertOne(mediaFile as MediaFile);
      return result.insertedId;
    } catch (error) {
      console.error('Error creating media file record:', error);
      return null;
    }
  }

  /**
   * Update a media file
   */
  static async updateMediaFile(
    id: string,
    updates: Partial<Pick<MediaFile, 'filename' | 'altText' | 'caption' | 'tags' | 'folderId'>>,
    updatedBy: string
  ): Promise<boolean> {
    try {
      if (!isValidObjectId(id)) {
        throw new Error('Invalid media file ID');
      }

      const objectId = new ObjectId(id);

      // If moving to a different folder, validate the folder exists
      if (updates.folderId) {
        if (!isValidObjectId(updates.folderId)) {
          throw new Error('Invalid folder ID');
        }
        
        const folder = await mediaFoldersCollection.findOne({ 
          _id: new ObjectId(updates.folderId) 
        });
        if (!folder) {
          throw new Error('Target folder not found');
        }
      }

      const result = await mediaFilesCollection.updateOne(
        { _id: objectId },
        { 
          $set: { 
            ...updates, 
            updatedAt: new Date() 
          } 
        }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error updating media file:', error);
      return false;
    }
  }

  /**
   * Delete a media file
   */
  static async deleteMediaFile(id: string, deletedBy: string): Promise<boolean> {
    try {
      if (!isValidObjectId(id)) {
        throw new Error('Invalid media file ID');
      }

      const objectId = new ObjectId(id);
      const result = await mediaFilesCollection.deleteOne({ _id: objectId });
      
      // Note: In a real implementation, you would also delete the actual files from S3 here
      
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting media file:', error);
      return false;
    }
  }

  /**
   * Get media files with filtering and pagination
   */
  static async getMediaFiles(
    filters: {
      folderId?: string;
      mimeType?: string;
      search?: string;
      tags?: string[];
    } = {},
    options: {
      limit?: number;
      skip?: number;
      sortBy?: 'filename' | 'createdAt' | 'size';
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{ files: MediaFile[]; total: number }> {
    try {
      const query: any = {};

      if (filters.folderId) {
        if (isValidObjectId(filters.folderId)) {
          query.folderId = new ObjectId(filters.folderId);
        }
      } else {
        query.folderId = { $exists: false };
      }

      if (filters.mimeType) {
        query.mimeType = { $regex: filters.mimeType, $options: 'i' };
      }

      if (filters.search) {
        query.$text = { $search: filters.search };
      }

      if (filters.tags && filters.tags.length > 0) {
        query.tags = { $in: filters.tags };
      }

      const { limit = 20, skip = 0, sortBy = 'createdAt', sortOrder = 'desc' } = options;
      const sortDirection = sortOrder === 'asc' ? 1 : -1;

      const [files, total] = await Promise.all([
        mediaFilesCollection
          .find(query)
          .sort({ [sortBy]: sortDirection })
          .limit(limit)
          .skip(skip)
          .toArray(),
        mediaFilesCollection.countDocuments(query)
      ]);

      return { files, total };
    } catch (error) {
      console.error('Error getting media files:', error);
      return { files: [], total: 0 };
    }
  }

  /**
   * Get media file by ID
   */
  static async getMediaFileById(id: string): Promise<MediaFile | null> {
    try {
      if (!isValidObjectId(id)) {
        return null;
      }

      return await mediaFilesCollection.findOne({ _id: new ObjectId(id) });
    } catch (error) {
      console.error('Error getting media file by ID:', error);
      return null;
    }
  }

  /**
   * Get media statistics
   */
  static async getMediaStatistics(): Promise<{
    totalFiles: number;
    totalFolders: number;
    totalSize: number;
    filesByType: Record<string, number>;
  }> {
    try {
      const [totalFiles, totalFolders, files] = await Promise.all([
        mediaFilesCollection.countDocuments(),
        mediaFoldersCollection.countDocuments(),
        mediaFilesCollection.find({}, { projection: { size: 1, mimeType: 1 } }).toArray()
      ]);

      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      const filesByType = files.reduce((acc, file) => {
        const type = file.mimeType.split('/')[0];
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalFiles,
        totalFolders,
        totalSize,
        filesByType
      };
    } catch (error) {
      console.error('Error getting media statistics:', error);
      return {
        totalFiles: 0,
        totalFolders: 0,
        totalSize: 0,
        filesByType: {}
      };
    }
  }

  /**
   * Search media files
   */
  static async searchMediaFiles(
    query: string,
    options: {
      limit?: number;
      skip?: number;
      mimeType?: string;
      folderId?: string;
    } = {}
  ): Promise<{ files: MediaFile[]; total: number }> {
    try {
      const searchQuery: any = {
        $or: [
          { filename: { $regex: query, $options: 'i' } },
          { originalName: { $regex: query, $options: 'i' } },
          { altText: { $regex: query, $options: 'i' } },
          { caption: { $regex: query, $options: 'i' } },
          { tags: { $in: [new RegExp(query, 'i')] } }
        ]
      };

      if (options.mimeType) {
        searchQuery.mimeType = { $regex: options.mimeType, $options: 'i' };
      }

      if (options.folderId && isValidObjectId(options.folderId)) {
        searchQuery.folderId = new ObjectId(options.folderId);
      }

      const { limit = 20, skip = 0 } = options;

      const [files, total] = await Promise.all([
        mediaFilesCollection
          .find(searchQuery)
          .sort({ createdAt: -1 })
          .limit(limit)
          .skip(skip)
          .toArray(),
        mediaFilesCollection.countDocuments(searchQuery)
      ]);

      return { files, total };
    } catch (error) {
      console.error('Error searching media files:', error);
      return { files: [], total: 0 };
    }
  }
}

// Export singleton instance
export const mediaService = MediaManagementService;