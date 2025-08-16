<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { goto } from '$app/navigation';
	import { 
		Shield, 
		Users, 
		Palette, 
		Zap, 
		Lock, 
		Code,
		Database,
		Globe,
		Smartphone,
		Settings,
		BarChart3,
		Mail,
		ArrowRight,
		Check,
		Star
	} from '@lucide/svelte';

	// Service categories data
	const serviceCategories = [
		{
			title: 'Web Applications',
			description: 'Full-featured web applications with modern UI and robust backend',
			icon: Globe,
			services: [
				{
					name: 'SaaS Platforms',
					description: 'Multi-tenant applications with subscription management',
					features: ['User authentication', 'Payment integration', 'Admin dashboard', 'API access'],
					pricing: 'From $99/month',
					popular: true
				},
				{
					name: 'E-commerce Sites',
					description: 'Online stores with inventory and order management',
					features: ['Product catalog', 'Shopping cart', 'Payment processing', 'Order tracking'],
					pricing: 'From $149/month'
				},
				{
					name: 'Portfolio Websites',
					description: 'Professional portfolios and business websites',
					features: ['Responsive design', 'Content management', 'Contact forms', 'SEO optimization'],
					pricing: 'From $49/month'
				}
			]
		},
		{
			title: 'Enterprise Solutions',
			description: 'Scalable solutions for large organizations and teams',
			icon: Settings,
			services: [
				{
					name: 'HRMS Systems',
					description: 'Human resource management with employee portals',
					features: ['Employee management', 'Payroll integration', 'Performance tracking', 'Reporting'],
					pricing: 'Custom pricing'
				},
				{
					name: 'CMS Platforms',
					description: 'Content management systems with workflow automation',
					features: ['Content editing', 'User roles', 'Workflow approval', 'Multi-site management'],
					pricing: 'From $199/month'
				},
				{
					name: 'Analytics Dashboards',
					description: 'Business intelligence and data visualization',
					features: ['Real-time data', 'Custom reports', 'Data export', 'Team collaboration'],
					pricing: 'From $299/month'
				}
			]
		},
		{
			title: 'Mobile & API',
			description: 'Mobile applications and API development services',
			icon: Smartphone,
			services: [
				{
					name: 'Mobile Apps',
					description: 'Cross-platform mobile applications',
					features: ['iOS & Android', 'Push notifications', 'Offline support', 'App store deployment'],
					pricing: 'From $199/month'
				},
				{
					name: 'REST APIs',
					description: 'Scalable API development and integration',
					features: ['RESTful design', 'Authentication', 'Rate limiting', 'Documentation'],
					pricing: 'From $99/month'
				},
				{
					name: 'GraphQL APIs',
					description: 'Modern GraphQL API development',
					features: ['Type-safe queries', 'Real-time subscriptions', 'Schema federation', 'Caching'],
					pricing: 'From $149/month'
				}
			]
		}
	];

	// Core features data
	const coreFeatures = [
		{
			icon: Shield,
			title: 'Security First',
			description: 'Built-in authentication, authorization, and security best practices'
		},
		{
			icon: Users,
			title: 'User Management',
			description: 'Complete user lifecycle management with role-based access control'
		},
		{
			icon: Palette,
			title: 'Modern UI/UX',
			description: 'Beautiful, responsive interfaces built with shadcn-svelte components'
		},
		{
			icon: Database,
			title: 'Database Integration',
			description: 'MongoDB integration with type-safe data models and migrations'
		},
		{
			icon: Zap,
			title: 'Performance',
			description: 'Optimized for speed with lazy loading, caching, and code splitting'
		},
		{
			icon: Code,
			title: 'Developer Experience',
			description: 'TypeScript, hot reload, testing, and comprehensive documentation'
		}
	];

	function handleGetStarted() {
		goto('/signup');
	}

	function handleContact() {
		goto('/contact');
	}

	function handlePricing() {
		goto('/pricing');
	}
