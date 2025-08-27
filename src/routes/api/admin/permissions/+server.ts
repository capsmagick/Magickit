import { json, error } from '@sveltejs/kit';
import { permissionsCollection, rolesCollection, userRolesCollection } from '$lib/db/collections';
import { requirePermission } from '$lib/auth/rbac-middleware';
import type { RequestHandler } from './$types';

// GET /api/admin/permissions - Get all permissions
export const GET: RequestHandler = async (event) => {
  // Check permission
  await requirePermission('role', 'read')(event);

  try {
    // Get all permissions
    const permissions = await permissionsCollection.find({}).toArray();
    
    // Get usage statistics for each permission
    const permissionsWithStats = await Promise.all(
      permissions.map(async (permission) => {
        // Count roles that have this permission
        const roleCount = await rolesCollection.countDocuments({
          permissions: permission._id
        });
        
        // Count users that have this permission (through roles)
        const rolesWithPermission = await rolesCollection
          .find({ permissions: permission._id })
          .toArray();
        
        const roleIds = rolesWithPermission.map(role => role._id);
        const userCount = await userRolesCollection.countDocuments({
          roleId: { $in: roleIds }
        });
        
        return {
          ...permission,
          roleCount,
          userCount
        };
      })
    );

    // Group permissions by resource for better organization
    const groupedPermissions = permissionsWithStats.reduce((acc, permission) => {
      const resource = permission.resource;
      if (!acc[resource]) {
        acc[resource] = [];
      }
      acc[resource].push(permission);
      return acc;
    }, {} as Record<string, any[]>);

    return json({
      permissions: permissionsWithStats,
      grouped: groupedPermissions
    });
  } catch (err) {
    console.error('Error fetching permissions:', err);
    throw error(500, 'Failed to fetch permissions');
  }
};