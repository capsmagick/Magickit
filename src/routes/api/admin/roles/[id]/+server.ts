import { json, error } from '@sveltejs/kit';
import { ObjectId } from 'mongodb';
import { RBACService } from '$lib/db/rbac';
import { rolesCollection, permissionsCollection, userRolesCollection } from '$lib/db/collections';
import { requirePermission } from '$lib/auth/rbac-middleware';
import type { RequestHandler } from './$types';

// GET /api/admin/roles/[id] - Get specific role
export const GET: RequestHandler = async (event) => {
  // Check permission
  await requirePermission('role', 'read')(event);

  try {
    const { id } = event.params;
    
    if (!ObjectId.isValid(id)) {
      throw error(400, 'Invalid role ID');
    }

    const role = await rolesCollection.findOne({ _id: new ObjectId(id) });
    
    if (!role) {
      throw error(404, 'Role not found');
    }

    // Get permissions for this role
    const permissions = await permissionsCollection
      .find({ _id: { $in: role.permissions } })
      .toArray();
    
    // Get user count for this role
    const userCount = await userRolesCollection.countDocuments({ roleId: role._id });

    return json({
      ...role,
      permissions,
      userCount
    });
  } catch (err) {
    console.error('Error fetching role:', err);
    throw error(500, 'Failed to fetch role');
  }
};

// PUT /api/admin/roles/[id] - Update role
export const PUT: RequestHandler = async (event) => {
  // Check permission
  await requirePermission('role', 'update')(event);

  try {
    const { id } = event.params;
    const { name, description, permissions } = await event.request.json();
    const user = event.locals.user;

    if (!user) {
      throw error(401, 'Unauthorized');
    }

    if (!ObjectId.isValid(id)) {
      throw error(400, 'Invalid role ID');
    }

    // Validate input
    if (!name || !description) {
      throw error(400, 'Name and description are required');
    }

    // Check if role exists
    const existingRole = await rolesCollection.findOne({ _id: new ObjectId(id) });
    if (!existingRole) {
      throw error(404, 'Role not found');
    }

    // Check if it's a system role
    if (existingRole.isSystemRole) {
      throw error(400, 'Cannot update system roles');
    }

    // Check if name is taken by another role
    const nameConflict = await rolesCollection.findOne({ 
      name, 
      _id: { $ne: new ObjectId(id) } 
    });
    if (nameConflict) {
      throw error(400, 'Role name already exists');
    }

    // Update the role
    const success = await RBACService.updateRole(
      id,
      { name, description, permissions },
      user.id
    );

    if (!success) {
      throw error(500, 'Failed to update role');
    }

    // Get the updated role with permissions
    const updatedRole = await rolesCollection.findOne({ _id: new ObjectId(id) });
    const rolePermissions = await permissionsCollection
      .find({ _id: { $in: updatedRole?.permissions || [] } })
      .toArray();
    
    const userCount = await userRolesCollection.countDocuments({ roleId: new ObjectId(id) });

    return json({
      ...updatedRole,
      permissions: rolePermissions,
      userCount
    });
  } catch (err) {
    console.error('Error updating role:', err);
    if (err instanceof Error && err.message.includes('already exists')) {
      throw error(400, err.message);
    }
    throw error(500, 'Failed to update role');
  }
};

// DELETE /api/admin/roles/[id] - Delete role
export const DELETE: RequestHandler = async (event) => {
  // Check permission
  await requirePermission('role', 'delete')(event);

  try {
    const { id } = event.params;
    const user = event.locals.user;

    if (!user) {
      throw error(401, 'Unauthorized');
    }

    if (!ObjectId.isValid(id)) {
      throw error(400, 'Invalid role ID');
    }

    // Check if role exists
    const existingRole = await rolesCollection.findOne({ _id: new ObjectId(id) });
    if (!existingRole) {
      throw error(404, 'Role not found');
    }

    // Check if it's a system role
    if (existingRole.isSystemRole) {
      throw error(400, 'Cannot delete system roles');
    }

    // Check if role has assigned users
    const userCount = await userRolesCollection.countDocuments({ roleId: new ObjectId(id) });
    if (userCount > 0) {
      throw error(400, 'Cannot delete role with assigned users');
    }

    // Delete the role
    const success = await RBACService.deleteRole(id, user.id);

    if (!success) {
      throw error(500, 'Failed to delete role');
    }

    return json({ success: true });
  } catch (err) {
    console.error('Error deleting role:', err);
    if (err instanceof Error && err.message.includes('Cannot delete')) {
      throw error(400, err.message);
    }
    throw error(500, 'Failed to delete role');
  }
};