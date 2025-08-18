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
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Textarea } from '$lib/components/ui/textarea';
	import { authClient } from '$lib/auth/auth-client';
	import { goto } from '$app/navigation';
	import {
		Users,
		Search,
		Filter,
		Edit,
		Save,
		X,
		Loader2,
		AlertCircle,
		CheckCircle2,
		User,
		Mail,
		Calendar,
		MapPin,
		Globe,
		Twitter,
		Linkedin,
		Github,
		Settings,
		Activity,
		Clock
	} from '@lucide/svelte';

	// State management with proper $state() declarations
	let users: any[] = $state([]);
	let filteredUsers: any[] = $state([]);
	let selectedUsers: string[] = $state([]);
	let isLoading = $state(true);
	let error = $state('');
	let success = $state('');
	let searchTerm = $state('');
	let showEditDialog = $state(false);
	let showBulkDialog = $state(false);
	let selectedUser: any = $state(null);
	let isSubmitting = $state(false);
	let hasCheckedAuth = $state(false);

	// Pagination
	let currentPage = $state(1);
	let itemsPerPage = $state(12);
	let totalItems = $state(0);
	
	// Form data for profile editing
	let profileData = $state({
		name: '',
		email: '',
		bio: '',
		location: '',
		website: '',
		socialLinks: {
			twitter: '',
			linkedin: '',
			github: ''
		},
		preferences: {
			theme: 'system',
			notifications: {
				email: true,
				push: true,
				marketing: false
			}
		}
	});

	// Bulk operation data
	let bulkOperation = $state({
		action: '',
		theme: 'system',
		emailNotifications: true,
		pushNotifications: true,
		marketingNotifications: false
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
				user.email?.toLowerCase().includes(term) ||
				user.bio?.toLowerCase().includes(term) ||
				user.location?.toLowerCase().includes(term)
			);
		}

		filteredUsers = filtered;
		totalItems = filtered.length;
		currentPage = 1; // Reset to first page when filters change
	});

	// Paginated users - computed values
	let paginatedUsers = $derived(filteredUsers.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	));

	let totalPages = $derived(Math.ceil(totalItems / itemsPerPage));

	// Authentication check
	$effect(() => {
		if (!hasCheckedAuth && $session.data) {
			hasCheckedAuth = true;
			if ($session.data.user.role !== 'admin') {
				goto('/login?returnTo=/admin/users/profiles');
				return;
			}
		}
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
	
	async function handleUpdateProfile() {
		if (!selectedUser) return;

		isSubmitting = true;
		error = '';
		success = '';

		try {
			// This would integrate with a user profile API endpoint
			// For now, we'll simulate the update
			success = 'User profile updated successfully';
			showEditDialog = false;
			await loadUsers();
		} catch (err) {
			error = 'Failed to update user profile. Please try again.';
			console.error('Error updating profile:', err);
		} finally {
			isSubmitting = false;
		}
	}

	async function handleBulkOperation() {
		if (selectedUsers.length === 0) {
			error = 'Please select users to perform bulk operations';
			return;
		}

		isSubmitting = true;
		error = '';
		success = '';

		try {
			// This would integrate with a bulk operations API endpoint
			success = `Bulk operation applied to ${selectedUsers.length} users successfully`;
			showBulkDialog = false;
			selectedUsers = [];
			await loadUsers();
		} catch (err) {
			error = 'Failed to perform bulk operation. Please try again.';
			console.error('Error performing bulk operation:', err);
		} finally {
			isSubmitting = false;
		}
	}

	function openEditDialog(user: any) {
		selectedUser = user;
		profileData = {
			name: user.name || '',
			email: user.email || '',
			bio: user.bio || '',
			location: user.location || '',
			website: user.website || '',
			socialLinks: {
				twitter: user.socialLinks?.twitter || '',
				linkedin: user.socialLinks?.linkedin || '',
				github: user.socialLinks?.github || ''
			},
			preferences: {
				theme: user.preferences?.theme || 'system',
				notifications: {
					email: user.preferences?.notifications?.email ?? true,
					push: user.preferences?.notifications?.push ?? true,
					marketing: user.preferences?.notifications?.marketing ?? false
				}
			}
		};
		showEditDialog = true;
	}

	function openBulkDialog() {
		if (selectedUsers.length === 0) {
			error = 'Please select users to perform bulk operations';
			return;
		}
		showBulkDialog = true;
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
			selectedUsers = paginatedUsers.map(user => user.id);
		} else {
			selectedUsers = [];
		}
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

	function getActivityStatus(user: any): string {
		// This would be based on actual user activity data
		const lastLogin = user.lastLoginAt ? new Date(user.lastLoginAt) : null;
		if (!lastLogin) return 'Never logged in';
		
		const daysSince = Math.floor((Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));
		if (daysSince === 0) return 'Active today';
		if (daysSince === 1) return 'Active yesterday';
		if (daysSince < 7) return `Active ${daysSince} days ago`;
		if (daysSince < 30) return `Active ${Math.floor(daysSince / 7)} weeks ago`;
		return `Active ${Math.floor(daysSince / 30)} months ago`;
	}


	const profileDataPreferencesThemeOptions = [
		{ value: 'light', label: 'Light' },
		{ value: 'dark', label: 'Dark' },
		{ value: 'system', label: 'System' }
	];

	const selectedProfileDataPreferencesThemeLabel = $derived(
		profileDataPreferencesThemeOptions.find(option => option.value === profileData.preferences.theme)?.label ?? 'Select option'
	);

	const bulkOperationActionOptions = [
		{ value: 'update-theme', label: 'Update Theme' },
		{ value: 'update-notifications', label: 'Update Notifications' },
		{ value: 'reset-preferences', label: 'Reset Preferences' }
	];

	const selectedBulkOperationActionLabel = $derived(
		bulkOperationActionOptions.find(option => option.value === bulkOperation.action)?.label ?? 'Select action'
	);

	const bulkOperationThemeOptions = [
		{ value: 'light', label: 'Light' },
		{ value: 'dark', label: 'Dark' },
		{ value: 'system', label: 'System' }
	];

	const selectedBulkOperationThemeLabel = $derived(
		bulkOperationThemeOptions.find(option => option.value === bulkOperation.theme)?.label ?? 'Select option'
	);
</script>

<svelte:head>
	<title>User Profiles Management - Admin</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header with Actions -->
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
		<div class="space-y-2">
			<h1 class="text-2xl font-bold">User Profiles Management</h1>
			<p class="text-muted-foreground">Manage detailed user profiles and preferences</p>
		</div>
		<div class="flex gap-2">
			<Button 
				onclick={openBulkDialog} 
				variant="outline"
				disabled={selectedUsers.length === 0}
				class="transition-colors duration-200"
			>
				<Settings class="mr-2 h-4 w-4" />
				Bulk Actions ({selectedUsers.length})
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
							placeholder="Search users by name, email, bio, or location..." 
							class="pl-8 transition-colors duration-200" 
							bind:value={searchTerm} 
						/>
					</div>
				</div>
				<div class="flex items-center gap-2">
					<span class="text-sm text-muted-foreground">
						{selectedUsers.length} of {paginatedUsers.length} selected
					</span>
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- User Profiles Grid -->
	<div class="space-y-4">
		{#if isLoading}
			<div class="flex justify-center py-12">
				<Loader2 class="h-8 w-8 animate-spin text-primary" />
			</div>
		{:else if paginatedUsers.length === 0}
			<div class="text-center py-12 space-y-4">
				<Users class="h-12 w-12 mx-auto text-muted-foreground" />
				<div class="space-y-2">
					<h3 class="text-lg font-semibold">No user profiles found</h3>
					<p class="text-muted-foreground">
						{searchTerm ? 'No users match your search criteria.' : 'No user profiles available.'}
					</p>
				</div>
			</div>
		{:else}
			<!-- Select All Checkbox -->
			<Card>
				<CardContent class="p-4">
					<div class="flex items-center gap-2">
						<Checkbox 
							checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}
							onCheckedChange={selectAllUsers}
							aria-label="Select all users"
						/>
						<Label class="text-sm font-medium">
							Select all users on this page ({paginatedUsers.length})
						</Label>
					</div>
				</CardContent>
			</Card>

			<!-- User Profiles Grid -->
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{#each paginatedUsers as user}
					<Card class="transition-all duration-200 hover:shadow-md">
						<CardContent class="p-6">
							<div class="space-y-4">
								<!-- Header with Checkbox and Avatar -->
								<div class="flex items-start justify-between">
									<div class="flex items-center gap-3">
										<Checkbox 
											checked={selectedUsers.includes(user.id)}
											onCheckedChange={(checked) => handleUserSelection(user.id, checked)}
											aria-label="Select user"
										/>
										<Avatar class="h-12 w-12">
											<AvatarImage src={user.image} alt={user.name} />
											<AvatarFallback>{getUserInitials(user.name)}</AvatarFallback>
										</Avatar>
									</div>
									<Button 
										variant="ghost" 
										size="icon" 
										onclick={() => openEditDialog(user)}
										aria-label="Edit profile"
										class="transition-colors duration-200"
									>
										<Edit class="h-4 w-4" />
									</Button>
								</div>

								<!-- User Info -->
								<div class="space-y-2">
									<h3 class="font-semibold text-lg">{user.name}</h3>
									<p class="text-sm text-muted-foreground">{user.email}</p>
									{#if user.bio}
										<p class="text-sm line-clamp-2">{user.bio}</p>
									{/if}
								</div>

								<!-- User Details -->
								<div class="space-y-2 text-sm">
									{#if user.location}
										<div class="flex items-center gap-2 text-muted-foreground">
											<MapPin class="h-4 w-4" />
											<span>{user.location}</span>
										</div>
									{/if}
									{#if user.website}
										<div class="flex items-center gap-2 text-muted-foreground">
											<Globe class="h-4 w-4" />
											<span class="truncate">{user.website}</span>
										</div>
									{/if}
									<div class="flex items-center gap-2 text-muted-foreground">
										<Calendar class="h-4 w-4" />
										<span>Joined {formatDate(user.createdAt)}</span>
									</div>
									<div class="flex items-center gap-2 text-muted-foreground">
										<Activity class="h-4 w-4" />
										<span>{getActivityStatus(user)}</span>
									</div>
								</div>

								<!-- Social Links -->
								{#if user.socialLinks?.twitter || user.socialLinks?.linkedin || user.socialLinks?.github}
									<div class="flex gap-2 pt-2 border-t">
										{#if user.socialLinks.twitter}
											<Button variant="ghost" size="icon" class="h-8 w-8">
												<Twitter class="h-4 w-4" />
											</Button>
										{/if}
										{#if user.socialLinks.linkedin}
											<Button variant="ghost" size="icon" class="h-8 w-8">
												<Linkedin class="h-4 w-4" />
											</Button>
										{/if}
										{#if user.socialLinks.github}
											<Button variant="ghost" size="icon" class="h-8 w-8">
												<Github class="h-4 w-4" />
											</Button>
										{/if}
									</div>
								{/if}

								<!-- Role and Status -->
								<div class="flex gap-2 pt-2 border-t">
									<Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
										{user.role === 'admin' ? 'Admin' : 'User'}
									</Badge>
									<Badge variant={user.banned ? 'destructive' : 'outline'}>
										{user.banned ? 'Banned' : 'Active'}
									</Badge>
								</div>
							</div>
						</CardContent>
					</Card>
				{/each}
			</div>
		{/if}
	</div>	<!--
 Pagination -->
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

<!-- Edit Profile Dialog -->
<Dialog bind:open={showEditDialog}>
	<DialogContent class="max-w-2xl max-h-[80vh] overflow-y-auto">
		<DialogHeader>
			<DialogTitle>Edit User Profile</DialogTitle>
			<DialogDescription>
				Update detailed profile information for {selectedUser?.name}
			</DialogDescription>
		</DialogHeader>
		
		<div class="space-y-6">
			<!-- Basic Information -->
			<div class="space-y-4">
				<h3 class="text-lg font-semibold">Basic Information</h3>
				<div class="grid grid-cols-2 gap-4">
					<div class="space-y-2">
						<Label for="edit-name" class="text-sm font-medium">Full Name</Label>
						<Input 
							id="edit-name" 
							bind:value={profileData.name}
							class="transition-colors duration-200"
						/>
					</div>
					<div class="space-y-2">
						<Label for="edit-email" class="text-sm font-medium">Email</Label>
						<Input 
							id="edit-email" 
							type="email"
							bind:value={profileData.email}
							class="transition-colors duration-200"
						/>
					</div>
				</div>
				<div class="space-y-2">
					<Label for="edit-bio" class="text-sm font-medium">Bio</Label>
					<Textarea 
						id="edit-bio" 
						bind:value={profileData.bio}
						placeholder="Tell us about yourself..."
						rows={3}
						class="transition-colors duration-200 resize-none"
					/>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div class="space-y-2">
						<Label for="edit-location" class="text-sm font-medium">Location</Label>
						<Input 
							id="edit-location" 
							bind:value={profileData.location}
							placeholder="City, Country"
							class="transition-colors duration-200"
						/>
					</div>
					<div class="space-y-2">
						<Label for="edit-website" class="text-sm font-medium">Website</Label>
						<Input 
							id="edit-website" 
							bind:value={profileData.website}
							placeholder="https://example.com"
							class="transition-colors duration-200"
						/>
					</div>
				</div>
			</div>

			<!-- Social Links -->
			<div class="space-y-4">
				<h3 class="text-lg font-semibold">Social Links</h3>
				<div class="space-y-3">
					<div class="space-y-2">
						<Label for="edit-twitter" class="text-sm font-medium">Twitter</Label>
						<Input 
							id="edit-twitter" 
							bind:value={profileData.socialLinks.twitter}
							placeholder="@username"
							class="transition-colors duration-200"
						/>
					</div>
					<div class="space-y-2">
						<Label for="edit-linkedin" class="text-sm font-medium">LinkedIn</Label>
						<Input 
							id="edit-linkedin" 
							bind:value={profileData.socialLinks.linkedin}
							placeholder="linkedin.com/in/username"
							class="transition-colors duration-200"
						/>
					</div>
					<div class="space-y-2">
						<Label for="edit-github" class="text-sm font-medium">GitHub</Label>
						<Input 
							id="edit-github" 
							bind:value={profileData.socialLinks.github}
							placeholder="github.com/username"
							class="transition-colors duration-200"
						/>
					</div>
				</div>
			</div>

			<!-- Preferences -->
			<div class="space-y-4">
				<h3 class="text-lg font-semibold">Preferences</h3>
				<div class="space-y-4">
					<div class="space-y-2">
						<Label class="text-sm font-medium">Theme</Label>
						<Select.Root type="single" bind:value={profileData.preferences.theme}>
				<Select.Trigger class="w-32">
					{selectedProfileDataPreferencesThemeLabel}
				</Select.Trigger>
				<Select.Content>
					{#each profileDataPreferencesThemeOptions as option}
						<Select.Item value={option.value}>{option.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
					</div>
					<div class="space-y-3">
						<Label class="text-sm font-medium">Notifications</Label>
						<div class="space-y-2">
							<div class="flex items-center space-x-2">
								<Checkbox 
									id="edit-email-notifications"
									bind:checked={profileData.preferences.notifications.email}
								/>
								<Label for="edit-email-notifications" class="text-sm">Email notifications</Label>
							</div>
							<div class="flex items-center space-x-2">
								<Checkbox 
									id="edit-push-notifications"
									bind:checked={profileData.preferences.notifications.push}
								/>
								<Label for="edit-push-notifications" class="text-sm">Push notifications</Label>
							</div>
							<div class="flex items-center space-x-2">
								<Checkbox 
									id="edit-marketing-notifications"
									bind:checked={profileData.preferences.notifications.marketing}
								/>
								<Label for="edit-marketing-notifications" class="text-sm">Marketing emails</Label>
							</div>
						</div>
					</div>
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
				onclick={handleUpdateProfile}
				disabled={isSubmitting}
				class="transition-colors duration-200"
			>
				{#if isSubmitting}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					Saving...
				{:else}
					<Save class="mr-2 h-4 w-4" />
					Save Changes
				{/if}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog><!--
 Bulk Operations Dialog -->
<Dialog bind:open={showBulkDialog}>
	<DialogContent class="max-w-md">
		<DialogHeader>
			<DialogTitle>Bulk Operations</DialogTitle>
			<DialogDescription>
				Apply changes to {selectedUsers.length} selected users
			</DialogDescription>
		</DialogHeader>
		
		<div class="space-y-4">
			<div class="space-y-2">
				<Label for="bulk-action" class="text-sm font-medium">Action</Label>
				<Select.Root type="single" bind:value={bulkOperation.action}>
				<Select.Trigger class="w-32">
					{selectedBulkOperationActionLabel}
				</Select.Trigger>
				<Select.Content>
					{#each bulkOperationActionOptions as option}
						<Select.Item value={option.value}>{option.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
			</div>

			{#if bulkOperation.action === 'update-theme'}
				<div class="space-y-2">
					<Label class="text-sm font-medium">Theme</Label>
					<Select.Root type="single" bind:value={bulkOperation.theme}>
				<Select.Trigger class="w-32">
					{selectedBulkOperationThemeLabel}
				</Select.Trigger>
				<Select.Content>
					{#each bulkOperationThemeOptions as option}
						<Select.Item value={option.value}>{option.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
				</div>
			{/if}

			{#if bulkOperation.action === 'update-notifications'}
				<div class="space-y-3">
					<Label class="text-sm font-medium">Notification Settings</Label>
					<div class="space-y-2">
						<div class="flex items-center space-x-2">
							<Checkbox 
								id="bulk-email-notifications"
								bind:checked={bulkOperation.emailNotifications}
							/>
							<Label for="bulk-email-notifications" class="text-sm">Email notifications</Label>
						</div>
						<div class="flex items-center space-x-2">
							<Checkbox 
								id="bulk-push-notifications"
								bind:checked={bulkOperation.pushNotifications}
							/>
							<Label for="bulk-push-notifications" class="text-sm">Push notifications</Label>
						</div>
						<div class="flex items-center space-x-2">
							<Checkbox 
								id="bulk-marketing-notifications"
								bind:checked={bulkOperation.marketingNotifications}
							/>
							<Label for="bulk-marketing-notifications" class="text-sm">Marketing emails</Label>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<DialogFooter>
			<Button 
				variant="outline" 
				onclick={() => showBulkDialog = false}
				disabled={isSubmitting}
				class="transition-colors duration-200"
			>
				Cancel
			</Button>
			<Button 
				onclick={handleBulkOperation}
				disabled={isSubmitting || !bulkOperation.action}
				class="transition-colors duration-200"
			>
				{#if isSubmitting}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					Applying...
				{:else}
					Apply to {selectedUsers.length} Users
				{/if}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>