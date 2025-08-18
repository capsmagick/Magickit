import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MediaFoldersCollection } from '$lib/db/collections/mediaFolders';
import { ObjectId } from 'mongodb';

export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    // Check authentication and permissions
    if (!locals.session?.user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract query parameters
    const parentId = url.searchParams.get('parentId');
    const search = url.searchParams.get('search');
    const sortBy = url.searchParams.get('sortBy') as 'name' | 'createdAt' | 'updatedAt' || 'name';
    const sortOrder = url.searchParams.get('sortOrder') as 'asc' | 'desc' || 'asc';
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const skip = parseInt(url.searchParams.get('skip') || '0');

    // Build filter options
    const filterOptions: any = {
      limit,
      skip,
      sortBy,
      sortOrder
    };

    // Handle parent folder filtering
    if (parentId) {
      if (parentId === 'null' || parentId === '') {
        filterOptions.parentId = null;
      } else {
        try {
          filterOptions.parentId = new ObjectId(parentId);
        } catch (error) {
          return json({ error: 'Invalid parent folder ID' }, { status: 400 });
        }
      }
    } else {
      filterOptions.parentId = null;
    }

    let result;

    // Handle search vs regular listing
    if (search && search.trim()) {
      result = await MediaFoldersCollection.search(search.trim(), {
        limit,
        skip
      });
    } else {
      result = await MediaFoldersCollection.findAll(filterOptions);
    }

    return json({
      folders: result.folders,
      total: result.total,
      page: Math.floor(skip / limit) + 1,
      totalPages: Math.ceil(result.total / limit)
    });

  } catch (error) {
    console.error('Error fetching media folders:', error);
    return json(
      { error: 'Failed to fetch media folders' },
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
    if (!data.name || typeof data.name !== 'string') {
      return json({ error: 'Folder name is required' }, { status: 400 });
    }

    // Validate folder name
    if (data.name.includes('/') || data.name.includes('\\')) {
      return json({ error: 'Folder name cannot contain slashes' }, { status: 400 });
    }

    // Create folder
    const folder = await MediaFoldersCollection.create({
      name: data.name.trim(),
      description: data.description?.trim(),
      parentId: data.parentId ? new ObjectId(data.parentId) : undefined,
      createdBy: new ObjectId(locals.session.user.id)
    });

    return json({ folder }, { status: 201 });

  } catch (error) {
    console.error('Error creating media folder:', error);
    return json(
      { error: error instanceof Error ? error.message : 'Failed to create media folder' },
      { status: 500 }
    );
  }
};