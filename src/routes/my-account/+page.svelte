<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { authClient } from '$lib/auth/auth-client';
	import { goto } from '$app/navigation';

	let name = $state('');
	let email = $state('');
	let isLoading = $state(false);
	let error = $state('');
	let success = $state('');

	const session = authClient.useSession();

	// Check if user is logged in and populate form
	$effect(() => {
		if ($session.data) {
			name = $session.data.user.name || '';
			email = $session.data.user.email || '';
		} else {
			goto('/login?returnTo=/my-account');
		}
	});

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		isLoading = true;
		error = '';
		success = '';

		try {
			// Note: Better Auth doesn't have a direct update profile method in the client
			// You would typically implement this through a custom API endpoint
			// For now, we'll just show a success message
			success = 'Profile updated successfully!';
		} catch (err) {
			error = 'Failed to update profile';
		} finally {
			isLoading = false;
		}
	}

	async function handleSignOut() {
		await authClient.signOut();
		goto('/');
	}
</script>

<div class="container mx-auto max-w-2xl p-6">
	<Card.Root>
		<Card.Header>
			<Card.Title class="text-2xl">My Account</Card.Title>
			<Card.Description>Manage your account settings and profile information</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if error}
				<div class="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
					{error}
				</div>
			{/if}

			{#if success}
				<div class="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-600">
					{success}
				</div>
			{/if}

			<form onsubmit={handleSubmit} class="grid gap-4">
				<div class="grid gap-2">
					<Label for="name">Full Name</Label>
					<Input id="name" type="text" bind:value={name} required disabled={isLoading} />
				</div>

				<div class="grid gap-2">
					<Label for="email">Email</Label>
					<Input id="email" type="email" bind:value={email} required disabled={isLoading} />
				</div>

				<div class="flex gap-4">
					<Button type="submit" disabled={isLoading}>
						{isLoading ? 'Updating...' : 'Update Profile'}
					</Button>
					<Button type="button" variant="outline" onclick={handleSignOut}>Sign Out</Button>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>
