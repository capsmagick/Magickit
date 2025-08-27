import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { auth } from '$lib/auth/auth';
import { userManagementService } from '$lib/services/user';

// POST /api/admin/users/bulk - Bulk operations on users
export const POST: RequestHandler = async ({ request }) => {
	try {
		// Check authentication and admin role
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user || session.user.role !== 'admin') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { action, userIds, data } = await request.json();

		if (!action || !userIds || !Array.isArray(userIds)) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		let result;

		switch (action) {
			case 'update-preferences':
				if (!data || !data.preferences) {
					return json({ error: 'Preferences data is required' }, { status: 400 });
				}
				result = await userManagementService.bulkUpdateUserPreferences(
					userIds,
					data.preferences,
					session.user.id
				);
				break;

			default:
				return json({ error: 'Invalid action' }, { status: 400 });
		}

		// Log the bulk operation
		await userManagementService.logUserActivity(
			session.user.id,
			'bulk_operation_performed',
			{ action, userIds, data, result },
			{
				ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
				userAgent: request.headers.get('user-agent') || 'unknown'
			}
		);

		return json({ success: true, result });
	} catch (error) {
		console.error('Error performing bulk operation:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};