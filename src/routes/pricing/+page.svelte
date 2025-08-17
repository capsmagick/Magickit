<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Check, Star, ArrowRight, Zap, Shield, Users } from '@lucide/svelte';
	import { goto } from '$app/navigation';

	// Pricing plans data
	const plans = [
		{
			name: 'Starter',
			description: 'Perfect for small projects and personal use',
			price: 'Free',
			period: 'forever',
			popular: false,
			features: [
				'Up to 3 projects',
				'Basic authentication',
				'Community support',
				'Standard templates',
				'Basic analytics'
			],
			limitations: [
				'Limited customization',
				'No priority support',
				'Basic features only'
			],
			cta: 'Get Started',
			ctaVariant: 'outline' as const
		},
		{
			name: 'Professional',
			description: 'Ideal for growing businesses and teams',
			price: '$29',
			period: 'per month',
			popular: true,
			features: [
				'Unlimited projects',
				'Advanced authentication',
				'Priority support',
				'Premium templates',
				'Advanced analytics',
				'Team collaboration',
				'Custom branding',
				'API access'
			],
			limitations: [],
			cta: 'Start Free Trial',
			ctaVariant: 'default' as const
		},
		{
			name: 'Enterprise',
			description: 'For large organizations with custom needs',
			price: 'Custom',
			period: 'pricing',
			popular: false,
			features: [
				'Everything in Professional',
				'Custom integrations',
				'Dedicated support',
				'SLA guarantee',
				'Advanced security',
				'Custom development',
				'Training & onboarding',
				'24/7 phone support'
			],
			limitations: [],
			cta: 'Contact Sales',
			ctaVariant: 'secondary' as const
		}
	];

	// Feature comparison data
	const featureComparison = [
		{
			category: 'Core Features',
			features: [
				{ name: 'Projects', starter: '3', professional: 'Unlimited', enterprise: 'Unlimited' },
				{ name: 'Authentication', starter: 'Basic', professional: 'Advanced', enterprise: 'Enterprise' },
				{ name: 'Templates', starter: 'Standard', professional: 'Premium', enterprise: 'Custom' },
				{ name: 'Analytics', starter: 'Basic', professional: 'Advanced', enterprise: 'Custom' }
			]
		},
		{
			category: 'Support & Services',
			features: [
				{ name: 'Support', starter: 'Community', professional: 'Priority', enterprise: 'Dedicated' },
				{ name: 'Response Time', starter: '48h', professional: '24h', enterprise: '4h' },
				{ name: 'Training', starter: '✗', professional: 'Self-service', enterprise: 'Personalized' },
				{ name: 'SLA', starter: '✗', professional: '99.9%', enterprise: '99.99%' }
			]
		},
		{
			category: 'Advanced Features',
			features: [
				{ name: 'API Access', starter: '✗', professional: '✓', enterprise: '✓' },
				{ name: 'Custom Branding', starter: '✗', professional: '✓', enterprise: '✓' },
				{ name: 'Team Collaboration', starter: '✗', professional: '✓', enterprise: '✓' },
				{ name: 'Custom Integrations', starter: '✗', professional: '✗', enterprise: '✓' }
			]
		}
	];

	// Testimonials data
	const testimonials = [
		{
			name: 'Alex Thompson',
			role: 'CTO',
			company: 'TechStart Inc.',
			avatar: '/avatars/alex.jpg',
			initials: 'AT',
			quote: 'The Professional plan gave us everything we needed to scale our SaaS platform. The ROI was immediate.',
			rating: 5
		},
		{
			name: 'Maria Garcia',
			role: 'Product Manager',
			company: 'InnovateNow',
			avatar: '/avatars/maria.jpg',
			initials: 'MG',
			quote: 'Enterprise support is outstanding. They helped us integrate custom features seamlessly.',
			rating: 5
		},
		{
			name: 'David Kim',
			role: 'Startup Founder',
			company: 'NextGen Solutions',
			avatar: '/avatars/david.jpg',
			initials: 'DK',
			quote: 'Started with the free plan and upgraded as we grew. Perfect pricing model for startups.',
			rating: 5
		}
	];

	// FAQ data
	const faqs = [
		{
			question: 'Can I change plans anytime?',
			answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately and billing is prorated.'
		},
		{
			question: 'Is there a free trial?',
			answer: 'Yes, the Professional plan comes with a 14-day free trial. No credit card required to start.'
		},
		{
			question: 'What payment methods do you accept?',
			answer: 'We accept all major credit cards, PayPal, and bank transfers for Enterprise customers.'
		},
		{
			question: 'Do you offer refunds?',
			answer: 'Yes, we offer a 30-day money-back guarantee for all paid plans. No questions asked.'
		}
	];

	function handlePlanSelection(plan: typeof plans[0]) {
		if (plan.name === 'Enterprise') {
			// Redirect to contact page for enterprise
			goto('/contact?subject=Enterprise%20Plan%20Inquiry');
		} else if (plan.name === 'Professional') {
			// Redirect to signup with plan parameter
			goto('/signup?plan=professional');
		} else {
			// Free plan - just go to signup
			goto('/signup');
		}
	}
