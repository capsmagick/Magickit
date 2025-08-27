import { json, error } from '@sveltejs/kit';
import { RBACService } from '$lib/db/rbac';
import { requirePermission } from '$lib/auth/rbac-middleware';
import type { RequestHandler } from './$types';

// GET /api/admin/audit-logs - Get audit logs with filtering and pagination
export const GET: RequestHandler = async (event) => {
  // Check permission
  await requirePermission('audit', 'read')(event);

  try {
    const url = new URL(event.request.url);
    const params = url.searchParams;

    // Parse pagination parameters
    const page = parseInt(params.get('page') || '1');
    const limit = parseInt(params.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Parse filter parameters
    const filters: any = {};
    
    if (params.get('userId')) {
      filters.userId = params.get('userId');
    }
    
    if (params.get('action')) {
      filters.action = params.get('action');
    }
    
    if (params.get('resource')) {
      filters.resource = params.get('resource');
    }
    
    if (params.get('success')) {
      filters.success = params.get('success') === 'true';
    }
    
    if (params.get('startDate')) {
      filters.startDate = new Date(params.get('startDate')!);
    }
    
    if (params.get('endDate')) {
      filters.endDate = new Date(params.get('endDate')!);
    }

    // Get audit logs
    const auditLogs = await RBACService.getAuditLogs(filters, limit, skip);
    
    // Get total count for pagination
    const totalCount = await RBACService.getAuditLogsCount(filters);

    // Enhance logs with user information
    const enhancedLogs = await Promise.all(
      auditLogs.map(async (log) => {
        // You might want to fetch user information here
        // For now, we'll just return the log as is
        return {
          ...log,
          userName: 'User', // This could be fetched from the users collection
        };
      })
    );

    return json({
      logs: enhancedLogs,
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    throw error(500, 'Failed to fetch audit logs');
  }
};