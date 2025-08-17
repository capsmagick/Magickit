<script lang="ts">
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import { 
		Clock, 
		Mail, 
		Twitter, 
		Github, 
		Linkedin, 
		Globe,
		CheckCircle,
		Loader2
	} from '@lucide/svelte';

	// Email signup state
	let email = $state('');
	let isSubmitting = $state(false);
	let isSubscribed = $state(false);
	let error = $state('');

	// Countdown state (example: launching in 30 days)
	let targetDate = new Date();
	targetDate.setDate(targetDate.getDate() + 30); // 30 days from now

	let timeLeft = $state({
		days: 0,
		hours: 0,
		minutes: 0,
		seconds: 0
	});

	// Update countdown every second
	function updateCountdown() {
		const now = new Date().getTime();
		const target = targetDate.getTime();
		const difference = target - now;

		if (difference > 0) {
			timeLeft = {
				days: Math.floor(difference / (1000 * 60 * 60 * 24)),
				hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
				minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
				seconds: Math.floor((difference % (1000 * 60)) / 1000)
			};
		} else {
			timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
		}
	}

	// Start countdown
	updateCountdown();
	const interval = setInterval(updateCountdown, 1000);

	// Cleanup interval on component destroy
	$effect(() => {
		return () => {
			clearInterval(interval);
		};
	});

	// Handle email signup
	async function handleEmailSignup() {
		if (!email.trim()) {
			error = 'Please enter your email address';
			return;
		}

		if (!isValidEmail(email)) {
			error = 'Please enter a valid email address';
			return;
		}

		isSubmitting = true;
		error = '';

		try {
			// In a real implementation, you would send this to your backend
			// For now, we'll simulate a successful signup
			await new Promise(resolve => setTimeout(resolve, 1000));
			
			isSubscribed = true;
			email = '';
		} catch (err) {
			error = 'Something went wrong. Please try again.';
		} finally {
			isSubmitting = false;
		}
	}

	function isValidEmail(email: string): boolean {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}

	// Social links
	const socialLinks = [
		{
			name: 'Twitter',
			icon: Twitter,
			url: 'https://twitter.com/magickit',
			color: 'text-blue-500'
		},
		{
			name: 'GitHub',
			icon: Github,
			url: 'https://github.com/magickit',
			color: 'text-gray-900 dark:text-gray-100'
		},
		{
			name: 'LinkedIn',
			icon: Linkedin,
			url: 'https://linkedin.com/company/magickit',
			color: 'text-blue-600'
		}
	];

	// Features coming soon
	const upcomingFeatures = [
		'Advanced user dashboard',
		'Real-time notifications',
		'Team collaboration tools',
		'API integrations',
		'Mobile app',
		'Advanced analytics'
	];
</script>

