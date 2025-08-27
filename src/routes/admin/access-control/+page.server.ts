import { requireAdminSection } from '$lib/auth/rbac-middleware';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
  // Require access to roles admin section
  await requireAdminSection('roles')(event);

  // If we get here, the user has permission to access this page
  return {
    title: 'Access Control (RBAC)',
    description: 'Manage roles, permissions, and access control'
  };
};