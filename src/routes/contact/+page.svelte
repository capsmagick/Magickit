<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { 
		Loader2, 
		Send, 
		MapPin, 
		Phone, 
		Mail, 
		Clock,
		Twitter,
		Linkedin,
		Github,
		CheckCircle,
		AlertCircle
	} from '@lucide/svelte';

	let formData = $state({
		name: '',
		email: '',
		subject: '',
		message: ''
	});

	let errors = $state<Record<string, string>>({});
	let isSubmitting = $state(false);
	let submitStatus = $state<'idle' | 'success' | 'error'>('idle');
	let submitMessage = $state('');

	function validateForm() {
		const newErrors: Record<string, string> = {};

		if (formData.name.length < 2) {
			newErrors.name = 'Name must be at least 2 characters';
		}

		if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
			newErrors.email = 'Please enter a valid email address';
		}

		if (formData.subject.length < 5) {
			newErrors.subject = 'Subject must be at least 5 characters';
		}

		if (formData.message.length < 10) {
			newErrors.message = 'Message must be at least 10 characters';
		}

		errors = newErrors;
		return Object.keys(newErrors).length === 0;
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		
		if (!validateForm()) {
			return;
		}

		isSubmitting = true;
		submitStatus = 'idle';

		try {
			const response = await fetch('/api/contact', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(formData)
			});

			const result = await response.json();

			if (response.ok) {
				submitStatus = 'success';
				submitMessage = 'Thank you for your message! We\'ll get back to you within 24 hours.';
				// Reset form
				formData = {
					name: '',
					email: '',
					subject: '',
					message: ''
				};
				errors = {};
			} else {
				submitStatus = 'error';
				submitMessage = result.error || 'Failed to send message. Please try again.';
			}
		} catch (error) {
			submitStatus = 'error';
			submitMessage = 'An unexpected error occurred. Please try again.';
		} finally {
			isSubmitting = false;
		}
	}

	// Contact information
	const contactInfo = [
		{
			icon: MapPin,
			title: 'Address',
			content: '123 Business Street, Suite 100\nCity, State 12345'
		},
		{
			icon: Phone,
			title: 'Phone',
			content: '+1 (555) 123-4567'
		},
		{
			icon: Mail,
			title: 'Email',
			content: 'hello@magickit.dev'
		},
		{
			icon: Clock,
			title: 'Business Hours',
			content: 'Monday - Friday: 9:00 AM - 6:00 PM\nSaturday: 10:00 AM - 4:00 PM'
		}
	];

	const socialLinks = [
		{
			icon: Twitter,
			name: 'Twitter',
			url: 'https://twitter.com/magickit',
			handle: '@magickit'
		},
		{
			icon: Linkedin,
			name: 'LinkedIn',
			url: 'https://linkedin.com/company/magickit',
			handle: 'magickit'
		},
		{
			icon: Github,
			name: 'GitHub',
			url: 'https://github.com/magickit',
			handle: 'magickit'
		}
	];
</script>

