<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { authClient } from '$lib/auth/auth-client';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Loader2, AlertCircle } from '@lucide/svelte';

	const id = $props.id();
	const session = authClient.useSession();

	let email = $state('');
	let password = $state('');
	let isLoading = $state(false);
	let error = $state('');

	// Reactive statement to check session and redirect if needed
	$effect(() => {
		if ($session.data?.user?.role) {
			redirectBasedOnRole($session.data.user.role);
		}
	});

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		isLoading = true;
		error = '';

		try {
			await authClient.signIn.email(
				{
					email,
					password
				},
				{
					onSuccess: (ctx) => {
						// After successful signin, the session will be updated
						// and the $effect will handle the redirect
					},
					onError: (ctx) => {
						error = ctx.error?.message || 'Signin failed';
					}
				}
			);
		} catch (err) {
			error = 'An unexpected error occurred';
		} finally {
			isLoading = false;
		}
	}

	function redirectBasedOnRole(role: string) {
		if (role === 'admin') {
			goto('/admin');
		} else {
			// Go back to the page where user logged in from
			const returnTo = $page.url.searchParams.get('returnTo') || '/';
			goto(returnTo);
		}
	}

	async function handleGoogleSignIn() {
		try {
			await authClient.signIn.social(
				{
					provider: 'google'
				},
				{
					onSuccess: (ctx) => {
						// After successful signin, the session will be updated
						// and the $effect will handle the redirect
					},
					onError: (ctx) => {
						error = ctx.error?.message || 'Google signin failed';
					}
				}
			);
		} catch (err) {
			error = 'An unexpected error occurred';
		}
	}
</script>

<Card.Root class="mx-auto w-full max-w-sm">
	<Card.Header class="space-y-2">
		<Card.Title class="text-2xl">Login</Card.Title>
		<Card.Description class="text-sm">
			Enter your email below to login to your account
		</Card.Description>
	</Card.Header>
	<Card.Content class="space-y-6">
		<form onsubmit={handleSubmit} class="space-y-6">
			{#if error}
				<Alert.Root variant="destructive">
					<AlertCircle class="h-4 w-4" />
					<Alert.Description class="text-destructive">
						{error}
					</Alert.Description>
				</Alert.Root>
			{/if}

			<div class="space-y-2">
				<Label for="email-{id}" class="text-sm font-medium">Email</Label>
				<Input
					id="email-{id}"
					type="email"
					placeholder="m@example.com"
					bind:value={email}
					required
					disabled={isLoading}
					aria-describedby={error ? 'error-message' : undefined}
					class="transition-colors duration-200"
				/>
			</div>
			
			<div class="space-y-2">
				<div class="flex items-center justify-between">
					<Label for="password-{id}" class="text-sm font-medium">Password</Label>
					<a 
						href="/forgot-password" 
						class="text-sm text-primary hover:text-primary/80 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
						tabindex="0"
					>
						Forgot password?
					</a>
				</div>
				<Input
					id="password-{id}"
					type="password"
					bind:value={password}
					required
					disabled={isLoading}
					aria-describedby={error ? 'error-message' : undefined}
					class="transition-colors duration-200"
				/>
			</div>
			
			<div class="space-y-4">
				<Button 
					type="submit" 
					class="w-full transition-colors duration-200" 
					disabled={isLoading}
					aria-describedby={isLoading ? 'loading-message' : undefined}
				>
					{#if isLoading}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
						Signing in...
					{:else}
						Sign In
					{/if}
				</Button>
				
				<Button
					type="button"
					variant="outline"
					class="w-full transition-colors duration-200"
					onclick={handleGoogleSignIn}
					disabled={isLoading}
				>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="mr-2 h-4 w-4">
						<path
							d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
							fill="currentColor"
						/>
					</svg>
					Sign in with Google
				</Button>
			</div>
		</form>
		
		<div class="text-center text-sm text-muted-foreground">
			Don't have an account?
			<a 
				href="/signup" 
				class="text-primary hover:text-primary/80 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
			>
				Sign up
			</a>
		</div>
	</Card.Content>
</Card.Root>
