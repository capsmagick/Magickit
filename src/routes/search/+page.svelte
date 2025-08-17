<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import { 
		Search, 
		Filter, 
		Calendar, 
		User, 
		ExternalLink, 
		FileText, 
		Briefcase, 
		Globe,
		ChevronLeft,
		ChevronRight
	} from '@lucide/svelte';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	let searchQuery = $state(data.query);
	let selectedType = $state(data.filters.type);
	let selectedSort = $state(data.filters.sortBy);

	// Handle search form submission
	function handleSearch(event: Event) {
		event.preventDefault();
		if (!searchQuery.trim()) return;
		
		const params = new URLSearchParams();
		params.set('q', searchQuery.trim());
		if (selectedType !== 'all') params.set('type', selectedType);
		if (selectedSort !== 'relevance') params.set('sort', selectedSort);
		
		goto(`/search?${params.toString()}`);
	}

	// Handle filter changes
	function handleFilterChange() {
		const params = new URLSearchParams($page.url.searchParams);
		if (selectedType !== 'all') {
			params.set('type', selectedType);
		} else {
			params.delete('type');
		}
		if (selectedSort !== 'relevance') {
			params.set('sort', selectedSort);
		} else {
			params.delete('sort');
		}
		params.delete('page'); // Reset to first page when filters change
		
		goto(`/search?${params.toString()}`);
	}

	// Handle pagination
	function goToPage(pageNum: number) {
		const params = new URLSearchParams($page.url.searchParams);
		if (pageNum > 1) {
			params.set('page', pageNum.toString());
		} else {
			params.delete('page');
		}
		goto(`/search?${params.toString()}`);
	}

	// Handle suggestion click
	function handleSuggestionClick(suggestion: string) {
		searchQuery = suggestion;
		handleSearch();
	}

	// Format date
	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	// Get result type counts for display
	let resultCounts = $derived({
		all: data.results.total,
		blog: data.results.blog.total,
		portfolio: data.results.portfolio.total,
		pages: data.results.pages.total
	});

	// Determine which results to show based on selected type
	let displayResults = $derived((() => {
		const results: any[] = [];
		
		if (selectedType === 'all' || selectedType === 'blog') {
			results.push(...data.results.blog.posts.map(post => ({ ...post, resultType: 'blog' })));
		}
		
		if (selectedType === 'all' || selectedType === 'portfolio') {
			results.push(...data.results.portfolio.items.map(item => ({ ...item, resultType: 'portfolio' })));
		}
		
		if (selectedType === 'all' || selectedType === 'pages') {
			results.push(...data.results.pages.pages.map(page => ({ ...page, resultType: 'page' })));
		}
		
		return results;
	})());
</script>

