<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { authClient } from '$lib/auth/auth-client';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let name = '';
	let email = '';
	let password = '';
	let confirmPassword = '';
	let isLoading = false;
	let error = '';

	const session = authClient.useSession();

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

		// Validate passwords match
		if (password !== confirmPassword) {
			error = 'Passwords do not match';
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
	<Card.Header>
		<Card.Title class="text-2xl">Create Account</Card.Title>
		<Card.Description>Enter your details below to create your account</Card.Description>
	</Card.Header>
	<Card.Content>
		<form onsubmit={handleSubmit} class="grid gap-4">
			{#if error}
				<div class="rounded-md bg-red-50 p-3 text-sm text-red-600">
					{error}
				</div>
			{/if}

			<div class="grid gap-2">
				<Label for="name">Full Name</Label>
				<Input
					id="name"
					type="text"
					placeholder="John Doe"
					bind:value={name}
					required
					disabled={isLoading}
				/>
			</div>

			<div class="grid gap-2">
				<Label for="email">Email</Label>
				<Input
					id="email"
					type="email"
					placeholder="m@example.com"
					bind:value={email}
					required
					disabled={isLoading}
				/>
			</div>

			<div class="grid gap-2">
				<Label for="password">Password</Label>
				<Input id="password" type="password" bind:value={password} required disabled={isLoading} />
			</div>

			<div class="grid gap-2">
				<Label for="confirm-password">Confirm Password</Label>
				<Input
					id="confirm-password"
					type="password"
					bind:value={confirmPassword}
					required
					disabled={isLoading}
				/>
			</div>

			<Button type="submit" class="w-full" disabled={isLoading}>
				{isLoading ? 'Creating account...' : 'Create Account'}
			</Button>

			<Button
				type="button"
				variant="outline"
				class="w-full"
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
		</form>
		<div class="mt-4 text-center text-sm">
			Already have an account?
			<a href="/login" class="underline"> Sign in </a>
		</div>
	</Card.Content>
</Card.Root>
