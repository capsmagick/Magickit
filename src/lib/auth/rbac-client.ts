import { authClient } from './auth-client';

/**
 * Client-side RBAC utilities for SvelteKit frontend
 * Works with the enhanced RBAC plugin
 */
export class RBACClient {
  /**
   * Check if the current user has a specific permission
   */
  static async checkPermission(resource: string, action: string): Promise<boolean> {
    try {
      const session = authClient.getSession();
      if (!session?.user) {
        return false;
      }

      const response = await fetch('/api/auth/rbac/check-permission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id,
          resource,
          action,
          userRole: session.user.role // Pass Better Auth role
        })
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.hasPermission || false;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  /**
   * Get all permissions for the current user
   */
  static async getUserPermissions() {
    try {
      const session = authClient.getSession();
      if (!session?.user) {
        return [];
      }

      const response = await fetch('/api/auth/rbac/user-permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id,
          userRole: session.user.role // Pass Better Auth role
        })
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.permissions || [];
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return [];
    }
  }

  /**
   * Assign a role to a user (admin only)
   */
  static async assignRole(
    userId: string, 
    roleId: string, 
    expiresAt?: Date
  ): Promise<boolean> {
    try {
      const session = authClient.getSession();
      if (!session?.user) {
        return false;
      }

      const response = await fetch('/api/auth/rbac/assign-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          roleId,
          assignedBy: session.user.id,
          expiresAt: expiresAt?.toISOString()
        })
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.success || false;
    } catch (error) {
      console.error('Error assigning role:', error);
      return false;
    }
  }

  /**
   * Remove a role from a user (admin only)
   */
  static async removeRole(userId: string, roleId: string): Promise<boolean> {
    try {
      const session = authClient.getSession();
      if (!session?.user) {
        return false;
      }

      const response = await fetch('/api/auth/rbac/remove-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          roleId,
          removedBy: session.user.id
        })
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.success || false;
    } catch (error) {
      console.error('Error removing role:', error);
      return false;
    }
  }

  /**
   * Get audit logs (admin only)
   */
  static async getAuditLogs(
    filters: {
      userId?: string;
      action?: string;
      resource?: string;
      startDate?: Date;
      endDate?: Date;
      success?: boolean;
    } = {},
    limit: number = 100,
    skip: number = 0
  ) {
    try {
      const session = authClient.getSession();
      if (!session?.user) {
        return [];
      }

      const response = await fetch('/api/auth/rbac/audit-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filters: {
            ...filters,
            startDate: filters.startDate?.toISOString(),
            endDate: filters.endDate?.toISOString()
          },
          limit,
          skip,
          requesterId: session.user.id
        })
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.auditLogs || [];
    } catch (error) {
      console.error('Error getting audit logs:', error);
      return [];
    }
  }

  /**
   * Check if user has admin role (using Better Auth admin plugin)
   */
  static isAdmin(): boolean {
    const session = authClient.getSession();
    return session?.user?.role === 'admin' || false;
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    const session = authClient.getSession();
    return !!session?.user;
  }
}

/**
 * Svelte store for reactive permission checking
 */
import { writable, derived } from 'svelte/store';

// Store for user permissions
export const userPermissions = writable<any[]>([]);

// Store for loading state
export const permissionsLoading = writable(false);

/**
 * Load user permissions into the store
 */
export async function loadUserPermissions() {
  permissionsLoading.set(true);
  try {
    const permissions = await RBACClient.getUserPermissions();
    userPermissions.set(permissions);
  } catch (error) {
    console.error('Error loading user permissions:', error);
    userPermissions.set([]);
  } finally {
    permissionsLoading.set(false);
  }
}

/**
 * Derived store to check if user has a specific permission
 */
export function hasPermission(resource: string, action: string) {
  return derived(userPermissions, ($permissions) => {
    return $permissions.some(p => 
      p.resource === resource && (p.action === action || p.action === 'manage')
    );
  });
}

/**
 * Derived store to check if user has admin role
 */
export const isAdmin = derived(
  [userPermissions],
  ([$permissions]) => {
    // First check Better Auth admin role
    const session = authClient.getSession();
    if (session?.user?.role === 'admin') {
      return true;
    }
    
    // Fallback to checking system management permissions
    return $permissions.some(p => p.resource === 'system' && p.action === 'manage');
  }
);

/**
 * Check if user can access admin sections
 */
export function canAccessAdminSection(section: string) {
  return derived(userPermissions, ($permissions) => {
    // First check Better Auth admin role - admins have access to all sections
    const session = authClient.getSession();
    if (session?.user?.role === 'admin') {
      return true;
    }
    
    // Fallback to permission-based checking for non-admin users
    switch (section) {
      case 'content':
        return $permissions.some(p => 
          (p.resource === 'content' && ['read', 'create', 'update', 'manage'].includes(p.action)) ||
          (p.resource === 'content_type' && ['read', 'manage'].includes(p.action))
        );
      case 'media':
        return $permissions.some(p => 
          (p.resource === 'media' && ['read', 'create', 'update', 'manage', 'upload'].includes(p.action)) ||
          (p.resource === 'media_folder' && ['read', 'create', 'update', 'manage'].includes(p.action))
        );
      case 'system':
        return $permissions.some(p => 
          p.resource === 'system' && ['read', 'manage', 'monitor', 'alerts', 'logs'].includes(p.action)
        );
      case 'users':
        return $permissions.some(p => 
          p.resource === 'user' && ['read', 'create', 'update', 'manage'].includes(p.action)
        );
      case 'roles':
        return $permissions.some(p => 
          p.resource === 'role' && ['read', 'create', 'update', 'manage'].includes(p.action)
        );
      case 'audit':
        return $permissions.some(p => 
          p.resource === 'audit' && ['read', 'manage'].includes(p.action)
        );
      default:
        return false;
    }
  });
}

/**
 * Check if user can perform specific content actions
 */
export function canPerformContentAction(action: string) {
  return derived(userPermissions, ($permissions) => {
    return $permissions.some(p => 
      p.resource === 'content' && (p.action === action || p.action === 'manage')
    );
  });
}

/**
 * Check if user can perform specific media actions
 */
export function canPerformMediaAction(action: string) {
  return derived(userPermissions, ($permissions) => {
    return $permissions.some(p => 
      p.resource === 'media' && (p.action === action || p.action === 'manage')
    );
  });
}

/**
 * Check if user can manage content types
 */
export const canManageContentTypes = derived(userPermissions, ($permissions) => {
  return $permissions.some(p => 
    p.resource === 'content_type' && ['create', 'update', 'delete', 'manage'].includes(p.action)
  );
});

/**
 * Check if user can access system monitoring
 */
export const canAccessSystemMonitoring = derived(userPermissions, ($permissions) => {
  return $permissions.some(p => 
    p.resource === 'system' && ['monitor', 'alerts', 'logs', 'manage'].includes(p.action)
  );
});

/**
 * Check if user can access audit logs
 */
export const canAccessAuditLogs = derived(userPermissions, ($permissions) => {
  return $permissions.some(p => 
    p.resource === 'audit' && ['read', 'manage'].includes(p.action)
  );
});

/**
 * Permission-based component wrapper
 * Usage: <PermissionGuard resource="user" action="create">...</PermissionGuard>
 */
export { default as PermissionGuard } from './PermissionGuard.svelte';