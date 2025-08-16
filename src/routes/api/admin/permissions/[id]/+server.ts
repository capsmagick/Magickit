import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { permissionsCollection, rolesCollection } from '$lib/db/collections';
import { auth } from '$lib/auth/auth';
import { ObjectId } from 'mongodb';

// PUT /api/admin/permissions/[id] - Update a permission
export const PUT: RequestHandler = async ({ request, params }) => {
	try {
		// Check authentication and admin role
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user || session.user.role !== 'admin') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { id } = params;
		const { name, resource, action, description } = await request.json();

		// Validate ObjectId
		if (!ObjectId.isValid(id)) {
			return json({ error: 'Invalid permission ID' }, { status: 400 });
		}

		// Validate required fields
		if (!name || !resource || !action || !description) {
			return json({ error: 'All fields are required' }, { status: 400 });
		}

		// Check if permission exists
		const existingPermission = await permissionsCollection.findOne({ _id: new ObjectId(id) });
		if (!existingPermission) {
			return json({ error: 'Permission not found' }, { status: 404 });
		}

		// Check if new resource/action combination conflicts with existing permission (excluding current permission)
		if (resource !== existingPermission.resource || action !== existingPermission.action) {
			const conflict = await permissionsCollection.findOne({ 
				resource, 
				action,
				_id: { $ne: new ObjectId(id) } 
			});
			if (conflict) {
				return json({ error: 'Permission with this resource and action already exists' }, { status: 400 });
			}
		}

		// Update the permission
		const updateData = {
			name,
			resource,
			action,
			description
		};

		const result = await permissionsCollection.updateOne(
			{ _id: new ObjectId(id) },
			{ $set: updateData }
		);

		if (result.modifiedCount === 0) {
			return json({ error: 'Failed to update permission' }, { status: 500 });
		}

		// Get the updated permission
		const updatedPermission = await permissionsCollection.findOne({ _id: new ObjectId(id) });
		if (!updatedPermission) {
			return json({ error: 'Permission updated but not found' }, { status: 500 });
		}

		// Serialize for JSON response
		const serializedPermission = {
			...updatedPermission,
			_id: updatedPermission._id.toString()
		};

		return json(serializedPermission);
	} catch (error) {
		console.error('Error updating permission:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// DELETE /api/admin/permissions/[id] - Delete a permission
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
			return json({ error: 'Invalid permission ID' }, { status: 400 });
		}

		// Check if permission exists
		const existingPermission = await permissionsCollection.findOne({ _id: new ObjectId(id) });
		if (!existingPermission) {
			return json({ error: 'Permission not found' }, { status: 404 });
		}

		// Check if permission is used by any roles
		const rolesUsingPermission = await rolesCollection.find({ 
			permissions: new ObjectId(id) 
		}).toArray();

		if (rolesUsingPermission.length > 0) {
			const roleNames = rolesUsingPermission.map(role => role.name).join(', ');
			return json({ 
				error: `Cannot delete permission. It is currently used by the following roles: ${roleNames}` 
			}, { status: 400 });
		}

		// Delete the permission
		const result = await permissionsCollection.deleteOne({ _id: new ObjectId(id) });

		if (result.deletedCount === 0) {
			return json({ error: 'Failed to delete permission' }, { status: 500 });
		}

		return json({ message: 'Permission deleted successfully' });
	} catch (error) {
		console.error('Error deleting permission:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};