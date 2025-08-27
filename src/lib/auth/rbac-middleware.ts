import { redirect, error } from '@sveltejs/kit';
import { RBACService } from '$lib/db/rbac';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * RBAC Middleware for SvelteKit routes
 * Use this in your +layout.server.ts or +page.server.ts files
 */

/**
 * Require specific permission for route access
 */
export function requirePermission(resource: string, action: string) {
  return async (event: RequestEvent) => {
    const session = event.locals.session;
    const user = event.locals.user;

    if (!session || !user) {
      // Log unauthorized access attempt
      const ipAddress = event.getClientAddress();
      const userAgent = event.request.headers.get('user-agent') || 'unknown';
      
      await RBACService.logAction(
        'anonymous',
        'unauthorized_access',
        resource,
        undefined,
        { 
          requiredPermission: `${resource}:${action}`,
          route: event.url.pathname,
          reason: 'not_authenticated'
        },
        false,
        ipAddress,
        userAgent
      );
      
      throw redirect(302, '/auth/login');
    }

    const hasPermission = await RBACService.userHasPermission(user.id, resource, action, user.role);
    
    if (!hasPermission) {
      // Log permission denied
      const ipAddress = event.getClientAddress();
      const userAgent = event.request.headers.get('user-agent') || 'unknown';
      
      await RBACService.logPermissionCheck(
        user.id,
        resource,
        action,
        false,
        ipAddress,
        userAgent
      );
      
      throw error(403, {
        message: `Insufficient permissions: ${resource}:${action}`,
        code: 'PERMISSION_DENIED'
      });
    }

    // Log successful permission check
    const ipAddress = event.getClientAddress();
    const userAgent = event.request.headers.get('user-agent') || 'unknown';
    
    await RBACService.logPermissionCheck(
      user.id,
      resource,
      action,
      true,
      ipAddress,
      userAgent
    );

    return true;
  };
}

/**
 * Require admin section access
 */
export function requireAdminSection(section: 'content' | 'media' | 'system' | 'users' | 'roles' | 'audit') {
  return async (event: RequestEvent) => {
    const session = event.locals.session;
    const user = event.locals.user;

    if (!session || !user) {
      throw redirect(302, '/auth/login');
    }

    let hasAccess = false;
    
    switch (section) {
      case 'content':
        hasAccess = await RBACService.userHasPermission(user.id, 'content', 'read', user.role) ||
                   await RBACService.userHasPermission(user.id, 'content_type', 'read', user.role);
        break;
      case 'media':
        hasAccess = await RBACService.userHasPermission(user.id, 'media', 'read', user.role) ||
                   await RBACService.userHasPermission(user.id, 'media_folder', 'read', user.role);
        break;
      case 'system':
        hasAccess = await RBACService.userHasPermission(user.id, 'system', 'read', user.role) ||
                   await RBACService.userHasPermission(user.id, 'system', 'monitor', user.role);
        break;
      case 'users':
        hasAccess = await RBACService.userHasPermission(user.id, 'user', 'read', user.role);
        break;
      case 'roles':
        hasAccess = await RBACService.userHasPermission(user.id, 'role', 'read', user.role);
        break;
      case 'audit':
        hasAccess = await RBACService.userHasPermission(user.id, 'audit', 'read', user.role);
        break;
    }

    // Log admin section access attempt
    const ipAddress = event.getClientAddress();
    const userAgent = event.request.headers.get('user-agent') || 'unknown';
    
    await RBACService.logAdminAccess(
      user.id,
      section,
      hasAccess,
      ipAddress,
      userAgent
    );

    if (!hasAccess) {
      throw error(403, {
        message: `Access denied to ${section} section`,
        code: 'ADMIN_ACCESS_DENIED'
      });
    }

    return true;
  };
}

/**
 * Check if user can perform content action
 */
export async function checkContentPermission(
  event: RequestEvent,
  action: 'create' | 'read' | 'update' | 'delete' | 'publish' | 'unpublish' | 'schedule' | 'manage'
): Promise<boolean> {
  const user = event.locals.user;
  if (!user) return false;

  const hasPermission = await RBACService.userHasPermission(user.id, 'content', action, user.role);
  
  // Log the check
  const ipAddress = event.getClientAddress();
  const userAgent = event.request.headers.get('user-agent') || 'unknown';
  
  await RBACService.logPermissionCheck(
    user.id,
    'content',
    action,
    hasPermission,
    ipAddress,
    userAgent
  );

  return hasPermission;
}

/**
 * Check if user can perform media action
 */
export async function checkMediaPermission(
  event: RequestEvent,
  action: 'create' | 'read' | 'update' | 'delete' | 'upload' | 'organize' | 'manage'
): Promise<boolean> {
  const user = event.locals.user;
  if (!user) return false;

  const hasPermission = await RBACService.userHasPermission(user.id, 'media', action, user.role);
  
  // Log the check
  const ipAddress = event.getClientAddress();
  const userAgent = event.request.headers.get('user-agent') || 'unknown';
  
  await RBACService.logPermissionCheck(
    user.id,
    'media',
    action,
    hasPermission,
    ipAddress,
    userAgent
  );

  return hasPermission;
}

/**
 * Log content management action
 */
export async function logContentAction(
  event: RequestEvent,
  action: string,
  contentId?: string,
  contentType?: string,
  details: Record<string, any> = {},
  success: boolean = true
): Promise<void> {
  const user = event.locals.user;
  if (!user) return;

  const ipAddress = event.getClientAddress();
  const userAgent = event.request.headers.get('user-agent') || 'unknown';

  await RBACService.logContentAction(
    user.id,
    action,
    contentId,
    contentType || 'unknown',
    details,
    success,
    ipAddress,
    userAgent
  );
}

/**
 * Log media management action
 */
export async function logMediaAction(
  event: RequestEvent,
  action: string,
  mediaId?: string,
  mediaType?: string,
  details: Record<string, any> = {},
  success: boolean = true
): Promise<void> {
  const user = event.locals.user;
  if (!user) return;

  const ipAddress = event.getClientAddress();
  const userAgent = event.request.headers.get('user-agent') || 'unknown';

  await RBACService.logMediaAction(
    user.id,
    action,
    mediaId,
    mediaType || 'unknown',
    details,
    success,
    ipAddress,
    userAgent
  );
}

/**
 * Utility to get user permissions for server-side use
 */
export async function getUserPermissions(userId: string, userRole?: string) {
  return await RBACService.getUserPermissions(userId, userRole);
}

/**
 * Utility to check if user has specific permission
 */
export async function hasPermission(userId: string, resource: string, action: string, userRole?: string): Promise<boolean> {
  return await RBACService.userHasPermission(userId, resource, action, userRole);
}