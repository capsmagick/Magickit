<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import { goto } from '$app/navigation';
	import { 
		Search, 
		HelpCircle, 
		BookOpen, 
		Settings, 
		Shield, 
		CreditCard,
		Users,
		Code,
		Mail,
		ArrowRight,
		ExternalLink,
		MessageCircle,
		FileText,
		Lightbulb,
		AlertCircle
	} from '@lucide/svelte';

	// Help categories with articles
	const helpCategories = [
		{
			id: 'getting-started',
			title: 'Getting Started',
			description: 'Learn the basics of using MagicKit',
			icon: BookOpen,
			color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
			articles: [
				{
					id: 'installation',
					title: 'Installation and Setup',
					description: 'How to install and configure MagicKit for your project',
					content: 'Step-by-step guide to get MagicKit running on your local machine...',
					tags: ['setup', 'installation', 'configuration']
				},
				{
					id: 'first-project',
					title: 'Creating Your First Project',
					description: 'Build your first application using the MagicKit template',
					content: 'Learn how to create your first project with MagicKit...',
					tags: ['tutorial', 'project', 'beginner']
				},
				{
					id: 'project-structure',
					title: 'Understanding Project Structure',
					description: 'Overview of the MagicKit project structure and organization',
					content: 'MagicKit follows a well-organized structure that makes development easier...',
					tags: ['structure', 'organization', 'files']
				}
			]
		},
		{
			id: 'authentication',
			title: 'Authentication & Security',
			description: 'User authentication and security features',
			icon: Shield,
			color: 'bg-green-500/10 text-green-600 dark:text-green-400',
			articles: [
				{
					id: 'user-auth',
					title: 'User Authentication Setup',
					description: 'Configure user authentication with Better Auth',
					content: 'MagicKit uses Better Auth for secure user authentication...',
					tags: ['auth', 'login', 'security']
				},
				{
					id: 'social-login',
					title: 'Social Login Integration',
					description: 'Add Google, GitHub, and other social login options',
					content: 'Learn how to integrate social login providers...',
					tags: ['social', 'oauth', 'providers']
				},
				{
					id: 'rbac-setup',
					title: 'Role-Based Access Control',
					description: 'Implement roles and permissions in your application',
					content: 'Set up RBAC to control user access to different features...',
					tags: ['rbac', 'roles', 'permissions']
				}
			]
		},
		{
			id: 'ui-components',
			title: 'UI Components',
			description: 'Working with shadcn-svelte components',
			icon: Code,
			color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
			articles: [
				{
					id: 'component-usage',
					title: 'Using shadcn-svelte Components',
					description: 'How to use and customize the included UI components',
					content: 'MagicKit includes a comprehensive set of UI components...',
					tags: ['components', 'ui', 'shadcn']
				},
				{
					id: 'theming',
					title: 'Theming and Customization',
					description: 'Customize colors, fonts, and styling',
					content: 'Learn how to customize the appearance of your application...',
					tags: ['theming', 'css', 'customization']
				},
				{
					id: 'responsive-design',
					title: 'Responsive Design Patterns',
					description: 'Build responsive layouts with Tailwind CSS',
					content: 'Create responsive designs that work on all devices...',
					tags: ['responsive', 'mobile', 'tailwind']
				}
			]
		},
		{
			id: 'database',
			title: 'Database & Data',
			description: 'Working with MongoDB and data management',
			icon: Settings,
			color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
			articles: [
				{
					id: 'mongodb-setup',
					title: 'MongoDB Configuration',
					description: 'Set up and configure MongoDB for your application',
					content: 'Configure MongoDB connection and database settings...',
					tags: ['mongodb', 'database', 'configuration']
				},
				{
					id: 'data-models',
					title: 'Creating Data Models',
					description: 'Define and work with data models and schemas',
					content: 'Learn how to create and manage data models...',
					tags: ['models', 'schema', 'data']
				},
				{
					id: 'crud-operations',
					title: 'CRUD Operations',
					description: 'Implement create, read, update, and delete operations',
					content: 'Build CRUD functionality for your data models...',
					tags: ['crud', 'operations', 'api']
				}
			]
		},
		{
			id: 'deployment',
			title: 'Deployment',
			description: 'Deploy your application to production',
			icon: CreditCard,
			color: 'bg-red-500/10 text-red-600 dark:text-red-400',
			articles: [
				{
					id: 'vercel-deployment',
					title: 'Deploy to Vercel',
					description: 'Deploy your MagicKit application to Vercel',
					content: 'Step-by-step guide to deploy on Vercel...',
					tags: ['vercel', 'deployment', 'hosting']
				},
				{
					id: 'environment-variables',
					title: 'Environment Variables',
					description: 'Configure environment variables for production',
					content: 'Set up environment variables for different environments...',
					tags: ['env', 'variables', 'configuration']
				},
				{
					id: 'domain-setup',
					title: 'Custom Domain Setup',
					description: 'Configure custom domains for your application',
					content: 'Learn how to set up custom domains...',
					tags: ['domain', 'dns', 'custom']
				}
			]
		},
		{
			id: 'troubleshooting',
			title: 'Troubleshooting',
			description: 'Common issues and solutions',
			icon: AlertCircle,
			color: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
			articles: [
				{
					id: 'common-errors',
					title: 'Common Error Messages',
					description: 'Solutions for frequently encountered errors',
					content: 'Here are solutions to common error messages...',
					tags: ['errors', 'debugging', 'solutions']
				},
				{
					id: 'performance-issues',
					title: 'Performance Optimization',
					description: 'Improve your application performance',
					content: 'Tips and techniques to optimize performance...',
					tags: ['performance', 'optimization', 'speed']
				},
				{
					id: 'build-issues',
					title: 'Build and Development Issues',
					description: 'Resolve build and development environment problems',
					content: 'Common build issues and how to resolve them...',
					tags: ['build', 'development', 'issues']
				}
			]
		}
	];

	// FAQ data
	const faqs = [
		{
			question: 'What is MagicKit?',
			answer: 'MagicKit is a comprehensive web application template built with modern technologies like SvelteKit, TypeScript, Tailwind CSS, and shadcn-svelte components. It provides a solid foundation for building various types of web applications.'
		},
		{
			question: 'Is MagicKit free to use?',
			answer: 'Yes, MagicKit is open source and free to use for both personal and commercial projects. You can modify and distribute it according to the license terms.'
		},
		{
			question: 'What technologies does MagicKit use?',
			answer: 'MagicKit is built with SvelteKit (Svelte 5), TypeScript, Tailwind CSS 4, shadcn-svelte components, Better Auth for authentication, MongoDB for the database, and Bun as the package manager.'
		},
		{
			question: 'Can I customize the design and components?',
			answer: 'Absolutely! MagicKit is designed to be highly customizable. You can modify the Tailwind CSS configuration, customize shadcn-svelte components, and adapt the design to match your brand.'
		},
		{
			question: 'Does MagicKit include authentication?',
			answer: 'Yes, MagicKit includes a complete authentication system powered by Better Auth, with support for email/password login, social authentication, and role-based access control.'
		},
		{
			question: 'How do I get support?',
			answer: 'You can get support through our documentation, community forums, GitHub issues, or by contacting our support team directly through the contact form.'
		}
	];

	// Search functionality
	let searchQuery = $state('');
	let selectedCategory = $state('all');
	let filteredArticles = $derived(() => {
		if (!searchQuery && selectedCategory === 'all') {
			return helpCategories;
		}

		return helpCategories.map(category => {
			if (selectedCategory !== 'all' && category.id !== selectedCategory) {
				return { ...category, articles: [] };
			}

			const filteredCategoryArticles = category.articles.filter(article => {
				const searchLower = searchQuery.toLowerCase();
				return (
					article.title.toLowerCase().includes(searchLower) ||
					article.description.toLowerCase().includes(searchLower) ||
					article.tags.some(tag => tag.toLowerCase().includes(searchLower))
				);
			});

			return { ...category, articles: filteredCategoryArticles };
		}).filter(category => category.articles.length > 0 || (selectedCategory === 'all' && !searchQuery));
	});

	function handleContact() {
		goto('/contact');
	}

	function clearSearch() {
		searchQuery = '';
		selectedCategory = 'all';
	}
