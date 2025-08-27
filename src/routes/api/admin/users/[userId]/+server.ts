import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { auth } from '$lib/auth/auth';
import { userManagementService } from '$lib/services/user';

// GET /api/admin/users/[userId] - Get user by ID with enhanced data
export const GET: RequestHandler = async ({ request, params }) => {
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

		// Get user with enhanced data
		const user = await userManagementService.getUserById(userId);
		if (!user) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		// Log the access
		await userManagementService.logUserActivity(
			session.user.id,
			'user_details_accessed',
			{ targetUserId: userId },
			{
				ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
				userAgent: request.headers.get('user-agent') || 'unknown'
			}
		);

		return json(user);
	} catch (error) {
		console.error('Error fetching user:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// PUT /api/admin/users/[userId] - Update user profile
export const PUT: RequestHandler = async ({ request, params }) => {
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

		const profileData = await request.json();

		// Update user profile
		const updatedProfile = await userManagementService.updateUserProfile(
			userId,
			profileData,
			session.user.id
		);

		return json({ success: true, profile: updatedProfile });
	} catch (error) {
		console.error('Error updating user profile:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};