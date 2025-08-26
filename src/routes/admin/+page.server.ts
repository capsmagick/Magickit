import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { DashboardService } from '$lib/services/dashboard';
import { HealthMonitoringService } from '$lib/services/health';

export const load: PageServerLoad = async ({ locals }) => {
  // Check if user is authenticated and has admin role
  if (!locals.user) {
    throw redirect(302, '/login?returnTo=/admin');
  }
  
  if (locals.user.role !== 'admin') {
    throw redirect(302, '/login?returnTo=/admin');
  }

  try {
    // Load real dashboard data
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

    return {
      user: locals.user,
      dashboardMetrics,
      quickStats,
      systemStatusIndicators,
      userStatistics,
      systemStatus,
      // Include timestamp for real-time updates
      loadedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error loading admin dashboard data:', error);
    
    // Return fallback data if there's an error
    return {
      user: locals.user,
      dashboardMetrics: {
        totalUsers: 0,
        activeUsers: 0,
        systemHealth: 'critical',
        securityAlerts: 0,
        totalSessions: 0,
        newUsersToday: 0,
        systemUptime: 0,
        databaseStatus: 'unhealthy',
        responseTime: 0,
        errorRate: 0
      },
      quickStats: [],
      systemStatusIndicators: [],
      userStatistics: {
        total: 0,
        active: 0,
        newToday: 0,
        newThisWeek: 0,
        newThisMonth: 0,
        byRole: [],
        recentActivity: []
      },
      systemStatus: {
        status: 'critical' as const,
        uptime: 0,
        lastCheck: new Date(),
        services: {
          database: 'critical' as const,
          storage: 'critical' as const,
          cache: 'critical' as const,
          email: 'critical' as const
        },
        alerts: []
      },
      loadedAt: new Date().toISOString(),
      error: 'Failed to load dashboard data'
    };
  }
};