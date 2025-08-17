<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import { Search, HelpCircle, MessageCircle, Mail, Phone, ExternalLink } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import SEO from '$lib/components/SEO.svelte';
	import { generateFAQSchema, generateBreadcrumbSchema } from '$lib/utils/seo';

	// FAQ categories and data
	const faqCategories = [
		{
			id: 'general',
			name: 'General',
			description: 'Basic questions about MagicKit',
			icon: HelpCircle,
			color: 'bg-blue-500/10 text-blue-600'
		},
		{
			id: 'pricing',
			name: 'Pricing & Billing',
			description: 'Questions about plans and payments',
			icon: MessageCircle,
			color: 'bg-green-500/10 text-green-600'
		},
		{
			id: 'technical',
			name: 'Technical',
			description: 'Development and integration help',
			icon: Mail,
			color: 'bg-purple-500/10 text-purple-600'
		},
		{
			id: 'account',
			name: 'Account & Security',
			description: 'Account management and security',
			icon: Phone,
			color: 'bg-orange-500/10 text-orange-600'
		}
	];

	const faqs = [
		// General Questions
		{
			id: 'what-is-magickit',
			category: 'general',
			question: 'What is MagicKit?',
			answer: 'MagicKit is a comprehensive universal web application template built with modern technologies like SvelteKit, Better Auth, and shadcn-svelte components. It provides a solid foundation for building various types of web applications including SaaS platforms, e-commerce sites, blogs, and more.',
			tags: ['template', 'sveltekit', 'overview']
		},
		{
			id: 'who-is-it-for',
			category: 'general',
			question: 'Who is MagicKit for?',
			answer: 'MagicKit is designed for developers, startups, and businesses who want to quickly bootstrap web applications without building common functionality from scratch. It\'s perfect for both beginners and experienced developers looking to save development time.',
			tags: ['developers', 'startups', 'businesses']
		},
		{
			id: 'what-technologies',
			category: 'general',
			question: 'What technologies does MagicKit use?',
			answer: 'MagicKit is built with SvelteKit 2, Svelte 5, TypeScript, Tailwind CSS 4, shadcn-svelte components, Better Auth for authentication, MongoDB for database, and includes modern development tools like Bun package manager.',
			tags: ['sveltekit', 'typescript', 'tailwind', 'mongodb']
		},
		{
			id: 'getting-started',
			category: 'general',
			question: 'How do I get started with MagicKit?',
			answer: 'Getting started is easy! Simply clone the repository, install dependencies with `bun install`, configure your environment variables, and run `bun dev` to start the development server. Check our documentation for detailed setup instructions.',
			tags: ['setup', 'installation', 'getting-started']
		},

		// Pricing & Billing
		{
			id: 'pricing-plans',
			category: 'pricing',
			question: 'What pricing plans are available?',
			answer: 'We offer three plans: Starter (Free) for personal projects, Professional ($29/month) for growing businesses, and Enterprise (custom pricing) for large organizations. Each plan includes different features and support levels.',
			tags: ['plans', 'pricing', 'free', 'professional', 'enterprise']
		},
		{
			id: 'free-trial',
			category: 'pricing',
			question: 'Is there a free trial?',
			answer: 'Yes! The Professional plan comes with a 14-day free trial. No credit card is required to start your trial. You can explore all Professional features during this period.',
			tags: ['trial', 'free', 'professional']
		},
		{
			id: 'payment-methods',
			category: 'pricing',
			question: 'What payment methods do you accept?',
			answer: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for Enterprise customers. All payments are processed securely through Stripe.',
			tags: ['payment', 'credit-card', 'paypal', 'stripe']
		},
		{
			id: 'refund-policy',
			category: 'pricing',
			question: 'What is your refund policy?',
			answer: 'We offer a 30-day money-back guarantee for all paid plans. If you\'re not satisfied with MagicKit, contact us within 30 days of purchase for a full refund, no questions asked.',
			tags: ['refund', 'money-back', 'guarantee']
		},
		{
			id: 'plan-changes',
			category: 'pricing',
			question: 'Can I change my plan anytime?',
			answer: 'Absolutely! You can upgrade or downgrade your plan at any time from your account dashboard. Changes take effect immediately, and billing is prorated based on your usage.',
			tags: ['upgrade', 'downgrade', 'plan-change']
		},

		// Technical Questions
		{
			id: 'system-requirements',
			category: 'technical',
			question: 'What are the system requirements?',
			answer: 'MagicKit requires Node.js 18+ and Bun package manager. It works on Windows, macOS, and Linux. For deployment, you can use any platform that supports Node.js applications like Vercel, Netlify, or traditional VPS.',
			tags: ['requirements', 'nodejs', 'bun', 'deployment']
		},
		{
			id: 'customization',
			category: 'technical',
			question: 'How customizable is MagicKit?',
			answer: 'MagicKit is highly customizable. You can modify components, add new pages, integrate with external APIs, customize the design system, and extend functionality. The codebase is well-structured and documented for easy customization.',
			tags: ['customization', 'components', 'design', 'apis']
		},
		{
			id: 'database-support',
			category: 'technical',
			question: 'What databases are supported?',
			answer: 'MagicKit comes pre-configured with MongoDB, but you can easily switch to other databases like PostgreSQL, MySQL, or SQLite. The database layer is abstracted, making it simple to change providers.',
			tags: ['database', 'mongodb', 'postgresql', 'mysql']
		},
		{
			id: 'deployment',
			category: 'technical',
			question: 'How do I deploy MagicKit?',
			answer: 'MagicKit can be deployed to various platforms. We provide deployment guides for Vercel, Netlify, Railway, and traditional VPS. The application is optimized for serverless and traditional hosting environments.',
			tags: ['deployment', 'vercel', 'netlify', 'hosting']
		},
		{
			id: 'api-integration',
			category: 'technical',
			question: 'Can I integrate external APIs?',
			answer: 'Yes! MagicKit is designed to work seamlessly with external APIs. You can add API routes, integrate with third-party services, and build custom integrations. Examples and documentation are provided.',
			tags: ['api', 'integration', 'third-party', 'services']
		},

		// Account & Security
		{
			id: 'account-security',
			category: 'account',
			question: 'How secure is my account?',
			answer: 'Security is our top priority. We use industry-standard encryption, secure authentication with Better Auth, HTTPS everywhere, and follow security best practices. Your data is protected with enterprise-grade security measures.',
			tags: ['security', 'encryption', 'authentication', 'https']
		},
		{
			id: 'two-factor-auth',
			category: 'account',
			question: 'Do you support two-factor authentication?',
			answer: 'Yes, MagicKit includes built-in support for two-factor authentication (2FA). You can enable 2FA in your account settings for an extra layer of security.',
			tags: ['2fa', 'two-factor', 'authentication', 'security']
		},
		{
			id: 'data-backup',
			category: 'account',
			question: 'How is my data backed up?',
			answer: 'Your data is automatically backed up daily with multiple redundancy layers. We maintain secure backups in different geographic locations to ensure data availability and disaster recovery.',
			tags: ['backup', 'data', 'redundancy', 'recovery']
		},
		{
			id: 'account-deletion',
			category: 'account',
			question: 'Can I delete my account?',
			answer: 'Yes, you can delete your account at any time from your account settings. This will permanently remove all your data. We also provide data export options before deletion if needed.',
			tags: ['delete', 'account', 'data-export', 'gdpr']
		},
		{
			id: 'password-reset',
			category: 'account',
			question: 'How do I reset my password?',
			answer: 'You can reset your password by clicking the "Forgot Password" link on the login page. We\'ll send you a secure reset link via email. The link expires after 1 hour for security.',
			tags: ['password', 'reset', 'forgot', 'email']
		}
	];

	// Search and filter state
	let searchQuery = $state('');
	let selectedCategory = $state('all');
	let openAccordionItems = $state<string[]>([]);

	// Computed filtered FAQs
	const filteredFaqs = $derived(faqs.filter(faq => {
		const matchesSearch = searchQuery === '' || 
			faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
			faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
			faq.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
		
		const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
		
		return matchesSearch && matchesCategory;
	}));

	// Group filtered FAQs by category
	const groupedFaqs = $derived(faqCategories.reduce((acc, category) => {
		const categoryFaqs = filteredFaqs.filter(faq => faq.category === category.id);
		if (categoryFaqs.length > 0) {
			acc[category.id] = {
				category,
				faqs: categoryFaqs
			};
		}
		return acc;
	}, {} as Record<string, { category: typeof faqCategories[0], faqs: typeof faqs }>));

	// Handle search input
	function handleSearch(event: Event) {
		const target = event.target as HTMLInputElement;
		searchQuery = target.value;
		
		// Auto-expand accordion items when searching
		if (searchQuery) {
			openAccordionItems = filteredFaqs.map(faq => faq.id);
		} else {
			openAccordionItems = [];
		}
	}

	// Handle category filter
	function handleCategoryFilter(categoryId: string) {
		selectedCategory = categoryId;
		// Clear search when changing category
		if (categoryId !== 'all') {
			searchQuery = '';
		}
	}

	// Clear all filters
	function clearFilters() {
		searchQuery = '';
		selectedCategory = 'all';
		openAccordionItems = [];
	}

	// Contact support
	function contactSupport() {
		goto('/contact?subject=FAQ%20Support%20Request');
	}

	// SEO and structured data
	const seoData = {
		title: 'Frequently Asked Questions | MagicKit',
		description: 'Find answers to common questions about MagicKit. Get help with pricing, technical issues, account management, and more.',
		keywords: ['FAQ', 'Help', 'Support', 'Questions', 'MagicKit', 'Documentation'],
		ogType: 'website' as const
	};

	const faqSchema = generateFAQSchema(
		faqs.map(faq => ({
			question: faq.question,
			answer: faq.answer
		}))
	);

	const breadcrumbSchema = generateBreadcrumbSchema([
		{ name: 'Home', url: '/' },
		{ name: 'FAQ', url: '/faq' }
	]);
