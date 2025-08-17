<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { goto } from '$app/navigation';
	import { 
		FileText, 
		Shield, 
		Mail, 
		Calendar,
		ArrowRight,
		ExternalLink
	} from '@lucide/svelte';

	// Table of contents data
	const tableOfContents = [
		{ id: 'information-collection', title: 'Information We Collect', level: 1 },
		{ id: 'personal-information', title: 'Personal Information', level: 2 },
		{ id: 'usage-data', title: 'Usage Data', level: 2 },
		{ id: 'cookies', title: 'Cookies and Tracking', level: 2 },
		{ id: 'information-use', title: 'How We Use Information', level: 1 },
		{ id: 'service-provision', title: 'Service Provision', level: 2 },
		{ id: 'communication', title: 'Communication', level: 2 },
		{ id: 'improvement', title: 'Service Improvement', level: 2 },
		{ id: 'information-sharing', title: 'Information Sharing', level: 1 },
		{ id: 'third-parties', title: 'Third-Party Services', level: 2 },
		{ id: 'legal-requirements', title: 'Legal Requirements', level: 2 },
		{ id: 'data-security', title: 'Data Security', level: 1 },
		{ id: 'security-measures', title: 'Security Measures', level: 2 },
		{ id: 'data-retention', title: 'Data Retention', level: 2 },
		{ id: 'your-rights', title: 'Your Rights', level: 1 },
		{ id: 'access-rights', title: 'Access and Correction', level: 2 },
		{ id: 'deletion-rights', title: 'Data Deletion', level: 2 },
		{ id: 'portability', title: 'Data Portability', level: 2 },
		{ id: 'children-privacy', title: 'Children\'s Privacy', level: 1 },
		{ id: 'international-transfers', title: 'International Data Transfers', level: 1 },
		{ id: 'policy-changes', title: 'Changes to This Policy', level: 1 },
		{ id: 'contact-us', title: 'Contact Information', level: 1 }
	];

	// Last updated information
	const lastUpdated = 'January 15, 2025';
	const version = '2.1';
	const effectiveDate = 'January 15, 2025';

	function scrollToSection(id: string) {
		const element = document.getElementById(id);
		if (element) {
			element.scrollIntoView({ behavior: 'smooth' });
		}
	}

	function handleContact() {
		goto('/contact');
	}
</script>

<svelte:head>
	<title>Privacy Policy | MagicKit</title>
	<meta name="description" content="MagicKit Privacy Policy - Learn how we collect, use, and protect your personal information when you use our services." />
	<meta name="robots" content="index, follow" />
</svelte:head>

