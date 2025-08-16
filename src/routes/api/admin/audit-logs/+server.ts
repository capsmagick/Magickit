import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { RBACService } from '$lib/db/rbac';
import { auth } from '$lib/auth/auth';
import db from '$lib/db/dbClient';

// GET /api/admin/audit-logs - Get audit logs with filtering
export const GET: RequestHandler = async ({ request, url }) => {
	try {
		// Check authentication and admin role
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user || session.user.role !== 'admin') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Parse query parameters for filtering
		const userId = url.searchParams.get('userId');
		const action = url.searchParams.get('action');
		const resource = url.searchParams.get('resource');
		const success = url.searchParams.get('success');
		const startDate = url.searchParams.get('startDate');
		const endDate = url.searchParams.get('endDate');
		const limit = parseInt(url.searchParams.get('limit') || '100');
		const skip = parseInt(url.searchParams.get('skip') || '0');

		// Build filters object
		const filters: any = {};
		if (userId) filters.userId = userId;
		if (action) filters.action = action;
		if (resource) filters.resource = resource;
		if (success !== null) filters.success = success === 'true';
		if (startDate) filters.startDate = new Date(startDate);
		if (endDate) filters.endDate = new Date(endDate);

		// Get audit logs using RBACService
		const auditLogs = await RBACService.getAuditLogs(filters, limit, skip);

		// Get user information for all user IDs in the logs
		const userIds = [...new Set(auditLogs.map(log => log.userId.toString()))];
		const usersCollection = db.collection('user');
		const users = await usersCollection
			.find({ id: { $in: userIds } })
			.toArray();

		// Enhance logs with user information
		const enhancedLogs = auditLogs.map(log => ({
			...log,
			_id: log._id.toString(),
			userId: log.userId.toString(),
			resourceId: log.resourceId?.toString(),
			userName: users.find(u => u.id === log.userId.toString())?.name || 'Unknown User'
		}));

		return json(enhancedLogs);
	} catch (error) {
		console.error('Error fetching audit logs:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};