<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select';
	import { Activity, Cpu, MemoryStick, HardDrive, Wifi, RefreshCw } from '@lucide/svelte';

	let timeRange = $state('1h');
	let isRefreshing = $state(false);

	let monitoringData = $state({
		cpu: {
			current: 45,
			average: 38,
			peak: 78,
			status: 'normal'
		},
		memory: {
			used: 6.2,
			total: 16,
			percentage: 39,
			status: 'normal'
		},
		disk: {
			used: 245,
			total: 500,
			percentage: 49,
			status: 'normal'
		},
		network: {
			inbound: '125 MB/s',
			outbound: '89 MB/s',
			status: 'normal'
		},
		alerts: [
			{
				id: '1',
				type: 'warning',
				message: 'CPU usage spike detected at 14:32',
				timestamp: new Date('2024-01-15T14:32:00'),
				resolved: false
			},
			{
				id: '2',
				type: 'info',
				message: 'Scheduled maintenance completed successfully',
				timestamp: new Date('2024-01-15T12:00:00'),
				resolved: true
			},
			{
				id: '3',
				type: 'error',
				message: 'Database connection timeout (resolved)',
				timestamp: new Date('2024-01-15T10:15:00'),
				resolved: true
			}
		]
	});

	function getStatusColor(status: string) {
		switch (status) {
			case 'normal':
				return 'text-green-500';
			case 'warning':
				return 'text-yellow-500';
			case 'critical':
				return 'text-red-500';
			default:
				return 'text-gray-500';
		}
	}

	function getAlertBadge(type: string) {
		switch (type) {
			case 'error':
				return { variant: 'destructive' as const, text: 'Error' };
			case 'warning':
				return { variant: 'secondary' as const, text: 'Warning' };
			case 'info':
				return { variant: 'outline' as const, text: 'Info' };
			default:
				return { variant: 'outline' as const, text: type };
		}
	}

	function getProgressColor(percentage: number) {
		if (percentage >= 80) return 'bg-red-500';
		if (percentage >= 60) return 'bg-yellow-500';
		return 'bg-green-500';
	}

	async function handleRefresh() {
		isRefreshing = true;
		// Simulate API call
		await new Promise(resolve => setTimeout(resolve, 1000));
		// Update with new random data
		monitoringData.cpu.current = Math.floor(Math.random() * 100);
		monitoringData.memory.percentage = Math.floor(Math.random() * 100);
		monitoringData.disk.percentage = Math.floor(Math.random() * 100);
		isRefreshing = false;
	}
</script>

