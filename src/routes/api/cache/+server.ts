import { json } from '@sveltejs/kit';
import { cacheService, CacheInvalidation } from '$lib/services/cache';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const action = url.searchParams.get('action');

		switch (action) {
			case 'stats':
				const stats = await cacheService.getStats();
				const hitMissStats = cacheService.getHitMissStats();
				
				return json({
					success: true,
					data: {
						...stats,
						hitMiss: hitMissStats
					}
				});

			case 'health':
				const healthStats = await cacheService.getStats();
				const isHealthy = healthStats.redis?.connected !== false;
				
				return json({
					success: true,
					data: {
						healthy: isHealthy,
						redis: healthStats.redis,
						memory: healthStats.memory
					}
				});

			default:
				return json({ success: false, error: 'Unknown action' }, { status: 400 });
		}
	} catch (error) {
		console.error('Error getting cache info:', error);
		return json(
			{
				success: false,
				error: 'Failed to retrieve cache information'
			},
			{ status: 500 }
		);
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { action, key, pattern, data, ttl } = await request.json();

		switch (action) {
			case 'get':
				if (!key) {
					return json({ success: false, error: 'Key is required' }, { status: 400 });
				}
				const value = await cacheService.get(key);
				return json({
					success: true,
					data: { key, value, found: value !== null }
				});

			case 'set':
				if (!key || data === undefined) {
					return json({ success: false, error: 'Key and data are required' }, { status: 400 });
				}
				await cacheService.set(key, data, ttl);
				return json({ success: true, message: 'Cache entry set successfully' });

			case 'delete':
				if (!key) {
					return json({ success: false, error: 'Key is required' }, { status: 400 });
				}
				const deleted = await cacheService.delete(key);
				return json({ 
					success: true, 
					message: deleted ? 'Cache entry deleted' : 'Cache entry not found' 
				});

			case 'clear':
				await cacheService.clear();
				return json({ success: true, message: 'All cache cleared successfully' });

			case 'clear-pattern':
				if (!pattern) {
					return json({ success: false, error: 'Pattern is required' }, { status: 400 });
				}
				await cacheService.clearByPattern(pattern);
				return json({ success: true, message: `Cache cleared for pattern: ${pattern}` });

			case 'invalidate-content':
				const { slug, contentTypeId } = await request.json();
				if (!slug) {
					return json({ success: false, error: 'Slug is required' }, { status: 400 });
				}
				await CacheInvalidation.invalidateContent(slug, contentTypeId);
				return json({ success: true, message: `Content cache invalidated for: ${slug}` });

			case 'invalidate-media':
				const { mediaId, folderId } = await request.json();
				await CacheInvalidation.invalidateMedia(mediaId, folderId);
				return json({ success: true, message: 'Media cache invalidated' });

			case 'invalidate-all-content':
				await CacheInvalidation.invalidateAllContent();
				return json({ success: true, message: 'All content cache invalidated' });

			case 'reset-stats':
				cacheService.resetHitMissStats();
				return json({ success: true, message: 'Cache statistics reset' });

			default:
				return json({ success: false, error: 'Unknown action' }, { status: 400 });
		}
	} catch (error) {
		console.error('Error performing cache action:', error);
		return json(
			{
				success: false,
				error: 'Failed to perform cache action'
			},
			{ status: 500 }
		);
	}
};

export const DELETE: RequestHandler = async ({ url }) => {
	try {
		const key = url.searchParams.get('key');
		const pattern = url.searchParams.get('pattern');

		if (key) {
			const deleted = await cacheService.delete(key);
			return json({ 
				success: true, 
				message: deleted ? 'Cache entry deleted' : 'Cache entry not found' 
			});
		} else if (pattern) {
			await cacheService.clearByPattern(pattern);
			return json({ success: true, message: `Cache cleared for pattern: ${pattern}` });
		} else {
			await cacheService.clear();
			return json({ success: true, message: 'All cache cleared' });
		}
	} catch (error) {
		console.error('Error deleting cache:', error);
		return json(
			{
				success: false,
				error: 'Failed to delete cache'
			},
			{ status: 500 }
		);
	}
};