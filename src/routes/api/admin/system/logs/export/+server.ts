import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
  try {
    // Get query parameters for filtering
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

    // Generate mock CSV data - in a real implementation, you would query your logging system
    const csvData = generateLogCSV(level, search, dateRange);

    return new Response(csvData, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="system-logs-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  } catch (error) {
    console.error('Error exporting logs:', error);
    
    return json({
      success: false,
      message: 'Failed to export logs',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};

function generateLogCSV(level: string, search: string, dateRange: { start: Date; end: Date }): string {
  const headers = ['Timestamp', 'Level', 'Source', 'Message', 'User ID', 'Request ID', 'Duration (ms)', 'Status Code'];
  
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

  const rows = [headers.join(',')];
  
  // Generate sample log entries
  for (let i = 0; i < 1000; i++) {
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
    
    const userId = Math.random() > 0.7 ? `user_${Math.floor(Math.random() * 100)}` : '';
    const requestId = `req_${Math.random().toString(36).substr(2, 9)}`;
    const duration = Math.floor(Math.random() * 1000);
    const statusCode = Math.random() > 0.9 ? 500 : Math.random() > 0.8 ? 404 : 200;
    
    const row = [
      timestamp.toISOString(),
      logLevel,
      source,
      `"${message}"`, // Wrap in quotes to handle commas in messages
      userId,
      requestId,
      duration.toString(),
      statusCode.toString()
    ];
    
    rows.push(row.join(','));
  }
  
  return rows.join('\n');
}