<svelte:head>
	<title>Real-time Monitoring | System Health | Admin</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
		<div class="space-y-2">
			<h1 class="text-2xl font-bold">Real-time Monitoring</h1>
			<p class="text-muted-foreground">Monitor system resources and performance metrics</p>
		</div>
		<div class="flex items-center gap-2">
			<Select bind:value={timeRange}>
				<SelectTrigger class="w-32">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="5m">Last 5 min</SelectItem>
					<SelectItem value="1h">Last 1 hour</SelectItem>
					<SelectItem value="24h">Last 24 hours</SelectItem>
					<SelectItem value="7d">Last 7 days</SelectItem>
				</SelectContent>
			</Select>
			<Button onclick={handleRefresh} disabled={isRefreshing} class="transition-colors duration-200">
				<RefreshCw class="mr-2 h-4 w-4 {isRefreshing ? 'animate-spin' : ''}" />
				Refresh
			</Button>
		</div>
	</div>

	<!-- Resource Monitoring Cards -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
		<!-- CPU Usage -->
		<Card>
			<CardHeader class="pb-2">
				<div class="flex items-center justify-between">
					<CardTitle class="text-sm font-medium">CPU Usage</CardTitle>
					<Cpu class="h-4 w-4 text-muted-foreground" />
				</div>
			</CardHeader>
			<CardContent class="space-y-3">
				<div class="text-2xl font-bold">{monitoringData.cpu.current}%</div>
				<div class="w-full bg-muted rounded-full h-2">
					<div 
						class="h-2 rounded-full transition-all duration-300 {getProgressColor(monitoringData.cpu.current)}"
						style="width: {monitoringData.cpu.current}%"
					></div>
				</div>
				<div class="text-xs text-muted-foreground space-y-1">
					<div class="flex justify-between">
						<span>Average:</span>
						<span>{monitoringData.cpu.average}%</span>
					</div>
					<div class="flex justify-between">
						<span>Peak:</span>
						<span>{monitoringData.cpu.peak}%</span>
					</div>
				</div>
			</CardContent>
		</Card>

		<!-- Memory Usage -->
		<Card>
			<CardHeader class="pb-2">
				<div class="flex items-center justify-between">
					<CardTitle class="text-sm font-medium">Memory Usage</CardTitle>
					<MemoryStick class="h-4 w-4 text-muted-foreground" />
				</div>
			</CardHeader>
			<CardContent class="space-y-3">
				<div class="text-2xl font-bold">{monitoringData.memory.percentage}%</div>
				<div class="w-full bg-muted rounded-full h-2">
					<div 
						class="h-2 rounded-full transition-all duration-300 {getProgressColor(monitoringData.memory.percentage)}"
						style="width: {monitoringData.memory.percentage}%"
					></div>
				</div>
				<div class="text-xs text-muted-foreground">
					<div class="flex justify-between">
						<span>Used:</span>
						<span>{monitoringData.memory.used} GB</span>
					</div>
					<div class="flex justify-between">
						<span>Total:</span>
						<span>{monitoringData.memory.total} GB</span>
					</div>
				</div>
			</CardContent>
		</Card>

		<!-- Disk Usage -->
		<Card>
			<CardHeader class="pb-2">
				<div class="flex items-center justify-between">
					<CardTitle class="text-sm font-medium">Disk Usage</CardTitle>
					<HardDrive class="h-4 w-4 text-muted-foreground" />
				</div>
			</CardHeader>
			<CardContent class="space-y-3">
				<div class="text-2xl font-bold">{monitoringData.disk.percentage}%</div>
				<div class="w-full bg-muted rounded-full h-2">
					<div 
						class="h-2 rounded-full transition-all duration-300 {getProgressColor(monitoringData.disk.percentage)}"
						style="width: {monitoringData.disk.percentage}%"
					></div>
				</div>
				<div class="text-xs text-muted-foreground">
					<div class="flex justify-between">
						<span>Used:</span>
						<span>{monitoringData.disk.used} GB</span>
					</div>
					<div class="flex justify-between">
						<span>Total:</span>
						<span>{monitoringData.disk.total} GB</span>
					</div>
				</div>
			</CardContent>
		</Card>

		<!-- Network Activity -->
		<Card>
			<CardHeader class="pb-2">
				<div class="flex items-center justify-between">
					<CardTitle class="text-sm font-medium">Network Activity</CardTitle>
					<Wifi class="h-4 w-4 text-muted-foreground" />
				</div>
			</CardHeader>
			<CardContent class="space-y-3">
				<div class="space-y-2">
					<div class="flex justify-between text-sm">
						<span class="text-muted-foreground">Inbound:</span>
						<span class="font-medium">{monitoringData.network.inbound}</span>
					</div>
					<div class="flex justify-between text-sm">
						<span class="text-muted-foreground">Outbound:</span>
						<span class="font-medium">{monitoringData.network.outbound}</span>
					</div>
				</div>
				<div class="pt-2">
					<Badge variant="outline" class="text-xs">
						Status: Normal
					</Badge>
				</div>
			</CardContent>
		</Card>
	</div>

	<!-- Recent Alerts -->
	<Card>
		<CardHeader>
			<div class="flex items-center justify-between">
				<CardTitle class="flex items-center gap-2">
					<Activity class="h-5 w-5" />
					Recent Alerts
				</CardTitle>
				<Badge variant="outline">{monitoringData.alerts.length} alerts</Badge>
			</div>
		</CardHeader>
		<CardContent>
			<div class="space-y-3">
				{#each monitoringData.alerts as alert}
					{@const alertBadge = getAlertBadge(alert.type)}
					<div class="flex items-start gap-3 p-3 border rounded-lg {alert.resolved ? 'opacity-60' : ''}">
						<Badge variant={alertBadge.variant} class="text-xs">
							{alertBadge.text}
						</Badge>
						<div class="flex-1 space-y-1">
							<p class="text-sm {alert.resolved ? 'line-through' : ''}">{alert.message}</p>
							<p class="text-xs text-muted-foreground">
								{alert.timestamp.toLocaleString()}
								{#if alert.resolved}
									<span class="ml-2 text-green-600">• Resolved</span>
								{/if}
							</p>
						</div>
					</div>
				{/each}
			</div>
		</CardContent>
	</Card>
</div>