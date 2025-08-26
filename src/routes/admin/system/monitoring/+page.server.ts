import { HealthMonitoringService } from '$lib/services/health';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  try {
    // Get historical data for the last hour
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 60 * 60 * 1000); // 1 hour ago

    const [
      systemStatus,
      metricsHistory,
      alertStatistics,
      latestMetrics
    ] = await Promise.all([
      HealthMonitoringService.getSystemStatus(),
      HealthMonitoringService.getMetricsHistory(startDate, endDate, '5m', 50),
      HealthMonitoringService.getAlertStatistics(startDate, endDate),
      HealthMonitoringService.getLatestMetrics()
    ]);

    return {
      systemStatus,
      metricsHistory,
      alertStatistics,
      latestMetrics,
      timeRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error loading monitoring data:', error);
    
    return {
      systemStatus: {
        status: 'critical' as const,
        alerts: [],
        uptime: 0,
        lastCheck: new Date()
      },
      metricsHistory: [],
      alertStatistics: {
        overall: {
          total: 0,
          critical: 0,
          error: 0,
          warning: 0,
          info: 0,
          acknowledged: 0,
          resolved: 0,
          active: 0
        },
        byCategory: []
      },
      latestMetrics: null,
      timeRange: {
        start: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString()
      },
      timestamp: new Date().toISOString(),
      error: 'Failed to load monitoring data'
    };
  }
};