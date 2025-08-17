<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Separator from '$lib/components/ui/separator/index.js';
	import { 
		Mail, 
		MapPin, 
		Phone, 
		Twitter, 
		Linkedin, 
		Github,
		Send,
		Loader2
	} from '@lucide/svelte';

	// Newsletter signup state
	let email = $state('');
	let isSubmitting = $state(false);
	let submitStatus = $state<'idle' | 'success' | 'error'>('idle');
	let submitMessage = $state('');

	// Company information
	const companyInfo = {
		name: 'MagicKit',
		description: 'A powerful universal web application template built with SvelteKit, Better Auth, and modern UI components.',
		address: '123 Business Street, Suite 100\nCity, State 12345',
		phone: '+1 (555) 123-4567',
		email: 'hello@magickit.dev'
	};

	// Navigation links organized by sections
	const navigationSections = [
		{
			title: 'Product',
			links: [
				{ name: 'About', href: '/about' },
				{ name: 'Services', href: '/services' },
				{ name: 'Portfolio', href: '/portfolio' },
				{ name: 'Pricing', href: '/pricing' }
			]
		},
		{
			title: 'Resources',
			links: [
				{ name: 'Blog', href: '/blog' },
				{ name: 'Help Center', href: '/help' },
				{ name: 'FAQ', href: '/faq' },
				{ name: 'Contact', href: '/contact' }
			]
		},
		{
			title: 'Legal',
			links: [
				{ name: 'Privacy Policy', href: '/privacy' },
				{ name: 'Terms of Service', href: '/terms' },
				{ name: 'Sitemap', href: '/sitemap' }
			]
		}
	];

	// Social media links
	const socialLinks = [
		{
			name: 'Twitter',
			href: 'https://twitter.com/magickit',
			icon: Twitter,
			label: 'Follow us on Twitter'
		},
		{
			name: 'LinkedIn',
			href: 'https://linkedin.com/company/magickit',
			icon: Linkedin,
			label: 'Connect with us on LinkedIn'
		},
		{
			name: 'GitHub',
			href: 'https://github.com/magickit',
			icon: Github,
			label: 'View our code on GitHub'
		}
	];

	async function handleNewsletterSubmit(e: SubmitEvent) {
		e.preventDefault();
		
		if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			submitStatus = 'error';
			submitMessage = 'Please enter a valid email address';
			return;
		}

		isSubmitting = true;
		submitStatus = 'idle';

		try {
			const response = await fetch('/api/newsletter', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ email })
			});

			const result = await response.json();

			if (response.ok) {
				submitStatus = 'success';
				submitMessage = 'Thank you for subscribing! Check your email for confirmation.';
				email = '';
			} else {
				submitStatus = 'error';
				submitMessage = result.error || 'Failed to subscribe. Please try again.';
			}
		} catch (error) {
			submitStatus = 'error';
			submitMessage = 'An unexpected error occurred. Please try again.';
		} finally {
			isSubmitting = false;
		}
	}

	// Reset status after 5 seconds
	$effect(() => {
		if (submitStatus !== 'idle') {
			const timer = setTimeout(() => {
				submitStatus = 'idle';
				submitMessage = '';
			}, 5000);
			return () => clearTimeout(timer);
		}
	});
</script>

<footer id="footer" class="bg-muted/30 border-t">
	<div class="container mx-auto px-4 py-12">
		<!-- Main Footer Content -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
			<!-- Company Information -->
			<div class="space-y-4">
				<div class="space-y-2">
					<h3 class="text-lg font-semibold">{companyInfo.name}</h3>
					<p class="text-sm text-muted-foreground leading-relaxed">
						{companyInfo.description}
					</p>
				</div>
				
				<!-- Contact Information -->
				<div class="space-y-3">
					<div class="flex items-start gap-2">
						<MapPin class="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
						<p class="text-sm text-muted-foreground whitespace-pre-line">{companyInfo.address}</p>
					</div>
					<div class="flex items-center gap-2">
						<Phone class="h-4 w-4 text-muted-foreground flex-shrink-0" />
						<a 
							href="tel:{companyInfo.phone}" 
							class="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
						>
							{companyInfo.phone}
						</a>
					</div>
					<div class="flex items-center gap-2">
						<Mail class="h-4 w-4 text-muted-foreground flex-shrink-0" />
						<a 
							href="mailto:{companyInfo.email}" 
							class="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
						>
							{companyInfo.email}
						</a>
					</div>
				</div>
			</div>

			<!-- Navigation Sections -->
			{#each navigationSections as section}
				<div class="space-y-4">
					<h4 class="text-sm font-semibold">{section.title}</h4>
					<nav class="space-y-2" aria-label="{section.title} navigation">
						{#each section.links as link}
							<a 
								href={link.href}
								class="block text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm"
							>
								{link.name}
							</a>
						{/each}
					</nav>
				</div>
			{/each}

			<!-- Newsletter Signup -->
			<div class="space-y-4">
				<div class="space-y-2">
					<h4 class="text-sm font-semibold">Stay Updated</h4>
					<p class="text-sm text-muted-foreground">
						Subscribe to our newsletter for the latest updates and features.
					</p>
				</div>
				
				<form onsubmit={handleNewsletterSubmit} class="space-y-2">
					<div class="space-y-2">
						<Label for="newsletter-email" class="sr-only">Email address</Label>
						<Input 
							id="newsletter-email"
							type="email" 
							placeholder="Enter your email" 
							bind:value={email}
							disabled={isSubmitting}
							required
							class="transition-colors duration-200"
							aria-describedby="newsletter-status"
						/>
						<Button 
							type="submit" 
							size="sm" 
							class="w-full transition-colors duration-200" 
							disabled={isSubmitting}
						>
							{#if isSubmitting}
								<Loader2 class="mr-2 h-4 w-4 animate-spin" />
								Subscribing...
							{:else}
								<Send class="mr-2 h-4 w-4" />
								Subscribe
							{/if}
						</Button>
					</div>
					
					{#if submitStatus !== 'idle'}
						<p 
							id="newsletter-status" 
							class="text-xs {submitStatus === 'success' ? 'text-green-600' : 'text-destructive'}"
							role="status"
							aria-live="polite"
						>
							{submitMessage}
						</p>
					{/if}
				</form>
			</div>
		</div>

		<Separator.Root class="my-8" />

		<!-- Footer Bottom -->
		<div class="flex flex-col md:flex-row justify-between items-center gap-4">
			<!-- Copyright -->
			<div class="text-center md:text-left">
				<p class="text-sm text-muted-foreground">
					© {new Date().getFullYear()} {companyInfo.name}. All rights reserved.
				</p>
			</div>

			<!-- Social Links -->
			<div class="flex items-center gap-2">
				<span class="text-sm text-muted-foreground mr-2">Follow us:</span>
				{#each socialLinks as social}
					{@const IconComponent = social.icon}
					<Button 
						variant="ghost" 
						size="icon"
						onclick={() => window.open(social.href, '_blank')}
						aria-label={social.label}
						class="h-8 w-8 transition-colors duration-200 hover:text-primary"
					>
						<IconComponent class="h-4 w-4" />
					</Button>
				{/each}
			</div>
		</div>
	</div>
</footer>