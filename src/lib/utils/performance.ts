/**
 * Performance monitoring utilities for SSR and dynamic content
 */

export interface PerformanceMetrics {
	startTime: number;
	endTime?: number;
	duration?: number;
	memoryUsage?: NodeJS.MemoryUsage;
	cacheHit?: boolean;
	dbQueries?: number;
	renderTime?: number;
}

/**
 * Performance monitor class for tracking SSR performance
 */
export class PerformanceMonitor {
	private metrics: Map<string, PerformanceMetrics> = new Map();

	/**
	 * Start monitoring a request
	 */
	start(requestId: string): void {
		this.metrics.set(requestId, {
			startTime: performance.now(),
			memoryUsage: process.memoryUsage()
		});
	}

	/**
	 * Mark cache hit/miss
	 */
	markCache(requestId: string, hit: boolean): void {
		const metric = this.metrics.get(requestId);
		if (metric) {
			metric.cacheHit = hit;
		}
	}

	/**
	 * Increment database query count
	 */
	incrementDbQueries(requestId: string): void {
		const metric = this.metrics.get(requestId);
		if (metric) {
			metric.dbQueries = (metric.dbQueries || 0) + 1;
		}
	}

	/**
	 * Mark render start time
	 */
	startRender(requestId: string): void {
		const metric = this.metrics.get(requestId);
		if (metric) {
			metric.renderTime = performance.now();
		}
	}

	/**
	 * End monitoring and return metrics
	 */
	end(requestId: string): PerformanceMetrics | null {
		const metric = this.metrics.get(requestId);
		if (!metric) return null;

		const endTime = performance.now();
		metric.endTime = endTime;
		metric.duration = endTime - metric.startTime;

		if (metric.renderTime) {
			metric.renderTime = endTime - metric.renderTime;
		}

		// Clean up
		this.metrics.delete(requestId);

		return metric;
	}

	/**
	 * Get current metrics without ending monitoring
	 */
	getCurrent(requestId: string): PerformanceMetrics | null {
		return this.metrics.get(requestId) || null;
	}
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Performance thresholds for alerting
 */
export const PERFORMANCE_THRESHOLDS = {
	SLOW_REQUEST: 1000, // 1 second
	VERY_SLOW_REQUEST: 3000, // 3 seconds
	HIGH_MEMORY: 100 * 1024 * 1024, // 100MB
	MAX_DB_QUERIES: 10
};

/**
 * Analyze performance metrics and return recommendations
 */
export function analyzePerformance(metrics: PerformanceMetrics): {
	score: number;
	issues: string[];
	recommendations: string[];
} {
	const issues: string[] = [];
	const recommendations: string[] = [];
	let score = 100;

	// Check request duration
	if (metrics.duration) {
		if (metrics.duration > PERFORMANCE_THRESHOLDS.VERY_SLOW_REQUEST) {
			issues.push(`Very slow request: ${metrics.duration.toFixed(2)}ms`);
			recommendations.push('Consider implementing more aggressive caching');
			recommendations.push('Optimize database queries');
			score -= 30;
		} else if (metrics.duration > PERFORMANCE_THRESHOLDS.SLOW_REQUEST) {
			issues.push(`Slow request: ${metrics.duration.toFixed(2)}ms`);
			recommendations.push('Consider caching this content');
			score -= 15;
		}
	}

	// Check cache performance
	if (metrics.cacheHit === false) {
		issues.push('Cache miss - content loaded from database');
		recommendations.push('Ensure proper cache warming for popular content');
		score -= 10;
	}

	// Check database queries
	if (metrics.dbQueries && metrics.dbQueries > PERFORMANCE_THRESHOLDS.MAX_DB_QUERIES) {
		issues.push(`High database query count: ${metrics.dbQueries}`);
		recommendations.push('Optimize database queries and use aggregation');
		recommendations.push('Consider denormalizing frequently accessed data');
		score -= 20;
	}

	// Check memory usage
	if (metrics.memoryUsage && metrics.memoryUsage.heapUsed > PERFORMANCE_THRESHOLDS.HIGH_MEMORY) {
		issues.push(`High memory usage: ${(metrics.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
		recommendations.push('Monitor for memory leaks');
		recommendations.push('Consider reducing payload size');
		score -= 15;
	}

	// Check render time
	if (metrics.renderTime && metrics.renderTime > 500) {
		issues.push(`Slow render time: ${metrics.renderTime.toFixed(2)}ms`);
		recommendations.push('Optimize component rendering');
		recommendations.push('Consider server-side caching of rendered content');
		score -= 10;
	}

	return {
		score: Math.max(0, score),
		issues,
		recommendations
	};
}

/**
 * Format performance metrics for logging
 */
export function formatMetrics(metrics: PerformanceMetrics): string {
	const parts = [
		`Duration: ${metrics.duration?.toFixed(2) || 'N/A'}ms`,
		`Cache: ${metrics.cacheHit ? 'HIT' : 'MISS'}`,
		`DB Queries: ${metrics.dbQueries || 0}`,
		`Memory: ${metrics.memoryUsage ? (metrics.memoryUsage.heapUsed / 1024 / 1024).toFixed(2) + 'MB' : 'N/A'}`
	];

	if (metrics.renderTime) {
		parts.push(`Render: ${metrics.renderTime.toFixed(2)}ms`);
	}

	return parts.join(' | ');
}

/**
 * Create a unique request ID for performance tracking
 */
export function createRequestId(): string {
	return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Performance middleware for SvelteKit
 */
export function withPerformanceMonitoring<T extends (...args: any[]) => any>(
	fn: T,
	name: string
): T {
	return ((...args: any[]) => {
		const requestId = createRequestId();
		performanceMonitor.start(requestId);

		try {
			const result = fn(...args);

			// Handle async functions
			if (result instanceof Promise) {
				return result.finally(() => {
					const metrics = performanceMonitor.end(requestId);
					if (metrics) {
						console.log(`[${name}] ${formatMetrics(metrics)}`);
						
						// Log performance issues
						const analysis = analyzePerformance(metrics);
						if (analysis.issues.length > 0) {
							console.warn(`[${name}] Performance issues:`, analysis.issues);
						}
					}
				});
			}

			// Handle sync functions
			const metrics = performanceMonitor.end(requestId);
			if (metrics) {
				console.log(`[${name}] ${formatMetrics(metrics)}`);
			}

			return result;
		} catch (error) {
			performanceMonitor.end(requestId);
			throw error;
		}
	}) as T;
}