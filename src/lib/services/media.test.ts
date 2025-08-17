import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import sharp from 'sharp';
import { MediaManagementService } from '$lib/services/media';
import { 
  mediaFilesCollection, 
  mediaFoldersCollection 
} from '$lib/db/collections';
import type { MediaFile, MediaFolder } from '$lib/db/models';

// Mock Sharp
vi.mock('sharp', () => {
  const mockSharp = vi.fn(() => ({
    metadata: vi.fn().mockResolvedValue({
      width: 1920,
      height: 1080,
      format: 'jpeg',
      hasAlpha: false
    }),
    resize: vi.fn().mockReturnThis(),
    jpeg: vi.fn().mockReturnThis(),
    webp: vi.fn().mockReturnThis(),
    raw: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue({
      data: Buffer.from('processed-image-data'),
      info: { width: 800, height: 600 }
    })
  }));
  return { default: mockSharp };
});

// Mock the database collections
vi.mock('$lib/db/collections', () => ({
  mediaFilesCollection: {
    findOne: vi.fn(),
    insertOne: vi.fn(),
    updateOne: vi.fn(),
    deleteOne: vi.fn(),
    find: vi.fn(() => ({
      sort: vi.fn(() => ({
        limit: vi.fn(() => ({
          skip: vi.fn(() => ({
            toArray: vi.fn()
          }))
        }))
      }))
    })),
    countDocuments: vi.fn()
  },
  mediaFoldersCollection: {
    findOne: vi.fn(),
    insertOne: vi.fn(),
    updateOne: vi.fn(),
    updateMany: vi.fn(),
    deleteOne: vi.fn(),
    find: vi.fn(() => ({
      sort: vi.fn(() => ({
        toArray: vi.fn()
      }))
    })),
    countDocuments: vi.fn()
  }
}));

