import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { DashboardService } from '$lib/services/dashboard';

export const GET: RequestHandler = async ({ locals }) => {
  try {
    // Check authentication
    if (!locals.user || locals.user.role !== 'admin') {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get real-time metrics
    const realTimeMetrics = await DashboardService.getRealTimeMetrics();
    
    return json({
      success: true,
      data: realTimeMetrics
    });
  } catch (error) {
    console.error('Error fetching real-time metrics:', error);
    
    return json({
      success: false,
      error: 'Failed to fetch metrics',
      data: {
        timestamp: new Date(),
        activeUsers: 0,
        systemLoad: 0,
        responseTime: 0,
        errorRate: 0
      }
    }, { status: 500 });
  }
};