<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { authClient } from '$lib/auth/auth-client';
	import { goto } from '$app/navigation';
	import { 
		User, Mail, MapPin, Globe, Camera, Loader2, CheckCircle, AlertCircle,
		Twitter, Linkedin, Github, Instagram, Save, ArrowLeft, Link, Phone
	} from '@lucide/svelte';

	let formData = $state({
		name: '',
		email: '',
		bio: '',
		location: '',
		website: '',
		phone: '',
		avatar: '',
		socialLinks: {
			twitter: '',
			linkedin: '',
			github: '',
			instagram: ''
		}
	});

	let isLoading = $state(false);
	let error = $state('');
	let success = $state('');
	let avatarFile: File | null = $state(null);

	const session = authClient.useSession();

	// Check if user is logged in and populate form
	$effect(() => {
		if ($session.data) {
			formData.name = $session.data.user.name || '';
			formData.email = $session.data.user.email || '';
			// In a real app, you'd fetch additional profile data from your API
			// For now, we'll use mock data
			formData.bio = 'Passionate developer and technology enthusiast.';
			formData.location = 'San Francisco, CA';
			formData.website = 'https://example.com';
			formData.phone = '+1 (555) 123-4567';
			formData.socialLinks = {
				twitter: 'https://twitter.com/username',
				linkedin: 'https://linkedin.com/in/username',
				github: 'https://github.com/username',
				instagram: 'https://instagram.com/username'
			};
		} else {
			goto('/login?returnTo=/my-account/profile');
		}
	});

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		isLoading = true;
		error = '';
		success = '';

		try {
			// Validate form data
			if (!formData.name.trim()) {
				throw new Error('Name is required');
			}
			if (!formData.email.trim()) {
				throw new Error('Email is required');
			}

			// Validate social links format
			const urlPattern = /^https?:\/\/.+/;
			if (formData.website && !urlPattern.test(formData.website)) {
				throw new Error('Website must be a valid URL starting with http:// or https://');
			}

			Object.entries(formData.socialLinks).forEach(([platform, url]) => {
				if (url && !urlPattern.test(url)) {
					throw new Error(`${platform} link must be a valid URL starting with http:// or https://`);
				}
			});

			// In a real app, you'd send this data to your API
			await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
			success = 'Profile updated successfully!';
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to update profile';
		} finally {
			isLoading = false;
		}
	}

	function handleAvatarChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			if (file.size > 5 * 1024 * 1024) { // 5MB limit
				error = 'Avatar file size must be less than 5MB';
				return;
			}
			if (!file.type.startsWith('image/')) {
				error = 'Avatar must be an image file';
				return;
			}
			avatarFile = file;
			// Create preview URL
			const reader = new FileReader();
			reader.onload = (e) => {
				formData.avatar = e.target?.result as string;
			};
			reader.readAsDataURL(file);
		}
	}

	function validateUrl(url: string): boolean {
		if (!url) return true; // Empty is valid
		try {
			new URL(url);
			return true;
		} catch {
			return false;
		}
	}

	function getSocialIcon(platform: string) {
		switch (platform) {
			case 'twitter': return Twitter;
			case 'linkedin': return Linkedin;
			case 'github': return Github;
			case 'instagram': return Instagram;
			default: return Link;
		}
	}
</script>

