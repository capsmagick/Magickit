import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { DashboardService } from '$lib/services/dashboard';

export const POST: RequestHandler = async ({ locals }) => {
  try {
    // Check authentication
    if (!locals.user || locals.user.role !== 'admin') {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get fresh dashboard data
    const [
      dashboardMetrics,
      quickStats,
      systemStatusIndicators,
      userStatistics,
      systemStatus
    ] = await Promise.all([
      DashboardService.getDashboardMetrics(),
      DashboardService.getQuickStats(),
      DashboardService.getSystemStatusIndicators(),
      DashboardService.getUserStatistics(),
      DashboardService.getSystemStatus()
    ]);

    return json({
      success: true,
      data: {
        dashboardMetrics,
        quickStats,
        systemStatusIndicators,
        userStatistics,
        systemStatus,
        loadedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error refreshing dashboard data:', error);
    
    return json({
      success: false,
      error: 'Failed to refresh dashboard data'
    }, { status: 500 });
  }
};