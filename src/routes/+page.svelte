<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { authClient } from '$lib/auth/auth-client';
	import { goto } from '$app/navigation';
	import { Shield, Users, Palette, Zap, Lock, Code } from '@lucide/svelte';

	const session = authClient.useSession();

	function handleGetStarted() {
		if ($session.data) {
			goto('/my-account');
		} else {
			goto('/signup');
		}
	}
</script>

<div class="container mx-auto px-4 py-6">
	<!-- Hero Section -->
	<section class="text-center space-y-6 py-12">
		<div class="space-y-4">
			<h1 class="text-2xl md:text-4xl lg:text-5xl font-bold tracking-tight">
				Welcome to MagicKit
			</h1>
			<p class="mx-auto max-w-2xl text-lg text-muted-foreground leading-relaxed">
				A powerful universal web application template built with SvelteKit, Better Auth, and modern UI components
			</p>
		</div>

		{#if $session.data}
			<Card.Root class="mx-auto max-w-md">
				<Card.Header class="space-y-2">
					<Card.Title class="text-2xl">Welcome back!</Card.Title>
					<Card.Description class="text-sm">
						You are signed in as {$session.data.user.name || $session.data.user.email}
					</Card.Description>
				</Card.Header>
				<Card.Content class="p-4 space-y-4">
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium">Role:</span>
						<Badge variant={$session.data.user.role === 'admin' ? 'default' : 'secondary'}>
							{$session.data.user.role || 'user'}
						</Badge>
					</div>
					<div class="flex gap-2">
						{#if $session.data.user.role === 'admin'}
							<Button onclick={() => goto('/admin')} class="flex-1 transition-colors duration-200">
								Admin Panel
							</Button>
						{/if}
						<Button variant="outline" onclick={() => goto('/my-account')} class="flex-1 transition-colors duration-200">
							My Account
						</Button>
					</div>
				</Card.Content>
			</Card.Root>
		{:else}
			<Card.Root class="mx-auto max-w-md">
				<Card.Header class="space-y-2">
					<Card.Title class="text-2xl">Get Started</Card.Title>
					<Card.Description class="text-sm">
						Sign up or sign in to access your account
					</Card.Description>
				</Card.Header>
				<Card.Content class="p-4 space-y-4">
					<Button onclick={() => goto('/signup')} class="w-full transition-colors duration-200">
						Create Account
					</Button>
					<Button variant="outline" onclick={() => goto('/login')} class="w-full transition-colors duration-200">
						Sign In
					</Button>
				</Card.Content>
			</Card.Root>
		{/if}
	</section>

	<!-- Features Section -->
	<section class="py-16">
		<div class="text-center space-y-4 mb-12">
			<h2 class="text-2xl lg:text-3xl font-bold">Everything You Need</h2>
			<p class="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
				Built with modern technologies and best practices for rapid development
			</p>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			<Card.Root class="transition-shadow duration-200 hover:shadow-md">
				<Card.Header class="space-y-2">
					<div class="flex items-center gap-3">
						<div class="p-2 rounded-lg bg-primary/10">
							<Shield class="h-6 w-6 text-primary" />
						</div>
						<Card.Title class="text-lg">Authentication</Card.Title>
					</div>
				</Card.Header>
				<Card.Content class="p-4">
					<p class="text-muted-foreground text-sm leading-relaxed">
						Secure email/password and social authentication with Better Auth
					</p>
				</Card.Content>
			</Card.Root>

			<Card.Root class="transition-shadow duration-200 hover:shadow-md">
				<Card.Header class="space-y-2">
					<div class="flex items-center gap-3">
						<div class="p-2 rounded-lg bg-primary/10">
							<Users class="h-6 w-6 text-primary" />
						</div>
						<Card.Title class="text-lg">User Management</Card.Title>
					</div>
				</Card.Header>
				<Card.Content class="p-4">
					<p class="text-muted-foreground text-sm leading-relaxed">
						Admin panel for managing users, roles, and permissions
					</p>
				</Card.Content>
			</Card.Root>

			<Card.Root class="transition-shadow duration-200 hover:shadow-md">
				<Card.Header class="space-y-2">
					<div class="flex items-center gap-3">
						<div class="p-2 rounded-lg bg-primary/10">
							<Palette class="h-6 w-6 text-primary" />
						</div>
						<Card.Title class="text-lg">Modern UI</Card.Title>
					</div>
				</Card.Header>
				<Card.Content class="p-4">
					<p class="text-muted-foreground text-sm leading-relaxed">
						Beautiful components built with shadcn-svelte
					</p>
				</Card.Content>
			</Card.Root>

			<Card.Root class="transition-shadow duration-200 hover:shadow-md">
				<Card.Header class="space-y-2">
					<div class="flex items-center gap-3">
						<div class="p-2 rounded-lg bg-primary/10">
							<Zap class="h-6 w-6 text-primary" />
						</div>
						<Card.Title class="text-lg">Fast Development</Card.Title>
					</div>
				</Card.Header>
				<Card.Content class="p-4">
					<p class="text-muted-foreground text-sm leading-relaxed">
						Pre-built pages and components for rapid prototyping
					</p>
				</Card.Content>
			</Card.Root>

			<Card.Root class="transition-shadow duration-200 hover:shadow-md">
				<Card.Header class="space-y-2">
					<div class="flex items-center gap-3">
						<div class="p-2 rounded-lg bg-primary/10">
							<Lock class="h-6 w-6 text-primary" />
						</div>
						<Card.Title class="text-lg">Security First</Card.Title>
					</div>
				</Card.Header>
				<Card.Content class="p-4">
					<p class="text-muted-foreground text-sm leading-relaxed">
						Built-in security features and best practices
					</p>
				</Card.Content>
			</Card.Root>

			<Card.Root class="transition-shadow duration-200 hover:shadow-md">
				<Card.Header class="space-y-2">
					<div class="flex items-center gap-3">
						<div class="p-2 rounded-lg bg-primary/10">
							<Code class="h-6 w-6 text-primary" />
						</div>
						<Card.Title class="text-lg">TypeScript</Card.Title>
					</div>
				</Card.Header>
				<Card.Content class="p-4">
					<p class="text-muted-foreground text-sm leading-relaxed">
						Full TypeScript support for better development experience
					</p>
				</Card.Content>
			</Card.Root>
		</div>
	</section>

	<!-- Call to Action Section -->
	<section class="py-16 text-center">
		<div class="space-y-6">
			<h2 class="text-2xl lg:text-3xl font-bold">Ready to Get Started?</h2>
			<p class="text-muted-foreground max-w-xl mx-auto text-lg leading-relaxed">
				Join thousands of developers building amazing applications with MagicKit
			</p>
			<div class="flex flex-col sm:flex-row gap-4 justify-center">
				<Button size="lg" onclick={handleGetStarted} class="transition-colors duration-200">
					{$session.data ? 'Go to Dashboard' : 'Get Started'}
				</Button>
				<Button size="lg" variant="outline" onclick={() => goto('/about')} class="transition-colors duration-200">
					Learn More
				</Button>
			</div>
		</div>
	</section>
</div>
