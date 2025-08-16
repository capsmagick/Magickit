<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { authClient } from '$lib/auth/auth-client';
	import { goto } from '$app/navigation';
	import {
		Key,
		Shield,
		Users,
		Activity,
		ArrowRight,
		Loader2,
		AlertCircle,
		CheckCircle2,
		BarChart3,
		Clock,
		UserCheck
	} from '@lucide/svelte';

	let hasCheckedAuth = false;
	let isLoading = $state(true);
	let error = $state('');
	let stats = $state({
		totalRoles: 0,
		totalPermissions: 0,
		totalUsers: 0,
		recentActivity: 0
	});

	const session = authClient.useSession();

	// RBAC management sections
	const rbacSections = [
		{
			title: 'Roles Management',
			description: 'Create and manage user roles with specific permissions',
			icon: Shield,
			href: '/admin/access-control/roles',
			color: 'bg-blue-500',
			stats: 'roles'
		},
		{
			title: 'Permissions Management',
			description: 'Define and organize system permissions by resource',
			icon: Key,
			href: '/admin/access-control/permissions',
			color: 'bg-green-500',
			stats: 'permissions'
		},
		{
			title: 'Role Assignment',
			description: 'Assign roles to users and manage role assignments',
			icon: UserCheck,
			href: '/admin/access-control/assign',
			color: 'bg-purple-500',
			stats: 'users'
		},
		{
			title: 'Access Audit',
			description: 'Monitor and audit system access and role changes',
			icon: Activity,
			href: '/admin/access-control/audit',
			color: 'bg-orange-500',
			stats: 'activity'
		}
	];

	// Reactive statement to check session and redirect if needed
	$effect(() => {
		if (!hasCheckedAuth && $session.data) {
			hasCheckedAuth = true;
			if ($session.data.user.role !== 'admin') {
				goto('/login?returnTo=/admin/access-control');
				return;
			}
		}
	});

	onMount(async () => {
		await loadStats();
		isLoading = false;
	});

	async function loadStats() {
		try {
			// Load statistics from API endpoints
			const [rolesRes, permissionsRes, usersRes] = await Promise.all([
				fetch('/api/admin/roles'),
				fetch('/api/admin/permissions'),
				fetch('/api/admin/users')
			]);

			if (rolesRes.ok && permissionsRes.ok && usersRes.ok) {
				const [roles, permissions, users] = await Promise.all([
					rolesRes.json(),
					permissionsRes.json(),
					usersRes.json()
				]);

				stats = {
					totalRoles: roles.length,
					totalPermissions: permissions.length,
					totalUsers: users.length,
					recentActivity: 0 // This would come from audit logs
				};
			} else {
				throw new Error('Failed to load statistics');
			}
		} catch (err) {
			error = 'Failed to load RBAC statistics. Please try again.';
			console.error('Error loading stats:', err);
		}
	}

	function getStatValue(statType: string): number {
		switch (statType) {
			case 'roles': return stats.totalRoles;
			case 'permissions': return stats.totalPermissions;
			case 'users': return stats.totalUsers;
			case 'activity': return stats.recentActivity;
			default: return 0;
		}
	}

	function navigateToSection(href: string) {
		goto(href);
	}
</script>

