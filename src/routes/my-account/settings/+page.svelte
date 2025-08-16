<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { authClient } from '$lib/auth/auth-client';
	import { goto } from '$app/navigation';
	import { 
		Settings, Moon, Sun, Monitor, Bell, Mail, MessageSquare, Shield,
		Eye, EyeOff, Globe, Loader2, CheckCircle, AlertCircle, ArrowLeft,
		Palette, Volume2, VolumeX, Smartphone, Tablet
	} from '@lucide/svelte';

	let settings = $state({
		theme: 'system',
		notifications: {
			email: true,
			push: true,
			marketing: false,
			security: true,
			updates: true,
			comments: true
		},
		privacy: {
			profileVisibility: 'public',
			showEmail: false,
			showActivity: true,
			allowMessages: true,
			indexProfile: true
		},
		preferences: {
			language: 'en',
			timezone: 'America/New_York',
			dateFormat: 'MM/DD/YYYY',
			soundEnabled: true,
			autoSave: true,
			compactMode: false
		}
	});

	let isLoading = $state(false);
	let error = $state('');
	let success = $state('');

	const session = authClient.useSession();

	// Check if user is logged in
	$effect(() => {
		if (!$session.data) {
			goto('/login?returnTo=/my-account/settings');
		}
	});

	async function handleSave() {
		isLoading = true;
		error = '';
		success = '';

		try {
			// In a real app, you'd send this data to your API
			await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
			success = 'Settings saved successfully!';
		} catch (err) {
			error = 'Failed to save settings';
		} finally {
			isLoading = false;
		}
	}

	function getThemeIcon(theme: string) {
		switch (theme) {
			case 'light': return Sun;
			case 'dark': return Moon;
			case 'system': return Monitor;
			default: return Monitor;
		}
	}

	const themeOptions = [
		{ value: 'light', label: 'Light', icon: Sun },
		{ value: 'dark', label: 'Dark', icon: Moon },
		{ value: 'system', label: 'System', icon: Monitor }
	];

	const languageOptions = [
		{ value: 'en', label: 'English' },
		{ value: 'es', label: 'Español' },
		{ value: 'fr', label: 'Français' },
		{ value: 'de', label: 'Deutsch' },
		{ value: 'it', label: 'Italiano' },
		{ value: 'pt', label: 'Português' }
	];

	const timezoneOptions = [
		{ value: 'America/New_York', label: 'Eastern Time (ET)' },
		{ value: 'America/Chicago', label: 'Central Time (CT)' },
		{ value: 'America/Denver', label: 'Mountain Time (MT)' },
		{ value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
		{ value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
		{ value: 'Europe/Paris', label: 'Central European Time (CET)' },
		{ value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
		{ value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)' }
	];

	const dateFormatOptions = [
		{ value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US)' },
		{ value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (UK)' },
		{ value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' },
		{ value: 'DD MMM YYYY', label: 'DD MMM YYYY' }
	];

	const visibilityOptions = [
		{ value: 'public', label: 'Public', description: 'Anyone can view your profile' },
		{ value: 'private', label: 'Private', description: 'Only you can view your profile' },
		{ value: 'friends', label: 'Friends Only', description: 'Only your connections can view' }
	];
</script>

<div class="container mx-auto max-w-4xl px-4 py-6">
	<div class="space-y-6">
		<!-- Header -->
		<div class="flex items-center gap-4">
			<Button variant="ghost" size="icon" onclick={() => goto('/my-account')}>
				<ArrowLeft class="h-4 w-4" />
			</Button>
			<div class="space-y-2">
				<h1 class="text-2xl font-bold">Account Settings</h1>
				<p class="text-muted-foreground text-sm">
					Manage your preferences, notifications, and privacy settings
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
			<!-- Theme & Appearance -->
			<Card.Root>
				<Card.Header class="space-y-2">
					<Card.Title class="text-lg flex items-center gap-2">
						<Palette class="h-5 w-5" />
						Theme & Appearance
					</Card.Title>
					<Card.Description class="text-sm">
						Customize how the interface looks and feels
					</Card.Description>
				</Card.Header>
				<Card.Content class="p-4 space-y-6">
					<div class="space-y-3">
						<Label class="text-sm font-medium">Theme</Label>
						<div class="grid grid-cols-3 gap-2">
							{#each themeOptions as option}
								<Button
									variant={settings.theme === option.value ? 'default' : 'outline'}
									size="sm"
									class="flex flex-col gap-2 h-auto p-3 transition-colors duration-200"
									onclick={() => settings.theme = option.value}
								>
									<option.icon class="h-4 w-4" />
									<span class="text-xs">{option.label}</span>
								</Button>
							{/each}
						</div>
					</div>

					<div class="space-y-3">
						<div class="flex items-center justify-between">
							<div class="space-y-1">
								<Label class="text-sm font-medium">Compact Mode</Label>
								<p class="text-xs text-muted-foreground">Use smaller spacing and elements</p>
							</div>
							<Switch 
								bind:checked={settings.preferences.compactMode}
								aria-label="Toggle compact mode"
							/>
						</div>
					</div>

					<div class="space-y-3">
						<div class="flex items-center justify-between">
							<div class="space-y-1">
								<Label class="text-sm font-medium">Sound Effects</Label>
								<p class="text-xs text-muted-foreground">Play sounds for interactions</p>
							</div>
							<Switch 
								bind:checked={settings.preferences.soundEnabled}
								aria-label="Toggle sound effects"
							/>
						</div>
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Localization -->
			<Card.Root>
				<Card.Header class="space-y-2">
					<Card.Title class="text-lg flex items-center gap-2">
						<Globe class="h-5 w-5" />
						Localization
					</Card.Title>
					<Card.Description class="text-sm">
						Language, timezone, and regional preferences
					</Card.Description>
				</Card.Header>
				<Card.Content class="p-4 space-y-6">
					<div class="space-y-2">
						<Label class="text-sm font-medium">Language</Label>
						<Select.Root bind:value={settings.preferences.language}>
							<Select.Trigger class="transition-colors duration-200">
								<Select.Value placeholder="Select language" />
							</Select.Trigger>
							<Select.Content>
								{#each languageOptions as option}
									<Select.Item value={option.value}>{option.label}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>

					<div class="space-y-2">
						<Label class="text-sm font-medium">Timezone</Label>
						<Select.Root bind:value={settings.preferences.timezone}>
							<Select.Trigger class="transition-colors duration-200">
								<Select.Value placeholder="Select timezone" />
							</Select.Trigger>
							<Select.Content>
								{#each timezoneOptions as option}
									<Select.Item value={option.value}>{option.label}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>

					<div class="space-y-2">
						<Label class="text-sm font-medium">Date Format</Label>
						<Select.Root bind:value={settings.preferences.dateFormat}>
							<Select.Trigger class="transition-colors duration-200">
								<Select.Value placeholder="Select date format" />
							</Select.Trigger>
							<Select.Content>
								{#each dateFormatOptions as option}
									<Select.Item value={option.value}>{option.label}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Notifications -->
			<Card.Root>
				<Card.Header class="space-y-2">
					<Card.Title class="text-lg flex items-center gap-2">
						<Bell class="h-5 w-5" />
						Notifications
					</Card.Title>
					<Card.Description class="text-sm">
						Choose what notifications you want to receive
					</Card.Description>
				</Card.Header>
				<Card.Content class="p-4 space-y-4">
					<div class="space-y-4">
						<div class="flex items-center justify-between">
							<div class="space-y-1">
								<Label class="text-sm font-medium flex items-center gap-2">
									<Mail class="h-4 w-4" />
									Email Notifications
								</Label>
								<p class="text-xs text-muted-foreground">Receive notifications via email</p>
							</div>
							<Switch 
								bind:checked={settings.notifications.email}
								aria-label="Toggle email notifications"
							/>
						</div>

						<div class="flex items-center justify-between">
							<div class="space-y-1">
								<Label class="text-sm font-medium flex items-center gap-2">
									<Smartphone class="h-4 w-4" />
									Push Notifications
								</Label>
								<p class="text-xs text-muted-foreground">Receive push notifications</p>
							</div>
							<Switch 
								bind:checked={settings.notifications.push}
								aria-label="Toggle push notifications"
							/>
						</div>

						<div class="flex items-center justify-between">
							<div class="space-y-1">
								<Label class="text-sm font-medium flex items-center gap-2">
									<Shield class="h-4 w-4" />
									Security Alerts
								</Label>
								<p class="text-xs text-muted-foreground">Important security notifications</p>
							</div>
							<Switch 
								bind:checked={settings.notifications.security}
								aria-label="Toggle security notifications"
							/>
						</div>

						<div class="flex items-center justify-between">
							<div class="space-y-1">
								<Label class="text-sm font-medium flex items-center gap-2">
									<MessageSquare class="h-4 w-4" />
									Comments & Messages
								</Label>
								<p class="text-xs text-muted-foreground">New comments and messages</p>
							</div>
							<Switch 
								bind:checked={settings.notifications.comments}
								aria-label="Toggle comment notifications"
							/>
						</div>

						<div class="flex items-center justify-between">
							<div class="space-y-1">
								<Label class="text-sm font-medium">Product Updates</Label>
								<p class="text-xs text-muted-foreground">New features and improvements</p>
							</div>
							<Switch 
								bind:checked={settings.notifications.updates}
								aria-label="Toggle update notifications"
							/>
						</div>

						<div class="flex items-center justify-between">
							<div class="space-y-1">
								<Label class="text-sm font-medium">Marketing</Label>
								<p class="text-xs text-muted-foreground">Promotional emails and offers</p>
							</div>
							<Switch 
								bind:checked={settings.notifications.marketing}
								aria-label="Toggle marketing notifications"
							/>
						</div>
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Privacy Settings -->
			<Card.Root>
				<Card.Header class="space-y-2">
					<Card.Title class="text-lg flex items-center gap-2">
						<Shield class="h-5 w-5" />
						Privacy Settings
					</Card.Title>
					<Card.Description class="text-sm">
						Control who can see your information and activity
					</Card.Description>
				</Card.Header>
				<Card.Content class="p-4 space-y-6">
					<div class="space-y-2">
						<Label class="text-sm font-medium">Profile Visibility</Label>
						<div class="space-y-2">
							{#each visibilityOptions as option}
								<div class="flex items-center space-x-2">
									<input
										type="radio"
										id={option.value}
										name="visibility"
										value={option.value}
										bind:group={settings.privacy.profileVisibility}
										class="transition-colors duration-200"
									/>
									<div class="space-y-1">
										<Label for={option.value} class="text-sm font-medium cursor-pointer">
											{option.label}
										</Label>
										<p class="text-xs text-muted-foreground">{option.description}</p>
									</div>
								</div>
							{/each}
						</div>
					</div>

					<div class="space-y-4">
						<div class="flex items-center justify-between">
							<div class="space-y-1">
								<Label class="text-sm font-medium">Show Email Address</Label>
								<p class="text-xs text-muted-foreground">Display email on your profile</p>
							</div>
							<Switch 
								bind:checked={settings.privacy.showEmail}
								aria-label="Toggle email visibility"
							/>
						</div>

						<div class="flex items-center justify-between">
							<div class="space-y-1">
								<Label class="text-sm font-medium">Show Activity Status</Label>
								<p class="text-xs text-muted-foreground">Let others see when you're active</p>
							</div>
							<Switch 
								bind:checked={settings.privacy.showActivity}
								aria-label="Toggle activity status"
							/>
						</div>

						<div class="flex items-center justify-between">
							<div class="space-y-1">
								<Label class="text-sm font-medium">Allow Messages</Label>
								<p class="text-xs text-muted-foreground">Let others send you messages</p>
							</div>
							<Switch 
								bind:checked={settings.privacy.allowMessages}
								aria-label="Toggle message permissions"
							/>
						</div>

						<div class="flex items-center justify-between">
							<div class="space-y-1">
								<Label class="text-sm font-medium">Search Engine Indexing</Label>
								<p class="text-xs text-muted-foreground">Allow search engines to index your profile</p>
							</div>
							<Switch 
								bind:checked={settings.privacy.indexProfile}
								aria-label="Toggle search indexing"
							/>
						</div>
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Additional Preferences -->
			<Card.Root class="lg:col-span-2">
				<Card.Header class="space-y-2">
					<Card.Title class="text-lg flex items-center gap-2">
						<Settings class="h-5 w-5" />
						Additional Preferences
					</Card.Title>
					<Card.Description class="text-sm">
						Other settings and preferences
					</Card.Description>
				</Card.Header>
				<Card.Content class="p-4 space-y-4">
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div class="flex items-center justify-between">
							<div class="space-y-1">
								<Label class="text-sm font-medium">Auto-save Changes</Label>
								<p class="text-xs text-muted-foreground">Automatically save your work</p>
							</div>
							<Switch 
								bind:checked={settings.preferences.autoSave}
								aria-label="Toggle auto-save"
							/>
						</div>
					</div>
				</Card.Content>
			</Card.Root>
		</div>

		<!-- Action Buttons -->
		<div class="flex flex-col sm:flex-row gap-4 pt-4">
			<Button 
				onclick={handleSave}
				disabled={isLoading}
				class="transition-colors duration-200"
			>
				{#if isLoading}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					Saving Settings...
				{:else}
					<CheckCircle class="mr-2 h-4 w-4" />
					Save Settings
				{/if}
			</Button>
			<Button 
				variant="outline" 
				onclick={() => goto('/my-account')}
				disabled={isLoading}
				class="transition-colors duration-200"
			>
				Cancel
			</Button>
		</div>
	</div>
</div>