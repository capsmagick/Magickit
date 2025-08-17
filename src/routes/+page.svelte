<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { authClient } from '$lib/auth/auth-client';
	import { goto } from '$app/navigation';
	import { Shield, Users, Palette, Zap, Lock, Code, Star, ArrowRight } from '@lucide/svelte';
	import SEO from '$lib/components/SEO.svelte';


	const session = authClient.useSession();

	function handleGetStarted() {
		if ($session.data) {
			goto('/my-account');
		} else {
			goto('/signup');
		}
	}

	// Testimonials data
	const testimonials = [
		{
			name: 'Sarah Chen',
			role: 'Full Stack Developer',
			company: 'TechCorp',
			avatar: '/avatars/sarah.jpg',
			initials: 'SC',
			quote: 'MagicKit saved me weeks of development time. The authentication system and admin panel are exactly what I needed for my SaaS project.',
			rating: 5
		},
		{
			name: 'Marcus Rodriguez',
			role: 'Startup Founder',
			company: 'InnovateLab',
			avatar: '/avatars/marcus.jpg',
			initials: 'MR',
			quote: 'The code quality and documentation are outstanding. I was able to launch my MVP in just a few days using this template.',
			rating: 5
		},
		{
			name: 'Emily Johnson',
			role: 'Product Manager',
			company: 'DesignStudio',
			avatar: '/avatars/emily.jpg',
			initials: 'EJ',
			quote: 'Beautiful UI components and excellent TypeScript support. This template is a game-changer for rapid prototyping.',
			rating: 5
		}
	];

	// Enhanced features data
	const features = [
		{
			icon: Shield,
			title: 'Authentication',
			description: 'Secure email/password and social authentication with Better Auth'
		},
		{
			icon: Users,
			title: 'User Management',
			description: 'Admin panel for managing users, roles, and permissions'
		},
		{
			icon: Palette,
			title: 'Modern UI',
			description: 'Beautiful components built with shadcn-svelte'
		},
		{
			icon: Zap,
			title: 'Fast Development',
			description: 'Pre-built pages and components for rapid prototyping'
		},
		{
			icon: Lock,
			title: 'Security First',
			description: 'Built-in security features and best practices'
		},
		{
			icon: Code,
			title: 'TypeScript',
			description: 'Full TypeScript support for better development experience'
		}
	];

	// SEO data for homepage
	const seoData = {
		title: 'MagicKit - Universal Web Application Template',
		description: 'Build amazing web applications with our universal template featuring SvelteKit, Better Auth, TypeScript, and modern UI components. Perfect for SaaS, e-commerce, blogs, and more.',
		keywords: ['SvelteKit', 'TypeScript', 'Web Template', 'Authentication', 'UI Components', 'Better Auth', 'shadcn-svelte', 'SaaS Template', 'Web Development'],
		ogType: 'website' as const,
		twitterCard: 'summary_large_image' as const
	};
</script>

<SEO 
	{...seoData}
	includeOrganization={true}
	includeWebSite={true}
/>