<svelte:head>
	<title>Access Control (RBAC) - Admin</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
		<div class="space-y-2">
			<h1 class="text-2xl font-bold">Access Control (RBAC)</h1>
			<p class="text-muted-foreground">Manage roles, permissions, and access policies</p>
		</div>
	</div>

	<!-- Status Messages -->
	{#if error}
		<Alert variant="destructive">
			<AlertCircle class="h-4 w-4" />
			<AlertDescription>{error}</AlertDescription>
		</Alert>
	{/if}

	<!-- Statistics Overview -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
		<Card>
			<CardContent class="p-6">
				<div class="flex items-center justify-between">
					<div class="space-y-2">
						<p class="text-sm font-medium text-muted-foreground">Total Roles</p>
						{#if isLoading}
							<div class="flex items-center">
								<Loader2 class="h-4 w-4 animate-spin mr-2" />
								<span class="text-2xl font-bold">--</span>
							</div>
						{:else}
							<p class="text-2xl font-bold">{stats.totalRoles}</p>
						{/if}
					</div>
					<div class="p-2 bg-blue-500/10 rounded-lg">
						<Shield class="h-6 w-6 text-blue-500" />
					</div>
				</div>
			</CardContent>
		</Card>

		<Card>
			<CardContent class="p-6">
				<div class="flex items-center justify-between">
					<div class="space-y-2">
						<p class="text-sm font-medium text-muted-foreground">Total Permissions</p>
						{#if isLoading}
							<div class="flex items-center">
								<Loader2 class="h-4 w-4 animate-spin mr-2" />
								<span class="text-2xl font-bold">--</span>
							</div>
						{:else}
							<p class="text-2xl font-bold">{stats.totalPermissions}</p>
						{/if}
					</div>
					<div class="p-2 bg-green-500/10 rounded-lg">
						<Key class="h-6 w-6 text-green-500" />
					</div>
				</div>
			</CardContent>
		</Card>

		<Card>
			<CardContent class="p-6">
				<div class="flex items-center justify-between">
					<div class="space-y-2">
						<p class="text-sm font-medium text-muted-foreground">Total Users</p>
						{#if isLoading}
							<div class="flex items-center">
								<Loader2 class="h-4 w-4 animate-spin mr-2" />
								<span class="text-2xl font-bold">--</span>
							</div>
						{:else}
							<p class="text-2xl font-bold">{stats.totalUsers}</p>
						{/if}
					</div>
					<div class="p-2 bg-purple-500/10 rounded-lg">
						<Users class="h-6 w-6 text-purple-500" />
					</div>
				</div>
			</CardContent>
		</Card>

		<Card>
			<CardContent class="p-6">
				<div class="flex items-center justify-between">
					<div class="space-y-2">
						<p class="text-sm font-medium text-muted-foreground">Recent Activity</p>
						{#if isLoading}
							<div class="flex items-center">
								<Loader2 class="h-4 w-4 animate-spin mr-2" />
								<span class="text-2xl font-bold">--</span>
							</div>
						{:else}
							<p class="text-2xl font-bold">{stats.recentActivity}</p>
						{/if}
					</div>
					<div class="p-2 bg-orange-500/10 rounded-lg">
						<Activity class="h-6 w-6 text-orange-500" />
					</div>
				</div>
			</CardContent>
		</Card>
	</div>

	<!-- RBAC Management Sections -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		{#each rbacSections as section}
			{@const IconComponent = section.icon}
			<Card class="transition-all duration-200 hover:shadow-md cursor-pointer" onclick={() => navigateToSection(section.href)}>
				<CardContent class="p-6">
					<div class="flex items-start justify-between">
						<div class="space-y-3 flex-1">
							<div class="flex items-center gap-3">
								<div class="p-2 {section.color}/10 rounded-lg">
									<IconComponent class="h-6 w-6 {section.color.replace('bg-', 'text-')}" />
								</div>
								<h3 class="text-lg font-semibold">{section.title}</h3>
							</div>
							<p class="text-muted-foreground text-sm leading-relaxed">{section.description}</p>
							<div class="flex items-center justify-between">
								<Badge variant="secondary" class="text-xs">
									{getStatValue(section.stats)} {section.stats}
								</Badge>
								<Button variant="ghost" size="sm" class="transition-colors duration-200">
									<ArrowRight class="h-4 w-4" />
								</Button>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		{/each}
	</div>

	<!-- Quick Actions -->
	<Card>
		<CardHeader>
			<CardTitle class="text-lg">Quick Actions</CardTitle>
			<CardDescription>Common RBAC management tasks</CardDescription>
		</CardHeader>
		<CardContent>
			<div class="flex flex-wrap gap-3">
				<Button onclick={() => navigateToSection('/admin/access-control/roles')} class="transition-colors duration-200">
					<Shield class="mr-2 h-4 w-4" />
					Manage Roles
				</Button>
				<Button variant="outline" onclick={() => navigateToSection('/admin/access-control/permissions')} class="transition-colors duration-200">
					<Key class="mr-2 h-4 w-4" />
					Manage Permissions
				</Button>
				<Button variant="outline" onclick={() => navigateToSection('/admin/access-control/assign')} class="transition-colors duration-200">
					<UserCheck class="mr-2 h-4 w-4" />
					Assign Roles
				</Button>
				<Button variant="outline" onclick={() => navigateToSection('/admin/access-control/audit')} class="transition-colors duration-200">
					<Activity class="mr-2 h-4 w-4" />
					View Audit Logs
				</Button>
			</div>
		</CardContent>
	</Card>
</div>
