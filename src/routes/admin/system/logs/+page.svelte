<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import { Badge } from '$lib/components/ui/badge';
	import { Search, Download, RefreshCw, Filter, AlertCircle, Info, CheckCircle, XCircle } from '@lucide/svelte';

	let searchTerm = $state('');
	let logLevel = $state('all');
	let timeRange = $state('1h');
	let isRefreshing = $state(false);

	let logs = $state([
		{
			id: '1',
			timestamp: new Date('2024-01-15T15:30:25'),
			level: 'error',
			source: 'database',
			message: 'Connection timeout to primary database server',
			details: 'Timeout occurred after 30 seconds. Failover to secondary server initiated.'
		},
		{
			id: '2',
			timestamp: new Date('2024-01-15T15:29:18'),
			level: 'warning',
			source: 'auth',
			message: 'Multiple failed login attempts detected',
			details: 'IP: 192.168.1.100, User: admin, Attempts: 5'
		},
		{
			id: '3',
			timestamp: new Date('2024-01-15T15:28:45'),
			level: 'info',
			source: 'api',
			message: 'API rate limit threshold reached',
			details: 'Client exceeded 1000 requests per hour limit'
		},
		{
			id: '4',
			timestamp: new Date('2024-01-15T15:27:12'),
			level: 'success',
			source: 'backup',
			message: 'Daily backup completed successfully',
			details: 'Backup size: 2.3GB, Duration: 45 minutes'
		},
		{
			id: '5',
			timestamp: new Date('2024-01-15T15:25:33'),
			level: 'info',
			source: 'system',
			message: 'System health check completed',
			details: 'All services operational, response time: 12ms'
		}
	]);

	let filteredLogs = $derived.by(() => {
		let filtered = logs;
		
		if (logLevel !== 'all') {
			filtered = filtered.filter(log => log.level === logLevel);
		}
		
		if (searchTerm) {
			filtered = filtered.filter(log => 
				log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
				log.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
				log.details.toLowerCase().includes(searchTerm.toLowerCase())
			);
		}
		
		return filtered;
	});

	function getLogBadge(level: string) {
		switch (level) {
			case 'error':
				return { variant: 'destructive' as const, text: 'Error', icon: XCircle };
			case 'warning':
				return { variant: 'secondary' as const, text: 'Warning', icon: AlertCircle };
			case 'info':
				return { variant: 'outline' as const, text: 'Info', icon: Info };
			case 'success':
				return { variant: 'default' as const, text: 'Success', icon: CheckCircle };
			default:
				return { variant: 'outline' as const, text: level, icon: Info };
		}
	}

	function getSourceBadge(source: string) {
		const colors = {
			database: 'bg-blue-100 text-blue-800',
			auth: 'bg-purple-100 text-purple-800',
			api: 'bg-green-100 text-green-800',
			backup: 'bg-orange-100 text-orange-800',
			system: 'bg-gray-100 text-gray-800'
		};
		return colors[source as keyof typeof colors] || 'bg-gray-100 text-gray-800';
	}

	async function handleRefresh() {
		isRefreshing = true;
		// Simulate API call
		await new Promise(resolve => setTimeout(resolve, 1000));
		isRefreshing = false;
	}

	function handleExport() {
		console.log('Export logs');
	}


	const logLevelOptions = [
		{ value: 'all', label: 'All Levels' },
		{ value: 'error', label: 'Error' },
		{ value: 'warning', label: 'Warning' },
		{ value: 'info', label: 'Info' },
		{ value: 'success', label: 'Success' }
	];

	const selectedLogLevelLabel = $derived(
		logLevelOptions.find(option => option.value === logLevel)?.label ?? 'Select option'
	);

	const timeRangeOptions = [
		{ value: '1h', label: 'Last 1 hour' },
		{ value: '24h', label: 'Last 24 hours' },
		{ value: '7d', label: 'Last 7 days' },
		{ value: '30d', label: 'Last 30 days' }
	];

	const selectedTimeRangeLabel = $derived(
		timeRangeOptions.find(option => option.value === timeRange)?.label ?? 'Select option'
	);
</script>

<svelte:head>
	<title>System Logs | System Health | Admin</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
		<div class="space-y-2">
			<h1 class="text-2xl font-bold">System Logs</h1>
			<p class="text-muted-foreground">View and analyze system logs and events</p>
		</div>
		<div class="flex items-center gap-2">
			<Button variant="outline" onclick={handleExport}>
				<Download class="mr-2 h-4 w-4" />
				Export
			</Button>
			<Button onclick={handleRefresh} disabled={isRefreshing} class="transition-colors duration-200">
				<RefreshCw class="mr-2 h-4 w-4 {isRefreshing ? 'animate-spin' : ''}" />
				Refresh
			</Button>
		</div>
	</div>

	<!-- Filters -->
	<Card>
		<CardHeader>
			<CardTitle class="flex items-center gap-2">
				<Filter class="h-5 w-5" />
				Filters
			</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div class="space-y-2">
					<h4 class="text-sm font-medium">Search</h4>
					<div class="relative">
						<Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							bind:value={searchTerm}
							placeholder="Search logs..."
							class="pl-10"
						/>
					</div>
				</div>
				<div class="space-y-2">
					<h4 class="text-sm font-medium">Log Level</h4>
					<Select.Root type="single" bind:value={logLevel}>
				<Select.Trigger class="w-32">
					{selectedLogLevelLabel}
				</Select.Trigger>
				<Select.Content>
					{#each logLevelOptions as option}
						<Select.Item value={option.value}>{option.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
				</div>
				<div class="space-y-2">
					<h4 class="text-sm font-medium">Time Range</h4>
					<Select.Root type="single" bind:value={timeRange}>
				<Select.Trigger class="w-32">
					{selectedTimeRangeLabel}
				</Select.Trigger>
				<Select.Content>
					{#each timeRangeOptions as option}
						<Select.Item value={option.value}>{option.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- Log Entries -->
	<Card>
		<CardHeader>
			<div class="flex items-center justify-between">
				<CardTitle>Log Entries</CardTitle>
				<Badge variant="outline">{filteredLogs.length} entries</Badge>
			</div>
		</CardHeader>
		<CardContent class="p-0">
			<div class="space-y-1">
				{#each filteredLogs as log}
					{@const logBadge = getLogBadge(log.level)}
					<div class="p-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors duration-200">
						<div class="space-y-2">
							<div class="flex items-start justify-between gap-4">
								<div class="flex items-center gap-3 flex-1">
									<logBadge.icon class="h-4 w-4 flex-shrink-0 {
										log.level === 'error' ? 'text-red-500' :
										log.level === 'warning' ? 'text-yellow-500' :
										log.level === 'success' ? 'text-green-500' :
										'text-blue-500'
									}" />
									<div class="flex-1 min-w-0">
										<p class="font-medium text-sm">{log.message}</p>
										<p class="text-xs text-muted-foreground mt-1">{log.details}</p>
									</div>
								</div>
								<div class="flex items-center gap-2 flex-shrink-0">
									<Badge variant={logBadge.variant} class="text-xs">
										{logBadge.text}
									</Badge>
									<span class="px-2 py-1 rounded text-xs {getSourceBadge(log.source)}">
										{log.source}
									</span>
								</div>
							</div>
							<div class="text-xs text-muted-foreground">
								{log.timestamp.toLocaleString()}
							</div>
						</div>
					</div>
				{/each}
				
				{#if filteredLogs.length === 0}
					<div class="p-8 text-center text-muted-foreground">
						<p>No log entries found matching your criteria.</p>
					</div>
				{/if}
			</div>
		</CardContent>
	</Card>
</div>