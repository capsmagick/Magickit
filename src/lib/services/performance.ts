/**
 * Performance monitoring service for SSR pages and API endpoints
 * Tracks response times, cache hit rates, and performance metrics
 */

import { cacheService, CacheKeys } from './cache';
import { ObjectId } from 'mongodb';
import db from '$lib/db/dbClient';

interface PerformanceMetric {
	_id?: ObjectId;
	endpoint: string;
	method: string;
	responseTime: number;
	cacheHit: boolean;
	timestamp: Date;
	userAgent?: string;
	ip?: string;
	statusCode: number;
	contentLength?: number;
	dbQueries?: number;
	dbQueryTime?: number;
}

interface PerformanceStats {
	averageResponseTime: number;
	p95ResponseTime: number;
	p99ResponseTime: number;
	cacheHitRate: number;
	totalRequests: number;
	errorRate: number;
	slowestEndpoints: Array<{
		endpoint: string;
		averageTime: number;
		requestCount: number;
	}>;
}

class PerformanceMonitoringService {
	private metricsCollection = db.collection<PerformanceMetric>('performanceMetrics');
	private requestTimes = new Map<string, number>();

	/**
	 * Start timing a request
	 */
	startTiming(requestId: string): void {
		this.requestTimes.set(requestId, Date.now());
	}

	/**
	 * End timing and record performance metric
	 */
	async endTiming(
		requestId: string,
		endpoint: string,
		method: string,
		statusCode: number,
		options: {
			cacheHit?: boolean;
			userAgent?: string;
			ip?: string;
			contentLength?: number;
			dbQueries?: number;
			dbQueryTime?: number;
		} = {}
	): Promise<void> {
		const startTime = this.requestTimes.get(requestId);
		if (!startTime) {
			return;
		}

		const responseTime = Date.now() - startTime;
		this.requestTimes.delete(requestId);

		const metric: PerformanceMetric = {
			endpoint,
			method,
			responseTime,
			cacheHit: options.cacheHit || false,
			timestamp: new Date(),
			userAgent: options.userAgent,
			ip: options.ip,
			statusCode,
			contentLength: options.contentLength,
			dbQueries: options.dbQueries,
			dbQueryTime: options.dbQueryTime
		};

		try {
			await this.metricsCollection.insertOne(metric);
		} catch (error) {
			console.error('Error recording performance metric:', error);
		}
	}

	/**
	 * Get performance statistics for a time period
	 */
	async getPerformanceStats(
		startDate: Date,
		endDate: Date,
		endpoint?: string
	): Promise<PerformanceStats> {
		try {
			const query: any = {
				timestamp: { $gte: startDate, $lte: endDate }
			};

			if (endpoint) {
				query.endpoint = endpoint;
			}

			const metrics = await this.metricsCollection
				.find(query)
				.sort({ timestamp: -1 })
				.toArray();

			if (metrics.length === 0) {
				return {
					averageResponseTime: 0,
					p95ResponseTime: 0,
					p99ResponseTime: 0,
					cacheHitRate: 0,
					totalRequests: 0,
					errorRate: 0,
					slowestEndpoints: []
				};
			}

			// Calculate response time statistics
			const responseTimes = metrics.map(m => m.responseTime).sort((a, b) => a - b);
			const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
			const p95Index = Math.floor(responseTimes.length * 0.95);
			const p99Index = Math.floor(responseTimes.length * 0.99);
			const p95ResponseTime = responseTimes[p95Index] || 0;
			const p99ResponseTime = responseTimes[p99Index] || 0;

			// Calculate cache hit rate
			const cacheHits = metrics.filter(m => m.cacheHit).length;
			const cacheHitRate = (cacheHits / metrics.length) * 100;

			// Calculate error rate
			const errors = metrics.filter(m => m.statusCode >= 400).length;
			const errorRate = (errors / metrics.length) * 100;

			// Find slowest endpoints
			const endpointStats = new Map<string, { totalTime: number; count: number }>();
			
			metrics.forEach(metric => {
				const existing = endpointStats.get(metric.endpoint) || { totalTime: 0, count: 0 };
				existing.totalTime += metric.responseTime;
				existing.count += 1;
				endpointStats.set(metric.endpoint, existing);
			});

			const slowestEndpoints = Array.from(endpointStats.entries())
				.map(([endpoint, stats]) => ({
					endpoint,
					averageTime: stats.totalTime / stats.count,
					requestCount: stats.count
				}))
				.sort((a, b) => b.averageTime - a.averageTime)
				.slice(0, 10);

			return {
				averageResponseTime: Math.round(averageResponseTime),
				p95ResponseTime: Math.round(p95ResponseTime),
				p99ResponseTime: Math.round(p99ResponseTime),
				cacheHitRate: Math.round(cacheHitRate * 100) / 100,
				totalRequests: metrics.length,
				errorRate: Math.round(errorRate * 100) / 100,
				slowestEndpoints
			};
		} catch (error) {
			console.error('Error getting performance stats:', error);
			return {
				averageResponseTime: 0,
				p95ResponseTime: 0,
				p99ResponseTime: 0,
				cacheHitRate: 0,
				totalRequests: 0,
				errorRate: 0,
				slowestEndpoints: []
			};
		}
	}