<svelte:head>
	<title>Search Results{data.query ? ` for "${data.query}"` : ''} | Magickit</title>
	<meta name="description" content="Search results for {data.query || 'your query'} across blog posts, portfolio items, and pages." />
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<!-- Search Header -->
	<div class="space-y-6">
		<div class="space-y-2">
			<h1 class="text-2xl font-bold">Search Results</h1>
			{#if data.query}
				<p class="text-muted-foreground">
					Found {data.results.total} result{data.results.total !== 1 ? 's' : ''} for "{data.query}"
				</p>
			{:else}
				<p class="text-muted-foreground">Enter a search term to find content</p>
			{/if}
		</div>

		<!-- Search Form -->
		<Card>
			<CardContent class="p-4">
				<form onsubmit={handleSearch} class="space-y-4">
					<div class="flex gap-2">
						<div class="relative flex-1">
							<Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
							<Input
								type="search"
								placeholder="Search blog posts, portfolio items, and pages..."
								class="pl-8"
								bind:value={searchQuery}
							/>
						</div>
						<Button type="submit">Search</Button>
					</div>

					<!-- Filters -->
					<div class="flex flex-col sm:flex-row gap-4">
						<div class="flex items-center gap-2">
							<Filter class="h-4 w-4 text-muted-foreground" />
							<span class="text-sm font-medium">Type:</span>
							<select 
								bind:value={selectedType} 
								onchange={handleFilterChange}
								class="text-sm border rounded px-2 py-1"
							>
								<option value="all">All ({resultCounts.all})</option>
								<option value="blog">Blog ({resultCounts.blog})</option>
								<option value="portfolio">Portfolio ({resultCounts.portfolio})</option>
								<option value="pages">Pages ({resultCounts.pages})</option>
							</select>
						</div>

						<div class="flex items-center gap-2">
							<span class="text-sm font-medium">Sort:</span>
							<select 
								bind:value={selectedSort} 
								onchange={handleFilterChange}
								class="text-sm border rounded px-2 py-1"
							>
								<option value="relevance">Relevance</option>
								<option value="date">Date</option>
								<option value="title">Title</option>
							</select>
						</div>
					</div>
				</form>
			</CardContent>
		</Card>

		<!-- Search Suggestions -->
		{#if data.suggestions.length > 0 && data.query}
			<Card>
				<CardContent class="p-4">
					<div class="space-y-2">
						<p class="text-sm font-medium">Related searches:</p>
						<div class="flex flex-wrap gap-2">
							{#each data.suggestions as suggestion}
								<Button
									variant="outline"
									size="sm"
									onclick={() => handleSuggestionClick(suggestion)}
									class="text-xs"
								>
									{suggestion}
								</Button>
							{/each}
						</div>
					</div>
				</CardContent>
			</Card>
		{/if}
	</div>

	<!-- Search Results -->
	<div class="mt-8">
		{#if data.query && displayResults.length === 0}
			<!-- No Results -->
			<Card>
				<CardContent class="p-12 text-center">
					<Search class="h-12 w-12 mx-auto text-muted-foreground mb-4" />
					<h3 class="text-lg font-semibold mb-2">No results found</h3>
					<p class="text-muted-foreground mb-4">
						We couldn't find anything matching "{data.query}". Try adjusting your search terms.
					</p>
					<div class="space-y-2">
						<p class="text-sm font-medium">Suggestions:</p>
						<ul class="text-sm text-muted-foreground space-y-1">
							<li>• Check your spelling</li>
							<li>• Try different keywords</li>
							<li>• Use more general terms</li>
							<li>• Browse our <a href="/blog" class="text-primary hover:underline">blog</a> or <a href="/portfolio" class="text-primary hover:underline">portfolio</a></li>
						</ul>
					</div>
				</CardContent>
			</Card>
		{:else if displayResults.length > 0}
			<!-- Results Grid -->
			<div class="space-y-6">
				{#each displayResults as result}
					<Card class="transition-shadow duration-200 hover:shadow-md">
						<CardContent class="p-6">
							<div class="flex items-start justify-between gap-4">
								<div class="flex-1 space-y-2">
									<!-- Result Type Badge -->
									<div class="flex items-center gap-2">
										{#if result.resultType === 'blog'}
											<FileText class="h-4 w-4 text-primary" />
											<Badge variant="secondary">Blog Post</Badge>
										{:else if result.resultType === 'portfolio'}
											<Briefcase class="h-4 w-4 text-primary" />
											<Badge variant="secondary">Portfolio</Badge>
										{:else}
											<Globe class="h-4 w-4 text-primary" />
											<Badge variant="secondary">Page</Badge>
										{/if}
									</div>

									<!-- Title and Link -->
									<div>
										{#if result.resultType === 'blog'}
											<a 
												href="/blog/{result.slug}" 
												class="text-lg font-semibold text-primary hover:underline"
											>
												{result.title}
											</a>
										{:else if result.resultType === 'portfolio'}
											<h3 class="text-lg font-semibold">{result.title}</h3>
										{:else}
											<a 
												href={result.url} 
												class="text-lg font-semibold text-primary hover:underline inline-flex items-center gap-1"
											>
												{result.title}
												<ExternalLink class="h-4 w-4" />
											</a>
										{/if}
									</div>

									<!-- Description/Excerpt -->
									<p class="text-muted-foreground">
										{#if result.resultType === 'blog'}
											{result.excerpt}
										{:else if result.resultType === 'portfolio'}
											{result.description}
										{:else}
											{result.description}
										{/if}
									</p>

									<!-- Metadata -->
									<div class="flex items-center gap-4 text-sm text-muted-foreground">
										{#if result.resultType === 'blog'}
											<div class="flex items-center gap-1">
												<Calendar class="h-3 w-3" />
												{formatDate(result.publishedAt || result.createdAt)}
											</div>
											{#if result.tags && result.tags.length > 0}
												<div class="flex items-center gap-1">
													<span>Tags:</span>
													{#each result.tags.slice(0, 3) as tag}
														<Badge variant="outline" class="text-xs">{tag}</Badge>
													{/each}
													{#if result.tags.length > 3}
														<span class="text-xs">+{result.tags.length - 3} more</span>
													{/if}
												</div>
											{/if}
										{:else if result.resultType === 'portfolio'}
											<div class="flex items-center gap-1">
												<Calendar class="h-3 w-3" />
												{formatDate(result.createdAt)}
											</div>
											{#if result.technologies && result.technologies.length > 0}
												<div class="flex items-center gap-1">
													<span>Tech:</span>
													{#each result.technologies.slice(0, 3) as tech}
														<Badge variant="outline" class="text-xs">{tech}</Badge>
													{/each}
													{#if result.technologies.length > 3}
														<span class="text-xs">+{result.technologies.length - 3} more</span>
													{/if}
												</div>
											{/if}
										{/if}
									</div>

									<!-- Action Links -->
									<div class="flex items-center gap-2 pt-2">
										{#if result.resultType === 'blog'}
											<Button variant="outline" size="sm" href="/blog/{result.slug}">
												Read More
											</Button>
										{:else if result.resultType === 'portfolio'}
											{#if result.liveUrl}
												<Button variant="outline" size="sm" href={result.liveUrl} target="_blank">
													<ExternalLink class="h-3 w-3 mr-1" />
													View Live
												</Button>
											{/if}
											{#if result.githubUrl}
												<Button variant="outline" size="sm" href={result.githubUrl} target="_blank">
													<ExternalLink class="h-3 w-3 mr-1" />
													GitHub
												</Button>
											{/if}
										{:else}
											<Button variant="outline" size="sm" href={result.url}>
												Visit Page
											</Button>
										{/if}
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				{/each}
			</div>

			<!-- Pagination -->
			{#if data.pagination.totalPages > 1}
				<div class="mt-8">
					<Card>
						<CardContent class="p-4">
							<div class="flex items-center justify-between">
								<p class="text-sm text-muted-foreground">
									Page {data.pagination.page} of {data.pagination.totalPages}
								</p>
								
								<div class="flex items-center gap-2">
									<Button
										variant="outline"
										size="sm"
										onclick={() => goToPage(data.pagination.page - 1)}
										disabled={data.pagination.page <= 1}
									>
										<ChevronLeft class="h-4 w-4 mr-1" />
										Previous
									</Button>
									
									<Button
										variant="outline"
										size="sm"
										onclick={() => goToPage(data.pagination.page + 1)}
										disabled={data.pagination.page >= data.pagination.totalPages}
									>
										Next
										<ChevronRight class="h-4 w-4 ml-1" />
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			{/if}
		{/if}
	</div>
</div>