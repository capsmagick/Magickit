<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { authClient } from '$lib/auth/auth-client';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { generateBreadcrumbs, shouldShowBreadcrumbs } from '$lib/utils/breadcrumb.js';
	import { Menu } from '@lucide/svelte';
	import { LightSwitch } from '$lib/components/ui/light-switch';

	let mobileMenuOpen = $state(false);

	const session = authClient.useSession();

	// Custom labels for better UX
	const customLabels: Record<string, string> = {
		login: 'Sign In',
		signup: 'Sign Up',
		'my-account': 'My Account',
		about: 'About',
		portfolio: 'Portfolio',
		contact: 'Contact',
		help: 'Help & Support'
	};

	// Generate dynamic breadcrumbs based on current route
	const breadcrumbs = $derived(
		generateBreadcrumbs($page.url.pathname, {
			customLabels,
			excludeSegments: ['admin']
		})
	);

	// Check if breadcrumbs should be shown
	const showBreadcrumbs = $derived(shouldShowBreadcrumbs($page.url.pathname, ['/admin']));

	async function handleSignOut() {
		await authClient.signOut();
		goto('/');
	}

	function handleLogin() {
		goto('/login');
	}

	function handleSignUp() {
		goto('/signup');
	}
</script>

<header class="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
	<div class="container flex h-16 items-center justify-between px-4">
		<div class="flex items-center space-x-4">
			<a href="/" class="text-xl font-bold"> MagicKit </a>

			<!-- Navigation Links -->
			<nav class="hidden md:flex items-center space-x-6 ml-6">
				<a href="/about" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
					About
				</a>
				<a href="/services" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
					Services
				</a>
				<a href="/portfolio" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
					Portfolio
				</a>
				<a href="/blog" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
					Blog
				</a>
				<a href="/contact" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
					Contact
				</a>
			</nav>

			<!-- Breadcrumbs for non-admin routes -->
			{#if showBreadcrumbs && breadcrumbs.length > 0}
				<div class="ml-4">
					<Breadcrumb.Root>
						<Breadcrumb.List>
							{#each breadcrumbs as breadcrumb, index}
								<Breadcrumb.Item>
									{#if breadcrumb.isCurrentPage}
										<Breadcrumb.Page>{breadcrumb.label}</Breadcrumb.Page>
									{:else}
										<Breadcrumb.Link href={breadcrumb.href}>
											{breadcrumb.label}
										</Breadcrumb.Link>
									{/if}
								</Breadcrumb.Item>
								{#if index < breadcrumbs.length - 1}
									<Breadcrumb.Separator />
								{/if}
							{/each}
						</Breadcrumb.List>
					</Breadcrumb.Root>
				</div>
			{/if}
		</div>

		<div class="flex items-center space-x-4">
			<!-- Mobile Menu Button -->
			<Button 
				variant="ghost" 
				size="icon" 
				class="md:hidden" 
				onclick={() => mobileMenuOpen = true}
			>
				<Menu class="h-5 w-5" />
				<span class="sr-only">Toggle menu</span>
			</Button>

			<!-- Mobile Menu Sheet -->
			<Sheet.Root bind:open={mobileMenuOpen}>
				<Sheet.Content side="left" class="w-80">
					<Sheet.Header>
						<Sheet.Title>Navigation</Sheet.Title>
					</Sheet.Header>
					<div class="flex flex-col space-y-4 mt-6">
						<a href="/about" class="text-sm font-medium hover:text-primary transition-colors" onclick={() => mobileMenuOpen = false}>
							About
						</a>
						<a href="/services" class="text-sm font-medium hover:text-primary transition-colors" onclick={() => mobileMenuOpen = false}>
							Services
						</a>
						<a href="/portfolio" class="text-sm font-medium hover:text-primary transition-colors" onclick={() => mobileMenuOpen = false}>
							Portfolio
						</a>
						<a href="/blog" class="text-sm font-medium hover:text-primary transition-colors" onclick={() => mobileMenuOpen = false}>
							Blog
						</a>
						<a href="/contact" class="text-sm font-medium hover:text-primary transition-colors" onclick={() => mobileMenuOpen = false}>
							Contact
						</a>
						{#if $session.data}
							<div class="border-t pt-4 space-y-4">
								<p class="text-sm text-muted-foreground">
									Welcome, {$session.data.user.name || $session.data.user.email}
								</p>
								{#if $session.data.user.role === 'admin'}
									<Button variant="outline" class="w-full justify-start" onclick={() => { goto('/admin'); mobileMenuOpen = false; }}>
										Admin Panel
									</Button>
								{/if}
								<Button variant="outline" class="w-full justify-start" onclick={() => { goto('/my-account'); mobileMenuOpen = false; }}>
									My Account
								</Button>
								<Button variant="outline" class="w-full justify-start" onclick={() => { handleSignOut(); mobileMenuOpen = false; }}>
									Sign Out
								</Button>
							</div>
						{:else}
							<div class="border-t pt-4 space-y-2">
								<Button variant="outline" class="w-full" onclick={() => { handleLogin(); mobileMenuOpen = false; }}>
									Login
								</Button>
								<Button class="w-full" onclick={() => { handleSignUp(); mobileMenuOpen = false; }}>
									Sign Up
								</Button>
							</div>
						{/if}
					</div>
				</Sheet.Content>
			</Sheet.Root>

			<!-- Desktop Navigation -->
			<nav class="hidden md:flex items-center space-x-4">
				{#if $session.data}
					<div class="flex items-center space-x-4">
						<span class="text-sm text-muted-foreground">
							Welcome, {$session.data.user.name || $session.data.user.email}
						</span>
						{#if $session.data.user.role === 'admin'}
							<Button variant="outline" onclick={() => goto('/admin')}>Admin Panel</Button>
						{/if}
						<Button variant="outline" onclick={() => goto('/my-account')}>My Account</Button>
						<Button variant="outline" onclick={handleSignOut}>Sign Out</Button>
					</div>
				{:else}
					<div class="flex items-center space-x-2">
						<Button variant="outline" onclick={handleLogin}>Login</Button>
						<Button onclick={handleSignUp}>Sign Up</Button>
						
					</div>
				{/if}
				<LightSwitch />
			</nav>
		</div>
	</div>
</header>
