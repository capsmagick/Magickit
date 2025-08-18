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
      const hierarchy = await MediaFoldersCollection.getFolderHierarchy(objectId);

      return json({ hierarchy });

    } catch (error) {
      return json({ error: 'Invalid folder ID' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error fetching folder hierarchy:', error);
    return json(
      { error: 'Failed to fetch folder hierarchy' },
      { status: 500 }
    );
  }
};