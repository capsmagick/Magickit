<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { authClient } from '$lib/auth/auth-client';
	import { goto } from '$app/navigation';
	import { 
		Shield, Lock, Key, Smartphone, Monitor, Tablet, MapPin, Clock,
		Loader2, CheckCircle, AlertCircle, ArrowLeft, Eye, EyeOff, 
		AlertTriangle, Trash2, LogOut, QrCode, Copy, RefreshCw
	} from '@lucide/svelte';

	let passwordForm = $state({
		currentPassword: '',
		newPassword: '',
		confirmPassword: ''
	});

	let showPasswords = $state({
		current: false,
		new: false,
		confirm: false
	});

	let twoFactorEnabled = $state(false);
	let isLoading = $state(false);
	let error = $state('');
	let success = $state('');
	let qrCodeUrl = $state('');
	let backupCodes = $state<string[]>([]);
	let showBackupCodes = $state(false);

	const session = authClient.useSession();

	// Check if user is logged in
	$effect(() => {
		if (!$session.data) {
			goto('/login?returnTo=/my-account/security');
		}
	});

	// Mock login sessions data
	const loginSessions = [
		{
			id: '1',
			device: 'Chrome on Windows',
			location: 'New York, NY, USA',
			ipAddress: '192.168.1.100',
			lastActive: '2 minutes ago',
			current: true,
			icon: Monitor
		},
		{
			id: '2',
			device: 'Safari on iPhone',
			location: 'New York, NY, USA',
			ipAddress: '192.168.1.101',
			lastActive: '1 hour ago',
			current: false,
			icon: Smartphone
		},
		{
			id: '3',
			device: 'Chrome on iPad',
			location: 'Boston, MA, USA',
			ipAddress: '10.0.0.50',
			lastActive: '2 days ago',
			current: false,
			icon: Tablet
		}
	];

	async function handlePasswordChange(e: SubmitEvent) {
		e.preventDefault();
		isLoading = true;
		error = '';
		success = '';

		try {
			// Validate passwords
			if (!passwordForm.currentPassword) {
				throw new Error('Current password is required');
			}
			if (passwordForm.newPassword.length < 8) {
				throw new Error('New password must be at least 8 characters long');
			}
			if (passwordForm.newPassword !== passwordForm.confirmPassword) {
				throw new Error('New passwords do not match');
			}
			if (passwordForm.currentPassword === passwordForm.newPassword) {
				throw new Error('New password must be different from current password');
			}

			// Password strength validation
			const hasUpperCase = /[A-Z]/.test(passwordForm.newPassword);
			const hasLowerCase = /[a-z]/.test(passwordForm.newPassword);
			const hasNumbers = /\d/.test(passwordForm.newPassword);
			const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(passwordForm.newPassword);

			if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
				throw new Error('Password must contain uppercase, lowercase, numbers, and special characters');
			}

			// In a real app, you'd send this to your API
			await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
			
			// Clear form
			passwordForm = {
				currentPassword: '',
				newPassword: '',
				confirmPassword: ''
			};
			
			success = 'Password changed successfully!';
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to change password';
		} finally {
			isLoading = false;
		}
	}

	async function handleEnable2FA() {
		isLoading = true;
		error = '';

		try {
			// In a real app, you'd call your API to generate QR code and backup codes
			await new Promise(resolve => setTimeout(resolve, 1000));
			
			// Mock QR code URL and backup codes
			qrCodeUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZiIvPjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxNCI+UVIgQ29kZTwvdGV4dD48L3N2Zz4=';
			backupCodes = [
				'1234-5678-9012',
				'2345-6789-0123',
				'3456-7890-1234',
				'4567-8901-2345',
				'5678-9012-3456',
				'6789-0123-4567',
				'7890-1234-5678',
				'8901-2345-6789'
			];
			showBackupCodes = true;
		} catch (err) {
			error = 'Failed to enable two-factor authentication';
		} finally {
			isLoading = false;
		}
	}

	async function handleDisable2FA() {
		isLoading = true;
		error = '';

		try {
			await new Promise(resolve => setTimeout(resolve, 1000));
			twoFactorEnabled = false;
			qrCodeUrl = '';
			backupCodes = [];
			showBackupCodes = false;
			success = 'Two-factor authentication disabled successfully';
		} catch (err) {
			error = 'Failed to disable two-factor authentication';
		} finally {
			isLoading = false;
		}
	}

	async function handleConfirm2FA() {
		twoFactorEnabled = true;
		showBackupCodes = false;
		success = 'Two-factor authentication enabled successfully!';
	}

	async function terminateSession(sessionId: string) {
		isLoading = true;
		error = '';

		try {
			await new Promise(resolve => setTimeout(resolve, 500));
			success = 'Session terminated successfully';
		} catch (err) {
			error = 'Failed to terminate session';
		} finally {
			isLoading = false;
		}
	}

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
		success = 'Copied to clipboard!';
	}

	function getPasswordStrength(password: string): { score: number; label: string; color: string } {
		if (!password) return { score: 0, label: 'No password', color: 'text-muted-foreground' };
		
		let score = 0;
		if (password.length >= 8) score++;
		if (/[A-Z]/.test(password)) score++;
		if (/[a-z]/.test(password)) score++;
		if (/\d/.test(password)) score++;
		if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

		if (score <= 2) return { score, label: 'Weak', color: 'text-destructive' };
		if (score <= 3) return { score, label: 'Fair', color: 'text-orange-500' };
		if (score <= 4) return { score, label: 'Good', color: 'text-yellow-500' };
		return { score, label: 'Strong', color: 'text-green-500' };
	}

	let passwordStrength = $derived(getPasswordStrength(passwordForm.newPassword));
