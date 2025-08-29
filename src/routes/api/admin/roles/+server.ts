import { json, error } from '@sveltejs/kit';
import { RBACService } from '$lib/db/rbac';
import { rolesCollection, permissionsCollection, userRolesCollection } from '$lib/db/collections';
import { auth } from '$lib/auth/auth';
import type { RequestHandler } from './$types';

// GET /api/admin/roles - Get all roles
export const GET: RequestHandler = async (event) => {
  try {
    // Check authentication and admin role
    const session = await auth.api.getSession({ headers: event.request.headers });
    if (!session?.user || session.user.role !== 'admin') {
      throw error(401, 'Unauthorized');
    }

    // Get all roles with their permissions populated
    const roles = await rolesCollection.find({}).toArray();
    
    // If no roles exist, return empty array
    if (roles.length === 0) {
      return json([]);
    }
    
    // Get permissions for each role
    const rolesWithPermissions = await Promise.all(
      roles.map(async (role) => {
        try {
          const permissions = await permissionsCollection
            .find({ _id: { $in: role.permissions || [] } })
            .toArray();
          
          // Get user count for this role
          const userCount = await userRolesCollection.countDocuments({ roleId: role._id });
          
          return {
            ...role,
            _id: role._id.toString(),
            permissions: permissions.map(p => ({
              ...p,
              _id: p._id.toString()
            })),
            userCount,
            createdAt: role.createdAt || new Date(),
            updatedAt: role.updatedAt || new Date()
          };
        } catch (roleError) {
          console.error('Error processing role:', roleError);
          return {
            ...role,
            _id: role._id.toString(),
            permissions: [],
            userCount: 0,
            createdAt: role.createdAt || new Date()
          };
        }
      })
    );

    return json(rolesWithPermissions);
  } catch (err) {
    console.error('Error fetching roles:', err);
    // Return empty array instead of failing
    return json([]);
  }
};

// POST /api/admin/roles - Create new role
export const POST: RequestHandler = async (event) => {
  try {
    // Check authentication and admin role
    const session = await auth.api.getSession({ headers: event.request.headers });
    if (!session?.user || session.user.role !== 'admin') {
      throw error(401, 'Unauthorized');
    }

    const { name, description, permissions } = await event.request.json();

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
    const roleId = await RBACService.createRole(name, description, permissions, session.user.id);
    
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