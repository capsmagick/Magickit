<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
	import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '$lib/components/ui/dialog';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { 
		Plus, 
		Search, 
		Filter, 
		Pencil, 
		Trash2, 
		Loader2, 
		Users, 
		Shield,
		AlertCircle,
		CheckCircle2
	} from '@lucide/svelte';
	import type { Role, Permission } from '$lib/db/models';

	// State management
	let roles: Role[] = $state([]);
	let permissions: Permission[] = $state([]);
	let filteredRoles: Role[] = $state([]);
	let isLoading = $state(true);
	let searchTerm = $state('');
	let showCreateDialog = $state(false);
	let showEditDialog = $state(false);
	let showDeleteDialog = $state(false);
	let selectedRole: Role | null = $state(null);
	let isSubmitting = $state(false);
	let error = $state('');
	let success = $state('');

	// Form data
	let formData = $state({
		name: '',
		description: '',
		permissions: [] as string[]
	});

	// Form validation errors
	let errors = $state({
		name: '',
		description: ''
	});

	// Load data on mount
	onMount(async () => {
		await loadRoles();
		await loadPermissions();
		isLoading = false;
	});

	// Reactive filtering
	$effect(() => {
		if (searchTerm.trim() === '') {
			filteredRoles = roles;
		} else {
			const term = searchTerm.toLowerCase();
			filteredRoles = roles.filter(role => 
				role.name.toLowerCase().includes(term) ||
				role.description.toLowerCase().includes(term)
			);
		}
	});

	async function loadRoles() {
		try {
			const response = await fetch('/api/admin/roles');
			if (response.ok) {
				roles = await response.json();
			} else {
				throw new Error('Failed to load roles');
			}
		} catch (err) {
			error = 'Failed to load roles. Please try again.';
			console.error('Error loading roles:', err);
		}
	}

	async function loadPermissions() {
		try {
			const response = await fetch('/api/admin/permissions');
			if (response.ok) {
				permissions = await response.json();
			} else {
				throw new Error('Failed to load permissions');
			}
		} catch (err) {
			error = 'Failed to load permissions. Please try again.';
			console.error('Error loading permissions:', err);
		}
	}

	function openCreateDialog() {
		formData = { name: '', description: '', permissions: [] };
		errors = { name: '', description: '' };
		showCreateDialog = true;
	}

	function openEditDialog(role: Role) {
		selectedRole = role;
		formData = {
			name: role.name,
			description: role.description,
			permissions: role.permissions.map(p => p.toString())
		};
		errors = { name: '', description: '' };
		showEditDialog = true;
	}

	function openDeleteDialog(role: Role) {
		selectedRole = role;
		showDeleteDialog = true;
	}

	function validateForm(): boolean {
		errors = { name: '', description: '' };
		let isValid = true;

		if (!formData.name.trim()) {
			errors.name = 'Role name is required';
			isValid = false;
		} else if (formData.name.length < 2) {
			errors.name = 'Role name must be at least 2 characters';
			isValid = false;
		}

		if (!formData.description.trim()) {
			errors.description = 'Role description is required';
			isValid = false;
		} else if (formData.description.length < 10) {
			errors.description = 'Role description must be at least 10 characters';
			isValid = false;
		}

		return isValid;
	}

	async function handleCreateRole() {
		if (!validateForm()) return;

		isSubmitting = true;
		error = '';
		success = '';

		try {
			const response = await fetch('/api/admin/roles', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			});

			if (response.ok) {
				success = 'Role created successfully';
				showCreateDialog = false;
				await loadRoles();
			} else {
				const errorData = await response.json();
				error = errorData.message || 'Failed to create role';
			}
		} catch (err) {
			error = 'Failed to create role. Please try again.';
			console.error('Error creating role:', err);
		} finally {
			isSubmitting = false;
		}
	}

	async function handleUpdateRole() {
		if (!selectedRole || !validateForm()) return;

		isSubmitting = true;
		error = '';
		success = '';

		try {
			const response = await fetch(`/api/admin/roles/${selectedRole._id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			});

			if (response.ok) {
				success = 'Role updated successfully';
				showEditDialog = false;
				await loadRoles();
			} else {
				const errorData = await response.json();
				error = errorData.message || 'Failed to update role';
			}
		} catch (err) {
			error = 'Failed to update role. Please try again.';
			console.error('Error updating role:', err);
		} finally {
			isSubmitting = false;
		}
	}

	async function handleDeleteRole() {
		if (!selectedRole) return;

		isSubmitting = true;
		error = '';
		success = '';

		try {
			const response = await fetch(`/api/admin/roles/${selectedRole._id}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				success = 'Role deleted successfully';
				showDeleteDialog = false;
				await loadRoles();
			} else {
				const errorData = await response.json();
				error = errorData.message || 'Failed to delete role';
			}
		} catch (err) {
			error = 'Failed to delete role. Please try again.';
			console.error('Error deleting role:', err);
		} finally {
			isSubmitting = false;
		}
	}

	function handlePermissionToggle(permissionId: string, checked: boolean) {
		if (checked) {
			formData.permissions = [...formData.permissions, permissionId];
		} else {
			formData.permissions = formData.permissions.filter(id => id !== permissionId);
		}
	}

	function resetFilters() {
		searchTerm = '';
	}

	function getPermissionsByResource(resource: string): Permission[] {
		return permissions.filter(p => p.resource === resource);
	}

	function getUniqueResources(): string[] {
		return [...new Set(permissions.map(p => p.resource))];
	}
