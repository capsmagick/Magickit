<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
	import { Separator } from '$lib/components/ui/separator';
	import { 
		Calendar, 
		Clock, 
		User, 
		ArrowLeft,
		Share2,
		Twitter,
		Facebook,
		Linkedin,
		Link2,
		ArrowRight,
		Tag
	} from '@lucide/svelte';
	import type { BlogPost } from '$lib/db/models.js';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	interface Props {
		data: {
			post: BlogPost;
			relatedPosts: BlogPost[];
		};
	}

	let { data }: Props = $props();

	// Calculate reading time
	function calculateReadingTime(content: string): number {
		// Rough estimate: 200 words per minute
		const wordsPerMinute = 200;
		const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
		return Math.ceil(wordCount / wordsPerMinute);
	}

	// Format date
	function formatDate(date: Date | string) {
		const d = typeof date === 'string' ? new Date(date) : date;
		return d.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	// Get author initials
	function getAuthorInitials(name: string): string {
		return name
			.split(' ')
			.map(word => word.charAt(0))
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}

	// Social sharing functions
	function shareOnTwitter() {
		const url = encodeURIComponent($page.url.toString());
		const text = encodeURIComponent(`Check out this article: ${data.post.title}`);
		window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
	}

	function shareOnFacebook() {
		const url = encodeURIComponent($page.url.toString());
		window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
	}

	function shareOnLinkedIn() {
		const url = encodeURIComponent($page.url.toString());
		const title = encodeURIComponent(data.post.title);
		const summary = encodeURIComponent(data.post.excerpt);
		window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}&summary=${summary}`, '_blank');
	}

	function copyLink() {
		navigator.clipboard.writeText($page.url.toString()).then(() => {
			// You could add a toast notification here
			console.log('Link copied to clipboard');
		});
	}

	// Navigation functions
	function goBack() {
		goto('/blog');
	}

	function goToRelatedPost(post: BlogPost) {
		goto(`/blog/${post.slug}`);
	}

	// Derived values
	let readingTime = $derived(calculateReadingTime(data.post.content));
	let publishDate = $derived(formatDate(data.post.publishedAt || data.post.createdAt));
</script>

<svelte:head>
	<title>{data.post.title} | Magickit Blog</title>
	<meta name="description" content={data.post.excerpt} />
	
	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="article" />
	<meta property="og:title" content={data.post.title} />
	<meta property="og:description" content={data.post.excerpt} />
	<meta property="og:url" content={$page.url.toString()} />
	
	<!-- Twitter -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={data.post.title} />
	<meta name="twitter:description" content={data.post.excerpt} />
	
	<!-- SEO -->
	{#if data.post.seoTitle}
		<meta name="title" content={data.post.seoTitle} />
	{/if}
	{#if data.post.seoDescription}
		<meta name="description" content={data.post.seoDescription} />
	{/if}
	<link rel="canonical" href={$page.url.toString()} />
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<div class="max-w-4xl mx-auto space-y-8">
		<!-- Back Navigation -->
		<div class="flex items-center gap-2">
			<Button variant="ghost" onclick={goBack} class="transition-colors duration-200">
				<ArrowLeft class="mr-2 h-4 w-4" />
				Back to Blog
			</Button>
		</div>

		<!-- Article Header -->
		<header class="space-y-6">
			<!-- Article Meta -->
			<div class="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
				<div class="flex items-center gap-1">
					<Calendar class="h-4 w-4" />
					{publishDate}
				</div>
				<div class="flex items-center gap-1">
					<Clock class="h-4 w-4" />
					{readingTime} min read
				</div>
				{#if data.post.featured}
					<Badge variant="default" class="text-xs">
						Featured
					</Badge>
				{/if}
			</div>

			<!-- Article Title -->
			<h1 class="text-2xl lg:text-4xl font-bold leading-tight">
				{data.post.title}
			</h1>

			<!-- Article Excerpt -->
			<p class="text-lg text-muted-foreground leading-relaxed">
				{data.post.excerpt}
			</p>

			<!-- Tags -->
			{#if data.post.tags.length > 0}
				<div class="flex flex-wrap gap-2">
					{#each data.post.tags as tag}
						<Badge variant="secondary" class="text-xs">
							<Tag class="mr-1 h-3 w-3" />
							{tag}
						</Badge>
					{/each}
				</div>
			{/if}

			<!-- Author and Social Sharing -->
			<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4">
				<!-- Author Info -->
				<div class="flex items-center gap-3">
					<Avatar>
						<AvatarImage src="" alt="Author" />
						<AvatarFallback>
							{getAuthorInitials('Author Name')}
						</AvatarFallback>
					</Avatar>
					<div class="space-y-1">
						<div class="flex items-center gap-1 text-sm font-medium">
							<User class="h-3 w-3" />
							Author Name
						</div>
						<p class="text-xs text-muted-foreground">
							Published on {publishDate}
						</p>
					</div>
				</div>

				<!-- Social Sharing -->
				<div class="flex items-center gap-2">
					<span class="text-sm text-muted-foreground mr-2">Share:</span>
					<Button 
						variant="outline" 
						size="sm" 
						onclick={shareOnTwitter}
						class="transition-colors duration-200"
						aria-label="Share on Twitter"
					>
						<Twitter class="h-4 w-4" />
					</Button>
					<Button 
						variant="outline" 
						size="sm" 
						onclick={shareOnFacebook}
						class="transition-colors duration-200"
						aria-label="Share on Facebook"
					>
						<Facebook class="h-4 w-4" />
					</Button>
					<Button 
						variant="outline" 
						size="sm" 
						onclick={shareOnLinkedIn}
						class="transition-colors duration-200"
						aria-label="Share on LinkedIn"
					>
						<Linkedin class="h-4 w-4" />
					</Button>
					<Button 
						variant="outline" 
						size="sm" 
						onclick={copyLink}
						class="transition-colors duration-200"
						aria-label="Copy link"
					>
						<Link2 class="h-4 w-4" />
					</Button>
				</div>
			</div>

			<Separator />
		</header>

		<!-- Article Content -->
		<article class="prose prose-lg max-w-none">
			<div class="space-y-6 leading-relaxed" style="line-height: 1.5;">
				{@html data.post.content}
			</div>
		</article>

		<!-- Article Footer -->
		<footer class="space-y-6 pt-8">
			<Separator />
			
			<!-- Social Sharing (Bottom) -->
			<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div class="space-y-2">
					<p class="text-sm font-medium">Enjoyed this article?</p>
					<p class="text-sm text-muted-foreground">Share it with your network!</p>
				</div>
				<div class="flex items-center gap-2">
					<Button 
						variant="outline" 
						onclick={shareOnTwitter}
						class="transition-colors duration-200"
					>
						<Twitter class="mr-2 h-4 w-4" />
						Twitter
					</Button>
					<Button 
						variant="outline" 
						onclick={shareOnLinkedIn}
						class="transition-colors duration-200"
					>
						<Linkedin class="mr-2 h-4 w-4" />
						LinkedIn
					</Button>
					<Button 
						variant="outline" 
						onclick={copyLink}
						class="transition-colors duration-200"
					>
						<Share2 class="mr-2 h-4 w-4" />
						Copy Link
					</Button>
				</div>
			</div>
		</footer>

		<!-- Related Posts -->
		{#if data.relatedPosts.length > 0}
			<section class="space-y-6 pt-8">
				<Separator />
				<div class="space-y-4">
					<h2 class="text-2xl font-bold">Related Articles</h2>
					<p class="text-muted-foreground">
						Continue reading with these related posts
					</p>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{#each data.relatedPosts as relatedPost}
						<Card class="cursor-pointer transition-shadow duration-200 hover:shadow-md" onclick={() => goToRelatedPost(relatedPost)}>
							<CardHeader class="space-y-2">
								<div class="flex items-center justify-between text-sm text-muted-foreground">
									<div class="flex items-center gap-1">
										<Calendar class="h-3 w-3" />
										{formatDate(relatedPost.publishedAt || relatedPost.createdAt)}
									</div>
									<div class="flex items-center gap-1">
										<Clock class="h-3 w-3" />
										{calculateReadingTime(relatedPost.content)} min read
									</div>
								</div>
								<CardTitle class="text-lg leading-tight hover:text-primary transition-colors">
									{relatedPost.title}
								</CardTitle>
							</CardHeader>
							<CardContent class="space-y-4">
								<p class="text-muted-foreground text-sm leading-relaxed">
									{relatedPost.excerpt}
								</p>
								{#if relatedPost.tags.length > 0}
									<div class="flex flex-wrap gap-1">
										{#each relatedPost.tags.slice(0, 3) as tag}
											<Badge variant="secondary" class="text-xs">
												{tag}
											</Badge>
										{/each}
										{#if relatedPost.tags.length > 3}
											<Badge variant="outline" class="text-xs">
												+{relatedPost.tags.length - 3}
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

		<!-- Back to Blog -->
		<div class="text-center pt-8">
			<Button onclick={goBack} variant="outline" class="transition-colors duration-200">
				<ArrowLeft class="mr-2 h-4 w-4" />
				Back to All Posts
			</Button>
		</div>
	</div>
</div>

<style>
	/* Enhanced typography for article content */
	:global(.prose) {
		color: hsl(var(--foreground));
		line-height: 1.5;
	}

	:global(.prose h1) {
		font-size: 2rem;
		font-weight: 700;
		line-height: 1.2;
		margin-top: 2rem;
		margin-bottom: 1rem;
		color: hsl(var(--foreground));
	}

	:global(.prose h2) {
		font-size: 1.5rem;
		font-weight: 600;
		line-height: 1.3;
		margin-top: 1.5rem;
		margin-bottom: 0.75rem;
		color: hsl(var(--foreground));
	}

	:global(.prose h3) {
		font-size: 1.25rem;
		font-weight: 600;
		line-height: 1.4;
		margin-top: 1.25rem;
		margin-bottom: 0.5rem;
		color: hsl(var(--foreground));
	}

	:global(.prose p) {
		margin-bottom: 1rem;
		line-height: 1.5;
		color: hsl(var(--foreground));
	}

	:global(.prose ul, .prose ol) {
		margin-bottom: 1rem;
		padding-left: 1.5rem;
	}

	:global(.prose li) {
		margin-bottom: 0.25rem;
		line-height: 1.5;
	}

	:global(.prose blockquote) {
		border-left: 4px solid hsl(var(--primary));
		padding-left: 1rem;
		margin: 1.5rem 0;
		font-style: italic;
		color: hsl(var(--muted-foreground));
	}

	:global(.prose code) {
		background-color: hsl(var(--muted));
		padding: 0.125rem 0.25rem;
		border-radius: 0.25rem;
		font-size: 0.875rem;
		color: hsl(var(--foreground));
	}

	:global(.prose pre) {
		background-color: hsl(var(--muted));
		padding: 1rem;
		border-radius: 0.5rem;
		overflow-x: auto;
		margin: 1rem 0;
	}

	:global(.prose pre code) {
		background-color: transparent;
		padding: 0;
	}

	:global(.prose a) {
		color: hsl(var(--primary));
		text-decoration: underline;
		transition: color 0.2s;
	}

	:global(.prose a:hover) {
		color: hsl(var(--primary) / 0.8);
	}

	:global(.prose img) {
		max-width: 100%;
		height: auto;
		border-radius: 0.5rem;
		margin: 1.5rem 0;
	}

	:global(.prose table) {
		width: 100%;
		border-collapse: collapse;
		margin: 1.5rem 0;
	}

	:global(.prose th, .prose td) {
		border: 1px solid hsl(var(--border));
		padding: 0.5rem;
		text-align: left;
	}

	:global(.prose th) {
		background-color: hsl(var(--muted));
		font-weight: 600;
	}
</style>