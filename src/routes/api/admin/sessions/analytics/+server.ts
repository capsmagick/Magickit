import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { auth } from '$lib/auth/auth';
import { userManagementService } from '$lib/services/user';

// GET /api/admin/sessions/analytics - Get session analytics
export const GET: RequestHandler = async ({ request, url }) => {
	try {
		// Check authentication and admin role
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user || session.user.role !== 'admin') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const days = parseInt(url.searchParams.get('days') || '30');

		// Get session analytics
		const analytics = await userManagementService.getSessionAnalytics(days);

		// Log the access
		await userManagementService.logUserActivity(
			session.user.id,
			'session_analytics_accessed',
			{ days },
			{
				ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
				userAgent: request.headers.get('user-agent') || 'unknown'
			}
		);

		return json(analytics);
	} catch (error) {
		console.error('Error fetching session analytics:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};