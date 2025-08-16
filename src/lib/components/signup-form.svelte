<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { authClient } from '$lib/auth/auth-client';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Loader2, AlertCircle, Check, X } from '@lucide/svelte';

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let isLoading = $state(false);
	let error = $state('');
	let fieldErrors = $state<Record<string, string>>({});

	const session = authClient.useSession();

	// Password validation
	$effect(() => {
		if (password && confirmPassword) {
			if (password !== confirmPassword) {
				fieldErrors.confirmPassword = 'Passwords do not match';
			} else {
				fieldErrors.confirmPassword = '';
			}
		}
	});

	// Reactive statement to check session and redirect if needed
	$effect(() => {
		if ($session.data) {
			redirectBasedOnRole($session.data.user.role);
		}
	});

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		isLoading = true;
		error = '';
		fieldErrors = {};

		// Validate passwords match
		if (password !== confirmPassword) {
			fieldErrors.confirmPassword = 'Passwords do not match';
			isLoading = false;
			return;
		}

		// Basic validation
		if (name.length < 2) {
			fieldErrors.name = 'Name must be at least 2 characters';
			isLoading = false;
			return;
		}

		if (password.length < 6) {
			fieldErrors.password = 'Password must be at least 6 characters';
			isLoading = false;
			return;
		}

		try {
			await authClient.signUp.email(
				{
					email,
					password,
					name
				},
				{
					onSuccess: (ctx) => {
						// After successful signup, the session will be updated
						// and the $effect will handle the redirect
					},
					onError: (ctx) => {
						error = ctx.error?.message || 'Signup failed';
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
			// Go back to the page where user signed up from
			const returnTo = $page.url.searchParams.get('returnTo') || '/';
			goto(returnTo);
		}
	}

	async function handleGoogleSignUp() {
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
		<Card.Title class="text-2xl">Create Account</Card.Title>
		<Card.Description class="text-sm">
			Enter your details below to create your account
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
				<Label for="name" class="text-sm font-medium">Full Name</Label>
				<Input
					id="name"
					type="text"
					placeholder="John Doe"
					bind:value={name}
					required
					disabled={isLoading}
					aria-describedby={fieldErrors.name ? 'name-error' : undefined}
					class="transition-colors duration-200 {fieldErrors.name ? 'border-destructive focus:ring-destructive' : ''}"
				/>
				{#if fieldErrors.name}
					<p id="name-error" class="text-sm text-destructive flex items-center gap-1">
						<X class="h-3 w-3" />
						{fieldErrors.name}
					</p>
				{/if}
			</div>

			<div class="space-y-2">
				<Label for="email" class="text-sm font-medium">Email</Label>
				<Input
					id="email"
					type="email"
					placeholder="m@example.com"
					bind:value={email}
					required
					disabled={isLoading}
					aria-describedby={fieldErrors.email ? 'email-error' : undefined}
					class="transition-colors duration-200 {fieldErrors.email ? 'border-destructive focus:ring-destructive' : ''}"
				/>
				{#if fieldErrors.email}
					<p id="email-error" class="text-sm text-destructive flex items-center gap-1">
						<X class="h-3 w-3" />
						{fieldErrors.email}
					</p>
				{/if}
			</div>

			<div class="space-y-2">
				<Label for="password" class="text-sm font-medium">Password</Label>
				<Input 
					id="password" 
					type="password" 
					bind:value={password} 
					required 
					disabled={isLoading}
					aria-describedby={fieldErrors.password ? 'password-error' : undefined}
					class="transition-colors duration-200 {fieldErrors.password ? 'border-destructive focus:ring-destructive' : ''}"
				/>
				{#if fieldErrors.password}
					<p id="password-error" class="text-sm text-destructive flex items-center gap-1">
						<X class="h-3 w-3" />
						{fieldErrors.password}
					</p>
				{:else if password.length >= 6}
					<p class="text-sm text-green-600 flex items-center gap-1">
						<Check class="h-3 w-3" />
						Password strength: Good
					</p>
				{/if}
			</div>

			<div class="space-y-2">
				<Label for="confirm-password" class="text-sm font-medium">Confirm Password</Label>
				<Input
					id="confirm-password"
					type="password"
					bind:value={confirmPassword}
					required
					disabled={isLoading}
					aria-describedby={fieldErrors.confirmPassword ? 'confirm-password-error' : undefined}
					class="transition-colors duration-200 {fieldErrors.confirmPassword ? 'border-destructive focus:ring-destructive' : ''}"
				/>
				{#if fieldErrors.confirmPassword}
					<p id="confirm-password-error" class="text-sm text-destructive flex items-center gap-1">
						<X class="h-3 w-3" />
						{fieldErrors.confirmPassword}
					</p>
				{:else if confirmPassword && password === confirmPassword}
					<p class="text-sm text-green-600 flex items-center gap-1">
						<Check class="h-3 w-3" />
						Passwords match
					</p>
				{/if}
			</div>

			<div class="space-y-4">
				<Button 
					type="submit" 
					class="w-full transition-colors duration-200" 
					disabled={isLoading || Object.values(fieldErrors).some(error => error)}
				>
					{#if isLoading}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
						Creating account...
					{:else}
						Create Account
					{/if}
				</Button>

				<Button
					type="button"
					variant="outline"
					class="w-full transition-colors duration-200"
					onclick={handleGoogleSignUp}
					disabled={isLoading}
				>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="mr-2 h-4 w-4">
						<path
							d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
							fill="currentColor"
						/>
					</svg>
					Sign up with Google
				</Button>
			</div>
		</form>
		
		<div class="text-center text-sm text-muted-foreground">
			Already have an account?
			<a 
				href="/login" 
				class="text-primary hover:text-primary/80 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
			>
				Sign in
			</a>
		</div>
	</Card.Content>
</Card.Root>
