<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
	import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '$lib/components/ui/dialog';
	import { Label } from '$lib/components/ui/label';
	import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
	import { 
		Plus, 
		Search, 
		Filter, 
		UserPlus, 
		UserMinus, 
		Loader2, 
		Users, 
		Shield,
		AlertCircle,
		CheckCircle2,
		Calendar,
		History
	} from '@lucide/svelte';
	import type { Role, UserRole } from '$lib/db/models';

	// State management
	let users: any[] = $state([]);
	let roles: Role[] = $state([]);
	let userRoles: UserRole[] = $state([]);
	let filteredUsers: any[] = $state([]);
	let isLoading = $state(true);
	let searchTerm = $state('');
	let roleFilter = $state('');
	let showAssignDialog = $state(false);
	let showBulkAssignDialog = $state(false);
	let showRemoveDialog = $state(false);
	let showHistoryDialog = $state(false);
	let selectedUser: any = $state(null);
	let selectedUsers: string[] = $state([]);
	let selectedRole: string = $state('');
	let selectedUserRole: UserRole | null = $state(null);
	let assignmentHistory: any[] = $state([]);
	let isSubmitting = $state(false);
	let error = $state('');
	let success = $state('');

	// Form data for assignment
	let assignmentData = $state({
		roleId: '',
		expiresAt: ''
	});

	// Load data on mount
	onMount(async () => {
		await Promise.all([
			loadUsers(),
			loadRoles(),
			loadUserRoles()
		]);
		isLoading = false;
	});

	// Reactive filtering
	$effect(() => {
		let filtered = users;

		// Search filter
		if (searchTerm.trim() !== '') {
			const term = searchTerm.toLowerCase();
			filtered = filtered.filter(user => 
				user.name.toLowerCase().includes(term) ||
				user.email.toLowerCase().includes(term)
			);
		}

		// Role filter
		if (roleFilter !== '') {
			const usersWithRole = userRoles
				.filter(ur => ur.roleId.toString() === roleFilter)
				.map(ur => ur.userId.toString());
			
			if (roleFilter === 'no-role') {
				const usersWithAnyRole = userRoles.map(ur => ur.userId.toString());
				filtered = filtered.filter(user => !usersWithAnyRole.includes(user.id));
			} else {
				filtered = filtered.filter(user => usersWithRole.includes(user.id));
			}
		}

		filteredUsers = filtered;
	});

	async function loadUsers() {
		try {
			const response = await fetch('/api/admin/users');
			if (response.ok) {
				users = await response.json();
			} else {
				throw new Error('Failed to load users');
			}
		} catch (err) {
			error = 'Failed to load users. Please try again.';
			console.error('Error loading users:', err);
		}
	}

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

	async function loadUserRoles() {
		try {
			const response = await fetch('/api/admin/user-roles');
			if (response.ok) {
				userRoles = await response.json();
			} else {
				throw new Error('Failed to load user roles');
			}
		} catch (err) {
			error = 'Failed to load user roles. Please try again.';
			console.error('Error loading user roles:', err);
		}
	}

	async function loadAssignmentHistory(userId: string) {
		try {
			const response = await fetch(`/api/admin/user-roles/history/${userId}`);
			if (response.ok) {
				assignmentHistory = await response.json();
			} else {
				throw new Error('Failed to load assignment history');
			}
		} catch (err) {
			error = 'Failed to load assignment history. Please try again.';
			console.error('Error loading assignment history:', err);
		}
	}

	function openAssignDialog(user: any) {
		selectedUser = user;
		assignmentData = { roleId: '', expiresAt: '' };
		showAssignDialog = true;
	}

	function openBulkAssignDialog() {
		if (selectedUsers.length === 0) {
			error = 'Please select users to assign roles to';
			return;
		}
		assignmentData = { roleId: '', expiresAt: '' };
		showBulkAssignDialog = true;
	}

	function openRemoveDialog(userRole: UserRole) {
		selectedUserRole = userRole;
		showRemoveDialog = true;
	}

	async function openHistoryDialog(user: any) {
		selectedUser = user;
		await loadAssignmentHistory(user.id);
		showHistoryDialog = true;
	}

	async function handleAssignRole() {
		if (!selectedUser || !assignmentData.roleId) return;

		isSubmitting = true;
		error = '';
		success = '';

		try {
			const payload = {
				userId: selectedUser.id,
				roleId: assignmentData.roleId,
				...(assignmentData.expiresAt && { expiresAt: assignmentData.expiresAt })
			};

			const response = await fetch('/api/admin/user-roles', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			if (response.ok) {
				success = 'Role assigned successfully';
				showAssignDialog = false;
				await loadUserRoles();
			} else {
				const errorData = await response.json();
				error = errorData.message || 'Failed to assign role';
			}
		} catch (err) {
			error = 'Failed to assign role. Please try again.';
			console.error('Error assigning role:', err);
		} finally {
			isSubmitting = false;
		}
	}

	async function handleBulkAssignRole() {
		if (selectedUsers.length === 0 || !assignmentData.roleId) return;

		isSubmitting = true;
		error = '';
		success = '';

		try {
			const payload = {
				userIds: selectedUsers,
				roleId: assignmentData.roleId,
				...(assignmentData.expiresAt && { expiresAt: assignmentData.expiresAt })
			};

			const response = await fetch('/api/admin/user-roles/bulk', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			if (response.ok) {
				success = `Role assigned to ${selectedUsers.length} users successfully`;
				showBulkAssignDialog = false;
				selectedUsers = [];
				await loadUserRoles();
			} else {
				const errorData = await response.json();
				error = errorData.message || 'Failed to assign roles';
			}
		} catch (err) {
			error = 'Failed to assign roles. Please try again.';
			console.error('Error assigning roles:', err);
		} finally {
			isSubmitting = false;
		}
	}

	async function handleRemoveRole() {
		if (!selectedUserRole) return;

		isSubmitting = true;
		error = '';
		success = '';

		try {
			const response = await fetch(`/api/admin/user-roles/${selectedUserRole._id}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				success = 'Role removed successfully';
				showRemoveDialog = false;
				await loadUserRoles();
			} else {
				const errorData = await response.json();
				error = errorData.message || 'Failed to remove role';
			}
		} catch (err) {
			error = 'Failed to remove role. Please try again.';
			console.error('Error removing role:', err);
		} finally {
			isSubmitting = false;
		}
	}

	function handleUserSelection(userId: string, checked: boolean) {
		if (checked) {
			selectedUsers = [...selectedUsers, userId];
		} else {
			selectedUsers = selectedUsers.filter(id => id !== userId);
		}
	}

	function selectAllUsers(checked: boolean) {
		if (checked) {
			selectedUsers = filteredUsers.map(user => user.id);
		} else {
			selectedUsers = [];
		}
	}

	function resetFilters() {
		searchTerm = '';
		roleFilter = '';
		selectedUsers = [];
	}

	function getUserRoles(userId: string): UserRole[] {
		return userRoles.filter(ur => ur.userId.toString() === userId);
	}

	function getRoleName(roleId: string): string {
		const role = roles.find(r => r._id.toString() === roleId);
		return role ? role.name : 'Unknown Role';
	}

	function getUserInitials(name: string): string {
		return name.split(' ').map(n => n[0]).join('').toUpperCase();
	}

	function isRoleExpired(expiresAt?: string): boolean {
		if (!expiresAt) return false;
		return new Date(expiresAt) < new Date();
	}

	function formatDate(date: string): string {
		return new Date(date).toLocaleDateString();
	}
</script>

<svelte:head>
	<title>Role Assignment - Admin</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header with Actions -->
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
		<div class="space-y-2">
			<h1 class="text-2xl font-bold">Role Assignment</h1>
			<p class="text-muted-foreground">Assign and manage user roles and permissions</p>
		</div>
		<div class="flex gap-2">
			<Button 
				onclick={openBulkAssignDialog} 
				variant="outline"
				disabled={selectedUsers.length === 0}
				class="transition-colors duration-200"
			>
				<UserPlus class="mr-2 h-4 w-4" />
				Bulk Assign ({selectedUsers.length})
			</Button>
		</div>
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
							placeholder="Search users..." 
							class="pl-8 transition-colors duration-200" 
							bind:value={searchTerm} 
						/>
					</div>
				</div>
				<div class="flex flex-col sm:flex-row gap-2">
					<Select bind:value={roleFilter}>
						<SelectTrigger class="w-full sm:w-[160px]">
							<SelectValue placeholder="Filter by role" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="">All Users</SelectItem>
							<SelectItem value="no-role">No Role Assigned</SelectItem>
							{#each roles as role}
								<SelectItem value={role._id}>{role.name}</SelectItem>
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

	<!-- Users Table -->
	<Card>
		<CardContent class="p-0">
			{#if isLoading}
				<div class="flex justify-center py-12">
					<Loader2 class="h-8 w-8 animate-spin text-primary" />
				</div>
			{:else if filteredUsers.length === 0}
				<div class="text-center py-12 space-y-4">
					<Users class="h-12 w-12 mx-auto text-muted-foreground" />
					<div class="space-y-2">
						<h3 class="text-lg font-semibold">No users found</h3>
						<p class="text-muted-foreground">
							{searchTerm || roleFilter ? 'No users match your search criteria.' : 'No users available for role assignment.'}
						</p>
					</div>
				</div>
			{:else}
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead class="w-12">
								<Checkbox 
									checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
									onCheckedChange={selectAllUsers}
									aria-label="Select all users"
								/>
							</TableHead>
							<TableHead>User</TableHead>
							<TableHead>Current Roles</TableHead>
							<TableHead>Last Login</TableHead>
							<TableHead class="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each filteredUsers as user}
							{@const userRolesList = getUserRoles(user.id)}
							<TableRow class="transition-colors duration-200 hover:bg-muted/50">
								<TableCell>
									<Checkbox 
										checked={selectedUsers.includes(user.id)}
										onCheckedChange={(checked) => handleUserSelection(user.id, checked)}
										aria-label="Select user"
									/>
								</TableCell>
								<TableCell>
									<div class="flex items-center gap-3">
										<Avatar>
											<AvatarImage src={user.image} alt={user.name} />
											<AvatarFallback>{getUserInitials(user.name)}</AvatarFallback>
										</Avatar>
										<div class="space-y-1">
											<p class="font-medium text-sm">{user.name}</p>
											<p class="text-sm text-muted-foreground">{user.email}</p>
										</div>
									</div>
								</TableCell>
								<TableCell>
									<div class="flex flex-wrap gap-1">
										{#if userRolesList.length === 0}
											<Badge variant="outline" class="text-xs">No roles</Badge>
										{:else}
											{#each userRolesList as userRole}
												{@const expired = isRoleExpired(userRole.expiresAt)}
												<Badge 
													variant={expired ? "destructive" : "default"} 
													class="text-xs cursor-pointer transition-colors duration-200"
													onclick={() => openRemoveDialog(userRole)}
													title={expired ? 'Expired role - click to remove' : 'Click to remove role'}
												>
													{getRoleName(userRole.roleId.toString())}
													{#if expired}
														(Expired)
													{/if}
												</Badge>
											{/each}
										{/if}
									</div>
								</TableCell>
								<TableCell class="text-sm text-muted-foreground">
									{user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
								</TableCell>
								<TableCell class="text-right">
									<div class="flex items-center justify-end gap-2">
										<Button 
											variant="ghost" 
											size="icon" 
											onclick={() => openAssignDialog(user)}
											aria-label="Assign role"
											class="transition-colors duration-200"
										>
											<UserPlus class="h-4 w-4" />
										</Button>
										<Button 
											variant="ghost" 
											size="icon" 
											onclick={() => openHistoryDialog(user)}
											aria-label="View assignment history"
											class="transition-colors duration-200"
										>
											<History class="h-4 w-4" />
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

<!-- Assign Role Dialog -->
<Dialog bind:open={showAssignDialog}>
	<DialogContent class="max-w-md">
		<DialogHeader>
			<DialogTitle>Assign Role</DialogTitle>
			<DialogDescription>
				Assign a role to {selectedUser?.name}
			</DialogDescription>
		</DialogHeader>
		
		<div class="space-y-4">
			<div class="space-y-2">
				<Label for="assign-role" class="text-sm font-medium">Role *</Label>
				<Select bind:value={assignmentData.roleId}>
					<SelectTrigger>
						<SelectValue placeholder="Select role" />
					</SelectTrigger>
					<SelectContent>
						{#each roles as role}
							<SelectItem value={role._id}>{role.name}</SelectItem>
						{/each}
					</SelectContent>
				</Select>
			</div>
			
			<div class="space-y-2">
				<Label for="assign-expires" class="text-sm font-medium">Expires At (Optional)</Label>
				<Input 
					id="assign-expires" 
					type="datetime-local"
					bind:value={assignmentData.expiresAt}
					class="transition-colors duration-200"
				/>
				<p class="text-xs text-muted-foreground">Leave empty for permanent assignment</p>
			</div>
		</div>

		<DialogFooter>
			<Button 
				variant="outline" 
				onclick={() => showAssignDialog = false}
				disabled={isSubmitting}
				class="transition-colors duration-200"
			>
				Cancel
			</Button>
			<Button 
				onclick={handleAssignRole}
				disabled={isSubmitting || !assignmentData.roleId}
				class="transition-colors duration-200"
			>
				{#if isSubmitting}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					Assigning...
				{:else}
					Assign Role
				{/if}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>

<!-- Bulk Assign Dialog -->
<Dialog bind:open={showBulkAssignDialog}>
	<DialogContent class="max-w-md">
		<DialogHeader>
			<DialogTitle>Bulk Assign Role</DialogTitle>
			<DialogDescription>
				Assign a role to {selectedUsers.length} selected users
			</DialogDescription>
		</DialogHeader>
		
		<div class="space-y-4">
			<div class="space-y-2">
				<Label for="bulk-assign-role" class="text-sm font-medium">Role *</Label>
				<Select bind:value={assignmentData.roleId}>
					<SelectTrigger>
						<SelectValue placeholder="Select role" />
					</SelectTrigger>
					<SelectContent>
						{#each roles as role}
							<SelectItem value={role._id}>{role.name}</SelectItem>
						{/each}
					</SelectContent>
				</Select>
			</div>
			
			<div class="space-y-2">
				<Label for="bulk-assign-expires" class="text-sm font-medium">Expires At (Optional)</Label>
				<Input 
					id="bulk-assign-expires" 
					type="datetime-local"
					bind:value={assignmentData.expiresAt}
					class="transition-colors duration-200"
				/>
				<p class="text-xs text-muted-foreground">Leave empty for permanent assignment</p>
			</div>
		</div>

		<DialogFooter>
			<Button 
				variant="outline" 
				onclick={() => showBulkAssignDialog = false}
				disabled={isSubmitting}
				class="transition-colors duration-200"
			>
				Cancel
			</Button>
			<Button 
				onclick={handleBulkAssignRole}
				disabled={isSubmitting || !assignmentData.roleId}
				class="transition-colors duration-200"
			>
				{#if isSubmitting}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					Assigning...
				{:else}
					Assign to {selectedUsers.length} Users
				{/if}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>

<!-- Remove Role Dialog -->
<Dialog bind:open={showRemoveDialog}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Remove Role</DialogTitle>
			<DialogDescription>
				Are you sure you want to remove the role "{selectedUserRole ? getRoleName(selectedUserRole.roleId.toString()) : ''}" from this user?
			</DialogDescription>
		</DialogHeader>
		
		<DialogFooter>
			<Button 
				variant="outline" 
				onclick={() => showRemoveDialog = false}
				disabled={isSubmitting}
				class="transition-colors duration-200"
			>
				Cancel
			</Button>
			<Button 
				variant="destructive"
				onclick={handleRemoveRole}
				disabled={isSubmitting}
				class="transition-colors duration-200"
			>
				{#if isSubmitting}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					Removing...
				{:else}
					Remove Role
				{/if}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>

<!-- Assignment History Dialog -->
<Dialog bind:open={showHistoryDialog}>
	<DialogContent class="max-w-2xl max-h-[80vh] overflow-y-auto">
		<DialogHeader>
			<DialogTitle>Assignment History</DialogTitle>
			<DialogDescription>
				Role assignment history for {selectedUser?.name}
			</DialogDescription>
		</DialogHeader>
		
		<div class="space-y-4">
			{#if assignmentHistory.length === 0}
				<div class="text-center py-8 space-y-2">
					<Calendar class="h-8 w-8 mx-auto text-muted-foreground" />
					<p class="text-muted-foreground">No assignment history found</p>
				</div>
			{:else}
				<div class="space-y-3">
					{#each assignmentHistory as entry}
						<Card>
							<CardContent class="p-4">
								<div class="flex items-start justify-between">
									<div class="space-y-1">
										<div class="flex items-center gap-2">
											<Badge variant={entry.action === 'assigned' ? 'default' : 'destructive'}>
												{entry.action}
											</Badge>
											<span class="font-medium">{entry.roleName}</span>
										</div>
										<p class="text-sm text-muted-foreground">
											By {entry.assignedByName} on {formatDate(entry.timestamp)}
										</p>
										{#if entry.expiresAt}
											<p class="text-xs text-muted-foreground">
												Expires: {formatDate(entry.expiresAt)}
											</p>
										{/if}
									</div>
								</div>
							</CardContent>
						</Card>
					{/each}
				</div>
			{/if}
		</div>

		<DialogFooter>
			<Button 
				variant="outline" 
				onclick={() => showHistoryDialog = false}
				class="transition-colors duration-200"
			>
				Close
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>