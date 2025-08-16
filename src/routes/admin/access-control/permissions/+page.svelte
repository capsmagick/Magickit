<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
	import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '$lib/components/ui/dialog';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { 
		Plus, 
		Search, 
		Filter, 
		Pencil, 
		Trash2, 
		Loader2, 
		Key,
		AlertCircle,
		CheckCircle2,
		Shield
	} from '@lucide/svelte';
	import type { Permission } from '$lib/db/models';

	// State management
	let permissions: Permission[] = $state([]);
	let filteredPermissions: Permission[] = $state([]);
	let isLoading = $state(true);
	let searchTerm = $state('');
	let resourceFilter = $state('');
	let actionFilter = $state('');
	let showCreateDialog = $state(false);
	let showEditDialog = $state(false);
	let showDeleteDialog = $state(false);
	let selectedPermission: Permission | null = $state(null);
	let isSubmitting = $state(false);
	let error = $state('');
	let success = $state('');

	// Form data
	let formData = $state({
		name: '',
		resource: '',
		action: '',
		description: ''
	});

	// Form validation errors
	let errors = $state({
		name: '',
		resource: '',
		action: '',
		description: ''
	});

	// Available resources and actions
	const availableResources = ['user', 'role', 'content', 'system', 'notification', 'security'];
	const availableActions = ['create', 'read', 'update', 'delete', 'manage'];

	// Load data on mount
	onMount(async () => {
		await loadPermissions();
		isLoading = false;
	});

	// Reactive filtering
	$effect(() => {
		let filtered = permissions;

		// Search filter
		if (searchTerm.trim() !== '') {
			const term = searchTerm.toLowerCase();
			filtered = filtered.filter(permission => 
				permission.name.toLowerCase().includes(term) ||
				permission.description.toLowerCase().includes(term) ||
				permission.resource.toLowerCase().includes(term) ||
				permission.action.toLowerCase().includes(term)
			);
		}

		// Resource filter
		if (resourceFilter !== '') {
			filtered = filtered.filter(permission => permission.resource === resourceFilter);
		}

		// Action filter
		if (actionFilter !== '') {
			filtered = filtered.filter(permission => permission.action === actionFilter);
		}

		filteredPermissions = filtered;
	});

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
		formData = { name: '', resource: '', action: '', description: '' };
		errors = { name: '', resource: '', action: '', description: '' };
		showCreateDialog = true;
	}

	function openEditDialog(permission: Permission) {
		selectedPermission = permission;
		formData = {
			name: permission.name,
			resource: permission.resource,
			action: permission.action,
			description: permission.description
		};
		errors = { name: '', resource: '', action: '', description: '' };
		showEditDialog = true;
	}

	function openDeleteDialog(permission: Permission) {
		selectedPermission = permission;
		showDeleteDialog = true;
	}

	function validateForm(): boolean {
		errors = { name: '', resource: '', action: '', description: '' };
		let isValid = true;

		if (!formData.name.trim()) {
			errors.name = 'Permission name is required';
			isValid = false;
		} else if (formData.name.length < 3) {
			errors.name = 'Permission name must be at least 3 characters';
			isValid = false;
		}

		if (!formData.resource) {
			errors.resource = 'Resource is required';
			isValid = false;
		}

		if (!formData.action) {
			errors.action = 'Action is required';
			isValid = false;
		}

		if (!formData.description.trim()) {
			errors.description = 'Description is required';
			isValid = false;
		} else if (formData.description.length < 10) {
			errors.description = 'Description must be at least 10 characters';
			isValid = false;
		}

		return isValid;
	}

	async function handleCreatePermission() {
		if (!validateForm()) return;

		isSubmitting = true;
		error = '';
		success = '';

		try {
			const response = await fetch('/api/admin/permissions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			});

			if (response.ok) {
				success = 'Permission created successfully';
				showCreateDialog = false;
				await loadPermissions();
			} else {
				const errorData = await response.json();
				error = errorData.message || 'Failed to create permission';
			}
		} catch (err) {
			error = 'Failed to create permission. Please try again.';
			console.error('Error creating permission:', err);
		} finally {
			isSubmitting = false;
		}
	}

	async function handleUpdatePermission() {
		if (!selectedPermission || !validateForm()) return;

		isSubmitting = true;
		error = '';
		success = '';

		try {
			const response = await fetch(`/api/admin/permissions/${selectedPermission._id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			});

			if (response.ok) {
				success = 'Permission updated successfully';
				showEditDialog = false;
				await loadPermissions();
			} else {
				const errorData = await response.json();
				error = errorData.message || 'Failed to update permission';
			}
		} catch (err) {
			error = 'Failed to update permission. Please try again.';
			console.error('Error updating permission:', err);
		} finally {
			isSubmitting = false;
		}
	}

	async function handleDeletePermission() {
		if (!selectedPermission) return;

		isSubmitting = true;
		error = '';
		success = '';

		try {
			const response = await fetch(`/api/admin/permissions/${selectedPermission._id}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				success = 'Permission deleted successfully';
				showDeleteDialog = false;
				await loadPermissions();
			} else {
				const errorData = await response.json();
				error = errorData.message || 'Failed to delete permission';
			}
		} catch (err) {
			error = 'Failed to delete permission. Please try again.';
			console.error('Error deleting permission:', err);
		} finally {
			isSubmitting = false;
		}
	}

	function resetFilters() {
		searchTerm = '';
		resourceFilter = '';
		actionFilter = '';
	}

	function getUniqueResources(): string[] {
		return [...new Set(permissions.map(p => p.resource))].sort();
	}

	function getUniqueActions(): string[] {
		return [...new Set(permissions.map(p => p.action))].sort();
	}

	function getPermissionsByResource(resource: string): Permission[] {
		return permissions.filter(p => p.resource === resource);
	}

	function capitalizeFirst(str: string): string {
		return str.charAt(0).toUpperCase() + str.slice(1);
	}
</script>

<svelte:head>
	<title>Permissions Management - Admin</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header with Actions -->
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
		<div class="space-y-2">
			<h1 class="text-2xl font-bold">Permissions Management</h1>
			<p class="text-muted-foreground">Manage system permissions and access controls</p>
		</div>
		<Button onclick={openCreateDialog} class="transition-colors duration-200">
			<Plus class="mr-2 h-4 w-4" />
			Create Permission
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
			<div class="flex flex-col lg:flex-row gap-4">
				<div class="flex-1">
					<div class="relative">
						<Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
						<Input 
							type="search" 
							placeholder="Search permissions..." 
							class="pl-8 transition-colors duration-200" 
							bind:value={searchTerm} 
						/>
					</div>
				</div>
				<div class="flex flex-col sm:flex-row gap-2">
					<Select bind:value={resourceFilter}>
						<SelectTrigger class="w-full sm:w-[140px]">
							<SelectValue placeholder="Resource" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="">All Resources</SelectItem>
							{#each getUniqueResources() as resource}
								<SelectItem value={resource}>{capitalizeFirst(resource)}</SelectItem>
							{/each}
						</SelectContent>
					</Select>
					<Select bind:value={actionFilter}>
						<SelectTrigger class="w-full sm:w-[120px]">
							<SelectValue placeholder="Action" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="">All Actions</SelectItem>
							{#each getUniqueActions() as action}
								<SelectItem value={action}>{capitalizeFirst(action)}</SelectItem>
							{/each}
						</SelectContent>
					</Select>
					<Button variant="outline" onclick={resetFilters} class="transition-colors duration-200">
						Reset
					</Button>
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- Permissions by Resource -->
	{#if isLoading}
		<div class="flex justify-center py-12">
			<Loader2 class="h-8 w-8 animate-spin text-primary" />
		</div>
	{:else if filteredPermissions.length === 0}
		<div class="text-center py-12 space-y-4">
			<Key class="h-12 w-12 mx-auto text-muted-foreground" />
			<div class="space-y-2">
				<h3 class="text-lg font-semibold">No permissions found</h3>
				<p class="text-muted-foreground">
					{searchTerm || resourceFilter || actionFilter ? 'No permissions match your search criteria.' : 'Get started by creating your first permission.'}
				</p>
			</div>
			{#if !searchTerm && !resourceFilter && !actionFilter}
				<Button onclick={openCreateDialog} class="transition-colors duration-200">
					<Plus class="mr-2 h-4 w-4" />
					Create Permission
				</Button>
			{/if}
		</div>
	{:else}
		<div class="space-y-6">
			{#each getUniqueResources().filter(resource => filteredPermissions.some(p => p.resource === resource)) as resource}
				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2">
							<Shield class="h-5 w-5" />
							{capitalizeFirst(resource)} Permissions
						</CardTitle>
						<CardDescription>
							Permissions for {resource} resource management
						</CardDescription>
					</CardHeader>
					<CardContent class="p-0">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Permission</TableHead>
									<TableHead>Action</TableHead>
									<TableHead>Description</TableHead>
									<TableHead>Created</TableHead>
									<TableHead class="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{#each getPermissionsByResource(resource).filter(p => filteredPermissions.includes(p)) as permission}
									<TableRow class="transition-colors duration-200 hover:bg-muted/50">
										<TableCell>
											<div class="font-medium text-sm">{permission.name}</div>
										</TableCell>
										<TableCell>
											<Badge variant={permission.action === 'manage' ? 'default' : 'secondary'}>
												{capitalizeFirst(permission.action)}
											</Badge>
										</TableCell>
										<TableCell>
											<p class="text-sm text-muted-foreground">{permission.description}</p>
										</TableCell>
										<TableCell class="text-sm text-muted-foreground">
											{new Date(permission.createdAt).toLocaleDateString()}
										</TableCell>
										<TableCell class="text-right">
											<div class="flex items-center justify-end gap-2">
												<Button 
													variant="ghost" 
													size="icon" 
													onclick={() => openEditDialog(permission)}
													aria-label="Edit permission"
													class="transition-colors duration-200"
												>
													<Pencil class="h-4 w-4" />
												</Button>
												<Button 
													variant="ghost" 
													size="icon" 
													onclick={() => openDeleteDialog(permission)}
													aria-label="Delete permission"
													class="transition-colors duration-200 hover:text-destructive"
												>
													<Trash2 class="h-4 w-4" />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								{/each}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			{/each}
		</div>
	{/if}
</div>

<!-- Create Permission Dialog -->
<Dialog bind:open={showCreateDialog}>
	<DialogContent class="max-w-md">
		<DialogHeader>
			<DialogTitle>Create New Permission</DialogTitle>
			<DialogDescription>
				Create a new permission to control access to system resources.
			</DialogDescription>
		</DialogHeader>
		
		<div class="space-y-4">
			<div class="space-y-2">
				<Label for="create-name" class="text-sm font-medium">Permission Name *</Label>
				<Input 
					id="create-name" 
					placeholder="e.g., user_create" 
					bind:value={formData.name}
					class="transition-colors duration-200"
					aria-describedby="create-name-error"
				/>
				{#if errors.name}
					<p id="create-name-error" class="text-sm text-destructive">{errors.name}</p>
				{/if}
			</div>
			
			<div class="space-y-2">
				<Label for="create-resource" class="text-sm font-medium">Resource *</Label>
				<Select bind:value={formData.resource}>
					<SelectTrigger>
						<SelectValue placeholder="Select resource" />
					</SelectTrigger>
					<SelectContent>
						{#each availableResources as resource}
							<SelectItem value={resource}>{capitalizeFirst(resource)}</SelectItem>
						{/each}
					</SelectContent>
				</Select>
				{#if errors.resource}
					<p class="text-sm text-destructive">{errors.resource}</p>
				{/if}
			</div>
			
			<div class="space-y-2">
				<Label for="create-action" class="text-sm font-medium">Action *</Label>
				<Select bind:value={formData.action}>
					<SelectTrigger>
						<SelectValue placeholder="Select action" />
					</SelectTrigger>
					<SelectContent>
						{#each availableActions as action}
							<SelectItem value={action}>{capitalizeFirst(action)}</SelectItem>
						{/each}
					</SelectContent>
				</Select>
				{#if errors.action}
					<p class="text-sm text-destructive">{errors.action}</p>
				{/if}
			</div>
			
			<div class="space-y-2">
				<Label for="create-description" class="text-sm font-medium">Description *</Label>
				<Textarea 
					id="create-description" 
					placeholder="Describe what this permission allows..." 
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
				onclick={handleCreatePermission}
				disabled={isSubmitting}
				class="transition-colors duration-200"
			>
				{#if isSubmitting}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					Creating...
				{:else}
					Create Permission
				{/if}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>

<!-- Edit Permission Dialog -->
<Dialog bind:open={showEditDialog}>
	<DialogContent class="max-w-md">
		<DialogHeader>
			<DialogTitle>Edit Permission</DialogTitle>
			<DialogDescription>
				Update the permission information.
			</DialogDescription>
		</DialogHeader>
		
		<div class="space-y-4">
			<div class="space-y-2">
				<Label for="edit-name" class="text-sm font-medium">Permission Name *</Label>
				<Input 
					id="edit-name" 
					placeholder="e.g., user_create" 
					bind:value={formData.name}
					class="transition-colors duration-200"
					aria-describedby="edit-name-error"
				/>
				{#if errors.name}
					<p id="edit-name-error" class="text-sm text-destructive">{errors.name}</p>
				{/if}
			</div>
			
			<div class="space-y-2">
				<Label for="edit-resource" class="text-sm font-medium">Resource *</Label>
				<Select bind:value={formData.resource}>
					<SelectTrigger>
						<SelectValue placeholder="Select resource" />
					</SelectTrigger>
					<SelectContent>
						{#each availableResources as resource}
							<SelectItem value={resource}>{capitalizeFirst(resource)}</SelectItem>
						{/each}
					</SelectContent>
				</Select>
				{#if errors.resource}
					<p class="text-sm text-destructive">{errors.resource}</p>
				{/if}
			</div>
			
			<div class="space-y-2">
				<Label for="edit-action" class="text-sm font-medium">Action *</Label>
				<Select bind:value={formData.action}>
					<SelectTrigger>
						<SelectValue placeholder="Select action" />
					</SelectTrigger>
					<SelectContent>
						{#each availableActions as action}
							<SelectItem value={action}>{capitalizeFirst(action)}</SelectItem>
						{/each}
					</SelectContent>
				</Select>
				{#if errors.action}
					<p class="text-sm text-destructive">{errors.action}</p>
				{/if}
			</div>
			
			<div class="space-y-2">
				<Label for="edit-description" class="text-sm font-medium">Description *</Label>
				<Textarea 
					id="edit-description" 
					placeholder="Describe what this permission allows..." 
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
				onclick={handleUpdatePermission}
				disabled={isSubmitting}
				class="transition-colors duration-200"
			>
				{#if isSubmitting}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					Updating...
				{:else}
					Update Permission
				{/if}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>

<!-- Delete Permission Dialog -->
<Dialog bind:open={showDeleteDialog}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Delete Permission</DialogTitle>
			<DialogDescription>
				Are you sure you want to delete the permission "{selectedPermission?.name}"? This action cannot be undone and will remove this permission from all roles.
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
				onclick={handleDeletePermission}
				disabled={isSubmitting}
				class="transition-colors duration-200"
			>
				{#if isSubmitting}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					Deleting...
				{:else}
					Delete Permission
				{/if}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>