<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '$lib/components/ui/dialog';
	import { 
		Search, 
		Filter,
		ExternalLink,
		Github,
		Calendar,
		Tag,
		Folder,
		Eye,
		X
	} from '@lucide/svelte';
	import type { PortfolioItem } from '$lib/db/models.js';
	import SEO from '$lib/components/SEO.svelte';
	import { generateProductSchema, generateBreadcrumbSchema } from '$lib/utils/seo';

	interface Props {
		data: {
			items: PortfolioItem[];
			featuredItems: PortfolioItem[];
			total: number;
			categories: string[];
			technologies: string[];
			filters: {
				category: string | null;
				technology: string | null;
			};
		};
	}

	let { data }: Props = $props();

	// State
	let searchTerm = $state('');
	let selectedCategory = $state(data.filters.category || '');
	let selectedTechnology = $state(data.filters.technology || '');
	let selectedItem = $state<PortfolioItem | null>(null);
	let isDialogOpen = $state(false);

	// Filter items based on search and filters
	let filteredItems = $derived(() => {
		let filtered = data.items;

		// Filter by search term
		if (searchTerm.trim()) {
			const query = searchTerm.toLowerCase();
			filtered = filtered.filter(item => 
				item.title.toLowerCase().includes(query) ||
				item.description.toLowerCase().includes(query) ||
				item.technologies.some(tech => tech.toLowerCase().includes(query)) ||
				item.category.toLowerCase().includes(query)
			);
		}

		// Filter by category
		if (selectedCategory) {
			filtered = filtered.filter(item => item.category === selectedCategory);
		}

		// Filter by technology
		if (selectedTechnology) {
			filtered = filtered.filter(item => item.technologies.includes(selectedTechnology));
		}

		return filtered;
	});

	// Event handlers
	function handleItemClick(item: PortfolioItem) {
		selectedItem = item;
		isDialogOpen = true;
	}

	function handleCategoryClick(category: string) {
		selectedCategory = selectedCategory === category ? '' : category;
	}

	function handleTechnologyClick(technology: string) {
		selectedTechnology = selectedTechnology === technology ? '' : technology;
	}

	function clearFilters() {
		searchTerm = '';
		selectedCategory = '';
		selectedTechnology = '';
	}

	function formatDate(date: Date | string) {
		const d = typeof date === 'string' ? new Date(date) : date;
		return d.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function openExternalLink(url: string) {
		window.open(url, '_blank', 'noopener,noreferrer');
	}

	// SEO and structured data
	const seoData = {
		title: 'Portfolio | MagicKit - Showcase of Projects',
		description: 'Explore our portfolio of web development projects, applications, and creative work built with modern technologies like SvelteKit, TypeScript, and more.',
		keywords: ['Portfolio', 'Web Development', 'Projects', 'SvelteKit', 'TypeScript', 'UI/UX Design'],
		ogType: 'website' as const
	};

	const portfolioSchemas = data.featuredItems.map(item => generateProductSchema({
		name: item.title,
		description: item.description,
		image: item.images[0],
		url: `/portfolio#${item._id}`,
		category: item.category,
		technologies: item.technologies
	}));

	const breadcrumbSchema = generateBreadcrumbSchema([
		{ name: 'Home', url: '/' },
		{ name: 'Portfolio', url: '/portfolio' }
	]);
</script>

<SEO 
	{...seoData}
	structuredData={[...portfolioSchemas, breadcrumbSchema]}
/>

<div class="container mx-auto px-4 py-8">
	<div class="space-y-8">
		<!-- Header -->
		<div class="text-center space-y-4">
			<h1 class="text-2xl lg:text-4xl font-bold">Our Portfolio</h1>
			<p class="text-lg text-muted-foreground max-w-2xl mx-auto">
				Discover our latest projects and creative work
			</p>
		</div>

		<!-- Featured Items -->
		{#if data.featuredItems.length > 0}
			<section class="space-y-6">
				<h2 class="text-2xl font-bold">Featured Projects</h2>
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{#each data.featuredItems as item}
						<Card class="cursor-pointer transition-shadow duration-200 hover:shadow-lg group" onclick={() => handleItemClick(item)}>
							<CardHeader class="p-0">
								{#if item.images.length > 0}
									<div class="relative overflow-hidden rounded-t-lg aspect-video bg-muted">
										<img 
											src={item.images[0]} 
											alt={item.title}
											class="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
											loading="lazy"
										/>
										<div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
											<Eye class="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
										</div>
									</div>
								{:else}
									<div class="aspect-video bg-muted rounded-t-lg flex items-center justify-center">
										<Folder class="h-12 w-12 text-muted-foreground" />
									</div>
								{/if}
							</CardHeader>
							<CardContent class="p-4 space-y-3">
								<div class="space-y-2">
									<CardTitle class="text-lg leading-tight group-hover:text-primary transition-colors">
										{item.title}
									</CardTitle>
									<p class="text-muted-foreground text-sm leading-relaxed line-clamp-2">
										{item.description}
									</p>
								</div>
								
								<div class="flex items-center gap-2 text-sm text-muted-foreground">
									<Folder class="h-3 w-3" />
									<span>{item.category}</span>
									<Calendar class="h-3 w-3 ml-2" />
									<span>{formatDate(item.createdAt)}</span>
								</div>

								{#if item.technologies.length > 0}
									<div class="flex flex-wrap gap-1">
										{#each item.technologies.slice(0, 3) as tech}
											<Badge variant="secondary" class="text-xs">
												{tech}
											</Badge>
										{/each}
										{#if item.technologies.length > 3}
											<Badge variant="outline" class="text-xs">
												+{item.technologies.length - 3}
											</Badge>
										{/if}
									</div>
								{/if}

								<div class="flex items-center justify-between pt-2">
									<div class="flex gap-2">
										{#if item.liveUrl}
											<Button 
												variant="ghost" 
												size="sm" 
												onclick={(e) => {
													e.stopPropagation();
													openExternalLink(item.liveUrl!);
												}}
												class="text-xs"
											>
												<ExternalLink class="h-3 w-3 mr-1" />
												Live
											</Button>
										{/if}
										{#if item.githubUrl}
											<Button 
												variant="ghost" 
												size="sm" 
												onclick={(e) => {
													e.stopPropagation();
													openExternalLink(item.githubUrl!);
												}}
												class="text-xs"
											>
												<Github class="h-3 w-3 mr-1" />
												Code
											</Button>
										{/if}
									</div>
									<Button variant="ghost" size="sm" class="text-primary text-xs">
										View Details
									</Button>
								</div>
							</CardContent>
						</Card>
					{/each}
				</div>
			</section>
		{/if}

		<!-- Search and Filter -->
		<Card>
			<CardContent class="p-4">
				<div class="flex flex-col sm:flex-row gap-4">
					<div class="flex-1">
						<div class="relative">
							<Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
							<Input 
								type="search" 
								placeholder="Search projects..." 
								class="pl-8" 
								bind:value={searchTerm} 
							/>
						</div>
					</div>
					<div class="flex gap-2">
						{#if searchTerm || selectedCategory || selectedTechnology}
							<Button variant="outline" onclick={clearFilters}>
								<X class="mr-2 h-4 w-4" />
								Clear Filters
							</Button>
						{/if}
					</div>
				</div>

				<!-- Category Filter -->
				{#if data.categories.length > 0}
					<div class="mt-4 space-y-2">
						<p class="text-sm font-medium">Filter by category:</p>
						<div class="flex flex-wrap gap-2">
							{#each data.categories as category}
								<Button
									variant={selectedCategory === category ? "default" : "outline"}
									size="sm"
									onclick={() => handleCategoryClick(category)}
									class="text-xs"
								>
									<Folder class="mr-1 h-3 w-3" />
									{category}
								</Button>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Technology Filter -->
				{#if data.technologies.length > 0}
					<div class="mt-4 space-y-2">
						<p class="text-sm font-medium">Filter by technology:</p>
						<div class="flex flex-wrap gap-2">
							{#each data.technologies as technology}
								<Button
									variant={selectedTechnology === technology ? "default" : "outline"}
									size="sm"
									onclick={() => handleTechnologyClick(technology)}
									class="text-xs"
								>
									<Tag class="mr-1 h-3 w-3" />
									{technology}
								</Button>
							{/each}
						</div>
					</div>
				{/if}
			</CardContent>
		</Card>

		<!-- All Items -->
		<section class="space-y-6">
			<div class="flex items-center justify-between">
				<h2 class="text-2xl font-bold">
					{searchTerm || selectedCategory || selectedTechnology ? 'Search Results' : 'All Projects'}
				</h2>
				<p class="text-muted-foreground">
					{filteredItems.length} {filteredItems.length === 1 ? 'project' : 'projects'}
				</p>
			</div>

			{#if filteredItems.length === 0}
				<Card>
					<CardContent class="p-12 text-center">
						<div class="space-y-4">
							<Search class="h-12 w-12 mx-auto text-muted-foreground" />
							<div class="space-y-2">
								<h3 class="text-lg font-semibold">No projects found</h3>
								<p class="text-muted-foreground">
									{searchTerm || selectedCategory || selectedTechnology 
										? 'Try adjusting your search or filters.' 
										: 'Check back later for new projects.'}
								</p>
							</div>
							{#if searchTerm || selectedCategory || selectedTechnology}
								<Button onclick={clearFilters}>
									Clear Filters
								</Button>
							{/if}
						</div>
					</CardContent>
				</Card>
			{:else}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{#each filteredItems as item}
						<Card class="cursor-pointer transition-shadow duration-200 hover:shadow-md group" onclick={() => handleItemClick(item)}>
							<CardHeader class="p-0">
								{#if item.images.length > 0}
									<div class="relative overflow-hidden rounded-t-lg aspect-video bg-muted">
										<img 
											src={item.images[0]} 
											alt={item.title}
											class="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
											loading="lazy"
										/>
										<div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
											<Eye class="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
										</div>
									</div>
								{:else}
									<div class="aspect-video bg-muted rounded-t-lg flex items-center justify-center">
										<Folder class="h-12 w-12 text-muted-foreground" />
									</div>
								{/if}
							</CardHeader>
							<CardContent class="p-4 space-y-3">
								<div class="space-y-2">
									<CardTitle class="text-lg leading-tight group-hover:text-primary transition-colors">
										{item.title}
									</CardTitle>
									<p class="text-muted-foreground text-sm leading-relaxed line-clamp-2">
										{item.description}
									</p>
								</div>
								
								<div class="flex items-center gap-2 text-sm text-muted-foreground">
									<Folder class="h-3 w-3" />
									<button 
										type="button"
										class="cursor-pointer hover:text-primary transition-colors bg-transparent border-none p-0 text-inherit font-inherit"
										onclick={(e) => {
											e.stopPropagation();
											handleCategoryClick(item.category);
										}}
									>
										{item.category}
									</button>
									<Calendar class="h-3 w-3 ml-2" />
									<span>{formatDate(item.createdAt)}</span>
								</div>

								{#if item.technologies.length > 0}
									<div class="flex flex-wrap gap-1">
										{#each item.technologies.slice(0, 3) as tech}
											<Badge 
												variant={selectedTechnology === tech ? "default" : "secondary"} 
												class="text-xs cursor-pointer transition-colors hover:bg-primary hover:text-primary-foreground"
												onclick={(e) => {
													e.stopPropagation();
													handleTechnologyClick(tech);
												}}
											>
												{tech}
											</Badge>
										{/each}
										{#if item.technologies.length > 3}
											<Badge variant="outline" class="text-xs">
												+{item.technologies.length - 3}
											</Badge>
										{/if}
									</div>
								{/if}

								<div class="flex items-center justify-between pt-2">
									<div class="flex gap-2">
										{#if item.liveUrl}
											<Button 
												variant="ghost" 
												size="sm" 
												onclick={(e) => {
													e.stopPropagation();
													openExternalLink(item.liveUrl!);
												}}
												class="text-xs"
											>
												<ExternalLink class="h-3 w-3 mr-1" />
												Live
											</Button>
										{/if}
										{#if item.githubUrl}
											<Button 
												variant="ghost" 
												size="sm" 
												onclick={(e) => {
													e.stopPropagation();
													openExternalLink(item.githubUrl!);
												}}
												class="text-xs"
											>
												<Github class="h-3 w-3 mr-1" />
												Code
											</Button>
										{/if}
									</div>
									<Button variant="ghost" size="sm" class="text-primary text-xs">
										View Details
									</Button>
								</div>
							</CardContent>
						</Card>
					{/each}
				</div>
			{/if}
		</section>
	</div>
</div>

<!-- Portfolio Item Detail Modal -->
<Dialog bind:open={isDialogOpen}>
	<DialogContent class="max-w-4xl max-h-[90vh] overflow-y-auto">
		{#if selectedItem}
			<DialogHeader class="space-y-4">
				<DialogTitle class="text-2xl">{selectedItem.title}</DialogTitle>
				
				<!-- Image Gallery -->
				{#if selectedItem.images.length > 0}
					<div class="space-y-4">
						<div class="aspect-video rounded-lg overflow-hidden bg-muted">
							<img 
								src={selectedItem.images[0]} 
								alt={selectedItem.title}
								class="w-full h-full object-cover"
							/>
						</div>
						{#if selectedItem.images.length > 1}
							<div class="grid grid-cols-4 gap-2">
								{#each selectedItem.images.slice(1, 5) as image, index}
									<div class="aspect-video rounded overflow-hidden bg-muted cursor-pointer hover:opacity-80 transition-opacity">
										<img 
											src={image} 
											alt="{selectedItem.title} - Image {index + 2}"
											class="w-full h-full object-cover"
										/>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{/if}
			</DialogHeader>

			<div class="space-y-6">
				<!-- Project Info -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div class="space-y-4">
						<div>
							<h3 class="text-lg font-semibold mb-2">Description</h3>
							<p class="text-muted-foreground leading-relaxed">
								{selectedItem.description}
							</p>
						</div>

						<div>
							<h3 class="text-lg font-semibold mb-2">Category</h3>
							<Badge variant="outline" class="text-sm">
								<Folder class="mr-1 h-3 w-3" />
								{selectedItem.category}
							</Badge>
						</div>

						<div>
							<h3 class="text-lg font-semibold mb-2">Created</h3>
							<div class="flex items-center gap-1 text-muted-foreground">
								<Calendar class="h-4 w-4" />
								{formatDate(selectedItem.createdAt)}
							</div>
						</div>
					</div>

					<div class="space-y-4">
						{#if selectedItem.technologies.length > 0}
							<div>
								<h3 class="text-lg font-semibold mb-2">Technologies</h3>
								<div class="flex flex-wrap gap-2">
									{#each selectedItem.technologies as tech}
										<Badge variant="secondary">
											<Tag class="mr-1 h-3 w-3" />
											{tech}
										</Badge>
									{/each}
								</div>
							</div>
						{/if}

						<div class="space-y-3">
							<h3 class="text-lg font-semibold">Links</h3>
							<div class="flex flex-col gap-2">
								{#if selectedItem.liveUrl}
									<Button 
										variant="outline" 
										onclick={() => openExternalLink(selectedItem!.liveUrl!)}
										class="justify-start"
									>
										<ExternalLink class="mr-2 h-4 w-4" />
										View Live Project
									</Button>
								{/if}
								{#if selectedItem.githubUrl}
									<Button 
										variant="outline" 
										onclick={() => openExternalLink(selectedItem!.githubUrl!)}
										class="justify-start"
									>
										<Github class="mr-2 h-4 w-4" />
										View Source Code
									</Button>
								{/if}
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</DialogContent>
</Dialog>

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>