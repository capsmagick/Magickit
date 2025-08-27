<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { 
		BookOpen, 
		Play, 
		FileText, 
		History,
		ExternalLink,
		Search,
		Star,
		Clock,
		Users
	} from '@lucide/svelte';
	import { goto } from '$app/navigation';

	const documentationSections = [
		{
			title: 'Introduction',
			description: 'Get started with the admin panel and understand the core concepts',
			icon: BookOpen,
			url: '/admin/docs/introduction',
			status: 'available',
			readTime: '5 min',
			popularity: 'high'
		},
		{
			title: 'Getting Started',
			description: 'Step-by-step guide to set up and configure your admin environment',
			icon: Play,
			url: '/admin/docs/getting-started',
			status: 'available',
			readTime: '10 min',
			popularity: 'high'
		},
		{
			title: 'Tutorials',
			description: 'Comprehensive tutorials for common admin tasks and workflows',
			icon: FileText,
			url: '/admin/docs/tutorials',
			status: 'available',
			readTime: '15 min',
			popularity: 'medium'
		},
		{
			title: 'Changelog',
			description: 'Track updates, new features, and improvements to the admin panel',
			icon: History,
			url: '/admin/docs/changelog',
			status: 'available',
			readTime: '3 min',
			popularity: 'medium'
		}
	];

	const quickLinks = [
		{ title: 'User Management Guide', url: '/admin/docs/tutorials#user-management' },
		{ title: 'Content Management', url: '/admin/docs/tutorials#content-management' },
		{ title: 'Security Best Practices', url: '/admin/docs/tutorials#security' },
		{ title: 'System Monitoring', url: '/admin/docs/tutorials#monitoring' },
		{ title: 'API Documentation', url: '/admin/docs/api' },
		{ title: 'Troubleshooting', url: '/admin/docs/troubleshooting' }
	];

	function getStatusBadge(status: string) {
		switch (status) {
			case 'available':
				return { variant: 'default' as const, text: 'Available' };
			case 'coming-soon':
				return { variant: 'secondary' as const, text: 'Coming Soon' };
			case 'updated':
				return { variant: 'outline' as const, text: 'Recently Updated' };
			default:
				return { variant: 'outline' as const, text: status };
		}
	}

	function getPopularityIcon(popularity: string) {
		switch (popularity) {
			case 'high':
				return { icon: Star, color: 'text-yellow-500' };
			case 'medium':
				return { icon: Users, color: 'text-blue-500' };
			default:
				return { icon: Clock, color: 'text-gray-500' };
		}
	}
</script>

<svelte:head>
	<title>Documentation | Admin | Magickit</title>
	<meta name="description" content="Admin panel documentation and guides" />
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="space-y-2">
		<h1 class="text-2xl font-bold">Documentation</h1>
		<p class="text-muted-foreground">
			Comprehensive guides and documentation for the admin panel
		</p>
	</div>

	<!-- Quick Stats -->
	<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
		<Card>
			<CardContent class="p-4 text-center">
				<div class="text-2xl font-bold">12</div>
				<div class="text-sm text-muted-foreground">Total Guides</div>
			</CardContent>
		</Card>
		<Card>
			<CardContent class="p-4 text-center">
				<div class="text-2xl font-bold">45min</div>
				<div class="text-sm text-muted-foreground">Total Read Time</div>
			</CardContent>
		</Card>
		<Card>
			<CardContent class="p-4 text-center">
				<div class="text-2xl font-bold">v2.1.0</div>
				<div class="text-sm text-muted-foreground">Current Version</div>
			</CardContent>
		</Card>
		<Card>
			<CardContent class="p-4 text-center">
				<div class="text-2xl font-bold">Jan 2024</div>
				<div class="text-sm text-muted-foreground">Last Updated</div>
			</CardContent>
		</Card>
	</div>

	<!-- Main Documentation Sections -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		{#each documentationSections as section}
			{@const statusInfo = getStatusBadge(section.status)}
			{@const popularityInfo = getPopularityIcon(section.popularity)}
			
			<Card class="transition-shadow duration-200 hover:shadow-md cursor-pointer" onclick={() => goto(section.url)}>
				<CardHeader>
					<div class="flex items-start justify-between">
						<div class="flex items-center gap-3">
							<div class="p-2 rounded-lg bg-primary/10">
								<svelte:component this={section.icon} class="h-5 w-5 text-primary" />
							</div>
							<div>
								<CardTitle class="text-lg">{section.title}</CardTitle>
								<div class="flex items-center gap-2 mt-1">
									<Badge variant={statusInfo.variant} class="text-xs">
										{statusInfo.text}
									</Badge>
									<div class="flex items-center gap-1 text-xs text-muted-foreground">
										<svelte:component this={popularityInfo.icon} class="h-3 w-3 {popularityInfo.color}" />
										{section.popularity}
									</div>
								</div>
							</div>
						</div>
						<div class="text-xs text-muted-foreground flex items-center gap-1">
							<Clock class="h-3 w-3" />
							{section.readTime}
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<p class="text-sm text-muted-foreground mb-4">
						{section.description}
					</p>
					<Button variant="ghost" size="sm" class="w-full justify-between">
						Read Documentation
						<ExternalLink class="h-4 w-4" />
					</Button>
				</CardContent>
			</Card>
		{/each}
	</div>

	<!-- Quick Links -->
	<Card>
		<CardHeader>
			<CardTitle class="flex items-center gap-2">
				<Search class="h-5 w-5" />
				Quick Links
			</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
				{#each quickLinks as link}
					<Button 
						variant="ghost" 
						size="sm" 
						class="justify-start h-auto p-3 text-left"
						onclick={() => goto(link.url)}
					>
						<div class="space-y-1">
							<div class="font-medium text-sm">{link.title}</div>
						</div>
					</Button>
				{/each}
			</div>
		</CardContent>
	</Card>

	<!-- Help Section -->
	<Card class="bg-muted/50">
		<CardContent class="p-6 text-center space-y-4">
			<BookOpen class="h-8 w-8 mx-auto text-primary" />
			<div class="space-y-2">
				<h3 class="font-semibold">Need More Help?</h3>
				<p class="text-sm text-muted-foreground">
					Can't find what you're looking for? Our support team is here to help.
				</p>
			</div>
			<div class="flex flex-col sm:flex-row gap-2 justify-center">
				<Button variant="outline" onclick={() => goto('/admin/support/contact')}>
					Contact Support
				</Button>
				<Button variant="outline" onclick={() => goto('/admin/support/feedback')}>
					Submit Feedback
				</Button>
			</div>
		</CardContent>
	</Card>
</div>