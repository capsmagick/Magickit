<script lang="ts">
	import { onMount } from 'svelte';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select';
	import { 
		Activity, 
		Database, 
		HardDrive, 
		Zap, 
		Clock, 
		TrendingUp,
		RefreshCw,
		Trash2,
		Globe
	} from '@lucide/svelte';

	interface PerformanceData {
		timeRange: string;
		performance: {
			averageResponseTime: number;
			p95ResponseTime: number;
			p99ResponseTime: number;
			cacheHitRate: number;
			totalRequests: number;
			errorRate: number;
			slowestEndpoints: Array<{
				endpoint: string;
				averageTime: number;
				requestCount: number;
			}>;
		};
		realTime: {
			activeRequests: number;
			averageResponseTime: number;
			requestsPerMinute: number;
			cacheHitRate: number;
		};
		database: {
			averageQueryTime: number;
			totalQueries: number;
			slowQueries: number;
			queriesPerRequest: number;
		};
		cache: {
			memory: {
				size: number;
				keys: string[];
				memoryUsage: number;
			};
			redis: {
				connected: boolean;
				keyCount: number;
				memoryUsage: number;
			} | null;
		};
		cdn: {
			cacheHitRate: number;
			bandwidthUsage: number;
			requestCount: number;
			topAssets: Array<{
				path: string;
				requests: number;
				bandwidth: number;
			}>;
		};
		timestamp: string;
	}

	let performanceData: PerformanceData | null = $state(null);
	let loading = $state(true);
	let error = $state('');
	let timeRange = $state('1h');
	let autoRefresh = $state(true);
	let refreshInterval: NodeJS.Timeout;

	onMount(() => {
		loadPerformanceData();
		
		if (autoRefresh) {
			refreshInterval = setInterval(loadPerformanceData, 30000); // Refresh every 30 seconds
		}

		return () => {
			if (refreshInterval) {
				clearInterval(refreshInterval);
			}
		};
	});

	async function loadPerformanceData() {
		try {
			loading = true;
			const response = await fetch(`/api/admin/performance?range=${timeRange}`);
			const result = await response.json();

			if (result.success) {
				performanceData = result.data;
				error = '';
			} else {
				error = result.error || 'Failed to load performance data';
			}
		} catch (err) {
			error = 'Network error loading performance data';
			console.error('Error loading performance data:', err);
		} finally {
			loading = false;
		}
	}

	async function performAction(action: string, params: any = {}) {
		try {
			const response = await fetch('/api/admin/performance', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action, ...params })
			});

			const result = await response.json();
			
			if (result.success) {
				// Refresh data after successful action
				await loadPerformanceData();
			} else {
				error = result.error || 'Action failed';
			}
		} catch (err) {
			error = 'Network error performing action';
			console.error('Error performing action:', err);
		}
	}

	function formatBytes(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	function formatNumber(num: number): string {
		return new Intl.NumberFormat().format(num);
	}

	function getStatusColor(value: number, thresholds: { good: number; warning: number }): string {
		if (value <= thresholds.good) return 'bg-green-500';
		if (value <= thresholds.warning) return 'bg-yellow-500';
		return 'bg-red-500';
	}

	$effect(() => {
		if (refreshInterval) {
			clearInterval(refreshInterval);
		}
		if (autoRefresh) {
			refreshInterval = setInterval(loadPerformanceData, 30000);
		}
		
		return () => {
			if (refreshInterval) {
				clearInterval(refreshInterval);
			}
		};
	});
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">Performance Monitoring</h1>
			<p class="text-muted-foreground">Monitor system performance, caching, and optimization metrics</p>
		</div>
		
		<div class="flex items-center gap-4">
			<Select bind:value={timeRange} onValueChange={loadPerformanceData}>
				<SelectTrigger class="w-32">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="1h">Last Hour</SelectItem>
					<SelectItem value="24h">Last 24h</SelectItem>
					<SelectItem value="7d">Last 7 days</SelectItem>
					<SelectItem value="30d">Last 30 days</SelectItem>
				</SelectContent>
			</Select>
			
			<Button 
				variant="outline" 
				size="sm" 
				onclick={loadPerformanceData}
				disabled={loading}
			>
				<RefreshCw class={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
				Refresh
			</Button>
		</div>
	</div>

	{#if error}
		<Card class="border-red-200 bg-red-50">
			<CardContent class="pt-6">
				<p class="text-red-600">{error}</p>
			</CardContent>
		</Card>
	{/if}

	{#if performanceData}
		<!-- Real-time Metrics -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			<Card>
				<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle class="text-sm font-medium">Active Requests</CardTitle>
					<Activity class="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div class="text-2xl font-bold">{performanceData.realTime.activeRequests}</div>
					<p class="text-xs text-muted-foreground">Currently processing</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle class="text-sm font-medium">Avg Response Time</CardTitle>
					<Clock class="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div class="text-2xl font-bold">{performanceData.realTime.averageResponseTime}ms</div>
					<div class="flex items-center mt-1">
						<div 
							class="w-2 h-2 rounded-full mr-2 {getStatusColor(performanceData.realTime.averageResponseTime, { good: 100, warning: 500 })}"
						></div>
						<p class="text-xs text-muted-foreground">Real-time average</p>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle class="text-sm font-medium">Requests/Min</CardTitle>
					<TrendingUp class="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div class="text-2xl font-bold">{performanceData.realTime.requestsPerMinute}</div>
					<p class="text-xs text-muted-foreground">Current load</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle class="text-sm font-medium">Cache Hit Rate</CardTitle>
					<Zap class="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div class="text-2xl font-bold">{performanceData.realTime.cacheHitRate.toFixed(1)}%</div>
					<div class="flex items-center mt-1">
						<div 
							class="w-2 h-2 rounded-full mr-2 {getStatusColor(100 - performanceData.realTime.cacheHitRate, { good: 20, warning: 50 })}"
						></div>
						<p class="text-xs text-muted-foreground">Cache efficiency</p>
					</div>
				</CardContent>
			</Card>
		</div>

		<Tabs value="overview" class="space-y-4">
			<TabsList>
				<TabsTrigger value="overview">Overview</TabsTrigger>
				<TabsTrigger value="database">Database</TabsTrigger>
				<TabsTrigger value="cache">Cache</TabsTrigger>
				<TabsTrigger value="cdn">CDN</TabsTrigger>
				<TabsTrigger value="actions">Actions</TabsTrigger>
			</TabsList>

			<TabsContent value="overview" class="space-y-4">
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<!-- Performance Overview -->
					<Card>
						<CardHeader>
							<CardTitle>Performance Overview ({timeRange})</CardTitle>
						</CardHeader>
						<CardContent class="space-y-4">
							<div class="flex justify-between items-center">
								<span class="text-sm">Average Response Time</span>
								<Badge variant="outline">{performanceData.performance.averageResponseTime}ms</Badge>
							</div>
							<div class="flex justify-between items-center">
								<span class="text-sm">95th Percentile</span>
								<Badge variant="outline">{performanceData.performance.p95ResponseTime}ms</Badge>
							</div>
							<div class="flex justify-between items-center">
								<span class="text-sm">99th Percentile</span>
								<Badge variant="outline">{performanceData.performance.p99ResponseTime}ms</Badge>
							</div>
							<div class="flex justify-between items-center">
								<span class="text-sm">Total Requests</span>
								<Badge variant="outline">{formatNumber(performanceData.performance.totalRequests)}</Badge>
							</div>
							<div class="flex justify-between items-center">
								<span class="text-sm">Error Rate</span>
								<Badge variant={performanceData.performance.errorRate > 5 ? 'destructive' : 'outline'}>
									{performanceData.performance.errorRate.toFixed(2)}%
								</Badge>
							</div>
						</CardContent>
					</Card>

					<!-- Slowest Endpoints -->
					<Card>
						<CardHeader>
							<CardTitle>Slowest Endpoints</CardTitle>
						</CardHeader>
						<CardContent>
							<div class="space-y-3">
								{#each performanceData.performance.slowestEndpoints.slice(0, 5) as endpoint}
									<div class="flex justify-between items-center">
										<div class="flex-1 min-w-0">
											<p class="text-sm font-medium truncate">{endpoint.endpoint}</p>
											<p class="text-xs text-muted-foreground">{formatNumber(endpoint.requestCount)} requests</p>
										</div>
										<Badge variant="outline">{endpoint.averageTime.toFixed(0)}ms</Badge>
									</div>
								{/each}
							</div>
						</CardContent>
					</Card>
				</div>
			</TabsContent>

			<TabsContent value="database" class="space-y-4">
				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2">
							<Database class="h-5 w-5" />
							Database Performance
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
							<div class="text-center">
								<div class="text-2xl font-bold">{performanceData.database.averageQueryTime}ms</div>
								<p class="text-sm text-muted-foreground">Avg Query Time</p>
							</div>
							<div class="text-center">
								<div class="text-2xl font-bold">{formatNumber(performanceData.database.totalQueries)}</div>
								<p class="text-sm text-muted-foreground">Total Queries</p>
							</div>
							<div class="text-center">
								<div class="text-2xl font-bold text-red-600">{performanceData.database.slowQueries}</div>
								<p class="text-sm text-muted-foreground">Slow Queries</p>
							</div>
							<div class="text-center">
								<div class="text-2xl font-bold">{performanceData.database.queriesPerRequest.toFixed(1)}</div>
								<p class="text-sm text-muted-foreground">Queries/Request</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</TabsContent>

			<TabsContent value="cache" class="space-y-4">
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<!-- Memory Cache -->
					<Card>
						<CardHeader>
							<CardTitle class="flex items-center gap-2">
								<HardDrive class="h-5 w-5" />
								Memory Cache
							</CardTitle>
						</CardHeader>
						<CardContent class="space-y-4">
							<div class="flex justify-between items-center">
								<span class="text-sm">Cache Entries</span>
								<Badge variant="outline">{formatNumber(performanceData.cache.memory.size)}</Badge>
							</div>
							<div class="flex justify-between items-center">
								<span class="text-sm">Memory Usage</span>
								<Badge variant="outline">{formatBytes(performanceData.cache.memory.memoryUsage)}</Badge>
							</div>
						</CardContent>
					</Card>

					<!-- Redis Cache -->
					<Card>
						<CardHeader>
							<CardTitle class="flex items-center gap-2">
								<Zap class="h-5 w-5" />
								Redis Cache
							</CardTitle>
						</CardHeader>
						<CardContent class="space-y-4">
							{#if performanceData.cache.redis}
								<div class="flex justify-between items-center">
									<span class="text-sm">Status</span>
									<Badge variant={performanceData.cache.redis.connected ? 'default' : 'destructive'}>
										{performanceData.cache.redis.connected ? 'Connected' : 'Disconnected'}
									</Badge>
								</div>
								<div class="flex justify-between items-center">
									<span class="text-sm">Key Count</span>
									<Badge variant="outline">{formatNumber(performanceData.cache.redis.keyCount)}</Badge>
								</div>
								<div class="flex justify-between items-center">
									<span class="text-sm">Memory Usage</span>
									<Badge variant="outline">{formatBytes(performanceData.cache.redis.memoryUsage)}</Badge>
								</div>
							{:else}
								<p class="text-sm text-muted-foreground">Redis not configured</p>
							{/if}
						</CardContent>
					</Card>
				</div>
			</TabsContent>

			<TabsContent value="cdn" class="space-y-4">
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<!-- CDN Overview -->
					<Card>
						<CardHeader>
							<CardTitle class="flex items-center gap-2">
								<Globe class="h-5 w-5" />
								CDN Performance
							</CardTitle>
						</CardHeader>
						<CardContent class="space-y-4">
							<div class="flex justify-between items-center">
								<span class="text-sm">Cache Hit Rate</span>
								<Badge variant="outline">{performanceData.cdn.cacheHitRate.toFixed(1)}%</Badge>
							</div>
							<div class="flex justify-between items-center">
								<span class="text-sm">Bandwidth Usage</span>
								<Badge variant="outline">{formatBytes(performanceData.cdn.bandwidthUsage)}</Badge>
							</div>
							<div class="flex justify-between items-center">
								<span class="text-sm">Request Count</span>
								<Badge variant="outline">{formatNumber(performanceData.cdn.requestCount)}</Badge>
							</div>
						</CardContent>
					</Card>

					<!-- Top Assets -->
					<Card>
						<CardHeader>
							<CardTitle>Top Assets</CardTitle>
						</CardHeader>
						<CardContent>
							<div class="space-y-3">
								{#each performanceData.cdn.topAssets as asset}
									<div class="flex justify-between items-center">
										<div class="flex-1 min-w-0">
											<p class="text-sm font-medium truncate">{asset.path}</p>
											<p class="text-xs text-muted-foreground">
												{formatNumber(asset.requests)} requests • {formatBytes(asset.bandwidth)}
											</p>
										</div>
									</div>
								{/each}
							</div>
						</CardContent>
					</Card>
				</div>
			</TabsContent>

			<TabsContent value="actions" class="space-y-4">
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<!-- Cache Actions -->
					<Card>
						<CardHeader>
							<CardTitle>Cache Management</CardTitle>
						</CardHeader>
						<CardContent class="space-y-3">
							<Button 
								variant="outline" 
								class="w-full justify-start"
								onclick={() => performAction('clear-cache')}
							>
								<Trash2 class="h-4 w-4 mr-2" />
								Clear All Cache
							</Button>
							<Button 
								variant="outline" 
								class="w-full justify-start"
								onclick={() => performAction('clear-cache-pattern', { pattern: 'content:*' })}
							>
								<Trash2 class="h-4 w-4 mr-2" />
								Clear Content Cache
							</Button>
							<Button 
								variant="outline" 
								class="w-full justify-start"
								onclick={() => performAction('clear-cache-pattern', { pattern: 'media:*' })}
							>
								<Trash2 class="h-4 w-4 mr-2" />
								Clear Media Cache
							</Button>
						</CardContent>
					</Card>

					<!-- CDN Actions -->
					<Card>
						<CardHeader>
							<CardTitle>CDN Management</CardTitle>
						</CardHeader>
						<CardContent class="space-y-3">
							<Button 
								variant="outline" 
								class="w-full justify-start"
								onclick={() => performAction('invalidate-cdn', { paths: ['/*'] })}
							>
								<RefreshCw class="h-4 w-4 mr-2" />
								Purge All CDN Cache
							</Button>
							<Button 
								variant="outline" 
								class="w-full justify-start"
								onclick={() => performAction('cleanup-metrics', { daysToKeep: 30 })}
							>
								<Trash2 class="h-4 w-4 mr-2" />
								Cleanup Old Metrics
							</Button>
						</CardContent>
					</Card>
				</div>
			</TabsContent>
		</Tabs>
	{:else if loading}
		<div class="flex items-center justify-center py-12">
			<RefreshCw class="h-8 w-8 animate-spin text-muted-foreground" />
		</div>
	{/if}
</div>