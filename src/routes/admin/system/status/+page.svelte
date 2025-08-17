<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { CheckCircle, AlertTriangle, XCircle, RefreshCw, Database, Server, Wifi, HardDrive } from '@lucide/svelte';

	let isRefreshing = $state(false);

	let systemStatus = $state({
		overall: 'healthy',
		lastUpdated: new Date(),
		services: [
			{
				name: 'Database',
				status: 'healthy',
				responseTime: '12ms',
				uptime: '99.9%',
				icon: Database
			},
			{
				name: 'Web Server',
				status: 'healthy',
				responseTime: '8ms',
				uptime: '99.8%',
				icon: Server
			},
			{
				name: 'API Gateway',
				status: 'warning',
				responseTime: '45ms',
				uptime: '98.5%',
				icon: Wifi
			},
			{
				name: 'File Storage',
				status: 'healthy',
				responseTime: '15ms',
				uptime: '99.7%',
				icon: HardDrive
			}
		],
		metrics: {
			totalRequests: '1,234,567',
			errorRate: '0.02%',
			avgResponseTime: '18ms',
			activeUsers: '1,456'
		}
	});

	function getStatusBadge(status: string) {
		switch (status) {
			case 'healthy':
				return { variant: 'default' as const, text: 'Healthy', icon: CheckCircle, color: 'text-green-500' };
			case 'warning':
				return { variant: 'secondary' as const, text: 'Warning', icon: AlertTriangle, color: 'text-yellow-500' };
			case 'critical':
				return { variant: 'destructive' as const, text: 'Critical', icon: XCircle, color: 'text-red-500' };
			default:
				return { variant: 'outline' as const, text: status, icon: AlertTriangle, color: 'text-gray-500' };
		}
	}

	function getOverallStatusBadge(status: string) {
		switch (status) {
			case 'healthy':
				return { variant: 'default' as const, text: 'All Systems Operational', color: 'text-green-500' };
			case 'warning':
				return { variant: 'secondary' as const, text: 'Some Issues Detected', color: 'text-yellow-500' };
			case 'critical':
				return { variant: 'destructive' as const, text: 'System Issues', color: 'text-red-500' };
			default:
				return { variant: 'outline' as const, text: 'Unknown Status', color: 'text-gray-500' };
		}
	}

	async function handleRefresh() {
		isRefreshing = true;
		// Simulate API call
		await new Promise(resolve => setTimeout(resolve, 1000));
		systemStatus.lastUpdated = new Date();
		isRefreshing = false;
	}
</script>

<svelte:head>
	<title>System Status | System Health | Admin</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
		<div class="space-y-2">
			<h1 class="text-2xl font-bold">System Status</h1>
			<p class="text-muted-foreground">Monitor overall system health and service status</p>
		</div>
		<Button onclick={handleRefresh} disabled={isRefreshing} class="transition-colors duration-200">
			<RefreshCw class="mr-2 h-4 w-4 {isRefreshing ? 'animate-spin' : ''}" />
			{isRefreshing ? 'Refreshing...' : 'Refresh Status'}
		</Button>
	</div>

	<!-- Overall Status -->
	<Card>
		<CardContent class="p-6">
			<div class="flex items-center justify-between">
				<div class="space-y-2">
					<h2 class="text-xl font-semibold">Overall System Status</h2>
					<p class="text-sm text-muted-foreground">
						Last updated: {systemStatus.lastUpdated.toLocaleString()}
					</p>
				</div>
				<div class="text-right">
					{#if systemStatus.overall}
						{@const overallStatus = getOverallStatusBadge(systemStatus.overall)}
						<Badge variant={overallStatus.variant} class="text-sm">
							{overallStatus.text}
						</Badge>
					{/if}
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- Service Status Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
		{#each systemStatus.services as service}
			{@const statusInfo = getStatusBadge(service.status)}
			<Card>
				<CardContent class="p-4">
					<div class="space-y-3">
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2">
								<service.icon class="h-5 w-5 text-muted-foreground" />
								<h3 class="font-medium">{service.name}</h3>
							</div>
							<statusInfo.icon class="h-4 w-4 {statusInfo.color}" />
						</div>
						<div class="space-y-2">
							<Badge variant={statusInfo.variant} class="text-xs">
								{statusInfo.text}
							</Badge>
							<div class="space-y-1 text-sm text-muted-foreground">
								<div class="flex justify-between">
									<span>Response:</span>
									<span>{service.responseTime}</span>
								</div>
								<div class="flex justify-between">
									<span>Uptime:</span>
									<span>{service.uptime}</span>
								</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		{/each}
	</div>

	<!-- System Metrics -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
		<Card>
			<CardHeader class="pb-2">
				<CardTitle class="text-sm font-medium text-muted-foreground">Total Requests</CardTitle>
			</CardHeader>
			<CardContent class="pt-0">
				<div class="text-2xl font-bold">{systemStatus.metrics.totalRequests}</div>
				<p class="text-xs text-muted-foreground">Last 24 hours</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="pb-2">
				<CardTitle class="text-sm font-medium text-muted-foreground">Error Rate</CardTitle>
			</CardHeader>
			<CardContent class="pt-0">
				<div class="text-2xl font-bold text-green-600">{systemStatus.metrics.errorRate}</div>
				<p class="text-xs text-muted-foreground">Last 24 hours</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="pb-2">
				<CardTitle class="text-sm font-medium text-muted-foreground">Avg Response Time</CardTitle>
			</CardHeader>
			<CardContent class="pt-0">
				<div class="text-2xl font-bold">{systemStatus.metrics.avgResponseTime}</div>
				<p class="text-xs text-muted-foreground">Last 24 hours</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="pb-2">
				<CardTitle class="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
			</CardHeader>
			<CardContent class="pt-0">
				<div class="text-2xl font-bold">{systemStatus.metrics.activeUsers}</div>
				<p class="text-xs text-muted-foreground">Currently online</p>
			</CardContent>
		</Card>
	</div>
</div>