	/**
	 * Get real-time performance metrics
	 */
	async getRealTimeMetrics(): Promise<{
		activeRequests: number;
		averageResponseTime: number;
		requestsPerMinute: number;
		cacheHitRate: number;
	}> {
		const now = new Date();
		const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
		const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

		try {
			const [recentMetrics, cacheStats] = await Promise.all([
				this.metricsCollection
					.find({ timestamp: { $gte: fiveMinutesAgo } })
					.toArray(),
				cacheService.getHitMissStats()
			]);

			const lastMinuteMetrics = recentMetrics.filter(
				m => m.timestamp >= oneMinuteAgo
			);

			const averageResponseTime = recentMetrics.length > 0
				? recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length
				: 0;

			return {
				activeRequests: this.requestTimes.size,
				averageResponseTime: Math.round(averageResponseTime),
				requestsPerMinute: lastMinuteMetrics.length,
				cacheHitRate: cacheStats.hitRate
			};
		} catch (error) {
			console.error('Error getting real-time metrics:', error);
			return {
				activeRequests: 0,
				averageResponseTime: 0,
				requestsPerMinute: 0,
				cacheHitRate: 0
			};
		}
	}

	/**
	 * Clean up old performance metrics
	 */
	async cleanupOldMetrics(daysToKeep: number = 30): Promise<void> {
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

		try {
			const result = await this.metricsCollection.deleteMany({
				timestamp: { $lt: cutoffDate }
			});

			console.log(`Cleaned up ${result.deletedCount} old performance metrics`);
		} catch (error) {
			console.error('Error cleaning up old metrics:', error);
		}
	}

	/**
	 * Get database query performance
	 */
	async getDbQueryPerformance(
		startDate: Date,
		endDate: Date
	): Promise<{
		averageQueryTime: number;
		totalQueries: number;
		slowQueries: number;
		queriesPerRequest: number;
	}> {
		try {
			const metrics = await this.metricsCollection
				.find({
					timestamp: { $gte: startDate, $lte: endDate },
					dbQueryTime: { $exists: true }
				})
				.toArray();

			if (metrics.length === 0) {
				return {
					averageQueryTime: 0,
					totalQueries: 0,
					slowQueries: 0,
					queriesPerRequest: 0
				};
			}

			const totalQueryTime = metrics.reduce((sum, m) => sum + (m.dbQueryTime || 0), 0);
			const totalQueries = metrics.reduce((sum, m) => sum + (m.dbQueries || 0), 0);
			const slowQueries = metrics.filter(m => (m.dbQueryTime || 0) > 100).length;

			return {
				averageQueryTime: totalQueries > 0 ? Math.round(totalQueryTime / totalQueries) : 0,
				totalQueries,
				slowQueries,
				queriesPerRequest: metrics.length > 0 ? Math.round(totalQueries / metrics.length * 100) / 100 : 0
			};
		} catch (error) {
			console.error('Error getting DB query performance:', error);
			return {
				averageQueryTime: 0,
				totalQueries: 0,
				slowQueries: 0,
				queriesPerRequest: 0
			};
		}
	}

	/**
	 * Monitor SSR page performance
	 */
	async monitorSSRPage<T>(
		slug: string,
		loader: () => Promise<T>,
		options: {
			cacheKey?: string;
			cacheTTL?: number;
			skipCache?: boolean;
		} = {}
	): Promise<T> {
		const requestId = `ssr-${slug}-${Date.now()}`;
		const startTime = Date.now();
		let cacheHit = false;
		let result: T;

		try {
			// Try cache first unless skipped
			if (!options.skipCache && options.cacheKey) {
				const cached = await cacheService.get<T>(options.cacheKey);
				if (cached !== null) {
					cacheHit = true;
					result = cached;
				} else {
					// Cache miss - load and cache
					result = await loader();
					await cacheService.set(options.cacheKey, result, options.cacheTTL);
				}
			} else {
				result = await loader();
			}

			// Record performance metric
			const responseTime = Date.now() - startTime;
			await this.recordSSRMetric(slug, responseTime, cacheHit);

			return result;
		} catch (error) {
			// Record error metric
			const responseTime = Date.now() - startTime;
			await this.recordSSRMetric(slug, responseTime, cacheHit, 500);
			throw error;
		}
	}

	/**
	 * Record SSR performance metric
	 */
	private async recordSSRMetric(
		slug: string,
		responseTime: number,
		cacheHit: boolean,
		statusCode: number = 200
	): Promise<void> {
		const metric: PerformanceMetric = {
			endpoint: `/[slug]/${slug}`,
			method: 'GET',
			responseTime,
			cacheHit,
			timestamp: new Date(),
			statusCode
		};

		try {
			await this.metricsCollection.insertOne(metric);
		} catch (error) {
			console.error('Error recording SSR metric:', error);
		}
	}

	/**
	 * Get CDN performance metrics (placeholder for CDN integration)
	 */
	async getCDNMetrics(): Promise<{
		cacheHitRate: number;
		averageResponseTime: number;
		bandwidthUsage: number;
		requestCount: number;
	}> {
		// This would integrate with your CDN provider's API
		// For now, return mock data
		return {
			cacheHitRate: 85.5,
			averageResponseTime: 45,
			bandwidthUsage: 1024 * 1024 * 500, // 500MB
			requestCount: 10000
		};
	}
}

// Export singleton instance
export const performanceService = new PerformanceMonitoringService();

// Performance middleware helper
export function createPerformanceMiddleware() {
	return {
		start: (requestId: string) => {
			performanceService.startTiming(requestId);
		},
		end: async (
			requestId: string,
			endpoint: string,
			method: string,
			statusCode: number,
			options?: Parameters<typeof performanceService.endTiming>[4]
		) => {
			await performanceService.endTiming(requestId, endpoint, method, statusCode, options);
		}
	};
}