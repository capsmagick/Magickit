import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { userRolesCollection } from '$lib/db/collections';
import { RBACService } from '$lib/db/rbac';
import { ObjectId } from 'mongodb';
import { auth } from '$lib/auth/auth';

// DELETE /api/admin/user-roles/[id] - Remove a role assignment
export const DELETE: RequestHandler = async ({ request, params }) => {
	try {
		// Check authentication and admin role
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user || session.user.role !== 'admin') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { id } = params;

		// Validate ObjectId
		if (!ObjectId.isValid(id)) {
			return json({ error: 'Invalid user role assignment ID' }, { status: 400 });
		}

		// Get the user role assignment
		const userRole = await userRolesCollection.findOne({ _id: new ObjectId(id) });
		if (!userRole) {
			return json({ error: 'User role assignment not found' }, { status: 404 });
		}

		// Remove the role using RBACService
		const success = await RBACService.removeRole(
			userRole.userId.toString(),
			userRole.roleId.toString(),
			session.user.id
		);

		if (!success) {
			return json({ error: 'Failed to remove role assignment' }, { status: 500 });
		}

		return json({ message: 'Role assignment removed successfully' });
	} catch (error) {
		console.error('Error removing role assignment:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};