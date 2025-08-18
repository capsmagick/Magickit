import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MediaFilesCollection } from '$lib/db/collections/mediaFiles';
import { ObjectId } from 'mongodb';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Check authentication and permissions
    if (!locals.session?.user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileIds, folderId } = await request.json();

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return json({ error: 'Invalid file IDs' }, { status: 400 });
    }

    // Convert string IDs to ObjectIds
    const objectIds = fileIds.map(id => {
      try {
        return new ObjectId(id);
      } catch (error) {
        throw new Error(`Invalid file ID: ${id}`);
      }
    });

    // Convert folder ID if provided
    let targetFolderId: ObjectId | null = null;
    if (folderId && folderId !== 'null') {
      try {
        targetFolderId = new ObjectId(folderId);
      } catch (error) {
        return json({ error: 'Invalid folder ID' }, { status: 400 });
      }
    }

    // Move files
    const result = await MediaFilesCollection.bulkMoveToFolder(objectIds, targetFolderId);

    return json({
      movedCount: result.modifiedCount,
      totalRequested: fileIds.length,
      matchedCount: result.matchedCount
    });

  } catch (error) {
    console.error('Error bulk moving media files:', error);
    return json(
      { error: error instanceof Error ? error.message : 'Failed to move media files' },
      { status: 500 }
    );
  }
};