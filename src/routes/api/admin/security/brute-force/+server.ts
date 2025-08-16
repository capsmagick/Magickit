import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { auth } from '$lib/auth/auth';
import db from '$lib/db/dbClient';
import { ObjectId } from 'mongodb';

interface BruteForceSettings {
	_id: ObjectId;
	enabled: boolean;
	maxAttempts: number;
	lockoutDuration: number;
	lockoutUnits: 'minutes' | 'hours';
	notifyAdmins: boolean;
	enableProgressiveLockout: boolean;
	progressiveMultiplier: number;
	maxLockoutDuration: number;
	maxLockoutUnits: 'minutes' | 'hours';
	enableCaptcha: boolean;
	captchaAfterAttempts: number;
	logAttempts: boolean;
	updatedAt: Date;
	updatedBy: string;
}

interface WhitelistIP {
	_id: ObjectId;
	ip: string;
	description: string;
	createdAt: Date;
	createdBy: string;
}

interface BlockedIP {
	_id: ObjectId;
	ip: string;
	attempts: number;
	lastAttempt: Date;
	blockedAt: Date;
	expiresAt: Date;
	reason: string;
	status: 'active' | 'expired' | 'manually_unblocked';
}

interface LoginAttempt {
	_id: ObjectId;
	ip: string;
	username: string;
	timestamp: Date;
	success: boolean;
	userAgent: string;
	attemptCount: number;
}

const bruteForceSettingsCollection = db.collection<BruteForceSettings>('bruteForceSettings');
const whitelistIPsCollection = db.collection<WhitelistIP>('whitelistIPs');
const blockedIPsCollection = db.collection<BlockedIP>('blockedIPs');
const loginAttemptsCollection = db.collection<LoginAttempt>('loginAttempts');

