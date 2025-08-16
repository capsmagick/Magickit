<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { authClient } from '$lib/auth/auth-client';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { generateBreadcrumbs, shouldShowBreadcrumbs } from '$lib/utils/breadcrumb.js';

	const session = authClient.useSession();

	// Custom labels for better UX
	const customLabels: Record<string, string> = {
		login: 'Sign In',
		signup: 'Sign Up',
		'my-account': 'My Account',
		about: 'About',
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

			<!-- Breadcrumbs for non-admin routes -->
			{#if showBreadcrumbs && breadcrumbs.length > 0}
				<div class="ml-6">
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

		<nav class="flex items-center space-x-4">
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
		</nav>
	</div>
</header>
