/**
 * Enhanced cache service with Redis support for content and performance optimization
 * Falls back to in-memory cache if Redis is unavailable
 */

import Redis from 'ioredis';
import { dev } from '$app/environment';

interface CacheEntry<T> {
	data: T;
	timestamp: number;
	ttl: number; // Time to live in milliseconds
}

interface CacheConfig {
	defaultTTL: number;
	enableRedis: boolean;
	redisConfig: {
		host: string;
		port: number;
		password?: string;
		db: number;
		retryDelayOnFailover: number;
		maxRetriesPerRequest: number;
	};
}

class CacheService {
	private memoryCache = new Map<string, CacheEntry<any>>();
	private redis: Redis | null = null;
	private config: CacheConfig;
	private isRedisConnected = false;

	constructor() {
		this.config = {
			defaultTTL: 5 * 60 * 1000, // 5 minutes
			enableRedis: !dev, // Enable Redis in production
			redisConfig: {
				host: process.env.REDIS_HOST || 'localhost',
				port: parseInt(process.env.REDIS_PORT || '6379'),
				password: process.env.REDIS_PASSWORD || undefined,
				db: parseInt(process.env.REDIS_DB || '0'),
				retryDelayOnFailover: 100,
				maxRetriesPerRequest: 3
			}
		};

		this.initializeRedis();
	}

	/**
	 * Initialize Redis connection
	 */
	private async initializeRedis(): Promise<void> {
		if (!this.config.enableRedis) {
			console.log('Redis caching disabled (development mode)');
			return;
		}

		try {
			this.redis = new Redis({
				...this.config.redisConfig,
				lazyConnect: true,
				retryDelayOnFailover: this.config.redisConfig.retryDelayOnFailover,
				maxRetriesPerRequest: this.config.redisConfig.maxRetriesPerRequest
			});

			this.redis.on('connect', () => {
				this.isRedisConnected = true;
				console.log('Redis cache connected successfully');
			});

			this.redis.on('error', (error) => {
				this.isRedisConnected = false;
				console.warn('Redis cache error, falling back to memory cache:', error.message);
			});

			this.redis.on('close', () => {
				this.isRedisConnected = false;
				console.warn('Redis connection closed, using memory cache');
			});

			// Test connection
			await this.redis.connect();
		} catch (error) {
			console.warn('Failed to initialize Redis, using memory cache:', error);
			this.redis = null;
		}
	}

	/**
	 * Get item from cache (Redis first, then memory fallback)
	 */
	async get<T>(key: string): Promise<T | null> {
		try {
			// Try Redis first if available
			if (this.redis && this.isRedisConnected) {
				const cached = await this.redis.get(key);
				if (cached) {
					const parsed = JSON.parse(cached);
					return parsed.data;
				}
			}
		} catch (error) {
			console.warn('Redis get error, falling back to memory cache:', error);
		}

		// Fallback to memory cache
		const entry = this.memoryCache.get(key);
		
		if (!entry) {
			return null;
		}

		// Check if entry has expired
		if (Date.now() - entry.timestamp > entry.ttl) {
			this.memoryCache.delete(key);
			return null;
		}

		return entry.data;
	}

	/**
	 * Synchronous get for backward compatibility (memory cache only)
	 */
	getSync<T>(key: string): T | null {
		const entry = this.memoryCache.get(key);
		
		if (!entry) {
			return null;
		}

		// Check if entry has expired
		if (Date.now() - entry.timestamp > entry.ttl) {
			this.memoryCache.delete(key);
			return null;
		}

		return entry.data;
	}

	/**
	 * Set item in cache (both Redis and memory)
	 */
	async set<T>(key: string, data: T, ttl?: number): Promise<void> {
		const cacheTTL = ttl || this.config.defaultTTL;
		const entry: CacheEntry<T> = {
			data,
			timestamp: Date.now(),
			ttl: cacheTTL
		};

		// Set in memory cache
		this.memoryCache.set(key, entry);

		// Set in Redis if available
		try {
			if (this.redis && this.isRedisConnected) {
				const redisEntry = { data, timestamp: Date.now() };
				await this.redis.setex(key, Math.ceil(cacheTTL / 1000), JSON.stringify(redisEntry));
			}
		} catch (error) {
			console.warn('Redis set error:', error);
		}
	}

	/**
	 * Synchronous set for backward compatibility (memory cache only)
	 */
	setSync<T>(key: string, data: T, ttl?: number): void {
		const entry: CacheEntry<T> = {
			data,
			timestamp: Date.now(),
			ttl: ttl || this.config.defaultTTL
		};

		this.memoryCache.set(key, entry);
	}

