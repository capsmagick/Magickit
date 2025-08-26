import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { auth } from '$lib/auth/auth';

export const load: PageServerLoad = async ({ request, locals }) => {
  // Try to get session directly from Better Auth
  const session = await auth.api.getSession({
    headers: request.headers
  });

  // Check authentication using direct session first, fallback to locals
  const user = session?.user || locals.session?.user || locals.user;
  
  if (!user) {
    throw redirect(302, '/login?redirectTo=/admin/media/upload');
  }

  return {
    user: user
  };
};