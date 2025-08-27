import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { auth } from '$lib/auth/auth';
import { userManagementService } from '$lib/services/user';

// GET /api/admin/users/[userId]/activity - Get user activity history
export const GET: RequestHandler = async ({ request, params, url }) => {
	try {
		// Check authentication and admin role
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user || session.user.role !== 'admin') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { userId } = params;
		if (!userId) {
			return json({ error: 'User ID is required' }, { status: 400 });
		}

		const limit = parseInt(url.searchParams.get('limit') || '50');

		// Get user activity history
		const activities = await userManagementService.getUserActivityHistory(userId, limit);

		// Log the access
		await userManagementService.logUserActivity(
			session.user.id,
			'user_activity_accessed',
			{ targetUserId: userId },
			{
				ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
				userAgent: request.headers.get('user-agent') || 'unknown'
			}
		);

		return json(activities);
	} catch (error) {
		console.error('Error fetching user activity:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};