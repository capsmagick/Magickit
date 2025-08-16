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
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { authClient } from '$lib/auth/auth-client';
	import { goto } from '$app/navigation';
	import {
		Plus,
		Trash2,
		Search,
		RefreshCw,
		Shield,
		AlertTriangle,
		Loader2,
		Ban,
		CheckCircle,
		Clock,
		UserX,
		Settings,
		Save
	} from '@lucide/svelte';

	let hasCheckedAuth = $state(false);
	let showAddWhitelistDialog = $state(false);
	let isLoading = $state(false);
	let isSaving = $state(false);
	let searchTerm = $state('');

	const session = authClient.useSession();

	// Brute force protection settings
	let bruteForceSettings = $state({
		enabled: true,
		maxAttempts: 5,
		lockoutDuration: 15,
		lockoutUnits: 'minutes' as 'minutes' | 'hours',
		notifyAdmins: true,
		enableProgressiveLockout: true,
		progressiveMultiplier: 2,
		maxLockoutDuration: 24,
		maxLockoutUnits: 'hours' as 'minutes' | 'hours',
		enableCaptcha: true,
		captchaAfterAttempts: 3,
		logAttempts: true
	});

	// Whitelist IPs
	let whitelistIPs = $state([
		{
			id: '1',
			ip: '192.168.1.0/24',
			description: 'Office network',
			createdAt: new Date('2024-01-01'),
			createdBy: 'admin@example.com'
		},
		{
			id: '2',
			ip: '10.0.0.1',
			description: 'Admin workstation',
			createdAt: new Date('2024-01-10'),
			createdBy: 'admin@example.com'
		}
	]);

	// Blocked IPs
	let blockedIPs = $state([
		{
			id: '1',
			ip: '203.0.113.45',
			attempts: 8,
			lastAttempt: new Date('2024-01-20T10:25:00'),
			blockedAt: new Date('2024-01-20T10:25:30'),
			expiresAt: new Date('2024-01-20T10:40:30'),
			reason: 'Exceeded maximum login attempts',
			status: 'active' as 'active' | 'expired' | 'manually_unblocked'
		},
		{
			id: '2',
			ip: '198.51.100.123',
			attempts: 12,
			lastAttempt: new Date('2024-01-19T15:45:00'),
			blockedAt: new Date('2024-01-19T15:45:15'),
			expiresAt: new Date('2024-01-19T16:45:15'),
			reason: 'Repeated failed login attempts',
			status: 'expired' as 'active' | 'expired' | 'manually_unblocked'
		},
		{
			id: '3',
			ip: '192.0.2.100',
			attempts: 6,
			lastAttempt: new Date('2024-01-18T09:30:00'),
			blockedAt: new Date('2024-01-18T09:30:20'),
			expiresAt: new Date('2024-01-18T09:45:20'),
			reason: 'Brute force attack detected',
			status: 'manually_unblocked' as 'active' | 'expired' | 'manually_unblocked'
		}
	]);

	// Recent attempts
	let recentAttempts = $state([
		{
			id: '1',
			ip: '203.0.113.45',
			username: 'admin',
			timestamp: new Date('2024-01-20T10:25:00'),
			success: false,
			userAgent: 'curl/7.68.0',
			attemptCount: 8
		},
		{
			id: '2',
			ip: '192.168.1.100',
			username: 'john@example.com',
			timestamp: new Date('2024-01-20T10:20:00'),
			success: true,
			userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
			attemptCount: 1
		},
		{
			id: '3',
			ip: '198.51.100.123',
			username: 'test',
			timestamp: new Date('2024-01-19T15:45:00'),
			success: false,
			userAgent: 'python-requests/2.25.1',
			attemptCount: 12
		}
	]);

	// Form data
	let newWhitelistIP = $state({
		ip: '',
		description: ''
	});

	// Validation errors
	let errors = $state({
		ip: '',
		description: '',
		settings: ''
	});

	// Reactive statement to check session and redirect if needed
	$effect(() => {
		if (!hasCheckedAuth && $session.data) {
			hasCheckedAuth = true;
			if ($session.data.user.role !== 'admin') {
				goto('/login?returnTo=/admin/security/brute-force');
				return;
			}
		}
	});

	// Filtered data based on search
	const filteredBlockedIPs = $derived.by(() => {
		if (!searchTerm) return blockedIPs;
		return blockedIPs.filter(blocked => 
			blocked.ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
			blocked.reason.toLowerCase().includes(searchTerm.toLowerCase())
		);
	});

	const filteredAttempts = $derived.by(() => {
		if (!searchTerm) return recentAttempts.slice(0, 10);
		return recentAttempts.filter(attempt => 
			attempt.ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
			attempt.username.toLowerCase().includes(searchTerm.toLowerCase())
		);
	});

	function validateIPAddress(ip: string): boolean {
		const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?:\/(?:[0-9]|[1-2][0-9]|3[0-2]))?$/;
		const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}(?:\/(?:[0-9]|[1-9][0-9]|1[0-1][0-9]|12[0-8]))?$/;
		return ipv4Regex.test(ip) || ipv6Regex.test(ip);
	}

	function validateSettings(): boolean {
		errors.settings = '';
		
		if (bruteForceSettings.maxAttempts < 1 || bruteForceSettings.maxAttempts > 50) {
			errors.settings = 'Maximum attempts must be between 1 and 50';
			return false;
		}
		
		if (bruteForceSettings.lockoutDuration < 1) {
			errors.settings = 'Lockout duration must be at least 1';
			return false;
		}
		
		if (bruteForceSettings.enableProgressiveLockout && bruteForceSettings.progressiveMultiplier < 1) {
			errors.settings = 'Progressive multiplier must be at least 1';
			return false;
		}
		
		if (bruteForceSettings.enableCaptcha && bruteForceSettings.captchaAfterAttempts < 1) {
			errors.settings = 'CAPTCHA threshold must be at least 1';
			return false;
		}
		
		return true;
	}

	async function saveSettings() {
		if (!validateSettings()) {
			return;
		}

		isSaving = true;
		
		try {
			// Simulate API call
			await new Promise(resolve => setTimeout(resolve, 1000));
			
			// Settings would be saved to backend here
			console.log('Brute force settings saved:', bruteForceSettings);
		} catch (error) {
			console.error('Error saving settings:', error);
			errors.settings = 'Failed to save settings. Please try again.';
		} finally {
			isSaving = false;
		}
	}

	async function addWhitelistIP() {
		errors = { ip: '', description: '', settings: '' };
		
		if (!newWhitelistIP.ip.trim()) {
			errors.ip = 'IP address is required';
			return;
		}
		
		if (!validateIPAddress(newWhitelistIP.ip.trim())) {
			errors.ip = 'Please enter a valid IP address or CIDR notation';
			return;
		}
		
		if (!newWhitelistIP.description.trim()) {
			errors.description = 'Description is required';
			return;
		}

		isLoading = true;
		
		try {
			// Simulate API call
			await new Promise(resolve => setTimeout(resolve, 500));

			const whitelistEntry = {
				id: Date.now().toString(),
				ip: newWhitelistIP.ip.trim(),
				description: newWhitelistIP.description.trim(),
				createdAt: new Date(),
				createdBy: $session.data?.user?.email || 'admin'
			};

			whitelistIPs = [...whitelistIPs, whitelistEntry];
			newWhitelistIP = { ip: '', description: '' };
			showAddWhitelistDialog = false;
		} catch (error) {
			console.error('Error adding whitelist IP:', error);
		} finally {
			isLoading = false;
		}
	}

	async function removeWhitelistIP(ipId: string) {
		if (!confirm('Are you sure you want to remove this IP from the whitelist?')) {
			return;
		}

		isLoading = true;
		
		try {
			// Simulate API call
			await new Promise(resolve => setTimeout(resolve, 500));
			whitelistIPs = whitelistIPs.filter(ip => ip.id !== ipId);
		} catch (error) {
			console.error('Error removing whitelist IP:', error);
		} finally {
			isLoading = false;
		}
	}

	async function unblockIP(ipId: string) {
		if (!confirm('Are you sure you want to unblock this IP address?')) {
			return;
		}

		isLoading = true;
		
		try {
			// Simulate API call
			await new Promise(resolve => setTimeout(resolve, 500));
			
			blockedIPs = blockedIPs.map(blocked =>
				blocked.id === ipId
					? { ...blocked, status: 'manually_unblocked' as const }
					: blocked
			);
		} catch (error) {
			console.error('Error unblocking IP:', error);
		} finally {
			isLoading = false;
		}
	}

	function getStatusBadge(status: 'active' | 'expired' | 'manually_unblocked') {
		switch (status) {
			case 'active':
				return { variant: 'destructive' as const, text: 'Blocked' };
			case 'expired':
				return { variant: 'secondary' as const, text: 'Expired' };
			case 'manually_unblocked':
				return { variant: 'default' as const, text: 'Unblocked' };
		}
	}

	function getAttemptBadge(success: boolean) {
		return success 
			? { variant: 'default' as const, text: 'Success' }
			: { variant: 'destructive' as const, text: 'Failed' };
	}

	function refreshData() {
		isLoading = true;
		// Simulate data refresh
		setTimeout(() => {
			isLoading = false;
		}, 1000);
	}

	function isExpired(expiresAt: Date): boolean {
		return new Date() > expiresAt;
	}

	function formatDuration(duration: number, units: 'minutes' | 'hours'): string {
		return `${duration} ${units}`;
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
		<div class="space-y-2">
			<h1 class="text-2xl font-bold">Brute Force Protection</h1>
			<p class="text-muted-foreground">
				Configure protection against brute force attacks and monitor blocked IPs
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
		</div>
	</div>

	<!-- Protection Status Alert -->
	{#if bruteForceSettings.enabled}
		<Alert.Root>
			<Shield class="h-4 w-4" />
			<Alert.Title>Brute Force Protection Active</Alert.Title>
			<Alert.Description>
				Protection is enabled with {bruteForceSettings.maxAttempts} max attempts and {formatDuration(bruteForceSettings.lockoutDuration, bruteForceSettings.lockoutUnits)} lockout duration.
			</Alert.Description>
		</Alert.Root>
	{:else}
		<Alert.Root variant="destructive">
			<AlertTriangle class="h-4 w-4" />
			<Alert.Title>Brute Force Protection Disabled</Alert.Title>
			<Alert.Description>
				Your system is vulnerable to brute force attacks. Enable protection below.
			</Alert.Description>
		</Alert.Root>
	{/if}

	<!-- Statistics Cards -->
	<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
		<Card.Root>
			<Card.Content class="p-4">
				<div class="flex items-center gap-2">
					<Ban class="h-4 w-4 text-red-500" />
					<div>
						<p class="text-sm text-muted-foreground">Blocked IPs</p>
						<p class="text-2xl font-bold">{blockedIPs.filter(b => b.status === 'active').length}</p>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Content class="p-4">
				<div class="flex items-center gap-2">
					<CheckCircle class="h-4 w-4 text-green-500" />
					<div>
						<p class="text-sm text-muted-foreground">Whitelisted IPs</p>
						<p class="text-2xl font-bold">{whitelistIPs.length}</p>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Content class="p-4">
				<div class="flex items-center gap-2">
					<AlertTriangle class="h-4 w-4 text-yellow-500" />
					<div>
						<p class="text-sm text-muted-foreground">Failed Attempts (24h)</p>
						<p class="text-2xl font-bold">{recentAttempts.filter(a => !a.success).length}</p>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Content class="p-4">
				<div class="flex items-center gap-2">
					<Clock class="h-4 w-4 text-blue-500" />
					<div>
						<p class="text-sm text-muted-foreground">Avg Lockout</p>
						<p class="text-2xl font-bold">{formatDuration(bruteForceSettings.lockoutDuration, bruteForceSettings.lockoutUnits)}</p>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Protection Settings -->
	<Card.Root>
		<Card.Header>
			<Card.Title>Protection Settings</Card.Title>
			<Card.Description>Configure brute force protection parameters</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-6">
			<!-- Enable/Disable Protection -->
			<div class="flex items-center justify-between rounded-lg border p-4">
				<div>
					<h4 class="font-medium">Enable Brute Force Protection</h4>
					<p class="text-sm text-muted-foreground">
						Automatically block IPs after multiple failed login attempts
					</p>
				</div>
				<Switch bind:checked={bruteForceSettings.enabled} />
			</div>

			{#if bruteForceSettings.enabled}
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<!-- Basic Settings -->
					<div class="space-y-4">
						<h4 class="font-medium">Basic Settings</h4>
						<div class="space-y-3">
							<div>
								<Label for="maxAttempts">Maximum Failed Attempts</Label>
								<Input
									id="maxAttempts"
									type="number"
									bind:value={bruteForceSettings.maxAttempts}
									min="1"
									max="50"
									class="transition-colors duration-200"
								/>
								<p class="text-xs text-muted-foreground mt-1">
									Number of failed attempts before blocking (1-50)
								</p>
							</div>
							<div>
								<Label for="lockoutDuration">Initial Lockout Duration</Label>
								<div class="flex gap-2">
									<Input
										id="lockoutDuration"
										type="number"
										bind:value={bruteForceSettings.lockoutDuration}
										min="1"
										max="1440"
										class="transition-colors duration-200"
									/>
									<Select.Root bind:value={bruteForceSettings.lockoutUnits}>
										<Select.Trigger class="w-32">
											<Select.Value />
										</Select.Trigger>
										<Select.Content>
											<Select.Item value="minutes">Minutes</Select.Item>
											<Select.Item value="hours">Hours</Select.Item>
										</Select.Content>
									</Select.Root>
								</div>
							</div>
						</div>
					</div>

					<!-- Advanced Settings -->
					<div class="space-y-4">
						<h4 class="font-medium">Advanced Settings</h4>
						<div class="space-y-3">
							<div class="flex items-center justify-between">
								<div>
									<Label>Progressive Lockout</Label>
									<p class="text-xs text-muted-foreground">
										Increase lockout duration for repeat offenders
									</p>
								</div>
								<Switch bind:checked={bruteForceSettings.enableProgressiveLockout} />
							</div>
							
							{#if bruteForceSettings.enableProgressiveLockout}
								<div>
									<Label for="progressiveMultiplier">Progressive Multiplier</Label>
									<Input
										id="progressiveMultiplier"
										type="number"
										bind:value={bruteForceSettings.progressiveMultiplier}
										min="1"
										max="10"
										step="0.1"
										class="transition-colors duration-200"
									/>
									<p class="text-xs text-muted-foreground mt-1">
										Multiply lockout duration by this factor for each subsequent block
									</p>
								</div>
								<div>
									<Label for="maxLockoutDuration">Maximum Lockout Duration</Label>
									<div class="flex gap-2">
										<Input
											id="maxLockoutDuration"
											type="number"
											bind:value={bruteForceSettings.maxLockoutDuration}
											min="1"
											class="transition-colors duration-200"
										/>
										<Select.Root bind:value={bruteForceSettings.maxLockoutUnits}>
											<Select.Trigger class="w-32">
												<Select.Value />
											</Select.Trigger>
											<Select.Content>
												<Select.Item value="minutes">Minutes</Select.Item>
												<Select.Item value="hours">Hours</Select.Item>
											</Select.Content>
										</Select.Root>
									</div>
								</div>
							{/if}
						</div>
					</div>
				</div>

				<!-- Additional Options -->
				<div class="space-y-4">
					<h4 class="font-medium">Additional Options</h4>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div class="flex items-center justify-between rounded-lg border p-4">
							<div>
								<Label>CAPTCHA Protection</Label>
								<p class="text-sm text-muted-foreground">
									Show CAPTCHA after failed attempts
								</p>
							</div>
							<Switch bind:checked={bruteForceSettings.enableCaptcha} />
						</div>
						
						{#if bruteForceSettings.enableCaptcha}
							<div class="rounded-lg border p-4">
								<Label for="captchaAfterAttempts">CAPTCHA After Attempts</Label>
								<Input
									id="captchaAfterAttempts"
									type="number"
									bind:value={bruteForceSettings.captchaAfterAttempts}
									min="1"
									max="10"
									class="mt-2 transition-colors duration-200"
								/>
							</div>
						{/if}
						
						<div class="flex items-center justify-between rounded-lg border p-4">
							<div>
								<Label>Admin Notifications</Label>
								<p class="text-sm text-muted-foreground">
									Notify administrators when IPs are blocked
								</p>
							</div>
							<Switch bind:checked={bruteForceSettings.notifyAdmins} />
						</div>
						
						<div class="flex items-center justify-between rounded-lg border p-4">
							<div>
								<Label>Log Attempts</Label>
								<p class="text-sm text-muted-foreground">
									Keep detailed logs of all login attempts
								</p>
							</div>
							<Switch bind:checked={bruteForceSettings.logAttempts} />
						</div>
					</div>
				</div>

				{#if errors.settings}
					<Alert.Root variant="destructive">
						<AlertTriangle class="h-4 w-4" />
						<Alert.Description>{errors.settings}</Alert.Description>
					</Alert.Root>
				{/if}

				<div class="flex justify-end">
					<Button onclick={saveSettings} disabled={isSaving}>
						{#if isSaving}
							<Loader2 class="mr-2 h-4 w-4 animate-spin" />
						{:else}
							<Save class="mr-2 h-4 w-4" />
						{/if}
						Save Settings
					</Button>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>

	<!-- Whitelist Management -->
	<Card.Root>
		<Card.Header>
			<div class="flex justify-between items-center">
				<div>
					<Card.Title>IP Whitelist</Card.Title>
					<Card.Description>IPs that are exempt from brute force protection</Card.Description>
				</div>
				<Button onclick={() => (showAddWhitelistDialog = true)}>
					<Plus class="mr-2 h-4 w-4" />
					Add IP
				</Button>
			</div>
		</Card.Header>
		<Card.Content class="p-0">
			{#if whitelistIPs.length === 0}
				<div class="text-center py-8 space-y-2">
					<CheckCircle class="h-8 w-8 mx-auto text-muted-foreground" />
					<p class="text-muted-foreground">No whitelisted IPs</p>
				</div>
			{:else}
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>IP Address/Range</Table.Head>
							<Table.Head>Description</Table.Head>
							<Table.Head>Created</Table.Head>
							<Table.Head>Created By</Table.Head>
							<Table.Head class="text-right">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each whitelistIPs as whitelistIP}
							<Table.Row>
								<Table.Cell class="font-mono text-sm">{whitelistIP.ip}</Table.Cell>
								<Table.Cell>{whitelistIP.description}</Table.Cell>
								<Table.Cell class="text-sm text-muted-foreground">
									{whitelistIP.createdAt.toLocaleDateString()}
								</Table.Cell>
								<Table.Cell class="text-sm text-muted-foreground">
									{whitelistIP.createdBy}
								</Table.Cell>
								<Table.Cell class="text-right">
									<Button 
										variant="ghost" 
										size="icon" 
										onclick={() => removeWhitelistIP(whitelistIP.id)}
										disabled={isLoading}
									>
										<Trash2 class="h-4 w-4" />
									</Button>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			{/if}
		</Card.Content>
	</Card.Root>

	<!-- Search and Filters -->
	<Card.Root>
		<Card.Content class="p-4">
			<div class="flex flex-col sm:flex-row gap-4">
				<div class="flex-1">
					<div class="relative">
						<Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
						<Input 
							type="search" 
							placeholder="Search blocked IPs or recent attempts..." 
							class="pl-8" 
							bind:value={searchTerm} 
						/>
					</div>
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Blocked IPs -->
	<Card.Root>
		<Card.Header>
			<Card.Title>Blocked IPs</Card.Title>
			<Card.Description>IPs currently blocked due to brute force attempts</Card.Description>
		</Card.Header>
		<Card.Content class="p-0">
			{#if filteredBlockedIPs.length === 0}
				<div class="text-center py-8 space-y-2">
					<Ban class="h-8 w-8 mx-auto text-muted-foreground" />
					<p class="text-muted-foreground">
						{searchTerm ? 'No blocked IPs match your search' : 'No blocked IPs'}
					</p>
				</div>
			{:else}
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>IP Address</Table.Head>
							<Table.Head>Attempts</Table.Head>
							<Table.Head>Status</Table.Head>
							<Table.Head>Blocked At</Table.Head>
							<Table.Head>Expires At</Table.Head>
							<Table.Head>Reason</Table.Head>
							<Table.Head class="text-right">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each filteredBlockedIPs as blocked}
							<Table.Row>
								<Table.Cell class="font-mono text-sm">{blocked.ip}</Table.Cell>
								<Table.Cell>{blocked.attempts}</Table.Cell>
								<Table.Cell>
									<Badge variant={getStatusBadge(blocked.status).variant}>
										{getStatusBadge(blocked.status).text}
									</Badge>
								</Table.Cell>
								<Table.Cell class="text-sm text-muted-foreground">
									{blocked.blockedAt.toLocaleString()}
								</Table.Cell>
								<Table.Cell class="text-sm text-muted-foreground">
									{blocked.expiresAt.toLocaleString()}
									{#if blocked.status === 'active' && isExpired(blocked.expiresAt)}
										<Badge variant="secondary" class="ml-2">Expired</Badge>
									{/if}
								</Table.Cell>
								<Table.Cell class="text-sm">{blocked.reason}</Table.Cell>
								<Table.Cell class="text-right">
									{#if blocked.status === 'active'}
										<Button 
											variant="ghost" 
											size="icon" 
											onclick={() => unblockIP(blocked.id)}
											disabled={isLoading}
										>
											<CheckCircle class="h-4 w-4" />
										</Button>
									{/if}
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			{/if}
		</Card.Content>
	</Card.Root>

	<!-- Recent Login Attempts -->
	<Card.Root>
		<Card.Header>
			<Card.Title>Recent Login Attempts</Card.Title>
			<Card.Description>Monitor recent login attempts and potential threats</Card.Description>
		</Card.Header>
		<Card.Content class="p-0">
			{#if filteredAttempts.length === 0}
				<div class="text-center py-8 space-y-2">
					<UserX class="h-8 w-8 mx-auto text-muted-foreground" />
					<p class="text-muted-foreground">No recent attempts found</p>
				</div>
			{:else}
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>IP Address</Table.Head>
							<Table.Head>Username</Table.Head>
							<Table.Head>Result</Table.Head>
							<Table.Head>Attempt Count</Table.Head>
							<Table.Head>Timestamp</Table.Head>
							<Table.Head>User Agent</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each filteredAttempts as attempt}
							<Table.Row>
								<Table.Cell class="font-mono text-sm">{attempt.ip}</Table.Cell>
								<Table.Cell>{attempt.username}</Table.Cell>
								<Table.Cell>
									<Badge variant={getAttemptBadge(attempt.success).variant}>
										{getAttemptBadge(attempt.success).text}
									</Badge>
								</Table.Cell>
								<Table.Cell>
									{#if attempt.attemptCount > bruteForceSettings.maxAttempts}
										<Badge variant="destructive">{attempt.attemptCount}</Badge>
									{:else}
										{attempt.attemptCount}
									{/if}
								</Table.Cell>
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

<!-- Add Whitelist IP Dialog -->
<Dialog.Root bind:open={showAddWhitelistDialog}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Add Whitelist IP</Dialog.Title>
			<Dialog.Description>
				Add an IP address that will be exempt from brute force protection.
			</Dialog.Description>
		</Dialog.Header>
		<form
			onsubmit={(e) => {
				e.preventDefault();
				addWhitelistIP();
			}}
			class="space-y-4"
		>
			<div class="space-y-2">
				<Label for="whitelistIP">IP Address/CIDR *</Label>
				<Input
					id="whitelistIP"
					bind:value={newWhitelistIP.ip}
					placeholder="e.g., 192.168.1.0/24 or 10.0.0.5"
					required
					class={errors.ip ? 'border-destructive' : ''}
				/>
				{#if errors.ip}
					<p class="text-sm text-destructive">{errors.ip}</p>
				{/if}
			</div>
			<div class="space-y-2">
				<Label for="whitelistDescription">Description *</Label>
				<Input
					id="whitelistDescription"
					bind:value={newWhitelistIP.description}
					placeholder="e.g., Office network, Admin workstation"
					required
					class={errors.description ? 'border-destructive' : ''}
				/>
				{#if errors.description}
					<p class="text-sm text-destructive">{errors.description}</p>
				{/if}
			</div>
			<Dialog.Footer>
				<Button 
					type="button" 
					variant="outline" 
					onclick={() => (showAddWhitelistDialog = false)}
					disabled={isLoading}
				>
					Cancel
				</Button>
				<Button type="submit" disabled={isLoading}>
					{#if isLoading}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					{/if}
					Add IP
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>