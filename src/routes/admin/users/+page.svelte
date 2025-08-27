<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Badge } from '$lib/components/ui/badge';
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
	import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '$lib/components/ui/dialog';
	import * as Select from '$lib/components/ui/select';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
	import { authClient } from '$lib/auth/auth-client';
	import { goto } from '$app/navigation';
	import {
		Users,
		UserPlus,
		Search,
		RefreshCw,
		Eye,
		Edit,
		Ban,
		Unlock,
		Shield,
		Activity,
		Clock,
		AlertCircle,
		CheckCircle2,
		Loader2,
		Filter,
		MoreHorizontal,
		Trash2
	} from '@lucide/svelte';

	// State management with proper $state() declarations
	let users: any[] = $state([]);
	let filteredUsers: any[] = $state([]);
	let isLoading = $state(true);
	let error = $state('');
	let success = $state('');
	let searchTerm = $state('');
	let roleFilter = $state('');
	let statusFilter = $state('');
	let showCreateDialog = $state(false);
	let showUserDetailsDialog = $state(false);
	let showDeleteDialog = $state(false);
	let selectedUser: any = $state(null);
	let isSubmitting = $state(false);
	let hasCheckedAuth = $state(false);

	// Pagination
	let currentPage = $state(1);
	let itemsPerPage = $state(10);
	let totalItems = $state(0);

	// Form data
	let formData = $state({
		name: '',
		email: '',
		password: '',
		role: 'user'
	});

	// Form validation errors
	let errors = $state({
		name: '',
		email: '',
		password: ''
	});

	const session = authClient.useSession();

	// Load data on mount
	onMount(async () => {
		await loadUsers();
		isLoading = false;
	});

	// Reactive filtering
	$effect(() => {
		let filtered = users;

		// Search filter
		if (searchTerm.trim() !== '') {
			const term = searchTerm.toLowerCase();
			filtered = filtered.filter(user => 
				user.name?.toLowerCase().includes(term) ||
				user.email?.toLowerCase().includes(term)
			);
		}

		// Role filter
		if (roleFilter !== '') {
			filtered = filtered.filter(user => user.role === roleFilter);
		}

		// Status filter
		if (statusFilter !== '') {
			if (statusFilter === 'active') {
				filtered = filtered.filter(user => !user.banned);
			} else if (statusFilter === 'banned') {
				filtered = filtered.filter(user => user.banned);
			}
		}

		filteredUsers = filtered;
		totalItems = filtered.length;
		currentPage = 1; // Reset to first page when filters change
	});

	// Paginated users - computed values
	let paginatedUsers = $derived(() => {
		if (!filteredUsers || !Array.isArray(filteredUsers)) {
			return [];
		}
		return filteredUsers.slice(
			(currentPage - 1) * itemsPerPage,
			currentPage * itemsPerPage
		);
	});

	let totalPages = $derived(Math.ceil(totalItems / itemsPerPage));

	// Authentication check
	$effect(() => {
		if (!hasCheckedAuth && $session.data) {
			hasCheckedAuth = true;
			if ($session.data.user.role !== 'admin') {
				goto('/login?returnTo=/admin/users');
				return;
			}
		}
	});

	async function loadUsers() {
		try {
			// Build query parameters
			const params = new URLSearchParams({
				page: currentPage.toString(),
				limit: itemsPerPage.toString(),
				search: searchTerm,
				role: roleFilter,
				status: statusFilter,
				sortBy: 'createdAt',
				sortOrder: 'desc'
			});

			const response = await fetch(`/api/admin/users?${params}`);
			if (response.ok) {
				const result = await response.json();
				users = result.users || [];
				totalItems = result.pagination?.total || 0;
			} else {
				throw new Error('Failed to load users');
			}
		} catch (err) {
			error = 'Failed to load users. Please try again.';
			console.error('Error loading users:', err);
		}
	}

	function validateForm(): boolean {
		errors = { name: '', email: '', password: '' };
		let isValid = true;

		if (!formData.name.trim()) {
			errors.name = 'Name is required';
			isValid = false;
		} else if (formData.name.length < 2) {
			errors.name = 'Name must be at least 2 characters';
			isValid = false;
		}

		if (!formData.email.trim()) {
			errors.email = 'Email is required';
			isValid = false;
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
			errors.email = 'Please enter a valid email address';
			isValid = false;
		}

		if (!formData.password.trim()) {
			errors.password = 'Password is required';
			isValid = false;
		} else if (formData.password.length < 6) {
			errors.password = 'Password must be at least 6 characters';
			isValid = false;
		}

		return isValid;
	}

	async function handleCreateUser() {
		if (!validateForm()) return;

		isSubmitting = true;
		error = '';
		success = '';

		try {
			const result = await authClient.admin.createUser({
				email: formData.email,
				password: formData.password,
				name: formData.name,
				role: formData.role
			});

			if (result.error) {
				error = result.error.message || 'Failed to create user';
			} else {
				success = 'User created successfully';
				showCreateDialog = false;
				resetForm();
				await loadUsers();
			}
		} catch (err) {
			error = 'Failed to create user. Please try again.';
			console.error('Error creating user:', err);
		} finally {
			isSubmitting = false;
		}
	}

	async function handleSetUserRole(userId: string, role: string) {
		isSubmitting = true;
		error = '';
		success = '';

		try {
			const result = await authClient.admin.setRole({
				userId,
				role
			});

			if (result.error) {
				error = result.error.message || 'Failed to update user role';
			} else {
				success = 'User role updated successfully';
				await loadUsers();
			}
		} catch (err) {
			error = 'Failed to update user role. Please try again.';
			console.error('Error updating user role:', err);
		} finally {
			isSubmitting = false;
		}
	}

	async function handleBanUser(userId: string, reason = 'Admin action') {
		isSubmitting = true;
		error = '';
		success = '';

		try {
			await authClient.admin.banUser({
				userId,
				banReason: reason
			});
			success = 'User banned successfully';
			await loadUsers();
		} catch (err) {
			error = 'Failed to ban user. Please try again.';
			console.error('Error banning user:', err);
		} finally {
			isSubmitting = false;
		}
	}

	async function handleUnbanUser(userId: string) {
		isSubmitting = true;
		error = '';
		success = '';

		try {
			await authClient.admin.unbanUser({
				userId
			});
			success = 'User unbanned successfully';
			await loadUsers();
		} catch (err) {
			error = 'Failed to unban user. Please try again.';
			console.error('Error unbanning user:', err);
		} finally {
			isSubmitting = false;
		}
	}

	async function handleDeleteUser() {
		if (!selectedUser) return;

		isSubmitting = true;
		error = '';
		success = '';

		try {
			// Note: This would need to be implemented in the auth client
			// For now, we'll show a placeholder
			success = 'User deletion functionality would be implemented here';
			showDeleteDialog = false;
			await loadUsers();
		} catch (err) {
			error = 'Failed to delete user. Please try again.';
			console.error('Error deleting user:', err);
		} finally {
			isSubmitting = false;
		}
	}

	function openCreateDialog() {
		formData = { name: '', email: '', password: '', role: 'user' };
		errors = { name: '', email: '', password: '' };
		showCreateDialog = true;
	}

	function openUserDetails(user: any) {
		selectedUser = user;
		showUserDetailsDialog = true;
	}

	function openDeleteDialog(user: any) {
		selectedUser = user;
		showDeleteDialog = true;
	}

	function resetForm() {
		formData = { name: '', email: '', password: '', role: 'user' };
		errors = { name: '', email: '', password: '' };
	}

	function resetFilters() {
		searchTerm = '';
		roleFilter = '';
		statusFilter = '';
	}

	function goToPage(page: number) {
		if (page >= 1 && page <= totalPages) {
			currentPage = page;
		}
	}

	function getUserInitials(name: string): string {
		return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
	}

	function formatDate(date: string): string {
		return new Date(date).toLocaleDateString();
	}

	function getStatusBadge(user: any) {
		if (user.banned) {
			return { variant: 'destructive' as const, text: 'Banned' };
		}
		return { variant: 'default' as const, text: 'Active' };
	}

	function getRoleBadge(role: string) {
		if (role === 'admin') {
			return { variant: 'default' as const, text: 'Admin' };
		}
		return { variant: 'secondary' as const, text: 'User' };
	}


	const roleFilterOptions = [
		{ value: 'admin', label: 'Admin' },
		{ value: 'user', label: 'User' }
	];

	const selectedRoleFilterLabel = $derived(
		roleFilterOptions.find(option => option.value === roleFilter)?.label ?? 'Role'
	);

	const statusFilterOptions = [
		{ value: 'all', label: 'All Status' },
		{ value: 'active', label: 'Active' },
		{ value: 'banned', label: 'Banned' }
	];

	const selectedStatusFilterLabel = $derived(
		statusFilterOptions.find(option => option.value === statusFilter)?.label ?? 'Status'
	);

	const formDataRoleOptions = [
		{ value: 'user', label: 'User' },
		{ value: 'admin', label: 'Admin' }
	];

	const selectedFormDataRoleLabel = $derived(
		formDataRoleOptions.find(option => option.value === formData.role)?.label ?? 'Select role'
	);

	const selectedUserRoleOptions = [
		{ value: 'user', label: 'User' },
		{ value: 'admin', label: 'Admin' }
	];

	const selectedSelectedUserRoleLabel = $derived(
		selectedUserRoleOptions.find(option => option.value === selectedUser.role)?.label ?? 'Select option'
	);