<div class="container mx-auto px-4 py-6">
	<!-- Hero Section -->
	<section class="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg">
		<div class="container mx-auto px-4 py-24">
			<div class="max-w-4xl mx-auto text-center space-y-6">
				<div class="space-y-4">
					<h1 class="text-2xl md:text-4xl lg:text-6xl font-bold tracking-tight">
						Welcome to MagicKit
					</h1>
					<p class="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
						A powerful universal web application template built with SvelteKit, Better Auth, and modern UI components
					</p>
				</div>
				<div class="flex flex-col sm:flex-row gap-4 justify-center pt-4">
					<Button size="lg" onclick={handleGetStarted} class="transition-colors duration-200">
						{$session.data ? 'Go to Dashboard' : 'Get Started'}
						<ArrowRight class="ml-2 h-4 w-4" />
					</Button>
					<Button size="lg" variant="outline" onclick={() => goto('/about')} class="transition-colors duration-200">
						Learn More
					</Button>
				</div>
			</div>
		</div>
	</section>

	<!-- User Status Section -->
	<section class="py-6">{#if $session.data}
			<Card.Root class="mx-auto max-w-md">
				<Card.Header class="space-y-2">
					<Card.Title class="text-2xl">Welcome back!</Card.Title>
					<Card.Description class="text-sm">
						You are signed in as {$session.data.user.name || $session.data.user.email}
					</Card.Description>
				</Card.Header>
				<Card.Content class="p-4 space-y-4">
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium">Role:</span>
						<Badge variant={$session.data.user.role === 'admin' ? 'default' : 'secondary'}>
							{$session.data.user.role || 'user'}
						</Badge>
					</div>
					<div class="flex gap-2">
						{#if $session.data.user.role === 'admin'}
							<Button onclick={() => goto('/admin')} class="flex-1 transition-colors duration-200">
								Admin Panel
							</Button>
						{/if}
						<Button variant="outline" onclick={() => goto('/my-account')} class="flex-1 transition-colors duration-200">
							My Account
						</Button>
					</div>
				</Card.Content>
			</Card.Root>
		{:else}
			<Card.Root class="mx-auto max-w-md">
				<Card.Header class="space-y-2">
					<Card.Title class="text-2xl">Get Started</Card.Title>
					<Card.Description class="text-sm">
						Sign up or sign in to access your account
					</Card.Description>
				</Card.Header>
				<Card.Content class="p-4 space-y-4">
					<Button onclick={() => goto('/signup')} class="w-full transition-colors duration-200">
						Create Account
					</Button>
					<Button variant="outline" onclick={() => goto('/login')} class="w-full transition-colors duration-200">
						Sign In
					</Button>
				</Card.Content>
			</Card.Root>
		{/if}
	</section>

	<!-- Features Section -->
	<section class="py-16">
		<div class="text-center space-y-4 mb-12">
			<h2 class="text-2xl lg:text-3xl font-bold">Everything You Need</h2>
			<p class="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
				Built with modern technologies and best practices for rapid development
			</p>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each features as feature}
				<Card.Root class="transition-shadow duration-200 hover:shadow-md">
					<Card.Content class="p-6 text-center space-y-4">
						<div class="flex justify-center">
							<div class="p-3 rounded-lg bg-primary/10">
								{#if feature.icon === Shield}
									<Shield class="h-8 w-8 text-primary" />
								{:else if feature.icon === Users}
									<Users class="h-8 w-8 text-primary" />
								{:else if feature.icon === Palette}
									<Palette class="h-8 w-8 text-primary" />
								{:else if feature.icon === Zap}
									<Zap class="h-8 w-8 text-primary" />
								{:else if feature.icon === Lock}
									<Lock class="h-8 w-8 text-primary" />
								{:else if feature.icon === Code}
									<Code class="h-8 w-8 text-primary" />
								{/if}
							</div>
						</div>
						<div class="space-y-2">
							<h3 class="text-lg font-semibold">{feature.title}</h3>
							<p class="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
						</div>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	</section>

	<!-- Testimonials Section -->
	<section class="py-16 bg-muted/50">
		<div class="container mx-auto px-4">
			<div class="text-center space-y-4 mb-12">
				<h2 class="text-2xl lg:text-3xl font-bold">What Developers Say</h2>
				<p class="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
					Join thousands of developers who trust MagicKit for their projects
				</p>
			</div>
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{#each testimonials as testimonial}
					<Card.Root class="transition-shadow duration-200 hover:shadow-md">
						<Card.Content class="p-6 space-y-4">
							<!-- Rating Stars -->
							<div class="flex justify-center space-x-1">
								{#each Array(testimonial.rating) as _}
									<Star class="h-4 w-4 fill-yellow-400 text-yellow-400" />
								{/each}
							</div>
							
							<!-- Quote -->
							<blockquote class="text-muted-foreground italic text-sm leading-relaxed text-center">
								"{testimonial.quote}"
							</blockquote>
							
							<!-- Author -->
							<div class="flex items-center justify-center space-x-3 pt-2">
								<Avatar.Root>
									<Avatar.Image src={testimonial.avatar} alt={testimonial.name} />
									<Avatar.Fallback class="text-sm">{testimonial.initials}</Avatar.Fallback>
								</Avatar.Root>
								<div class="text-center">
									<p class="font-semibold text-sm">{testimonial.name}</p>
									<p class="text-xs text-muted-foreground">{testimonial.role}</p>
									<p class="text-xs text-muted-foreground">{testimonial.company}</p>
								</div>
							</div>
						</Card.Content>
					</Card.Root>
				{/each}
			</div>
		</div>
	</section>

	<!-- Call to Action Section -->
	<section class="py-16 text-center">
		<div class="space-y-6">
			<h2 class="text-2xl lg:text-3xl font-bold">Ready to Get Started?</h2>
			<p class="text-muted-foreground max-w-xl mx-auto text-lg leading-relaxed">
				Join thousands of developers building amazing applications with MagicKit
			</p>
			<div class="flex flex-col sm:flex-row gap-4 justify-center pt-4">
				<Button size="lg" onclick={handleGetStarted} class="transition-colors duration-200">
					{$session.data ? 'Go to Dashboard' : 'Get Started'}
					<ArrowRight class="ml-2 h-4 w-4" />
				</Button>
				<Button size="lg" variant="outline" onclick={() => goto('/about')} class="transition-colors duration-200">
					Learn More
				</Button>
			</div>
		</div>
	</section>
</div>
