<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { authClient } from '$lib/auth/auth-client';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import {
		Users,
		Key,
		Bell,
		Lock,
		LifeBuoy,
		LayoutDashboard,
		UserPlus,
		Shield,
		Activity,
		Settings,
		TrendingUp,
		Database,
		CheckCircle,
		AlertTriangle,
		Loader2,
		RefreshCw
	} from '@lucide/svelte';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
	
	let isLoading = $state(false);
	let isRefreshing = $state(false);
	let realTimeMetrics = $state(data.quickStats);
	let lastUpdated = $state(new Date(data.loadedAt));
	let updateInterval: NodeJS.Timeout | null = null;

	// Real dashboard metrics from server data
	let metrics = $derived(realTimeMetrics.map(stat => ({
		label: stat.label,
		value: stat.value,
		change: stat.change,
		trend: stat.trend,
		icon: getIconComponent(stat.icon)
	})));

	function getIconComponent(iconName: string) {
		const iconMap: Record<string, any> = {
			Users,
			Activity,
			CheckCircle,
			Shield,
			Database
		};
		return iconMap[iconName] || Users;
	}

	const adminSections = [
		{
			title: 'User Management',
			description: 'Manage users, roles, and permissions',
			icon: Users,
			url: '/admin/users',
			color: 'bg-blue-500',
			features: ['Create users', 'Manage roles', 'Ban/unban users', 'View sessions']
		},
		{
			title: 'Access Control (RBAC)',
			description: 'Configure roles, permissions, and access policies',
			icon: Key,
			url: '/admin/access-control',
			color: 'bg-purple-500',
			features: ['Define roles', 'Set permissions', 'Assign access', 'Audit logs']
		},
		{
			title: 'Notifications',
			description: 'Manage system notifications and alerts',
			icon: Bell,
			url: '/admin/notifications',
			color: 'bg-orange-500',
			features: ['User notifications', 'System alerts', 'Email templates']
		},
		{
			title: 'Security',
			description: 'Monitor and configure security settings',
			icon: Lock,
			url: '/admin/security',
			color: 'bg-red-500',
			features: ['IP access control', 'Brute force protection', 'Audit trails']
		},
		{
			title: 'Support',
			description: 'Manage support tickets and knowledge base',
			icon: LifeBuoy,
			url: '/admin/support',
			color: 'bg-green-500',
			features: ['Support tickets', 'Knowledge base', 'Feedback system']
		}
	];

	const quickActions = [
		{
			title: 'Create User',
			description: 'Add a new user to the system',
			icon: UserPlus,
			action: () => goto('/admin/users?action=create')
		},
		{
			title: 'View Activity',
			description: 'Check recent system activity',
			icon: Activity,
			action: () => goto('/admin/users?tab=activity')
		},
		{
			title: 'Security Settings',
			description: 'Configure security policies',
			icon: Shield,
			action: () => goto('/admin/security')
		},
		{
			title: 'System Settings',
			description: 'Manage system configuration',
			icon: Settings,
			action: () => goto('/admin/settings')
		}
	];

	// Real system status from server data
	let systemStatus = $derived(data.systemStatusIndicators.map(indicator => ({
		label: indicator.label,
		value: indicator.value,
		status: indicator.status,
		icon: getIconComponent(indicator.icon)
	})));

	// Real-time update functions
	async function fetchRealTimeMetrics() {
		try {
			const response = await fetch('/api/admin/dashboard/metrics');
			if (response.ok) {
				const result = await response.json();
				if (result.success) {
					// Update metrics with real-time data
					lastUpdated = new Date(result.data.timestamp);
					// You could update specific metrics here based on real-time data
				}
			}
		} catch (error) {
			console.error('Error fetching real-time metrics:', error);
		}
	}

	async function refreshDashboard() {
		isRefreshing = true;
		try {
			const response = await fetch('/api/admin/dashboard/refresh', {
				method: 'POST'
			});
			
			if (response.ok) {
				const result = await response.json();
				if (result.success) {
					// Update the data with fresh information
					realTimeMetrics = result.data.quickStats;
					lastUpdated = new Date(result.data.loadedAt);
					
					// Update other data if needed
					data.dashboardMetrics = result.data.dashboardMetrics;
					data.systemStatusIndicators = result.data.systemStatusIndicators;
					data.userStatistics = result.data.userStatistics;
					data.systemStatus = result.data.systemStatus;
					
					toast.success('Dashboard data refreshed successfully');
				} else {
					toast.error('Failed to refresh dashboard data');
				}
			} else {
				toast.error('Failed to refresh dashboard data');
			}
		} catch (error) {
			console.error('Error refreshing dashboard:', error);
			toast.error('Error refreshing dashboard data');
		} finally {
			isRefreshing = false;
		}
	}

	// Start real-time updates
	onMount(() => {
		// Update metrics every 30 seconds
		updateInterval = setInterval(fetchRealTimeMetrics, 30000);
		
		return () => {
			if (updateInterval) {
				clearInterval(updateInterval);
			}
		};
	});