</script>

<svelte:head>
	<title>Services | MagicKit</title>
	<meta name="description" content="Explore MagicKit's web development services including SaaS platforms, e-commerce sites, enterprise solutions, and mobile applications." />
</svelte:head>

<div class="container mx-auto px-4 py-6">
	<!-- Hero Section -->
	<section class="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg">
		<div class="container mx-auto px-4 py-24">
			<div class="max-w-4xl mx-auto text-center space-y-6">
				<div class="space-y-4">
					<h1 class="text-2xl md:text-4xl lg:text-6xl font-bold tracking-tight">
						Our Services
					</h1>
					<p class="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
						Comprehensive web development solutions built on the MagicKit foundation
					</p>
				</div>
				<div class="flex flex-col sm:flex-row gap-4 justify-center pt-4">
					<Button size="lg" onclick={handleGetStarted} class="transition-colors duration-200">
						Get Started
						<ArrowRight class="ml-2 h-4 w-4" />
					</Button>
					<Button size="lg" variant="outline" onclick={handlePricing} class="transition-colors duration-200">
						View Pricing
					</Button>
				</div>
			</div>
		</div>
	</section>

	<!-- Core Features Section -->
	<section class="py-16">
		<div class="text-center space-y-4 mb-12">
			<h2 class="text-2xl lg:text-3xl font-bold">Built on Solid Foundations</h2>
			<p class="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
				Every service includes these core features as standard
			</p>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each coreFeatures as feature}
				<Card.Root class="transition-shadow duration-200 hover:shadow-md">
					<Card.Content class="p-4 space-y-4">
						<div class="flex items-center space-x-3">
							<div class="p-2 rounded-lg bg-primary/10">
								{#if feature.icon === Shield}
									<Shield class="h-6 w-6 text-primary" />
								{:else if feature.icon === Users}
									<Users class="h-6 w-6 text-primary" />
								{:else if feature.icon === Palette}
									<Palette class="h-6 w-6 text-primary" />
								{:else if feature.icon === Database}
									<Database class="h-6 w-6 text-primary" />
								{:else if feature.icon === Zap}
									<Zap class="h-6 w-6 text-primary" />
								{:else if feature.icon === Code}
									<Code class="h-6 w-6 text-primary" />
								{/if}
							</div>
							<h3 class="text-lg font-semibold">{feature.title}</h3>
						</div>
						<p class="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	</section>

	<!-- Service Categories Section -->
	<section class="py-16 bg-muted/50">
		<div class="container mx-auto px-4">
			<div class="text-center space-y-4 mb-12">
				<h2 class="text-2xl lg:text-3xl font-bold">Service Categories</h2>
				<p class="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
					Choose from our range of specialized development services
				</p>
			</div>

			{#each serviceCategories as category}
				<div class="mb-16 last:mb-0">
					<!-- Category Header -->
					<div class="flex items-center space-x-4 mb-8">
						<div class="p-3 rounded-lg bg-primary/10">
							{#if category.icon === Globe}
								<Globe class="h-8 w-8 text-primary" />
							{:else if category.icon === Settings}
								<Settings class="h-8 w-8 text-primary" />
							{:else if category.icon === Smartphone}
								<Smartphone class="h-8 w-8 text-primary" />
							{/if}
						</div>
						<div>
							<h3 class="text-2xl font-bold">{category.title}</h3>
							<p class="text-muted-foreground text-lg leading-relaxed">{category.description}</p>
						</div>
					</div>

					<!-- Services Grid -->
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{#each category.services as service}
							<Card.Root class="transition-shadow duration-200 hover:shadow-md relative">
								{#if service.popular}
									<div class="absolute -top-2 -right-2">
										<Badge class="bg-primary text-primary-foreground">
											<Star class="h-3 w-3 mr-1" />
											Popular
										</Badge>
									</div>
								{/if}
								<Card.Header class="space-y-2">
									<Card.Title class="text-lg">{service.name}</Card.Title>
									<Card.Description class="text-sm leading-relaxed">
										{service.description}
									</Card.Description>
								</Card.Header>
								<Card.Content class="p-4 space-y-4">
									<div class="space-y-2">
										<h4 class="font-semibold text-sm">Features included:</h4>
										<ul class="space-y-1">
											{#each service.features as feature}
												<li class="flex items-center space-x-2 text-sm">
													<Check class="h-4 w-4 text-green-500" />
													<span>{feature}</span>
												</li>
											{/each}
										</ul>
									</div>
									<div class="pt-4 border-t">
										<div class="flex items-center justify-between">
											<span class="font-semibold text-lg">{service.pricing}</span>
											<Button size="sm" onclick={handleContact} class="transition-colors duration-200">
												Get Quote
											</Button>
										</div>
									</div>
								</Card.Content>
							</Card.Root>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</section>

	<!-- Process Section -->
	<section class="py-16">
		<div class="container mx-auto px-4">
			<div class="text-center space-y-4 mb-12">
				<h2 class="text-2xl lg:text-3xl font-bold">Our Development Process</h2>
				<p class="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
					A proven methodology that delivers results
				</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				<Card.Root class="text-center">
					<Card.Content class="p-6 space-y-4">
						<div class="flex justify-center">
							<div class="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
								1
							</div>
						</div>
						<div class="space-y-2">
							<h3 class="text-lg font-semibold">Discovery</h3>
							<p class="text-sm text-muted-foreground leading-relaxed">
								We understand your requirements and define project scope
							</p>
						</div>
					</Card.Content>
				</Card.Root>

				<Card.Root class="text-center">
					<Card.Content class="p-6 space-y-4">
						<div class="flex justify-center">
							<div class="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
								2
							</div>
						</div>
						<div class="space-y-2">
							<h3 class="text-lg font-semibold">Design</h3>
							<p class="text-sm text-muted-foreground leading-relaxed">
								Create wireframes, mockups, and technical architecture
							</p>
						</div>
					</Card.Content>
				</Card.Root>

				<Card.Root class="text-center">
					<Card.Content class="p-6 space-y-4">
						<div class="flex justify-center">
							<div class="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
								3
							</div>
						</div>
						<div class="space-y-2">
							<h3 class="text-lg font-semibold">Development</h3>
							<p class="text-sm text-muted-foreground leading-relaxed">
								Build your application using MagicKit foundation
							</p>
						</div>
					</Card.Content>
				</Card.Root>

				<Card.Root class="text-center">
					<Card.Content class="p-6 space-y-4">
						<div class="flex justify-center">
							<div class="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
								4
							</div>
						</div>
						<div class="space-y-2">
							<h3 class="text-lg font-semibold">Launch</h3>
							<p class="text-sm text-muted-foreground leading-relaxed">
								Deploy, test, and provide ongoing support and maintenance
							</p>
						</div>
					</Card.Content>
				</Card.Root>
			</div>
		</div>
	</section>

	<!-- Call to Action Section -->
	<section class="py-16 text-center">
		<div class="space-y-6">
			<h2 class="text-2xl lg:text-3xl font-bold">Ready to Start Your Project?</h2>
			<p class="text-muted-foreground max-w-xl mx-auto text-lg leading-relaxed">
				Let's discuss your requirements and build something amazing together
			</p>
			<div class="flex flex-col sm:flex-row gap-4 justify-center pt-4">
				<Button size="lg" onclick={handleContact} class="transition-colors duration-200">
					<Mail class="mr-2 h-4 w-4" />
					Contact Us
				</Button>
				<Button size="lg" variant="outline" onclick={handlePricing} class="transition-colors duration-200">
					View Pricing
				</Button>
			</div>
		</div>
	</section>
</div>