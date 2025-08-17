import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { ContentManagementService } from '$lib/services/content';
import { 
  contentTypesCollection, 
  contentInstancesCollection, 
  contentVersionsCollection 
} from '$lib/db/collections';
import type { ContentType, ContentInstance, ContentVersion } from '$lib/db/models';

// Mock the database collections
vi.mock('$lib/db/collections', () => ({
  contentTypesCollection: {
    findOne: vi.fn(),
    insertOne: vi.fn(),
    updateOne: vi.fn(),
    deleteOne: vi.fn(),
    find: vi.fn(() => ({
      sort: vi.fn(() => ({
        toArray: vi.fn()
      }))
    })),
    countDocuments: vi.fn()
  },
  contentInstancesCollection: {
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
  contentVersionsCollection: {
    insertOne: vi.fn(),
    find: vi.fn(() => ({
      sort: vi.fn(() => ({
        limit: vi.fn(() => ({
          toArray: vi.fn()
        }))
      }))
    })),
    findOne: vi.fn(),
    deleteMany: vi.fn()
  }
}));

describe('ContentManagementService', () => {
  const mockUserId = new ObjectId().toString();
  const mockContentTypeId = new ObjectId();
  const mockContentInstanceId = new ObjectId();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Content Type Management', () => {
    const mockContentType: Omit<ContentType, '_id' | 'createdAt' | 'updatedAt'> = {
      name: 'Blog Post',
      slug: 'blog-post',
      description: 'A blog post content type',
      fields: [
        {
          _id: new ObjectId(),
          name: 'title',
          label: 'Title',
          type: 'text',
          required: true,
          order: 1
        },
        {
          _id: new ObjectId(),
          name: 'content',
          label: 'Content',
          type: 'richtext',
          required: true,
          order: 2
        }
      ],
      isSystemType: false
    };

    it('should create a new content type', async () => {
      const insertedId = new ObjectId();
      
      vi.mocked(contentTypesCollection.findOne).mockResolvedValue(null);
      vi.mocked(contentTypesCollection.insertOne).mockResolvedValue({
        insertedId,
        acknowledged: true
      });

      const result = await ContentManagementService.createContentType(
        mockContentType,
        mockUserId
      );

      expect(result).toEqual(insertedId);
      expect(contentTypesCollection.findOne).toHaveBeenCalledWith({ 
        slug: mockContentType.slug 
      });
      expect(contentTypesCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockContentType,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date)
        })
      );
    });

    it('should not create content type with duplicate slug', async () => {
      vi.mocked(contentTypesCollection.findOne).mockResolvedValue({
        _id: new ObjectId(),
        ...mockContentType,
        createdAt: new Date(),
        updatedAt: new Date()
      } as ContentType);

      const result = await ContentManagementService.createContentType(
        mockContentType,
        mockUserId
      );

      expect(result).toBeNull();
      expect(contentTypesCollection.insertOne).not.toHaveBeenCalled();
    });

    it('should get all content types', async () => {
      const mockContentTypes = [
        { _id: new ObjectId(), name: 'Blog Post', slug: 'blog-post' },
        { _id: new ObjectId(), name: 'Page', slug: 'page' }
      ] as ContentType[];

      const mockFind = {
        sort: vi.fn(() => ({
          toArray: vi.fn().mockResolvedValue(mockContentTypes)
        }))
      };
      vi.mocked(contentTypesCollection.find).mockReturnValue(mockFind as any);

      const result = await ContentManagementService.getContentTypes();

      expect(result).toEqual(mockContentTypes);
      expect(contentTypesCollection.find).toHaveBeenCalledWith({});
      expect(mockFind.sort).toHaveBeenCalledWith({ name: 1 });
    });
  });

  describe('Content Instance Management', () => {
    const mockContentInstance: Omit<ContentInstance, '_id' | 'createdAt' | 'updatedAt' | 'version'> = {
      contentTypeId: mockContentTypeId,
      slug: 'my-first-post',
      title: 'My First Post',
      data: {
        title: 'My First Post',
        content: 'This is the content of my first post.'
      },
      status: 'draft',
      author: new ObjectId(mockUserId),
      lastModifiedBy: new ObjectId(mockUserId),
      seo: {
        title: 'My First Post',
        description: 'This is my first post'
      }
    };

    const mockContentType: ContentType = {
      _id: mockContentTypeId,
      name: 'Blog Post',
      slug: 'blog-post',
      fields: [
        {
          _id: new ObjectId(),
          name: 'title',
          label: 'Title',
          type: 'text',
          required: true,
          order: 1
        },
        {
          _id: new ObjectId(),
          name: 'content',
          label: 'Content',
          type: 'richtext',
          required: true,
          order: 2
        }
      ],
      isSystemType: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should create a new content instance', async () => {
      const insertedId = new ObjectId();
      
      vi.mocked(contentTypesCollection.findOne).mockResolvedValue(mockContentType);
      vi.mocked(contentInstancesCollection.findOne).mockResolvedValue(null);
      vi.mocked(contentInstancesCollection.insertOne).mockResolvedValue({
        insertedId,
        acknowledged: true
      });
      vi.mocked(contentVersionsCollection.insertOne).mockResolvedValue({
        insertedId: new ObjectId(),
        acknowledged: true
      });

      const result = await ContentManagementService.createContentInstance(
        mockContentInstance,
        mockUserId
      );

      expect(result).toEqual(insertedId);
      expect(contentTypesCollection.findOne).toHaveBeenCalledWith({ 
        _id: mockContentTypeId 
      });
      expect(contentInstancesCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockContentInstance,
          version: 1,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date)
        })
      );
    });

    it('should get content instance by slug (published only)', async () => {
      const publishedInstance: ContentInstance = {
        _id: mockContentInstanceId,
        ...mockContentInstance,
        status: 'published',
        publishedAt: new Date(),
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.mocked(contentInstancesCollection.findOne).mockResolvedValue(publishedInstance);

      const result = await ContentManagementService.getContentInstanceBySlug('my-first-post');

      expect(result).toEqual(publishedInstance);
      expect(contentInstancesCollection.findOne).toHaveBeenCalledWith({
        slug: 'my-first-post',
        status: 'published',
        $or: [
          { publishedAt: { $lte: expect.any(Date) } },
          { publishedAt: { $exists: false } }
        ]
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      vi.mocked(contentTypesCollection.find).mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const result = await ContentManagementService.getContentTypes();

      expect(result).toEqual([]);
    });

    it('should handle invalid ObjectId', async () => {
      const result = await ContentManagementService.getContentTypeById('invalid-id');

      expect(result).toBeNull();
      expect(contentTypesCollection.findOne).not.toHaveBeenCalled();
    });
  });
});