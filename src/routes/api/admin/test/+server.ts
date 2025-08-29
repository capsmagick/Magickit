import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { auth } from '$lib/auth/auth';
import db from '$lib/db/dbClient';

// GET /api/admin/test - Test admin API functionality
export const GET: RequestHandler = async ({ request }) => {
	try {
		// Check authentication
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user) {
			return json({ error: 'Not authenticated' }, { status: 401 });
		}

		if (session.user.role !== 'admin') {
			return json({ error: 'Not authorized - admin role required' }, { status: 403 });
		}

		// Test database connection
		await db.admin().ping();

		// Test collections
		const collections = await db.listCollections().toArray();
		const collectionNames = collections.map(c => c.name);

		// Test user collection
		const userCount = await db.collection('user').countDocuments();
		const users = await db.collection('user').find({}).limit(5).toArray();

		// Test other collections
		const roleCount = await db.collection('roles').countDocuments();
		const permissionCount = await db.collection('permissions').countDocuments();
		const userRoleCount = await db.collection('userRoles').countDocuments();

		return json({
			success: true,
			user: {
				id: session.user.id,
				name: session.user.name,
				email: session.user.email,
				role: session.user.role
			},
			database: {
				connected: true,
				collections: collectionNames,
				counts: {
					users: userCount,
					roles: roleCount,
					permissions: permissionCount,
					userRoles: userRoleCount
				}
			},
			sampleUsers: users.map(u => ({
				id: u.id,
				name: u.name,
				email: u.email,
				role: u.role
			}))
		});
	} catch (error) {
		console.error('Admin test error:', error);
		return json({ 
			success: false, 
			error: error instanceof Error ? error.message : 'Unknown error' 
		}, { status: 500 });
	}
};