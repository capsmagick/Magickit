import { createAuthClient } from 'better-auth/svelte';
import { adminClient } from 'better-auth/client/plugins';
import { PUBLIC_BETTER_AUTH_URL } from '$env/static/public';

export const authClient = createAuthClient({
	/** The base URL of the server (optional if you're using the same domain) */
	baseURL: PUBLIC_BETTER_AUTH_URL,
	plugins: [adminClient()]
});
