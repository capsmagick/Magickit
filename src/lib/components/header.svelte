<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { authClient } from '$lib/auth/auth-client';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	const session = authClient.useSession();

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
