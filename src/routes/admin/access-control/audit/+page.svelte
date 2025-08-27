<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
	import * as Select from '$lib/components/ui/select';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
	import { 
		Search, 
		Filter, 
		Download, 
		Loader2, 
		Shield,
		AlertCircle,
		CheckCircle2,
		Calendar,
		Clock,
		User,
		Activity,
		FileText,
		RefreshCw
	} from '@lucide/svelte';
	import type { AuditLog } from '$lib/db/models';

	// State management
	let auditLogs: any[] = $state([]);
	let filteredLogs: any[] = $state([]);
	let users: any[] = $state([]);
	let isLoading = $state(true);
	let isExporting = $state(false);
	let searchTerm = $state('');
	let actionFilter = $state('');
	let resourceFilter = $state('');
	let userFilter = $state('');
	let successFilter = $state('');
	let dateFromFilter = $state('');
	let dateToFilter = $state('');
	let error = $state('');
	let success = $state('');

	// Pagination
	let currentPage = $state(1);
	let itemsPerPage = $state(50);
	let totalItems = $state(0);

	// Available filter options
	const availableActions = [
		'role_assigned', 'role_removed', 'role_created', 'role_updated', 'role_deleted',
		'permission_created', 'permission_updated', 'permission_deleted',
		'user_created', 'user_updated', 'user_deleted', 'login_attempt', 'access_denied'
	];

	const availableResources = ['user', 'role', 'permission', 'system', 'auth'];

	// Load data on mount
	onMount(async () => {
		await Promise.all([
			loadAuditLogs(),
			loadUsers()
		]);
		isLoading = false;
	});

	// Reactive filtering
	$effect(() => {
		let filtered = auditLogs;

		// Search filter
		if (searchTerm.trim() !== '') {
			const term = searchTerm.toLowerCase();
			filtered = filtered.filter(log => 
				log.action.toLowerCase().includes(term) ||
				log.resource.toLowerCase().includes(term) ||
				log.userName?.toLowerCase().includes(term) ||
				log.ipAddress.toLowerCase().includes(term) ||
				JSON.stringify(log.details).toLowerCase().includes(term)
			);
		}

		// Action filter
		if (actionFilter !== '') {
			filtered = filtered.filter(log => log.action === actionFilter);
		}

		// Resource filter
		if (resourceFilter !== '') {
			filtered = filtered.filter(log => log.resource === resourceFilter);
		}

		// User filter
		if (userFilter !== '') {
			filtered = filtered.filter(log => log.userId === userFilter);
		}

		// Success filter
		if (successFilter !== '') {
			const isSuccess = successFilter === 'true';
			filtered = filtered.filter(log => log.success === isSuccess);
		}

		// Date filters
		if (dateFromFilter) {
			const fromDate = new Date(dateFromFilter);
			filtered = filtered.filter(log => new Date(log.timestamp) >= fromDate);
		}

		if (dateToFilter) {
			const toDate = new Date(dateToFilter);
			toDate.setHours(23, 59, 59, 999); // End of day
			filtered = filtered.filter(log => new Date(log.timestamp) <= toDate);
		}

		filteredLogs = filtered;
		totalItems = filtered.length;
		currentPage = 1; // Reset to first page when filters change
	});

	// Paginated logs
	let paginatedLogs = $derived(() => {
		if (!filteredLogs || !Array.isArray(filteredLogs)) {
			return [];
		}
		return filteredLogs.slice(
			(currentPage - 1) * itemsPerPage,
			currentPage * itemsPerPage
		);
	});

	let totalPages = $derived(Math.ceil(totalItems / itemsPerPage));

	async function loadAuditLogs() {
		try {
			const response = await fetch('/api/admin/audit-logs');
			if (response.ok) {
				auditLogs = await response.json();
			} else {
				throw new Error('Failed to load audit logs');
			}
		} catch (err) {
			error = 'Failed to load audit logs. Please try again.';
			console.error('Error loading audit logs:', err);
		}
	}

	async function loadUsers() {
		try {
			const response = await fetch('/api/admin/users');
			if (response.ok) {
				users = await response.json();
			} else {
				throw new Error('Failed to load users');
			}
		} catch (err) {
			console.error('Error loading users:', err);
		}
	}

	async function handleExport() {
		isExporting = true;
		error = '';
		success = '';

		try {
			const params = new URLSearchParams();
			if (actionFilter) params.append('action', actionFilter);
			if (resourceFilter) params.append('resource', resourceFilter);
			if (userFilter) params.append('userId', userFilter);
			if (successFilter) params.append('success', successFilter);
			if (dateFromFilter) params.append('dateFrom', dateFromFilter);
			if (dateToFilter) params.append('dateTo', dateToFilter);

			const response = await fetch(`/api/admin/audit-logs/export?${params.toString()}`);
			
			if (response.ok) {
				const blob = await response.blob();
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
				document.body.appendChild(a);
				a.click();
				window.URL.revokeObjectURL(url);
				document.body.removeChild(a);
				success = 'Audit logs exported successfully';
			} else {
				throw new Error('Failed to export audit logs');
			}
		} catch (err) {
			error = 'Failed to export audit logs. Please try again.';
			console.error('Error exporting audit logs:', err);
		} finally {
			isExporting = false;
		}
	}

	async function handleRefresh() {
		isLoading = true;
		await loadAuditLogs();
		isLoading = false;
		success = 'Audit logs refreshed successfully';
	}

	function resetFilters() {
		searchTerm = '';
		actionFilter = '';
		resourceFilter = '';
		userFilter = '';
		successFilter = '';
		dateFromFilter = '';
		dateToFilter = '';
	}

	function getUserName(userId: string): string {
		const user = users.find(u => u.id === userId);
		return user ? user.name : 'Unknown User';
	}

	function getUserInitials(name: string): string {
		return name.split(' ').map(n => n[0]).join('').toUpperCase();
	}

	function formatDate(date: string): string {
		return new Date(date).toLocaleString();
	}

	function formatAction(action: string): string {
		return action.split('_').map(word => 
			word.charAt(0).toUpperCase() + word.slice(1)
		).join(' ');
	}

	function getActionIcon(action: string) {
		if (action.includes('role') || action.includes('permission')) return Shield;
		if (action.includes('user')) return User;
		if (action.includes('login') || action.includes('auth')) return Activity;
		return FileText;
	}

	function getActionVariant(action: string, success: boolean) {
		if (!success) return 'destructive';
		if (action.includes('delete') || action.includes('removed')) return 'secondary';
		if (action.includes('create') || action.includes('assigned')) return 'default';
		return 'outline';
	}

	function goToPage(page: number) {
		if (page >= 1 && page <= totalPages) {
			currentPage = page;
		}
	}


	const successFilterOptions = [
		{ value: 'true', label: 'Success' },
		{ value: 'false', label: 'Failed' }
	];

	const selectedSuccessFilterLabel = $derived(
		successFilterOptions.find(option => option.value === successFilter)?.label ?? 'Status'
	);
