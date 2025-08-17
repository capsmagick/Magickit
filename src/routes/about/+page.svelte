<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { goto } from '$app/navigation';
	import { 
		Heart, 
		Target, 
		Users, 
		Lightbulb, 
		Shield, 
		Zap,
		Github,
		Twitter,
		Linkedin,
		Mail,
		ArrowRight
	} from '@lucide/svelte';
	import SEO from '$lib/components/SEO.svelte';
	import { generateBreadcrumbSchema } from '$lib/utils/seo';

	// Team members data
	const teamMembers = [
		{
			name: 'Alex Thompson',
			role: 'Founder & Lead Developer',
			bio: 'Full-stack developer with 8+ years of experience building scalable web applications.',
			avatar: '/team/alex.jpg',
			initials: 'AT',
			social: {
				github: 'https://github.com/alexthompson',
				twitter: 'https://twitter.com/alexthompson',
				linkedin: 'https://linkedin.com/in/alexthompson'
			}
		},
		{
			name: 'Sarah Kim',
			role: 'UI/UX Designer',
			bio: 'Design systems expert passionate about creating intuitive and accessible user experiences.',
			avatar: '/team/sarah.jpg',
			initials: 'SK',
			social: {
				twitter: 'https://twitter.com/sarahkim',
				linkedin: 'https://linkedin.com/in/sarahkim'
			}
		},
		{
			name: 'Michael Chen',
			role: 'DevOps Engineer',
			bio: 'Infrastructure specialist focused on security, scalability, and developer experience.',
			avatar: '/team/michael.jpg',
			initials: 'MC',
			social: {
				github: 'https://github.com/michaelchen',
				linkedin: 'https://linkedin.com/in/michaelchen'
			}
		},
		{
			name: 'Emma Rodriguez',
			role: 'Community Manager',
			bio: 'Developer advocate helping teams build better applications with modern tools.',
			avatar: '/team/emma.jpg',
			initials: 'ER',
			social: {
				twitter: 'https://twitter.com/emmarodriguez',
				linkedin: 'https://linkedin.com/in/emmarodriguez'
			}
		}
	];

	// Company values data
	const values = [
		{
			icon: Heart,
			title: 'Developer First',
			description: 'We build tools that developers love to use, focusing on great developer experience and productivity.'
		},
		{
			icon: Shield,
			title: 'Security by Design',
			description: 'Security is not an afterthought. We implement best practices and secure defaults from the ground up.'
		},
		{
			icon: Lightbulb,
			title: 'Innovation',
			description: 'We embrace new technologies and methodologies to solve problems in creative and efficient ways.'
		},
		{
			icon: Users,
			title: 'Community Driven',
			description: 'Our roadmap is shaped by community feedback and contributions from developers worldwide.'
		},
		{
			icon: Target,
			title: 'Quality Focus',
			description: 'We maintain high standards for code quality, documentation, and user experience in everything we build.'
		},
		{
			icon: Zap,
			title: 'Performance',
			description: 'Fast, efficient, and scalable solutions that perform well under real-world conditions.'
		}
	];

	function handleGetStarted() {
		goto('/signup');
	}

	function handleContact() {
		goto('/contact');
	}

	// SEO and structured data
	const seoData = {
		title: 'About Us | MagicKit - Modern Web Application Template',
		description: 'Learn about MagicKit, our mission to empower developers with modern web application templates, and meet our team. Built with SvelteKit, Better Auth, and TypeScript.',
		keywords: ['About MagicKit', 'Web Development Team', 'SvelteKit Template', 'Company Mission', 'Development Tools'],
		ogType: 'website' as const
	};

	const breadcrumbSchema = generateBreadcrumbSchema([
		{ name: 'Home', url: '/' },
		{ name: 'About', url: '/about' }
	]);
</script>

<SEO 
	{...seoData}
	structuredData={breadcrumbSchema}
/>