<div class="container mx-auto px-4 py-6">
	<!-- Header Section -->
	<section class="mb-12">
		<div class="max-w-4xl mx-auto text-center space-y-6">
			<div class="flex justify-center">
				<div class="p-4 rounded-lg bg-primary/10">
					<Shield class="h-12 w-12 text-primary" />
				</div>
			</div>
			<div class="space-y-4">
				<h1 class="text-2xl md:text-4xl lg:text-5xl font-bold tracking-tight">
					Privacy Policy
				</h1>
				<p class="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
					Your privacy is important to us. This policy explains how we collect, use, and protect your information.
				</p>
			</div>
			<div class="flex flex-wrap justify-center gap-4 pt-4">
				<Badge variant="secondary" class="flex items-center gap-2">
					<Calendar class="h-3 w-3" />
					Last Updated: {lastUpdated}
				</Badge>
				<Badge variant="outline" class="flex items-center gap-2">
					<FileText class="h-3 w-3" />
					Version {version}
				</Badge>
				<Badge variant="outline" class="flex items-center gap-2">
					Effective: {effectiveDate}
				</Badge>
			</div>
		</div>
	</section>

	<div class="grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
		<!-- Table of Contents Sidebar -->
		<aside class="lg:col-span-1">
			<Card.Root class="sticky top-6">
				<Card.Header class="pb-4">
					<Card.Title class="text-lg">Table of Contents</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-2">
					{#each tableOfContents as item}
						<button
							onclick={() => scrollToSection(item.id)}
							class="block w-full text-left text-sm hover:text-primary transition-colors duration-200 {item.level === 2 ? 'pl-4 text-muted-foreground' : 'font-medium'}"
						>
							{item.title}
						</button>
					{/each}
				</Card.Content>
			</Card.Root>
		</aside>

		<!-- Main Content -->
		<main class="lg:col-span-3">
			<div class="prose prose-gray dark:prose-invert max-w-none">
				<div class="space-y-8">
					<!-- Introduction -->
					<section class="space-y-4">
						<p class="text-lg leading-relaxed">
							At MagicKit, we are committed to protecting your privacy and ensuring the security of your personal information. 
							This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our 
							web application template and related services.
						</p>
						<p class="leading-relaxed">
							By using MagicKit, you agree to the collection and use of information in accordance with this policy. 
							If you do not agree with our policies and practices, please do not use our services.
						</p>
					</section>

					<!-- Information We Collect -->
					<section id="information-collection" class="space-y-6">
						<h2 class="text-2xl font-bold">Information We Collect</h2>
						
						<div id="personal-information" class="space-y-4">
							<h3 class="text-xl font-semibold">Personal Information</h3>
							<p class="leading-relaxed">
								We may collect personal information that you voluntarily provide to us when you:
							</p>
							<ul class="list-disc pl-6 space-y-2">
								<li>Register for an account</li>
								<li>Use our services or features</li>
								<li>Contact us for support</li>
								<li>Subscribe to our newsletter</li>
								<li>Participate in surveys or feedback</li>
							</ul>
							<p class="leading-relaxed">
								This information may include your name, email address, username, profile information, 
								and any other information you choose to provide.
							</p>
						</div>

						<div id="usage-data" class="space-y-4">
							<h3 class="text-xl font-semibold">Usage Data</h3>
							<p class="leading-relaxed">
								We automatically collect certain information when you use our services, including:
							</p>
							<ul class="list-disc pl-6 space-y-2">
								<li>IP address and device information</li>
								<li>Browser type and version</li>
								<li>Pages visited and time spent</li>
								<li>Referring website information</li>
								<li>Operating system and device identifiers</li>
							</ul>
						</div>

						<div id="cookies" class="space-y-4">
							<h3 class="text-xl font-semibold">Cookies and Tracking Technologies</h3>
							<p class="leading-relaxed">
								We use cookies and similar tracking technologies to enhance your experience and collect 
								information about how you use our services. You can control cookie settings through your 
								browser preferences.
							</p>
						</div>
					</section>

					<!-- How We Use Information -->
					<section id="information-use" class="space-y-6">
						<h2 class="text-2xl font-bold">How We Use Your Information</h2>
						
						<div id="service-provision" class="space-y-4">
							<h3 class="text-xl font-semibold">Service Provision</h3>
							<p class="leading-relaxed">
								We use your information to provide, maintain, and improve our services, including:
							</p>
							<ul class="list-disc pl-6 space-y-2">
								<li>Creating and managing your account</li>
								<li>Processing your requests and transactions</li>
								<li>Providing customer support</li>
								<li>Personalizing your experience</li>
							</ul>
						</div>

						<div id="communication" class="space-y-4">
							<h3 class="text-xl font-semibold">Communication</h3>
							<p class="leading-relaxed">
								We may use your contact information to send you important updates about our services, 
								security alerts, and promotional materials (with your consent).
							</p>
						</div>

						<div id="improvement" class="space-y-4">
							<h3 class="text-xl font-semibold">Service Improvement</h3>
							<p class="leading-relaxed">
								We analyze usage patterns and feedback to improve our services, develop new features, 
								and enhance user experience.
							</p>
						</div>
					</section>

					<!-- Information Sharing -->
					<section id="information-sharing" class="space-y-6">
						<h2 class="text-2xl font-bold">Information Sharing and Disclosure</h2>
						
						<div id="third-parties" class="space-y-4">
							<h3 class="text-xl font-semibold">Third-Party Services</h3>
							<p class="leading-relaxed">
								We may share your information with trusted third-party service providers who assist us in 
								operating our services, such as:
							</p>
							<ul class="list-disc pl-6 space-y-2">
								<li>Cloud hosting and storage providers</li>
								<li>Analytics and monitoring services</li>
								<li>Email delivery services</li>
								<li>Payment processors (if applicable)</li>
							</ul>
							<p class="leading-relaxed">
								These providers are bound by confidentiality agreements and are only authorized to use 
								your information as necessary to provide services to us.
							</p>
						</div>

						<div id="legal-requirements" class="space-y-4">
							<h3 class="text-xl font-semibold">Legal Requirements</h3>
							<p class="leading-relaxed">
								We may disclose your information if required by law, court order, or government regulation, 
								or to protect our rights, property, or safety, or that of our users or others.
							</p>
						</div>
					</section>

					<!-- Data Security -->
					<section id="data-security" class="space-y-6">
						<h2 class="text-2xl font-bold">Data Security</h2>
						
						<div id="security-measures" class="space-y-4">
							<h3 class="text-xl font-semibold">Security Measures</h3>
							<p class="leading-relaxed">
								We implement appropriate technical and organizational security measures to protect your 
								personal information against unauthorized access, alteration, disclosure, or destruction, including:
							</p>
							<ul class="list-disc pl-6 space-y-2">
								<li>Encryption of data in transit and at rest</li>
								<li>Regular security assessments and updates</li>
								<li>Access controls and authentication</li>
								<li>Secure development practices</li>
								<li>Employee training on data protection</li>
							</ul>
						</div>

						<div id="data-retention" class="space-y-4">
							<h3 class="text-xl font-semibold">Data Retention</h3>
							<p class="leading-relaxed">
								We retain your personal information only as long as necessary to fulfill the purposes 
								outlined in this policy, comply with legal obligations, resolve disputes, and enforce our agreements.
							</p>
						</div>
					</section>

					<!-- Your Rights -->
					<section id="your-rights" class="space-y-6">
						<h2 class="text-2xl font-bold">Your Rights and Choices</h2>
						
						<div id="access-rights" class="space-y-4">
							<h3 class="text-xl font-semibold">Access and Correction</h3>
							<p class="leading-relaxed">
								You have the right to access, update, or correct your personal information. You can do this 
								through your account settings or by contacting us directly.
							</p>
						</div>

						<div id="deletion-rights" class="space-y-4">
							<h3 class="text-xl font-semibold">Data Deletion</h3>
							<p class="leading-relaxed">
								You may request deletion of your personal information, subject to certain legal and 
								operational requirements. We will respond to such requests within a reasonable timeframe.
							</p>
						</div>

						<div id="portability" class="space-y-4">
							<h3 class="text-xl font-semibold">Data Portability</h3>
							<p class="leading-relaxed">
								Where applicable, you have the right to receive your personal information in a structured, 
								commonly used format and to transmit it to another service provider.
							</p>
						</div>
					</section>

					<!-- Children's Privacy -->
					<section id="children-privacy" class="space-y-4">
						<h2 class="text-2xl font-bold">Children's Privacy</h2>
						<p class="leading-relaxed">
							Our services are not intended for children under the age of 13. We do not knowingly collect 
							personal information from children under 13. If we become aware that we have collected personal 
							information from a child under 13, we will take steps to delete such information.
						</p>
					</section>

					<!-- International Transfers -->
					<section id="international-transfers" class="space-y-4">
						<h2 class="text-2xl font-bold">International Data Transfers</h2>
						<p class="leading-relaxed">
							Your information may be transferred to and processed in countries other than your own. 
							We ensure that such transfers comply with applicable data protection laws and implement 
							appropriate safeguards to protect your information.
						</p>
					</section>

					<!-- Policy Changes -->
					<section id="policy-changes" class="space-y-4">
						<h2 class="text-2xl font-bold">Changes to This Privacy Policy</h2>
						<p class="leading-relaxed">
							We may update this Privacy Policy from time to time to reflect changes in our practices or 
							applicable laws. We will notify you of any material changes by posting the updated policy on 
							our website and updating the "Last Updated" date.
						</p>
						<p class="leading-relaxed">
							Your continued use of our services after any changes indicates your acceptance of the updated policy.
						</p>
					</section>

					<!-- Contact Information -->
					<section id="contact-us" class="space-y-4">
						<h2 class="text-2xl font-bold">Contact Information</h2>
						<p class="leading-relaxed">
							If you have any questions about this Privacy Policy or our data practices, please contact us:
						</p>
						<Card.Root class="mt-4">
							<Card.Content class="p-6">
								<div class="space-y-4">
									<div class="flex items-center gap-3">
										<Mail class="h-5 w-5 text-primary" />
										<div>
											<p class="font-medium">Email</p>
											<p class="text-sm text-muted-foreground">privacy@magickit.dev</p>
										</div>
									</div>
									<div class="pt-4">
										<Button onclick={handleContact} class="transition-colors duration-200">
											<Mail class="mr-2 h-4 w-4" />
											Contact Support
											<ArrowRight class="ml-2 h-4 w-4" />
										</Button>
									</div>
								</div>
							</Card.Content>
						</Card.Root>
					</section>
				</div>
			</div>
		</main>
	</div>
</div>

<style>
	.prose {
		max-width: none;
		line-height: 1.6;
	}
	
	.prose p {
		margin-bottom: 1rem;
		max-width: 75ch;
	}
	
	.prose ul {
		margin-bottom: 1rem;
	}
	
	.prose li {
		margin-bottom: 0.5rem;
		max-width: 70ch;
	}
	
	.prose h2 {
		margin-top: 2rem;
		margin-bottom: 1rem;
		scroll-margin-top: 2rem;
	}
	
	.prose h3 {
		margin-top: 1.5rem;
		margin-bottom: 0.75rem;
		scroll-margin-top: 2rem;
	}
</style>