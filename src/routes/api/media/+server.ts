import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { action, folderId, search, sortBy, sortOrder, limit } = await request.json();
    
    if (action === 'getMedia') {
      // For now, return empty arrays
      // This would integrate with the actual media service
      return json({
        files: [],
        folders: [],
        success: true
      });
    }
    
    return json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error handling media request:', error);
    return json(
      { error: 'Failed to process media request' },
      { status: 500 }
    );
  }
};