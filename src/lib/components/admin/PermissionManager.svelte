<script lang="ts">
  import { onMount } from 'svelte';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import { Separator } from '$lib/components/ui/separator';
  import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
  } from '$lib/components/ui/table';
  import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogFooter, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger 
  } from '$lib/components/ui/dialog';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import { 
    Shield, 
    Users, 
    Plus, 
    Edit, 
    Trash2, 
    AlertTriangle,
    CheckCircle,
    XCircle,
    Loader2
  } from '@lucide/svelte';
  import { RBACClient } from '$lib/auth/rbac-client';
  import { toast } from 'svelte-sonner';

  // Component state
  let loading = $state(true);
  let roles = $state<any[]>([]);
  let permissions = $state<any[]>([]);
  let selectedRole = $state<any>(null);
  let showCreateRole = $state(false);
  let showEditRole = $state(false);
  let showDeleteRole = $state(false);

  // Form state
  let roleForm = $state({
    name: '',
    description: '',
    permissions: [] as string[]
  });

  // Permission categories for better organization
  const permissionCategories = {
    'User Management': ['user'],
    'Role Management': ['role'],
    'Content Management': ['content', 'content_type'],
    'Media Management': ['media', 'media_folder'],
    'System Administration': ['system'],
    'Audit & Monitoring': ['audit']
  };

  // Load data on mount
  onMount(async () => {
    await loadData();
  });

  async function loadData() {
    try {
      loading = true;
      
      // Load roles and permissions
      const [rolesResponse, permissionsResponse] = await Promise.all([
        fetch('/api/admin/roles'),
        fetch('/api/admin/permissions')
      ]);

      if (rolesResponse.ok && permissionsResponse.ok) {
        roles = await rolesResponse.json();
        permissions = await permissionsResponse.json();
      } else {
        throw new Error('Failed to load data');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load roles and permissions');
    } finally {
      loading = false;
    }
  }

  async function createRole() {
    try {
      const response = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roleForm)
      });

      if (response.ok) {
        toast.success('Role created successfully');
        showCreateRole = false;
        resetForm();
        await loadData();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create role');
      }
    } catch (error) {
      console.error('Error creating role:', error);
      toast.error('Failed to create role');
    }
  }

  async function updateRole() {
    if (!selectedRole) return;

    try {
      const response = await fetch(`/api/admin/roles/${selectedRole._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roleForm)
      });

      if (response.ok) {
        toast.success('Role updated successfully');
        showEditRole = false;
        resetForm();
        await loadData();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update role');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    }
  }

  async function deleteRole() {
    if (!selectedRole) return;

    try {
      const response = await fetch(`/api/admin/roles/${selectedRole._id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Role deleted successfully');
        showDeleteRole = false;
        selectedRole = null;
        await loadData();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to delete role');
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      toast.error('Failed to delete role');
    }
  }

  function openCreateRole() {
    resetForm();
    showCreateRole = true;
  }

  function openEditRole(role: any) {
    selectedRole = role;
    roleForm = {
      name: role.name,
      description: role.description,
      permissions: role.permissions.map((p: any) => p._id)
    };
    showEditRole = true;
  }

  function openDeleteRole(role: any) {
    selectedRole = role;
    showDeleteRole = true;
  }

  function resetForm() {
    roleForm = {
      name: '',
      description: '',
      permissions: []
    };
    selectedRole = null;
  }

  function togglePermission(permissionId: string) {
    if (roleForm.permissions.includes(permissionId)) {
      roleForm.permissions = roleForm.permissions.filter(id => id !== permissionId);
    } else {
      roleForm.permissions = [...roleForm.permissions, permissionId];
    }
  }

  function getPermissionsByCategory(category: string) {
    const resources = permissionCategories[category] || [];
    return permissions.filter(p => resources.includes(p.resource));
  }

  function getRolePermissionCount(role: any) {
    return role.permissions?.length || 0;
  }

  function getRoleUserCount(role: any) {
    return role.userCount || 0;
  }

  function canEditRole(role: any) {
    return !role.isSystemRole;
  }

  function canDeleteRole(role: any) {
    return !role.isSystemRole && getRoleUserCount(role) === 0;
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Permission Management</h1>
      <p class="text-muted-foreground">
        Manage roles and permissions for your application
      </p>
    </div>
    <Button onclick={openCreateRole} class="gap-2">
      <Plus class="h-4 w-4" />
      Create Role
    </Button>
  </div>

  {#if loading}
    <div class="flex items-center justify-center py-12">
      <div class="text-center space-y-4">
        <Loader2 class="h-8 w-8 animate-spin mx-auto text-primary" />
        <p class="text-sm text-muted-foreground">Loading roles and permissions...</p>
      </div>
    </div>
  {:else}
    <!-- Roles Table -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Shield class="h-5 w-5" />
          Roles
        </CardTitle>
        <CardDescription>
          Manage user roles and their associated permissions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Type</TableHead>
              <TableHead class="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {#each roles as role}
              <TableRow>
                <TableCell class="font-medium">{role.name}</TableCell>
                <TableCell class="max-w-xs truncate">{role.description}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {getRolePermissionCount(role)} permissions
                  </Badge>
                </TableCell>
                <TableCell>
                  <div class="flex items-center gap-2">
                    <Users class="h-4 w-4 text-muted-foreground" />
                    {getRoleUserCount(role)}
                  </div>
                </TableCell>
                <TableCell>
                  {#if role.isSystemRole}
                    <Badge variant="outline">System</Badge>
                  {:else}
                    <Badge>Custom</Badge>
                  {/if}
                </TableCell>
                <TableCell class="text-right">
                  <div class="flex items-center justify-end gap-2">
                    {#if canEditRole(role)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onclick={() => openEditRole(role)}
                        class="h-8 w-8 p-0"
                      >
                        <Edit class="h-4 w-4" />
                      </Button>
                    {/if}
                    {#if canDeleteRole(role)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onclick={() => openDeleteRole(role)}
                        class="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 class="h-4 w-4" />
                      </Button>
                    {:else if !canDeleteRole(role) && !role.isSystemRole}
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled
                        class="h-8 w-8 p-0"
                        title="Cannot delete role with assigned users"
                      >
                        <Trash2 class="h-4 w-4" />
                      </Button>
                    {/if}
                  </div>
                </TableCell>
              </TableRow>
            {/each}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  {/if}
</div>

<!-- Create Role Dialog -->
<Dialog bind:open={showCreateRole}>
  <DialogContent class="max-w-4xl max-h-[80vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Create New Role</DialogTitle>
      <DialogDescription>
        Create a new role and assign permissions to it
      </DialogDescription>
    </DialogHeader>
    
    <div class="space-y-6">
      <!-- Basic Information -->
      <div class="space-y-4">
        <div class="space-y-2">
          <Label for="role-name">Role Name</Label>
          <Input
            id="role-name"
            bind:value={roleForm.name}
            placeholder="Enter role name"
          />
        </div>
        
        <div class="space-y-2">
          <Label for="role-description">Description</Label>
          <Textarea
            id="role-description"
            bind:value={roleForm.description}
            placeholder="Enter role description"
            rows={3}
          />
        </div>
      </div>

      <Separator />

      <!-- Permissions -->
      <div class="space-y-4">
        <div>
          <h3 class="text-lg font-semibold">Permissions</h3>
          <p class="text-sm text-muted-foreground">
            Select the permissions this role should have
          </p>
        </div>

        <div class="space-y-6">
          {#each Object.entries(permissionCategories) as [category, resources]}
            {@const categoryPermissions = getPermissionsByCategory(category)}
            {#if categoryPermissions.length > 0}
              <div class="space-y-3">
                <h4 class="font-medium text-sm">{category}</h4>
                <div class="grid grid-cols-2 gap-3">
                  {#each categoryPermissions as permission}
                    <div class="flex items-center space-x-2">
                      <Checkbox
                        id={permission._id}
                        checked={roleForm.permissions.includes(permission._id)}
                        onCheckedChange={() => togglePermission(permission._id)}
                      />
                      <Label for={permission._id} class="text-sm">
                        {permission.name}
                        <span class="text-muted-foreground">
                          ({permission.resource}:{permission.action})
                        </span>
                      </Label>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          {/each}
        </div>
      </div>
    </div>

    <DialogFooter>
      <Button variant="outline" onclick={() => showCreateRole = false}>
        Cancel
      </Button>
      <Button onclick={createRole} disabled={!roleForm.name.trim()}>
        Create Role
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

<!-- Edit Role Dialog -->
<Dialog bind:open={showEditRole}>
  <DialogContent class="max-w-4xl max-h-[80vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Edit Role</DialogTitle>
      <DialogDescription>
        Update role information and permissions
      </DialogDescription>
    </DialogHeader>
    
    <div class="space-y-6">
      <!-- Basic Information -->
      <div class="space-y-4">
        <div class="space-y-2">
          <Label for="edit-role-name">Role Name</Label>
          <Input
            id="edit-role-name"
            bind:value={roleForm.name}
            placeholder="Enter role name"
          />
        </div>
        
        <div class="space-y-2">
          <Label for="edit-role-description">Description</Label>
          <Textarea
            id="edit-role-description"
            bind:value={roleForm.description}
            placeholder="Enter role description"
            rows={3}
          />
        </div>
      </div>

      <Separator />

      <!-- Permissions -->
      <div class="space-y-4">
        <div>
          <h3 class="text-lg font-semibold">Permissions</h3>
          <p class="text-sm text-muted-foreground">
            Select the permissions this role should have
          </p>
        </div>

        <div class="space-y-6">
          {#each Object.entries(permissionCategories) as [category, resources]}
            {@const categoryPermissions = getPermissionsByCategory(category)}
            {#if categoryPermissions.length > 0}
              <div class="space-y-3">
                <h4 class="font-medium text-sm">{category}</h4>
                <div class="grid grid-cols-2 gap-3">
                  {#each categoryPermissions as permission}
                    <div class="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-${permission._id}`}
                        checked={roleForm.permissions.includes(permission._id)}
                        onCheckedChange={() => togglePermission(permission._id)}
                      />
                      <Label for={`edit-${permission._id}`} class="text-sm">
                        {permission.name}
                        <span class="text-muted-foreground">
                          ({permission.resource}:{permission.action})
                        </span>
                      </Label>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          {/each}
        </div>
      </div>
    </div>

    <DialogFooter>
      <Button variant="outline" onclick={() => showEditRole = false}>
        Cancel
      </Button>
      <Button onclick={updateRole} disabled={!roleForm.name.trim()}>
        Update Role
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

<!-- Delete Role Dialog -->
<Dialog bind:open={showDeleteRole}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle class="flex items-center gap-2">
        <AlertTriangle class="h-5 w-5 text-destructive" />
        Delete Role
      </DialogTitle>
      <DialogDescription>
        Are you sure you want to delete the role "{selectedRole?.name}"? This action cannot be undone.
      </DialogDescription>
    </DialogHeader>

    <Alert variant="destructive">
      <AlertTriangle class="h-4 w-4" />
      <AlertDescription>
        This will permanently delete the role and remove it from all users. 
        Make sure no users are currently assigned to this role.
      </AlertDescription>
    </Alert>

    <DialogFooter>
      <Button variant="outline" onclick={() => showDeleteRole = false}>
        Cancel
      </Button>
      <Button variant="destructive" onclick={deleteRole}>
        Delete Role
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>