// GET /api/admin/security/brute-force - Get brute force protection data
export const GET: RequestHandler = async ({ request, url }) => {
	try {
		// Check authentication and admin role
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user || session.user.role !== 'admin') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const type = url.searchParams.get('type'); // 'settings', 'whitelist', 'blocked', 'attempts'
		const limit = parseInt(url.searchParams.get('limit') || '100');
		const skip = parseInt(url.searchParams.get('skip') || '0');

		switch (type) {
			case 'settings': {
				// Get or create default settings
				let settings = await bruteForceSettingsCollection.findOne({});
				if (!settings) {
					// Create default settings
					const defaultSettings: BruteForceSettings = {
						_id: new ObjectId(),
						enabled: true,
						maxAttempts: 5,
						lockoutDuration: 15,
						lockoutUnits: 'minutes',
						notifyAdmins: true,
						enableProgressiveLockout: true,
						progressiveMultiplier: 2,
						maxLockoutDuration: 24,
						maxLockoutUnits: 'hours',
						enableCaptcha: true,
						captchaAfterAttempts: 3,
						logAttempts: true,
						updatedAt: new Date(),
						updatedBy: session.user.email || session.user.name || 'System'
					};
					await bruteForceSettingsCollection.insertOne(defaultSettings);
					settings = defaultSettings;
				}

				return json({
					settings: {
						...settings,
						_id: settings._id.toString()
					}
				});
			}

			case 'whitelist': {
				const whitelist = await whitelistIPsCollection
					.find({})
					.sort({ createdAt: -1 })
					.limit(limit)
					.skip(skip)
					.toArray();

				return json({
					whitelist: whitelist.map(item => ({
						...item,
						_id: item._id.toString()
					}))
				});
			}

			case 'blocked': {
				const blocked = await blockedIPsCollection
					.find({})
					.sort({ blockedAt: -1 })
					.limit(limit)
					.skip(skip)
					.toArray();

				return json({
					blocked: blocked.map(item => ({
						...item,
						_id: item._id.toString()
					}))
				});
			}

			case 'attempts': {
				const attempts = await loginAttemptsCollection
					.find({})
					.sort({ timestamp: -1 })
					.limit(limit)
					.skip(skip)
					.toArray();

				return json({
					attempts: attempts.map(item => ({
						...item,
						_id: item._id.toString()
					}))
				});
			}

			default: {
				// Get all data
				const [settings, whitelist, blocked, attempts] = await Promise.all([
					bruteForceSettingsCollection.findOne({}),
					whitelistIPsCollection.find({}).limit(10).toArray(),
					blockedIPsCollection.find({}).limit(10).toArray(),
					loginAttemptsCollection.find({}).sort({ timestamp: -1 }).limit(10).toArray()
				]);

				return json({
					settings: settings ? { ...settings, _id: settings._id.toString() } : null,
					whitelist: whitelist.map(item => ({ ...item, _id: item._id.toString() })),
					blocked: blocked.map(item => ({ ...item, _id: item._id.toString() })),
					attempts: attempts.map(item => ({ ...item, _id: item._id.toString() }))
				});
			}
		}
	} catch (error) {
		console.error('Error fetching brute force data:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// POST /api/admin/security/brute-force - Create whitelist IP or update settings
export const POST: RequestHandler = async ({ request }) => {
	try {
		// Check authentication and admin role
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user || session.user.role !== 'admin') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await request.json();
		const { action, ...data } = body;

		switch (action) {
			case 'add_whitelist': {
				const { ip, description } = data;

				// Validate input
				if (!ip || !description) {
					return json({ error: 'IP and description are required' }, { status: 400 });
				}

				// Basic IP validation
				const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?:\/(?:[0-9]|[1-2][0-9]|3[0-2]))?$/;
				if (!ipRegex.test(ip)) {
					return json({ error: 'Invalid IP address or CIDR notation' }, { status: 400 });
				}

				// Check if IP already exists
				const existing = await whitelistIPsCollection.findOne({ ip });
				if (existing) {
					return json({ error: 'IP already in whitelist' }, { status: 409 });
				}

				const newWhitelistIP: WhitelistIP = {
					_id: new ObjectId(),
					ip,
					description,
					createdAt: new Date(),
					createdBy: session.user.email || session.user.name || 'Unknown'
				};

				await whitelistIPsCollection.insertOne(newWhitelistIP);

				return json({
					success: true,
					whitelistIP: {
						...newWhitelistIP,
						_id: newWhitelistIP._id.toString()
					}
				});
			}

			case 'update_settings': {
				const settings = data;

				// Validate settings
				if (settings.maxAttempts < 1 || settings.maxAttempts > 50) {
					return json({ error: 'Max attempts must be between 1 and 50' }, { status: 400 });
				}

				if (settings.lockoutDuration < 1) {
					return json({ error: 'Lockout duration must be at least 1' }, { status: 400 });
				}

				const updateData = {
					...settings,
					updatedAt: new Date(),
					updatedBy: session.user.email || session.user.name || 'Unknown'
				};

				const result = await bruteForceSettingsCollection.findOneAndUpdate(
					{},
					{ $set: updateData },
					{ upsert: true, returnDocument: 'after' }
				);

				return json({
					success: true,
					settings: {
						...result,
						_id: result._id.toString()
					}
				});
			}

			default:
				return json({ error: 'Invalid action' }, { status: 400 });
		}
	} catch (error) {
		console.error('Error in brute force POST:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// PUT /api/admin/security/brute-force - Unblock IP
export const PUT: RequestHandler = async ({ request }) => {
	try {
		// Check authentication and admin role
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user || session.user.role !== 'admin') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { action, id } = await request.json();

		if (action === 'unblock_ip' && id) {
			const result = await blockedIPsCollection.findOneAndUpdate(
				{ _id: new ObjectId(id) },
				{ $set: { status: 'manually_unblocked' } },
				{ returnDocument: 'after' }
			);

			if (!result) {
				return json({ error: 'Blocked IP not found' }, { status: 404 });
			}

			return json({
				success: true,
				blockedIP: {
					...result,
					_id: result._id.toString()
				}
			});
		}

		return json({ error: 'Invalid action or missing ID' }, { status: 400 });
	} catch (error) {
		console.error('Error in brute force PUT:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// DELETE /api/admin/security/brute-force - Remove whitelist IP
export const DELETE: RequestHandler = async ({ request, url }) => {
	try {
		// Check authentication and admin role
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user || session.user.role !== 'admin') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const id = url.searchParams.get('id');
		const type = url.searchParams.get('type');

		if (!id || !type) {
			return json({ error: 'ID and type are required' }, { status: 400 });
		}

		if (type === 'whitelist') {
			const result = await whitelistIPsCollection.deleteOne({ _id: new ObjectId(id) });

			if (result.deletedCount === 0) {
				return json({ error: 'Whitelist IP not found' }, { status: 404 });
			}

			return json({ success: true });
		}

		return json({ error: 'Invalid type' }, { status: 400 });
	} catch (error) {
		console.error('Error in brute force DELETE:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};