import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { auth } from '$lib/auth/auth';
import db from '$lib/db/dbClient';

// GET /api/admin/users - Get all users
export const GET: RequestHandler = async ({ request }) => {
	try {
		// Check authentication and admin role
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user || session.user.role !== 'admin') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Get all users from Better Auth's user collection
		const usersCollection = db.collection('user');
		const users = await usersCollection
			.find({})
			.sort({ createdAt: -1 })
			.toArray();

		// Serialize users for JSON response
		const serializedUsers = users.map(user => ({
			id: user.id,
			name: user.name,
			email: user.email,
			image: user.image,
			role: user.role,
			emailVerified: user.emailVerified,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt
		}));

		return json(serializedUsers);
	} catch (error) {
		console.error('Error fetching users:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};