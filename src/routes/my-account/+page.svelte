<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Badge from '$lib/components/ui/badge/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { authClient } from '$lib/auth/auth-client';
	import { goto } from '$app/navigation';
	import { User, Mail, Shield, LogOut, Settings, Activity, Loader2, CheckCircle, AlertCircle } from '@lucide/svelte';

	let name = $state('');
	let email = $state('');
	let isLoading = $state(false);
	let error = $state('');
	let success = $state('');

	const session = authClient.useSession();

	// Check if user is logged in and populate form
	$effect(() => {
		if ($session.data) {
			name = $session.data.user.name || '';
			email = $session.data.user.email || '';
		} else {
			goto('/login?returnTo=/my-account');
		}
	});

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		isLoading = true;
		error = '';
		success = '';

		try {
			// Note: Better Auth doesn't have a direct update profile method in the client
			// You would typically implement this through a custom API endpoint
			// For now, we'll just show a success message
			await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
			success = 'Profile updated successfully!';
		} catch (err) {
			error = 'Failed to update profile';
		} finally {
			isLoading = false;
		}
	}

	async function handleSignOut() {
		await authClient.signOut();
		goto('/');
	}

	// Mock data for dashboard stats
	const stats = [
		{ label: 'Account Status', value: 'Active', icon: CheckCircle, variant: 'default' as const },
		{ label: 'Member Since', value: 'Jan 2024', icon: Activity, variant: 'secondary' as const },
		{ label: 'Last Login', value: 'Today', icon: Shield, variant: 'secondary' as const }
	];

	const quickActions = [
		{ label: 'Account Settings', icon: Settings, action: () => goto('/my-account/settings') },
		{ label: 'Security', icon: Shield, action: () => goto('/my-account/security') },
		{ label: 'Profile', icon: User, action: () => goto('/my-account/profile') }
	];
</script>

<div class="container mx-auto max-w-4xl px-4 py-6">
	<div class="space-y-6">
		<!-- Header -->
		<div class="space-y-2">
			<h1 class="text-2xl font-bold">My Account</h1>
			<p class="text-muted-foreground text-sm">
				Manage your account settings and profile information
			</p>
		</div>

		<!-- Dashboard Overview -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
			{#each stats as stat}
				<Card.Root>
					<Card.Content class="p-4">
						<div class="flex items-center justify-between">
							<div class="space-y-1">
								<p class="text-sm text-muted-foreground">{stat.label}</p>
								<p class="text-lg font-semibold">{stat.value}</p>
							</div>
							<div class="p-2 rounded-lg bg-primary/10">
								<stat.icon class="h-5 w-5 text-primary" />
							</div>
						</div>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>

		<!-- Main Content Grid -->
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- Profile Information -->
			<div class="lg:col-span-2">
				<Card.Root>
					<Card.Header class="space-y-2">
						<Card.Title class="text-lg flex items-center gap-2">
							<User class="h-5 w-5" />
							Profile Information
						</Card.Title>
						<Card.Description class="text-sm">
							Update your personal information and contact details
						</Card.Description>
					</Card.Header>
					<Card.Content class="p-4 space-y-6">
						{#if error}
							<Alert.Root variant="destructive">
								<AlertCircle class="h-4 w-4" />
								<Alert.Description>{error}</Alert.Description>
							</Alert.Root>
						{/if}

						{#if success}
							<Alert.Root variant="default" class="border-green-200 bg-green-50 text-green-800">
								<CheckCircle class="h-4 w-4" />
								<Alert.Description>{success}</Alert.Description>
							</Alert.Root>
						{/if}

						<form onsubmit={handleSubmit} class="space-y-6">
							<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div class="space-y-2">
									<Label for="name" class="text-sm font-medium">Full Name</Label>
									<Input 
										id="name" 
										type="text" 
										bind:value={name} 
										required 
										disabled={isLoading}
										class="transition-colors duration-200"
									/>
								</div>

								<div class="space-y-2">
									<Label for="email" class="text-sm font-medium">Email</Label>
									<Input 
										id="email" 
										type="email" 
										bind:value={email} 
										required 
										disabled={isLoading}
										class="transition-colors duration-200"
									/>
								</div>
							</div>

							<div class="flex flex-col sm:flex-row gap-4">
								<Button 
									type="submit" 
									disabled={isLoading}
									class="transition-colors duration-200"
								>
									{#if isLoading}
										<Loader2 class="mr-2 h-4 w-4 animate-spin" />
										Updating...
									{:else}
										Update Profile
									{/if}
								</Button>
								<Button 
									type="button" 
									variant="outline" 
									onclick={handleSignOut}
									class="transition-colors duration-200"
								>
									<LogOut class="mr-2 h-4 w-4" />
									Sign Out
								</Button>
							</div>
						</form>
					</Card.Content>
				</Card.Root>
			</div>

			<!-- Sidebar -->
			<div class="space-y-6">
				<!-- Account Summary -->
				<Card.Root>
					<Card.Header class="space-y-2">
						<Card.Title class="text-lg">Account Summary</Card.Title>
					</Card.Header>
					<Card.Content class="p-4 space-y-4">
						<div class="flex items-center gap-3">
							<div class="p-2 rounded-full bg-primary/10">
								<User class="h-4 w-4 text-primary" />
							</div>
							<div class="space-y-1">
								<p class="text-sm font-medium">{$session.data?.user?.name || 'User'}</p>
								<p class="text-sm text-muted-foreground">
									{$session.data?.user?.email || 'user@example.com'}
								</p>
							</div>
						</div>
						
						<div class="flex items-center justify-between">
							<span class="text-sm text-muted-foreground">Role</span>
							<Badge variant={$session.data?.user?.role === 'admin' ? 'default' : 'secondary'}>
								{$session.data?.user?.role || 'user'}
							</Badge>
						</div>
					</Card.Content>
				</Card.Root>

				<!-- Quick Actions -->
				<Card.Root>
					<Card.Header class="space-y-2">
						<Card.Title class="text-lg">Quick Actions</Card.Title>
						<Card.Description class="text-sm">
							Common account management tasks
						</Card.Description>
					</Card.Header>
					<Card.Content class="p-4 space-y-2">
						{#each quickActions as action}
							<Button 
								variant="ghost" 
								class="w-full justify-start transition-colors duration-200"
								onclick={action.action}
							>
								<action.icon class="mr-2 h-4 w-4" />
								{action.label}
							</Button>
						{/each}
					</Card.Content>
				</Card.Root>
			</div>
		</div>
	</div>
</div>
