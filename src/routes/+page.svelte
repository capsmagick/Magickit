<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { authClient } from '$lib/auth/auth-client';
	import { goto } from '$app/navigation';

	const session = authClient.useSession();

	function handleGetStarted() {
		if ($session.data) {
			goto('/my-account');
		} else {
			goto('/signup');
		}
	}
</script>

<div class="container mx-auto p-6">
	<div class="space-y-6 text-center">
		<h1 class="text-4xl font-bold">Welcome to MagicKit</h1>
		<p class="mx-auto max-w-2xl text-xl text-muted-foreground">
			A powerful authentication system built with SvelteKit and Better Auth
		</p>

		{#if $session.data}
			<Card.Root class="mx-auto max-w-md">
				<Card.Header>
					<Card.Title>Welcome back!</Card.Title>
					<Card.Description>
						You are signed in as {$session.data.user.name || $session.data.user.email}
					</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-4">
					<div class="text-sm">
						<strong>Role:</strong>
						{$session.data.user.role || 'user'}
					</div>
					<div class="flex gap-2">
						{#if $session.data.user.role === 'admin'}
							<Button onclick={() => goto('/admin')} class="flex-1">Admin Panel</Button>
						{/if}
						<Button variant="outline" onclick={() => goto('/my-account')} class="flex-1">
							My Account
						</Button>
					</div>
				</Card.Content>
			</Card.Root>
		{:else}
			<Card.Root class="mx-auto max-w-md">
				<Card.Header>
					<Card.Title>Get Started</Card.Title>
					<Card.Description>Sign up or sign in to access your account</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-4">
					<Button onclick={() => goto('/signup')} class="w-full">Create Account</Button>
					<Button variant="outline" onclick={() => goto('/login')} class="w-full">Sign In</Button>
				</Card.Content>
			</Card.Root>
		{/if}

		<div class="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
			<Card.Root>
				<Card.Header>
					<Card.Title>Authentication</Card.Title>
				</Card.Header>
				<Card.Content>
					<p class="text-muted-foreground">
						Secure email/password and social authentication with Better Auth
					</p>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header>
					<Card.Title>User Management</Card.Title>
				</Card.Header>
				<Card.Content>
					<p class="text-muted-foreground">
						Admin panel for managing users, roles, and permissions
					</p>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header>
					<Card.Title>Modern UI</Card.Title>
				</Card.Header>
				<Card.Content>
					<p class="text-muted-foreground">Beautiful components built with shadcn-svelte</p>
				</Card.Content>
			</Card.Root>
		</div>
	</div>
</div>
