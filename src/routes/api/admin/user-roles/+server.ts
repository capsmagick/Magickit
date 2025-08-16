import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { userRolesCollection } from '$lib/db/collections';
import { RBACService } from '$lib/db/rbac';
import { auth } from '$lib/auth/auth';

// GET /api/admin/user-roles - Get all user role assignments
export const GET: RequestHandler = async ({ request }) => {
	try {
		// Check authentication and admin role
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user || session.user.role !== 'admin') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Get all user role assignments
		const userRoles = await userRolesCollection
			.find({})
			.sort({ assignedAt: -1 })
			.toArray();

		// Serialize for JSON response
		const serializedUserRoles = userRoles.map(userRole => ({
			...userRole,
			_id: userRole._id.toString(),
			userId: userRole.userId.toString(),
			roleId: userRole.roleId.toString(),
			assignedBy: userRole.assignedBy.toString()
		}));

		return json(serializedUserRoles);
	} catch (error) {
		console.error('Error fetching user roles:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// POST /api/admin/user-roles - Assign a role to a user
export const POST: RequestHandler = async ({ request }) => {
	try {
		// Check authentication and admin role
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user || session.user.role !== 'admin') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { userId, roleId, expiresAt } = await request.json();

		// Validate required fields
		if (!userId || !roleId) {
			return json({ error: 'User ID and Role ID are required' }, { status: 400 });
		}

		// Parse expiration date if provided
		let expirationDate: Date | undefined;
		if (expiresAt) {
			expirationDate = new Date(expiresAt);
			if (isNaN(expirationDate.getTime())) {
				return json({ error: 'Invalid expiration date' }, { status: 400 });
			}
		}

		// Assign the role using RBACService
		const success = await RBACService.assignRole(
			userId,
			roleId,
			session.user.id,
			expirationDate
		);

		if (!success) {
			return json({ error: 'Failed to assign role or role already assigned' }, { status: 400 });
		}

		return json({ message: 'Role assigned successfully' }, { status: 201 });
	} catch (error) {
		console.error('Error assigning role:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};