</script>

<svelte:head>
	<title>Pricing Plans | MagicKit</title>
	<meta name="description" content="Choose the perfect plan for your needs. From free starter plans to enterprise solutions, we have pricing that scales with your business." />
	<meta property="og:title" content="Pricing Plans | MagicKit" />
	<meta property="og:description" content="Choose the perfect plan for your needs. From free starter plans to enterprise solutions, we have pricing that scales with your business." />
</svelte:head>

<div class="container mx-auto px-4 py-6">
	<!-- Hero Section -->
	<section class="text-center space-y-6 py-16">
		<div class="space-y-4">
			<h1 class="text-2xl md:text-4xl lg:text-5xl font-bold tracking-tight">
				Simple, Transparent Pricing
			</h1>
			<p class="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
				Choose the perfect plan for your needs. Start free and scale as you grow.
			</p>
		</div>
		<div class="flex items-center justify-center gap-2 text-sm text-muted-foreground">
			<Shield class="h-4 w-4" />
			<span>30-day money-back guarantee</span>
			<span>•</span>
			<span>Cancel anytime</span>
			<span>•</span>
			<span>No setup fees</span>
		</div>
	</section>

	<!-- Pricing Cards -->
	<section class="py-16">
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
			{#each plans as plan}
				<Card.Root class="relative transition-shadow duration-200 hover:shadow-lg {plan.popular ? 'ring-2 ring-primary' : ''}">
					{#if plan.popular}
						<div class="absolute -top-3 left-1/2 transform -translate-x-1/2">
							<Badge class="bg-primary text-primary-foreground px-3 py-1">
								<Star class="h-3 w-3 mr-1" />
								Most Popular
							</Badge>
						</div>
					{/if}
					
					<Card.Header class="text-center space-y-4 p-6">
						<div class="space-y-2">
							<Card.Title class="text-2xl font-bold">{plan.name}</Card.Title>
							<Card.Description class="text-sm leading-relaxed">
								{plan.description}
							</Card.Description>
						</div>
						<div class="space-y-1">
							<div class="text-4xl font-bold">
								{plan.price}
								{#if plan.price !== 'Free' && plan.price !== 'Custom'}
									<span class="text-lg font-normal text-muted-foreground">/{plan.period}</span>
								{/if}
							</div>
							{#if plan.period && plan.price !== 'Custom'}
								<p class="text-sm text-muted-foreground">{plan.period}</p>
							{/if}
						</div>
					</Card.Header>

					<Card.Content class="p-6 pt-0 space-y-6">
						<!-- Features List -->
						<div class="space-y-3">
							{#each plan.features as feature}
								<div class="flex items-start gap-3">
									<Check class="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
									<span class="text-sm">{feature}</span>
								</div>
							{/each}
							{#each plan.limitations as limitation}
								<div class="flex items-start gap-3 opacity-60">
									<div class="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground">✗</div>
									<span class="text-sm text-muted-foreground">{limitation}</span>
								</div>
							{/each}
						</div>

						<!-- CTA Button -->
						<Button 
							variant={plan.ctaVariant} 
							class="w-full transition-colors duration-200 {plan.popular ? 'bg-primary hover:bg-primary/90' : ''}"
							onclick={() => handlePlanSelection(plan)}
						>
							{plan.cta}
							<ArrowRight class="ml-2 h-4 w-4" />
						</Button>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	</section>

	<!-- Feature Comparison Table -->
	<section class="py-16">
		<div class="text-center space-y-4 mb-12">
			<h2 class="text-2xl lg:text-3xl font-bold">Compare Plans</h2>
			<p class="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
				Detailed comparison of features across all plans
			</p>
		</div>

		<div class="max-w-6xl mx-auto">
			<Card.Root>
				<Card.Content class="p-0">
					<div class="overflow-x-auto">
						<table class="w-full">
							<thead>
								<tr class="border-b">
									<th class="text-left p-4 font-semibold">Features</th>
									<th class="text-center p-4 font-semibold">Starter</th>
									<th class="text-center p-4 font-semibold relative">
										Professional
										<Badge class="absolute -top-2 left-1/2 transform -translate-x-1/2 text-xs">
											Popular
										</Badge>
									</th>
									<th class="text-center p-4 font-semibold">Enterprise</th>
								</tr>
							</thead>
							<tbody>
								{#each featureComparison as category}
									<tr class="border-b bg-muted/30">
										<td colspan="4" class="p-4 font-semibold text-sm">
											{category.category}
										</td>
									</tr>
									{#each category.features as feature}
										<tr class="border-b hover:bg-muted/20 transition-colors duration-200">
											<td class="p-4 text-sm">{feature.name}</td>
											<td class="p-4 text-center text-sm">
												{#if feature.starter === '✓'}
													<Check class="h-4 w-4 text-green-500 mx-auto" />
												{:else if feature.starter === '✗'}
													<span class="text-muted-foreground">✗</span>
												{:else}
													{feature.starter}
												{/if}
											</td>
											<td class="p-4 text-center text-sm">
												{#if feature.professional === '✓'}
													<Check class="h-4 w-4 text-green-500 mx-auto" />
												{:else if feature.professional === '✗'}
													<span class="text-muted-foreground">✗</span>
												{:else}
													{feature.professional}
												{/if}
											</td>
											<td class="p-4 text-center text-sm">
												{#if feature.enterprise === '✓'}
													<Check class="h-4 w-4 text-green-500 mx-auto" />
												{:else if feature.enterprise === '✗'}
													<span class="text-muted-foreground">✗</span>
												{:else}
													{feature.enterprise}
												{/if}
											</td>
										</tr>
									{/each}
								{/each}
							</tbody>
						</table>
					</div>
				</Card.Content>
			</Card.Root>
		</div>
	</section>

	<!-- Testimonials Section -->
	<section class="py-16 bg-muted/50">
		<div class="container mx-auto px-4">
			<div class="text-center space-y-4 mb-12">
				<h2 class="text-2xl lg:text-3xl font-bold">What Our Customers Say</h2>
				<p class="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
					Join thousands of satisfied customers who trust MagicKit
				</p>
			</div>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
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

	<!-- FAQ Section -->
	<section class="py-16">
		<div class="text-center space-y-4 mb-12">
			<h2 class="text-2xl lg:text-3xl font-bold">Frequently Asked Questions</h2>
			<p class="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
				Got questions? We've got answers.
			</p>
		</div>

		<div class="max-w-3xl mx-auto space-y-4">
			{#each faqs as faq}
				<Card.Root>
					<Card.Content class="p-6">
						<div class="space-y-3">
							<h3 class="text-lg font-semibold">{faq.question}</h3>
							<p class="text-muted-foreground leading-relaxed">{faq.answer}</p>
						</div>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	</section>

	<!-- Final CTA Section -->
	<section class="py-16 text-center">
		<Card.Root class="max-w-4xl mx-auto bg-gradient-to-r from-primary/5 to-primary/10">
			<Card.Content class="p-12 space-y-6">
				<div class="space-y-4">
					<h2 class="text-2xl lg:text-3xl font-bold">Ready to Get Started?</h2>
					<p class="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
						Join thousands of developers and businesses who trust MagicKit for their projects
					</p>
				</div>
				<div class="flex flex-col sm:flex-row gap-4 justify-center pt-4">
					<Button size="lg" onclick={() => goto('/signup')} class="transition-colors duration-200">
						<Zap class="mr-2 h-4 w-4" />
						Start Free Trial
					</Button>
					<Button size="lg" variant="outline" onclick={() => goto('/contact')} class="transition-colors duration-200">
						Contact Sales
					</Button>
				</div>
				<div class="flex items-center justify-center gap-4 text-sm text-muted-foreground pt-4">
					<div class="flex items-center gap-2">
						<Check class="h-4 w-4 text-green-500" />
						<span>No credit card required</span>
					</div>
					<div class="flex items-center gap-2">
						<Check class="h-4 w-4 text-green-500" />
						<span>14-day free trial</span>
					</div>
					<div class="flex items-center gap-2">
						<Check class="h-4 w-4 text-green-500" />
						<span>Cancel anytime</span>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</section>
</div>