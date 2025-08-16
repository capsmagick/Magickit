<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { authClient } from '$lib/auth/auth-client';
	import { goto } from '$app/navigation';
	import {
		Shield,
		AlertTriangle,
		Activity,
		Globe,
		Eye,
		Ban,
		CheckCircle,
		XCircle,
		FileText
	} from '@lucide/svelte';

	let hasCheckedAuth = $state(false);

	const session = authClient.useSession();

	let auditTrails = $state([
		{
			id: '1',
			action: 'login_attempt',
			user: 'john@example.com',
			ip: '192.168.1.100',
			timestamp: new Date('2024-01-20T10:30:00'),
			status: 'success',
			details: 'Successful login from office network'
		},
		{
			id: '2',
			action: 'failed_login',
			user: 'unknown',
			ip: '203.0.113.45',
			timestamp: new Date('2024-01-20T10:25:00'),
			status: 'failed',
			details: 'Failed login attempt - IP blocked'
		},
		{
			id: '3',
			action: 'role_change',
			user: 'jane@example.com',
			admin: 'admin@example.com',
			timestamp: new Date('2024-01-19T15:45:00'),
			status: 'success',
			details: 'Role changed from user to moderator'
		}
	]);



	// Reactive statement to check session and redirect if needed
	$effect(() => {
		if (!hasCheckedAuth && $session.data) {
			hasCheckedAuth = true;
			if ($session.data.user.role !== 'admin') {
				goto('/login?returnTo=/admin/security');
				return;
			}
		}
	});



	function getActionIcon(action: string) {
		switch (action) {
			case 'login_attempt':
				return CheckCircle;
			case 'failed_login':
				return XCircle;
			case 'role_change':
				return Activity;
			default:
				return Activity;
		}
	}

	function getStatusBadge(status: string) {
		switch (status) {
			case 'success':
				return { variant: 'default' as const, text: 'Success' };
			case 'failed':
				return { variant: 'destructive' as const, text: 'Failed' };
			case 'warning':
				return { variant: 'secondary' as const, text: 'Warning' };
			default:
				return { variant: 'outline' as const, text: status };
		}
	}
</script>

<div class="container mx-auto space-y-6 p-6">
	<!-- Header -->
	<div class="mb-8">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-3xl font-bold text-gray-900 dark:text-white">Security</h1>
				<p class="mt-2 text-gray-600 dark:text-gray-400">
					Monitor and configure security settings, access control, and audit trails
				</p>
			</div>

		</div>
	</div>

	<!-- Security Features Navigation -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
		<Card.Root class="transition-shadow duration-200 hover:shadow-md">
			<Card.Header>
				<div class="flex items-center gap-3">
					<div class="rounded-lg bg-primary/10 p-2">
						<Globe class="h-6 w-6 text-primary" />
					</div>
					<div>
						<Card.Title>IP Access Control</Card.Title>
						<Card.Description>Manage IP whitelist and blacklist rules</Card.Description>
					</div>
				</div>
			</Card.Header>
			<Card.Content>
				<p class="text-sm text-muted-foreground mb-4">
					Configure IP address access control with validation and monitoring capabilities.
				</p>
				<Button onclick={() => goto('/admin/security/ip-access')} class="w-full">
					<Shield class="mr-2 h-4 w-4" />
					Manage IP Access
				</Button>
			</Card.Content>
		</Card.Root>

		<Card.Root class="transition-shadow duration-200 hover:shadow-md">
			<Card.Header>
				<div class="flex items-center gap-3">
					<div class="rounded-lg bg-primary/10 p-2">
						<Shield class="h-6 w-6 text-primary" />
					</div>
					<div>
						<Card.Title>Brute Force Protection</Card.Title>
						<Card.Description>Configure attack protection settings</Card.Description>
					</div>
				</div>
			</Card.Header>
			<Card.Content>
				<p class="text-sm text-muted-foreground mb-4">
					Set up rate limiting, lockout policies, and monitoring for brute force attacks.
				</p>
				<Button onclick={() => goto('/admin/security/brute-force')} class="w-full">
					<Ban class="mr-2 h-4 w-4" />
					Configure Protection
				</Button>
			</Card.Content>
		</Card.Root>

		<Card.Root class="transition-shadow duration-200 hover:shadow-md">
			<Card.Header>
				<div class="flex items-center gap-3">
					<div class="rounded-lg bg-primary/10 p-2">
						<Activity class="h-6 w-6 text-primary" />
					</div>
					<div>
						<Card.Title>Audit Trails</Card.Title>
						<Card.Description>View detailed security and user logs</Card.Description>
					</div>
				</div>
			</Card.Header>
			<Card.Content>
				<p class="text-sm text-muted-foreground mb-4">
					Access comprehensive audit logs with advanced filtering and export capabilities.
				</p>
				<Button onclick={() => goto('/admin/security/audit-trails')} class="w-full">
					<FileText class="mr-2 h-4 w-4" />
					View Audit Trails
				</Button>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Quick Stats Overview -->
	<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
		<Card.Root>
			<Card.Content class="p-4">
				<div class="flex items-center gap-2">
					<Shield class="h-4 w-4 text-green-500" />
					<div>
						<p class="text-sm text-muted-foreground">IP Rules Active</p>
						<p class="text-2xl font-bold">12</p>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Content class="p-4">
				<div class="flex items-center gap-2">
					<Ban class="h-4 w-4 text-red-500" />
					<div>
						<p class="text-sm text-muted-foreground">Blocked IPs</p>
						<p class="text-2xl font-bold">3</p>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Content class="p-4">
				<div class="flex items-center gap-2">
					<AlertTriangle class="h-4 w-4 text-yellow-500" />
					<div>
						<p class="text-sm text-muted-foreground">Failed Attempts (24h)</p>
						<p class="text-2xl font-bold">45</p>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Content class="p-4">
				<div class="flex items-center gap-2">
					<FileText class="h-4 w-4 text-blue-500" />
					<div>
						<p class="text-sm text-muted-foreground">Audit Logs</p>
						<p class="text-2xl font-bold">15.4K</p>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Recent Security Events -->
	<Card.Root>
		<Card.Header>
			<Card.Title>Recent Security Events</Card.Title>
			<Card.Description>Latest security-related activities and alerts</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="space-y-4">
				{#each auditTrails.slice(0, 5) as trail}
					<div class="flex items-center justify-between rounded-lg border p-4">
						<div class="flex items-center gap-3">
							<div class="rounded-lg bg-primary/10 p-2">
								{#if trail.action === 'login_attempt'}
									<CheckCircle class="h-4 w-4 text-primary" />
								{:else if trail.action === 'failed_login'}
									<XCircle class="h-4 w-4 text-primary" />
								{:else}
									<Activity class="h-4 w-4 text-primary" />
								{/if}
							</div>
							<div>
								<h4 class="font-medium">{trail.action.replace('_', ' ').toUpperCase()}</h4>
								<p class="text-sm text-muted-foreground">
									{trail.user || 'System'} - {trail.ip || trail.admin || 'N/A'}
								</p>
								<div class="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
									<span>{trail.timestamp.toLocaleString()}</span>
									<Badge variant={getStatusBadge(trail.status).variant}
										>{getStatusBadge(trail.status).text}</Badge
									>
									<span>{trail.details}</span>
								</div>
							</div>
						</div>
						<Button variant="ghost" size="sm" onclick={() => goto('/admin/security/audit-trails')}>
							<Eye class="h-3 w-3" />
						</Button>
					</div>
				{/each}
			</div>
		</Card.Content>
	</Card.Root>




</div>