<div class="container mx-auto max-w-4xl px-4 py-6">
	<div class="space-y-6">
		<!-- Header -->
		<div class="flex items-center gap-4">
			<Button variant="ghost" size="icon" onclick={() => goto('/my-account')}>
				<ArrowLeft class="h-4 w-4" />
			</Button>
			<div class="space-y-2">
				<h1 class="text-2xl font-bold">Profile Management</h1>
				<p class="text-muted-foreground text-sm">
					Update your personal information and social links
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

		<form onsubmit={handleSubmit} class="space-y-6">
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<!-- Avatar Section -->
				<div class="lg:col-span-1">
					<Card.Root>
						<Card.Header class="space-y-2">
							<Card.Title class="text-lg flex items-center gap-2">
								<Camera class="h-5 w-5" />
								Profile Picture
							</Card.Title>
							<Card.Description class="text-sm">
								Upload a profile picture (max 5MB)
							</Card.Description>
						</Card.Header>
						<Card.Content class="p-4 space-y-4">
							<div class="flex flex-col items-center space-y-4">
								<Avatar.Root class="h-24 w-24">
									<Avatar.Image src={formData.avatar} alt="Profile" />
									<Avatar.Fallback class="text-lg">
										{formData.name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
									</Avatar.Fallback>
								</Avatar.Root>
								
								<div class="space-y-2">
									<Label for="avatar" class="sr-only">Profile Picture</Label>
									<Input
										id="avatar"
										type="file"
										accept="image/*"
										onchange={handleAvatarChange}
										disabled={isLoading}
										class="transition-colors duration-200"
									/>
									<p class="text-xs text-muted-foreground text-center">
										JPG, PNG or GIF (max 5MB)
									</p>
								</div>
							</div>
						</Card.Content>
					</Card.Root>
				</div>

				<!-- Basic Information -->
				<div class="lg:col-span-2">
					<Card.Root>
						<Card.Header class="space-y-2">
							<Card.Title class="text-lg flex items-center gap-2">
								<User class="h-5 w-5" />
								Basic Information
							</Card.Title>
							<Card.Description class="text-sm">
								Your personal details and contact information
							</Card.Description>
						</Card.Header>
						<Card.Content class="p-4 space-y-6">
							<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div class="space-y-2">
									<Label for="name" class="text-sm font-medium">Full Name *</Label>
									<Input 
										id="name" 
										type="text" 
										bind:value={formData.name} 
										required 
										disabled={isLoading}
										class="transition-colors duration-200"
										placeholder="Enter your full name"
									/>
								</div>

								<div class="space-y-2">
									<Label for="email" class="text-sm font-medium">Email Address *</Label>
									<Input 
										id="email" 
										type="email" 
										bind:value={formData.email} 
										required 
										disabled={isLoading}
										class="transition-colors duration-200"
										placeholder="your@email.com"
									/>
								</div>
							</div>

							<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div class="space-y-2">
									<Label for="phone" class="text-sm font-medium">Phone Number</Label>
									<Input 
										id="phone" 
										type="tel" 
										bind:value={formData.phone} 
										disabled={isLoading}
										class="transition-colors duration-200"
										placeholder="+1 (555) 123-4567"
									/>
								</div>

								<div class="space-y-2">
									<Label for="location" class="text-sm font-medium">Location</Label>
									<Input 
										id="location" 
										type="text" 
										bind:value={formData.location} 
										disabled={isLoading}
										class="transition-colors duration-200"
										placeholder="City, Country"
									/>
								</div>
							</div>

							<div class="space-y-2">
								<Label for="website" class="text-sm font-medium">Website</Label>
								<Input 
									id="website" 
									type="url" 
									bind:value={formData.website} 
									disabled={isLoading}
									class="transition-colors duration-200"
									placeholder="https://your-website.com"
								/>
							</div>

							<div class="space-y-2">
								<Label for="bio" class="text-sm font-medium">Bio</Label>
								<Textarea 
									id="bio" 
									bind:value={formData.bio} 
									disabled={isLoading}
									class="transition-colors duration-200 resize-none"
									placeholder="Tell us about yourself..."
									rows={4}
								/>
								<p class="text-xs text-muted-foreground">
									{formData.bio.length}/500 characters
								</p>
							</div>
						</Card.Content>
					</Card.Root>
				</div>
			</div>

			<!-- Social Links -->
			<Card.Root>
				<Card.Header class="space-y-2">
					<Card.Title class="text-lg flex items-center gap-2">
						<Link class="h-5 w-5" />
						Social Links
					</Card.Title>
					<Card.Description class="text-sm">
						Connect your social media profiles (optional)
					</Card.Description>
				</Card.Header>
				<Card.Content class="p-4 space-y-4">
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div class="space-y-2">
							<Label for="twitter" class="text-sm font-medium capitalize flex items-center gap-2">
								<Twitter class="h-4 w-4" />
								Twitter
							</Label>
							<Input 
								id="twitter"
								type="url" 
								bind:value={formData.socialLinks.twitter} 
								disabled={isLoading}
								class="transition-colors duration-200"
								placeholder="https://twitter.com/username"
							/>
							{#if formData.socialLinks.twitter && !validateUrl(formData.socialLinks.twitter)}
								<p class="text-xs text-destructive">Please enter a valid URL</p>
							{/if}
						</div>

						<div class="space-y-2">
							<Label for="linkedin" class="text-sm font-medium capitalize flex items-center gap-2">
								<Linkedin class="h-4 w-4" />
								LinkedIn
							</Label>
							<Input 
								id="linkedin"
								type="url" 
								bind:value={formData.socialLinks.linkedin} 
								disabled={isLoading}
								class="transition-colors duration-200"
								placeholder="https://linkedin.com/in/username"
							/>
							{#if formData.socialLinks.linkedin && !validateUrl(formData.socialLinks.linkedin)}
								<p class="text-xs text-destructive">Please enter a valid URL</p>
							{/if}
						</div>

						<div class="space-y-2">
							<Label for="github" class="text-sm font-medium capitalize flex items-center gap-2">
								<Github class="h-4 w-4" />
								GitHub
							</Label>
							<Input 
								id="github"
								type="url" 
								bind:value={formData.socialLinks.github} 
								disabled={isLoading}
								class="transition-colors duration-200"
								placeholder="https://github.com/username"
							/>
							{#if formData.socialLinks.github && !validateUrl(formData.socialLinks.github)}
								<p class="text-xs text-destructive">Please enter a valid URL</p>
							{/if}
						</div>

						<div class="space-y-2">
							<Label for="instagram" class="text-sm font-medium capitalize flex items-center gap-2">
								<Instagram class="h-4 w-4" />
								Instagram
							</Label>
							<Input 
								id="instagram"
								type="url" 
								bind:value={formData.socialLinks.instagram} 
								disabled={isLoading}
								class="transition-colors duration-200"
								placeholder="https://instagram.com/username"
							/>
							{#if formData.socialLinks.instagram && !validateUrl(formData.socialLinks.instagram)}
								<p class="text-xs text-destructive">Please enter a valid URL</p>
							{/if}
						</div>
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Action Buttons -->
			<div class="flex flex-col sm:flex-row gap-4 pt-4">
				<Button 
					type="submit" 
					disabled={isLoading}
					class="transition-colors duration-200"
				>
					{#if isLoading}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
						Saving Changes...
					{:else}
						<Save class="mr-2 h-4 w-4" />
						Save Changes
					{/if}
				</Button>
				<Button 
					type="button" 
					variant="outline" 
					onclick={() => goto('/my-account')}
					disabled={isLoading}
					class="transition-colors duration-200"
				>
					Cancel
				</Button>
			</div>
		</form>
	</div>
</div>