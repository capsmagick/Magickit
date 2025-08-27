<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { 
		ArrowLeft, 
		ArrowRight, 
		BookOpen, 
		Shield, 
		Users, 
		Settings,
		BarChart3,
		FileText,
		Image,
		Activity
	} from '@lucide/svelte';
	import { goto } from '$app/navigation';

	const features = [
		{
			title: 'User Management',
			description: 'Comprehensive user administration with role-based access control',
			icon: Users,
			color: 'text-blue-600'
		},
		{
			title: 'Content Management',
			description: 'Dynamic content creation and management system',
			icon: FileText,
			color: 'text-green-600'
		},
		{
			title: 'Media Management',
			description: 'Advanced media library with S3 integration and optimization',
			icon: Image,
			color: 'text-purple-600'
		},
		{
			title: 'System Monitoring',
			description: 'Real-time system health monitoring and performance metrics',
			icon: Activity,
			color: 'text-red-600'
		},
		{
			title: 'Security Features',
			description: 'Advanced security controls including brute force protection',
			icon: Shield,
			color: 'text-orange-600'
		},
		{
			title: 'Analytics & Reporting',
			description: 'Comprehensive analytics and customizable reporting tools',
			icon: BarChart3,
			color: 'text-indigo-600'
		}
	];

	const quickStart = [
		{ step: 1, title: 'Login to Admin Panel', description: 'Access the admin panel with your credentials' },
		{ step: 2, title: 'Configure Settings', description: 'Set up your basic system preferences' },
		{ step: 3, title: 'Manage Users', description: 'Add users and configure their roles' },
		{ step: 4, title: 'Create Content', description: 'Start creating and managing your content' }
	];
</script>

<svelte:head>
	<title>Introduction | Documentation | Admin | Magickit</title>
	<meta name="description" content="Introduction to the Magickit admin panel" />
</svelte:head>

<div class="space-y-6">
	<!-- Navigation -->
	<div class="flex items-center justify-between">
		<Button variant="ghost" onclick={() => goto('/admin/docs')} class="transition-colors duration-200">
			<ArrowLeft class="mr-2 h-4 w-4" />
			Back to Documentation
		</Button>
		<Button onclick={() => goto('/admin/docs/getting-started')} class="transition-colors duration-200">
			Getting Started
			<ArrowRight class="ml-2 h-4 w-4" />
		</Button>
	</div>

	<!-- Header -->
	<div class="space-y-4">
		<div class="flex items-center gap-2">
			<BookOpen class="h-6 w-6 text-primary" />
			<h1 class="text-3xl font-bold">Introduction</h1>
		</div>
		<p class="text-lg text-muted-foreground">
			Welcome to the Magickit Admin Panel - a comprehensive administration interface 
			built with modern web technologies and best practices.
		</p>
	</div>

	<!-- Overview -->
	<Card>
		<CardHeader>
			<CardTitle>What is Magickit Admin?</CardTitle>
		</CardHeader>
		<CardContent class="space-y-4">
			<p class="text-muted-foreground">
				Magickit Admin is a powerful, feature-rich administration panel designed to provide 
				complete control over your web application. Built with SvelteKit, it offers a modern, 
				responsive interface with comprehensive functionality for managing users, content, 
				media, and system operations.
			</p>
			
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div class="space-y-2">
					<h4 class="font-semibold">Key Benefits</h4>
					<ul class="space-y-1 text-sm text-muted-foreground">
						<li>• Modern, responsive design</li>
						<li>• Role-based access control</li>
						<li>• Real-time system monitoring</li>
						<li>• Comprehensive user management</li>
						<li>• Advanced security features</li>
					</ul>
				</div>
				<div class="space-y-2">
					<h4 class="font-semibold">Technology Stack</h4>
					<ul class="space-y-1 text-sm text-muted-foreground">
						<li>• SvelteKit with Svelte 5</li>
						<li>• TypeScript for type safety</li>
						<li>• Tailwind CSS for styling</li>
						<li>• MongoDB for data storage</li>
						<li>• Better Auth for authentication</li>
					</ul>
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- Core Features -->
	<Card>
		<CardHeader>
			<CardTitle>Core Features</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each features as feature}
					<div class="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors duration-200">
						<div class="flex items-start gap-3">
							<div class="p-2 rounded-md bg-primary/10">
								<svelte:component this={feature.icon} class="h-4 w-4 {feature.color}" />
							</div>
							<div class="space-y-1">
								<h4 class="font-medium text-sm">{feature.title}</h4>
								<p class="text-xs text-muted-foreground leading-relaxed">
									{feature.description}
								</p>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</CardContent>
	</Card>

	<!-- Quick Start Guide -->
	<Card>
		<CardHeader>
			<CardTitle>Quick Start</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="space-y-4">
				{#each quickStart as item}
					<div class="flex items-start gap-4">
						<div class="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
							{item.step}
						</div>
						<div class="space-y-1">
							<h4 class="font-medium">{item.title}</h4>
							<p class="text-sm text-muted-foreground">{item.description}</p>
						</div>
					</div>
				{/each}
			</div>
		</CardContent>
	</Card>

	<!-- System Requirements -->
	<Card>
		<CardHeader>
			<CardTitle>System Requirements</CardTitle>
		</CardHeader>
		<CardContent class="space-y-4">
			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div class="space-y-3">
					<h4 class="font-semibold">Browser Support</h4>
					<ul class="space-y-1 text-sm text-muted-foreground">
						<li>• Chrome 90+ (recommended)</li>
						<li>• Firefox 88+</li>
						<li>• Safari 14+</li>
						<li>• Edge 90+</li>
					</ul>
				</div>
				<div class="space-y-3">
					<h4 class="font-semibold">Permissions Required</h4>
					<ul class="space-y-1 text-sm text-muted-foreground">
						<li>• Admin role for full access</li>
						<li>• Specific permissions for limited access</li>
						<li>• JavaScript enabled</li>
						<li>• Cookies enabled</li>
					</ul>
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- Navigation -->
	<div class="flex items-center justify-between pt-6 border-t border-border">
		<Button variant="outline" onclick={() => goto('/admin/docs')} class="transition-colors duration-200">
			<ArrowLeft class="mr-2 h-4 w-4" />
			Documentation Home
		</Button>
		<Button onclick={() => goto('/admin/docs/getting-started')} class="transition-colors duration-200">
			Getting Started
			<ArrowRight class="ml-2 h-4 w-4" />
		</Button>
	</div>
</div>