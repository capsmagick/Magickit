import type { RequestHandler } from './$types';
import { RBACService } from '$lib/db/rbac';
import { auth } from '$lib/auth/auth';
import db from '$lib/db/dbClient';

// GET /api/admin/audit-logs/export - Export audit logs as CSV
export const GET: RequestHandler = async ({ request, url }) => {
	try {
		// Check authentication and admin role
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user || session.user.role !== 'admin') {
			return new Response('Unauthorized', { status: 401 });
		}

		// Parse query parameters for filtering
		const userId = url.searchParams.get('userId');
		const action = url.searchParams.get('action');
		const resource = url.searchParams.get('resource');
		const success = url.searchParams.get('success');
		const dateFrom = url.searchParams.get('dateFrom');
		const dateTo = url.searchParams.get('dateTo');

		// Build filters object
		const filters: any = {};
		if (userId) filters.userId = userId;
		if (action) filters.action = action;
		if (resource) filters.resource = resource;
		if (success !== null) filters.success = success === 'true';
		if (dateFrom) filters.startDate = new Date(dateFrom);
		if (dateTo) {
			const endDate = new Date(dateTo);
			endDate.setHours(23, 59, 59, 999); // End of day
			filters.endDate = endDate;
		}

		// Get audit logs (no limit for export)
		const auditLogs = await RBACService.getAuditLogs(filters, 10000, 0);

		// Get user information
		const userIds = [...new Set(auditLogs.map(log => log.userId.toString()))];
		const usersCollection = db.collection('user');
		const users = await usersCollection
			.find({ id: { $in: userIds } })
			.toArray();

		// Create CSV content
		const csvHeaders = [
			'Timestamp',
			'User Name',
			'User Email',
			'Action',
			'Resource',
			'Resource ID',
			'Success',
			'IP Address',
			'User Agent',
			'Details'
		];

		const csvRows = auditLogs.map(log => {
			const user = users.find(u => u.id === log.userId.toString());
			return [
				new Date(log.timestamp).toISOString(),
				user?.name || 'Unknown User',
				user?.email || 'Unknown Email',
				log.action,
				log.resource,
				log.resourceId?.toString() || '',
				log.success ? 'Success' : 'Failed',
				log.ipAddress,
				log.userAgent,
				JSON.stringify(log.details)
			];
		});

		// Combine headers and rows
		const csvContent = [csvHeaders, ...csvRows]
			.map(row => row.map(field => `"${field.toString().replace(/"/g, '""')}"`).join(','))
			.join('\n');

		// Return CSV file
		const filename = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
		
		return new Response(csvContent, {
			headers: {
				'Content-Type': 'text/csv',
				'Content-Disposition': `attachment; filename="${filename}"`
			}
		});
	} catch (error) {
		console.error('Error exporting audit logs:', error);
		return new Response('Internal server error', { status: 500 });
	}
};