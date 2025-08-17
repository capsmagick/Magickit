<script lang="ts">
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import { 
		Globe, 
		FileText, 
		Calendar, 
		ExternalLink, 
		Search,
		Home,
		Building,
		BookOpen,
		Shield,
		HelpCircle,
		Settings,
		Users
	} from '@lucide/svelte';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	// Category icons mapping
	const categoryIcons: Record<string, any> = {
		'Main': Home,
		'Company': Building,
		'Content': BookOpen,
		'Blog Posts': FileText,
		'Authentication': Users,
		'Support': HelpCircle,
		'Tools': Settings,
		'Legal': Shield
	};

	// Priority colors
	const priorityColors: Record<string, string> = {
		'high': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
		'medium': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
		'low': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
	};

	// Format date
	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	// Get category display name
	function getCategoryDisplayName(category: string) {
		return category;
	}

	// Filter out empty categories
	let categoriesWithPages = $derived(Object.entries(data.pagesByCategory).filter(([_, pages]) => pages.length > 0));
</script>

<svelte:head>
	<title>Sitemap | Magickit</title>
	<meta name="description" content="Complete sitemap of all pages and content on Magickit. Find all our pages, blog posts, and resources organized by category." />
	<meta property="og:title" content="Sitemap | Magickit" />
	<meta property="og:description" content="Complete sitemap of all pages and content on Magickit." />
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<!-- Header -->
	<div class="space-y-6 mb-8">
		<div class="space-y-2">
			<h1 class="text-2xl font-bold">Sitemap</h1>
			<p class="text-muted-foreground">
				Complete overview of all pages and content on our website. Find everything organized by category.
			</p>
		</div>

		<!-- Stats Overview -->
		<Card>
			<CardContent class="p-6">
				<div class="grid grid-cols-2 md:grid-cols-4 gap-6">
					<div class="text-center space-y-2">
						<div class="text-2xl font-bold text-primary">{data.totalPages}</div>
						<div class="text-sm text-muted-foreground">Total Pages</div>
					</div>
					<div class="text-center space-y-2">
						<div class="text-2xl font-bold text-primary">{data.stats.blogPosts}</div>
						<div class="text-sm text-muted-foreground">Blog Posts</div>
					</div>
					<div class="text-center space-y-2">
						<div class="text-2xl font-bold text-primary">{data.stats.portfolioItems}</div>
						<div class="text-sm text-muted-foreground">Portfolio Items</div>
					</div>
					<div class="text-center space-y-2">
						<div class="text-2xl font-bold text-primary">{data.stats.staticPages}</div>
						<div class="text-sm text-muted-foreground">Static Pages</div>
					</div>
				</div>
				
				<Separator class="my-4" />
				
				<div class="flex items-center justify-center gap-2 text-sm text-muted-foreground">
					<Calendar class="h-4 w-4" />
					<span>Last updated: {formatDate(data.lastUpdate)}</span>
				</div>
			</CardContent>
		</Card>

		<!-- Quick Search -->
		<Card>
			<CardContent class="p-4">
				<div class="flex items-center gap-2 text-sm text-muted-foreground">
					<Search class="h-4 w-4" />
					<span>Looking for something specific? Try our</span>
					<a href="/search" class="text-primary hover:underline font-medium">search page</a>
					<span>to find content across the entire site.</span>
				</div>
			</CardContent>
		</Card>
	</div>

	<!-- Sitemap Categories -->
	<div class="space-y-8">
		{#each categoriesWithPages as [categoryName, pages]}
			<Card>
				<CardHeader>
					<div class="flex items-center gap-3">
						{#if categoryIcons[categoryName] === Home}
							<Home class="h-5 w-5 text-primary" />
						{:else if categoryIcons[categoryName] === Building}
							<Building class="h-5 w-5 text-primary" />
						{:else if categoryIcons[categoryName] === BookOpen}
							<BookOpen class="h-5 w-5 text-primary" />
						{:else if categoryIcons[categoryName] === FileText}
							<FileText class="h-5 w-5 text-primary" />
						{:else if categoryIcons[categoryName] === Users}
							<Users class="h-5 w-5 text-primary" />
						{:else if categoryIcons[categoryName] === HelpCircle}
							<HelpCircle class="h-5 w-5 text-primary" />
						{:else if categoryIcons[categoryName] === Settings}
							<Settings class="h-5 w-5 text-primary" />
						{:else if categoryIcons[categoryName] === Shield}
							<Shield class="h-5 w-5 text-primary" />
						{:else}
							<Globe class="h-5 w-5 text-primary" />
						{/if}
						<div class="space-y-1">
							<CardTitle class="text-lg">{getCategoryDisplayName(categoryName)}</CardTitle>
							<CardDescription>
								{pages.length} page{pages.length !== 1 ? 's' : ''}
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent class="p-0">
					<div class="space-y-0">
						{#each pages as page, index}
							<div class="border-b last:border-b-0 p-4 hover:bg-muted/50 transition-colors duration-200">
								<div class="flex items-start justify-between gap-4">
									<div class="flex-1 space-y-2">
										<div class="flex items-center gap-2">
											<a 
												href={page.url} 
												class="font-medium text-primary hover:underline inline-flex items-center gap-1"
											>
												{page.title}
												<ExternalLink class="h-3 w-3" />
											</a>
											{#if page.priority}
												<Badge 
													variant="secondary" 
													class="text-xs {priorityColors[page.priority] || ''}"
												>
													{page.priority}
												</Badge>
											{/if}
										</div>
										
										{#if page.description}
											<p class="text-sm text-muted-foreground">
												{page.description}
											</p>
										{/if}
										
										<div class="flex items-center gap-4 text-xs text-muted-foreground">
											<div class="flex items-center gap-1">
												<Globe class="h-3 w-3" />
												<code class="bg-muted px-1 py-0.5 rounded text-xs">
													{page.url}
												</code>
											</div>
											<div class="flex items-center gap-1">
												<Calendar class="h-3 w-3" />
												<span>Updated {formatDate(page.lastModified)}</span>
											</div>
										</div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</CardContent>
			</Card>
		{/each}
	</div>

	<!-- Footer Information -->
	<div class="mt-12">
		<Card>
			<CardContent class="p-6 text-center space-y-4">
				<div class="space-y-2">
					<h3 class="font-semibold">Need Help Finding Something?</h3>
					<p class="text-sm text-muted-foreground">
						If you can't find what you're looking for in this sitemap, try using our search functionality 
						or contact our support team for assistance.
					</p>
				</div>
				
				<div class="flex flex-col sm:flex-row gap-2 justify-center">
					<a href="/search" class="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors duration-200 text-sm">
						<Search class="h-4 w-4 mr-2" />
						Search Site
					</a>
					<a href="/contact" class="inline-flex items-center justify-center px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md transition-colors duration-200 text-sm">
						<HelpCircle class="h-4 w-4 mr-2" />
						Contact Support
					</a>
				</div>
				
				<Separator class="my-4" />
				
				<div class="text-xs text-muted-foreground space-y-1">
					<p>This sitemap is automatically generated and updated regularly.</p>
					<p>For XML sitemap used by search engines, visit <code class="bg-muted px-1 py-0.5 rounded">/sitemap.xml</code></p>
				</div>
			</CardContent>
		</Card>
	</div>
</div>