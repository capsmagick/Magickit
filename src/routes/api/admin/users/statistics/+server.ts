import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { auth } from '$lib/auth/auth';
import { userManagementService } from '$lib/services/user';

// GET /api/admin/users/statistics - Get user statistics
export const GET: RequestHandler = async ({ request }) => {
	try {
		// Check authentication and admin role
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user || session.user.role !== 'admin') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Get user statistics
		const statistics = await userManagementService.getUserStatistics();

		// Log the access
		await userManagementService.logUserActivity(
			session.user.id,
			'user_statistics_accessed',
			{},
			{
				ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
				userAgent: request.headers.get('user-agent') || 'unknown'
			}
		);

		return json(statistics);
	} catch (error) {
		console.error('Error fetching user statistics:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};