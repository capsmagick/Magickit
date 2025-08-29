<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { Badge } from '$lib/components/ui/badge';
	import { CheckCircle2, AlertCircle, Loader2, Database, Settings } from '@lucide/svelte';

	let testResults = $state({
		auth: null as boolean | null,
		database: null as any,
		users: null as any,
		permissions: null as any,
		roles: null as any,
		userRoles: null as any
	});
	let isLoading = $state(false);
	let error = $state('');
	let success = $state('');

	onMount(() => {
		runTests();
	});

	async function runTests() {
		isLoading = true;
		error = '';
		success = '';

		try {
			// Test admin API
			const testResponse = await fetch('/api/admin/test');
			if (testResponse.ok) {
				const testData = await testResponse.json();
				testResults.auth = testData.success;
				testResults.database = testData.database;
				console.log('Admin test results:', testData);
			} else {
				const errorText = await testResponse.text();
				console.error('Admin test failed:', testResponse.status, errorText);
				testResults.auth = false;
			}

			// Test users API
			try {
				const usersResponse = await fetch(
					'/api/admin/users?page=1&limit=5&search=&role=&status=&sortBy=createdAt&sortOrder=desc'
				);
				if (usersResponse.ok) {
					const usersData = await usersResponse.json();
					testResults.users = usersData;
					console.log('Users API results:', usersData);
				} else {
					const errorText = await usersResponse.text();
					console.error('Users API failed:', usersResponse.status, errorText);
					testResults.users = { error: `${usersResponse.status}: ${errorText}` };
				}
			} catch (err) {
				testResults.users = { error: err instanceof Error ? err.message : 'Unknown error' };
			}

			// Test permissions API
			try {
				const permissionsResponse = await fetch('/api/admin/permissions');
				if (permissionsResponse.ok) {
					const permissionsData = await permissionsResponse.json();
					testResults.permissions = permissionsData;
					console.log('Permissions API results:', permissionsData);
				} else {
					const errorText = await permissionsResponse.text();
					console.error('Permissions API failed:', permissionsResponse.status, errorText);
					testResults.permissions = { error: `${permissionsResponse.status}: ${errorText}` };
				}
			} catch (err) {
				testResults.permissions = { error: err instanceof Error ? err.message : 'Unknown error' };
			}

			// Test roles API
			try {
				const rolesResponse = await fetch('/api/admin/roles');
				if (rolesResponse.ok) {
					const rolesData = await rolesResponse.json();
					testResults.roles = rolesData;
					console.log('Roles API results:', rolesData);
				} else {
					const errorText = await rolesResponse.text();
					console.error('Roles API failed:', rolesResponse.status, errorText);
					testResults.roles = { error: `${rolesResponse.status}: ${errorText}` };
				}
			} catch (err) {
				testResults.roles = { error: err instanceof Error ? err.message : 'Unknown error' };
			}

			// Test user roles API
			try {
				const userRolesResponse = await fetch('/api/admin/user-roles');
				if (userRolesResponse.ok) {
					const userRolesData = await userRolesResponse.json();
					testResults.userRoles = userRolesData;
					console.log('User Roles API results:', userRolesData);
				} else {
					const errorText = await userRolesResponse.text();
					console.error('User Roles API failed:', userRolesResponse.status, errorText);
					testResults.userRoles = { error: `${userRolesResponse.status}: ${errorText}` };
				}
			} catch (err) {
				testResults.userRoles = { error: err instanceof Error ? err.message : 'Unknown error' };
			}

			success = 'Tests completed. Check console for detailed results.';
		} catch (err) {
			error = `Test failed: ${err instanceof Error ? err.message : 'Unknown error'}`;
			console.error('Test error:', err);
		} finally {
			isLoading = false;
		}
	}

	async function initializeSystem() {
		isLoading = true;
		error = '';
		success = '';

		try {
			const response = await fetch('/api/admin/init', { method: 'POST' });
			if (response.ok) {
				const result = await response.json();
				success = result.message;
				console.log('Initialization result:', result);
				// Re-run tests after initialization
				await runTests();
			} else {
				const errorText = await response.text();
				error = `Initialization failed: ${response.status} ${errorText}`;
			}
		} catch (err) {
			error = `Initialization error: ${err instanceof Error ? err.message : 'Unknown error'}`;
		} finally {
			isLoading = false;
		}
	}

	function getStatusIcon(status: any) {
		if (status === null) return Loader2;
		if (status === true || (status && !status.error)) return CheckCircle2;
		return AlertCircle;
	}

	function getStatusVariant(status: any) {
		if (status === null) return 'secondary';
		if (status === true || (status && !status.error)) return 'default';
		return 'destructive';
	}
</script>

