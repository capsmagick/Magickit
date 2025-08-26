import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
  try {
    // For now, return empty folders array
    // This would integrate with the actual media service
    return json({
      folders: [],
      success: true
    });
  } catch (error) {
    console.error('Error loading media folders:', error);
    return json(
      { error: 'Failed to load media folders' },
      { status: 500 }
    );
  }
};