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

    const { fileIds } = await request.json();

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

    // Delete files
    let deletedCount = 0;
    const errors: string[] = [];

    for (const objectId of objectIds) {
      try {
        const success = await MediaFilesCollection.delete(objectId);
        if (success) {
          deletedCount++;
        } else {
          errors.push(`Failed to delete file with ID: ${objectId}`);
        }
      } catch (error) {
        errors.push(`Error deleting file ${objectId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return json({
      deletedCount,
      totalRequested: fileIds.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error bulk deleting media files:', error);
    return json(
      { error: error instanceof Error ? error.message : 'Failed to delete media files' },
      { status: 500 }
    );
  }
};