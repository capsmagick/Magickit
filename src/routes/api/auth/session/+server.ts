import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { auth } from '$lib/auth/auth';

export const GET: RequestHandler = async ({ request, locals }) => {
  try {
    // Get session from Better Auth directly
    const session = await auth.api.getSession({
      headers: request.headers
    });

    return json({
      directSession: {
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id || null,
        userEmail: session?.user?.email || null,
        userRole: session?.user?.role || null
      },
      localsSession: {
        hasSession: !!locals.session,
        hasUser: !!locals.user,
        userId: locals.session?.user?.id || locals.user?.id || null,
        userEmail: locals.session?.user?.email || locals.user?.email || null,
        userRole: locals.session?.user?.role || locals.user?.role || null
      }
    });
  } catch (error) {
    console.error('Session check error:', error);
    return json({ error: 'Failed to check session' }, { status: 500 });
  }
};