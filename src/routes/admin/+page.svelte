<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Badge from '$lib/components/ui/badge/index.js';
	import { authClient } from '$lib/auth/auth-client';
	import { goto } from '$app/navigation';
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
		Loader2
	} from '@lucide/svelte';

	let hasCheckedAuth = $state(false);
	let isLoading = $state(true);
	const session = authClient.useSession();

	// Reactive statement to check session and redirect if needed
	$effect(() => {
		if (!hasCheckedAuth && $session.data) {
			hasCheckedAuth = true;
			if ($session.data.user.role !== 'admin') {
				goto('/login?returnTo=/admin');
				return;
			}
			// Simulate loading dashboard data
			setTimeout(() => {
				isLoading = false;
			}, 1000);
		}
	});

	// Mock dashboard metrics
	const metrics = [
		{ label: 'Total Users', value: '1,234', change: '+12%', trend: 'up', icon: Users },
		{ label: 'Active Sessions', value: '89', change: '+5%', trend: 'up', icon: Activity },
		{ label: 'System Health', value: '99.9%', change: '0%', trend: 'stable', icon: CheckCircle },
		{ label: 'Security Alerts', value: '3', change: '-2', trend: 'down', icon: Shield }
	];

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

	const systemStatus = [
		{ label: 'System Status', value: 'Active', status: 'success', icon: CheckCircle },
		{ label: 'Database', value: 'Online', status: 'success', icon: Database },
		{ label: 'Authentication', value: 'Secure', status: 'success', icon: Shield }
	];
</script>

<div class="container mx-auto px-4 py-6">
	<div class="space-y-6">
		<!-- Header -->
		<div class="space-y-2">
			<h1 class="text-2xl font-bold">Admin Dashboard</h1>
			<p class="text-muted-foreground text-sm">
				Welcome back, {$session.data?.user?.name || 'Admin'}. Manage your system from here.
			</p>
		</div>

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
									<div class="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
										<status.icon class="h-5 w-5 text-green-600 dark:text-green-400" />
									</div>
									<div class="space-y-1">
										<p class="text-sm font-medium">{status.label}</p>
										<p class="text-sm text-muted-foreground">{status.value}</p>
									</div>
								</div>
								<Badge variant="default" class="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
									Healthy
								</Badge>
							</div>
						{/each}
					</div>
				</Card.Content>
			</Card.Root>
		{/if}
	</div>
</div>
