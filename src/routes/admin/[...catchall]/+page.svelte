<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Input } from '$lib/components/ui/input';
	import { 
		ArrowLeft, 
		Home, 
		Search, 
		FileQuestion,
		Users,
		Settings,
		Shield,
		FileText,
		Image,
		Activity,
		BookOpen
	} from '@lucide/svelte';

	let searchQuery = $state('');
	let url = $derived($page.url);

	// Admin navigation shortcuts
	const adminShortcuts = [
		{ title: 'Dashboard', href: '/admin', icon: Home, description: 'Return to admin dashboard' },
		{ title: 'User Management', href: '/admin/users', icon: Users, description: 'Manage users and profiles' },
		{ title: 'Content Management', href: '/admin/content', icon: FileText, description: 'Manage site content' },
		{ title: 'Media Management', href: '/admin/media', icon: Image, description: 'Manage media files' },
		{ title: 'System Health', href: '/admin/system', icon: Activity, description: 'System monitoring and settings' },
		{ title: 'Access Control', href: '/admin/access-control', icon: Shield, description: 'Manage roles and permissions' },
		{ title: 'Documentation', href: '/admin/docs', icon: BookOpen, description: 'Admin documentation and guides' }
	];

	// Suggest similar routes based on the current path
	const suggestedRoutes = $derived(() => {
		const currentPath = url.pathname.toLowerCase();
		const suggestions = [];

		// Check for common typos or similar paths
		if (currentPath.includes('user')) {
			suggestions.push({ title: 'User Management', href: '/admin/users' });
		}
		if (currentPath.includes('content')) {
			suggestions.push({ title: 'Content Management', href: '/admin/content' });
		}
		if (currentPath.includes('media')) {
			suggestions.push({ title: 'Media Management', href: '/admin/media' });
		}
		if (currentPath.includes('system') || currentPath.includes('health')) {
			suggestions.push({ title: 'System Health', href: '/admin/system' });
		}
		if (currentPath.includes('security') || currentPath.includes('access')) {
			suggestions.push({ title: 'Security', href: '/admin/security' });
			suggestions.push({ title: 'Access Control', href: '/admin/access-control' });
		}
		if (currentPath.includes('doc') || currentPath.includes('help')) {
			suggestions.push({ title: 'Documentation', href: '/admin/docs' });
		}

		return suggestions.slice(0, 3); // Limit to 3 suggestions
	});

	function handleGoBack() {
		if (typeof window !== 'undefined') {
			window.history.back();
		}
	}

	function handleSearch() {
		if (searchQuery.trim()) {
			// This would typically integrate with a search system
			// For now, redirect to documentation
			goto(`/admin/docs?search=${encodeURIComponent(searchQuery.trim())}`);
		}
	}
</script>

<svelte:head>
	<title>Page Not Found | Admin | Magickit</title>
	<meta name="description" content="The admin page you're looking for doesn't exist" />
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<!-- Error Header -->
	<div class="text-center mb-8">
		<div class="flex justify-center mb-6">
			<div class="p-4 rounded-lg bg-destructive/10">
				<FileQuestion class="h-12 w-12 text-destructive" />
			</div>
		</div>
		
		<div class="space-y-4">
			<div class="flex items-center justify-center gap-2">
				<Badge variant="destructive" class="text-sm">
					404 Error
				</Badge>
				<Badge variant="outline" class="text-sm">
					Admin Panel
				</Badge>
			</div>
			
			<h1 class="text-3xl font-bold tracking-tight">
				Admin Page Not Found
			</h1>
			
			<p class="text-lg text-muted-foreground max-w-2xl mx-auto">
				The admin page you're looking for doesn't exist or has been moved.
			</p>
			
			<p class="text-sm text-muted-foreground font-mono bg-muted px-3 py-1 rounded inline-block">
				{url.pathname}
			</p>
		</div>
	</div>

	<!-- Action Buttons -->
	<div class="flex flex-col sm:flex-row gap-4 justify-center mb-8">
		<Button onclick={() => goto('/admin')} class="transition-colors duration-200">
			<Home class="mr-2 h-4 w-4" />
			Admin Dashboard
		</Button>
		<Button variant="outline" onclick={handleGoBack} class="transition-colors duration-200">
			<ArrowLeft class="mr-2 h-4 w-4" />
			Go Back
		</Button>
	</div>

	<!-- Search -->
	<div class="max-w-md mx-auto mb-8">
		<Card>
			<CardHeader class="text-center pb-3">
				<CardTitle class="text-lg">Search Admin Panel</CardTitle>
			</CardHeader>
			<CardContent>
				<form onsubmit={(e) => { e.preventDefault(); handleSearch(); }} class="flex gap-2">
					<div class="relative flex-1">
						<Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
						<Input
							type="search"
							placeholder="Search admin features..."
							bind:value={searchQuery}
							class="pl-8 transition-colors duration-200"
						/>
					</div>
					<Button type="submit" class="transition-colors duration-200">
						Search
					</Button>
				</form>
			</CardContent>
		</Card>
	</div>

	<!-- Suggested Routes -->
	{#if suggestedRoutes.length > 0}
		<div class="max-w-2xl mx-auto mb-8">
			<Card>
				<CardHeader class="text-center">
					<CardTitle class="text-lg">Did you mean?</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="space-y-2">
						{#each suggestedRoutes as suggestion}
							<Button 
								variant="ghost" 
								class="w-full justify-start transition-colors duration-200"
								onclick={() => goto(suggestion.href)}
							>
								{suggestion.title}
							</Button>
						{/each}
					</div>
				</CardContent>
			</Card>
		</div>
	{/if}

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
	<div class="max-w-2xl mx-auto mt-8">
		<Card class="bg-muted/50">
			<CardContent class="p-6 text-center space-y-4">
				<BookOpen class="h-8 w-8 text-primary mx-auto" />
				<div class="space-y-2">
					<h3 class="font-semibold">Need Help?</h3>
					<p class="text-sm text-muted-foreground">
						Check our documentation or contact support if you can't find what you're looking for.
					</p>
				</div>
				<div class="flex flex-col sm:flex-row gap-2 justify-center">
					<Button variant="outline" onclick={() => goto('/admin/docs')} class="transition-colors duration-200">
						<BookOpen class="mr-2 h-4 w-4" />
						Documentation
					</Button>
					<Button variant="outline" onclick={() => goto('/admin/support/contact')} class="transition-colors duration-200">
						Contact Support
					</Button>
				</div>
			</CardContent>
		</Card>
	</div>
</div>