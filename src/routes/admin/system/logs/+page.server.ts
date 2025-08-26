import { HealthMonitoringService } from '$lib/services/health';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
  try {
    // Get query parameters for filtering
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const level = url.searchParams.get('level') || 'all';
    const search = url.searchParams.get('search') || '';
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    // Set default date range (last 24 hours)
    const defaultEndDate = new Date();
    const defaultStartDate = new Date(defaultEndDate.getTime() - 24 * 60 * 60 * 1000);

    const dateRange = {
      start: startDate ? new Date(startDate) : defaultStartDate,
      end: endDate ? new Date(endDate) : defaultEndDate
    };

    const [
      systemStats,
      metricsHistory,
      alertStatistics,
      performanceMetrics
    ] = await Promise.all([
      HealthMonitoringService.getSystemStatistics(),
      HealthMonitoringService.getMetricsHistory(dateRange.start, dateRange.end, '1h', limit),
      HealthMonitoringService.getAlertStatistics(dateRange.start, dateRange.end),
      HealthMonitoringService.getAggregatedMetrics(dateRange.start, dateRange.end, '1h')
    ]);

    // Mock log entries - in a real implementation, you would fetch from your logging system
    const mockLogs = generateMockLogs(page, limit, level, search, dateRange);

    return {
      logs: mockLogs,
      systemStats,
      metricsHistory,
      alertStatistics,
      performanceMetrics,
      filters: {
        page,
        limit,
        level,
        search,
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString()
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error loading system logs:', error);
    
    return {
      logs: {
        entries: [],
        total: 0,
        page: 1,
        totalPages: 0
      },
      systemStats: {
        totalMetrics: 0,
        totalAlerts: 0,
        activeAlerts: 0,
        criticalAlerts: 0,
        averageHealthScore: 0
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
      performanceMetrics: [],
      filters: {
        page: 1,
        limit: 50,
        level: 'all',
        search: '',
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString()
      },
      timestamp: new Date().toISOString(),
      error: 'Failed to load system logs'
    };
  }
};

// Mock log generation function
function generateMockLogs(
  page: number, 
  limit: number, 
  level: string, 
  search: string, 
  dateRange: { start: Date; end: Date }
) {
  const logLevels = ['info', 'warn', 'error', 'debug'];
  const logSources = ['application', 'database', 'auth', 'api', 'system'];
  const logMessages = [
    'User authentication successful',
    'Database connection established',
    'API request processed',
    'System metrics collected',
    'Cache invalidated',
    'File upload completed',
    'Email sent successfully',
    'Background job started',
    'Configuration updated',
    'Health check passed',
    'Database query executed',
    'User session created',
    'Permission check completed',
    'Media file processed',
    'Content published',
    'Alert threshold exceeded',
    'System backup completed',
    'Service restarted',
    'Memory usage warning',
    'Disk space low'
  ];

  const totalLogs = 1247; // Mock total count
  const totalPages = Math.ceil(totalLogs / limit);
  const startIndex = (page - 1) * limit;
  
  const entries = [];
  
  for (let i = 0; i < limit && (startIndex + i) < totalLogs; i++) {
    const timestamp = new Date(
      dateRange.start.getTime() + 
      Math.random() * (dateRange.end.getTime() - dateRange.start.getTime())
    );
    
    const logLevel = logLevels[Math.floor(Math.random() * logLevels.length)];
    const source = logSources[Math.floor(Math.random() * logSources.length)];
    const message = logMessages[Math.floor(Math.random() * logMessages.length)];
    
    // Apply level filter
    if (level !== 'all' && logLevel !== level) {
      continue;
    }
    
    // Apply search filter
    if (search && !message.toLowerCase().includes(search.toLowerCase()) && 
        !source.toLowerCase().includes(search.toLowerCase())) {
      continue;
    }
    
    entries.push({
      id: `log_${startIndex + i + 1}`,
      timestamp: timestamp.toISOString(),
      level: logLevel,
      source,
      message,
      details: {
        userId: Math.random() > 0.7 ? `user_${Math.floor(Math.random() * 100)}` : null,
        requestId: `req_${Math.random().toString(36).substr(2, 9)}`,
        duration: Math.floor(Math.random() * 1000),
        statusCode: Math.random() > 0.9 ? 500 : Math.random() > 0.8 ? 404 : 200
      }
    });
  }
  
  return {
    entries,
    total: totalLogs,
    page,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
}