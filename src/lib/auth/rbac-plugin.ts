import type { BetterAuthPlugin } from 'better-auth';
import { RBACService } from '$lib/db/rbac';
import { ObjectId } from 'mongodb';

/**
 * Enhanced RBAC Plugin for Better Auth
 * Extends the built-in admin plugin with granular permissions
 */
export const enhancedRBAC = (): BetterAuthPlugin => {
  return {
    id: 'enhanced-rbac',
    
    // Initialize RBAC system on plugin load
    init: async () => {
      try {
        await RBACService.initializeRBAC();
        console.log('Enhanced RBAC plugin initialized');
      } catch (error) {
        console.error('Failed to initialize Enhanced RBAC plugin:', error);
      }
    },

    // Add RBAC-specific endpoints
    endpoints: {
      // Check if user has specific permission
      '/rbac/check-permission': {
        method: 'POST',
        handler: async (request) => {
          try {
            const { userId, resource, action, userRole } = await request.json();
            
            if (!userId || !resource || !action) {
              return new Response(
                JSON.stringify({ error: 'Missing required parameters' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
              );
            }

            const hasPermission = await RBACService.userHasPermission(userId, resource, action, userRole);
            
            return new Response(
              JSON.stringify({ hasPermission }),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
          } catch (error) {
            return new Response(
              JSON.stringify({ error: 'Internal server error' }),
              { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
          }
        }
      },

      // Get user permissions
      '/rbac/user-permissions': {
        method: 'POST',
        handler: async (request) => {
          try {
            const { userId, userRole } = await request.json();
            
            if (!userId) {
              return new Response(
                JSON.stringify({ error: 'Missing userId parameter' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
              );
            }

            const permissions = await RBACService.getUserPermissions(userId, userRole);
            
            return new Response(
              JSON.stringify({ permissions }),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
          } catch (error) {
            return new Response(
              JSON.stringify({ error: 'Internal server error' }),
              { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
          }
        }
      },

      // Assign role to user
      '/rbac/assign-role': {
        method: 'POST',
        handler: async (request) => {
          try {
            const { userId, roleId, assignedBy, expiresAt } = await request.json();
            
            if (!userId || !roleId || !assignedBy) {
              return new Response(
                JSON.stringify({ error: 'Missing required parameters' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
              );
            }

            // Check if the assigner has permission to assign roles
            const canAssignRoles = await RBACService.userHasPermission(assignedBy, 'role', 'create');
            if (!canAssignRoles) {
              return new Response(
                JSON.stringify({ error: 'Insufficient permissions' }),
                { status: 403, headers: { 'Content-Type': 'application/json' } }
              );
            }

            const success = await RBACService.assignRole(
              userId, 
              roleId, 
              assignedBy, 
              expiresAt ? new Date(expiresAt) : undefined
            );
            
            return new Response(
              JSON.stringify({ success }),
              { status: success ? 200 : 400, headers: { 'Content-Type': 'application/json' } }
            );
          } catch (error) {
            return new Response(
              JSON.stringify({ error: 'Internal server error' }),
              { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
          }
        }
      },

      // Remove role from user
      '/rbac/remove-role': {
        method: 'POST',
        handler: async (request) => {
          try {
            const { userId, roleId, removedBy } = await request.json();
            
            if (!userId || !roleId || !removedBy) {
              return new Response(
                JSON.stringify({ error: 'Missing required parameters' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
              );
            }

            // Check if the remover has permission to manage roles
            const canManageRoles = await RBACService.userHasPermission(removedBy, 'role', 'delete');
            if (!canManageRoles) {
              return new Response(
                JSON.stringify({ error: 'Insufficient permissions' }),
                { status: 403, headers: { 'Content-Type': 'application/json' } }
              );
            }

            const success = await RBACService.removeRole(userId, roleId, removedBy);
            
            return new Response(
              JSON.stringify({ success }),
              { status: success ? 200 : 400, headers: { 'Content-Type': 'application/json' } }
            );
          } catch (error) {
            return new Response(
              JSON.stringify({ error: 'Internal server error' }),
              { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
          }
        }
      },

      // Get audit logs
      '/rbac/audit-logs': {
        method: 'POST',
        handler: async (request) => {
          try {
            const { filters = {}, limit = 100, skip = 0, requesterId } = await request.json();
            
            if (!requesterId) {
              return new Response(
                JSON.stringify({ error: 'Missing requesterId parameter' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
              );
            }

            // Check if the requester has permission to view audit logs
            const canViewAudit = await RBACService.userHasPermission(requesterId, 'system', 'read');
            if (!canViewAudit) {
              return new Response(
                JSON.stringify({ error: 'Insufficient permissions' }),
                { status: 403, headers: { 'Content-Type': 'application/json' } }
              );
            }

            const auditLogs = await RBACService.getAuditLogs(filters, limit, skip);
            
            return new Response(
              JSON.stringify({ auditLogs }),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
          } catch (error) {
            return new Response(
              JSON.stringify({ error: 'Internal server error' }),
              { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
          }
        }
      }
    },

    // Add middleware to check permissions on protected routes
    middleware: [
      {
        path: '/admin/*',
        handler: async (request, context) => {
          // This middleware runs before admin routes
          // We can add additional permission checks here
          
          const session = context.session;
          if (!session?.user) {
            return new Response('Unauthorized', { status: 401 });
          }

          // For admin routes, ensure user has admin role (handled by Better Auth admin plugin)
          // Additional granular permission checks can be added here
          
          return; // Continue to next middleware/handler
        }
      }
    ],

    // Add hooks for RBAC events
    hooks: {
      user: {
        created: async (user) => {
          // When a user is created, assign appropriate RBAC roles
          try {
            console.log(`User created: ${user.id} with role: ${user.role}`);
            
            // If user is created with admin role, ensure admin RBAC role is assigned
            if (user.role === 'admin') {
              await RBACService.ensureAdminRoleAssignment(user.id);
              console.log(`Admin RBAC role assigned to user: ${user.id}`);
            }
          } catch (error) {
            console.error('Error in user created hook:', error);
          }
        }
      }
    },

    // Add RBAC-specific schema extensions
    schema: {
      // We don't need to extend the user schema since Better Auth admin plugin handles roles
      // Our additional RBAC data is stored in separate collections
    }
  };
};

/**
 * RBAC Middleware for SvelteKit routes
 * Use this in your +layout.server.ts or +page.server.ts files
 */
export function requirePermission(resource: string, action: string) {
  return async (event: any) => {
    const session = event.locals.session;
    const user = event.locals.user;

    if (!session || !user) {
      throw new Error('Authentication required');
    }

    const hasPermission = await RBACService.userHasPermission(user.id, resource, action);
    
    if (!hasPermission) {
      throw new Error(`Insufficient permissions: ${resource}:${action}`);
    }

    return true;
  };
}

/**
 * Helper function to check permissions in SvelteKit actions
 */
export async function checkPermission(
  userId: string, 
  resource: string, 
  action: string,
  userRole?: string
): Promise<boolean> {
  return await RBACService.userHasPermission(userId, resource, action, userRole);
}

/**
 * Helper function to log actions in SvelteKit
 */
export async function logAction(
  userId: string,
  action: string,
  resource: string,
  resourceId: string | undefined,
  details: Record<string, any>,
  success: boolean,
  request?: Request
): Promise<void> {
  const ipAddress = request?.headers.get('x-forwarded-for') || 
                   request?.headers.get('x-real-ip') || 
                   'unknown';
  const userAgent = request?.headers.get('user-agent') || 'unknown';

  await RBACService.logAction(
    userId,
    action,
    resource,
    resourceId,
    details,
    success,
    ipAddress,
    userAgent
  );
}