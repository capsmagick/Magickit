import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { auth } from '$lib/auth/auth';
import { DashboardService } from '$lib/services/dashboard';
import { userManagementService } from '$lib/services/user';

// GET /api/admin/dashboard/enhanced - Get enhanced dashboard data with real user metrics
export const GET: RequestHandler = async ({ request }) => {
	try {
		// Check authentication and admin role
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user || session.user.role !== 'admin') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Get comprehensive dashboard data
		const [
			dashboardMetrics,
			userStatistics,
			systemStatus,
			quickStats,
			statusIndicators
		] = await Promise.all([
			DashboardService.getDashboardMetrics(),
			DashboardService.getUserStatistics(),
			DashboardService.getSystemStatus(),
			DashboardService.getQuickStats(),
			DashboardService.getSystemStatusIndicators()
		]);

		// Log the access
		await userManagementService.logUserActivity(
			session.user.id,
			'dashboard_accessed',
			{},
			{
				ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
				userAgent: request.headers.get('user-agent') || 'unknown'
			}
		);

		return json({
			metrics: dashboardMetrics,
			userStatistics,
			systemStatus,
			quickStats,
			statusIndicators,
			timestamp: new Date()
		});
	} catch (error) {
		console.error('Error fetching enhanced dashboard data:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};