<div class="container mx-auto px-4 py-6">
	<!-- Hero Section -->
	<section class="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg">
		<div class="container mx-auto px-4 py-24">
			<div class="max-w-4xl mx-auto text-center space-y-6">
				<div class="space-y-4">
					<h1 class="text-2xl md:text-4xl lg:text-6xl font-bold tracking-tight">
						About MagicKit
					</h1>
					<p class="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
						Empowering developers to build amazing web applications faster with modern, secure, and scalable templates
					</p>
				</div>
			</div>
		</div>
	</section>

	<!-- Mission Section -->
	<section class="py-16">
		<div class="max-w-4xl mx-auto text-center space-y-6">
			<h2 class="text-2xl lg:text-3xl font-bold">Our Mission</h2>
			<p class="text-lg text-muted-foreground leading-relaxed">
				We believe that developers should spend their time building unique features and solving business problems, 
				not reinventing the wheel with authentication, user management, and common UI patterns. MagicKit provides 
				a solid foundation so you can focus on what makes your application special.
			</p>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
				<Card.Root class="text-center">
					<Card.Content class="p-6 space-y-4">
						<div class="flex justify-center">
							<div class="p-3 rounded-lg bg-primary/10">
								<Zap class="h-8 w-8 text-primary" />
							</div>
						</div>
						<div class="space-y-2">
							<h3 class="text-lg font-semibold">Accelerate Development</h3>
							<p class="text-sm text-muted-foreground leading-relaxed">
								Skip the boilerplate and start building features from day one
							</p>
						</div>
					</Card.Content>
				</Card.Root>

				<Card.Root class="text-center">
					<Card.Content class="p-6 space-y-4">
						<div class="flex justify-center">
							<div class="p-3 rounded-lg bg-primary/10">
								<Shield class="h-8 w-8 text-primary" />
							</div>
						</div>
						<div class="space-y-2">
							<h3 class="text-lg font-semibold">Security First</h3>
							<p class="text-sm text-muted-foreground leading-relaxed">
								Built-in security best practices and secure defaults
							</p>
						</div>
					</Card.Content>
				</Card.Root>

				<Card.Root class="text-center">
					<Card.Content class="p-6 space-y-4">
						<div class="flex justify-center">
							<div class="p-3 rounded-lg bg-primary/10">
								<Users class="h-8 w-8 text-primary" />
							</div>
						</div>
						<div class="space-y-2">
							<h3 class="text-lg font-semibold">Community Driven</h3>
							<p class="text-sm text-muted-foreground leading-relaxed">
								Open source and shaped by developer feedback
							</p>
						</div>
					</Card.Content>
				</Card.Root>
			</div>
		</div>
	</section>

	<!-- Team Section -->
	<section class="py-16 bg-muted/50">
		<div class="container mx-auto px-4">
			<div class="text-center space-y-4 mb-12">
				<h2 class="text-2xl lg:text-3xl font-bold">Meet Our Team</h2>
				<p class="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
					Passionate developers and designers working to make web development more enjoyable and productive
				</p>
			</div>
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				{#each teamMembers as member}
					<Card.Root class="transition-shadow duration-200 hover:shadow-md">
						<Card.Content class="p-6 text-center space-y-4">
							<Avatar.Root class="h-20 w-20 mx-auto">
								<Avatar.Image src={member.avatar} alt={member.name} />
								<Avatar.Fallback class="text-lg">{member.initials}</Avatar.Fallback>
							</Avatar.Root>
							<div class="space-y-2">
								<h3 class="text-lg font-semibold">{member.name}</h3>
								<Badge variant="secondary" class="text-xs">{member.role}</Badge>
								<p class="text-sm text-muted-foreground leading-relaxed">{member.bio}</p>
							</div>
							<div class="flex justify-center space-x-2 pt-2">
								{#if member.social.github}
									<Button variant="ghost" size="icon" onclick={() => window.open(member.social.github, '_blank')} aria-label="GitHub">
										<Github class="h-4 w-4" />
									</Button>
								{/if}
								{#if member.social.twitter}
									<Button variant="ghost" size="icon" onclick={() => window.open(member.social.twitter, '_blank')} aria-label="Twitter">
										<Twitter class="h-4 w-4" />
									</Button>
								{/if}
								{#if member.social.linkedin}
									<Button variant="ghost" size="icon" onclick={() => window.open(member.social.linkedin, '_blank')} aria-label="LinkedIn">
										<Linkedin class="h-4 w-4" />
									</Button>
								{/if}
							</div>
						</Card.Content>
					</Card.Root>
				{/each}
			</div>
		</div>
	</section>

	<!-- Values Section -->
	<section class="py-16">
		<div class="container mx-auto px-4">
			<div class="text-center space-y-4 mb-12">
				<h2 class="text-2xl lg:text-3xl font-bold">Our Values</h2>
				<p class="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
					The principles that guide everything we build and every decision we make
				</p>
			</div>
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{#each values as value}
					<Card.Root class="transition-shadow duration-200 hover:shadow-md">
						<Card.Content class="p-6 space-y-4">
							<div class="flex items-center space-x-3">
								<div class="p-2 rounded-lg bg-primary/10">
									{#if value.icon === Heart}
										<Heart class="h-6 w-6 text-primary" />
									{:else if value.icon === Shield}
										<Shield class="h-6 w-6 text-primary" />
									{:else if value.icon === Lightbulb}
										<Lightbulb class="h-6 w-6 text-primary" />
									{:else if value.icon === Users}
										<Users class="h-6 w-6 text-primary" />
									{:else if value.icon === Target}
										<Target class="h-6 w-6 text-primary" />
									{:else if value.icon === Zap}
										<Zap class="h-6 w-6 text-primary" />
									{/if}
								</div>
								<h3 class="text-lg font-semibold">{value.title}</h3>
							</div>
							<p class="text-sm text-muted-foreground leading-relaxed">{value.description}</p>
						</Card.Content>
					</Card.Root>
				{/each}
			</div>
		</div>
	</section>

	<!-- Call to Action Section -->
	<section class="py-16 text-center">
		<div class="space-y-6">
			<h2 class="text-2xl lg:text-3xl font-bold">Ready to Build Something Amazing?</h2>
			<p class="text-muted-foreground max-w-xl mx-auto text-lg leading-relaxed">
				Join our community of developers and start building your next project with MagicKit
			</p>
			<div class="flex flex-col sm:flex-row gap-4 justify-center pt-4">
				<Button size="lg" onclick={handleGetStarted} class="transition-colors duration-200">
					Get Started
					<ArrowRight class="ml-2 h-4 w-4" />
				</Button>
				<Button size="lg" variant="outline" onclick={handleContact} class="transition-colors duration-200">
					<Mail class="mr-2 h-4 w-4" />
					Contact Us
				</Button>
			</div>
		</div>
	</section>
</div>