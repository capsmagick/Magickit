import { HealthMonitoringService } from '$lib/services/health';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  try {
    const [systemStatus, systemStats, latestMetrics] = await Promise.all([
      HealthMonitoringService.getSystemStatus(),
      HealthMonitoringService.getSystemStatistics(),
      HealthMonitoringService.getLatestMetrics()
    ]);

    return {
      systemStatus,
      systemStats,
      latestMetrics,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error loading system status:', error);
    
    // Return fallback data if there's an error
    return {
      systemStatus: {
        status: 'critical' as const,
        alerts: [],
        uptime: 0,
        lastCheck: new Date()
      },
      systemStats: {
        totalMetrics: 0,
        totalAlerts: 0,
        activeAlerts: 0,
        criticalAlerts: 0,
        averageHealthScore: 0
      },
      latestMetrics: null,
      timestamp: new Date().toISOString(),
      error: 'Failed to load system status'
    };
  }
};