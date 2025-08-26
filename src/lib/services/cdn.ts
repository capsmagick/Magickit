/**
 * CDN integration service for media assets and static content
 * Handles cache invalidation, URL generation, and performance optimization
 */

import { cacheService, CacheKeys } from './cache';

interface CDNConfig {
	enabled: boolean;
	domain: string;
	s3Bucket: string;
	s3Region: string;
	cacheHeaders: {
		images: string;
		videos: string;
		documents: string;
		static: string;
	};
}

interface CDNInvalidationRequest {
	paths: string[];
	reason?: string;
}

interface CDNStats {
	cacheHitRate: number;
	bandwidthUsage: number;
	requestCount: number;
	topAssets: Array<{
		path: string;
		requests: number;
		bandwidth: number;
	}>;
}

class CDNService {
	private config: CDNConfig;

	constructor() {
		this.config = {
			enabled: process.env.CDN_ENABLED === 'true',
			domain: process.env.CDN_DOMAIN || process.env.S3_ENDPOINT || '',
			s3Bucket: process.env.S3_BUCKET || '',
			s3Region: process.env.S3_REGION || '',
			cacheHeaders: {
				images: 'public, max-age=31536000, immutable', // 1 year
				videos: 'public, max-age=31536000, immutable', // 1 year
				documents: 'public, max-age=86400', // 1 day
				static: 'public, max-age=31536000, immutable' // 1 year
			}
		};
	}

	/**
	 * Generate CDN URL for a media asset
	 */
	getMediaURL(
		s3Key: string,
		options: {
			variant?: string;
			width?: number;
			height?: number;
			quality?: number;
			format?: 'webp' | 'jpeg' | 'png';
		} = {}
	): string {
		if (!this.config.enabled) {
			// Return direct S3 URL if CDN is disabled
			return `${this.config.domain}/${s3Key}`;
		}

		let url = `${this.config.domain}/${s3Key}`;

		// Add transformation parameters if supported by CDN
		const params = new URLSearchParams();
		
		if (options.width) params.set('w', options.width.toString());
		if (options.height) params.set('h', options.height.toString());
		if (options.quality) params.set('q', options.quality.toString());
		if (options.format) params.set('f', options.format);
		if (options.variant) params.set('v', options.variant);

		if (params.toString()) {
			url += `?${params.toString()}`;
		}

		return url;
	}

	/**
	 * Generate responsive image URLs for different screen sizes
	 */
	getResponsiveImageURLs(s3Key: string): {
		small: string;
		medium: string;
		large: string;
		webp: {
			small: string;
			medium: string;
			large: string;
		};
	} {
		return {
			small: this.getMediaURL(s3Key, { width: 480, quality: 85 }),
			medium: this.getMediaURL(s3Key, { width: 768, quality: 85 }),
			large: this.getMediaURL(s3Key, { width: 1200, quality: 85 }),
			webp: {
				small: this.getMediaURL(s3Key, { width: 480, quality: 85, format: 'webp' }),
				medium: this.getMediaURL(s3Key, { width: 768, quality: 85, format: 'webp' }),
				large: this.getMediaURL(s3Key, { width: 1200, quality: 85, format: 'webp' })
			}
		};
	}

	/**
	 * Get appropriate cache headers for a file type
	 */
	getCacheHeaders(mimeType: string): string {
		if (mimeType.startsWith('image/')) {
			return this.config.cacheHeaders.images;
		} else if (mimeType.startsWith('video/')) {
			return this.config.cacheHeaders.videos;
		} else if (mimeType === 'application/pdf' || mimeType.startsWith('text/')) {
			return this.config.cacheHeaders.documents;
		} else {
			return this.config.cacheHeaders.static;
		}
	}

	/**
	 * Invalidate CDN cache for specific paths
	 */
	async invalidateCache(request: CDNInvalidationRequest): Promise<boolean> {
		if (!this.config.enabled) {
			console.log('CDN not enabled, skipping cache invalidation');
			return true;
		}

		try {
			// This would integrate with your CDN provider's API
			// For example, CloudFlare, AWS CloudFront, etc.
			console.log(`Invalidating CDN cache for paths:`, request.paths);
			
			// Mock implementation - in production, you would call the actual CDN API
			const invalidationId = `inv-${Date.now()}`;
			
			// Cache the invalidation request for tracking
			await cacheService.set(
				`cdn-invalidation:${invalidationId}`,
				{
					paths: request.paths,
					reason: request.reason,
					status: 'completed',
					timestamp: new Date()
				},
				24 * 60 * 60 * 1000 // 24 hours
			);

			return true;
		} catch (error) {
			console.error('Error invalidating CDN cache:', error);
			return false;
		}
	}

	/**
	 * Invalidate cache for media file and its variants
	 */
	async invalidateMediaCache(s3Key: string): Promise<boolean> {
		const basePath = s3Key.replace(/\.[^/.]+$/, ''); // Remove extension
		const paths = [
			s3Key, // Original file
			`${basePath}/*`, // All variants
		];

		return await this.invalidateCache({
			paths,
			reason: 'Media file updated'
		});
	}