</script>

<svelte:head>
	<title>Help Center | MagicKit</title>
	<meta name="description" content="Get help with MagicKit - find answers to common questions, browse our knowledge base, and learn how to use our web application template." />
</svelte:head>

<div class="container mx-auto px-4 py-6">
	<!-- Header Section -->
	<section class="mb-12">
		<div class="max-w-4xl mx-auto text-center space-y-6">
			<div class="flex justify-center">
				<div class="p-4 rounded-lg bg-primary/10">
					<HelpCircle class="h-12 w-12 text-primary" />
				</div>
			</div>
			<div class="space-y-4">
				<h1 class="text-2xl md:text-4xl lg:text-5xl font-bold tracking-tight">
					Help Center
				</h1>
				<p class="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
					Find answers to your questions, browse our knowledge base, and get the help you need to succeed with MagicKit.
				</p>
			</div>
		</div>
	</section>

	<!-- Search Section -->
	<section class="mb-12">
		<div class="max-w-2xl mx-auto">
			<Card.Root>
				<Card.Content class="p-6">
					<div class="space-y-4">
						<div class="relative">
							<Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								type="search"
								placeholder="Search help articles..."
								bind:value={searchQuery}
								class="pl-10 transition-colors duration-200"
							/>
						</div>
						<div class="flex flex-wrap gap-2">
							<Button
								variant={selectedCategory === 'all' ? 'default' : 'outline'}
								size="sm"
								onclick={() => selectedCategory = 'all'}
								class="transition-colors duration-200"
							>
								All Categories
							</Button>
							{#each helpCategories as category}
								<Button
									variant={selectedCategory === category.id ? 'default' : 'outline'}
									size="sm"
									onclick={() => selectedCategory = category.id}
									class="transition-colors duration-200"
								>
									{category.title}
								</Button>
							{/each}
						</div>
						{#if searchQuery || selectedCategory !== 'all'}
							<div class="flex items-center justify-between pt-2">
								<p class="text-sm text-muted-foreground">
									{filteredArticles.reduce((total, cat) => total + cat.articles.length, 0)} articles found
								</p>
								<Button variant="ghost" size="sm" onclick={clearSearch}>
									Clear filters
								</Button>
							</div>
						{/if}
					</div>
				</Card.Content>
			</Card.Root>
		</div>
	</section>

	<!-- Help Categories -->
	<section class="mb-16">
		{#if filteredArticles.length === 0}
			<div class="text-center py-12 space-y-4">
				<Search class="h-12 w-12 mx-auto text-muted-foreground" />
				<div class="space-y-2">
					<h3 class="text-lg font-semibold">No articles found</h3>
					<p class="text-muted-foreground">
						Try adjusting your search terms or browse all categories.
					</p>
				</div>
				<Button onclick={clearSearch} class="transition-colors duration-200">
					Clear Search
				</Button>
			</div>
		{:else}
			<div class="space-y-12">
				{#each filteredArticles as category}
					{#if category.articles.length > 0}
						<div class="space-y-6">
							<div class="flex items-center gap-4">
								<div class="p-3 rounded-lg {category.color}">
									{#if category.icon === BookOpen}
										<BookOpen class="h-6 w-6" />
									{:else if category.icon === Shield}
										<Shield class="h-6 w-6" />
									{:else if category.icon === Code}
										<Code class="h-6 w-6" />
									{:else if category.icon === Settings}
										<Settings class="h-6 w-6" />
									{:else if category.icon === CreditCard}
										<CreditCard class="h-6 w-6" />
									{:else if category.icon === AlertCircle}
										<AlertCircle class="h-6 w-6" />
									{/if}
								</div>
								<div>
									<h2 class="text-2xl font-bold">{category.title}</h2>
									<p class="text-muted-foreground">{category.description}</p>
								</div>
							</div>
							<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
								{#each category.articles as article}
									<Card.Root class="transition-shadow duration-200 hover:shadow-md cursor-pointer">
										<Card.Content class="p-6 space-y-4">
											<div class="space-y-2">
												<h3 class="text-lg font-semibold">{article.title}</h3>
												<p class="text-sm text-muted-foreground leading-relaxed">
													{article.description}
												</p>
											</div>
											<div class="flex flex-wrap gap-2">
												{#each article.tags as tag}
													<Badge variant="secondary" class="text-xs">
														{tag}
													</Badge>
												{/each}
											</div>
											<div class="pt-2">
												<Button variant="ghost" size="sm" class="p-0 h-auto font-medium text-primary">
													Read Article
													<ArrowRight class="ml-1 h-3 w-3" />
												</Button>
											</div>
										</Card.Content>
									</Card.Root>
								{/each}
							</div>
						</div>
					{/if}
				{/each}
			</div>
		{/if}
	</section>

	<!-- FAQ Section -->
	<section class="mb-16">
		<div class="max-w-4xl mx-auto">
			<div class="text-center space-y-4 mb-8">
				<h2 class="text-2xl lg:text-3xl font-bold">Frequently Asked Questions</h2>
				<p class="text-muted-foreground leading-relaxed">
					Quick answers to common questions about MagicKit
				</p>
			</div>
			<Card.Root>
				<Card.Content class="p-6">
					<Accordion.Root class="space-y-4">
						{#each faqs as faq, index}
							<Accordion.Item value={`faq-${index}`} class="border-b border-border last:border-b-0 pb-4 last:pb-0">
								<Accordion.Trigger class="text-left font-medium hover:text-primary transition-colors duration-200">
									{faq.question}
								</Accordion.Trigger>
								<Accordion.Content class="pt-4 text-muted-foreground leading-relaxed">
									{faq.answer}
								</Accordion.Content>
							</Accordion.Item>
						{/each}
					</Accordion.Root>
				</Card.Content>
			</Card.Root>
		</div>
	</section>

	<!-- Contact Support Section -->
	<section class="text-center">
		<Card.Root class="max-w-2xl mx-auto">
			<Card.Content class="p-8 space-y-6">
				<div class="flex justify-center">
					<div class="p-3 rounded-lg bg-primary/10">
						<MessageCircle class="h-8 w-8 text-primary" />
					</div>
				</div>
				<div class="space-y-4">
					<h2 class="text-2xl font-bold">Still Need Help?</h2>
					<p class="text-muted-foreground leading-relaxed">
						Can't find what you're looking for? Our support team is here to help you get the most out of MagicKit.
					</p>
				</div>
				<div class="flex flex-col sm:flex-row gap-4 justify-center">
					<Button onclick={handleContact} class="transition-colors duration-200">
						<Mail class="mr-2 h-4 w-4" />
						Contact Support
					</Button>
					<Button variant="outline" onclick={() => window.open('https://github.com/magickit/magickit', '_blank')} class="transition-colors duration-200">
						<ExternalLink class="mr-2 h-4 w-4" />
						GitHub Issues
					</Button>
				</div>
				<div class="pt-4 border-t border-border">
					<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
						<div class="space-y-2">
							<FileText class="h-6 w-6 mx-auto text-muted-foreground" />
							<div>
								<p class="font-medium text-sm">Documentation</p>
								<p class="text-xs text-muted-foreground">Comprehensive guides</p>
							</div>
						</div>
						<div class="space-y-2">
							<Users class="h-6 w-6 mx-auto text-muted-foreground" />
							<div>
								<p class="font-medium text-sm">Community</p>
								<p class="text-xs text-muted-foreground">Join our community</p>
							</div>
						</div>
						<div class="space-y-2">
							<Lightbulb class="h-6 w-6 mx-auto text-muted-foreground" />
							<div>
								<p class="font-medium text-sm">Feature Requests</p>
								<p class="text-xs text-muted-foreground">Suggest improvements</p>
							</div>
						</div>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</section>
</div>