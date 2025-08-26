import { json } from '@sveltejs/kit';
import { HealthMonitoringService } from '$lib/services/health';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    // Force a metrics collection cycle
    const metrics = await HealthMonitoringService.forceMetricsCollection();
    
    return json({
      success: true,
      message: 'Metrics collection completed successfully',
      metrics: {
        timestamp: metrics.timestamp,
        cpu: metrics.cpu.usage,
        memory: metrics.memory.percentage,
        disk: metrics.disk.percentage
      }
    });
  } catch (error) {
    console.error('Error forcing metrics collection:', error);
    
    return json({
      success: false,
      message: 'Failed to collect metrics',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};