</script>

<svelte:head>
	<title>Access Audit - Admin</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header with Actions -->
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
		<div class="space-y-2">
			<h1 class="text-2xl font-bold">Access Audit</h1>
			<p class="text-muted-foreground">Monitor and audit system access and role changes</p>
		</div>
		<div class="flex gap-2">
			<Button 
				onclick={handleRefresh} 
				variant="outline"
				disabled={isLoading}
				class="transition-colors duration-200"
			>
				<RefreshCw class="mr-2 h-4 w-4" />
				Refresh
			</Button>
			<Button 
				onclick={handleExport} 
				variant="outline"
				disabled={isExporting}
				class="transition-colors duration-200"
			>
				{#if isExporting}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					Exporting...
				{:else}
					<Download class="mr-2 h-4 w-4" />
					Export
				{/if}
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

	<!-- Filters -->
	<Card>
		<CardHeader>
			<CardTitle class="text-base">Filters</CardTitle>
			<CardDescription>Filter audit logs by various criteria</CardDescription>
		</CardHeader>
		<CardContent class="space-y-4">
			<!-- Search and Quick Filters -->
			<div class="flex flex-col lg:flex-row gap-4">
				<div class="flex-1">
					<div class="relative">
						<Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
						<Input 
							type="search" 
							placeholder="Search logs..." 
							class="pl-8 transition-colors duration-200" 
							bind:value={searchTerm} 
						/>
					</div>
				</div>
				<div class="flex flex-col sm:flex-row gap-2">
					<Select.Root bind:value={actionFilter}>
						<Select.Trigger class="w-full sm:w-[140px]">
							<Select.Value placeholder="Action" />
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="">All Actions</Select.Item>
							{#each availableActions as action}
								<Select.Item value={action}>{formatAction(action)}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					<Select.Root bind:value={resourceFilter}>
						<Select.Trigger class="w-full sm:w-[120px]">
							<Select.Value placeholder="Resource" />
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="">All Resources</Select.Item>
							{#each availableResources as resource}
								<Select.Item value={resource}>{resource.charAt(0).toUpperCase() + resource.slice(1)}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					<Select.Root type="single" bind:value={successFilter}>
				<Select.Trigger class="w-32">
					{selectedSuccessFilterLabel}
				</Select.Trigger>
				<Select.Content>
					{#each successFilterOptions as option}
						<Select.Item value={option.value}>{option.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
				</div>
			</div>

			<!-- Advanced Filters -->
			<div class="flex flex-col lg:flex-row gap-4">
				<div class="flex-1">
					<Select.Root bind:value={userFilter}>
						<Select.Trigger>
							<Select.Value placeholder="Filter by user" />
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="">All Users</Select.Item>
							{#each users as user}
								<Select.Item value={user.id}>{user.name} ({user.email})</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
				<div class="flex flex-col sm:flex-row gap-2">
					<div class="space-y-1">
						<label for="date-from" class="text-xs text-muted-foreground">From Date</label>
						<Input 
							id="date-from"
							type="date" 
							bind:value={dateFromFilter}
							class="w-full sm:w-[140px] transition-colors duration-200"
						/>
					</div>
					<div class="space-y-1">
						<label for="date-to" class="text-xs text-muted-foreground">To Date</label>
						<Input 
							id="date-to"
							type="date" 
							bind:value={dateToFilter}
							class="w-full sm:w-[140px] transition-colors duration-200"
						/>
					</div>
					<div class="flex items-end">
						<Button variant="outline" onclick={resetFilters} class="transition-colors duration-200">
							Reset
						</Button>
					</div>
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- Audit Logs Table -->
	<Card>
		<CardHeader>
			<div class="flex items-center justify-between">
				<div>
					<CardTitle class="text-base">Audit Logs</CardTitle>
					<CardDescription>
						Showing {paginatedLogs.length} of {totalItems} logs
					</CardDescription>
				</div>
				{#if totalPages > 1}
					<div class="flex items-center gap-2">
						<Button 
							variant="outline" 
							size="sm"
							onclick={() => goToPage(currentPage - 1)}
							disabled={currentPage === 1}
							class="transition-colors duration-200"
						>
							Previous
						</Button>
						<span class="text-sm text-muted-foreground">
							Page {currentPage} of {totalPages}
						</span>
						<Button 
							variant="outline" 
							size="sm"
							onclick={() => goToPage(currentPage + 1)}
							disabled={currentPage === totalPages}
							class="transition-colors duration-200"
						>
							Next
						</Button>
					</div>
				{/if}
			</div>
		</CardHeader>
		<CardContent class="p-0">
			{#if isLoading}
				<div class="flex justify-center py-12">
					<Loader2 class="h-8 w-8 animate-spin text-primary" />
				</div>
			{:else if paginatedLogs.length === 0}
				<div class="text-center py-12 space-y-4">
					<Activity class="h-12 w-12 mx-auto text-muted-foreground" />
					<div class="space-y-2">
						<h3 class="text-lg font-semibold">No audit logs found</h3>
						<p class="text-muted-foreground">
							{searchTerm || actionFilter || resourceFilter || userFilter || successFilter || dateFromFilter || dateToFilter 
								? 'No logs match your search criteria.' 
								: 'No audit logs available.'}
						</p>
					</div>
				</div>
			{:else}
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Timestamp</TableHead>
							<TableHead>User</TableHead>
							<TableHead>Action</TableHead>
							<TableHead>Resource</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>IP Address</TableHead>
							<TableHead>Details</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each paginatedLogs as log}
							{@const ActionIcon = getActionIcon(log.action)}
							<TableRow class="transition-colors duration-200 hover:bg-muted/50">
								<TableCell>
									<div class="flex items-center gap-2">
										<Clock class="h-4 w-4 text-muted-foreground" />
										<div class="space-y-1">
											<p class="text-sm font-medium">{formatDate(log.timestamp)}</p>
										</div>
									</div>
								</TableCell>
								<TableCell>
									<div class="flex items-center gap-2">
										<Avatar class="h-6 w-6">
											<AvatarFallback class="text-xs">
												{getUserInitials(getUserName(log.userId))}
											</AvatarFallback>
										</Avatar>
										<span class="text-sm">{getUserName(log.userId)}</span>
									</div>
								</TableCell>
								<TableCell>
									<div class="flex items-center gap-2">
										<ActionIcon class="h-4 w-4 text-muted-foreground" />
										<Badge variant={getActionVariant(log.action, log.success)}>
											{formatAction(log.action)}
										</Badge>
									</div>
								</TableCell>
								<TableCell>
									<Badge variant="outline" class="capitalize">
										{log.resource}
									</Badge>
								</TableCell>
								<TableCell>
									<Badge variant={log.success ? 'default' : 'destructive'}>
										{log.success ? 'Success' : 'Failed'}
									</Badge>
								</TableCell>
								<TableCell class="text-sm text-muted-foreground">
									{log.ipAddress}
								</TableCell>
								<TableCell>
									<div class="max-w-xs">
										<p class="text-xs text-muted-foreground truncate" title={JSON.stringify(log.details, null, 2)}>
											{Object.keys(log.details).length > 0 
												? Object.entries(log.details).map(([key, value]) => `${key}: ${value}`).join(', ')
												: 'No additional details'
											}
										</p>
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