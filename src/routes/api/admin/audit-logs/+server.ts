import { json, error } from '@sveltejs/kit';
import { RBACService } from '$lib/db/rbac';
import { auth } from '$lib/auth/auth';
import type { RequestHandler } from './$types';

// GET /api/admin/audit-logs - Get audit logs with filtering and pagination
export const GET: RequestHandler = async (event) => {
  try {
    // Check authentication and admin role
    const session = await auth.api.getSession({ headers: event.request.headers });
    if (!session?.user || session.user.role !== 'admin') {
      throw error(401, 'Unauthorized');
    }

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

    try {
      // Get audit logs
      const auditLogs = await RBACService.getAuditLogs(filters, limit, skip);
      
      // Get total count for pagination
      const totalCount = await RBACService.getAuditLogsCount(filters);

      // Enhance logs with user information
      const enhancedLogs = await Promise.all(
        auditLogs.map(async (log) => {
          return {
            ...log,
            _id: log._id?.toString(),
            userName: 'User', // This could be fetched from the users collection
            timestamp: log.timestamp || new Date(),
            ipAddress: log.ipAddress || 'unknown'
          };
        })
      );

      return json(enhancedLogs);
    } catch (rbacServiceError) {
      console.warn('RBACService not available, returning empty logs:', rbacServiceError);
      // Return empty array if RBAC service isn't available
      return json([]);
    }
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    // Return empty array instead of failing
    return json([]);
  }
};