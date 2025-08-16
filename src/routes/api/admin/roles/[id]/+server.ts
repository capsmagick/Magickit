import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { rolesCollection, permissionsCollection } from '$lib/db/collections';
import { RBACService } from '$lib/db/rbac';
import { ObjectId } from 'mongodb';
import { auth } from '$lib/auth/auth';

// PUT /api/admin/roles/[id] - Update a role
export const PUT: RequestHandler = async ({ request, params }) => {
	try {
		// Check authentication and admin role
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user || session.user.role !== 'admin') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { id } = params;
		const { name, description, permissions } = await request.json();

		// Validate ObjectId
		if (!ObjectId.isValid(id)) {
			return json({ error: 'Invalid role ID' }, { status: 400 });
		}

		// Validate required fields
		if (!name || !description) {
			return json({ error: 'Name and description are required' }, { status: 400 });
		}

		// Check if role exists
		const existingRole = await rolesCollection.findOne({ _id: new ObjectId(id) });
		if (!existingRole) {
			return json({ error: 'Role not found' }, { status: 404 });
		}

		// Don't allow updating system roles
		if (existingRole.isSystemRole) {
			return json({ error: 'Cannot update system roles' }, { status: 400 });
		}

		// Check if new name conflicts with existing role (excluding current role)
		if (name !== existingRole.name) {
			const nameConflict = await rolesCollection.findOne({ 
				name, 
				_id: { $ne: new ObjectId(id) } 
			});
			if (nameConflict) {
				return json({ error: 'Role name already exists' }, { status: 400 });
			}
		}

		// Validate permissions exist
		const permissionIds = permissions.map((permId: string) => new ObjectId(permId));
		const validPermissions = await permissionsCollection.find({ 
			_id: { $in: permissionIds } 
		}).toArray();

		if (validPermissions.length !== permissionIds.length) {
			return json({ error: 'Some permissions are invalid' }, { status: 400 });
		}

		// Update the role using RBACService
		const success = await RBACService.updateRole(
			id,
			{ name, description, permissions: permissions },
			session.user.id
		);

		if (!success) {
			return json({ error: 'Failed to update role' }, { status: 500 });
		}

		// Get the updated role
		const updatedRole = await rolesCollection.findOne({ _id: new ObjectId(id) });
		if (!updatedRole) {
			return json({ error: 'Role updated but not found' }, { status: 500 });
		}

		// Serialize for JSON response
		const serializedRole = {
			...updatedRole,
			_id: updatedRole._id.toString(),
			permissions: updatedRole.permissions.map(p => p.toString())
		};

		return json(serializedRole);
	} catch (error) {
		console.error('Error updating role:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// DELETE /api/admin/roles/[id] - Delete a role
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
			return json({ error: 'Invalid role ID' }, { status: 400 });
		}

		// Check if role exists
		const existingRole = await rolesCollection.findOne({ _id: new ObjectId(id) });
		if (!existingRole) {
			return json({ error: 'Role not found' }, { status: 404 });
		}

		// Don't allow deleting system roles
		if (existingRole.isSystemRole) {
			return json({ error: 'Cannot delete system roles' }, { status: 400 });
		}

		// Delete the role using RBACService
		const success = await RBACService.deleteRole(id, session.user.id);

		if (!success) {
			return json({ error: 'Failed to delete role' }, { status: 500 });
		}

		return json({ message: 'Role deleted successfully' });
	} catch (error) {
		console.error('Error deleting role:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};