import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { auditLogsCollection, rolesCollection } from '$lib/db/collections';
import { ObjectId } from 'mongodb';
import { auth } from '$lib/auth/auth';
import db from '$lib/db/dbClient';

// GET /api/admin/user-roles/history/[userId] - Get role assignment history for a user
export const GET: RequestHandler = async ({ request, params }) => {
	try {
		// Check authentication and admin role
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user || session.user.role !== 'admin') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { userId } = params;

		// Get audit logs for role assignments/removals for this user
		const auditLogs = await auditLogsCollection
			.find({
				$or: [
					{ resourceId: new ObjectId(userId) },
					{ userId: new ObjectId(userId) }
				],
				action: { $in: ['role_assigned', 'role_removed'] },
				success: true
			})
			.sort({ timestamp: -1 })
			.toArray();

		// Get user information for assignedBy users
		const usersCollection = db.collection('user');
		const assignedByIds = [...new Set(auditLogs.map(log => log.userId.toString()))];
		const assignedByUsers = await usersCollection
			.find({ id: { $in: assignedByIds } })
			.toArray();

		// Get role information
		const roleIds = auditLogs
			.map(log => log.details.roleId)
			.filter(Boolean)
			.map(id => new ObjectId(id));
		
		const roles = await rolesCollection
			.find({ _id: { $in: roleIds } })
			.toArray();

		// Build history entries
		const history = auditLogs.map(log => {
			const assignedByUser = assignedByUsers.find(u => u.id === log.userId.toString());
			const role = roles.find(r => r._id.toString() === log.details.roleId);

			return {
				id: log._id.toString(),
				action: log.action === 'role_assigned' ? 'assigned' : 'removed',
				roleName: role?.name || 'Unknown Role',
				roleId: log.details.roleId,
				assignedByName: assignedByUser?.name || 'Unknown User',
				assignedById: log.userId.toString(),
				timestamp: log.timestamp,
				expiresAt: log.details.expiresAt,
				details: log.details
			};
		});

		return json(history);
	} catch (error) {
		console.error('Error fetching role assignment history:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};