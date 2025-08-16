import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { permissionsCollection, rolesCollection } from '$lib/db/collections';
import { auth } from '$lib/auth/auth';
import { ObjectId } from 'mongodb';
import type { Permission } from '$lib/db/models';

// GET /api/admin/permissions - Get all permissions
export const GET: RequestHandler = async ({ request }) => {
	try {
		// Check authentication and admin role
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user || session.user.role !== 'admin') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Get all permissions
		const permissions = await permissionsCollection
			.find({})
			.sort({ resource: 1, action: 1 })
			.toArray();
		
		// Convert ObjectIds to strings for JSON serialization
		const serializedPermissions = permissions.map(permission => ({
			...permission,
			_id: permission._id.toString()
		}));

		return json(serializedPermissions);
	} catch (error) {
		console.error('Error fetching permissions:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// POST /api/admin/permissions - Create a new permission
export const POST: RequestHandler = async ({ request }) => {
	try {
		// Check authentication and admin role
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user || session.user.role !== 'admin') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { name, resource, action, description } = await request.json();

		// Validate required fields
		if (!name || !resource || !action || !description) {
			return json({ error: 'All fields are required' }, { status: 400 });
		}

		// Check if permission already exists
		const existingPermission = await permissionsCollection.findOne({ 
			resource, 
			action 
		});
		if (existingPermission) {
			return json({ error: 'Permission with this resource and action already exists' }, { status: 400 });
		}

		// Create the permission
		const permission: Omit<Permission, '_id'> = {
			name,
			resource,
			action,
			description,
			createdAt: new Date()
		};

		const result = await permissionsCollection.insertOne(permission as Permission);

		// Get the created permission
		const createdPermission = await permissionsCollection.findOne({ _id: result.insertedId });
		if (!createdPermission) {
			return json({ error: 'Permission created but not found' }, { status: 500 });
		}

		// Serialize for JSON response
		const serializedPermission = {
			...createdPermission,
			_id: createdPermission._id.toString()
		};

		return json(serializedPermission, { status: 201 });
	} catch (error) {
		console.error('Error creating permission:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};