<svelte:head>
	<title>Coming Soon | Magickit</title>
	<meta name="description" content="Something amazing is coming soon. Sign up to be notified when we launch and get early access to Magickit." />
	<meta property="og:title" content="Coming Soon | Magickit" />
	<meta property="og:description" content="Something amazing is coming soon. Sign up to be notified when we launch." />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
	<div class="container mx-auto px-4 py-16">
		<!-- Hero Section -->
		<div class="text-center space-y-8 mb-16">
			<div class="space-y-4">
				<Badge variant="secondary" class="text-sm">
					<Clock class="h-3 w-3 mr-1" />
					Coming Soon
				</Badge>
				<h1 class="text-2xl md:text-4xl lg:text-6xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
					Something Amazing is Coming
				</h1>
				<p class="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
					We're working hard to bring you the next generation of web application development. 
					Get ready for a revolutionary experience that will transform how you build and deploy applications.
				</p>
			</div>

			<!-- Countdown Timer -->
			<Card class="max-w-2xl mx-auto">
				<CardHeader class="text-center">
					<CardTitle class="text-lg">Launch Countdown</CardTitle>
					<CardDescription>We're launching soon! Here's how much time is left:</CardDescription>
				</CardHeader>
				<CardContent class="p-6">
					<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
						<div class="text-center space-y-2">
							<div class="text-2xl md:text-3xl font-bold text-primary">
								{timeLeft.days.toString().padStart(2, '0')}
							</div>
							<div class="text-sm text-muted-foreground">Days</div>
						</div>
						<div class="text-center space-y-2">
							<div class="text-2xl md:text-3xl font-bold text-primary">
								{timeLeft.hours.toString().padStart(2, '0')}
							</div>
							<div class="text-sm text-muted-foreground">Hours</div>
						</div>
						<div class="text-center space-y-2">
							<div class="text-2xl md:text-3xl font-bold text-primary">
								{timeLeft.minutes.toString().padStart(2, '0')}
							</div>
							<div class="text-sm text-muted-foreground">Minutes</div>
						</div>
						<div class="text-center space-y-2">
							<div class="text-2xl md:text-3xl font-bold text-primary">
								{timeLeft.seconds.toString().padStart(2, '0')}
							</div>
							<div class="text-sm text-muted-foreground">Seconds</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>

		<!-- Email Signup Section -->
		<div class="max-w-md mx-auto mb-16">
			<Card>
				<CardHeader class="text-center">
					<CardTitle class="text-xl">Get Early Access</CardTitle>
					<CardDescription>
						Be the first to know when we launch and get exclusive early access to all features.
					</CardDescription>
				</CardHeader>
				<CardContent class="space-y-4">
					{#if isSubscribed}
						<div class="text-center space-y-4">
							<CheckCircle class="h-12 w-12 text-green-500 mx-auto" />
							<div class="space-y-2">
								<h3 class="font-semibold text-green-700 dark:text-green-400">Thank you for subscribing!</h3>
								<p class="text-sm text-muted-foreground">
									We'll notify you as soon as we launch. Keep an eye on your inbox!
								</p>
							</div>
						</div>
					{:else}
						<form onsubmit={(e) => { e.preventDefault(); handleEmailSignup(); }} class="space-y-4">
							<div class="space-y-2">
								<div class="relative">
									<Mail class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
									<Input
										type="email"
										placeholder="Enter your email address"
										class="pl-8"
										bind:value={email}
										disabled={isSubmitting}
									/>
								</div>
								{#if error}
									<p class="text-sm text-destructive">{error}</p>
								{/if}
							</div>
							
							<Button type="submit" class="w-full" disabled={isSubmitting}>
								{#if isSubmitting}
									<Loader2 class="mr-2 h-4 w-4 animate-spin" />
									Subscribing...
								{:else}
									<Mail class="mr-2 h-4 w-4" />
									Notify Me When Ready
								{/if}
							</Button>
						</form>
					{/if}
				</CardContent>
			</Card>
		</div>

		<!-- Features Preview -->
		<div class="max-w-4xl mx-auto mb-16">
			<div class="text-center space-y-4 mb-8">
				<h2 class="text-2xl md:text-3xl font-bold">What's Coming</h2>
				<p class="text-muted-foreground">
					Here's a sneak peek at some of the amazing features we're building for you.
				</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{#each upcomingFeatures as feature}
					<Card class="transition-shadow duration-200 hover:shadow-md">
						<CardContent class="p-6 text-center">
							<CheckCircle class="h-8 w-8 text-primary mx-auto mb-3" />
							<p class="font-medium">{feature}</p>
						</CardContent>
					</Card>
				{/each}
			</div>
		</div>

		<!-- Company Info and Social Links -->
		<div class="max-w-2xl mx-auto text-center space-y-8">
			<Separator />
			
			<div class="space-y-4">
				<h3 class="text-lg font-semibold">Stay Connected</h3>
				<p class="text-muted-foreground">
					Follow us on social media for the latest updates and behind-the-scenes content.
				</p>
				
				<div class="flex justify-center gap-4">
					{#each socialLinks as social}
						<Button
							variant="outline"
							size="icon"
							href={social.url}
							target="_blank"
							rel="noopener noreferrer"
							class="transition-colors duration-200 hover:bg-primary hover:text-primary-foreground"
						>
							{#if social.icon === Twitter}
								<Twitter class="h-4 w-4" />
							{:else if social.icon === Github}
								<Github class="h-4 w-4" />
							{:else if social.icon === Linkedin}
								<Linkedin class="h-4 w-4" />
							{/if}
							<span class="sr-only">{social.name}</span>
						</Button>
					{/each}
				</div>
			</div>

			<div class="space-y-2">
				<div class="flex items-center justify-center gap-2 text-sm text-muted-foreground">
					<Globe class="h-4 w-4" />
					<span>Magickit - Universal Web Application Template</span>
				</div>
				<p class="text-xs text-muted-foreground">
					© 2025 Magickit. All rights reserved.
				</p>
			</div>
		</div>
	</div>
</div>