</script>

<svelte:head>
	<title>Roles Management - Admin</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header with Actions -->
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
		<div class="space-y-2">
			<h1 class="text-2xl font-bold">Roles Management</h1>
			<p class="text-muted-foreground">Manage user roles and their permissions</p>
		</div>
		<Button onclick={openCreateDialog} class="transition-colors duration-200">
			<Plus class="mr-2 h-4 w-4" />
			Create Role
		</Button>
	</div>

	<!-- Status Messages -->
	{#if error}
		<Alert variant="destructive">
			<AlertCircle class="h-4 w-4" />
			<AlertDescription>{error}</AlertDescription>
		</Alert>
	{/if}

	{#if success}
		<Alert>
			<CheckCircle2 class="h-4 w-4" />
			<AlertDescription>{success}</AlertDescription>
		</Alert>
	{/if}

	<!-- Search and Filters -->
	<Card>
		<CardContent class="p-4">
			<div class="flex flex-col sm:flex-row gap-4">
				<div class="flex-1">
					<div class="relative">
						<Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
						<Input 
							type="search" 
							placeholder="Search roles..." 
							class="pl-8 transition-colors duration-200" 
							bind:value={searchTerm} 
						/>
					</div>
				</div>
				<div class="flex gap-2">
					<Button variant="outline" onclick={resetFilters} class="transition-colors duration-200">
						Reset
					</Button>
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- Roles Table -->
	<Card>
		<CardContent class="p-0">
			{#if isLoading}
				<div class="flex justify-center py-12">
					<Loader2 class="h-8 w-8 animate-spin text-primary" />
				</div>
			{:else if filteredRoles.length === 0}
				<div class="text-center py-12 space-y-4">
					<Shield class="h-12 w-12 mx-auto text-muted-foreground" />
					<div class="space-y-2">
						<h3 class="text-lg font-semibold">No roles found</h3>
						<p class="text-muted-foreground">
							{searchTerm ? 'No roles match your search criteria.' : 'Get started by creating your first role.'}
						</p>
					</div>
					{#if !searchTerm}
						<Button onclick={openCreateDialog} class="transition-colors duration-200">
							<Plus class="mr-2 h-4 w-4" />
							Create Role
						</Button>
					{/if}
				</div>
			{:else}
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Role</TableHead>
							<TableHead>Permissions</TableHead>
							<TableHead>Type</TableHead>
							<TableHead>Created</TableHead>
							<TableHead class="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each filteredRoles as role}
							<TableRow class="transition-colors duration-200 hover:bg-muted/50">
								<TableCell>
									<div class="space-y-1">
										<p class="font-medium text-sm">{role.name}</p>
										<p class="text-sm text-muted-foreground">{role.description}</p>
									</div>
								</TableCell>
								<TableCell>
									<Badge variant="secondary" class="text-xs">
										{role.permissions.length} permissions
									</Badge>
								</TableCell>
								<TableCell>
									<Badge variant={role.isSystemRole ? 'default' : 'outline'}>
										{role.isSystemRole ? 'System' : 'Custom'}
									</Badge>
								</TableCell>
								<TableCell class="text-sm text-muted-foreground">
									{new Date(role.createdAt).toLocaleDateString()}
								</TableCell>
								<TableCell class="text-right">
									<div class="flex items-center justify-end gap-2">
										<Button 
											variant="ghost" 
											size="icon" 
											onclick={() => openEditDialog(role)}
											aria-label="Edit role"
											class="transition-colors duration-200"
											disabled={role.isSystemRole}
										>
											<Pencil class="h-4 w-4" />
										</Button>
										<Button 
											variant="ghost" 
											size="icon" 
											onclick={() => openDeleteDialog(role)}
											aria-label="Delete role"
											class="transition-colors duration-200 hover:text-destructive"
											disabled={role.isSystemRole}
										>
											<Trash2 class="h-4 w-4" />
										</Button>
									</div>
								</TableCell>
							</TableRow>
						{/each}
					</TableBody>
				</Table>
			{/if}
		</CardContent>
	</Card>
</div>

<!-- Create Role Dialog -->
<Dialog bind:open={showCreateDialog}>
	<DialogContent class="max-w-2xl max-h-[80vh] overflow-y-auto">
		<DialogHeader>
			<DialogTitle>Create New Role</DialogTitle>
			<DialogDescription>
				Create a new role and assign permissions to control user access.
			</DialogDescription>
		</DialogHeader>
		
		<div class="space-y-6">
			<!-- Basic Information -->
			<div class="space-y-4">
				<div class="space-y-2">
					<Label for="create-name" class="text-sm font-medium">Role Name *</Label>
					<Input 
						id="create-name" 
						placeholder="Enter role name" 
						bind:value={formData.name}
						class="transition-colors duration-200"
						aria-describedby="create-name-error"
					/>
					{#if errors.name}
						<p id="create-name-error" class="text-sm text-destructive">{errors.name}</p>
					{/if}
				</div>
				
				<div class="space-y-2">
					<Label for="create-description" class="text-sm font-medium">Description *</Label>
					<Textarea 
						id="create-description" 
						placeholder="Describe the role and its purpose..." 
						rows={3}
						bind:value={formData.description}
						class="transition-colors duration-200 resize-none"
						aria-describedby="create-description-error"
					/>
					{#if errors.description}
						<p id="create-description-error" class="text-sm text-destructive">{errors.description}</p>
					{/if}
				</div>
			</div>

			<!-- Permissions -->
			<div class="space-y-4">
				<div class="space-y-2">
					<Label class="text-sm font-medium">Permissions</Label>
					<p class="text-sm text-muted-foreground">Select the permissions this role should have</p>
				</div>
				
				<div class="space-y-4">
					{#each getUniqueResources() as resource}
						<Card>
							<CardHeader class="pb-3">
								<CardTitle class="text-base capitalize">{resource} Management</CardTitle>
							</CardHeader>
							<CardContent class="space-y-3">
								{#each getPermissionsByResource(resource) as permission}
									<div class="flex items-center space-x-2">
										<Checkbox 
											id="create-perm-{permission._id}"
											checked={formData.permissions.includes(permission._id.toString())}
											onCheckedChange={(checked) => handlePermissionToggle(permission._id.toString(), checked)}
										/>
										<Label 
											for="create-perm-{permission._id}" 
											class="text-sm font-normal cursor-pointer flex-1"
										>
											<span class="font-medium capitalize">{permission.action}</span>
											<span class="text-muted-foreground ml-1">- {permission.description}</span>
										</Label>
									</div>
								{/each}
							</CardContent>
						</Card>
					{/each}
				</div>
			</div>
		</div>

		<DialogFooter>
			<Button 
				variant="outline" 
				onclick={() => showCreateDialog = false}
				disabled={isSubmitting}
				class="transition-colors duration-200"
			>
				Cancel
			</Button>
			<Button 
				onclick={handleCreateRole}
				disabled={isSubmitting}
				class="transition-colors duration-200"
			>
				{#if isSubmitting}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					Creating...
				{:else}
					Create Role
				{/if}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>

<!-- Edit Role Dialog -->
<Dialog bind:open={showEditDialog}>
	<DialogContent class="max-w-2xl max-h-[80vh] overflow-y-auto">
		<DialogHeader>
			<DialogTitle>Edit Role</DialogTitle>
			<DialogDescription>
				Update the role information and permissions.
			</DialogDescription>
		</DialogHeader>
		
		<div class="space-y-6">
			<!-- Basic Information -->
			<div class="space-y-4">
				<div class="space-y-2">
					<Label for="edit-name" class="text-sm font-medium">Role Name *</Label>
					<Input 
						id="edit-name" 
						placeholder="Enter role name" 
						bind:value={formData.name}
						class="transition-colors duration-200"
						aria-describedby="edit-name-error"
					/>
					{#if errors.name}
						<p id="edit-name-error" class="text-sm text-destructive">{errors.name}</p>
					{/if}
				</div>
				
				<div class="space-y-2">
					<Label for="edit-description" class="text-sm font-medium">Description *</Label>
					<Textarea 
						id="edit-description" 
						placeholder="Describe the role and its purpose..." 
						rows={3}
						bind:value={formData.description}
						class="transition-colors duration-200 resize-none"
						aria-describedby="edit-description-error"
					/>
					{#if errors.description}
						<p id="edit-description-error" class="text-sm text-destructive">{errors.description}</p>
					{/if}
				</div>
			</div>

			<!-- Permissions -->
			<div class="space-y-4">
				<div class="space-y-2">
					<Label class="text-sm font-medium">Permissions</Label>
					<p class="text-sm text-muted-foreground">Select the permissions this role should have</p>
				</div>
				
				<div class="space-y-4">
					{#each getUniqueResources() as resource}
						<Card>
							<CardHeader class="pb-3">
								<CardTitle class="text-base capitalize">{resource} Management</CardTitle>
							</CardHeader>
							<CardContent class="space-y-3">
								{#each getPermissionsByResource(resource) as permission}
									<div class="flex items-center space-x-2">
										<Checkbox 
											id="edit-perm-{permission._id}"
											checked={formData.permissions.includes(permission._id.toString())}
											onCheckedChange={(checked) => handlePermissionToggle(permission._id.toString(), checked)}
										/>
										<Label 
											for="edit-perm-{permission._id}" 
											class="text-sm font-normal cursor-pointer flex-1"
										>
											<span class="font-medium capitalize">{permission.action}</span>
											<span class="text-muted-foreground ml-1">- {permission.description}</span>
										</Label>
									</div>
								{/each}
							</CardContent>
						</Card>
					{/each}
				</div>
			</div>
		</div>

		<DialogFooter>
			<Button 
				variant="outline" 
				onclick={() => showEditDialog = false}
				disabled={isSubmitting}
				class="transition-colors duration-200"
			>
				Cancel
			</Button>
			<Button 
				onclick={handleUpdateRole}
				disabled={isSubmitting}
				class="transition-colors duration-200"
			>
				{#if isSubmitting}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					Updating...
				{:else}
					Update Role
				{/if}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>

<!-- Delete Role Dialog -->
<Dialog bind:open={showDeleteDialog}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Delete Role</DialogTitle>
			<DialogDescription>
				Are you sure you want to delete the role "{selectedRole?.name}"? This action cannot be undone and will remove all user assignments for this role.
			</DialogDescription>
		</DialogHeader>
		
		<DialogFooter>
			<Button 
				variant="outline" 
				onclick={() => showDeleteDialog = false}
				disabled={isSubmitting}
				class="transition-colors duration-200"
			>
				Cancel
			</Button>
			<Button 
				variant="destructive"
				onclick={handleDeleteRole}
				disabled={isSubmitting}
				class="transition-colors duration-200"
			>
				{#if isSubmitting}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					Deleting...
				{:else}
					Delete Role
				{/if}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>