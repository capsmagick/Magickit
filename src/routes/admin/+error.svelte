<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { 
		ArrowLeft, 
		Home, 
		RefreshCw, 
		AlertTriangle,
		FileQuestion,
		Settings,
		Users,
		Shield
	} from '@lucide/svelte';

	// Get error details from page store
	let error = $derived($page.error);
	let status = $derived($page.status);
	let url = $derived($page.url);

	// Admin navigation shortcuts
	const adminShortcuts = [
		{ title: 'Dashboard', href: '/admin', icon: Home, description: 'Return to admin dashboard' },
		{ title: 'User Management', href: '/admin/users', icon: Users, description: 'Manage users and profiles' },
		{ title: 'Content Management', href: '/admin/content', icon: FileQuestion, description: 'Manage site content' },
		{ title: 'System Settings', href: '/admin/system', icon: Settings, description: 'System monitoring and settings' },
		{ title: 'Access Control', href: '/admin/access-control', icon: Shield, description: 'Manage roles and permissions' }
	];

	// Determine error type and message
	let errorTitle = $derived(() => {
		switch (status) {
			case 404:
				return 'Admin Page Not Found';
			case 403:
				return 'Access Denied';
			case 500:
				return 'Server Error';
			default:
				return 'Admin Error';
		}
	});

	let errorMessage = $derived(() => {
		switch (status) {
			case 404:
				return "The admin page you're looking for doesn't exist or has been moved.";
			case 403:
				return "You don't have permission to access this admin section.";
			case 500:
				return 'An internal server error occurred. Please try again or contact support.';
			default:
				return error?.message || 'An unexpected error occurred in the admin panel.';
		}
	});

	function handleGoBack() {
		if (typeof window !== 'undefined') {
			window.history.back();
		}
	}

	function handleRefresh() {
		if (typeof window !== 'undefined') {
			window.location.reload();
		}
	}

	function handleGoToDashboard() {
		goto('/admin');
	}
</script>

<svelte:head>
	<title>{errorTitle} | Admin | Magickit</title>
	<meta name="description" content="Admin error page - {errorMessage}" />
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<!-- Error Header -->
	<div class="text-center mb-8">
		<div class="flex justify-center mb-6">
			<div class="p-4 rounded-lg bg-destructive/10">
				{#if status === 404}
					<FileQuestion class="h-12 w-12 text-destructive" />
				{:else if status === 403}
					<Shield class="h-12 w-12 text-destructive" />
				{:else}
					<AlertTriangle class="h-12 w-12 text-destructive" />
				{/if}
			</div>
		</div>
		
		<div class="space-y-4">
			<div class="flex items-center justify-center gap-2">
				<Badge variant="destructive" class="text-sm">
					Error {status}
				</Badge>
				<Badge variant="outline" class="text-sm">
					Admin Panel
				</Badge>
			</div>
			
			<h1 class="text-3xl font-bold tracking-tight">
				{errorTitle}
			</h1>
			
			<p class="text-lg text-muted-foreground max-w-2xl mx-auto">
				{errorMessage}
			</p>
			
			{#if url}
				<p class="text-sm text-muted-foreground font-mono bg-muted px-3 py-1 rounded inline-block">
					{url.pathname}
				</p>
			{/if}
		</div>
	</div>

	<!-- Action Buttons -->
	<div class="flex flex-col sm:flex-row gap-4 justify-center mb-12">
		<Button onclick={handleGoToDashboard} class="transition-colors duration-200">
			<Home class="mr-2 h-4 w-4" />
			Admin Dashboard
		</Button>
		<Button variant="outline" onclick={handleGoBack} class="transition-colors duration-200">
			<ArrowLeft class="mr-2 h-4 w-4" />
			Go Back
		</Button>
		{#if status !== 404}
			<Button variant="outline" onclick={handleRefresh} class="transition-colors duration-200">
				<RefreshCw class="mr-2 h-4 w-4" />
				Try Again
			</Button>
		{/if}
	</div>

	<!-- Admin Navigation Shortcuts -->
	<div class="max-w-4xl mx-auto">
		<Card>
			<CardHeader class="text-center">
				<CardTitle class="text-xl">Admin Navigation</CardTitle>
				<p class="text-muted-foreground">
					Quick access to main admin sections
				</p>
			</CardHeader>
			<CardContent>
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{#each adminShortcuts as shortcut}
						<button
							onclick={() => goto(shortcut.href)}
							class="p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-all duration-200 text-left group"
						>
							<div class="flex items-start gap-3">
								<div class="p-2 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors duration-200">
									<shortcut.icon class="h-4 w-4 text-primary" />
								</div>
								<div class="space-y-1">
									<h3 class="font-medium text-sm">{shortcut.title}</h3>
									<p class="text-xs text-muted-foreground leading-relaxed">
										{shortcut.description}
									</p>
								</div>
							</div>
						</button>
					{/each}
				</div>
			</CardContent>
		</Card>
	</div>

	<!-- Help Section -->
	{#if status === 403}
		<div class="max-w-2xl mx-auto mt-8">
			<Card class="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
				<CardContent class="p-6 text-center space-y-4">
					<Shield class="h-8 w-8 text-amber-600 mx-auto" />
					<div class="space-y-2">
						<h3 class="font-semibold text-amber-800 dark:text-amber-200">
							Need Access?
						</h3>
						<p class="text-sm text-amber-700 dark:text-amber-300">
							If you believe you should have access to this section, please contact your administrator 
							or check your role permissions.
						</p>
					</div>
					<Button variant="outline" onclick={() => goto('/admin/access-control')} class="mt-4">
						<Shield class="mr-2 h-4 w-4" />
						View Access Control
					</Button>
				</CardContent>
			</Card>
		</div>
	{/if}
</div>