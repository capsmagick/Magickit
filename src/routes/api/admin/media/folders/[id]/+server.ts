import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MediaFoldersCollection } from '$lib/db/collections/mediaFolders';
import { ObjectId } from 'mongodb';

export const GET: RequestHandler = async ({ params, locals }) => {
  try {
    // Check authentication and permissions
    if (!locals.session?.user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    if (!id) {
      return json({ error: 'Folder ID is required' }, { status: 400 });
    }

    try {
      const objectId = new ObjectId(id);
      const folder = await MediaFoldersCollection.findById(objectId);

      if (!folder) {
        return json({ error: 'Folder not found' }, { status: 404 });
      }

      return json({ folder });

    } catch (error) {
      return json({ error: 'Invalid folder ID' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error fetching media folder:', error);
    return json(
      { error: 'Failed to fetch media folder' },
      { status: 500 }
    );
  }
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
  try {
    // Check authentication and permissions
    if (!locals.session?.user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    if (!id) {
      return json({ error: 'Folder ID is required' }, { status: 400 });
    }

    const data = await request.json();

    try {
      const objectId = new ObjectId(id);
      
      // Build update data (only allow certain fields to be updated)
      const updateData: any = {};
      
      if (data.name !== undefined) {
        if (!data.name || typeof data.name !== 'string') {
          return json({ error: 'Folder name is required' }, { status: 400 });
        }
        if (data.name.includes('/') || data.name.includes('\\')) {
          return json({ error: 'Folder name cannot contain slashes' }, { status: 400 });
        }
        updateData.name = data.name.trim();
      }
      
      if (data.description !== undefined) {
        updateData.description = data.description?.trim();
      }
      
      if (data.parentId !== undefined) {
        updateData.parentId = data.parentId ? new ObjectId(data.parentId) : undefined;
      }

      const updatedFolder = await MediaFoldersCollection.update(objectId, updateData);

      if (!updatedFolder) {
        return json({ error: 'Folder not found' }, { status: 404 });
      }

      return json({ folder: updatedFolder });

    } catch (error) {
      if (error instanceof Error && error.message.includes('Invalid')) {
        return json({ error: error.message }, { status: 400 });
      }
      throw error;
    }

  } catch (error) {
    console.error('Error updating media folder:', error);
    return json(
      { error: error instanceof Error ? error.message : 'Failed to update media folder' },
      { status: 500 }
    );
  }
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
  try {
    // Check authentication and permissions
    if (!locals.session?.user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    if (!id) {
      return json({ error: 'Folder ID is required' }, { status: 400 });
    }

    try {
      const objectId = new ObjectId(id);
      const success = await MediaFoldersCollection.delete(objectId);

      if (!success) {
        return json({ error: 'Folder not found or not empty' }, { status: 404 });
      }

      return json({ success: true });

    } catch (error) {
      if (error instanceof Error && error.message.includes('Cannot delete folder')) {
        return json({ error: error.message }, { status: 400 });
      }
      return json({ error: 'Invalid folder ID' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error deleting media folder:', error);
    return json(
      { error: 'Failed to delete media folder' },
      { status: 500 }
    );
  }
};