<svelte:head>
	<title>Contact Us | Magickit</title>
	<meta name="description" content="Get in touch with the Magickit team. We're here to help with your questions and support needs." />
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<!-- Hero Section -->
	<div class="text-center space-y-4 mb-12">
		<h1 class="text-2xl lg:text-3xl font-bold">Get in Touch</h1>
		<p class="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
			Have a question or need support? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
		</p>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Contact Form -->
		<div class="lg:col-span-2">
			<Card.Root>
				<Card.Header class="space-y-2">
					<Card.Title class="text-2xl">Send us a Message</Card.Title>
					<Card.Description class="text-muted-foreground">
						Fill out the form below and we'll get back to you within 24 hours.
					</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-6">
					{#if submitStatus === 'success'}
						<Alert.Root variant="default" class="border-green-200 bg-green-50 text-green-800">
							<CheckCircle class="h-4 w-4" />
							<Alert.Description>
								{submitMessage}
							</Alert.Description>
						</Alert.Root>
					{:else if submitStatus === 'error'}
						<Alert.Root variant="destructive">
							<AlertCircle class="h-4 w-4" />
							<Alert.Description>
								{submitMessage}
							</Alert.Description>
						</Alert.Root>
					{/if}

					<form onsubmit={handleSubmit} class="space-y-6">
						<!-- Name and Email Row -->
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div class="space-y-2">
								<Label for="name" class="text-sm font-medium">Name *</Label>
								<Input 
									id="name" 
									placeholder="Your full name" 
									bind:value={formData.name}
									required 
									disabled={isSubmitting}
									aria-describedby={errors.name ? 'name-error' : undefined}
									class="transition-colors duration-200 {errors.name ? 'border-destructive focus:ring-destructive' : ''}"
								/>
								{#if errors.name}
									<p id="name-error" class="text-sm text-destructive">{errors.name}</p>
								{/if}
							</div>
							<div class="space-y-2">
								<Label for="email" class="text-sm font-medium">Email *</Label>
								<Input 
									id="email" 
									type="email" 
									placeholder="your@email.com" 
									bind:value={formData.email}
									required 
									disabled={isSubmitting}
									aria-describedby={errors.email ? 'email-error' : undefined}
									class="transition-colors duration-200 {errors.email ? 'border-destructive focus:ring-destructive' : ''}"
								/>
								{#if errors.email}
									<p id="email-error" class="text-sm text-destructive">{errors.email}</p>
								{/if}
							</div>
						</div>
						
						<!-- Subject -->
						<div class="space-y-2">
							<Label for="subject" class="text-sm font-medium">Subject *</Label>
							<Input 
								id="subject" 
								placeholder="How can we help?" 
								bind:value={formData.subject}
								required 
								disabled={isSubmitting}
								aria-describedby={errors.subject ? 'subject-error' : undefined}
								class="transition-colors duration-200 {errors.subject ? 'border-destructive focus:ring-destructive' : ''}"
							/>
							{#if errors.subject}
								<p id="subject-error" class="text-sm text-destructive">{errors.subject}</p>
							{/if}
						</div>
						
						<!-- Message -->
						<div class="space-y-2">
							<Label for="message" class="text-sm font-medium">Message *</Label>
							<Textarea 
								id="message" 
								placeholder="Tell us more about your inquiry..." 
								rows={5} 
								bind:value={formData.message}
								required 
								disabled={isSubmitting}
								aria-describedby={errors.message ? 'message-error' : undefined}
								class="transition-colors duration-200 resize-none {errors.message ? 'border-destructive focus:ring-destructive' : ''}"
							/>
							{#if errors.message}
								<p id="message-error" class="text-sm text-destructive">{errors.message}</p>
							{/if}
						</div>
						
						<!-- Submit Button -->
						<Button 
							type="submit" 
							class="w-full transition-colors duration-200" 
							disabled={isSubmitting}
						>
							{#if isSubmitting}
								<Loader2 class="mr-2 h-4 w-4 animate-spin" />
								Sending...
							{:else}
								<Send class="mr-2 h-4 w-4" />
								Send Message
							{/if}
						</Button>
					</form>
				</Card.Content>
			</Card.Root>
		</div>

		<!-- Contact Information -->
		<div class="space-y-6">
			<!-- Contact Details -->
			<Card.Root>
				<Card.Header>
					<Card.Title class="text-lg">Contact Information</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-6">
					{#each contactInfo as info}
						{@const IconComponent = info.icon}
						<div class="flex items-start gap-3">
							<div class="flex-shrink-0 mt-1">
								<IconComponent class="h-4 w-4 text-primary" />
							</div>
							<div class="space-y-1">
								<p class="text-sm font-medium">{info.title}</p>
								<p class="text-sm text-muted-foreground whitespace-pre-line">{info.content}</p>
							</div>
						</div>
					{/each}
				</Card.Content>
			</Card.Root>

			<!-- Social Links -->
			<Card.Root>
				<Card.Header>
					<Card.Title class="text-lg">Follow Us</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-4">
					{#each socialLinks as social}
						{@const IconComponent = social.icon}
						<a 
							href={social.url}
							target="_blank"
							rel="noopener noreferrer"
							class="flex items-center gap-3 p-3 rounded-lg border transition-colors duration-200 hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
						>
							<IconComponent class="h-4 w-4 text-primary" />
							<div class="space-y-1">
								<p class="text-sm font-medium">{social.name}</p>
								<p class="text-sm text-muted-foreground">{social.handle}</p>
							</div>
						</a>
					{/each}
				</Card.Content>
			</Card.Root>

			<!-- Quick Response Info -->
			<Card.Root>
				<Card.Content class="p-4">
					<div class="text-center space-y-2">
						<Clock class="h-8 w-8 mx-auto text-primary" />
						<p class="text-sm font-medium">Quick Response</p>
						<p class="text-sm text-muted-foreground">
							We typically respond to all inquiries within 24 hours during business days.
						</p>
					</div>
				</Card.Content>
			</Card.Root>
		</div>
	</div>
</div>