</script>

<SEO 
	{...seoData}
	structuredData={[faqSchema, breadcrumbSchema]}
/>

<div class="container mx-auto px-4 py-6">
	<!-- Hero Section -->
	<section class="text-center space-y-6 py-16">
		<div class="space-y-4">
			<h1 class="text-2xl md:text-4xl lg:text-5xl font-bold tracking-tight">
				Frequently Asked Questions
			</h1>
			<p class="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
				Find answers to common questions about MagicKit. Can't find what you're looking for? Contact our support team.
			</p>
		</div>
	</section>

	<!-- Search and Filters -->
	<section class="py-8">
		<div class="max-w-4xl mx-auto space-y-6">
			<!-- Search Bar -->
			<Card.Root>
				<Card.Content class="p-6">
					<div class="relative">
						<Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							type="search"
							placeholder="Search FAQs..."
							class="pl-10 text-lg h-12 transition-colors duration-200"
							value={searchQuery}
							oninput={handleSearch}
						/>
					</div>
					{#if searchQuery || selectedCategory !== 'all'}
						<div class="flex items-center justify-between mt-4 pt-4 border-t">
							<div class="flex items-center gap-2 text-sm text-muted-foreground">
								<span>Showing {filteredFaqs.length} result{filteredFaqs.length !== 1 ? 's' : ''}</span>
								{#if searchQuery}
									<Badge variant="secondary">"{searchQuery}"</Badge>
								{/if}
								{#if selectedCategory !== 'all'}
									<Badge variant="secondary">
										{faqCategories.find(c => c.id === selectedCategory)?.name}
									</Badge>
								{/if}
							</div>
							<Button variant="ghost" size="sm" onclick={clearFilters}>
								Clear filters
							</Button>
						</div>
					{/if}
				</Card.Content>
			</Card.Root>

			<!-- Category Filters -->
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
				<Button
					variant={selectedCategory === 'all' ? 'default' : 'outline'}
					class="justify-start transition-colors duration-200"
					onclick={() => handleCategoryFilter('all')}
				>
					<HelpCircle class="mr-2 h-4 w-4" />
					All Questions
				</Button>
				{#each faqCategories as category}
					{@const CategoryIcon = category.icon}
					<Button
						variant={selectedCategory === category.id ? 'default' : 'outline'}
						class="justify-start transition-colors duration-200"
						onclick={() => handleCategoryFilter(category.id)}
					>
						<CategoryIcon class="mr-2 h-4 w-4" />
						{category.name}
					</Button>
				{/each}
			</div>
		</div>
	</section>

	<!-- FAQ Content -->
	<section class="py-8">
		<div class="max-w-4xl mx-auto">
			{#if filteredFaqs.length === 0}
				<!-- No Results -->
				<Card.Root>
					<Card.Content class="p-12 text-center space-y-4">
						<HelpCircle class="h-12 w-12 mx-auto text-muted-foreground" />
						<div class="space-y-2">
							<h3 class="text-lg font-semibold">No FAQs found</h3>
							<p class="text-muted-foreground">
								Try adjusting your search terms or browse different categories.
							</p>
						</div>
						<div class="flex flex-col sm:flex-row gap-2 justify-center">
							<Button variant="outline" onclick={clearFilters}>
								Clear filters
							</Button>
							<Button onclick={contactSupport}>
								Contact Support
							</Button>
						</div>
					</Card.Content>
				</Card.Root>
			{:else}
				<!-- FAQ Groups -->
				<div class="space-y-8">
					{#each Object.values(groupedFaqs) as { category, faqs: categoryFaqs }}
						{@const CategoryIcon = category.icon}
						<div class="space-y-4">
							<!-- Category Header -->
							<div class="flex items-center gap-3">
								<div class="p-2 rounded-lg {category.color}">
									<CategoryIcon class="h-5 w-5" />
								</div>
								<div>
									<h2 class="text-2xl font-bold">{category.name}</h2>
									<p class="text-sm text-muted-foreground">{category.description}</p>
								</div>
								<Badge variant="secondary" class="ml-auto">
									{categoryFaqs.length} question{categoryFaqs.length !== 1 ? 's' : ''}
								</Badge>
							</div>

							<!-- FAQ Accordion -->
							<Card.Root>
								<Card.Content class="p-0">
									<Accordion.Root type="multiple" bind:value={openAccordionItems}>
										{#each categoryFaqs as faq, index}
											<Accordion.Item value={faq.id} class="border-b last:border-b-0">
												<Accordion.Trigger class="px-6 py-4 text-left hover:bg-muted/50 transition-colors duration-200">
													<div class="flex items-start justify-between w-full">
														<span class="text-lg font-medium pr-4">{faq.question}</span>
													</div>
												</Accordion.Trigger>
												<Accordion.Content class="px-6 pb-4">
													<div class="space-y-4">
														<p class="text-muted-foreground leading-relaxed">
															{faq.answer}
														</p>
														{#if faq.tags.length > 0}
															<div class="flex flex-wrap gap-2">
																{#each faq.tags as tag}
																	<Badge variant="outline" class="text-xs">
																		{tag}
																	</Badge>
																{/each}
															</div>
														{/if}
													</div>
												</Accordion.Content>
											</Accordion.Item>
										{/each}
									</Accordion.Root>
								</Card.Content>
							</Card.Root>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</section>

	<!-- Contact Support Section -->
	<section class="py-16">
		<Card.Root class="max-w-4xl mx-auto bg-gradient-to-r from-primary/5 to-primary/10">
			<Card.Content class="p-8 text-center space-y-6">
				<div class="space-y-4">
					<h2 class="text-2xl lg:text-3xl font-bold">Still have questions?</h2>
					<p class="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
						Can't find the answer you're looking for? Our support team is here to help.
					</p>
				</div>
				<div class="flex flex-col sm:flex-row gap-4 justify-center">
					<Button size="lg" onclick={contactSupport} class="transition-colors duration-200">
						<MessageCircle class="mr-2 h-4 w-4" />
						Contact Support
					</Button>
					<Button size="lg" variant="outline" onclick={() => goto('/help')} class="transition-colors duration-200">
						<ExternalLink class="mr-2 h-4 w-4" />
						Help Center
					</Button>
				</div>
				<div class="flex items-center justify-center gap-6 text-sm text-muted-foreground pt-4">
					<div class="flex items-center gap-2">
						<Mail class="h-4 w-4" />
						<span>support@magickit.dev</span>
					</div>
					<div class="flex items-center gap-2">
						<MessageCircle class="h-4 w-4" />
						<span>Live chat available</span>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</section>
</div>