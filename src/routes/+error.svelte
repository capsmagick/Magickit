<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { 
		Search, 
		Home, 
		ArrowLeft, 
		FileQuestion,
		Mail,
		ExternalLink,
		RefreshCw,
		ChevronRight
	} from '@lucide/svelte';

	// Popular pages for navigation
	const popularPages = [
		{ title: 'Home', href: '/', description: 'Return to the homepage' },
		{ title: 'About', href: '/about', description: 'Learn more about MagicKit' },
		{ title: 'Services', href: '/services', description: 'Explore our services' },
		{ title: 'Contact', href: '/contact', description: 'Get in touch with us' },
		{ title: 'Help Center', href: '/help', description: 'Find answers and support' },
		{ title: 'Blog', href: '/blog', description: 'Read our latest articles' }
	];

	// Quick help links
	const helpLinks = [
		{ title: 'Getting Started', href: '/help#getting-started' },
		{ title: 'Documentation', href: '/help#documentation' },
		{ title: 'FAQ', href: '/help#faq' },
		{ title: 'Contact Support', href: '/contact' }
	];

	let searchQuery = $state('');

	// Get error details from page store
	let error = $derived($page.error);
	let status = $derived($page.status);

	function handleSearch() {
		if (searchQuery.trim()) {
			goto(`/help?search=${encodeURIComponent(searchQuery.trim())}`);
		}
	}

	function handleGoHome() {
		goto('/');
	}

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

	function handleContact() {
		goto('/contact');
	}

	// Determine error type and message
	let errorTitle = $derived(status === 404 ? 'Page Not Found' : 'Something Went Wrong');
	let errorMessage = $derived(status === 404 
		? "The page you're looking for doesn't exist or has been moved."
		: error?.message || 'An unexpected error occurred. Please try again.');
</script>

<svelte:head>
	<title>{errorTitle} | MagicKit</title>
	<meta name="description" content="Page not found - The page you're looking for doesn't exist. Find what you need with our search or browse popular pages." />
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="container mx-auto px-4 py-6">
	<!-- Breadcrumb Navigation -->
	<div class="mb-8">
		<Breadcrumb.Root>
			<Breadcrumb.List>
				<Breadcrumb.Item>
					<Breadcrumb.Link href="/" class="flex items-center gap-2">
						<Home class="h-4 w-4" />
						Home
					</Breadcrumb.Link>
				</Breadcrumb.Item>
				<Breadcrumb.Separator>
					<ChevronRight class="h-4 w-4" />
				</Breadcrumb.Separator>
				<Breadcrumb.Item>
					<Breadcrumb.Page>Error {status}</Breadcrumb.Page>
				</Breadcrumb.Item>
			</Breadcrumb.List>
		</Breadcrumb.Root>
	</div>

	<!-- Error Content -->
	<div class="max-w-4xl mx-auto">
		<!-- Main Error Section -->
		<section class="text-center mb-12">
			<div class="space-y-6">
				<div class="flex justify-center">
					<div class="p-6 rounded-lg bg-destructive/10">
						<FileQuestion class="h-16 w-16 text-destructive" />
					</div>
				</div>
				<div class="space-y-4">
					<div class="space-y-2">
						<h1 class="text-2xl md:text-4xl lg:text-5xl font-bold tracking-tight">
							{errorTitle}
						</h1>
						<p class="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
							{errorMessage}
						</p>
					</div>
					{#if status === 404}
						<p class="text-sm text-muted-foreground">
							Error Code: 404 | The requested URL was not found on this server.
						</p>
					{:else}
						<p class="text-sm text-muted-foreground">
							Error Code: {status} | {error?.message || 'Unknown error'}
						</p>
					{/if}
				</div>
			</div>
		</section>

		<!-- Action Buttons -->
		<section class="mb-12">
			<div class="flex flex-col sm:flex-row gap-4 justify-center">
				<Button onclick={handleGoHome} class="transition-colors duration-200">
					<Home class="mr-2 h-4 w-4" />
					Go Home
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
		</section>

		<!-- Search Section -->
		<section class="mb-12">
			<Card.Root class="max-w-2xl mx-auto">
				<Card.Header class="text-center">
					<Card.Title class="text-xl">Search for What You Need</Card.Title>
					<Card.Description>
						Can't find what you're looking for? Try searching our site or help center.
					</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-4">
					<form onsubmit={(e) => { e.preventDefault(); handleSearch(); }} class="flex gap-2">
						<div class="relative flex-1">
							<Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								type="search"
								placeholder="Search pages, articles, or help topics..."
								bind:value={searchQuery}
								class="pl-10 transition-colors duration-200"
							/>
						</div>
						<Button type="submit" class="transition-colors duration-200">
							Search
						</Button>
					</form>
					<div class="flex flex-wrap gap-2 justify-center">
						{#each helpLinks as link}
							<Button variant="ghost" size="sm" onclick={() => goto(link.href)} class="transition-colors duration-200">
								{link.title}
							</Button>
						{/each}
					</div>
				</Card.Content>
			</Card.Root>
		</section>

		<!-- Popular Pages -->
		<section class="mb-12">
			<div class="text-center space-y-4 mb-8">
				<h2 class="text-2xl font-bold">Popular Pages</h2>
				<p class="text-muted-foreground">
					Here are some popular pages that might help you find what you're looking for.
				</p>
			</div>
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{#each popularPages as page}
					<Card.Root class="transition-shadow duration-200 hover:shadow-md cursor-pointer" onclick={() => goto(page.href)}>
						<Card.Content class="p-6 space-y-3">
							<div class="space-y-2">
								<h3 class="text-lg font-semibold">{page.title}</h3>
								<p class="text-sm text-muted-foreground leading-relaxed">
									{page.description}
								</p>
							</div>
							<div class="pt-2">
								<Button variant="ghost" size="sm" class="p-0 h-auto font-medium text-primary">
									Visit Page
									<ExternalLink class="ml-1 h-3 w-3" />
								</Button>
							</div>
						</Card.Content>
					</Card.Root>
				{/each}
			</div>
		</section>

		<!-- Help Section -->
		<section class="text-center">
			<Card.Root class="max-w-2xl mx-auto">
				<Card.Content class="p-8 space-y-6">
					<div class="flex justify-center">
						<div class="p-3 rounded-lg bg-primary/10">
							<Mail class="h-8 w-8 text-primary" />
						</div>
					</div>
					<div class="space-y-4">
						<h2 class="text-2xl font-bold">Still Can't Find What You Need?</h2>
						<p class="text-muted-foreground leading-relaxed">
							Our support team is here to help. Contact us and we'll get back to you as soon as possible.
						</p>
					</div>
					<div class="flex flex-col sm:flex-row gap-4 justify-center">
						<Button onclick={handleContact} class="transition-colors duration-200">
							<Mail class="mr-2 h-4 w-4" />
							Contact Support
						</Button>
						<Button variant="outline" onclick={() => goto('/help')} class="transition-colors duration-200">
							<ExternalLink class="mr-2 h-4 w-4" />
							Visit Help Center
						</Button>
					</div>
					<div class="pt-4 border-t border-border text-sm text-muted-foreground">
						<p>
							You can also check our 
							<button onclick={() => goto('/help')} class="text-primary hover:underline">help center</button>
							or browse our 
							<button onclick={() => goto('/blog')} class="text-primary hover:underline">blog</button>
							for more information.
						</p>
					</div>
				</Card.Content>
			</Card.Root>
		</section>
	</div>
</div>