describe('MediaManagementService', () => {
  const mockUserId = new ObjectId().toString();
  const mockFolderId = new ObjectId();
  const mockFileId = new ObjectId();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Image Processing', () => {
    it('should process an image with Sharp', async () => {
      const mockBuffer = Buffer.from('test-image-data');
      const filename = 'test-image.jpg';

      const result = await MediaManagementService.processImage(mockBuffer, filename);

      expect(result).toHaveProperty('original');
      expect(result).toHaveProperty('variants');
      expect(result).toHaveProperty('metadata');
      expect(result.original).toHaveProperty('buffer');
      expect(result.original).toHaveProperty('width');
      expect(result.original).toHaveProperty('height');
      expect(result.variants).toBeInstanceOf(Array);
      expect(sharp).toHaveBeenCalledWith(mockBuffer);
    });

    it('should process image without variants when disabled', async () => {
      const mockBuffer = Buffer.from('test-image-data');
      const filename = 'test-image.jpg';

      const result = await MediaManagementService.processImage(
        mockBuffer, 
        filename, 
        { generateVariants: false }
      );

      expect(result.variants).toHaveLength(0);
    });
  });

  describe('File Validation', () => {
    it('should validate allowed file types', () => {
      const validFile = {
        name: 'test.jpg',
        size: 1024 * 1024, // 1MB
        type: 'image/jpeg'
      };

      const result = MediaManagementService.validateFile(validFile, ['image/*']);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject files that are too large', () => {
      const largeFile = {
        name: 'large.jpg',
        size: 50 * 1024 * 1024, // 50MB (exceeds image limit)
        type: 'image/jpeg'
      };

      const result = MediaManagementService.validateFile(largeFile, ['image/*']);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('File size exceeds maximum');
    });

    it('should reject disallowed file types', () => {
      const invalidFile = {
        name: 'test.exe',
        size: 1024,
        type: 'application/x-executable'
      };

      const result = MediaManagementService.validateFile(invalidFile, ['image/*']);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('File type');
      expect(result.error).toContain('is not allowed');
    });
  });

  describe('Folder Management', () => {
    it('should create a new folder', async () => {
      const insertedId = new ObjectId();
      
      vi.mocked(mediaFoldersCollection.findOne).mockResolvedValue(null);
      vi.mocked(mediaFoldersCollection.insertOne).mockResolvedValue({
        insertedId,
        acknowledged: true
      });

      const result = await MediaManagementService.createFolder(
        'Test Folder',
        null,
        mockUserId
      );

      expect(result).toEqual(insertedId);
      expect(mediaFoldersCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Folder',
          path: '/Test Folder',
          createdBy: new ObjectId(mockUserId),
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date)
        })
      );
    });

    it('should not create folder with duplicate name in same parent', async () => {
      vi.mocked(mediaFoldersCollection.findOne).mockResolvedValue({
        _id: new ObjectId(),
        name: 'Test Folder'
      } as MediaFolder);

      const result = await MediaManagementService.createFolder(
        'Test Folder',
        null,
        mockUserId
      );

      expect(result).toBeNull();
      expect(mediaFoldersCollection.insertOne).not.toHaveBeenCalled();
    });

    it('should get folders in a directory', async () => {
      const mockFolders = [
        { _id: new ObjectId(), name: 'Folder 1', path: '/folder-1' },
        { _id: new ObjectId(), name: 'Folder 2', path: '/folder-2' }
      ] as MediaFolder[];

      const mockFind = {
        sort: vi.fn(() => ({
          toArray: vi.fn().mockResolvedValue(mockFolders)
        }))
      };
      vi.mocked(mediaFoldersCollection.find).mockReturnValue(mockFind as any);

      const result = await MediaManagementService.getFolders();

      expect(result).toEqual(mockFolders);
      expect(mediaFoldersCollection.find).toHaveBeenCalledWith({
        parentId: { $exists: false }
      });
    });
  });

  describe('Media File Management', () => {
    const mockMediaFile: Omit<MediaFile, '_id' | 'createdAt' | 'updatedAt'> = {
      filename: 'test-image.jpg',
      originalName: 'Test Image.jpg',
      mimeType: 'image/jpeg',
      size: 1024 * 1024,
      width: 1920,
      height: 1080,
      s3Key: 'media/test-image.jpg',
      s3Url: 'https://cdn.example.com/media/test-image.jpg',
      variants: [],
      metadata: {},
      tags: ['test'],
      uploadedBy: new ObjectId(mockUserId)
    };

    it('should create a media file record', async () => {
      const insertedId = new ObjectId();
      
      vi.mocked(mediaFilesCollection.insertOne).mockResolvedValue({
        insertedId,
        acknowledged: true
      });

      const result = await MediaManagementService.createMediaFile(
        mockMediaFile,
        mockUserId
      );

      expect(result).toEqual(insertedId);
      expect(mediaFilesCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockMediaFile,
          uploadedBy: new ObjectId(mockUserId),
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date)
        })
      );
    });

    it('should get media files with filtering', async () => {
      const mockFiles = [mockMediaFile] as MediaFile[];
      const mockFind = {
        sort: vi.fn(() => ({
          limit: vi.fn(() => ({
            skip: vi.fn(() => ({
              toArray: vi.fn().mockResolvedValue(mockFiles)
            }))
          }))
        }))
      };

      vi.mocked(mediaFilesCollection.find).mockReturnValue(mockFind as any);
      vi.mocked(mediaFilesCollection.countDocuments).mockResolvedValue(1);

      const result = await MediaManagementService.getMediaFiles(
        { mimeType: 'image/' },
        { limit: 10, skip: 0 }
      );

      expect(result.files).toEqual(mockFiles);
      expect(result.total).toBe(1);
      expect(mediaFilesCollection.find).toHaveBeenCalledWith({
        folderId: { $exists: false },
        mimeType: { $regex: 'image/', $options: 'i' }
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      vi.mocked(mediaFoldersCollection.find).mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const result = await MediaManagementService.getFolders();

      expect(result).toEqual([]);
    });

    it('should handle invalid ObjectId', async () => {
      const result = await MediaManagementService.getMediaFileById('invalid-id');

      expect(result).toBeNull();
      expect(mediaFilesCollection.findOne).not.toHaveBeenCalled();
    });
  });
});