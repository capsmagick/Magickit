import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { RBACService } from '$lib/db/rbac';
import { auth } from '$lib/auth/auth';

// POST /api/admin/user-roles/bulk - Bulk assign roles to multiple users
export const POST: RequestHandler = async ({ request }) => {
	try {
		// Check authentication and admin role
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user || session.user.role !== 'admin') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { userIds, roleId, expiresAt } = await request.json();

		// Validate required fields
		if (!userIds || !Array.isArray(userIds) || userIds.length === 0 || !roleId) {
			return json({ error: 'User IDs array and Role ID are required' }, { status: 400 });
		}

		// Parse expiration date if provided
		let expirationDate: Date | undefined;
		if (expiresAt) {
			expirationDate = new Date(expiresAt);
			if (isNaN(expirationDate.getTime())) {
				return json({ error: 'Invalid expiration date' }, { status: 400 });
			}
		}

		// Assign roles to all users
		const results = await Promise.allSettled(
			userIds.map(userId => 
				RBACService.assignRole(userId, roleId, session.user.id, expirationDate)
			)
		);

		// Count successful assignments
		const successCount = results.filter(result => 
			result.status === 'fulfilled' && result.value === true
		).length;

		const failureCount = results.length - successCount;

		if (successCount === 0) {
			return json({ error: 'Failed to assign role to any users' }, { status: 400 });
		}

		let message = `Role assigned to ${successCount} users successfully`;
		if (failureCount > 0) {
			message += ` (${failureCount} assignments failed or were already assigned)`;
		}

		return json({ 
			message,
			successCount,
			failureCount 
		}, { status: 201 });
	} catch (error) {
		console.error('Error bulk assigning roles:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};