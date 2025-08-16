import { betterAuth } from 'better-auth';
import db from '$lib/db/dbClient';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { admin } from 'better-auth/plugins';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { enhancedRBAC } from './rbac-plugin';

export const auth = betterAuth({
	database: mongodbAdapter(db),
	emailAndPassword: {
		enabled: true
	},
	additionalFields: {
		role: {
			type: 'string',
			input: false,
			default: 'user'
		}
	},
	plugins: [
		admin({
			defaultRole: 'user',
			adminRoles: ['admin'],
			impersonationSessionDuration: 60 * 60, // 1 hour
			defaultBanReason: 'No reason provided',
			bannedUserMessage:
				'You have been banned from this application. Please contact support if you believe this is an error.'
		}),
		enhancedRBAC(), // Our custom RBAC plugin
		sveltekitCookies(getRequestEvent as any) // must be last
	]
});
