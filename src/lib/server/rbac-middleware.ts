import type { RequestEvent } from '@sveltejs/kit';
import { RBACService } from '$lib/db/rbac';
import { auth } from '$lib/auth/auth';
import { error, redirect } from '@sveltejs/kit';

/**
 * RBAC Middleware for SvelteKit server-side routes
 */
export class RBACMiddleware {
  /**
   * Require authentication for a route
   */
  static async requireAuth(event: RequestEvent) {
    const session = await auth.api.getSession({
      headers: event.request.headers
    });

    if (!session?.user) {
      throw redirect(302, '/login');
    }

    return { session, user: session.user };
  }

  /**
   * Require admin role for a route (using Better Auth admin plugin)
   */
  static async requireAdmin(event: RequestEvent) {
    const { session, user } = await this.requireAuth(event);

    if (user.role !== 'admin') {
      throw error(403, 'Admin access required');
    }

    return { session, user };
  }

  /**
   * Require specific permission for a route
   */
  static async requirePermission(
    event: RequestEvent, 
    resource: string, 
    action: string
  ) {
    const { session, user } = await this.requireAuth(event);

    const hasPermission = await RBACService.userHasPermission(user.id, resource, action);
    
    if (!hasPermission) {
      // Log the access attempt
      await RBACService.logAction(
        user.id,
        `access_denied_${resource}_${action}`,
        resource,
        undefined,
        { 
          route: event.route.id,
          method: event.request.method,
          requiredPermission: `${resource}:${action}`
        },
        false,
        event.getClientAddress(),
        event.request.headers.get('user-agent') || 'unknown'
      );

      throw error(403, `Insufficient permissions: ${resource}:${action}`);
    }

    // Log successful access
    await RBACService.logAction(
      user.id,
      `access_granted_${resource}_${action}`,
      resource,
      undefined,
      { 
        route: event.route.id,
        method: event.request.method,
        grantedPermission: `${resource}:${action}`
      },
      true,
      event.getClientAddress(),
      event.request.headers.get('user-agent') || 'unknown'
    );

    return { session, user };
  }

  /**
   * Check multiple permissions (user must have ALL permissions)
   */
  static async requireAllPermissions(
    event: RequestEvent,
    permissions: Array<{ resource: string; action: string }>
  ) {
    const { session, user } = await this.requireAuth(event);

    for (const { resource, action } of permissions) {
      const hasPermission = await RBACService.userHasPermission(user.id, resource, action);
      
      if (!hasPermission) {
        await RBACService.logAction(
          user.id,
          `access_denied_multiple_permissions`,
          'system',
          undefined,
          { 
            route: event.route.id,
            method: event.request.method,
            requiredPermissions: permissions,
            failedPermission: `${resource}:${action}`
          },
          false,
          event.getClientAddress(),
          event.request.headers.get('user-agent') || 'unknown'
        );

        throw error(403, `Insufficient permissions: ${resource}:${action}`);
      }
    }

    return { session, user };
  }

  /**
   * Check multiple permissions (user must have ANY permission)
   */
  static async requireAnyPermission(
    event: RequestEvent,
    permissions: Array<{ resource: string; action: string }>
  ) {
    const { session, user } = await this.requireAuth(event);

    let hasAnyPermission = false;
    
    for (const { resource, action } of permissions) {
      const hasPermission = await RBACService.userHasPermission(user.id, resource, action);
      if (hasPermission) {
        hasAnyPermission = true;
        break;
      }
    }

    if (!hasAnyPermission) {
      await RBACService.logAction(
        user.id,
        `access_denied_any_permissions`,
        'system',
        undefined,
        { 
          route: event.route.id,
          method: event.request.method,
          requiredPermissions: permissions
        },
        false,
        event.getClientAddress(),
        event.request.headers.get('user-agent') || 'unknown'
      );

      throw error(403, 'Insufficient permissions');
    }

    return { session, user };
  }

  /**
   * Log user action for audit purposes
   */
  static async logUserAction(
    event: RequestEvent,
    action: string,
    resource: string,
    resourceId?: string,
    details: Record<string, any> = {},
    success: boolean = true
  ) {
    try {
      const session = await auth.api.getSession({
        headers: event.request.headers
      });

      if (session?.user) {
        await RBACService.logAction(
          session.user.id,
          action,
          resource,
          resourceId,
          {
            ...details,
            route: event.route.id,
            method: event.request.method
          },
          success,
          event.getClientAddress(),
          event.request.headers.get('user-agent') || 'unknown'
        );
      }
    } catch (error) {
      console.error('Error logging user action:', error);
    }
  }
}

/**
 * Decorator function for SvelteKit load functions
 * Usage: export const load = withPermission('user', 'read', async (event) => { ... });
 */
export function withPermission(
  resource: string, 
  action: string, 
  loadFunction: (event: RequestEvent & { user: any; session: any }) => any
) {
  return async (event: RequestEvent) => {
    const { session, user } = await RBACMiddleware.requirePermission(event, resource, action);
    return loadFunction({ ...event, user, session });
  };
}

/**
 * Decorator function for admin-only routes
 * Usage: export const load = withAdminRole(async (event) => { ... });
 */
export function withAdminRole(
  loadFunction: (event: RequestEvent & { user: any; session: any }) => any
) {
  return async (event: RequestEvent) => {
    const { session, user } = await RBACMiddleware.requireAdmin(event);
    return loadFunction({ ...event, user, session });
  };
}

/**
 * Decorator function for authenticated routes
 * Usage: export const load = withAuth(async (event) => { ... });
 */
export function withAuth(
  loadFunction: (event: RequestEvent & { user: any; session: any }) => any
) {
  return async (event: RequestEvent) => {
    const { session, user } = await RBACMiddleware.requireAuth(event);
    return loadFunction({ ...event, user, session });
  };
}