</script>

<div class="container mx-auto max-w-4xl px-4 py-6">
	<div class="space-y-6">
		<!-- Header -->
		<div class="flex items-center gap-4">
			<Button variant="ghost" size="icon" onclick={() => goto('/my-account')}>
				<ArrowLeft class="h-4 w-4" />
			</Button>
			<div class="space-y-2">
				<h1 class="text-2xl font-bold">Security Settings</h1>
				<p class="text-muted-foreground text-sm">
					Manage your password, two-factor authentication, and login sessions
				</p>
			</div>
		</div>

		{#if error}
			<Alert.Root variant="destructive">
				<AlertCircle class="h-4 w-4" />
				<Alert.Description>{error}</Alert.Description>
			</Alert.Root>
		{/if}

		{#if success}
			<Alert.Root variant="default" class="border-green-200 bg-green-50 text-green-800">
				<CheckCircle class="h-4 w-4" />
				<Alert.Description>{success}</Alert.Description>
			</Alert.Root>
		{/if}

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- Password Change -->
			<Card.Root>
				<Card.Header class="space-y-2">
					<Card.Title class="text-lg flex items-center gap-2">
						<Lock class="h-5 w-5" />
						Change Password
					</Card.Title>
					<Card.Description class="text-sm">
						Update your password to keep your account secure
					</Card.Description>
				</Card.Header>
				<Card.Content class="p-4">
					<form onsubmit={handlePasswordChange} class="space-y-6">
						<div class="space-y-2">
							<Label for="current-password" class="text-sm font-medium">Current Password</Label>
							<div class="relative">
								<Input 
									id="current-password" 
									type={showPasswords.current ? 'text' : 'password'}
									bind:value={passwordForm.currentPassword} 
									required 
									disabled={isLoading}
									class="transition-colors duration-200 pr-10"
									placeholder="Enter current password"
								/>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									class="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
									onclick={() => showPasswords.current = !showPasswords.current}
								>
									{#if showPasswords.current}
										<EyeOff class="h-4 w-4" />
									{:else}
										<Eye class="h-4 w-4" />
									{/if}
								</Button>
							</div>
						</div>

						<div class="space-y-2">
							<Label for="new-password" class="text-sm font-medium">New Password</Label>
							<div class="relative">
								<Input 
									id="new-password" 
									type={showPasswords.new ? 'text' : 'password'}
									bind:value={passwordForm.newPassword} 
									required 
									disabled={isLoading}
									class="transition-colors duration-200 pr-10"
									placeholder="Enter new password"
								/>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									class="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
									onclick={() => showPasswords.new = !showPasswords.new}
								>
									{#if showPasswords.new}
										<EyeOff class="h-4 w-4" />
									{:else}
										<Eye class="h-4 w-4" />
									{/if}
								</Button>
							</div>
							{#if passwordForm.newPassword}
								<div class="flex items-center gap-2">
									<div class="flex-1 bg-muted rounded-full h-2">
										<div 
											class="h-2 rounded-full transition-all duration-300 {passwordStrength.color.replace('text-', 'bg-')}"
											style="width: {(passwordStrength.score / 5) * 100}%"
										></div>
									</div>
									<span class="text-xs {passwordStrength.color}">{passwordStrength.label}</span>
								</div>
							{/if}
						</div>

						<div class="space-y-2">
							<Label for="confirm-password" class="text-sm font-medium">Confirm New Password</Label>
							<div class="relative">
								<Input 
									id="confirm-password" 
									type={showPasswords.confirm ? 'text' : 'password'}
									bind:value={passwordForm.confirmPassword} 
									required 
									disabled={isLoading}
									class="transition-colors duration-200 pr-10"
									placeholder="Confirm new password"
								/>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									class="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
									onclick={() => showPasswords.confirm = !showPasswords.confirm}
								>
									{#if showPasswords.confirm}
										<EyeOff class="h-4 w-4" />
									{:else}
										<Eye class="h-4 w-4" />
									{/if}
								</Button>
							</div>
							{#if passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword}
								<p class="text-xs text-destructive">Passwords do not match</p>
							{/if}
						</div>

						<Button 
							type="submit" 
							disabled={isLoading || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
							class="w-full transition-colors duration-200"
						>
							{#if isLoading}
								<Loader2 class="mr-2 h-4 w-4 animate-spin" />
								Changing Password...
							{:else}
								<Key class="mr-2 h-4 w-4" />
								Change Password
							{/if}
						</Button>
					</form>
				</Card.Content>
			</Card.Root>

			<!-- Two-Factor Authentication -->
			<Card.Root>
				<Card.Header class="space-y-2">
					<Card.Title class="text-lg flex items-center gap-2">
						<Smartphone class="h-5 w-5" />
						Two-Factor Authentication
					</Card.Title>
					<Card.Description class="text-sm">
						Add an extra layer of security to your account
					</Card.Description>
				</Card.Header>
				<Card.Content class="p-4 space-y-6">
					<div class="flex items-center justify-between">
						<div class="space-y-1">
							<p class="text-sm font-medium">Status</p>
							<p class="text-xs text-muted-foreground">
								{twoFactorEnabled ? 'Two-factor authentication is enabled' : 'Two-factor authentication is disabled'}
							</p>
						</div>
						<Badge variant={twoFactorEnabled ? 'default' : 'secondary'}>
							{twoFactorEnabled ? 'Enabled' : 'Disabled'}
						</Badge>
					</div>

					{#if !twoFactorEnabled && !qrCodeUrl}
						<div class="space-y-4">
							<Alert.Root>
								<Shield class="h-4 w-4" />
								<Alert.Description>
									Enable two-factor authentication to significantly improve your account security.
								</Alert.Description>
							</Alert.Root>
							<Button 
								onclick={handleEnable2FA}
								disabled={isLoading}
								class="w-full transition-colors duration-200"
							>
								{#if isLoading}
									<Loader2 class="mr-2 h-4 w-4 animate-spin" />
									Setting up...
								{:else}
									<QrCode class="mr-2 h-4 w-4" />
									Enable 2FA
								{/if}
							</Button>
						</div>
					{/if}

					{#if qrCodeUrl && !twoFactorEnabled}
						<div class="space-y-4">
							<div class="text-center space-y-4">
								<p class="text-sm font-medium">Scan this QR code with your authenticator app:</p>
								<div class="flex justify-center">
									<img src={qrCodeUrl} alt="2FA QR Code" class="border rounded-lg" />
								</div>
								<p class="text-xs text-muted-foreground">
									Use Google Authenticator, Authy, or any compatible TOTP app
								</p>
							</div>

							{#if showBackupCodes}
								<div class="space-y-4">
									<Alert.Root variant="destructive">
										<AlertTriangle class="h-4 w-4" />
										<Alert.Description>
											Save these backup codes in a secure location. You can use them to access your account if you lose your authenticator device.
										</Alert.Description>
									</Alert.Root>
									
									<div class="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg">
										{#each backupCodes as code}
											<div class="flex items-center justify-between p-2 bg-background rounded border">
												<code class="text-sm font-mono">{code}</code>
												<Button
													variant="ghost"
													size="icon"
													onclick={() => copyToClipboard(code)}
													class="h-6 w-6"
												>
													<Copy class="h-3 w-3" />
												</Button>
											</div>
										{/each}
									</div>
								</div>
							{/if}

							<div class="flex gap-2">
								<Button 
									onclick={handleConfirm2FA}
									disabled={isLoading}
									class="flex-1 transition-colors duration-200"
								>
									<CheckCircle class="mr-2 h-4 w-4" />
									Confirm Setup
								</Button>
								<Button 
									variant="outline"
									onclick={() => { qrCodeUrl = ''; showBackupCodes = false; }}
									disabled={isLoading}
									class="transition-colors duration-200"
								>
									Cancel
								</Button>
							</div>
						</div>
					{/if}

					{#if twoFactorEnabled}
						<div class="space-y-4">
							<Alert.Root variant="default" class="border-green-200 bg-green-50">
								<CheckCircle class="h-4 w-4 text-green-600" />
								<Alert.Description class="text-green-800">
									Two-factor authentication is protecting your account.
								</Alert.Description>
							</Alert.Root>
							<Button 
								variant="destructive"
								onclick={handleDisable2FA}
								disabled={isLoading}
								class="w-full transition-colors duration-200"
							>
								{#if isLoading}
									<Loader2 class="mr-2 h-4 w-4 animate-spin" />
									Disabling...
								{:else}
									Disable 2FA
								{/if}
							</Button>
						</div>
					{/if}
				</Card.Content>
			</Card.Root>
		</div>

		<!-- Login Sessions -->
		<Card.Root>
			<Card.Header class="space-y-2">
				<Card.Title class="text-lg flex items-center gap-2">
					<Monitor class="h-5 w-5" />
					Active Login Sessions
				</Card.Title>
				<Card.Description class="text-sm">
					Monitor and manage your active login sessions across devices
				</Card.Description>
			</Card.Header>
			<Card.Content class="p-0">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Device & Browser</Table.Head>
							<Table.Head>Location</Table.Head>
							<Table.Head>IP Address</Table.Head>
							<Table.Head>Last Active</Table.Head>
							<Table.Head class="text-right">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each loginSessions as session}
							<Table.Row class="transition-colors duration-200 hover:bg-muted/50">
								<Table.Cell>
									<div class="flex items-center gap-3">
										<div class="p-2 rounded-lg bg-muted">
											<session.icon class="h-4 w-4" />
										</div>
										<div class="space-y-1">
											<p class="text-sm font-medium">{session.device}</p>
											{#if session.current}
												<Badge variant="default" class="text-xs">Current Session</Badge>
											{/if}
										</div>
									</div>
								</Table.Cell>
								<Table.Cell>
									<div class="flex items-center gap-2">
										<MapPin class="h-3 w-3 text-muted-foreground" />
										<span class="text-sm">{session.location}</span>
									</div>
								</Table.Cell>
								<Table.Cell>
									<code class="text-xs bg-muted px-2 py-1 rounded">{session.ipAddress}</code>
								</Table.Cell>
								<Table.Cell>
									<div class="flex items-center gap-2">
										<Clock class="h-3 w-3 text-muted-foreground" />
										<span class="text-sm text-muted-foreground">{session.lastActive}</span>
									</div>
								</Table.Cell>
								<Table.Cell class="text-right">
									{#if !session.current}
										<Button
											variant="ghost"
											size="sm"
											onclick={() => terminateSession(session.id)}
											disabled={isLoading}
											class="transition-colors duration-200 hover:text-destructive"
										>
											<LogOut class="h-4 w-4" />
										</Button>
									{:else}
										<span class="text-xs text-muted-foreground">Current</span>
									{/if}
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>

		<!-- Security Recommendations -->
		<Card.Root>
			<Card.Header class="space-y-2">
				<Card.Title class="text-lg flex items-center gap-2">
					<Shield class="h-5 w-5" />
					Security Recommendations
				</Card.Title>
				<Card.Description class="text-sm">
					Tips to keep your account secure
				</Card.Description>
			</Card.Header>
			<Card.Content class="p-4">
				<div class="space-y-4">
					<div class="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
						<CheckCircle class="h-5 w-5 text-green-600 mt-0.5" />
						<div class="space-y-1">
							<p class="text-sm font-medium">Use a strong, unique password</p>
							<p class="text-xs text-muted-foreground">
								Your password should be at least 12 characters long and include a mix of letters, numbers, and symbols.
							</p>
						</div>
					</div>

					<div class="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
						<CheckCircle class="h-5 w-5 text-green-600 mt-0.5" />
						<div class="space-y-1">
							<p class="text-sm font-medium">Enable two-factor authentication</p>
							<p class="text-xs text-muted-foreground">
								Add an extra layer of security by requiring a code from your phone in addition to your password.
							</p>
						</div>
					</div>

					<div class="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
						<AlertTriangle class="h-5 w-5 text-orange-500 mt-0.5" />
						<div class="space-y-1">
							<p class="text-sm font-medium">Review your login sessions regularly</p>
							<p class="text-xs text-muted-foreground">
								Check for any unfamiliar devices or locations and terminate suspicious sessions immediately.
							</p>
						</div>
					</div>

					<div class="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
						<AlertTriangle class="h-5 w-5 text-orange-500 mt-0.5" />
						<div class="space-y-1">
							<p class="text-sm font-medium">Keep your recovery information up to date</p>
							<p class="text-xs text-muted-foreground">
								Make sure your email address and phone number are current so you can recover your account if needed.
							</p>
						</div>
					</div>
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Back Button -->
		<div class="flex justify-start pt-4">
			<Button 
				variant="outline" 
				onclick={() => goto('/my-account')}
				class="transition-colors duration-200"
			>
				<ArrowLeft class="mr-2 h-4 w-4" />
				Back to Account
			</Button>
		</div>
	</div>
</div>