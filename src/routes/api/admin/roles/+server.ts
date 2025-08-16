import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { rolesCollection, permissionsCollection } from '$lib/db/collections';
import { RBACService } from '$lib/db/rbac';
import { ObjectId } from 'mongodb';
import { auth } from '$lib/auth/auth';

// GET /api/admin/roles - Get all roles
export const GET: RequestHandler = async ({ request }) => {
	try {
		// Check authentication and admin role
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user || session.user.role !== 'admin') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Get all roles with populated permissions
		const roles = await rolesCollection.find({}).sort({ createdAt: -1 }).toArray();
		
		// Convert ObjectIds to strings for JSON serialization
		const serializedRoles = roles.map(role => ({
			...role,
			_id: role._id.toString(),
			permissions: role.permissions.map(p => p.toString())
		}));

		return json(serializedRoles);
	} catch (error) {
		console.error('Error fetching roles:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// POST /api/admin/roles - Create a new role
export const POST: RequestHandler = async ({ request }) => {
	try {
		// Check authentication and admin role
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user || session.user.role !== 'admin') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { name, description, permissions } = await request.json();

		// Validate required fields
		if (!name || !description) {
			return json({ error: 'Name and description are required' }, { status: 400 });
		}

		// Check if role name already exists
		const existingRole = await rolesCollection.findOne({ name });
		if (existingRole) {
			return json({ error: 'Role name already exists' }, { status: 400 });
		}

		// Validate permissions exist
		const permissionIds = permissions.map((id: string) => new ObjectId(id));
		const validPermissions = await permissionsCollection.find({ 
			_id: { $in: permissionIds } 
		}).toArray();

		if (validPermissions.length !== permissionIds.length) {
			return json({ error: 'Some permissions are invalid' }, { status: 400 });
		}

		// Create the role using RBACService
		const roleId = await RBACService.createRole(
			name,
			description,
			permissions,
			session.user.id
		);

		if (!roleId) {
			return json({ error: 'Failed to create role' }, { status: 500 });
		}

		// Get the created role
		const createdRole = await rolesCollection.findOne({ _id: roleId });
		if (!createdRole) {
			return json({ error: 'Role created but not found' }, { status: 500 });
		}

		// Serialize for JSON response
		const serializedRole = {
			...createdRole,
			_id: createdRole._id.toString(),
			permissions: createdRole.permissions.map(p => p.toString())
		};

		return json(serializedRole, { status: 201 });
	} catch (error) {
		console.error('Error creating role:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};