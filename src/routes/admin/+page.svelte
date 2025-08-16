<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
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
		Settings
	} from '@lucide/svelte';

	let hasCheckedAuth = false;
	const session = authClient.useSession();

	// Reactive statement to check session and redirect if needed
	$effect(() => {
		if (!hasCheckedAuth && $session.data) {
			hasCheckedAuth = true;
			if ($session.data.user.role !== 'admin') {
				goto('/login?returnTo=/admin');
				return;
			}
		}
	});

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
</script>

<div class="container mx-auto space-y-6 p-6">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
		<p class="mt-2 text-gray-600 dark:text-gray-400">
			Welcome back, {$session.data?.user?.name || 'Admin'}. Manage your system from here.
		</p>
	</div>

	<!-- Quick Actions -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2 text-xl">
				<LayoutDashboard class="h-5 w-5" />
				Quick Actions
			</Card.Title>
			<Card.Description>Common administrative tasks</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
				{#each quickActions as action}
					<Button
						variant="outline"
						class="flex h-auto flex-col items-center gap-3 p-4 text-center"
						onclick={action.action}
					>
						<action.icon class="h-8 w-8 text-primary" />
						<div>
							<div class="font-semibold">{action.title}</div>
							<div class="text-xs text-muted-foreground">{action.description}</div>
						</div>
					</Button>
				{/each}
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Admin Sections -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
		{#each adminSections as section}
			<Card.Root
				class="cursor-pointer transition-shadow hover:shadow-lg"
				onclick={() => goto(section.url)}
			>
				<Card.Header>
					<div class="flex items-center gap-3">
						<div class="rounded-lg p-2 {section.color} text-white">
							<section.icon class="h-6 w-6" />
						</div>
						<div>
							<Card.Title class="text-lg">{section.title}</Card.Title>
							<Card.Description>{section.description}</Card.Description>
						</div>
					</div>
				</Card.Header>
				<Card.Content>
					<ul class="space-y-1">
						{#each section.features as feature}
							<li class="flex items-center gap-2 text-sm text-muted-foreground">
								<div class="h-1.5 w-1.5 rounded-full bg-primary"></div>
								{feature}
							</li>
						{/each}
					</ul>
					<Button variant="outline" class="mt-4 w-full">
						Manage {section.title}
					</Button>
				</Card.Content>
			</Card.Root>
		{/each}
	</div>

	<!-- System Status -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="text-xl">System Status</Card.Title>
			<Card.Description>Current system health and metrics</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
				<div class="rounded-lg bg-green-50 p-4 text-center dark:bg-green-900/20">
					<div class="text-2xl font-bold text-green-600 dark:text-green-400">Active</div>
					<div class="text-sm text-green-600 dark:text-green-400">System Status</div>
				</div>
				<div class="rounded-lg bg-blue-50 p-4 text-center dark:bg-blue-900/20">
					<div class="text-2xl font-bold text-blue-600 dark:text-blue-400">Online</div>
					<div class="text-sm text-blue-600 dark:text-blue-400">Database</div>
				</div>
				<div class="rounded-lg bg-purple-50 p-4 text-center dark:bg-purple-900/20">
					<div class="text-2xl font-bold text-purple-600 dark:text-purple-400">Secure</div>
					<div class="text-sm text-purple-600 dark:text-purple-400">Authentication</div>
				</div>
			</div>
		</Card.Content>
	</Card.Root>
</div>
