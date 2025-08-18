import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MediaFilesCollection } from '$lib/db/collections/mediaFiles';
import { ObjectId } from 'mongodb';

export const GET: RequestHandler = async ({ params, locals }) => {
  try {
    // Check authentication and permissions
    if (!locals.session?.user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    if (!id) {
      return json({ error: 'File ID is required' }, { status: 400 });
    }

    try {
      const objectId = new ObjectId(id);
      const file = await MediaFilesCollection.findById(objectId);

      if (!file) {
        return json({ error: 'File not found' }, { status: 404 });
      }

      return json({ file });

    } catch (error) {
      return json({ error: 'Invalid file ID' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error fetching media file:', error);
    return json(
      { error: 'Failed to fetch media file' },
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
      return json({ error: 'File ID is required' }, { status: 400 });
    }

    const data = await request.json();

    try {
      const objectId = new ObjectId(id);
      
      // Build update data (only allow certain fields to be updated)
      const updateData: any = {};
      
      if (data.filename !== undefined) updateData.filename = data.filename;
      if (data.altText !== undefined) updateData.altText = data.altText;
      if (data.caption !== undefined) updateData.caption = data.caption;
      if (data.tags !== undefined) updateData.tags = data.tags;
      if (data.folderId !== undefined) {
        updateData.folderId = data.folderId ? new ObjectId(data.folderId) : undefined;
      }

      const updatedFile = await MediaFilesCollection.update(objectId, updateData);

      if (!updatedFile) {
        return json({ error: 'File not found' }, { status: 404 });
      }

      return json({ file: updatedFile });

    } catch (error) {
      if (error instanceof Error && error.message.includes('Invalid')) {
        return json({ error: error.message }, { status: 400 });
      }
      throw error;
    }

  } catch (error) {
    console.error('Error updating media file:', error);
    return json(
      { error: error instanceof Error ? error.message : 'Failed to update media file' },
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
      return json({ error: 'File ID is required' }, { status: 400 });
    }

    try {
      const objectId = new ObjectId(id);
      const success = await MediaFilesCollection.delete(objectId);

      if (!success) {
        return json({ error: 'File not found' }, { status: 404 });
      }

      return json({ success: true });

    } catch (error) {
      return json({ error: 'Invalid file ID' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error deleting media file:', error);
    return json(
      { error: 'Failed to delete media file' },
      { status: 500 }
    );
  }
};