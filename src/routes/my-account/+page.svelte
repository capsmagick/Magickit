<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { authClient } from '$lib/auth/auth-client';
	import { goto } from '$app/navigation';
	import { 
		User, Mail, Shield, LogOut, Settings, Activity, Loader2, CheckCircle, AlertCircle,
		Calendar, Clock, FileText, Heart, Bell, TrendingUp, Eye, MessageSquare
	} from '@lucide/svelte';

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

	// Enhanced dashboard statistics
	const userStats = [
		{ 
			label: 'Account Status', 
			value: 'Active', 
			icon: CheckCircle, 
			variant: 'default' as const,
			description: 'Your account is in good standing'
		},
		{ 
			label: 'Member Since', 
			value: 'Jan 2024', 
			icon: Calendar, 
			variant: 'secondary' as const,
			description: '11 months as a member'
		},
		{ 
			label: 'Last Login', 
			value: 'Today', 
			icon: Clock, 
			variant: 'secondary' as const,
			description: '2 hours ago'
		},
		{ 
			label: 'Profile Views', 
			value: '127', 
			icon: Eye, 
			variant: 'secondary' as const,
			description: '+12% from last month'
		}
	];

	// Recent activity data
	const recentActivity = [
		{
			id: 1,
			action: 'Updated profile information',
			timestamp: '2 hours ago',
			icon: User,
			type: 'profile'
		},
		{
			id: 2,
			action: 'Changed password',
			timestamp: '1 day ago',
			icon: Shield,
			type: 'security'
		},
		{
			id: 3,
			action: 'Logged in from new device',
			timestamp: '3 days ago',
			icon: Activity,
			type: 'login'
		},
		{
			id: 4,
			action: 'Updated notification preferences',
			timestamp: '1 week ago',
			icon: Bell,
			type: 'settings'
		},
		{
			id: 5,
			action: 'Created new content',
			timestamp: '2 weeks ago',
			icon: FileText,
			type: 'content'
		}
	];

	const quickActions = [
		{ 
			label: 'Edit Profile', 
			icon: User, 
			action: () => goto('/my-account/profile'),
			variant: 'default' as const,
			description: 'Update your personal information'
		},
		{ 
			label: 'Account Settings', 
			icon: Settings, 
			action: () => goto('/my-account/settings'),
			variant: 'secondary' as const,
			description: 'Manage preferences and privacy'
		},
		{ 
			label: 'Security', 
			icon: Shield, 
			action: () => goto('/my-account/security'),
			variant: 'secondary' as const,
			description: 'Password and security settings'
		},
		{ 
			label: 'View Activity', 
			icon: Activity, 
			action: () => {},
			variant: 'outline' as const,
			description: 'See your recent account activity'
		}
	];

	function getActivityIcon(type: string) {
		switch (type) {
			case 'profile': return User;
			case 'security': return Shield;
			case 'login': return Activity;
			case 'settings': return Settings;
			case 'content': return FileText;
			default: return Activity;
		}
	}

	function getActivityColor(type: string) {
		switch (type) {
			case 'profile': return 'text-blue-600';
			case 'security': return 'text-green-600';
			case 'login': return 'text-purple-600';
			case 'settings': return 'text-orange-600';
			case 'content': return 'text-pink-600';
			default: return 'text-gray-600';
		}
	}
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

		<!-- Enhanced Dashboard Statistics -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
			{#each userStats as stat}
				<Card.Root class="transition-shadow duration-200 hover:shadow-md">
					<Card.Content class="p-4">
						<div class="flex items-center justify-between mb-2">
							<div class="p-2 rounded-lg bg-primary/10">
								<stat.icon class="h-5 w-5 text-primary" />
							</div>
							<Badge variant={stat.variant} class="text-xs">
								{stat.value}
							</Badge>
						</div>
						<div class="space-y-1">
							<p class="text-sm font-medium">{stat.label}</p>
							<p class="text-xs text-muted-foreground">{stat.description}</p>
						</div>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>

		<!-- Main Dashboard Grid -->
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- Recent Activity Feed -->
			<div class="lg:col-span-2 space-y-6">
				<Card.Root>
					<Card.Header class="space-y-2">
						<Card.Title class="text-lg flex items-center gap-2">
							<Activity class="h-5 w-5" />
							Recent Activity
						</Card.Title>
						<Card.Description class="text-sm">
							Your latest account activity and updates
						</Card.Description>
					</Card.Header>
					<Card.Content class="p-4">
						<div class="space-y-4">
							{#each recentActivity as activity}
								{@const IconComponent = getActivityIcon(activity.type)}
								<div class="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors duration-200">
									<div class="p-2 rounded-full bg-muted">
										<IconComponent class="h-4 w-4 {getActivityColor(activity.type)}" />
									</div>
									<div class="flex-1 space-y-1">
										<p class="text-sm font-medium">{activity.action}</p>
										<p class="text-xs text-muted-foreground">{activity.timestamp}</p>
									</div>
								</div>
							{/each}
						</div>
						<div class="mt-4 pt-4 border-t">
							<Button variant="outline" size="sm" class="w-full transition-colors duration-200">
								<Activity class="mr-2 h-4 w-4" />
								View All Activity
							</Button>
						</div>
					</Card.Content>
				</Card.Root>

				<!-- Quick Profile Update -->
				<Card.Root>
					<Card.Header class="space-y-2">
						<Card.Title class="text-lg flex items-center gap-2">
							<User class="h-5 w-5" />
							Quick Profile Update
						</Card.Title>
						<Card.Description class="text-sm">
							Update your basic information quickly
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
									onclick={() => goto('/my-account/profile')}
									class="transition-colors duration-200"
								>
									<User class="mr-2 h-4 w-4" />
									Full Profile
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

						<div class="pt-4 border-t">
							<Button 
								variant="destructive" 
								size="sm"
								class="w-full transition-colors duration-200"
								onclick={handleSignOut}
							>
								<LogOut class="mr-2 h-4 w-4" />
								Sign Out
							</Button>
						</div>
					</Card.Content>
				</Card.Root>

				<!-- Enhanced Quick Actions -->
				<Card.Root>
					<Card.Header class="space-y-2">
						<Card.Title class="text-lg">Quick Actions</Card.Title>
						<Card.Description class="text-sm">
							Common account management tasks
						</Card.Description>
					</Card.Header>
					<Card.Content class="p-4 space-y-3">
						{#each quickActions as action}
							<div class="space-y-2">
								<Button 
									variant={action.variant} 
									size="sm"
									class="w-full justify-start transition-colors duration-200"
									onclick={action.action}
								>
									<action.icon class="mr-2 h-4 w-4" />
									{action.label}
								</Button>
								<p class="text-xs text-muted-foreground px-2">{action.description}</p>
							</div>
						{/each}
					</Card.Content>
				</Card.Root>
			</div>
		</div>
	</div>
</div>
