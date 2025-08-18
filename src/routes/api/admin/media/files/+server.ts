import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MediaFilesCollection } from '$lib/db/collections/mediaFiles';
import { ObjectId } from 'mongodb';
import type { MediaFile } from '$lib/db/models';

export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    // Check authentication and permissions
    if (!locals.session?.user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract query parameters
    const folderId = url.searchParams.get('folderId');
    const search = url.searchParams.get('search');
    const mimeType = url.searchParams.get('mimeType');
    const sortBy = url.searchParams.get('sortBy') as 'filename' | 'createdAt' | 'size' || 'createdAt';
    const sortOrder = url.searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc';
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const skip = parseInt(url.searchParams.get('skip') || '0');

    // Build filter options
    const filterOptions: any = {
      limit,
      skip,
      sortBy,
      sortOrder
    };

    // Handle folder filtering
    if (folderId) {
      if (folderId === 'null' || folderId === '') {
        filterOptions.folderId = null;
      } else {
        try {
          filterOptions.folderId = new ObjectId(folderId);
        } catch (error) {
          return json({ error: 'Invalid folder ID' }, { status: 400 });
        }
      }
    } else {
      filterOptions.folderId = null;
    }

    // Handle MIME type filtering
    if (mimeType && mimeType !== 'all') {
      filterOptions.mimeType = mimeType;
    }

    let result;

    // Handle search vs regular listing
    if (search && search.trim()) {
      result = await MediaFilesCollection.search(search.trim(), {
        folderId: filterOptions.folderId,
        mimeType: filterOptions.mimeType,
        limit,
        skip
      });
    } else {
      result = await MediaFilesCollection.findAll(filterOptions);
    }

    return json({
      files: result.files,
      total: result.total,
      page: Math.floor(skip / limit) + 1,
      totalPages: Math.ceil(result.total / limit)
    });

  } catch (error) {
    console.error('Error fetching media files:', error);
    return json(
      { error: 'Failed to fetch media files' },
      { status: 500 }
    );
  }
};

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Check authentication and permissions
    if (!locals.session?.user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    
    // Validate required fields
    if (!data.filename || !data.originalName || !data.mimeType || !data.size || !data.s3Key || !data.s3Url) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create media file record - convert string IDs to ObjectIds for database operations
    const createData = {
      filename: data.filename,
      originalName: data.originalName,
      mimeType: data.mimeType,
      size: data.size,
      width: data.width,
      height: data.height,
      folderId: data.folderId ? new ObjectId(data.folderId) : undefined,
      s3Key: data.s3Key,
      s3Url: data.s3Url,
      variants: (data.variants || []).map((variant: any) => ({
        ...variant,
        _id: variant._id ? new ObjectId(variant._id) : new ObjectId()
      })),
      metadata: data.metadata || {},
      altText: data.altText,
      caption: data.caption,
      tags: data.tags || [],
      uploadedBy: new ObjectId(locals.session.user.id)
    };

    const mediaFile = await MediaFilesCollection.create(createData as any);

    return json({ mediaFile }, { status: 201 });

  } catch (error) {
    console.error('Error creating media file:', error);
    return json(
      { error: error instanceof Error ? error.message : 'Failed to create media file' },
      { status: 500 }
    );
  }
};