	/**
	 * Delete item from cache (both Redis and memory)
	 */
	async delete(key: string): Promise<boolean> {
		let deleted = false;

		// Delete from memory cache
		deleted = this.memoryCache.delete(key);

		// Delete from Redis if available
		try {
			if (this.redis && this.isRedisConnected) {
				const redisDeleted = await this.redis.del(key);
				deleted = deleted || redisDeleted > 0;
			}
		} catch (error) {
			console.warn('Redis delete error:', error);
		}

		return deleted;
	}

	/**
	 * Synchronous delete for backward compatibility (memory cache only)
	 */
	deleteSync(key: string): boolean {
		return this.memoryCache.delete(key);
	}

	/**
	 * Clear all cache entries (both Redis and memory)
	 */
	async clear(): Promise<void> {
		// Clear memory cache
		this.memoryCache.clear();

		// Clear Redis if available
		try {
			if (this.redis && this.isRedisConnected) {
				await this.redis.flushdb();
			}
		} catch (error) {
			console.warn('Redis clear error:', error);
		}
	}

	/**
	 * Synchronous clear for backward compatibility (memory cache only)
	 */
	clearSync(): void {
		this.memoryCache.clear();
	}

	/**
	 * Clear cache entries by pattern (both Redis and memory)
	 */
	async clearByPattern(pattern: string): Promise<void> {
		const regex = new RegExp(pattern);
		
		// Clear from memory cache
		for (const key of this.memoryCache.keys()) {
			if (regex.test(key)) {
				this.memoryCache.delete(key);
			}
		}

		// Clear from Redis if available
		try {
			if (this.redis && this.isRedisConnected) {
				const keys = await this.redis.keys(pattern);
				if (keys.length > 0) {
					await this.redis.del(...keys);
				}
			}
		} catch (error) {
			console.warn('Redis pattern clear error:', error);
		}
	}

	/**
	 * Synchronous pattern clear for backward compatibility (memory cache only)
	 */
	clearByPatternSync(pattern: string): void {
		const regex = new RegExp(pattern);
		
		for (const key of this.memoryCache.keys()) {
			if (regex.test(key)) {
				this.memoryCache.delete(key);
			}
		}
	}

	/**
	 * Get cache statistics
	 */
	async getStats(): Promise<{
		memory: {
			size: number;
			keys: string[];
			memoryUsage: number;
		};
		redis: {
			connected: boolean;
			keyCount: number;
			memoryUsage: number;
		} | null;
	}> {
		const memoryKeys = Array.from(this.memoryCache.keys());
		
		// Rough memory usage calculation for memory cache
		const memoryUsage = memoryKeys.reduce((total, key) => {
			const entry = this.memoryCache.get(key);
			if (entry) {
				// Rough estimate: key size + JSON string size
				return total + key.length + JSON.stringify(entry.data).length;
			}
			return total;
		}, 0);

		const stats = {
			memory: {
				size: this.memoryCache.size,
				keys: memoryKeys,
				memoryUsage
			},
			redis: null as any
		};

		// Get Redis stats if available
		try {
			if (this.redis && this.isRedisConnected) {
				const info = await this.redis.info('memory');
				const keyCount = await this.redis.dbsize();
				
				// Parse memory usage from Redis info
				const memoryMatch = info.match(/used_memory:(\d+)/);
				const redisMemoryUsage = memoryMatch ? parseInt(memoryMatch[1]) : 0;

				stats.redis = {
					connected: true,
					keyCount,
					memoryUsage: redisMemoryUsage
				};
			}
		} catch (error) {
			console.warn('Error getting Redis stats:', error);
			stats.redis = {
				connected: false,
				keyCount: 0,
				memoryUsage: 0
			};
		}

		return stats;
	}

	/**
	 * Clean up expired entries (memory cache only, Redis handles TTL automatically)
	 */
	cleanup(): void {
		const now = Date.now();
		
		for (const [key, entry] of this.memoryCache.entries()) {
			if (now - entry.timestamp > entry.ttl) {
				this.memoryCache.delete(key);
			}
		}
	}

	/**
	 * Get cache hit/miss statistics
	 */
	private hitCount = 0;
	private missCount = 0;

	getHitMissStats(): { hits: number; misses: number; hitRate: number } {
		const total = this.hitCount + this.missCount;
		const hitRate = total > 0 ? (this.hitCount / total) * 100 : 0;
		
		return {
			hits: this.hitCount,
			misses: this.missCount,
			hitRate: Math.round(hitRate * 100) / 100
		};
	}

	resetHitMissStats(): void {
		this.hitCount = 0;
		this.missCount = 0;
	}

	/**
	 * Warm up cache with frequently accessed content
	 */
	async warmUp(keys: Array<{ key: string; loader: () => Promise<any>; ttl?: number }>): Promise<void> {
		console.log(`Warming up cache with ${keys.length} entries...`);
		
		const promises = keys.map(async ({ key, loader, ttl }) => {
			try {
				const data = await loader();
				await this.set(key, data, ttl);
			} catch (error) {
				console.warn(`Failed to warm up cache for key ${key}:`, error);
			}
		});

		await Promise.allSettled(promises);
		console.log('Cache warm-up completed');
	}