</script>

<div class="container mx-auto px-4 py-6">
	<div class="space-y-6">
		<!-- Header -->
		<div class="flex items-center justify-between">
			<div class="space-y-2">
				<h1 class="text-2xl font-bold">Admin Dashboard</h1>
				<p class="text-muted-foreground text-sm">
					Welcome back, {data.user?.name || 'Admin'}. Manage your system from here.
				</p>
			</div>
			<div class="flex items-center gap-4">
				<div class="text-sm text-muted-foreground">
					Last updated: {lastUpdated.toLocaleTimeString()}
				</div>
				<Button
					variant="outline"
					size="sm"
					onclick={refreshDashboard}
					disabled={isRefreshing}
					class="transition-colors duration-200"
				>
					{#if isRefreshing}
						<Loader2 class="h-4 w-4 animate-spin mr-2" />
						Refreshing...
					{:else}
						<RefreshCw class="h-4 w-4 mr-2" />
						Refresh
					{/if}
				</Button>
			</div>
		</div>

		{#if data.error}
			<!-- Error State -->
			<Card.Root class="border-destructive">
				<Card.Content class="p-6">
					<div class="flex items-center gap-3">
						<AlertTriangle class="h-5 w-5 text-destructive" />
						<div>
							<h3 class="font-semibold text-destructive">Error Loading Dashboard</h3>
							<p class="text-sm text-muted-foreground mt-1">
								{data.error}. Some data may be unavailable.
							</p>
						</div>
					</div>
				</Card.Content>
			</Card.Root>
		{/if}

		{#if isLoading}
			<!-- Loading State -->
			<div class="flex items-center justify-center py-12">
				<div class="text-center space-y-4">
					<Loader2 class="h-8 w-8 animate-spin mx-auto text-primary" />
					<p class="text-sm text-muted-foreground">Loading dashboard...</p>
				</div>
			</div>
		{:else}
			<!-- Dashboard Metrics -->
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				{#each metrics as metric}
					<Card.Root>
						<Card.Content class="p-4">
							<div class="flex items-center justify-between">
								<div class="space-y-1">
									<p class="text-sm text-muted-foreground">{metric.label}</p>
									<p class="text-2xl font-bold">{metric.value}</p>
									<div class="flex items-center gap-1">
										{#if metric.trend === 'up'}
											<TrendingUp class="h-3 w-3 text-green-600" />
											<span class="text-sm text-green-600">{metric.change}</span>
										{:else if metric.trend === 'down'}
											<TrendingUp class="h-3 w-3 text-red-600 rotate-180" />
											<span class="text-sm text-red-600">{metric.change}</span>
										{:else}
											<span class="text-sm text-muted-foreground">{metric.change}</span>
										{/if}
									</div>
								</div>
								<div class="p-2 rounded-lg bg-primary/10">
									<metric.icon class="h-5 w-5 text-primary" />
								</div>
							</div>
						</Card.Content>
					</Card.Root>
				{/each}
			</div>

			<!-- Quick Actions -->
			<Card.Root>
				<Card.Header class="space-y-2">
					<Card.Title class="text-lg flex items-center gap-2">
						<LayoutDashboard class="h-5 w-5" />
						Quick Actions
					</Card.Title>
					<Card.Description class="text-sm">
						Common administrative tasks
					</Card.Description>
				</Card.Header>
				<Card.Content class="p-4">
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						{#each quickActions as action}
							<Button
								variant="outline"
								class="h-auto flex-col items-center gap-3 p-4 text-center transition-colors duration-200 hover:bg-muted/50"
								onclick={action.action}
							>
								<action.icon class="h-8 w-8 text-primary" />
								<div class="space-y-1">
									<div class="font-semibold text-sm">{action.title}</div>
									<div class="text-xs text-muted-foreground">{action.description}</div>
								</div>
							</Button>
						{/each}
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Admin Sections -->
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{#each adminSections as section}
					<Card.Root
						class="cursor-pointer transition-shadow duration-200 hover:shadow-md"
						onclick={() => goto(section.url)}
					>
						<Card.Header class="space-y-2">
							<div class="flex items-center gap-3">
								<div class="rounded-lg p-2 {section.color} text-white">
									<section.icon class="h-6 w-6" />
								</div>
								<div class="space-y-1">
									<Card.Title class="text-lg">{section.title}</Card.Title>
									<Card.Description class="text-sm">{section.description}</Card.Description>
								</div>
							</div>
						</Card.Header>
						<Card.Content class="p-4">
							<ul class="space-y-2 mb-4">
								{#each section.features as feature}
									<li class="flex items-center gap-2 text-sm text-muted-foreground">
										<div class="h-1.5 w-1.5 rounded-full bg-primary"></div>
										{feature}
									</li>
								{/each}
							</ul>
							<Button variant="outline" class="w-full transition-colors duration-200">
								Manage {section.title}
							</Button>
						</Card.Content>
					</Card.Root>
				{/each}
			</div>

			<!-- System Status -->
			<Card.Root>
				<Card.Header class="space-y-2">
					<Card.Title class="text-lg">System Status</Card.Title>
					<Card.Description class="text-sm">
						Current system health and metrics
					</Card.Description>
				</Card.Header>
				<Card.Content class="p-4">
					<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
						{#each systemStatus as status}
							<div class="flex items-center justify-between p-4 rounded-lg border">
								<div class="flex items-center gap-3">
									<div class="p-2 rounded-lg {status.status === 'success' ? 'bg-green-100 dark:bg-green-900/20' : status.status === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/20' : 'bg-red-100 dark:bg-red-900/20'}">
										<status.icon class="h-5 w-5 {status.status === 'success' ? 'text-green-600 dark:text-green-400' : status.status === 'warning' ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}" />
									</div>
									<div class="space-y-1">
										<p class="text-sm font-medium">{status.label}</p>
										<p class="text-sm text-muted-foreground">{status.value}</p>
									</div>
								</div>
								<Badge 
									variant={status.status === 'success' ? 'default' : status.status === 'warning' ? 'secondary' : 'destructive'}
									class={status.status === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : status.status === 'warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'}
								>
									{status.status === 'success' ? 'Healthy' : status.status === 'warning' ? 'Warning' : 'Critical'}
								</Badge>
							</div>
						{/each}
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Additional System Information -->
			{#if data.systemStatus.alerts.length > 0}
				<Card.Root class="border-destructive">
					<Card.Header class="space-y-2">
						<Card.Title class="text-lg flex items-center gap-2">
							<AlertTriangle class="h-5 w-5 text-destructive" />
							Active System Alerts
						</Card.Title>
						<Card.Description class="text-sm">
							{data.systemStatus.alerts.length} alert{data.systemStatus.alerts.length !== 1 ? 's' : ''} require attention
						</Card.Description>
					</Card.Header>
					<Card.Content class="p-4">
						<div class="space-y-3">
							{#each data.systemStatus.alerts.slice(0, 5) as alert}
								<div class="flex items-center justify-between p-3 rounded-lg border border-destructive/20 bg-destructive/5">
									<div class="space-y-1">
										<p class="text-sm font-medium">{alert.title || alert.message}</p>
										<p class="text-xs text-muted-foreground">
											{alert.category} • {new Date(alert.createdAt).toLocaleString()}
										</p>
									</div>
									<Badge variant="destructive" class="text-xs">
										{alert.type}
									</Badge>
								</div>
							{/each}
							{#if data.systemStatus.alerts.length > 5}
								<div class="text-center pt-2">
									<Button variant="outline" size="sm" onclick={() => goto('/admin/system/status')}>
										View All {data.systemStatus.alerts.length} Alerts
									</Button>
								</div>
							{/if}
						</div>
					</Card.Content>
				</Card.Root>
			{/if}
		{/if}
	</div>
</div>
