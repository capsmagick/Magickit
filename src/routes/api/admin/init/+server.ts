import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { auth } from '$lib/auth/auth';
import { initializeDatabase } from '$lib/db/init';
import { ObjectId } from 'mongodb';
import { 
	rolesCollection, 
	permissionsCollection, 
	userRolesCollection 
} from '$lib/db/collections';

// POST /api/admin/init - Initialize admin system with basic data
export const POST: RequestHandler = async ({ request }) => {
	try {
		// Check authentication
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user) {
			return json({ error: 'Not authenticated' }, { status: 401 });
		}

		if (session.user.role !== 'admin') {
			return json({ error: 'Not authorized - admin role required' }, { status: 403 });
		}

		// Initialize database
		await initializeDatabase();

		// Create some basic permissions if they don't exist
		const basicPermissions = [
			{ name: 'user_read', resource: 'user', action: 'read', description: 'Read user data' },
			{ name: 'user_create', resource: 'user', action: 'create', description: 'Create new users' },
			{ name: 'user_update', resource: 'user', action: 'update', description: 'Update user data' },
			{ name: 'user_delete', resource: 'user', action: 'delete', description: 'Delete users' },
			{ name: 'role_read', resource: 'role', action: 'read', description: 'Read role data' },
			{ name: 'role_create', resource: 'role', action: 'create', description: 'Create new roles' },
			{ name: 'role_update', resource: 'role', action: 'update', description: 'Update role data' },
			{ name: 'role_delete', resource: 'role', action: 'delete', description: 'Delete roles' },
		];

		for (const perm of basicPermissions) {
			await permissionsCollection.updateOne(
				{ name: perm.name },
				{
					$setOnInsert: {
						_id: new ObjectId(),
						...perm,
						createdAt: new Date(),
						updatedAt: new Date()
					}
				},
				{ upsert: true }
			);
		}

		// Create basic roles if they don't exist
		const allPermissions = await permissionsCollection.find({}).toArray();
		const allPermissionIds = allPermissions.map(p => p._id);

		await rolesCollection.updateOne(
			{ name: 'admin' },
			{
				$setOnInsert: {
					_id: new ObjectId(),
					name: 'admin',
					description: 'System administrator with full access',
					permissions: allPermissionIds,
					isSystemRole: true,
					createdAt: new Date(),
					updatedAt: new Date()
				}
			},
			{ upsert: true }
		);

		await rolesCollection.updateOne(
			{ name: 'user' },
			{
				$setOnInsert: {
					_id: new ObjectId(),
					name: 'user',
					description: 'Regular user with basic access',
					permissions: allPermissions.filter(p => p.action === 'read').map(p => p._id),
					isSystemRole: true,
					createdAt: new Date(),
					updatedAt: new Date()
				}
			},
			{ upsert: true }
		);

		// Get counts after initialization
		const counts = {
			permissions: await permissionsCollection.countDocuments(),
			roles: await rolesCollection.countDocuments(),
			userRoles: await userRolesCollection.countDocuments()
		};

		return json({
			success: true,
			message: 'Admin system initialized successfully',
			counts
		});
	} catch (error) {
		console.error('Admin init error:', error);
		return json({ 
			success: false, 
			error: error instanceof Error ? error.message : 'Unknown error' 
		}, { status: 500 });
	}
};