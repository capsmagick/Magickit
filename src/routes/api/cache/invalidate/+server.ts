import { json } from '@sveltejs/kit';
import { CacheInvalidation } from '$lib/services/cache.js';
import type { RequestHandler } from './$types.js';

/**
 * API endpoint to invalidate cache entries
 * Used when content is updated to ensure fresh content is served
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		// Check if user is authenticated and has admin permissions
		if (!locals.user || !locals.user.role || !['admin', 'editor'].includes(locals.user.role)) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { type, slug, contentTypeId } = await request.json();

		switch (type) {
			case 'content':
				if (!slug) {
					return json({ error: 'Slug is required for content invalidation' }, { status: 400 });
				}
				CacheInvalidation.invalidateContent(slug, contentTypeId);
				break;

			case 'content-type':
				if (!contentTypeId) {
					return json({ error: 'Content type ID is required' }, { status: 400 });
				}
				CacheInvalidation.invalidateContentType(contentTypeId);
				break;

			case 'all':
				CacheInvalidation.invalidateAllContent();
				break;

			default:
				return json({ error: 'Invalid invalidation type' }, { status: 400 });
		}

		return json({ 
			success: true, 
			message: `Cache invalidated for ${type}${slug ? `: ${slug}` : ''}` 
		});

	} catch (error) {
		console.error('Cache invalidation error:', error);
		return json({ error: 'Failed to invalidate cache' }, { status: 500 });
	}
};

/**
 * Get cache statistics (admin only)
 */
export const GET: RequestHandler = async ({ locals }) => {
	try {
		// Check if user is authenticated and has admin permissions
		if (!locals.user || !locals.user.role || locals.user.role !== 'admin') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { cacheService } = await import('$lib/services/cache.js');
		const stats = cacheService.getStats();

		return json({
			success: true,
			stats: {
				...stats,
				memoryUsageFormatted: `${(stats.memoryUsage / 1024 / 1024).toFixed(2)} MB`
			}
		});

	} catch (error) {
		console.error('Cache stats error:', error);
		return json({ error: 'Failed to get cache stats' }, { status: 500 });
	}
};