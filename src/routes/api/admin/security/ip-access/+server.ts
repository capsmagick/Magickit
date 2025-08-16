import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { auth } from '$lib/auth/auth';
import db from '$lib/db/dbClient';
import { ObjectId } from 'mongodb';

interface IPAccessRule {
	_id: ObjectId;
	ip: string;
	description: string;
	type: 'allow' | 'block';
	status: 'active' | 'inactive';
	createdAt: Date;
	createdBy: string;
	lastUsed?: Date;
	hitCount: number;
}

interface AccessAttempt {
	_id: ObjectId;
	ip: string;
	action: 'allowed' | 'blocked';
	timestamp: Date;
	rule: string;
	userAgent: string;
	userId?: string;
}

const ipAccessRulesCollection = db.collection<IPAccessRule>('ipAccessRules');
const accessAttemptsCollection = db.collection<AccessAttempt>('accessAttempts');

// GET /api/admin/security/ip-access - Get IP access rules and recent attempts
export const GET: RequestHandler = async ({ request, url }) => {
	try {
		// Check authentication and admin role
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user || session.user.role !== 'admin') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const type = url.searchParams.get('type'); // 'rules' or 'attempts'
		const limit = parseInt(url.searchParams.get('limit') || '100');
		const skip = parseInt(url.searchParams.get('skip') || '0');

		if (type === 'attempts') {
			// Get recent access attempts
			const attempts = await accessAttemptsCollection
				.find({})
				.sort({ timestamp: -1 })
				.limit(limit)
				.skip(skip)
				.toArray();

			return json({
				attempts: attempts.map(attempt => ({
					...attempt,
					_id: attempt._id.toString()
				}))
			});
		} else {
			// Get IP access rules (default)
			const rules = await ipAccessRulesCollection
				.find({})
				.sort({ createdAt: -1 })
				.limit(limit)
				.skip(skip)
				.toArray();

			return json({
				rules: rules.map(rule => ({
					...rule,
					_id: rule._id.toString()
				}))
			});
		}
	} catch (error) {
		console.error('Error fetching IP access data:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// POST /api/admin/security/ip-access - Create new IP access rule
export const POST: RequestHandler = async ({ request }) => {
	try {
		// Check authentication and admin role
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user || session.user.role !== 'admin') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { ip, description, type } = await request.json();

		// Validate input
		if (!ip || !description || !type) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		if (!['allow', 'block'].includes(type)) {
			return json({ error: 'Invalid type. Must be allow or block' }, { status: 400 });
		}

		// Basic IP validation
		const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?:\/(?:[0-9]|[1-2][0-9]|3[0-2]))?$/;
		if (!ipRegex.test(ip)) {
			return json({ error: 'Invalid IP address or CIDR notation' }, { status: 400 });
		}

		// Check if IP rule already exists
		const existingRule = await ipAccessRulesCollection.findOne({ ip });
		if (existingRule) {
			return json({ error: 'IP rule already exists' }, { status: 409 });
		}

		// Create new rule
		const newRule: IPAccessRule = {
			_id: new ObjectId(),
			ip,
			description,
			type: type as 'allow' | 'block',
			status: 'active',
			createdAt: new Date(),
			createdBy: session.user.email || session.user.name || 'Unknown',
			hitCount: 0
		};

		await ipAccessRulesCollection.insertOne(newRule);

		return json({
			success: true,
			rule: {
				...newRule,
				_id: newRule._id.toString()
			}
		});
	} catch (error) {
		console.error('Error creating IP access rule:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// PUT /api/admin/security/ip-access - Update IP access rule
export const PUT: RequestHandler = async ({ request }) => {
	try {
		// Check authentication and admin role
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user || session.user.role !== 'admin') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { id, ip, description, type, status } = await request.json();

		if (!id) {
			return json({ error: 'Rule ID is required' }, { status: 400 });
		}

		// Build update object
		const updateData: any = {};
		if (ip) {
			// Validate IP if provided
			const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?:\/(?:[0-9]|[1-2][0-9]|3[0-2]))?$/;
			if (!ipRegex.test(ip)) {
				return json({ error: 'Invalid IP address or CIDR notation' }, { status: 400 });
			}
			updateData.ip = ip;
		}
		if (description) updateData.description = description;
		if (type && ['allow', 'block'].includes(type)) updateData.type = type;
		if (status && ['active', 'inactive'].includes(status)) updateData.status = status;

		const result = await ipAccessRulesCollection.findOneAndUpdate(
			{ _id: new ObjectId(id) },
			{ $set: updateData },
			{ returnDocument: 'after' }
		);

		if (!result) {
			return json({ error: 'Rule not found' }, { status: 404 });
		}

		return json({
			success: true,
			rule: {
				...result,
				_id: result._id.toString()
			}
		});
	} catch (error) {
		console.error('Error updating IP access rule:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// DELETE /api/admin/security/ip-access - Delete IP access rule
export const DELETE: RequestHandler = async ({ request, url }) => {
	try {
		// Check authentication and admin role
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user || session.user.role !== 'admin') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const id = url.searchParams.get('id');
		if (!id) {
			return json({ error: 'Rule ID is required' }, { status: 400 });
		}

		const result = await ipAccessRulesCollection.deleteOne({ _id: new ObjectId(id) });

		if (result.deletedCount === 0) {
			return json({ error: 'Rule not found' }, { status: 404 });
		}

		return json({ success: true });
	} catch (error) {
		console.error('Error deleting IP access rule:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};