<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { authClient } from '$lib/auth/auth-client';
	import { goto } from '$app/navigation';
	import {
		AlertTriangle,
		Plus,
		Search,
		CheckCircle,
		XCircle,
		Clock,
		Activity,
		Server,
		Database,
		Wifi,
		HardDrive,
		Cpu,
		MemoryStick,
		Loader2,
		Eye,
		Trash2,
		RefreshCw,
		TrendingUp,
		TrendingDown
	} from '@lucide/svelte';

	let hasCheckedAuth = $state(false);
	let showCreateDialog = $state(false);
	let showDetailsDialog = $state(false);
	let selectedAlert = $state(null);
	let searchTerm = $state('');
	let statusFilter = $state('all');
	let severityFilter = $state('all');
	let isLoading = $state(false);
	let isCreating = $state(false);

	const session = authClient.useSession();

	// Mock data for system alerts with severity levels
	let alerts = $state([
		{
			id: '1',
			title: 'High CPU Usage',
			message: 'Server CPU usage has exceeded 85% for the last 15 minutes on production server.',
			severity: 'high',
			status: 'active',
			category: 'performance',
			source: 'monitoring-system',
			detectedAt: new Date('2024-01-20T10:30:00'),
			acknowledgedAt: null,
			resolvedAt: null,
			acknowledged: false,
			assignedTo: null,
			metadata: {
				server: 'prod-web-01',
				currentValue: '87%',
				threshold: '80%',
				duration: '15 minutes'
			}
		},
		{
			id: '2',
			title: 'Database Connection Pool Warning',
			message: 'Database connection pool is at 90% capacity. Consider scaling or optimizing queries.',
			severity: 'medium',
			status: 'acknowledged',
			category: 'database',
			source: 'database-monitor',
			detectedAt: new Date('2024-01-20T08:15:00'),
			acknowledgedAt: new Date('2024-01-20T08:20:00'),
			resolvedAt: null,
			acknowledged: true,
			assignedTo: 'devops@example.com',
			metadata: {
				database: 'primary-db',
				currentConnections: '90',
				maxConnections: '100',
				activeQueries: '45'
			}
		},
		{
			id: '3',
			title: 'Disk Space Low',
			message: 'Available disk space on /var/log partition is below 10%.',
			severity: 'medium',
			status: 'resolved',
			category: 'storage',
			source: 'system-monitor',
			detectedAt: new Date('2024-01-19T14:30:00'),
			acknowledgedAt: new Date('2024-01-19T14:35:00'),
			resolvedAt: new Date('2024-01-19T15:00:00'),
			acknowledged: true,
			assignedTo: 'sysadmin@example.com',
			metadata: {
				partition: '/var/log',
				availableSpace: '8%',
				threshold: '10%',
				totalSize: '100GB'
			}
		},
		{
			id: '4',
			title: 'SSL Certificate Expiring',
			message: 'SSL certificate for api.example.com will expire in 7 days.',
			severity: 'low',
			status: 'active',
			category: 'security',
			source: 'ssl-monitor',
			detectedAt: new Date('2024-01-20T00:00:00'),
			acknowledgedAt: null,
			resolvedAt: null,
			acknowledged: false,
			assignedTo: null,
			metadata: {
				domain: 'api.example.com',
				expiryDate: '2024-01-27',
				daysRemaining: '7',
				issuer: 'Let\'s Encrypt'
			}
		}
	]);

	// Form data for new alert
	let newAlert = $state({
		title: '',
		message: '',
		severity: 'medium',
		category: 'general',
		source: 'manual'
	});

	// Alert statistics
	const alertStats = $derived({
		total: alerts.length,
		active: alerts.filter(a => a.status === 'active').length,
		acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
		resolved: alerts.filter(a => a.status === 'resolved').length,
		high: alerts.filter(a => a.severity === 'high').length,
		medium: alerts.filter(a => a.severity === 'medium').length,
		low: alerts.filter(a => a.severity === 'low').length
	});

	// Reactive statement to check session and redirect if needed
	$effect(() => {
		if (!hasCheckedAuth && $session.data) {
			hasCheckedAuth = true;
			if ($session.data.user.role !== 'admin') {
				goto('/login?returnTo=/admin/notifications/system');
				return;
			}
		}
	});

	// Filtered alerts based on search and filters
	const filteredAlerts = $derived(
		alerts.filter(alert => {
			const matchesSearch = alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
				alert.message.toLowerCase().includes(searchTerm.toLowerCase());
			const matchesStatus = statusFilter === 'all' || alert.status === statusFilter;
			const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
			return matchesSearch && matchesStatus && matchesSeverity;
		})
	);

	function createAlert() {
		if (!newAlert.title || !newAlert.message) {
			return;
		}

		isCreating = true;

		// Simulate API call
		setTimeout(() => {
			const alert = {
				id: Date.now().toString(),
				title: newAlert.title,
				message: newAlert.message,
				severity: newAlert.severity,
				status: 'active',
				category: newAlert.category,
				source: newAlert.source,
				detectedAt: new Date(),
				acknowledgedAt: null,
				resolvedAt: null,
				acknowledged: false,
				assignedTo: null,
				metadata: {}
			};

			alerts = [alert, ...alerts];
			resetForm();
			showCreateDialog = false;
			isCreating = false;
		}, 1000);
	}

	function resetForm() {
		newAlert = {
			title: '',
			message: '',
			severity: 'medium',
			category: 'general',
			source: 'manual'
		};
	}

	function acknowledgeAlert(id: string) {
		alerts = alerts.map(alert =>
			alert.id === id ? {
				...alert,
				acknowledged: true,
				acknowledgedAt: new Date(),
				status: 'acknowledged',
				assignedTo: $session.data?.user?.email || 'admin@example.com'
			} : alert
		);
	}

	function resolveAlert(id: string) {
		alerts = alerts.map(alert =>
			alert.id === id ? {
				...alert,
				status: 'resolved',
				resolvedAt: new Date()
			} : alert
		);
	}

	function deleteAlert(id: string) {
		alerts = alerts.filter(a => a.id !== id);
	}

	function viewDetails(alert: any) {
		selectedAlert = alert;
		showDetailsDialog = true;
	}

	function getSeverityColor(severity: string) {
		switch (severity) {
			case 'high':
				return 'text-destructive';
			case 'medium':
				return 'text-yellow-600';
			case 'low':
				return 'text-blue-600';
			default:
				return 'text-muted-foreground';
		}
	}

	function getSeverityBadge(severity: string) {
		switch (severity) {
			case 'high':
				return { variant: 'destructive' as const, text: 'High' };
			case 'medium':
				return { variant: 'default' as const, text: 'Medium' };
			case 'low':
				return { variant: 'secondary' as const, text: 'Low' };
			default:
				return { variant: 'outline' as const, text: severity };
		}
	}

	function getStatusBadge(status: string) {
		switch (status) {
			case 'active':
				return { variant: 'destructive' as const, text: 'Active', icon: AlertTriangle };
			case 'acknowledged':
				return { variant: 'default' as const, text: 'Acknowledged', icon: CheckCircle };
			case 'resolved':
				return { variant: 'secondary' as const, text: 'Resolved', icon: XCircle };
			default:
				return { variant: 'outline' as const, text: status, icon: Clock };
		}
	}

	function getCategoryIcon(category: string) {
		switch (category) {
			case 'performance':
				return Activity;
			case 'database':
				return Database;
			case 'network':
				return Wifi;
			case 'storage':
				return HardDrive;
			case 'security':
				return AlertTriangle;
			case 'system':
				return Server;
			default:
				return AlertTriangle;
		}
	}

	function formatDuration(startDate: Date, endDate?: Date): string {
		const end = endDate || new Date();
		const diff = end.getTime() - startDate.getTime();
		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);

		if (days > 0) return `${days}d ${hours % 24}h`;
		if (hours > 0) return `${hours}h ${minutes % 60}m`;
		return `${minutes}m`;
	}


	const statusFilterOptions = [
		{ value: 'all', label: 'All Status' },
		{ value: 'active', label: 'Active' },
		{ value: 'resolved', label: 'Resolved' },
		{ value: 'acknowledged', label: 'Acknowledged' }
	];

	const selectedStatusFilterLabel = $derived(
		statusFilterOptions.find(option => option.value === statusFilter)?.label ?? 'Status'
	);

	const severityFilterOptions = [
		{ value: 'all', label: 'All Priority' },
		{ value: 'low', label: 'Low' },
		{ value: 'medium', label: 'Medium' },
		{ value: 'high', label: 'High' }
	];

	const selectedSeverityFilterLabel = $derived(
		severityFilterOptions.find(option => option.value === severityFilter)?.label ?? 'Severity'
	);

	const newAlertSeverityOptions = [
		{ value: 'all', label: 'All Priority' },
		{ value: 'low', label: 'Low' },
		{ value: 'medium', label: 'Medium' },
		{ value: 'high', label: 'High' }
	];

	const selectedNewAlertSeverityLabel = $derived(
		newAlertSeverityOptions.find(option => option.value === newAlert.severity)?.label ?? 'Select severity'
	);

	const newAlertCategoryOptions = [
		{ value: 'all', label: 'All Categories' },
		{ value: 'general', label: 'General' },
		{ value: 'performance', label: 'Performance' },
		{ value: 'database', label: 'Database' },
		{ value: 'network', label: 'Network' },
		{ value: 'storage', label: 'Storage' },
		{ value: 'security', label: 'Security' },
		{ value: 'system', label: 'System' }
	];

	const selectedNewAlertCategoryLabel = $derived(
		newAlertCategoryOptions.find(option => option.value === newAlert.category)?.label ?? 'Select category'
	);

	const newAlertSourceOptions = [
		{ value: 'manual', label: 'Manual Entry' },
		{ value: 'monitoring-system', label: 'Monitoring System' },
		{ value: 'database-monitor', label: 'Database Monitor' },
		{ value: 'system-monitor', label: 'System Monitor' },
		{ value: 'ssl-monitor', label: 'SSL Monitor' },
		{ value: 'application', label: 'Application' }
	];

	const selectedNewAlertSourceLabel = $derived(
		newAlertSourceOptions.find(option => option.value === newAlert.source)?.label ?? 'Select source'
	);
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
		<div class="space-y-2">
			<h1 class="text-2xl font-bold">System Alerts</h1>
			<p class="text-muted-foreground">Monitor and manage system health alerts with severity levels</p>
		</div>
		<Button onclick={() => (showCreateDialog = true)} class="transition-colors duration-200">
			<Plus class="mr-2 h-4 w-4" />
			Create Alert
		</Button>
	</div>

	<!-- Alert Statistics -->
	<div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
		<Card.Root>
			<Card.Content class="p-4 text-center">
				<div class="text-2xl font-bold">{alertStats.total}</div>
				<div class="text-sm text-muted-foreground">Total</div>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Content class="p-4 text-center">
				<div class="text-2xl font-bold text-destructive">{alertStats.active}</div>
				<div class="text-sm text-muted-foreground">Active</div>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Content class="p-4 text-center">
				<div class="text-2xl font-bold text-blue-600">{alertStats.acknowledged}</div>
				<div class="text-sm text-muted-foreground">Acknowledged</div>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Content class="p-4 text-center">
				<div class="text-2xl font-bold text-green-600">{alertStats.resolved}</div>
				<div class="text-sm text-muted-foreground">Resolved</div>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Content class="p-4 text-center">
				<div class="text-2xl font-bold text-destructive">{alertStats.high}</div>
				<div class="text-sm text-muted-foreground">High</div>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Content class="p-4 text-center">
				<div class="text-2xl font-bold text-yellow-600">{alertStats.medium}</div>
				<div class="text-sm text-muted-foreground">Medium</div>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Content class="p-4 text-center">
				<div class="text-2xl font-bold text-blue-600">{alertStats.low}</div>
				<div class="text-sm text-muted-foreground">Low</div>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Search and Filters -->
	<Card.Root>
		<Card.Content class="p-4">
			<div class="flex flex-col sm:flex-row gap-4">
				<div class="flex-1">
					<div class="relative">
						<Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
						<Input 
							type="search" 
							placeholder="Search alerts..." 
							class="pl-8 transition-colors duration-200" 
							bind:value={searchTerm} 
						/>
					</div>
				</div>
				<div class="flex gap-2">
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
					<Select.Root type="single" bind:value={severityFilter}>
				<Select.Trigger class="w-32">
					{selectedSeverityFilterLabel}
				</Select.Trigger>
				<Select.Content>
					{#each severityFilterOptions as option}
						<Select.Item value={option.value}>{option.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
					<Button variant="outline" onclick={() => {
						searchTerm = '';
						statusFilter = 'all';
						severityFilter = 'all';
					}} class="transition-colors duration-200">
						Reset
					</Button>
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Alerts Table -->
	<Card.Root>
		<Card.Content class="p-0">
			{#if isLoading}
				<div class="flex justify-center py-12">
					<Loader2 class="h-8 w-8 animate-spin text-primary" />
				</div>
			{:else if filteredAlerts.length === 0}
				<div class="text-center py-12 space-y-4">
					<AlertTriangle class="h-12 w-12 mx-auto text-muted-foreground" />
					<div class="space-y-2">
						<h3 class="text-lg font-semibold">No alerts found</h3>
						<p class="text-muted-foreground">
							{searchTerm || statusFilter !== 'all' || severityFilter !== 'all' 
								? 'Try adjusting your search or filters.' 
								: 'System is running smoothly with no active alerts.'}
						</p>
					</div>
					{#if !searchTerm && statusFilter === 'all' && severityFilter === 'all'}
						<Button onclick={() => (showCreateDialog = true)} class="transition-colors duration-200">
							<Plus class="mr-2 h-4 w-4" />
							Create Alert
						</Button>
					{/if}
				</div>
			{:else}
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Alert</Table.Head>
							<Table.Head>Severity</Table.Head>
							<Table.Head>Status</Table.Head>
							<Table.Head>Category</Table.Head>
							<Table.Head>Duration</Table.Head>
							<Table.Head>Assigned</Table.Head>
							<Table.Head class="text-right">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each filteredAlerts as alert}
							{@const CategoryIcon = getCategoryIcon(alert.category)}
							{@const statusInfo = getStatusBadge(alert.status)}
							<Table.Row class="transition-colors duration-200 hover:bg-muted/50">
								<Table.Cell>
									<div class="flex items-start gap-3">
										<div class="rounded-lg p-2 {getSeverityColor(alert.severity)} bg-muted">
											<CategoryIcon class="h-4 w-4" />
										</div>
										<div class="space-y-1">
											<p class="font-medium text-sm">{alert.title}</p>
											<p class="text-sm text-muted-foreground line-clamp-2">
												{alert.message}
											</p>
											<div class="flex items-center gap-2 text-xs text-muted-foreground">
												<span>Source: {alert.source}</span>
												<span>•</span>
												<span>{alert.detectedAt.toLocaleString()}</span>
											</div>
										</div>
									</div>
								</Table.Cell>
								<Table.Cell>
									<Badge variant={getSeverityBadge(alert.severity).variant} class="text-xs">
										{getSeverityBadge(alert.severity).text}
									</Badge>
								</Table.Cell>
								<Table.Cell>
									<div class="flex items-center gap-2">
										<statusInfo.icon class="h-3 w-3" />
										<Badge variant={statusInfo.variant} class="text-xs">
											{statusInfo.text}
										</Badge>
									</div>
								</Table.Cell>
								<Table.Cell>
									<Badge variant="outline" class="text-xs capitalize">
										{alert.category}
									</Badge>
								</Table.Cell>
								<Table.Cell>
									<div class="space-y-1">
										<p class="text-sm font-medium">
											{formatDuration(alert.detectedAt, alert.resolvedAt)}
										</p>
										{#if alert.status === 'active'}
											<div class="flex items-center gap-1 text-xs text-destructive">
												<TrendingUp class="h-3 w-3" />
												<span>Ongoing</span>
											</div>
										{:else if alert.resolvedAt}
											<div class="flex items-center gap-1 text-xs text-green-600">
												<TrendingDown class="h-3 w-3" />
												<span>Resolved</span>
											</div>
										{/if}
									</div>
								</Table.Cell>
								<Table.Cell>
									{#if alert.assignedTo}
										<p class="text-sm">{alert.assignedTo.split('@')[0]}</p>
									{:else}
										<span class="text-sm text-muted-foreground">Unassigned</span>
									{/if}
								</Table.Cell>
								<Table.Cell class="text-right">
									<div class="flex items-center justify-end gap-2">
										<Button 
											variant="ghost" 
											size="icon" 
											onclick={() => viewDetails(alert)}
											aria-label="View details"
											class="transition-colors duration-200"
										>
											<Eye class="h-4 w-4" />
										</Button>
										{#if !alert.acknowledged && alert.status === 'active'}
											<Button 
												variant="ghost" 
												size="icon" 
												onclick={() => acknowledgeAlert(alert.id)}
												aria-label="Acknowledge alert"
												class="transition-colors duration-200"
											>
												<CheckCircle class="h-4 w-4" />
											</Button>
										{/if}
										{#if alert.status !== 'resolved'}
											<Button 
												variant="ghost" 
												size="icon" 
												onclick={() => resolveAlert(alert.id)}
												aria-label="Resolve alert"
												class="transition-colors duration-200"
											>
												<XCircle class="h-4 w-4" />
											</Button>
										{/if}
										<Button 
											variant="ghost" 
											size="icon" 
											onclick={() => deleteAlert(alert.id)}
											aria-label="Delete alert"
											class="transition-colors duration-200 hover:text-destructive"
										>
											<Trash2 class="h-4 w-4" />
										</Button>
									</div>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			{/if}
		</Card.Content>
	</Card.Root>

	<!-- Create Alert Dialog -->
	<Dialog.Root bind:open={showCreateDialog}>
		<Dialog.Content class="sm:max-w-2xl">
			<Dialog.Header>
				<Dialog.Title>Create System Alert</Dialog.Title>
				<Dialog.Description>
					Create a new system alert to track issues and notify administrators.
				</Dialog.Description>
			</Dialog.Header>
			<form
				onsubmit={(e) => {
					e.preventDefault();
					createAlert();
				}}
				class="space-y-6"
			>
				<!-- Title and Severity Row -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div class="space-y-2">
						<Label for="title">Alert Title *</Label>
						<Input
							id="title"
							bind:value={newAlert.title}
							placeholder="Brief description of the issue"
							required
							class="transition-colors duration-200"
						/>
					</div>
					<div class="space-y-2">
						<Label for="severity">Severity</Label>
						<Select.Root type="single" bind:value={newAlert.severity}>
				<Select.Trigger class="w-32">
					{selectedNewAlertSeverityLabel}
				</Select.Trigger>
				<Select.Content>
					{#each newAlertSeverityOptions as option}
						<Select.Item value={option.value}>{option.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
					</div>
				</div>

				<!-- Message -->
				<div class="space-y-2">
					<Label for="message">Alert Message *</Label>
					<Textarea
						id="message"
						bind:value={newAlert.message}
						placeholder="Detailed description of the alert and any relevant information..."
						rows={4}
						required
						class="transition-colors duration-200 resize-none"
					/>
				</div>

				<!-- Category and Source Row -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div class="space-y-2">
						<Label for="category">Category</Label>
						<Select.Root type="single" bind:value={newAlert.category}>
				<Select.Trigger class="w-32">
					{selectedNewAlertCategoryLabel}
				</Select.Trigger>
				<Select.Content>
					{#each newAlertCategoryOptions as option}
						<Select.Item value={option.value}>{option.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
					</div>
					<div class="space-y-2">
						<Label for="source">Source</Label>
						<Select.Root type="single" bind:value={newAlert.source}>
				<Select.Trigger class="w-32">
					{selectedNewAlertSourceLabel}
				</Select.Trigger>
				<Select.Content>
					{#each newAlertSourceOptions as option}
						<Select.Item value={option.value}>{option.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
					</div>
				</div>

				<!-- Preview Alert -->
				{#if newAlert.title && newAlert.message}
					<Alert.Root variant={newAlert.severity === 'high' ? 'destructive' : 'default'}>
						<AlertTriangle class="h-4 w-4" />
						<Alert.Title>Preview: {newAlert.title}</Alert.Title>
						<Alert.Description>
							{newAlert.message}
						</Alert.Description>
					</Alert.Root>
				{/if}

				<Dialog.Footer>
					<Button
						type="button"
						variant="outline"
						onclick={() => {
							showCreateDialog = false;
							resetForm();
						}}
						disabled={isCreating}
					>
						Cancel
					</Button>
					<Button type="submit" disabled={isCreating} class="transition-colors duration-200">
						{#if isCreating}
							<Loader2 class="mr-2 h-4 w-4 animate-spin" />
							Creating...
						{:else}
							<Plus class="mr-2 h-4 w-4" />
							Create Alert
						{/if}
					</Button>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Root>

	<!-- Alert Details Dialog -->
	<Dialog.Root bind:open={showDetailsDialog}>
		<Dialog.Content class="sm:max-w-2xl">
			<Dialog.Header>
				<Dialog.Title>Alert Details</Dialog.Title>
			</Dialog.Header>
			{#if selectedAlert}
				{@const CategoryIcon = getCategoryIcon(selectedAlert.category)}
				<div class="space-y-6">
					<!-- Alert Header -->
					<div class="flex items-start gap-4">
						<div class="rounded-lg p-3 {getSeverityColor(selectedAlert.severity)} bg-muted">
							<CategoryIcon class="h-6 w-6" />
						</div>
						<div class="flex-1 space-y-2">
							<h3 class="text-lg font-semibold">{selectedAlert.title}</h3>
							<p class="text-muted-foreground">{selectedAlert.message}</p>
							<div class="flex items-center gap-4">
								<Badge variant={getSeverityBadge(selectedAlert.severity).variant}>
									{getSeverityBadge(selectedAlert.severity).text}
								</Badge>
								<Badge variant={getStatusBadge(selectedAlert.status).variant}>
									{getStatusBadge(selectedAlert.status).text}
								</Badge>
								<Badge variant="outline" class="capitalize">
									{selectedAlert.category}
								</Badge>
							</div>
						</div>
					</div>

					<!-- Alert Timeline -->
					<div class="space-y-4">
						<h4 class="font-medium">Timeline</h4>
						<div class="space-y-3">
							<div class="flex items-center gap-3 text-sm">
								<div class="w-2 h-2 rounded-full bg-destructive"></div>
								<span class="font-medium">Detected:</span>
								<span class="text-muted-foreground">{selectedAlert.detectedAt.toLocaleString()}</span>
							</div>
							{#if selectedAlert.acknowledgedAt}
								<div class="flex items-center gap-3 text-sm">
									<div class="w-2 h-2 rounded-full bg-blue-500"></div>
									<span class="font-medium">Acknowledged:</span>
									<span class="text-muted-foreground">{selectedAlert.acknowledgedAt.toLocaleString()}</span>
									{#if selectedAlert.assignedTo}
										<span class="text-muted-foreground">by {selectedAlert.assignedTo}</span>
									{/if}
								</div>
							{/if}
							{#if selectedAlert.resolvedAt}
								<div class="flex items-center gap-3 text-sm">
									<div class="w-2 h-2 rounded-full bg-green-500"></div>
									<span class="font-medium">Resolved:</span>
									<span class="text-muted-foreground">{selectedAlert.resolvedAt.toLocaleString()}</span>
								</div>
							{/if}
						</div>
					</div>

					<!-- Metadata -->
					{#if Object.keys(selectedAlert.metadata).length > 0}
						<div class="space-y-4">
							<h4 class="font-medium">Additional Information</h4>
							<div class="grid grid-cols-2 gap-4">
								{#each Object.entries(selectedAlert.metadata) as [key, value]}
									<div class="space-y-1">
										<p class="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</p>
										<p class="text-sm text-muted-foreground">{value}</p>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Actions -->
					<div class="flex items-center gap-2 pt-4 border-t">
						{#if !selectedAlert.acknowledged && selectedAlert.status === 'active'}
							<Button 
								onclick={() => {
									acknowledgeAlert(selectedAlert.id);
									showDetailsDialog = false;
								}}
								class="transition-colors duration-200"
							>
								<CheckCircle class="mr-2 h-4 w-4" />
								Acknowledge
							</Button>
						{/if}
						{#if selectedAlert.status !== 'resolved'}
							<Button 
								variant="outline"
								onclick={() => {
									resolveAlert(selectedAlert.id);
									showDetailsDialog = false;
								}}
								class="transition-colors duration-200"
							>
								<XCircle class="mr-2 h-4 w-4" />
								Resolve
							</Button>
						{/if}
					</div>
				</div>
			{/if}
			<Dialog.Footer>
				<Button onclick={() => (showDetailsDialog = false)}>Close</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
</div>