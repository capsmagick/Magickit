<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { authClient } from '$lib/auth/auth-client';
	import { goto } from '$app/navigation';
	import {
		Search,
		RefreshCw,
		Download,
		Filter,
		Calendar,
		Eye,
		Settings,
		Loader2,
		FileText,
		Activity,
		Shield,
		User,
		Database,
		AlertTriangle,
		CheckCircle,
		XCircle,
		Clock,
		Trash2,
		Archive
	} from '@lucide/svelte';

	let hasCheckedAuth = $state(false);
	let showFilterDialog = $state(false);
	let showDetailsDialog = $state(false);
	let showExportDialog = $state(false);
	let showSettingsDialog = $state(false);
	let isLoading = $state(false);
	let isExporting = $state(false);
	let searchTerm = $state('');
	let selectedAuditLog = $state<typeof auditLogs[0] | null>(null);

	const session = authClient.useSession();

	// Filter state
	let filters = $state({
		dateRange: 'last_7_days' as 'today' | 'last_7_days' | 'last_30_days' | 'last_90_days' | 'custom',
		startDate: '',
		endDate: '',
		action: 'all' as string,
		resource: 'all' as string,
		userId: '',
		success: 'all' as 'all' | 'success' | 'failed',
		ipAddress: ''
	});

	// Audit settings
	let auditSettings = $state({
		retentionDays: 90,
		logLevel: 'detailed' as 'basic' | 'detailed' | 'verbose',
		enableRealTimeAlerts: true,
		alertThreshold: 10,
		autoCleanup: true,
		compressOldLogs: true,
		enableExport: true,
		maxExportRecords: 10000
	});

	// Audit logs data
	let auditLogs = $state([]);

	// Statistics
	let auditStats = $state({
		totalLogs: 15420,
		todayLogs: 89,
		failedActions: 234,
		criticalEvents: 12,
		topActions: [
			{ action: 'login_success', count: 8945 },
			{ action: 'page_view', count: 3421 },
			{ action: 'login_failed', count: 234 },
			{ action: 'user_updated', count: 156 },
			{ action: 'data_export', count: 89 }
		],
		topUsers: [
			{ userName: 'john@example.com', actionCount: 1245 },
			{ userName: 'jane@example.com', actionCount: 892 },
			{ userName: 'admin@example.com', actionCount: 567 },
			{ userName: 'mike@example.com', actionCount: 234 }
		]
	});

	// Export options
	let exportOptions = $state({
		format: 'csv' as 'csv' | 'json' | 'xlsx',
		includeDetails: true,
		dateRange: 'filtered' as 'all' | 'filtered' | 'custom',
		customStartDate: '',
		customEndDate: ''
	});

	// Reactive statement to check session and redirect if needed
	$effect(() => {
		if (!hasCheckedAuth && $session.data) {
			hasCheckedAuth = true;
			if ($session.data.user.role !== 'admin') {
				goto('/login?returnTo=/admin/security/audit-trails');
				return;
			} else {
				// Load data once authenticated
				loadAuditLogs();
			}
		}
	});

	// Load audit logs from API
	async function loadAuditLogs() {
		isLoading = true;
		try {
			const response = await fetch('/api/admin/audit-logs?limit=100');
			if (response.ok) {
				const data = await response.json();
				auditLogs = data.map(log => ({
					...log,
					id: log._id,
					timestamp: new Date(log.timestamp),
					severity: 'info' // Default severity since it's not in the current API
				}));
				
				// Update statistics
				auditStats.totalLogs = auditLogs.length;
				auditStats.todayLogs = auditLogs.filter(log => {
					const today = new Date();
					const logDate = new Date(log.timestamp);
					return logDate.toDateString() === today.toDateString();
				}).length;
				auditStats.failedActions = auditLogs.filter(log => !log.success).length;
			}
		} catch (error) {
			console.error('Error loading audit logs:', error);
		} finally {
			isLoading = false;
		}
	}

	// Filtered audit logs
	let filteredLogs = $derived.by(() => {
		let logs = auditLogs;

		// Apply search filter
		if (searchTerm) {
			logs = logs.filter(log => 
				log.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
				log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
				log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
				log.ipAddress.includes(searchTerm) ||
				JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase())
			);
		}

		// Apply filters
		if (filters.action !== 'all') {
			logs = logs.filter(log => log.action === filters.action);
		}

		if (filters.resource !== 'all') {
			logs = logs.filter(log => log.resource === filters.resource);
		}

		if (filters.success !== 'all') {
			logs = logs.filter(log => 
				filters.success === 'success' ? log.success : !log.success
			);
		}

		if (filters.userId) {
			logs = logs.filter(log => 
				log.userId?.includes(filters.userId) ||
				log.userName?.toLowerCase().includes(filters.userId.toLowerCase())
			);
		}

		if (filters.ipAddress) {
			logs = logs.filter(log => log.ipAddress.includes(filters.ipAddress));
		}

		// Apply date range filter
		const now = new Date();
		let startDate: Date | null = null;

		switch (filters.dateRange) {
			case 'today':
				startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
				break;
			case 'last_7_days':
				startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
				break;
			case 'last_30_days':
				startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
				break;
			case 'last_90_days':
				startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
				break;
			case 'custom':
				if (filters.startDate) startDate = new Date(filters.startDate);
				break;
		}

		if (startDate) {
			logs = logs.filter(log => log.timestamp >= startDate);
		}

		if (filters.dateRange === 'custom' && filters.endDate) {
			const endDate = new Date(filters.endDate);
			logs = logs.filter(log => log.timestamp <= endDate);
		}

		return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
	});

	// Available actions and resources for filters
	let availableActions = $derived.by(() => {
		const actions = new Set(auditLogs.map(log => log.action));
		return Array.from(actions).sort();
	});

	let availableResources = $derived.by(() => {
		const resources = new Set(auditLogs.map(log => log.resource));
		return Array.from(resources).sort();
	});

	function getActionIcon(action: string) {
		if (action.includes('login')) return User;
		if (action.includes('role') || action.includes('permission')) return Shield;
		if (action.includes('data') || action.includes('export')) return Database;
		if (action.includes('system') || action.includes('settings')) return Settings;
		return Activity;
	}

	function getSeverityBadge(severity: 'info' | 'warning' | 'error' | 'critical') {
		switch (severity) {
			case 'info':
				return { variant: 'default' as const, text: 'Info' };
			case 'warning':
				return { variant: 'secondary' as const, text: 'Warning' };
			case 'error':
				return { variant: 'destructive' as const, text: 'Error' };
			case 'critical':
				return { variant: 'destructive' as const, text: 'Critical' };
		}
	}

	function getSuccessBadge(success: boolean) {
		return success 
			? { variant: 'default' as const, text: 'Success', icon: CheckCircle }
			: { variant: 'destructive' as const, text: 'Failed', icon: XCircle };
	}

	function openDetailsDialog(log: typeof auditLogs[0]) {
		selectedAuditLog = log;
		showDetailsDialog = true;
	}

	function clearFilters() {
		filters = {
			dateRange: 'last_7_days',
			startDate: '',
			endDate: '',
			action: 'all',
			resource: 'all',
			userId: '',
			success: 'all',
			ipAddress: ''
		};
		searchTerm = '';
	}

	async function exportAuditLogs() {
		isExporting = true;
		
		try {
			// Simulate export process
			await new Promise(resolve => setTimeout(resolve, 2000));
			
			// In a real implementation, this would generate and download the file
			const filename = `audit_logs_${new Date().toISOString().split('T')[0]}.${exportOptions.format}`;
			console.log('Exporting audit logs:', {
				filename,
				format: exportOptions.format,
				recordCount: filteredLogs.length,
				includeDetails: exportOptions.includeDetails
			});
			
			showExportDialog = false;
		} catch (error) {
			console.error('Export failed:', error);
		} finally {
			isExporting = false;
		}
	}

	async function saveAuditSettings() {
		isLoading = true;
		
		try {
			// Simulate API call
			await new Promise(resolve => setTimeout(resolve, 1000));
			
			console.log('Audit settings saved:', auditSettings);
			showSettingsDialog = false;
		} catch (error) {
			console.error('Failed to save settings:', error);
		} finally {
			isLoading = false;
		}
	}

	async function cleanupOldLogs() {
		if (!confirm('Are you sure you want to cleanup old audit logs? This action cannot be undone.')) {
			return;
		}

		isLoading = true;
		
		try {
			// Simulate cleanup process
			await new Promise(resolve => setTimeout(resolve, 1500));
			
			console.log('Old logs cleaned up');
		} catch (error) {
			console.error('Cleanup failed:', error);
		} finally {
			isLoading = false;
		}
	}

	function refreshData() {
		loadAuditLogs();
	}

	function formatActionName(action: string): string {
		return action.split('_').map(word => 
			word.charAt(0).toUpperCase() + word.slice(1)
		).join(' ');
	}

	function formatResourceName(resource: string): string {
		return resource.split('_').map(word => 
			word.charAt(0).toUpperCase() + word.slice(1)
		).join(' ');
	}


	const filtersDateRangeOptions = [
		{ value: 'today', label: 'Today' },
		{ value: 'last_7_days', label: 'Last 7 days' },
		{ value: 'last_30_days', label: 'Last 30 days' },
		{ value: 'last_90_days', label: 'Last 90 days' },
		{ value: 'custom', label: 'Custom range' }
	];

	const selectedFiltersDateRangeLabel = $derived(
		filtersDateRangeOptions.find(option => option.value === filters.dateRange)?.label ?? 'Select date range'
	);

	const filtersActionOptions = [
		{ value: 'all', label: 'All actions' }
	];

	const selectedFiltersActionLabel = $derived(
		filtersActionOptions.find(option => option.value === filters.action)?.label ?? 'All actions'
	);

	const filtersResourceOptions = [
		{ value: 'all', label: 'All resources' }
	];

	const selectedFiltersResourceLabel = $derived(
		filtersResourceOptions.find(option => option.value === filters.resource)?.label ?? 'All resources'
	);

	const filtersSuccessOptions = [
		{ value: 'all', label: 'All statuses' },
		{ value: 'success', label: 'Success only' },
		{ value: 'failed', label: 'Failed only' }
	];

	const selectedFiltersSuccessLabel = $derived(
		filtersSuccessOptions.find(option => option.value === filters.success)?.label ?? 'All statuses'
	);

	const exportOptionsFormatOptions = [
		{ value: 'csv', label: 'CSV' },
		{ value: 'json', label: 'JSON' },
		{ value: 'xlsx', label: 'Excel (XLSX)' }
	];

	const selectedExportOptionsFormatLabel = $derived(
		exportOptionsFormatOptions.find(option => option.value === exportOptions.format)?.label ?? 'Select option'
	);

	const exportOptionsDateRangeOptions = $derived([
		{ value: 'filtered', label: `Current filtered results (${filteredLogs.length} records)` },
		{ value: 'all', label: `All audit logs (${auditLogs.length} records)` },
		{ value: 'custom', label: 'Custom date range' }
	]);

	const selectedExportOptionsDateRangeLabel = $derived(
		exportOptionsDateRangeOptions.find(option => option.value === exportOptions.dateRange)?.label ?? 'Select option'
	);

	const auditSettingsLogLevelOptions = [
		{ value: 'basic', label: 'Basic - Essential events only' },
		{ value: 'detailed', label: 'Detailed - Most events with context' },
		{ value: 'verbose', label: 'Verbose - All events with full details' }
	];

	const selectedAuditSettingsLogLevelLabel = $derived(
		auditSettingsLogLevelOptions.find(option => option.value === auditSettings.logLevel)?.label ?? 'Select option'
	);
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
		<div class="space-y-2">
			<h1 class="text-2xl font-bold">Audit Trails</h1>
			<p class="text-muted-foreground">
				Track security events, user actions, and system changes with detailed audit logs
			</p>
		</div>
		<div class="flex gap-2">
			<Button variant="outline" onclick={refreshData} disabled={isLoading}>
				{#if isLoading}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
				{:else}
					<RefreshCw class="mr-2 h-4 w-4" />
				{/if}
				Refresh
			</Button>
			<Button variant="outline" onclick={() => (showExportDialog = true)}>
				<Download class="mr-2 h-4 w-4" />
				Export
			</Button>
			<Button variant="outline" onclick={() => (showSettingsDialog = true)}>
				<Settings class="mr-2 h-4 w-4" />
				Settings
			</Button>
		</div>
	</div>

	<!-- Statistics Cards -->
	<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
		<Card.Root>
			<Card.Content class="p-4">
				<div class="flex items-center gap-2">
					<FileText class="h-4 w-4 text-primary" />
					<div>
						<p class="text-sm text-muted-foreground">Total Logs</p>
						<p class="text-2xl font-bold">{auditStats.totalLogs.toLocaleString()}</p>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Content class="p-4">
				<div class="flex items-center gap-2">
					<Clock class="h-4 w-4 text-blue-500" />
					<div>
						<p class="text-sm text-muted-foreground">Today</p>
						<p class="text-2xl font-bold">{auditStats.todayLogs}</p>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Content class="p-4">
				<div class="flex items-center gap-2">
					<XCircle class="h-4 w-4 text-red-500" />
					<div>
						<p class="text-sm text-muted-foreground">Failed Actions</p>
						<p class="text-2xl font-bold">{auditStats.failedActions}</p>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Content class="p-4">
				<div class="flex items-center gap-2">
					<AlertTriangle class="h-4 w-4 text-yellow-500" />
					<div>
						<p class="text-sm text-muted-foreground">Critical Events</p>
						<p class="text-2xl font-bold">{auditStats.criticalEvents}</p>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Search and Filters -->
	<Card.Root>
		<Card.Content class="p-4">
			<div class="flex flex-col lg:flex-row gap-4">
				<div class="flex-1">
					<div class="relative">
						<Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
						<Input 
							type="search" 
							placeholder="Search logs by user, action, resource, IP, or details..." 
							class="pl-8" 
							bind:value={searchTerm} 
						/>
					</div>
				</div>
				<div class="flex gap-2">
					<Button variant="outline" onclick={() => (showFilterDialog = true)}>
						<Filter class="mr-2 h-4 w-4" />
						Filters
						{#if filters.action !== 'all' || filters.resource !== 'all' || filters.success !== 'all' || filters.userId || filters.ipAddress}
							<Badge variant="secondary" class="ml-2">Active</Badge>
						{/if}
					</Button>
					{#if searchTerm || filters.action !== 'all' || filters.resource !== 'all' || filters.success !== 'all' || filters.userId || filters.ipAddress}
						<Button variant="ghost" onclick={clearFilters}>
							Clear
						</Button>
					{/if}
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Audit Logs Table -->
	<Card.Root>
		<Card.Header>
			<div class="flex justify-between items-center">
				<div>
					<Card.Title>Audit Logs</Card.Title>
					<Card.Description>
						Showing {filteredLogs.length} of {auditLogs.length} audit log entries
					</Card.Description>
				</div>
			</div>
		</Card.Header>
		<Card.Content class="p-0">
			{#if isLoading}
				<div class="flex justify-center py-12">
					<Loader2 class="h-8 w-8 animate-spin text-primary" />
				</div>
			{:else if filteredLogs.length === 0}
				<div class="text-center py-12 space-y-4">
					<FileText class="h-12 w-12 mx-auto text-muted-foreground" />
					<div class="space-y-2">
						<h3 class="text-lg font-semibold">No audit logs found</h3>
						<p class="text-muted-foreground">
							{searchTerm || filters.action !== 'all' || filters.resource !== 'all' 
								? 'No logs match your search criteria or filters.' 
								: 'No audit logs available.'}
						</p>
					</div>
					{#if searchTerm || filters.action !== 'all' || filters.resource !== 'all'}
						<Button variant="outline" onclick={clearFilters}>
							Clear Filters
						</Button>
					{/if}
				</div>
			{:else}
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Timestamp</Table.Head>
							<Table.Head>User</Table.Head>
							<Table.Head>Action</Table.Head>
							<Table.Head>Resource</Table.Head>
							<Table.Head>Status</Table.Head>
							<Table.Head>Severity</Table.Head>
							<Table.Head>IP Address</Table.Head>
							<Table.Head class="text-right">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each filteredLogs as log}
							<Table.Row class="transition-colors duration-200 hover:bg-muted/50">
								<Table.Cell class="text-sm text-muted-foreground">
									{log.timestamp.toLocaleString()}
								</Table.Cell>
								<Table.Cell>
									<div class="flex items-center gap-2">
										<User class="h-4 w-4 text-muted-foreground" />
										<span class="font-medium">{log.userName || 'System'}</span>
									</div>
								</Table.Cell>
								<Table.Cell>
									<div class="flex items-center gap-2">
										{#if log.action.includes('login')}
											<User class="h-4 w-4 text-muted-foreground" />
										{:else if log.action.includes('role') || log.action.includes('permission')}
											<Shield class="h-4 w-4 text-muted-foreground" />
										{:else if log.action.includes('data') || log.action.includes('export')}
											<Database class="h-4 w-4 text-muted-foreground" />
										{:else if log.action.includes('system') || log.action.includes('settings')}
											<Settings class="h-4 w-4 text-muted-foreground" />
										{:else}
											<Activity class="h-4 w-4 text-muted-foreground" />
										{/if}
										<span>{formatActionName(log.action)}</span>
									</div>
								</Table.Cell>
								<Table.Cell>
									<span class="text-sm">{formatResourceName(log.resource)}</span>
								</Table.Cell>
								<Table.Cell>
									<Badge variant={getSuccessBadge(log.success).variant}>
										{#if log.success}
											<CheckCircle class="mr-1 h-3 w-3" />
										{:else}
											<XCircle class="mr-1 h-3 w-3" />
										{/if}
										{getSuccessBadge(log.success).text}
									</Badge>
								</Table.Cell>
								<Table.Cell>
									<Badge variant={getSeverityBadge(log.severity).variant}>
										{getSeverityBadge(log.severity).text}
									</Badge>
								</Table.Cell>
								<Table.Cell class="font-mono text-sm">{log.ipAddress}</Table.Cell>
								<Table.Cell class="text-right">
									<Button 
										variant="ghost" 
										size="icon" 
										onclick={() => openDetailsDialog(log)}
										aria-label="View details"
									>
										<Eye class="h-4 w-4" />
									</Button>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			{/if}
		</Card.Content>
	</Card.Root>

	<!-- Top Actions and Users -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Top Actions -->
		<Card.Root>
			<Card.Header>
				<Card.Title>Top Actions</Card.Title>
				<Card.Description>Most frequent actions in the audit logs</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-4">
				{#each auditStats.topActions as actionStat}
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							{#if actionStat.action.includes('login')}
								<User class="h-4 w-4 text-muted-foreground" />
							{:else if actionStat.action.includes('role') || actionStat.action.includes('permission')}
								<Shield class="h-4 w-4 text-muted-foreground" />
							{:else if actionStat.action.includes('data') || actionStat.action.includes('export')}
								<Database class="h-4 w-4 text-muted-foreground" />
							{:else if actionStat.action.includes('system') || actionStat.action.includes('settings')}
								<Settings class="h-4 w-4 text-muted-foreground" />
							{:else}
								<Activity class="h-4 w-4 text-muted-foreground" />
							{/if}
							<span class="text-sm font-medium">{formatActionName(actionStat.action)}</span>
						</div>
						<Badge variant="outline">{actionStat.count.toLocaleString()}</Badge>
					</div>
				{/each}
			</Card.Content>
		</Card.Root>

		<!-- Top Users -->
		<Card.Root>
			<Card.Header>
				<Card.Title>Most Active Users</Card.Title>
				<Card.Description>Users with the most audit log entries</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-4">
				{#each auditStats.topUsers as userStat}
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<User class="h-4 w-4 text-muted-foreground" />
							<span class="text-sm font-medium">{userStat.userName}</span>
						</div>
						<Badge variant="outline">{userStat.actionCount.toLocaleString()}</Badge>
					</div>
				{/each}
			</Card.Content>
		</Card.Root>
	</div>
</div>

<!-- Filter Dialog -->
<Dialog.Root bind:open={showFilterDialog}>
	<Dialog.Content class="sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title>Filter Audit Logs</Dialog.Title>
			<Dialog.Description>
				Apply filters to narrow down the audit log results
			</Dialog.Description>
		</Dialog.Header>
		<div class="space-y-6">
			<!-- Date Range -->
			<div class="space-y-3">
				<Label>Date Range</Label>
				<Select.Root type="single" bind:value={filters.dateRange}>
				<Select.Trigger class="w-32">
					{selectedFiltersDateRangeLabel}
				</Select.Trigger>
				<Select.Content>
					{#each filtersDateRangeOptions as option}
						<Select.Item value={option.value}>{option.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
				
				{#if filters.dateRange === 'custom'}
					<div class="grid grid-cols-2 gap-2">
						<div>
							<Label for="startDate">Start Date</Label>
							<Input 
								id="startDate" 
								type="date" 
								bind:value={filters.startDate} 
							/>
						</div>
						<div>
							<Label for="endDate">End Date</Label>
							<Input 
								id="endDate" 
								type="date" 
								bind:value={filters.endDate} 
							/>
						</div>
					</div>
				{/if}
			</div>

			<!-- Action Filter -->
			<div class="space-y-2">
				<Label>Action</Label>
				<Select.Root type="single" bind:value={filters.action}>
				<Select.Trigger class="w-32">
					{selectedFiltersActionLabel}
				</Select.Trigger>
				<Select.Content>
					{#each filtersActionOptions as option}
						<Select.Item value={option.value}>{option.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
			</div>

			<!-- Resource Filter -->
			<div class="space-y-2">
				<Label>Resource</Label>
				<Select.Root type="single" bind:value={filters.resource}>
				<Select.Trigger class="w-32">
					{selectedFiltersResourceLabel}
				</Select.Trigger>
				<Select.Content>
					{#each filtersResourceOptions as option}
						<Select.Item value={option.value}>{option.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
			</div>

			<!-- Success Filter -->
			<div class="space-y-2">
				<Label>Status</Label>
				<Select.Root type="single" bind:value={filters.success}>
				<Select.Trigger class="w-32">
					{selectedFiltersSuccessLabel}
				</Select.Trigger>
				<Select.Content>
					{#each filtersSuccessOptions as option}
						<Select.Item value={option.value}>{option.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
			</div>

			<!-- User Filter -->
			<div class="space-y-2">
				<Label for="userFilter">User</Label>
				<Input 
					id="userFilter" 
					placeholder="Filter by user ID or email" 
					bind:value={filters.userId} 
				/>
			</div>

			<!-- IP Address Filter -->
			<div class="space-y-2">
				<Label for="ipFilter">IP Address</Label>
				<Input 
					id="ipFilter" 
					placeholder="Filter by IP address" 
					bind:value={filters.ipAddress} 
				/>
			</div>
		</div>
		<Dialog.Footer>
			<Button variant="outline" onclick={clearFilters}>
				Clear All
			</Button>
			<Button onclick={() => (showFilterDialog = false)}>
				Apply Filters
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Details Dialog -->
<Dialog.Root bind:open={showDetailsDialog}>
	<Dialog.Content class="sm:max-w-2xl">
		<Dialog.Header>
			<Dialog.Title>Audit Log Details</Dialog.Title>
			<Dialog.Description>
				Detailed information about the audit log entry
			</Dialog.Description>
		</Dialog.Header>
		{#if selectedAuditLog}
			<div class="space-y-6">
				<!-- Basic Information -->
				<div class="grid grid-cols-2 gap-4">
					<div>
						<Label class="text-sm font-medium text-muted-foreground">Timestamp</Label>
						<p class="text-sm">{selectedAuditLog.timestamp.toLocaleString()}</p>
					</div>
					<div>
						<Label class="text-sm font-medium text-muted-foreground">User</Label>
						<p class="text-sm">{selectedAuditLog.userName || 'System'}</p>
					</div>
					<div>
						<Label class="text-sm font-medium text-muted-foreground">Action</Label>
						<p class="text-sm">{formatActionName(selectedAuditLog.action)}</p>
					</div>
					<div>
						<Label class="text-sm font-medium text-muted-foreground">Resource</Label>
						<p class="text-sm">{formatResourceName(selectedAuditLog.resource)}</p>
					</div>
					<div>
						<Label class="text-sm font-medium text-muted-foreground">Status</Label>
						<Badge variant={getSuccessBadge(selectedAuditLog.success).variant} class="w-fit">
							{#if selectedAuditLog.success}
								<CheckCircle class="mr-1 h-3 w-3" />
							{:else}
								<XCircle class="mr-1 h-3 w-3" />
							{/if}
							{getSuccessBadge(selectedAuditLog.success).text}
						</Badge>
					</div>
					<div>
						<Label class="text-sm font-medium text-muted-foreground">Severity</Label>
						<Badge variant={getSeverityBadge(selectedAuditLog.severity).variant} class="w-fit">
							{getSeverityBadge(selectedAuditLog.severity).text}
						</Badge>
					</div>
				</div>

				<Separator />

				<!-- Network Information -->
				<div class="space-y-3">
					<h4 class="font-medium">Network Information</h4>
					<div class="grid grid-cols-1 gap-3">
						<div>
							<Label class="text-sm font-medium text-muted-foreground">IP Address</Label>
							<p class="text-sm font-mono">{selectedAuditLog.ipAddress}</p>
						</div>
						<div>
							<Label class="text-sm font-medium text-muted-foreground">User Agent</Label>
							<p class="text-sm break-all">{selectedAuditLog.userAgent}</p>
						</div>
					</div>
				</div>

				<Separator />

				<!-- Additional Details -->
				<div class="space-y-3">
					<h4 class="font-medium">Additional Details</h4>
					<div class="bg-muted rounded-lg p-4">
						<pre class="text-sm whitespace-pre-wrap">{JSON.stringify(selectedAuditLog.details, null, 2)}</pre>
					</div>
				</div>
			</div>
		{/if}
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (showDetailsDialog = false)}>
				Close
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Export Dialog -->
<Dialog.Root bind:open={showExportDialog}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Export Audit Logs</Dialog.Title>
			<Dialog.Description>
				Export audit logs in your preferred format
			</Dialog.Description>
		</Dialog.Header>
		<div class="space-y-4">
			<div class="space-y-2">
				<Label>Export Format</Label>
				<Select.Root type="single" bind:value={exportOptions.format}>
				<Select.Trigger class="w-32">
					{selectedExportOptionsFormatLabel}
				</Select.Trigger>
				<Select.Content>
					{#each exportOptionsFormatOptions as option}
						<Select.Item value={option.value}>{option.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
			</div>

			<div class="space-y-2">
				<Label>Data Range</Label>
				<Select.Root type="single" bind:value={exportOptions.dateRange}>
				<Select.Trigger class="w-32">
					{selectedExportOptionsDateRangeLabel}
				</Select.Trigger>
				<Select.Content>
					{#each exportOptionsDateRangeOptions as option}
						<Select.Item value={option.value}>{option.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
			</div>

			{#if exportOptions.dateRange === 'custom'}
				<div class="grid grid-cols-2 gap-2">
					<div>
						<Label for="exportStartDate">Start Date</Label>
						<Input 
							id="exportStartDate" 
							type="date" 
							bind:value={exportOptions.customStartDate} 
						/>
					</div>
					<div>
						<Label for="exportEndDate">End Date</Label>
						<Input 
							id="exportEndDate" 
							type="date" 
							bind:value={exportOptions.customEndDate} 
						/>
					</div>
				</div>
			{/if}

			<div class="flex items-center space-x-2">
				<Switch id="includeDetails" bind:checked={exportOptions.includeDetails} />
				<Label for="includeDetails">Include detailed information</Label>
			</div>

			{#if exportOptions.dateRange === 'all' && auditLogs.length > auditSettings.maxExportRecords}
				<Alert.Root variant="destructive">
					<AlertTriangle class="h-4 w-4" />
					<Alert.Description>
						Export limited to {auditSettings.maxExportRecords.toLocaleString()} records. 
						Use date range filters for larger exports.
					</Alert.Description>
				</Alert.Root>
			{/if}
		</div>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (showExportDialog = false)} disabled={isExporting}>
				Cancel
			</Button>
			<Button onclick={exportAuditLogs} disabled={isExporting}>
				{#if isExporting}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					Exporting...
				{:else}
					<Download class="mr-2 h-4 w-4" />
					Export
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Settings Dialog -->
<Dialog.Root bind:open={showSettingsDialog}>
	<Dialog.Content class="sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title>Audit Trail Settings</Dialog.Title>
			<Dialog.Description>
				Configure audit logging and retention settings
			</Dialog.Description>
		</Dialog.Header>
		<div class="space-y-6">
			<!-- Retention Settings -->
			<div class="space-y-4">
				<h4 class="font-medium">Retention Settings</h4>
				<div class="space-y-3">
					<div>
						<Label for="retentionDays">Log Retention (Days)</Label>
						<Input 
							id="retentionDays" 
							type="number" 
							bind:value={auditSettings.retentionDays}
							min="1"
							max="365"
						/>
						<p class="text-xs text-muted-foreground mt-1">
							Logs older than this will be automatically deleted
						</p>
					</div>
					<div class="flex items-center justify-between">
						<div>
							<Label>Auto Cleanup</Label>
							<p class="text-sm text-muted-foreground">
								Automatically delete old logs based on retention period
							</p>
						</div>
						<Switch bind:checked={auditSettings.autoCleanup} />
					</div>
					<div class="flex items-center justify-between">
						<div>
							<Label>Compress Old Logs</Label>
							<p class="text-sm text-muted-foreground">
								Compress logs older than 30 days to save space
							</p>
						</div>
						<Switch bind:checked={auditSettings.compressOldLogs} />
					</div>
				</div>
			</div>

			<Separator />

			<!-- Logging Settings -->
			<div class="space-y-4">
				<h4 class="font-medium">Logging Settings</h4>
				<div class="space-y-3">
					<div>
						<Label>Log Level</Label>
						<Select.Root type="single" bind:value={auditSettings.logLevel}>
				<Select.Trigger class="w-32">
					{selectedAuditSettingsLogLevelLabel}
				</Select.Trigger>
				<Select.Content>
					{#each auditSettingsLogLevelOptions as option}
						<Select.Item value={option.value}>{option.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
					</div>
					<div class="flex items-center justify-between">
						<div>
							<Label>Real-time Alerts</Label>
							<p class="text-sm text-muted-foreground">
								Send alerts for critical security events
							</p>
						</div>
						<Switch bind:checked={auditSettings.enableRealTimeAlerts} />
					</div>
					{#if auditSettings.enableRealTimeAlerts}
						<div>
							<Label for="alertThreshold">Alert Threshold (events/minute)</Label>
							<Input 
								id="alertThreshold" 
								type="number" 
								bind:value={auditSettings.alertThreshold}
								min="1"
								max="100"
							/>
						</div>
					{/if}
				</div>
			</div>

			<Separator />

			<!-- Export Settings -->
			<div class="space-y-4">
				<h4 class="font-medium">Export Settings</h4>
				<div class="space-y-3">
					<div class="flex items-center justify-between">
						<div>
							<Label>Enable Export</Label>
							<p class="text-sm text-muted-foreground">
								Allow users to export audit logs
							</p>
						</div>
						<Switch bind:checked={auditSettings.enableExport} />
					</div>
					{#if auditSettings.enableExport}
						<div>
							<Label for="maxExportRecords">Max Export Records</Label>
							<Input 
								id="maxExportRecords" 
								type="number" 
								bind:value={auditSettings.maxExportRecords}
								min="100"
								max="100000"
							/>
						</div>
					{/if}
				</div>
			</div>
		</div>
		<Dialog.Footer>
			<div class="flex justify-between w-full">
				<Button variant="outline" onclick={cleanupOldLogs} disabled={isLoading}>
					{#if isLoading}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					{:else}
						<Trash2 class="mr-2 h-4 w-4" />
					{/if}
					Cleanup Now
				</Button>
				<div class="flex gap-2">
					<Button variant="outline" onclick={() => (showSettingsDialog = false)} disabled={isLoading}>
						Cancel
					</Button>
					<Button onclick={saveAuditSettings} disabled={isLoading}>
						{#if isLoading}
							<Loader2 class="mr-2 h-4 w-4 animate-spin" />
						{/if}
						Save Settings
					</Button>
				</div>
			</div>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>