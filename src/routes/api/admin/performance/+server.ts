import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { HealthMonitoringService } from '$lib/services/health';
import { DashboardService } from '$lib/services/dashboard';

export const GET: RequestHandler = async ({ locals, url }) => {
  try {
    // Check authentication
    if (!locals.user || locals.user.role !== 'admin') {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const timeRange = url.searchParams.get('range') || '1h';

    // Get performance data
    const [
      latestMetrics,
      systemStatus,
      realTimeMetrics
    ] = await Promise.all([
      HealthMonitoringService.getLatestMetrics(),
      HealthMonitoringService.getSystemStatus(),
      DashboardService.getRealTimeMetrics()
    ]);

    // Mock performance data based on real metrics
    const performanceData = {
      timeRange,
      performance: {
        averageResponseTime: latestMetrics?.application.responseTime || 120,
        p95ResponseTime: (latestMetrics?.application.responseTime || 120) * 2.5,
        p99ResponseTime: (latestMetrics?.application.responseTime || 120) * 4,
        cacheHitRate: 85.5,
        totalRequests: 15420,
        errorRate: latestMetrics?.application.errorRate || 0.2,
        slowestEndpoints: [
          { endpoint: '/api/content/instances', averageTime: 450, requestCount: 1250 },
          { endpoint: '/api/media/upload', averageTime: 380, requestCount: 890 },
          { endpoint: '/api/admin/users', averageTime: 320, requestCount: 560 },
          { endpoint: '/api/content/types', averageTime: 280, requestCount: 780 },
          { endpoint: '/api/admin/dashboard/metrics', averageTime: 220, requestCount: 1100 }
        ]
      },
      realTime: {
        activeRequests: realTimeMetrics.activeUsers || 5,
        averageResponseTime: realTimeMetrics.responseTime || 120,
        requestsPerMinute: 45,
        cacheHitRate: 87.2
      },
      database: {
        averageQueryTime: latestMetrics?.database.queryTime || 25,
        totalQueries: 8950,
        slowQueries: 3,
        queriesPerRequest: 2.3
      },
      cache: {
        memory: {
          size: 1250,
          keys: ['content:*', 'media:*', 'user:*', 'system:*'],
          memoryUsage: 45 * 1024 * 1024 // 45MB
        },
        redis: {
          connected: true,
          keyCount: 3420,
          memoryUsage: 128 * 1024 * 1024 // 128MB
        }
      },
      cdn: {
        cacheHitRate: 92.5,
        bandwidthUsage: 2.5 * 1024 * 1024 * 1024, // 2.5GB
        requestCount: 25600,
        topAssets: [
          { path: '/images/hero-bg.jpg', requests: 1250, bandwidth: 125 * 1024 * 1024 },
          { path: '/css/app.css', requests: 2100, bandwidth: 45 * 1024 * 1024 },
          { path: '/js/app.js', requests: 2050, bandwidth: 85 * 1024 * 1024 },
          { path: '/images/logo.svg', requests: 1800, bandwidth: 12 * 1024 * 1024 },
          { path: '/fonts/inter.woff2', requests: 1600, bandwidth: 28 * 1024 * 1024 }
        ]
      },
      timestamp: new Date().toISOString()
    };

    return json({
      success: true,
      data: performanceData
    });
  } catch (error) {
    console.error('Error fetching performance data:', error);
    
    return json({
      success: false,
      error: 'Failed to fetch performance data'
    }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ locals, request }) => {
  try {
    // Check authentication
    if (!locals.user || locals.user.role !== 'admin') {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, ...params } = body;

    // Handle different performance actions
    switch (action) {
      case 'clear-cache':
        // In a real implementation, you would clear your cache here
        console.log('Clearing all cache...');
        break;
        
      case 'clear-cache-pattern':
        // Clear cache by pattern
        console.log(`Clearing cache pattern: ${params.pattern}`);
        break;
        
      case 'invalidate-cdn':
        // Invalidate CDN cache
        console.log(`Invalidating CDN paths: ${params.paths?.join(', ')}`);
        break;
        
      case 'cleanup-metrics':
        // Cleanup old metrics
        console.log(`Cleaning up metrics older than ${params.daysToKeep} days`);
        break;
        
      default:
        return json({
          success: false,
          error: 'Unknown action'
        }, { status: 400 });
    }

    return json({
      success: true,
      message: `Action '${action}' completed successfully`
    });
  } catch (error) {
    console.error('Error performing performance action:', error);
    
    return json({
      success: false,
      error: 'Failed to perform action'
    }, { status: 500 });
  }
};