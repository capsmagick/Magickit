import { ObjectId } from 'mongodb';
import { 
  rolesCollection, 
  permissionsCollection, 
  userRolesCollection, 
  auditLogsCollection 
} from './collections';
import type { Role, Permission, UserRole, AuditLog } from './models';
import { SYSTEM_ROLES, SYSTEM_PERMISSIONS } from './models';

// ============================================================================
// RBAC Service - Integrates with Better Auth Admin Plugin
// ============================================================================

export class RBACService {
  /**
   * Initialize RBAC system with default roles and permissions
   * This extends Better Auth's basic admin/user roles
   */
  static async initializeRBAC() {
    try {
      // Create default permissions
      await this.createDefaultPermissions();
      
      // Create default roles
      await this.createDefaultRoles();
      
      console.log('RBAC system initialized successfully');
    } catch (error) {
      console.error('Error initializing RBAC system:', error);
      throw error;
    }
  }

  /**
   * Create default system permissions
   */
  private static async createDefaultPermissions() {
    const defaultPermissions = Object.values(SYSTEM_PERMISSIONS).map(perm => ({
      name: `${perm.resource}_${perm.action}`,
      resource: perm.resource,
      action: perm.action,
      description: `${perm.action.charAt(0).toUpperCase() + perm.action.slice(1)} ${perm.resource}`,
      createdAt: new Date()
    }));

    for (const permission of defaultPermissions) {
      await permissionsCollection.updateOne(
        { resource: permission.resource, action: permission.action },
        { $setOnInsert: permission },
        { upsert: true }
      );
    }
  }

