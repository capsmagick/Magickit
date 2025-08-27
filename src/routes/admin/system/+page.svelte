<script lang="ts">
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { ActivityIcon, MonitorIcon, FileTextIcon, TrendingUpIcon, AlertTriangleIcon, CheckCircleIcon } from '@lucide/svelte';
</script>

<div class="container mx-auto p-6 space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">System Health</h1>
			<p class="text-muted-foreground">
				Monitor system performance, health status, and logs
			</p>
		</div>
		<Badge variant="outline" class="bg-green-50 text-green-700 border-green-200">
			<CheckCircleIcon class="w-3 h-3 mr-1" />
			System Healthy
		</Badge>
	</div>

	<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
		<Card class="hover:shadow-md transition-shadow">
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">System Status</CardTitle>
				<ActivityIcon class="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold text-green-600">Healthy</div>
				<p class="text-xs text-muted-foreground">
					All systems operational
				</p>
				<Button href="/admin/system/status" variant="outline" size="sm" class="mt-4 w-full">
					View Details
				</Button>
			</CardContent>
		</Card>

		<Card class="hover:shadow-md transition-shadow">
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Real-time Monitoring</CardTitle>
				<MonitorIcon class="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">98.5%</div>
				<p class="text-xs text-muted-foreground">
					System uptime
				</p>
				<Button href="/admin/system/monitoring" variant="outline" size="sm" class="mt-4 w-full">
					Live Monitoring
				</Button>
			</CardContent>
		</Card>

		<Card class="hover:shadow-md transition-shadow">
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">System Logs</CardTitle>
				<FileTextIcon class="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">1,247</div>
				<p class="text-xs text-muted-foreground">
					Log entries today
				</p>
				<Button href="/admin/system/logs" variant="outline" size="sm" class="mt-4 w-full">
					View Logs
				</Button>
			</CardContent>
		</Card>

		<Card class="hover:shadow-md transition-shadow">
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Performance</CardTitle>
				<TrendingUpIcon class="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">245ms</div>
				<p class="text-xs text-muted-foreground">
					Average response time
				</p>
				<Button href="/admin/system/performance" variant="outline" size="sm" class="mt-4 w-full">
					Performance Metrics
				</Button>
			</CardContent>
		</Card>
	</div>

	<div class="grid gap-6 md:grid-cols-2">
		<Card>
			<CardHeader>
				<CardTitle>System Alerts</CardTitle>
				<CardDescription>Recent system notifications and warnings</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="space-y-4">
					<div class="flex items-center space-x-4">
						<div class="w-2 h-2 bg-green-500 rounded-full"></div>
						<div class="flex-1">
							<p class="text-sm font-medium">Database backup completed</p>
							<p class="text-xs text-muted-foreground">2 hours ago</p>
						</div>
					</div>
					<div class="flex items-center space-x-4">
						<div class="w-2 h-2 bg-yellow-500 rounded-full"></div>
						<div class="flex-1">
							<p class="text-sm font-medium">High memory usage detected</p>
							<p class="text-xs text-muted-foreground">5 hours ago</p>
						</div>
					</div>
					<div class="flex items-center space-x-4">
						<div class="w-2 h-2 bg-blue-500 rounded-full"></div>
						<div class="flex-1">
							<p class="text-sm font-medium">System update available</p>
							<p class="text-xs text-muted-foreground">1 day ago</p>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle>Quick Actions</CardTitle>
				<CardDescription>Common system management tasks</CardDescription>
			</CardHeader>
			<CardContent class="space-y-2">
				<Button href="/admin/system/status" variant="outline" class="w-full justify-start">
					<ActivityIcon class="mr-2 h-4 w-4" />
					Check System Status
				</Button>
				<Button href="/admin/system/monitoring" variant="outline" class="w-full justify-start">
					<MonitorIcon class="mr-2 h-4 w-4" />
					View Live Metrics
				</Button>
				<Button href="/admin/system/logs" variant="outline" class="w-full justify-start">
					<FileTextIcon class="mr-2 h-4 w-4" />
					Browse System Logs
				</Button>
			</CardContent>
		</Card>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>System Overview</CardTitle>
			<CardDescription>Current system resource usage and performance metrics</CardDescription>
		</CardHeader>
		<CardContent>
			<div class="grid gap-4 md:grid-cols-3">
				<div class="space-y-2">
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium">CPU Usage</span>
						<span class="text-sm text-muted-foreground">23%</span>
					</div>
					<div class="w-full bg-gray-200 rounded-full h-2">
						<div class="bg-blue-600 h-2 rounded-full" style="width: 23%"></div>
					</div>
				</div>
				<div class="space-y-2">
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium">Memory Usage</span>
						<span class="text-sm text-muted-foreground">67%</span>
					</div>
					<div class="w-full bg-gray-200 rounded-full h-2">
						<div class="bg-yellow-600 h-2 rounded-full" style="width: 67%"></div>
					</div>
				</div>
				<div class="space-y-2">
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium">Disk Usage</span>
						<span class="text-sm text-muted-foreground">45%</span>
					</div>
					<div class="w-full bg-gray-200 rounded-full h-2">
						<div class="bg-green-600 h-2 rounded-full" style="width: 45%"></div>
					</div>
				</div>
			</div>
		</CardContent>
	</Card>
</div>