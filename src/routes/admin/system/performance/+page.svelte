<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import * as Select from '$lib/components/ui/select';
	import { Badge } from '$lib/components/ui/badge';
	import { TrendingUp, TrendingDown, Clock, Zap, Database, Server, RefreshCw } from '@lucide/svelte';

	let timeRange = $state('24h');
	let isRefreshing = $state(false);

	let performanceData = $state({
		responseTime: {
			current: 18,
			average: 22,
			trend: 'down',
			change: -15
		},
		throughput: {
			current: 1250,
			average: 1180,
			trend: 'up',
			change: 6
		},
		errorRate: {
			current: 0.02,
			average: 0.05,
			trend: 'down',
			change: -60
		},
		uptime: {
			current: 99.97,
			average: 99.85,
			trend: 'up',
			change: 0.12
		},
		endpoints: [
			{
				path: '/api/users',
				avgResponseTime: 12,
				requestCount: 15420,
				errorRate: 0.01,
				status: 'healthy'
			},
			{
				path: '/api/content',
				avgResponseTime: 25,
				requestCount: 8930,
				errorRate: 0.03,
				status: 'healthy'
			},
			{
				path: '/api/media',
				avgResponseTime: 45,
				requestCount: 3250,
				errorRate: 0.08,
				status: 'warning'
			},
			{
				path: '/api/auth',
				avgResponseTime: 8,
				requestCount: 22100,
				errorRate: 0.00,
				status: 'healthy'
			}
		],
		slowQueries: [
			{
				query: 'SELECT * FROM users WHERE created_at > ?',
				avgTime: 1250,
				executions: 45,
				impact: 'high'
			},
			{
				query: 'SELECT * FROM content WHERE status = ? ORDER BY date',
				avgTime: 890,
				executions: 123,
				impact: 'medium'
			},
			{
				query: 'SELECT COUNT(*) FROM logs WHERE level = ?',
				avgTime: 650,
				executions: 78,
				impact: 'low'
			}
		]
	});

	function getTrendIcon(trend: string) {
		return trend === 'up' ? TrendingUp : TrendingDown;
	}

	function getTrendColor(trend: string, isPositive: boolean = true) {
		const isGood = isPositive ? trend === 'up' : trend === 'down';
		return isGood ? 'text-green-500' : 'text-red-500';
	}

	function getStatusBadge(status: string) {
		switch (status) {
			case 'healthy':
				return { variant: 'default' as const, text: 'Healthy' };
			case 'warning':
				return { variant: 'secondary' as const, text: 'Warning' };
			case 'critical':
				return { variant: 'destructive' as const, text: 'Critical' };
			default:
				return { variant: 'outline' as const, text: status };
		}
	}

	function getImpactBadge(impact: string) {
		switch (impact) {
			case 'high':
				return { variant: 'destructive' as const, text: 'High Impact' };
			case 'medium':
				return { variant: 'secondary' as const, text: 'Medium Impact' };
			case 'low':
				return { variant: 'outline' as const, text: 'Low Impact' };
			default:
				return { variant: 'outline' as const, text: impact };
		}
	}

	async function handleRefresh() {
		isRefreshing = true;
		// Simulate API call
		await new Promise(resolve => setTimeout(resolve, 1000));
		isRefreshing = false;
	}


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
	<title>Performance Metrics | System Health | Admin</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
		<div class="space-y-2">
			<h1 class="text-2xl font-bold">Performance Metrics</h1>
			<p class="text-muted-foreground">Monitor system performance and identify bottlenecks</p>
		</div>
		<div class="flex items-center gap-2">
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
			<Button onclick={handleRefresh} disabled={isRefreshing} class="transition-colors duration-200">
				<RefreshCw class="mr-2 h-4 w-4 {isRefreshing ? 'animate-spin' : ''}" />
				Refresh
			</Button>
		</div>
	</div>

	<!-- Key Performance Metrics -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
		<!-- Response Time -->
		<Card>
			<CardHeader class="pb-2">
				<div class="flex items-center justify-between">
					<CardTitle class="text-sm font-medium">Avg Response Time</CardTitle>
					<Clock class="h-4 w-4 text-muted-foreground" />
				</div>
			</CardHeader>
			<CardContent class="space-y-2">
				<div class="text-2xl font-bold">{performanceData.responseTime.current}ms</div>
				{#if performanceData.responseTime.trend}
					{@const TrendIcon = getTrendIcon(performanceData.responseTime.trend)}
					<div class="flex items-center gap-1 text-sm">
						<TrendIcon class="h-4 w-4 {getTrendColor(performanceData.responseTime.trend, false)}" />
						<span class="{getTrendColor(performanceData.responseTime.trend, false)}">
							{Math.abs(performanceData.responseTime.change)}%
						</span>
						<span class="text-muted-foreground">vs avg</span>
					</div>
				{/if}
			</CardContent>
		</Card>

		<!-- Throughput -->
		<Card>
			<CardHeader class="pb-2">
				<div class="flex items-center justify-between">
					<CardTitle class="text-sm font-medium">Throughput</CardTitle>
					<Zap class="h-4 w-4 text-muted-foreground" />
				</div>
			</CardHeader>
			<CardContent class="space-y-2">
				<div class="text-2xl font-bold">{performanceData.throughput.current}</div>
				{#if performanceData.throughput.trend}
					{@const TrendIcon = getTrendIcon(performanceData.throughput.trend)}
					<div class="flex items-center gap-1 text-sm">
						<TrendIcon class="h-4 w-4 {getTrendColor(performanceData.throughput.trend)}" />
						<span class="{getTrendColor(performanceData.throughput.trend)}">
							+{performanceData.throughput.change}%
						</span>
						<span class="text-muted-foreground">req/min</span>
					</div>
				{/if}
			</CardContent>
		</Card>

		<!-- Error Rate -->
		<Card>
			<CardHeader class="pb-2">
				<div class="flex items-center justify-between">
					<CardTitle class="text-sm font-medium">Error Rate</CardTitle>
					<Server class="h-4 w-4 text-muted-foreground" />
				</div>
			</CardHeader>
			<CardContent class="space-y-2">
				<div class="text-2xl font-bold">{performanceData.errorRate.current}%</div>
				{#if performanceData.errorRate.trend}
					{@const TrendIcon = getTrendIcon(performanceData.errorRate.trend)}
					<div class="flex items-center gap-1 text-sm">
						<TrendIcon class="h-4 w-4 {getTrendColor(performanceData.errorRate.trend, false)}" />
						<span class="{getTrendColor(performanceData.errorRate.trend, false)}">
							{performanceData.errorRate.change}%
						</span>
						<span class="text-muted-foreground">vs avg</span>
					</div>
				{/if}
			</CardContent>
		</Card>

		<!-- Uptime -->
		<Card>
			<CardHeader class="pb-2">
				<div class="flex items-center justify-between">
					<CardTitle class="text-sm font-medium">Uptime</CardTitle>
					<Database class="h-4 w-4 text-muted-foreground" />
				</div>
			</CardHeader>
			<CardContent class="space-y-2">
				<div class="text-2xl font-bold">{performanceData.uptime.current}%</div>
				{#if performanceData.uptime.trend}
					{@const TrendIcon = getTrendIcon(performanceData.uptime.trend)}
					<div class="flex items-center gap-1 text-sm">
						<TrendIcon class="h-4 w-4 {getTrendColor(performanceData.uptime.trend)}" />
						<span class="{getTrendColor(performanceData.uptime.trend)}">
							+{performanceData.uptime.change}%
						</span>
						<span class="text-muted-foreground">vs avg</span>
					</div>
				{/if}
			</CardContent>
		</Card>
	</div>

	<!-- API Endpoint Performance -->
	<Card>
		<CardHeader>
			<CardTitle>API Endpoint Performance</CardTitle>
		</CardHeader>
		<CardContent class="p-0">
			<div class="space-y-1">
				{#each performanceData.endpoints as endpoint}
					{@const statusBadge = getStatusBadge(endpoint.status)}
					<div class="p-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors duration-200">
						<div class="flex items-center justify-between">
							<div class="space-y-1">
								<h4 class="font-medium text-sm">{endpoint.path}</h4>
								<div class="flex items-center gap-4 text-xs text-muted-foreground">
									<span>{endpoint.requestCount.toLocaleString()} requests</span>
									<span>{endpoint.avgResponseTime}ms avg</span>
									<span>{endpoint.errorRate}% errors</span>
								</div>
							</div>
							<Badge variant={statusBadge.variant} class="text-xs">
								{statusBadge.text}
							</Badge>
						</div>
					</div>
				{/each}
			</div>
		</CardContent>
	</Card>

	<!-- Slow Database Queries -->
	<Card>
		<CardHeader>
			<CardTitle class="flex items-center gap-2">
				<Database class="h-5 w-5" />
				Slow Database Queries
			</CardTitle>
		</CardHeader>
		<CardContent class="p-0">
			<div class="space-y-1">
				{#each performanceData.slowQueries as query}
					{@const impactBadge = getImpactBadge(query.impact)}
					<div class="p-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors duration-200">
						<div class="space-y-2">
							<div class="flex items-start justify-between gap-4">
								<div class="flex-1 min-w-0">
									<code class="text-sm bg-muted px-2 py-1 rounded font-mono break-all">
										{query.query}
									</code>
								</div>
								<Badge variant={impactBadge.variant} class="text-xs flex-shrink-0">
									{impactBadge.text}
								</Badge>
							</div>
							<div class="flex items-center gap-4 text-xs text-muted-foreground">
								<span>Avg Time: {query.avgTime}ms</span>
								<span>Executions: {query.executions}</span>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</CardContent>
	</Card>
</div>