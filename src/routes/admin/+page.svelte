<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { authClient } from '$lib/auth/auth-client';
	import { goto } from '$app/navigation';

	let users: any[] = [];
	let isLoading = false;
	let error = '';
	let searchValue = '';
	let limit = 10;
	let offset = 0;
	let total = 0;
	let hasCheckedAuth = false;

	const session = authClient.useSession();

	// Reactive statement to check session and redirect if needed
	$effect(() => {
		if (!hasCheckedAuth && $session.data) {
			hasCheckedAuth = true;
			if ($session.data.user.role !== 'admin') {
				goto('/login?returnTo=/admin');
				return;
			}
			loadUsers();
		}
	});

	async function loadUsers() {
		isLoading = true;
		error = '';

		try {
			const result = await authClient.admin.listUsers({
				query: {
					searchValue,
					limit,
					offset
				}
			});

			if (result.error) {
				error = result.error.message || 'Failed to load users';
			} else {
				users = result.data?.users || [];
				total = result.data?.total || 0;
			}
		} catch (err) {
			error = 'Failed to load users';
		} finally {
			isLoading = false;
		}
	}

	async function createUser(e: SubmitEvent) {
		e.preventDefault();
		const formData = new FormData(e.target as HTMLFormElement);
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;
		const name = formData.get('name') as string;
		const role = formData.get('role') as string;

		try {
			const result = await authClient.admin.createUser({
				email,
				password,
				name,
				role: role === 'admin' ? 'admin' : 'user'
			});

			if (result.error) {
				error = result.error.message || 'Failed to create user';
			} else {
				// Reset form and reload users
				(e.target as HTMLFormElement).reset();
				loadUsers();
			}
		} catch (err) {
			error = 'Failed to create user';
		}
	}

	async function setUserRole(userId: string, role: string) {
		try {
			const result = await authClient.admin.setRole({
				userId,
				role: role === 'admin' ? 'admin' : 'user'
			});

			if (result.error) {
				error = result.error.message || 'Failed to update user role';
			} else {
				loadUsers();
			}
		} catch (err) {
			error = 'Failed to update user role';
		}
	}

	async function banUser(userId: string) {
		try {
			await authClient.admin.banUser({
				userId,
				banReason: 'Admin action'
			});
			loadUsers();
		} catch (err) {
			error = 'Failed to ban user';
		}
	}

	async function unbanUser(userId: string) {
		try {
			await authClient.admin.unbanUser({
				userId
			});
			loadUsers();
		} catch (err) {
			error = 'Failed to unban user';
		}
	}

	function nextPage() {
		if (offset + limit < total) {
			offset += limit;
			loadUsers();
		}
	}

	function prevPage() {
		if (offset - limit >= 0) {
			offset -= limit;
			loadUsers();
		}
	}

	function handleSearchInput() {
		offset = 0;
		loadUsers();
	}

	function handleRoleChange(userId: string, event: Event) {
		const target = event.target as HTMLSelectElement;
		setUserRole(userId, target.value);
	}
</script>

<div class="container mx-auto space-y-6 p-6">
	<Card.Root>
		<Card.Header>
			<Card.Title class="text-2xl">Admin Panel</Card.Title>
			<Card.Description>Manage users and system settings</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if error}
				<div class="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
					{error}
				</div>
			{/if}

			<!-- Create User Form -->
			<form onsubmit={createUser} class="mb-6 grid gap-4 rounded-lg border p-4">
				<h3 class="text-lg font-semibold">Create New User</h3>
				<div class="grid grid-cols-1 gap-4 md:grid-cols-4">
					<div>
						<Label for="name">Name</Label>
						<Input id="name" name="name" required />
					</div>
					<div>
						<Label for="email">Email</Label>
						<Input id="email" name="email" type="email" required />
					</div>
					<div>
						<Label for="password">Password</Label>
						<Input id="password" name="password" type="password" required />
					</div>
					<div>
						<Label for="role">Role</Label>
						<select id="role" name="role" class="w-full rounded-md border p-2">
							<option value="user">User</option>
							<option value="admin">Admin</option>
						</select>
					</div>
				</div>
				<Button type="submit" class="w-fit">Create User</Button>
			</form>

			<!-- Search and Filters -->
			<div class="mb-4 flex gap-4">
				<div class="flex-1">
					<Input
						placeholder="Search users..."
						bind:value={searchValue}
						on:input={handleSearchInput}
					/>
				</div>
				<Button onclick={loadUsers} disabled={isLoading}>
					{isLoading ? 'Loading...' : 'Refresh'}
				</Button>
			</div>

			<!-- Users Table -->
			<div class="overflow-x-auto">
				<table class="w-full border-collapse border">
					<thead>
						<tr class="bg-muted">
							<th class="border p-2 text-left">Name</th>
							<th class="border p-2 text-left">Email</th>
							<th class="border p-2 text-left">Role</th>
							<th class="border p-2 text-left">Status</th>
							<th class="border p-2 text-left">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each users as user}
							<tr class="border">
								<td class="border p-2">{user.name || 'N/A'}</td>
								<td class="border p-2">{user.email}</td>
								<td class="border p-2">
									<select
										value={user.role || 'user'}
										on:change={(e) => handleRoleChange(user.id, e)}
										class="w-full rounded border p-1"
									>
										<option value="user">User</option>
										<option value="admin">Admin</option>
									</select>
								</td>
								<td class="border p-2">
									{#if user.banned}
										<span class="text-red-600">Banned</span>
									{:else}
										<span class="text-green-600">Active</span>
									{/if}
								</td>
								<td class="border p-2">
									{#if user.banned}
										<Button variant="outline" size="sm" onclick={() => unbanUser(user.id)}>
											Unban
										</Button>
									{:else}
										<Button variant="outline" size="sm" onclick={() => banUser(user.id)}>
											Ban
										</Button>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<!-- Pagination -->
			{#if total > limit}
				<div class="mt-4 flex items-center justify-between">
					<Button variant="outline" onclick={prevPage} disabled={offset === 0}>Previous</Button>
					<span class="text-sm">
						Page {Math.floor(offset / limit) + 1} of {Math.ceil(total / limit)}
					</span>
					<Button variant="outline" onclick={nextPage} disabled={offset + limit >= total}>
						Next
					</Button>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