</script>

<svelte:head>
	<title>User Management - Admin</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header with Actions -->
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
		<div class="space-y-2">
			<h1 class="text-2xl font-bold">User Management</h1>
			<p class="text-muted-foreground">Manage user accounts, roles, and permissions</p>
		</div>
		<Button onclick={openCreateDialog} class="transition-colors duration-200">
			<UserPlus class="mr-2 h-4 w-4" />
			Create User
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
							placeholder="Search users..." 
							class="pl-8 transition-colors duration-200" 
							bind:value={searchTerm} 
						/>
					</div>
				</div>
				<div class="flex flex-col sm:flex-row gap-2">
					<Select.Root type="single" bind:value={roleFilter}>
				<Select.Trigger class="w-32">
					{selectedRoleFilterLabel}
				</Select.Trigger>
				<Select.Content>
					{#each roleFilterOptions as option}
						<Select.Item value={option.value}>{option.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
					<Select.Root type="single" bind:value={statusFilter}>
				<Select.Trigger class="w-32">
					{selectedStatusFilterLabel}
				</Select.Trigger>
				<Select.Content>
					{#each statusFilterOptions as option}
						<Select.Item value={option.value}>{option.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
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
			{:else if paginatedUsers.length === 0}
				<div class="text-center py-12 space-y-4">
					<Users class="h-12 w-12 mx-auto text-muted-foreground" />
					<div class="space-y-2">
						<h3 class="text-lg font-semibold">No users found</h3>
						<p class="text-muted-foreground">
							{searchTerm || roleFilter || statusFilter ? 'No users match your search criteria.' : 'Get started by creating your first user.'}
						</p>
					</div>
					{#if !searchTerm && !roleFilter && !statusFilter}
						<Button onclick={openCreateDialog} class="transition-colors duration-200">
							<UserPlus class="mr-2 h-4 w-4" />
							Create User
						</Button>
					{/if}
				</div>
			{:else}
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>User</TableHead>
							<TableHead>Role</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Created</TableHead>
							<TableHead class="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each paginatedUsers as user}
							<TableRow class="transition-colors duration-200 hover:bg-muted/50">
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
									<Badge variant={getRoleBadge(user.role).variant}>
										{getRoleBadge(user.role).text}
									</Badge>
								</TableCell>
								<TableCell>
									<Badge variant={getStatusBadge(user).variant}>
										{getStatusBadge(user).text}
									</Badge>
								</TableCell>
								<TableCell class="text-sm text-muted-foreground">
									{formatDate(user.createdAt)}
								</TableCell>
								<TableCell class="text-right">
									<div class="flex items-center justify-end gap-2">
										<Button 
											variant="ghost" 
											size="icon" 
											onclick={() => openUserDetails(user)}
											aria-label="View user details"
											class="transition-colors duration-200"
										>
											<Eye class="h-4 w-4" />
										</Button>
										{#if user.banned}
											<Button 
												variant="outline" 
												size="sm" 
												onclick={() => handleUnbanUser(user.id)}
												disabled={isSubmitting}
												class="transition-colors duration-200"
											>
												<Unlock class="mr-1 h-3 w-3" />
												Unban
											</Button>
										{:else}
											<Button 
												variant="outline" 
												size="sm" 
												onclick={() => handleBanUser(user.id)}
												disabled={isSubmitting}
												class="transition-colors duration-200"
											>
												<Ban class="mr-1 h-3 w-3" />
												Ban
											</Button>
										{/if}
										<Button 
											variant="ghost" 
											size="icon" 
											onclick={() => openDeleteDialog(user)}
											aria-label="Delete user"
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
			{/if}
		</CardContent>
	</Card>

	<!-- Pagination -->
	{#if totalPages > 1}
		<div class="flex items-center justify-center gap-2">
			<Button 
				variant="outline" 
				onclick={() => goToPage(1)}
				disabled={currentPage === 1}
				class="transition-colors duration-200"
			>
				First
			</Button>
			<Button 
				variant="outline" 
				onclick={() => goToPage(currentPage - 1)}
				disabled={currentPage === 1}
				class="transition-colors duration-200"
			>
				Previous
			</Button>
			
			{#each Array.from({length: Math.min(5, totalPages)}, (_, i) => {
				const start = Math.max(1, currentPage - 2);
				const end = Math.min(totalPages, start + 4);
				return start + i;
			}).filter(page => page <= totalPages) as page}
				<Button 
					variant={page === currentPage ? 'default' : 'outline'}
					onclick={() => goToPage(page)}
					class="transition-colors duration-200"
				>
					{page}
				</Button>
			{/each}
			
			<Button 
				variant="outline" 
				onclick={() => goToPage(currentPage + 1)}
				disabled={currentPage === totalPages}
				class="transition-colors duration-200"
			>
				Next
			</Button>
			<Button 
				variant="outline" 
				onclick={() => goToPage(totalPages)}
				disabled={currentPage === totalPages}
				class="transition-colors duration-200"
			>
				Last
			</Button>
		</div>
	{/if}
</div>

<!-- Create User Dialog -->
<Dialog bind:open={showCreateDialog}>
	<DialogContent class="max-w-md">
		<DialogHeader>
			<DialogTitle>Create New User</DialogTitle>
			<DialogDescription>
				Add a new user to the system with appropriate role and permissions.
			</DialogDescription>
		</DialogHeader>
		
		<div class="space-y-4">
			<div class="space-y-2">
				<Label for="create-name" class="text-sm font-medium">Full Name *</Label>
				<Input 
					id="create-name" 
					placeholder="Enter full name" 
					bind:value={formData.name}
					class="transition-colors duration-200"
					aria-describedby="create-name-error"
				/>
				{#if errors.name}
					<p id="create-name-error" class="text-sm text-destructive">{errors.name}</p>
				{/if}
			</div>
			
			<div class="space-y-2">
				<Label for="create-email" class="text-sm font-medium">Email Address *</Label>
				<Input 
					id="create-email" 
					type="email"
					placeholder="Enter email address" 
					bind:value={formData.email}
					class="transition-colors duration-200"
					aria-describedby="create-email-error"
				/>
				{#if errors.email}
					<p id="create-email-error" class="text-sm text-destructive">{errors.email}</p>
				{/if}
			</div>
			
			<div class="space-y-2">
				<Label for="create-password" class="text-sm font-medium">Password *</Label>
				<Input 
					id="create-password" 
					type="password"
					placeholder="Enter password" 
					bind:value={formData.password}
					class="transition-colors duration-200"
					aria-describedby="create-password-error"
				/>
				{#if errors.password}
					<p id="create-password-error" class="text-sm text-destructive">{errors.password}</p>
				{/if}
			</div>
			
			<div class="space-y-2">
				<Label for="create-role" class="text-sm font-medium">Role</Label>
				<Select.Root type="single" bind:value={formData.role}>
				<Select.Trigger class="w-32">
					{selectedFormDataRoleLabel}
				</Select.Trigger>
				<Select.Content>
					{#each formDataRoleOptions as option}
						<Select.Item value={option.value}>{option.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
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
				onclick={handleCreateUser}
				disabled={isSubmitting}
				class="transition-colors duration-200"
			>
				{#if isSubmitting}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					Creating...
				{:else}
					Create User
				{/if}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>

<!-- User Details Dialog -->
<Dialog bind:open={showUserDetailsDialog}>
	<DialogContent class="max-w-2xl">
		<DialogHeader>
			<DialogTitle>User Details</DialogTitle>
			<DialogDescription>
				Detailed information about {selectedUser?.name || 'the user'}.
			</DialogDescription>
		</DialogHeader>
		
		{#if selectedUser}
			<div class="space-y-6">
				<!-- User Information -->
				<Card>
					<CardHeader>
						<CardTitle class="text-base">User Information</CardTitle>
					</CardHeader>
					<CardContent class="space-y-4">
						<div class="flex items-center gap-4">
							<Avatar class="h-16 w-16">
								<AvatarImage src={selectedUser.image} alt={selectedUser.name} />
								<AvatarFallback class="text-lg">{getUserInitials(selectedUser.name)}</AvatarFallback>
							</Avatar>
							<div class="space-y-1">
								<h3 class="text-lg font-semibold">{selectedUser.name}</h3>
								<p class="text-muted-foreground">{selectedUser.email}</p>
								<div class="flex gap-2">
									<Badge variant={getRoleBadge(selectedUser.role).variant}>
										{getRoleBadge(selectedUser.role).text}
									</Badge>
									<Badge variant={getStatusBadge(selectedUser).variant}>
										{getStatusBadge(selectedUser).text}
									</Badge>
								</div>
							</div>
						</div>
						
						<div class="grid grid-cols-2 gap-4 pt-4 border-t">
							<div>
								<Label class="text-sm font-medium text-muted-foreground">Created</Label>
								<p class="text-sm">{formatDate(selectedUser.createdAt)}</p>
							</div>
							<div>
								<Label class="text-sm font-medium text-muted-foreground">Last Updated</Label>
								<p class="text-sm">{formatDate(selectedUser.updatedAt)}</p>
							</div>
							<div>
								<Label class="text-sm font-medium text-muted-foreground">Email Verified</Label>
								<p class="text-sm">{selectedUser.emailVerified ? 'Yes' : 'No'}</p>
							</div>
							<div>
								<Label class="text-sm font-medium text-muted-foreground">User ID</Label>
								<p class="text-sm font-mono text-xs">{selectedUser.id}</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<!-- Quick Actions -->
				<div class="flex gap-2">
					<Select.Root type="single" bind:value={selectedUser.role}>
						<Select.Trigger class="w-32">
							{selectedSelectedUserRoleLabel}
						</Select.Trigger>
						<Select.Content>
							{#each selectedUserRoleOptions as option}
								<Select.Item value={option.value}>{option.label}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					
					{#if selectedUser.banned}
						<Button 
							variant="outline" 
							onclick={() => handleUnbanUser(selectedUser.id)}
							disabled={isSubmitting}
							class="transition-colors duration-200"
						>
							<Unlock class="mr-2 h-4 w-4" />
							Unban User
						</Button>
					{:else}
						<Button 
							variant="outline" 
							onclick={() => handleBanUser(selectedUser.id)}
							disabled={isSubmitting}
							class="transition-colors duration-200"
						>
							<Ban class="mr-2 h-4 w-4" />
							Ban User
						</Button>
					{/if}
				</div>
			</div>
		{/if}

		<DialogFooter>
			<Button 
				variant="outline" 
				onclick={() => showUserDetailsDialog = false}
				class="transition-colors duration-200"
			>
				Close
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>

<!-- Delete User Dialog -->
<Dialog bind:open={showDeleteDialog}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Delete User</DialogTitle>
			<DialogDescription>
				Are you sure you want to delete "{selectedUser?.name}"? This action cannot be undone and will permanently remove the user and all associated data.
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
				onclick={handleDeleteUser}
				disabled={isSubmitting}
				class="transition-colors duration-200"
			>
				{#if isSubmitting}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					Deleting...
				{:else}
					Delete User
				{/if}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