  /**
   * Create default system roles that work with Better Auth
   */
  private static async createDefaultRoles() {
    // Get all permissions for admin role
    const allPermissions = await permissionsCollection.find({}).toArray();
    const allPermissionIds = allPermissions.map(p => p._id);

    // Admin role - has all permissions (maps to Better Auth admin role)
    await rolesCollection.updateOne(
      { name: SYSTEM_ROLES.ADMIN },
      {
        $setOnInsert: {
          name: SYSTEM_ROLES.ADMIN,
          description: 'System administrator with full access',
          permissions: allPermissionIds,
          isSystemRole: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

    // User role - basic permissions (maps to Better Auth user role)
    const userPermissions = allPermissions
      .filter(p => p.resource === 'content' && p.action === 'read')
      .map(p => p._id);

    await rolesCollection.updateOne(
      { name: SYSTEM_ROLES.USER },
      {
        $setOnInsert: {
          name: SYSTEM_ROLES.USER,
          description: 'Regular user with basic access',
          permissions: userPermissions,
          isSystemRole: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

    // Moderator role - content moderation and media management permissions
    const moderatorPermissions = allPermissions
      .filter(p => 
        (p.resource === 'content' && ['read', 'update', 'delete', 'publish', 'unpublish'].includes(p.action)) ||
        (p.resource === 'content_type' && p.action === 'read') ||
        (p.resource === 'media' && ['read', 'update', 'delete'].includes(p.action)) ||
        (p.resource === 'media_folder' && ['read', 'update'].includes(p.action)) ||
        (p.resource === 'user' && p.action === 'read')
      )
      .map(p => p._id);

    await rolesCollection.updateOne(
      { name: SYSTEM_ROLES.MODERATOR },
      {
        $setOnInsert: {
          name: SYSTEM_ROLES.MODERATOR,
          description: 'Content moderator with content and media management access',
          permissions: moderatorPermissions,
          isSystemRole: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

    // Editor role - content creation and editing with media access
    const editorPermissions = allPermissions
      .filter(p => 
        (p.resource === 'content' && ['create', 'read', 'update', 'publish', 'unpublish', 'schedule'].includes(p.action)) ||
        (p.resource === 'content_type' && p.action === 'read') ||
        (p.resource === 'media' && ['create', 'read', 'update', 'upload'].includes(p.action)) ||
        (p.resource === 'media_folder' && ['create', 'read', 'update'].includes(p.action))
      )
      .map(p => p._id);

    await rolesCollection.updateOne(
      { name: SYSTEM_ROLES.EDITOR },
      {
        $setOnInsert: {
          name: SYSTEM_ROLES.EDITOR,
          description: 'Content editor with content management and media access',
          permissions: editorPermissions,
          isSystemRole: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

    // Content Manager role - full content and media management
    const contentManagerPermissions = allPermissions
      .filter(p => 
        p.resource === 'content' ||
        p.resource === 'content_type' ||
        p.resource === 'media' ||
        p.resource === 'media_folder'
      )
      .map(p => p._id);

    await rolesCollection.updateOne(
      { name: 'content_manager' },
      {
        $setOnInsert: {
          name: 'content_manager',
          description: 'Content manager with full content and media management access',
          permissions: contentManagerPermissions,
          isSystemRole: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

    // System Monitor role - system health monitoring access
    const systemMonitorPermissions = allPermissions
      .filter(p => 
        (p.resource === 'system' && ['read', 'monitor', 'alerts', 'logs'].includes(p.action)) ||
        (p.resource === 'audit' && p.action === 'read')
      )
      .map(p => p._id);

    await rolesCollection.updateOne(
      { name: 'system_monitor' },
      {
        $setOnInsert: {
          name: 'system_monitor',
          description: 'System monitor with health monitoring and audit log access',
          permissions: systemMonitorPermissions,
          isSystemRole: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
  }

  /**
   * Check if a user has a specific permission
   * This works alongside Better Auth's role checking
   */
  static async userHasPermission(
    userId: string, 
    resource: string, 
    action: string,
    userRole?: string // Optional Better Auth role for optimization
  ): Promise<boolean> {
    try {
      // If user has Better Auth admin role, grant all permissions and ensure RBAC role assignment
      if (userRole === 'admin') {
        // Ensure admin RBAC role is assigned (async, don't wait)
        this.ensureAdminRoleAssignment(userId).catch(error => 
          console.error('Failed to ensure admin role assignment:', error)
        );
        return true;
      }

      const userObjectId = new ObjectId(userId);
      
      // Get user's RBAC roles
      const userRoles = await userRolesCollection
        .find({ 
          userId: userObjectId,
          $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: { $gt: new Date() } }
          ]
        })
        .toArray();

      if (userRoles.length === 0) {
        return false;
      }

      // Get roles with their permissions
      const roleIds = userRoles.map(ur => ur.roleId);
      const roles = await rolesCollection
        .find({ _id: { $in: roleIds } })
        .toArray();

      // Get all permission IDs from user's roles
      const permissionIds = roles.flatMap(role => role.permissions);
      
      // Check if any permission matches the required resource and action
      const permissions = await permissionsCollection
        .find({ _id: { $in: permissionIds } })
        .toArray();

      return permissions.some(p => 
        p.resource === resource && (p.action === action || p.action === 'manage')
      );
    } catch (error) {
      console.error('Error checking user permission:', error);
      return false;
    }
  }

  /**
   * Get all permissions for a user
   */
  static async getUserPermissions(userId: string, userRole?: string): Promise<Permission[]> {
    try {
      // If user has Better Auth admin role, return all permissions
      if (userRole === 'admin') {
        return await permissionsCollection.find({}).toArray();
      }

      const userObjectId = new ObjectId(userId);
      
      const userRoles = await userRolesCollection
        .find({ 
          userId: userObjectId,
          $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: { $gt: new Date() } }
          ]
        })
        .toArray();

      if (userRoles.length === 0) {
        return [];
      }

      const roleIds = userRoles.map(ur => ur.roleId);
      const roles = await rolesCollection
        .find({ _id: { $in: roleIds } })
        .toArray();

      const permissionIds = [...new Set(roles.flatMap(role => role.permissions))];
      
      return await permissionsCollection
        .find({ _id: { $in: permissionIds } })
        .toArray();
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return [];
    }
  }

  /**
   * Assign a role to a user
   */
  static async assignRole(
    userId: string, 
    roleId: string, 
    assignedBy: string,
    expiresAt?: Date
  ): Promise<boolean> {
    try {
      const userObjectId = new ObjectId(userId);
      const roleObjectId = new ObjectId(roleId);
      const assignedByObjectId = new ObjectId(assignedBy);

      // Check if assignment already exists
      const existingAssignment = await userRolesCollection.findOne({
        userId: userObjectId,
        roleId: roleObjectId
      });

      if (existingAssignment) {
        return false; // Already assigned
      }

      // Create new role assignment
      const assignment: Omit<UserRole, '_id'> = {
        userId: userObjectId,
        roleId: roleObjectId,
        assignedBy: assignedByObjectId,
        assignedAt: new Date(),
        ...(expiresAt && { expiresAt })
      };

      await userRolesCollection.insertOne(assignment as UserRole);

      // Log the action
      await this.logAction(
        assignedBy,
        'role_assigned',
        'user',
        userId,
        { roleId, expiresAt },
        true
      );

      return true;
    } catch (error) {
      console.error('Error assigning role:', error);
      
      // Log the failed action
      await this.logAction(
        assignedBy,
        'role_assigned',
        'user',
        userId,
        { roleId, error: error instanceof Error ? error.message : 'Unknown error' },
        false
      );
      
      return false;
    }
  }

  /**
   * Remove a role from a user
   */
  static async removeRole(
    userId: string, 
    roleId: string, 
    removedBy: string
  ): Promise<boolean> {
    try {
      const userObjectId = new ObjectId(userId);
      const roleObjectId = new ObjectId(roleId);

      const result = await userRolesCollection.deleteOne({
        userId: userObjectId,
        roleId: roleObjectId
      });

      const success = result.deletedCount > 0;

      // Log the action
      await this.logAction(
        removedBy,
        'role_removed',
        'user',
        userId,
        { roleId },
        success
      );

      return success;
    } catch (error) {
      console.error('Error removing role:', error);
      
      // Log the failed action
      await this.logAction(
        removedBy,
        'role_removed',
        'user',
        userId,
        { roleId, error: error instanceof Error ? error.message : 'Unknown error' },
        false
      );
      
      return false;
    }
  }

  /**
   * Log an action for audit purposes
   */
  static async logAction(
    userId: string,
    action: string,
    resource: string,
    resourceId: string | undefined,
    details: Record<string, any>,
    success: boolean,
    ipAddress: string = 'unknown',
    userAgent: string = 'unknown'
  ): Promise<void> {
    try {
      const auditLog: Omit<AuditLog, '_id'> = {
        userId: new ObjectId(userId),
        action,
        resource,
        ...(resourceId && { resourceId: new ObjectId(resourceId) }),
        details,
        ipAddress,
        userAgent,
        timestamp: new Date(),
        success
      };

      await auditLogsCollection.insertOne(auditLog as AuditLog);
    } catch (error) {
      console.error('Error logging action:', error);
      // Don't throw here to avoid breaking the main operation
    }
  }

  /**
   * Log permission check for audit purposes
   */
  static async logPermissionCheck(
    userId: string,
    resource: string,
    action: string,
    granted: boolean,
    ipAddress: string = 'unknown',
    userAgent: string = 'unknown'
  ): Promise<void> {
    await this.logAction(
      userId,
      'permission_check',
      resource,
      undefined,
      { 
        requestedAction: action,
        granted,
        checkType: 'permission'
      },
      granted,
      ipAddress,
      userAgent
    );
  }

  /**
   * Log admin section access for audit purposes
   */
  static async logAdminAccess(
    userId: string,
    section: string,
    granted: boolean,
    ipAddress: string = 'unknown',
    userAgent: string = 'unknown'
  ): Promise<void> {
    await this.logAction(
      userId,
      'admin_access',
      'system',
      undefined,
      { 
        section,
        granted,
        accessType: 'admin_section'
      },
      granted,
      ipAddress,
      userAgent
    );
  }

  /**
   * Log content management actions
   */
  static async logContentAction(
    userId: string,
    action: string,
    contentId: string | undefined,
    contentType: string,
    details: Record<string, any>,
    success: boolean,
    ipAddress: string = 'unknown',
    userAgent: string = 'unknown'
  ): Promise<void> {
    await this.logAction(
      userId,
      action,
      'content',
      contentId,
      {
        ...details,
        contentType,
        actionType: 'content_management'
      },
      success,
      ipAddress,
      userAgent
    );
  }

  /**
   * Log media management actions
   */
  static async logMediaAction(
    userId: string,
    action: string,
    mediaId: string | undefined,
    mediaType: string,
    details: Record<string, any>,
    success: boolean,
    ipAddress: string = 'unknown',
    userAgent: string = 'unknown'
  ): Promise<void> {
    await this.logAction(
      userId,
      action,
      'media',
      mediaId,
      {
        ...details,
        mediaType,
        actionType: 'media_management'
      },
      success,
      ipAddress,
      userAgent
    );
  }

  /**
   * Get audit logs with filtering
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
  ): Promise<AuditLog[]> {
    try {
      const query: any = {};

      if (filters.userId) {
        query.userId = new ObjectId(filters.userId);
      }
      if (filters.action) {
        query.action = filters.action;
      }
      if (filters.resource) {
        query.resource = filters.resource;
      }
      if (filters.success !== undefined) {
        query.success = filters.success;
      }
      if (filters.startDate || filters.endDate) {
        query.timestamp = {};
        if (filters.startDate) {
          query.timestamp.$gte = filters.startDate;
        }
        if (filters.endDate) {
          query.timestamp.$lte = filters.endDate;
        }
      }

      return await auditLogsCollection
        .find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(skip)
        .toArray();
    } catch (error) {
      console.error('Error getting audit logs:', error);
      return [];
    }
  }

  /**
   * Get audit logs count with filtering
   */
  static async getAuditLogsCount(
    filters: {
      userId?: string;
      action?: string;
      resource?: string;
      startDate?: Date;
      endDate?: Date;
      success?: boolean;
    } = {}
  ): Promise<number> {
    try {
      const query: any = {};

      if (filters.userId) {
        query.userId = new ObjectId(filters.userId);
      }
      if (filters.action) {
        query.action = filters.action;
      }
      if (filters.resource) {
        query.resource = filters.resource;
      }
      if (filters.success !== undefined) {
        query.success = filters.success;
      }
      if (filters.startDate || filters.endDate) {
        query.timestamp = {};
        if (filters.startDate) {
          query.timestamp.$gte = filters.startDate;
        }
        if (filters.endDate) {
          query.timestamp.$lte = filters.endDate;
        }
      }

      return await auditLogsCollection.countDocuments(query);
    } catch (error) {
      console.error('Error getting audit logs count:', error);
      return 0;
    }
  }

  /**
   * Create a new role
   */
  static async createRole(
    name: string,
    description: string,
    permissionIds: string[],
    createdBy: string
  ): Promise<ObjectId | null> {
    try {
      const permissionObjectIds = permissionIds.map(id => new ObjectId(id));

      const role: Omit<Role, '_id'> = {
        name,
        description,
        permissions: permissionObjectIds,
        isSystemRole: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await rolesCollection.insertOne(role as Role);

      // Log the action
      await this.logAction(
        createdBy,
        'role_created',
        'role',
        result.insertedId.toString(),
        { name, description, permissionIds },
        true
      );

      return result.insertedId;
    } catch (error) {
      console.error('Error creating role:', error);
      
      // Log the failed action
      await this.logAction(
        createdBy,
        'role_created',
        'role',
        undefined,
        { name, description, permissionIds, error: error instanceof Error ? error.message : 'Unknown error' },
        false
      );
      
      return null;
    }
  }

  /**
   * Update a role
   */
  static async updateRole(
    roleId: string,
    updates: Partial<Pick<Role, 'name' | 'description' | 'permissions'>>,
    updatedBy: string
  ): Promise<boolean> {
    try {
      const roleObjectId = new ObjectId(roleId);
      
      // Don't allow updating system roles
      const existingRole = await rolesCollection.findOne({ _id: roleObjectId });
      if (existingRole?.isSystemRole) {
        throw new Error('Cannot update system roles');
      }

      const updateData: any = {
        ...updates,
        updatedAt: new Date()
      };

      if (updates.permissions) {
        updateData.permissions = updates.permissions.map(id => new ObjectId(id));
      }

      const result = await rolesCollection.updateOne(
        { _id: roleObjectId },
        { $set: updateData }
      );

      const success = result.modifiedCount > 0;

      // Log the action
      await this.logAction(
        updatedBy,
        'role_updated',
        'role',
        roleId,
        updates,
        success
      );

      return success;
    } catch (error) {
      console.error('Error updating role:', error);
      
      // Log the failed action
      await this.logAction(
        updatedBy,
        'role_updated',
        'role',
        roleId,
        { updates, error: error instanceof Error ? error.message : 'Unknown error' },
        false
      );
      
      return false;
    }
  }

  /**
   * Delete a role (only non-system roles)
   */
  static async deleteRole(roleId: string, deletedBy: string): Promise<boolean> {
    try {
      const roleObjectId = new ObjectId(roleId);
      
      // Don't allow deleting system roles
      const existingRole = await rolesCollection.findOne({ _id: roleObjectId });
      if (existingRole?.isSystemRole) {
        throw new Error('Cannot delete system roles');
      }

      // Remove all user role assignments first
      await userRolesCollection.deleteMany({ roleId: roleObjectId });

      // Delete the role
      const result = await rolesCollection.deleteOne({ _id: roleObjectId });

      const success = result.deletedCount > 0;

      // Log the action
      await this.logAction(
        deletedBy,
        'role_deleted',
        'role',
        roleId,
        { roleName: existingRole?.name },
        success
      );

      return success;
    } catch (error) {
      console.error('Error deleting role:', error);
      
      // Log the failed action
      await this.logAction(
        deletedBy,
        'role_deleted',
        'role',
        roleId,
        { error: error instanceof Error ? error.message : 'Unknown error' },
        false
      );
      
      return false;
    }
  }

  /**
   * Ensure admin users have the admin RBAC role assigned
   * This should be called when a user is promoted to admin or when checking permissions
   */
  static async ensureAdminRoleAssignment(userId: string, assignedBy?: string): Promise<boolean> {
    try {
      const userObjectId = new ObjectId(userId);
      
      // Get the admin role
      const adminRole = await rolesCollection.findOne({ name: SYSTEM_ROLES.ADMIN });
      if (!adminRole) {
        console.error('Admin role not found in RBAC system');
        return false;
      }

      // Check if user already has admin role assigned
      const existingAssignment = await userRolesCollection.findOne({
        userId: userObjectId,
        roleId: adminRole._id
      });

      if (existingAssignment) {
        return true; // Already assigned
      }

      // Assign admin role
      const assignment: Omit<UserRole, '_id'> = {
        userId: userObjectId,
        roleId: adminRole._id,
        assignedBy: assignedBy ? new ObjectId(assignedBy) : userObjectId, // Self-assigned if no assigner
        assignedAt: new Date()
      };

      await userRolesCollection.insertOne(assignment as UserRole);

      // Log the action
      await this.logAction(
        assignedBy || userId,
        'admin_role_auto_assigned',
        'user',
        userId,
        { roleId: adminRole._id.toString(), autoAssigned: true },
        true
      );

      return true;
    } catch (error) {
      console.error('Error ensuring admin role assignment:', error);
      return false;
    }
  }

  /**
   * Check if user is admin (Better Auth role) and ensure RBAC admin role is assigned
   */
  static async checkAndEnsureAdminPermissions(userId: string, userRole?: string): Promise<boolean> {
    if (userRole === 'admin') {
      // Ensure admin RBAC role is assigned
      await this.ensureAdminRoleAssignment(userId);
      return true;
    }
    return false;
  }
}