	/**
	 * Preload assets to CDN edge locations
	 */
	async preloadAssets(s3Keys: string[]): Promise<boolean> {
		if (!this.config.enabled) {
			return true;
		}

		try {
			console.log(`Preloading ${s3Keys.length} assets to CDN edge locations`);
			
			// This would make requests to the CDN URLs to warm up the cache
			const preloadPromises = s3Keys.map(async (s3Key) => {
				const url = this.getMediaURL(s3Key);
				try {
					// Make a HEAD request to warm up the cache
					const response = await fetch(url, { method: 'HEAD' });
					return response.ok;
				} catch (error) {
					console.warn(`Failed to preload asset ${s3Key}:`, error);
					return false;
				}
			});

			const results = await Promise.allSettled(preloadPromises);
			const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
			
			console.log(`Successfully preloaded ${successCount}/${s3Keys.length} assets`);
			return successCount > 0;
		} catch (error) {
			console.error('Error preloading assets:', error);
			return false;
		}
	}

	/**
	 * Get CDN performance statistics
	 */
	async getStats(
		startDate: Date,
		endDate: Date
	): Promise<CDNStats> {
		try {
			// This would integrate with your CDN provider's analytics API
			// For now, return mock data
			
			const mockStats: CDNStats = {
				cacheHitRate: 85.5 + Math.random() * 10, // 85-95%
				bandwidthUsage: Math.floor(Math.random() * 1000000000), // Random bytes
				requestCount: Math.floor(Math.random() * 100000),
				topAssets: [
					{
						path: '/media/images/hero-banner.jpg',
						requests: Math.floor(Math.random() * 10000),
						bandwidth: Math.floor(Math.random() * 50000000)
					},
					{
						path: '/media/images/logo.png',
						requests: Math.floor(Math.random() * 8000),
						bandwidth: Math.floor(Math.random() * 20000000)
					},
					{
						path: '/media/videos/intro.mp4',
						requests: Math.floor(Math.random() * 5000),
						bandwidth: Math.floor(Math.random() * 200000000)
					}
				]
			};

			// Cache the stats for a short period
			await cacheService.set(
				`cdn-stats:${startDate.toISOString()}:${endDate.toISOString()}`,
				mockStats,
				5 * 60 * 1000 // 5 minutes
			);

			return mockStats;
		} catch (error) {
			console.error('Error getting CDN stats:', error);
			return {
				cacheHitRate: 0,
				bandwidthUsage: 0,
				requestCount: 0,
				topAssets: []
			};
		}
	}

	/**
	 * Generate optimized image srcset for responsive images
	 */
	generateSrcSet(
		s3Key: string,
		sizes: number[] = [480, 768, 1024, 1200, 1600]
	): string {
		return sizes
			.map(size => `${this.getMediaURL(s3Key, { width: size, quality: 85 })} ${size}w`)
			.join(', ');
	}

	/**
	 * Generate WebP srcset with fallback
	 */
	generateWebPSrcSet(s3Key: string, sizes: number[] = [480, 768, 1024, 1200, 1600]): {
		webp: string;
		fallback: string;
	} {
		return {
			webp: sizes
				.map(size => `${this.getMediaURL(s3Key, { width: size, quality: 85, format: 'webp' })} ${size}w`)
				.join(', '),
			fallback: sizes
				.map(size => `${this.getMediaURL(s3Key, { width: size, quality: 85 })} ${size}w`)
				.join(', ')
		};
	}

	/**
	 * Check if CDN is enabled and configured
	 */
	isEnabled(): boolean {
		return this.config.enabled && !!this.config.domain;
	}

	/**
	 * Get CDN configuration
	 */
	getConfig(): CDNConfig {
		return { ...this.config };
	}

	/**
	 * Update CDN configuration
	 */
	updateConfig(updates: Partial<CDNConfig>): void {
		this.config = { ...this.config, ...updates };
	}

	/**
	 * Purge all CDN cache
	 */
	async purgeAllCache(): Promise<boolean> {
		return await this.invalidateCache({
			paths: ['/*'],
			reason: 'Manual purge all cache'
		});
	}

	/**
	 * Get cache invalidation history
	 */
	async getInvalidationHistory(limit: number = 10): Promise<Array<{
		id: string;
		paths: string[];
		reason?: string;
		status: string;
		timestamp: Date;
	}>> {
		try {
			// This would query your CDN provider's API for invalidation history
			// For now, return mock data
			const history = [];
			
			for (let i = 0; i < limit; i++) {
				history.push({
					id: `inv-${Date.now() - i * 60000}`,
					paths: [`/media/images/file-${i}.jpg`],
					reason: 'Media file updated',
					status: 'completed',
					timestamp: new Date(Date.now() - i * 60000)
				});
			}

			return history;
		} catch (error) {
			console.error('Error getting invalidation history:', error);
			return [];
		}
	}
}

// Export singleton instance
export const cdnService = new CDNService();

// Helper functions for templates
export const CDNHelpers = {
	/**
	 * Generate picture element with WebP support
	 */
	generatePictureElement: (
		s3Key: string,
		alt: string,
		sizes: string = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
	) => {
		const srcSets = cdnService.generateWebPSrcSet(s3Key);
		
		return `
			<picture>
				<source type="image/webp" srcset="${srcSets.webp}" sizes="${sizes}">
				<img src="${cdnService.getMediaURL(s3Key)}" srcset="${srcSets.fallback}" sizes="${sizes}" alt="${alt}" loading="lazy">
			</picture>
		`.trim();
	},

	/**
	 * Generate optimized image URL with automatic format detection
	 */
	getOptimizedImageURL: (
		s3Key: string,
		width?: number,
		height?: number,
		quality: number = 85
	) => {
		return cdnService.getMediaURL(s3Key, { width, height, quality });
	}
};