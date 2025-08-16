<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { authClient } from '$lib/auth/auth-client';
	import { goto } from '$app/navigation';
	import {
		Plus,
		Edit,
		Trash2,
		Search,
		RefreshCw,
		Globe,
		CheckCircle,
		Ban,
		AlertTriangle,
		Loader2,
		Shield
	} from '@lucide/svelte';

	let hasCheckedAuth = $state(false);
	let showAddIPDialog = $state(false);
	let showEditIPDialog = $state(false);
	let isLoading = $state(false);
	let searchTerm = $state('');
	let selectedRule = $state(null);

	const session = authClient.useSession();

	// IP Access Rules data
	let ipAccessRules = $state([]);
	let accessAttempts = $state([]);

	// Form data
	let newIPRule = $state({
		ip: '',
		description: '',
		type: 'allow' as 'allow' | 'block'
	});

	let editIPRule = $state({
		id: '',
		ip: '',
		description: '',
		type: 'allow' as 'allow' | 'block'
	});

	// Validation errors
	let errors = $state({
		ip: '',
		description: ''
	});

	// Reactive statement to check session and redirect if needed
	$effect(() => {
		if (!hasCheckedAuth && $session.data) {
			hasCheckedAuth = true;
			if ($session.data.user.role !== 'admin') {
				goto('/login?returnTo=/admin/security/ip-access');
				return;
			} else {
				// Load data once authenticated
				loadIPAccessData();
			}
		}
	});

	// Load IP access rules and attempts
	async function loadIPAccessData() {
		isLoading = true;
		try {
			// Load IP access rules
			const rulesResponse = await fetch('/api/admin/security/ip-access?type=rules');
			if (rulesResponse.ok) {
				const rulesData = await rulesResponse.json();
				ipAccessRules = rulesData.rules.map(rule => ({
					...rule,
					id: rule._id,
					createdAt: new Date(rule.createdAt),
					lastUsed: rule.lastUsed ? new Date(rule.lastUsed) : new Date()
				}));
			}

			// Load access attempts
			const attemptsResponse = await fetch('/api/admin/security/ip-access?type=attempts');
			if (attemptsResponse.ok) {
				const attemptsData = await attemptsResponse.json();
				accessAttempts = attemptsData.attempts.map(attempt => ({
					...attempt,
					id: attempt._id,
					timestamp: new Date(attempt.timestamp)
				}));
			}
		} catch (error) {
			console.error('Error loading IP access data:', error);
		} finally {
			isLoading = false;
		}
	}

	// Filtered rules based on search
	const filteredRules = $derived.by(() => {
		if (!searchTerm) return ipAccessRules;
		return ipAccessRules.filter(rule => 
			rule.ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
			rule.description.toLowerCase().includes(searchTerm.toLowerCase())
		);
	});

	// Filtered access attempts based on search
	const filteredAttempts = $derived.by(() => {
		if (!searchTerm) return accessAttempts.slice(0, 10); // Show latest 10
		return accessAttempts.filter(attempt => 
			attempt.ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
			attempt.rule.toLowerCase().includes(searchTerm.toLowerCase())
		);
	});

	function validateIPAddress(ip: string): boolean {
		// Basic IP/CIDR validation
		const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?:\/(?:[0-9]|[1-2][0-9]|3[0-2]))?$/;
		const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}(?:\/(?:[0-9]|[1-9][0-9]|1[0-1][0-9]|12[0-8]))?$/;
		return ipv4Regex.test(ip) || ipv6Regex.test(ip);
	}

	function validateForm(formData: typeof newIPRule): boolean {
		errors = { ip: '', description: '' };
		let isValid = true;

		if (!formData.ip.trim()) {
			errors.ip = 'IP address is required';
			isValid = false;
		} else if (!validateIPAddress(formData.ip.trim())) {
			errors.ip = 'Please enter a valid IP address or CIDR notation';
			isValid = false;
		}

		if (!formData.description.trim()) {
			errors.description = 'Description is required';
			isValid = false;
		} else if (formData.description.trim().length < 3) {
			errors.description = 'Description must be at least 3 characters';
			isValid = false;
		}

		return isValid;
	}

	async function addIPRule() {
		if (!validateForm(newIPRule)) {
			return;
		}

		isLoading = true;
		
		try {
			const response = await fetch('/api/admin/security/ip-access', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					ip: newIPRule.ip.trim(),
					description: newIPRule.description.trim(),
					type: newIPRule.type
				})
			});

			if (response.ok) {
				const data = await response.json();
				const newRule = {
					...data.rule,
					id: data.rule._id,
					createdAt: new Date(data.rule.createdAt),
					lastUsed: data.rule.lastUsed ? new Date(data.rule.lastUsed) : new Date()
				};
				
				ipAccessRules = [...ipAccessRules, newRule];
				newIPRule = { ip: '', description: '', type: 'allow' };
				errors = { ip: '', description: '' };
				showAddIPDialog = false;
			} else {
				const errorData = await response.json();
				errors.ip = errorData.error || 'Failed to add IP rule';
			}
		} catch (error) {
			console.error('Error adding IP rule:', error);
			errors.ip = 'Network error occurred';
		} finally {
			isLoading = false;
		}
	}

	async function updateIPRule() {
		if (!validateForm(editIPRule)) {
			return;
		}

		isLoading = true;
		
		try {
			// Simulate API call
			await new Promise(resolve => setTimeout(resolve, 1000));

			ipAccessRules = ipAccessRules.map(rule =>
				rule.id === editIPRule.id
					? {
						...rule,
						ip: editIPRule.ip.trim(),
						description: editIPRule.description.trim(),
						type: editIPRule.type
					}
					: rule
			);

			editIPRule = { id: '', ip: '', description: '', type: 'allow' };
			errors = { ip: '', description: '' };
			showEditIPDialog = false;
		} catch (error) {
			console.error('Error updating IP rule:', error);
		} finally {
			isLoading = false;
		}
	}

	function openEditDialog(rule: typeof ipAccessRules[0]) {
		editIPRule = {
			id: rule.id,
			ip: rule.ip,
			description: rule.description,
			type: rule.type
		};
		showEditIPDialog = true;
	}

	async function deleteIPRule(ruleId: string) {
		if (!confirm('Are you sure you want to delete this IP rule?')) {
			return;
		}

		isLoading = true;
		
		try {
			const response = await fetch(`/api/admin/security/ip-access?id=${ruleId}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				ipAccessRules = ipAccessRules.filter(rule => rule.id !== ruleId);
			} else {
				const errorData = await response.json();
				console.error('Error deleting IP rule:', errorData.error);
			}
		} catch (error) {
			console.error('Error deleting IP rule:', error);
		} finally {
			isLoading = false;
		}
	}

	async function toggleRuleStatus(ruleId: string) {
		isLoading = true;
		
		try {
			// Simulate API call
			await new Promise(resolve => setTimeout(resolve, 500));
			
			ipAccessRules = ipAccessRules.map(rule =>
				rule.id === ruleId
					? { ...rule, status: rule.status === 'active' ? 'inactive' : 'active' }
					: rule
			);
		} catch (error) {
			console.error('Error toggling rule status:', error);
		} finally {
			isLoading = false;
		}
	}

	function getTypeBadge(type: 'allow' | 'block') {
		switch (type) {
			case 'allow':
				return { variant: 'default' as const, text: 'Allow', icon: CheckCircle };
			case 'block':
				return { variant: 'destructive' as const, text: 'Block', icon: Ban };
		}
	}

	function getStatusBadge(status: 'active' | 'inactive') {
		switch (status) {
			case 'active':
				return { variant: 'default' as const, text: 'Active' };
			case 'inactive':
				return { variant: 'secondary' as const, text: 'Inactive' };
		}
	}

	function getActionBadge(action: string) {
		switch (action) {
			case 'allowed':
				return { variant: 'default' as const, text: 'Allowed' };
			case 'blocked':
				return { variant: 'destructive' as const, text: 'Blocked' };
			default:
				return { variant: 'outline' as const, text: action };
		}
	}

	function refreshData() {
		loadIPAccessData();
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
		<div class="space-y-2">
			<h1 class="text-2xl font-bold">IP Access Control</h1>
			<p class="text-muted-foreground">
				Manage IP address allow/block rules and monitor access attempts
			</p>
		</div>
		<div class="flex gap-2">
			<Button variant="outline" onclick={refreshData} disabled={isLoading}>
				{#if isLoading}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
				{:else}
					<RefreshCw class="mr-2 h-4 w-4" />
				{/if}
				Refresh
			</Button>
			<Button onclick={() => (showAddIPDialog = true)}>
				<Plus class="mr-2 h-4 w-4" />
				Add IP Rule
			</Button>
		</div>
	</div>

	<!-- Search and Filters -->
	<Card.Root>
		<Card.Content class="p-4">
			<div class="flex flex-col sm:flex-row gap-4">
				<div class="flex-1">
					<div class="relative">
						<Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
						<Input 
							type="search" 
							placeholder="Search IP addresses or descriptions..." 
							class="pl-8" 
							bind:value={searchTerm} 
						/>
					</div>
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Statistics Cards -->
	<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
		<Card.Root>
			<Card.Content class="p-4">
				<div class="flex items-center gap-2">
					<Shield class="h-4 w-4 text-primary" />
					<div>
						<p class="text-sm text-muted-foreground">Total Rules</p>
						<p class="text-2xl font-bold">{ipAccessRules.length}</p>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Content class="p-4">
				<div class="flex items-center gap-2">
					<CheckCircle class="h-4 w-4 text-green-500" />
					<div>
						<p class="text-sm text-muted-foreground">Allow Rules</p>
						<p class="text-2xl font-bold">{ipAccessRules.filter(r => r.type === 'allow').length}</p>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Content class="p-4">
				<div class="flex items-center gap-2">
					<Ban class="h-4 w-4 text-red-500" />
					<div>
						<p class="text-sm text-muted-foreground">Block Rules</p>
						<p class="text-2xl font-bold">{ipAccessRules.filter(r => r.type === 'block').length}</p>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Content class="p-4">
				<div class="flex items-center gap-2">
					<AlertTriangle class="h-4 w-4 text-yellow-500" />
					<div>
						<p class="text-sm text-muted-foreground">Recent Blocks</p>
						<p class="text-2xl font-bold">{accessAttempts.filter(a => a.action === 'blocked').length}</p>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- IP Access Rules Table -->
	<Card.Root>
		<Card.Header>
			<Card.Title>IP Access Rules</Card.Title>
			<Card.Description>Configure which IP addresses are allowed or blocked</Card.Description>
		</Card.Header>
		<Card.Content class="p-0">
			{#if isLoading}
				<div class="flex justify-center py-12">
					<Loader2 class="h-8 w-8 animate-spin text-primary" />
				</div>
			{:else if filteredRules.length === 0}
				<div class="text-center py-12 space-y-4">
					<Globe class="h-12 w-12 mx-auto text-muted-foreground" />
					<div class="space-y-2">
						<h3 class="text-lg font-semibold">No IP rules found</h3>
						<p class="text-muted-foreground">
							{searchTerm ? 'No rules match your search criteria.' : 'Get started by adding your first IP access rule.'}
						</p>
					</div>
					{#if !searchTerm}
						<Button onclick={() => (showAddIPDialog = true)}>
							<Plus class="mr-2 h-4 w-4" />
							Add IP Rule
						</Button>
					{/if}
				</div>
			{:else}
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>IP Address/Range</Table.Head>
							<Table.Head>Description</Table.Head>
							<Table.Head>Type</Table.Head>
							<Table.Head>Status</Table.Head>
							<Table.Head>Hit Count</Table.Head>
							<Table.Head>Last Used</Table.Head>
							<Table.Head class="text-right">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each filteredRules as rule}
							<Table.Row>
								<Table.Cell class="font-mono text-sm">{rule.ip}</Table.Cell>
								<Table.Cell>{rule.description}</Table.Cell>
								<Table.Cell>
									<Badge variant={getTypeBadge(rule.type).variant}>
										{#if rule.type === 'allow'}
											<CheckCircle class="mr-1 h-3 w-3" />
										{:else}
											<Ban class="mr-1 h-3 w-3" />
										{/if}
										{getTypeBadge(rule.type).text}
									</Badge>
								</Table.Cell>
								<Table.Cell>
									<Badge variant={getStatusBadge(rule.status).variant}>
										{getStatusBadge(rule.status).text}
									</Badge>
								</Table.Cell>
								<Table.Cell>{rule.hitCount.toLocaleString()}</Table.Cell>
								<Table.Cell class="text-sm text-muted-foreground">
									{rule.lastUsed ? rule.lastUsed.toLocaleDateString() : 'Never'}
								</Table.Cell>
								<Table.Cell class="text-right">
									<div class="flex items-center justify-end gap-2">
										<Button 
											variant="ghost" 
											size="icon" 
											onclick={() => toggleRuleStatus(rule.id)}
											disabled={isLoading}
										>
											{#if rule.status === 'active'}
												<Ban class="h-4 w-4" />
											{:else}
												<CheckCircle class="h-4 w-4" />
											{/if}
										</Button>
										<Button 
											variant="ghost" 
											size="icon" 
											onclick={() => openEditDialog(rule)}
											disabled={isLoading}
										>
											<Edit class="h-4 w-4" />
										</Button>
										<Button 
											variant="ghost" 
											size="icon" 
											onclick={() => deleteIPRule(rule.id)}
											disabled={isLoading}
										>
											<Trash2 class="h-4 w-4" />
										</Button>
									</div>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			{/if}
		</Card.Content>
	</Card.Root>

	<!-- Recent Access Attempts -->
	<Card.Root>
		<Card.Header>
			<Card.Title>Recent Access Attempts</Card.Title>
			<Card.Description>Monitor IP access attempts and rule matches</Card.Description>
		</Card.Header>
		<Card.Content class="p-0">
			{#if filteredAttempts.length === 0}
				<div class="text-center py-8 space-y-2">
					<Globe class="h-8 w-8 mx-auto text-muted-foreground" />
					<p class="text-muted-foreground">No access attempts found</p>
				</div>
			{:else}
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>IP Address</Table.Head>
							<Table.Head>Action</Table.Head>
							<Table.Head>Rule Matched</Table.Head>
							<Table.Head>Timestamp</Table.Head>
							<Table.Head>User Agent</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each filteredAttempts as attempt}
							<Table.Row>
								<Table.Cell class="font-mono text-sm">{attempt.ip}</Table.Cell>
								<Table.Cell>
									<Badge variant={getActionBadge(attempt.action).variant}>
										{getActionBadge(attempt.action).text}
									</Badge>
								</Table.Cell>
								<Table.Cell>{attempt.rule}</Table.Cell>
								<Table.Cell class="text-sm text-muted-foreground">
									{attempt.timestamp.toLocaleString()}
								</Table.Cell>
								<Table.Cell class="text-sm text-muted-foreground max-w-xs truncate">
									{attempt.userAgent}
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			{/if}
		</Card.Content>
	</Card.Root>
</div>

<!-- Add IP Rule Dialog -->
<Dialog.Root bind:open={showAddIPDialog}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Add IP Access Rule</Dialog.Title>
			<Dialog.Description>
				Create a new IP address allow or block rule. Use CIDR notation for IP ranges.
			</Dialog.Description>
		</Dialog.Header>
		<form
			onsubmit={(e) => {
				e.preventDefault();
				addIPRule();
			}}
			class="space-y-4"
		>
			<div class="space-y-2">
				<Label for="ipAddress">IP Address/CIDR *</Label>
				<Input
					id="ipAddress"
					bind:value={newIPRule.ip}
					placeholder="e.g., 192.168.1.0/24 or 10.0.0.5"
					required
					class={errors.ip ? 'border-destructive' : ''}
				/>
				{#if errors.ip}
					<p class="text-sm text-destructive">{errors.ip}</p>
				{/if}
			</div>
			<div class="space-y-2">
				<Label for="ipDescription">Description *</Label>
				<Input
					id="ipDescription"
					bind:value={newIPRule.description}
					placeholder="e.g., Office network, Blocked suspicious IP"
					required
					class={errors.description ? 'border-destructive' : ''}
				/>
				{#if errors.description}
					<p class="text-sm text-destructive">{errors.description}</p>
				{/if}
			</div>
			<div class="space-y-2">
				<Label for="ipType">Action *</Label>
				<Select.Root bind:value={newIPRule.type}>
					<Select.Trigger>
						<Select.Value placeholder="Select action" />
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="allow">Allow</Select.Item>
						<Select.Item value="block">Block</Select.Item>
					</Select.Content>
				</Select.Root>
			</div>
			<Dialog.Footer>
				<Button 
					type="button" 
					variant="outline" 
					onclick={() => (showAddIPDialog = false)}
					disabled={isLoading}
				>
					Cancel
				</Button>
				<Button type="submit" disabled={isLoading}>
					{#if isLoading}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					{/if}
					Add Rule
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Edit IP Rule Dialog -->
<Dialog.Root bind:open={showEditIPDialog}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Edit IP Access Rule</Dialog.Title>
			<Dialog.Description>
				Update the IP address rule configuration.
			</Dialog.Description>
		</Dialog.Header>
		<form
			onsubmit={(e) => {
				e.preventDefault();
				updateIPRule();
			}}
			class="space-y-4"
		>
			<div class="space-y-2">
				<Label for="editIpAddress">IP Address/CIDR *</Label>
				<Input
					id="editIpAddress"
					bind:value={editIPRule.ip}
					placeholder="e.g., 192.168.1.0/24 or 10.0.0.5"
					required
					class={errors.ip ? 'border-destructive' : ''}
				/>
				{#if errors.ip}
					<p class="text-sm text-destructive">{errors.ip}</p>
				{/if}
			</div>
			<div class="space-y-2">
				<Label for="editIpDescription">Description *</Label>
				<Input
					id="editIpDescription"
					bind:value={editIPRule.description}
					placeholder="e.g., Office network, Blocked suspicious IP"
					required
					class={errors.description ? 'border-destructive' : ''}
				/>
				{#if errors.description}
					<p class="text-sm text-destructive">{errors.description}</p>
				{/if}
			</div>
			<div class="space-y-2">
				<Label for="editIpType">Action *</Label>
				<Select.Root bind:value={editIPRule.type}>
					<Select.Trigger>
						<Select.Value placeholder="Select action" />
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="allow">Allow</Select.Item>
						<Select.Item value="block">Block</Select.Item>
					</Select.Content>
				</Select.Root>
			</div>
			<Dialog.Footer>
				<Button 
					type="button" 
					variant="outline" 
					onclick={() => (showEditIPDialog = false)}
					disabled={isLoading}
				>
					Cancel
				</Button>
				<Button type="submit" disabled={isLoading}>
					{#if isLoading}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					{/if}
					Update Rule
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>