<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { 
		Search, 
		Calendar, 
		User, 
		ArrowRight,
		Clock,
		Tag
	} from '@lucide/svelte';
	import type { BlogPost } from '$lib/db/models.js';
	import { goto } from '$app/navigation';

	interface Props {
		data: {
			posts: BlogPost[];
			total: number;
			featuredPosts: BlogPost[];
		};
	}

	let { data }: Props = $props();

	// State
	let searchTerm = $state('');
	let selectedTag = $state('');

	// Get all unique tags from posts
	let allTags = $derived(() => {
		const tags = new Set<string>();
		data.posts.forEach(post => {
			post.tags.forEach(tag => tags.add(tag));
		});
		return Array.from(tags).sort();
	});

	// Filter posts based on search and tag
	let filteredPosts = $derived(() => {
		let filtered = data.posts;

		// Filter by search term
		if (searchTerm.trim()) {
			const query = searchTerm.toLowerCase();
			filtered = filtered.filter(post => 
				post.title.toLowerCase().includes(query) ||
				post.excerpt.toLowerCase().includes(query) ||
				post.tags.some(tag => tag.toLowerCase().includes(query))
			);
		}

		// Filter by selected tag
		if (selectedTag) {
			filtered = filtered.filter(post => post.tags.includes(selectedTag));
		}

		return filtered;
	});

	// Event handlers
	function handlePostClick(post: BlogPost) {
		goto(`/blog/${post.slug}`);
	}

	function handleTagClick(tag: string) {
		selectedTag = selectedTag === tag ? '' : tag;
	}

	function clearFilters() {
		searchTerm = '';
		selectedTag = '';
	}

	function formatDate(date: Date | string) {
		const d = typeof date === 'string' ? new Date(date) : date;
		return d.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function calculateReadingTime(content: string): number {
		// Rough estimate: 200 words per minute
		const wordsPerMinute = 200;
		const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
		return Math.ceil(wordCount / wordsPerMinute);
	}
</script>

<svelte:head>
	<title>Blog | Magickit</title>
	<meta name="description" content="Read our latest blog posts and insights" />
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<div class="space-y-8">
		<!-- Header -->
		<div class="text-center space-y-4">
			<h1 class="text-2xl lg:text-4xl font-bold">Our Blog</h1>
			<p class="text-lg text-muted-foreground max-w-2xl mx-auto">
				Discover insights, tutorials, and updates from our team
			</p>
		</div>

		<!-- Featured Posts -->
		{#if data.featuredPosts.length > 0}
			<section class="space-y-6">
				<h2 class="text-2xl font-bold">Featured Posts</h2>
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{#each data.featuredPosts as post}
						<Card class="cursor-pointer transition-shadow duration-200 hover:shadow-lg" onclick={() => handlePostClick(post)}>
							<CardHeader class="space-y-2">
								<div class="flex items-center justify-between text-sm text-muted-foreground">
									<div class="flex items-center gap-1">
										<Calendar class="h-3 w-3" />
										{formatDate(post.publishedAt || post.createdAt)}
									</div>
									<div class="flex items-center gap-1">
										<Clock class="h-3 w-3" />
										{calculateReadingTime(post.content)} min read
									</div>
								</div>
								<CardTitle class="text-lg leading-tight hover:text-primary transition-colors">
									{post.title}
								</CardTitle>
							</CardHeader>
							<CardContent class="space-y-4">
								<p class="text-muted-foreground text-sm leading-relaxed">
									{post.excerpt}
								</p>
								{#if post.tags.length > 0}
									<div class="flex flex-wrap gap-1">
										{#each post.tags.slice(0, 3) as tag}
											<Badge variant="secondary" class="text-xs">
												{tag}
											</Badge>
										{/each}
										{#if post.tags.length > 3}
											<Badge variant="outline" class="text-xs">
												+{post.tags.length - 3}
											</Badge>
										{/if}
									</div>
								{/if}
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-1 text-sm text-muted-foreground">
										<User class="h-3 w-3" />
										Author
									</div>
									<Button variant="ghost" size="sm" class="text-primary">
										Read More
										<ArrowRight class="ml-1 h-3 w-3" />
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
								placeholder="Search posts..." 
								class="pl-8" 
								bind:value={searchTerm} 
							/>
						</div>
					</div>
					<div class="flex gap-2">
						{#if searchTerm || selectedTag}
							<Button variant="outline" onclick={clearFilters}>
								Clear Filters
							</Button>
						{/if}
					</div>
				</div>

				<!-- Tag Filter -->
				{#if allTags.length > 0}
					<div class="mt-4 space-y-2">
						<p class="text-sm font-medium">Filter by tag:</p>
						<div class="flex flex-wrap gap-2">
							{#each allTags as tag}
								<Button
									variant={selectedTag === tag ? "default" : "outline"}
									size="sm"
									onclick={() => handleTagClick(tag)}
									class="text-xs"
								>
									<Tag class="mr-1 h-3 w-3" />
									{tag}
								</Button>
							{/each}
						</div>
					</div>
				{/if}
			</CardContent>
		</Card>

		<!-- All Posts -->
		<section class="space-y-6">
			<div class="flex items-center justify-between">
				<h2 class="text-2xl font-bold">
					{searchTerm || selectedTag ? 'Search Results' : 'All Posts'}
				</h2>
				<p class="text-muted-foreground">
					{filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'}
				</p>
			</div>

			{#if filteredPosts.length === 0}
				<Card>
					<CardContent class="p-12 text-center">
						<div class="space-y-4">
							<Search class="h-12 w-12 mx-auto text-muted-foreground" />
							<div class="space-y-2">
								<h3 class="text-lg font-semibold">No posts found</h3>
								<p class="text-muted-foreground">
									{searchTerm || selectedTag 
										? 'Try adjusting your search or filters.' 
										: 'Check back later for new content.'}
								</p>
							</div>
							{#if searchTerm || selectedTag}
								<Button onclick={clearFilters}>
									Clear Filters
								</Button>
							{/if}
						</div>
					</CardContent>
				</Card>
			{:else}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{#each filteredPosts as post}
						<Card class="cursor-pointer transition-shadow duration-200 hover:shadow-md" onclick={() => handlePostClick(post)}>
							<CardHeader class="space-y-2">
								<div class="flex items-center justify-between text-sm text-muted-foreground">
									<div class="flex items-center gap-1">
										<Calendar class="h-3 w-3" />
										{formatDate(post.publishedAt || post.createdAt)}
									</div>
									<div class="flex items-center gap-1">
										<Clock class="h-3 w-3" />
										{calculateReadingTime(post.content)} min read
									</div>
								</div>
								<CardTitle class="text-lg leading-tight hover:text-primary transition-colors">
									{post.title}
								</CardTitle>
							</CardHeader>
							<CardContent class="space-y-4">
								<p class="text-muted-foreground text-sm leading-relaxed">
									{post.excerpt}
								</p>
								{#if post.tags.length > 0}
									<div class="flex flex-wrap gap-1">
										{#each post.tags.slice(0, 3) as tag}
											<Badge 
												variant={selectedTag === tag ? "default" : "secondary"} 
												class="text-xs cursor-pointer"
												onclick={(e) => {
													e.stopPropagation();
													handleTagClick(tag);
												}}
											>
												{tag}
											</Badge>
										{/each}
										{#if post.tags.length > 3}
											<Badge variant="outline" class="text-xs">
												+{post.tags.length - 3}
											</Badge>
										{/if}
									</div>
								{/if}
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-1 text-sm text-muted-foreground">
										<User class="h-3 w-3" />
										Author
									</div>
									<Button variant="ghost" size="sm" class="text-primary">
										Read More
										<ArrowRight class="ml-1 h-3 w-3" />
									</Button>
								</div>
							</CardContent>
						</Card>
					{/each}
				</div>
			{/if}
		</section>

		<!-- Load More / Pagination would go here if needed -->
	</div>
</div>