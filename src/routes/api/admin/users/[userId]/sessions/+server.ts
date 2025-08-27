import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { auth } from '$lib/auth/auth';
import { userManagementService } from '$lib/services/user';

// GET /api/admin/users/[userId]/sessions - Get user sessions
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

		const limit = parseInt(url.searchParams.get('limit') || '20');

		// Get user sessions
		const sessions = await userManagementService.getUserSessions(userId, limit);

		// Log the access
		await userManagementService.logUserActivity(
			session.user.id,
			'user_sessions_accessed',
			{ targetUserId: userId },
			{
				ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
				userAgent: request.headers.get('user-agent') || 'unknown'
			}
		);

		return json(sessions);
	} catch (error) {
		console.error('Error fetching user sessions:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// DELETE /api/admin/users/[userId]/sessions - Terminate all user sessions
export const DELETE: RequestHandler = async ({ request, params }) => {
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

		// Terminate all user sessions
		const terminatedCount = await userManagementService.terminateAllUserSessions(
			userId,
			session.user.id
		);

		return json({ 
			success: true, 
			message: `Terminated ${terminatedCount} sessions`,
			terminatedCount 
		});
	} catch (error) {
		console.error('Error terminating user sessions:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};