	/**
	 * Get or set pattern - retrieve from cache or load and cache if not found
	 */
	async getOrSet<T>(
		key: string, 
		loader: () => Promise<T>, 
		ttl?: number
	): Promise<T> {
		// Try to get from cache first
		const cached = await this.get<T>(key);
		if (cached !== null) {
			this.hitCount++;
			return cached;
		}

		// Cache miss - load data and cache it
		this.missCount++;
		const data = await loader();
		await this.set(key, data, ttl);
		return data;
	}

	/**
	 * Disconnect Redis connection
	 */
	async disconnect(): Promise<void> {
		if (this.redis) {
			await this.redis.disconnect();
			this.redis = null;
			this.isRedisConnected = false;
		}
	}
}

// Export singleton instance
export const cacheService = new CacheService();

// Cache key generators
export const CacheKeys = {
	// Content caching
	content: (slug: string) => `content:${slug}`,
	contentType: (id: string) => `content-type:${id}`,
	contentList: (typeId?: string, status?: string) => 
		`content-list:${typeId || 'all'}:${status || 'all'}`,
	seo: (slug: string) => `seo:${slug}`,
	structuredData: (slug: string) => `structured-data:${slug}`,
	pageRender: (slug: string) => `page-render:${slug}`,
	
	// Media caching
	media: (id: string) => `media:${id}`,
	mediaList: (folderId?: string, filters?: string) => 
		`media-list:${folderId || 'root'}:${filters || 'none'}`,
	mediaFolder: (id: string) => `media-folder:${id}`,
	mediaBrowser: (folderId?: string, search?: string) => 
		`media-browser:${folderId || 'root'}:${search || 'none'}`,
	
	// System metrics caching
	systemMetrics: (timestamp: string) => `system-metrics:${timestamp}`,
	systemHealth: () => `system-health:current`,
	systemAlerts: (type?: string) => `system-alerts:${type || 'all'}`,
	
	// Performance caching
	dbQuery: (collection: string, query: string) => `db-query:${collection}:${query}`,
	apiResponse: (endpoint: string, params?: string) => 
		`api-response:${endpoint}:${params || 'none'}`,
	
	// User session caching
	userSession: (userId: string) => `user-session:${userId}`,
	userPermissions: (userId: string) => `user-permissions:${userId}`
};

// Cache invalidation helpers
export const CacheInvalidation = {
	/**
	 * Invalidate content cache when content is updated
	 */
	invalidateContent: async (slug: string, contentTypeId?: string) => {
		await Promise.all([
			cacheService.delete(CacheKeys.content(slug)),
			cacheService.delete(CacheKeys.seo(slug)),
			cacheService.delete(CacheKeys.structuredData(slug)),
			cacheService.clearByPattern(`content-list:*`),
			cacheService.clearByPattern(`page-render:*`)
		]);
		
		if (contentTypeId) {
			await cacheService.delete(CacheKeys.contentType(contentTypeId));
		}
	},

	/**
	 * Invalidate content type cache
	 */
	invalidateContentType: async (id: string) => {
		await Promise.all([
			cacheService.delete(CacheKeys.contentType(id)),
			cacheService.clearByPattern(`content-list:${id}:*`),
			cacheService.clearByPattern(`page-render:*`)
		]);
	},

	/**
	 * Invalidate all content-related cache
	 */
	invalidateAllContent: async () => {
		await Promise.all([
			cacheService.clearByPattern(`content:*`),
			cacheService.clearByPattern(`content-type:*`),
			cacheService.clearByPattern(`content-list:*`),
			cacheService.clearByPattern(`seo:*`),
			cacheService.clearByPattern(`structured-data:*`),
			cacheService.clearByPattern(`page-render:*`)
		]);
	},

	/**
	 * Invalidate media cache when media is updated
	 */
	invalidateMedia: async (mediaId?: string, folderId?: string) => {
		const patterns = [`media-list:*`, `media-browser:*`];
		
		if (mediaId) {
			patterns.push(`media:${mediaId}`);
		}
		
		if (folderId) {
			patterns.push(`media-folder:${folderId}:*`);
		}

		await Promise.all(patterns.map(pattern => cacheService.clearByPattern(pattern)));
	},

	/**
	 * Invalidate system metrics cache
	 */
	invalidateSystemMetrics: async () => {
		await cacheService.clearByPattern(`system-metrics:*`);
	}
};

// Auto cleanup every 10 minutes
if (typeof setInterval !== 'undefined') {
	setInterval(() => {
		cacheService.cleanup();
	}, 10 * 60 * 1000);
}