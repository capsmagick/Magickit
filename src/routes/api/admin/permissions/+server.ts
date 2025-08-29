import { json, error } from '@sveltejs/kit';
import { permissionsCollection, rolesCollection, userRolesCollection } from '$lib/db/collections';
import { auth } from '$lib/auth/auth';
import type { RequestHandler } from './$types';

// GET /api/admin/permissions - Get all permissions
export const GET: RequestHandler = async (event) => {
  try {
    // Check authentication and admin role
    const session = await auth.api.getSession({ headers: event.request.headers });
    if (!session?.user || session.user.role !== 'admin') {
      throw error(401, 'Unauthorized');
    }

    // Get all permissions
    const permissions = await permissionsCollection.find({}).toArray();
    
    // If no permissions exist, return empty array instead of failing
    if (permissions.length === 0) {
      return json([]);
    }
    
    // Get usage statistics for each permission
    const permissionsWithStats = await Promise.all(
      permissions.map(async (permission) => {
        try {
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
            _id: permission._id.toString(),
            roleCount,
            userCount,
            createdAt: permission.createdAt || new Date()
          };
        } catch (statError) {
          console.error('Error getting permission stats:', statError);
          return {
            ...permission,
            _id: permission._id.toString(),
            roleCount: 0,
            userCount: 0,
            createdAt: permission.createdAt || new Date()
          };
        }
      })
    );

    return json(permissionsWithStats);
  } catch (err) {
    console.error('Error fetching permissions:', err);
    // Return empty array instead of failing
    return json([]);
  }
};

// POST /api/admin/permissions - Create new permission
export const POST: RequestHandler = async (event) => {
  try {
    // Check authentication and admin role
    const session = await auth.api.getSession({ headers: event.request.headers });
    if (!session?.user || session.user.role !== 'admin') {
      throw error(401, 'Unauthorized');
    }

    const { name, resource, action, description } = await event.request.json();

    // Validate required fields
    if (!name || !resource || !action || !description) {
      throw error(400, 'All fields are required');
    }

    // Check if permission with same resource/action already exists
    const existingPermission = await permissionsCollection.findOne({ resource, action });
    if (existingPermission) {
      throw error(400, 'Permission with this resource and action already exists');
    }

    // Create the permission
    const permissionData = {
      name,
      resource,
      action,
      description,
      createdAt: new Date()
    };

    const result = await permissionsCollection.insertOne(permissionData);
    
    if (!result.insertedId) {
      throw error(500, 'Failed to create permission');
    }

    // Get the created permission
    const createdPermission = await permissionsCollection.findOne({ _id: result.insertedId });
    
    return json({
      ...createdPermission,
      _id: createdPermission?._id.toString(),
      roleCount: 0,
      userCount: 0
    });
  } catch (err) {
    console.error('Error creating permission:', err);
    if (err instanceof Error && err.message.includes('already exists')) {
      throw error(400, err.message);
    }
    throw error(500, 'Failed to create permission');
  }
};