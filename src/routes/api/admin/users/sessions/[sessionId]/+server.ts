import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { auth } from '$lib/auth/auth';
import { userManagementService } from '$lib/services/user';

// DELETE /api/admin/users/sessions/[sessionId] - Terminate specific session
export const DELETE: RequestHandler = async ({ request, params }) => {
	try {
		// Check authentication and admin role
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user || session.user.role !== 'admin') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { sessionId } = params;
		if (!sessionId) {
			return json({ error: 'Session ID is required' }, { status: 400 });
		}

		// Terminate the session
		await userManagementService.terminateSession(sessionId, session.user.id);

		return json({ 
			success: true, 
			message: 'Session terminated successfully' 
		});
	} catch (error) {
		console.error('Error terminating session:', error);
		return json({ error: error.message || 'Internal server error' }, { status: 500 });
	}
};