<svelte:head>
	<title>Admin System Test - Admin</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
		<div class="space-y-2">
			<h1 class="text-2xl font-bold">Admin System Test</h1>
			<p class="text-muted-foreground">Test and debug admin functionality</p>
		</div>
		<div class="flex gap-2">
			<Button onclick={runTests} disabled={isLoading} variant="outline">
				{#if isLoading}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					Testing...
				{:else}
					Run Tests
				{/if}
			</Button>
			<Button onclick={initializeSystem} disabled={isLoading}>
				{#if isLoading}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					Initializing...
				{:else}
					<Settings class="mr-2 h-4 w-4" />
					Initialize System
				{/if}
			</Button>
		</div>
	</div>

	<!-- Status Messages -->
	{#if error}
		<Alert variant="destructive">
			<AlertCircle class="h-4 w-4" />
			<AlertDescription>{error}</AlertDescription>
		</Alert>
	{/if}

	{#if success}
		<Alert>
			<CheckCircle2 class="h-4 w-4" />
			<AlertDescription>{success}</AlertDescription>
		</Alert>
	{/if}

	<!-- Test Results -->
	<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
		<!-- Authentication Test -->
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					{@const StatusIcon = getStatusIcon(testResults.auth)}
					<StatusIcon class="h-5 w-5" />
					Authentication
				</CardTitle>
			</CardHeader>
			<CardContent>
				<Badge variant={getStatusVariant(testResults.auth)}>
					{testResults.auth === null ? 'Testing...' : testResults.auth ? 'Passed' : 'Failed'}
				</Badge>
				{#if testResults.database}
					<div class="mt-4 space-y-2">
						<p class="text-sm">
							<strong>Collections:</strong>
							{testResults.database.collections?.length || 0}
						</p>
						<p class="text-sm"><strong>Users:</strong> {testResults.database.counts?.users || 0}</p>
					</div>
				{/if}
			</CardContent>
		</Card>

		<!-- Users API Test -->
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					{@const StatusIcon = getStatusIcon(testResults.users)}
					<StatusIcon class="h-5 w-5" />
					Users API
				</CardTitle>
			</CardHeader>
			<CardContent>
				<Badge variant={getStatusVariant(testResults.users)}>
					{testResults.users === null
						? 'Testing...'
						: testResults.users?.error
							? 'Failed'
							: 'Passed'}
				</Badge>
				{#if testResults.users?.error}
					<p class="mt-2 text-sm text-destructive">{testResults.users.error}</p>
				{:else if testResults.users?.users}
					<div class="mt-2 space-y-1">
						<p class="text-sm">Found {testResults.users.users.length} users</p>
						<p class="text-xs text-muted-foreground">
							Total: {testResults.users.pagination?.total || 0}
						</p>
						{#if testResults.users.users.length > 0}
							<div class="text-xs">
								<p>
									<strong>Sample user:</strong>
									{testResults.users.users[0].name} ({testResults.users.users[0].email})
								</p>
							</div>
						{/if}
					</div>
				{:else if testResults.users && Array.isArray(testResults.users)}
					<p class="mt-2 text-sm">Found {testResults.users.length} users</p>
				{/if}
			</CardContent>
		</Card>

		<!-- Permissions API Test -->
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					{@const StatusIcon = getStatusIcon(testResults.permissions)}
					<StatusIcon class="h-5 w-5" />
					Permissions API
				</CardTitle>
			</CardHeader>
			<CardContent>
				<Badge variant={getStatusVariant(testResults.permissions)}>
					{testResults.permissions === null
						? 'Testing...'
						: testResults.permissions?.error
							? 'Failed'
							: 'Passed'}
				</Badge>
				{#if testResults.permissions?.error}
					<p class="mt-2 text-sm text-destructive">{testResults.permissions.error}</p>
				{:else if testResults.permissions && Array.isArray(testResults.permissions)}
					<p class="mt-2 text-sm">Found {testResults.permissions.length} permissions</p>
				{/if}
			</CardContent>
		</Card>

		<!-- Roles API Test -->
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					{@const StatusIcon = getStatusIcon(testResults.roles)}
					<StatusIcon class="h-5 w-5" />
					Roles API
				</CardTitle>
			</CardHeader>
			<CardContent>
				<Badge variant={getStatusVariant(testResults.roles)}>
					{testResults.roles === null
						? 'Testing...'
						: testResults.roles?.error
							? 'Failed'
							: 'Passed'}
				</Badge>
				{#if testResults.roles?.error}
					<p class="mt-2 text-sm text-destructive">{testResults.roles.error}</p>
				{:else if testResults.roles && Array.isArray(testResults.roles)}
					<p class="mt-2 text-sm">Found {testResults.roles.length} roles</p>
				{/if}
			</CardContent>
		</Card>

		<!-- User Roles API Test -->
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					{@const StatusIcon = getStatusIcon(testResults.userRoles)}
					<StatusIcon class="h-5 w-5" />
					User Roles API
				</CardTitle>
			</CardHeader>
			<CardContent>
				<Badge variant={getStatusVariant(testResults.userRoles)}>
					{testResults.userRoles === null
						? 'Testing...'
						: testResults.userRoles?.error
							? 'Failed'
							: 'Passed'}
				</Badge>
				{#if testResults.userRoles?.error}
					<p class="mt-2 text-sm text-destructive">{testResults.userRoles.error}</p>
				{:else if testResults.userRoles && Array.isArray(testResults.userRoles)}
					<p class="mt-2 text-sm">Found {testResults.userRoles.length} assignments</p>
				{/if}
			</CardContent>
		</Card>

		<!-- Database Status -->
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<Database class="h-5 w-5" />
					Database Status
				</CardTitle>
			</CardHeader>
			<CardContent>
				{#if testResults.database}
					<Badge variant="default">Connected</Badge>
					<div class="mt-4 space-y-1">
						<p class="text-sm">
							<strong>Collections:</strong>
							{testResults.database.collections?.length || 0}
						</p>
						<p class="text-sm"><strong>Users:</strong> {testResults.database.counts?.users || 0}</p>
						<p class="text-sm"><strong>Roles:</strong> {testResults.database.counts?.roles || 0}</p>
						<p class="text-sm">
							<strong>Permissions:</strong>
							{testResults.database.counts?.permissions || 0}
						</p>
					</div>
				{:else}
					<Badge variant="secondary">Unknown</Badge>
				{/if}
			</CardContent>
		</Card>
	</div>

	<!-- Raw Results -->
	<Card>
		<CardHeader>
			<CardTitle>Raw Test Results</CardTitle>
		</CardHeader>
		<CardContent>
			<pre class="max-h-96 overflow-auto rounded bg-muted p-4 text-xs">
{JSON.stringify(testResults, null, 2)}
			</pre>
		</CardContent>
	</Card>
</div>
