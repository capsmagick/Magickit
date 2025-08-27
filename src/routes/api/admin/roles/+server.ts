import { json, error } from '@sveltejs/kit';
import { RBACService } from '$lib/db/rbac';
import { rolesCollection, permissionsCollection, userRolesCollection } from '$lib/db/collections';
import { requirePermission } from '$lib/auth/rbac-middleware';
import type { RequestHandler } from './$types';

// GET /api/admin/roles - Get all roles
export const GET: RequestHandler = async (event) => {
  // Check permission
  await requirePermission('role', 'read')(event);

  try {
    // Get all roles with their permissions populated
    const roles = await rolesCollection.find({}).toArray();
    
    // Get permissions for each role
    const rolesWithPermissions = await Promise.all(
      roles.map(async (role) => {
        const permissions = await permissionsCollection
          .find({ _id: { $in: role.permissions } })
          .toArray();
        
        // Get user count for this role
        const userCount = await userRolesCollection.countDocuments({ roleId: role._id });
        
        return {
          ...role,
          permissions,
          userCount
        };
      })
    );

    return json(rolesWithPermissions);
  } catch (err) {
    console.error('Error fetching roles:', err);
    throw error(500, 'Failed to fetch roles');
  }
};

// POST /api/admin/roles - Create new role
export const POST: RequestHandler = async (event) => {
  // Check permission
  await requirePermission('role', 'create')(event);

  try {
    const { name, description, permissions } = await event.request.json();
    const user = event.locals.user;

    if (!user) {
      throw error(401, 'Unauthorized');
    }

    // Validate input
    if (!name || !description) {
      throw error(400, 'Name and description are required');
    }

    // Check if role name already exists
    const existingRole = await rolesCollection.findOne({ name });
    if (existingRole) {
      throw error(400, 'Role name already exists');
    }

    // Create the role
    const roleId = await RBACService.createRole(name, description, permissions, user.id);
    
    if (!roleId) {
      throw error(500, 'Failed to create role');
    }

    // Get the created role with permissions
    const createdRole = await rolesCollection.findOne({ _id: roleId });
    const rolePermissions = await permissionsCollection
      .find({ _id: { $in: createdRole?.permissions || [] } })
      .toArray();

    return json({
      ...createdRole,
      permissions: rolePermissions,
      userCount: 0
    });
  } catch (err) {
    console.error('Error creating role:', err);
    if (err instanceof Error && err.message.includes('already exists')) {
      throw error(400, err.message);
    }
    throw error(500, 'Failed to create role');
  }
};