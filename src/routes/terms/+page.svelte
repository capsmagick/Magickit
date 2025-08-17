<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { goto } from '$app/navigation';
	import { 
		FileText, 
		Scale, 
		Mail, 
		Calendar,
		ArrowRight,
		AlertTriangle,
		Shield
	} from '@lucide/svelte';

	// Table of contents data
	const tableOfContents = [
		{ id: 'acceptance', title: 'Acceptance of Terms', level: 1 },
		{ id: 'description', title: 'Description of Service', level: 1 },
		{ id: 'user-accounts', title: 'User Accounts', level: 1 },
		{ id: 'account-creation', title: 'Account Creation', level: 2 },
		{ id: 'account-security', title: 'Account Security', level: 2 },
		{ id: 'account-termination', title: 'Account Termination', level: 2 },
		{ id: 'acceptable-use', title: 'Acceptable Use Policy', level: 1 },
		{ id: 'permitted-uses', title: 'Permitted Uses', level: 2 },
		{ id: 'prohibited-activities', title: 'Prohibited Activities', level: 2 },
		{ id: 'content-policy', title: 'Content Policy', level: 1 },
		{ id: 'user-content', title: 'User-Generated Content', level: 2 },
		{ id: 'content-rights', title: 'Content Rights and Licenses', level: 2 },
		{ id: 'content-moderation', title: 'Content Moderation', level: 2 },
		{ id: 'intellectual-property', title: 'Intellectual Property', level: 1 },
		{ id: 'our-ip', title: 'Our Intellectual Property', level: 2 },
		{ id: 'license-grant', title: 'License Grant to You', level: 2 },
		{ id: 'dmca-policy', title: 'DMCA Policy', level: 2 },
		{ id: 'privacy-data', title: 'Privacy and Data Protection', level: 1 },
		{ id: 'payment-terms', title: 'Payment Terms', level: 1 },
		{ id: 'fees-billing', title: 'Fees and Billing', level: 2 },
		{ id: 'refund-policy', title: 'Refund Policy', level: 2 },
		{ id: 'disclaimers', title: 'Disclaimers and Warranties', level: 1 },
		{ id: 'service-availability', title: 'Service Availability', level: 2 },
		{ id: 'warranty-disclaimer', title: 'Warranty Disclaimer', level: 2 },
		{ id: 'limitation-liability', title: 'Limitation of Liability', level: 1 },
		{ id: 'indemnification', title: 'Indemnification', level: 1 },
		{ id: 'termination', title: 'Termination', level: 1 },
		{ id: 'termination-by-us', title: 'Termination by Us', level: 2 },
		{ id: 'termination-by-you', title: 'Termination by You', level: 2 },
		{ id: 'effect-termination', title: 'Effect of Termination', level: 2 },
		{ id: 'governing-law', title: 'Governing Law and Jurisdiction', level: 1 },
		{ id: 'dispute-resolution', title: 'Dispute Resolution', level: 1 },
		{ id: 'general-provisions', title: 'General Provisions', level: 1 },
		{ id: 'changes-terms', title: 'Changes to Terms', level: 1 },
		{ id: 'contact-information', title: 'Contact Information', level: 1 }
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
	<title>Terms of Service | MagicKit</title>
	<meta name="description" content="MagicKit Terms of Service - Read our terms and conditions for using our web application template and services." />
	<meta name="robots" content="index, follow" />
</svelte:head>

<div class="container mx-auto px-4 py-6">
	<!-- Header Section -->
	<section class="mb-12">
		<div class="max-w-4xl mx-auto text-center space-y-6">
			<div class="flex justify-center">
				<div class="p-4 rounded-lg bg-primary/10">
					<Scale class="h-12 w-12 text-primary" />
				</div>
			</div>
			<div class="space-y-4">
				<h1 class="text-2xl md:text-4xl lg:text-5xl font-bold tracking-tight">
					Terms of Service
				</h1>
				<p class="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
					Please read these terms carefully before using our services. By using MagicKit, you agree to these terms.
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
					<!-- Important Notice -->
					<Card.Root class="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
						<Card.Content class="p-6">
							<div class="flex items-start gap-3">
								<AlertTriangle class="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
								<div class="space-y-2">
									<p class="font-medium text-amber-800 dark:text-amber-200">Important Notice</p>
									<p class="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
										These terms constitute a legally binding agreement between you and MagicKit. 
										Please read them carefully and contact us if you have any questions before using our services.
									</p>
								</div>
							</div>
						</Card.Content>
					</Card.Root>

					<!-- Acceptance of Terms -->
					<section id="acceptance" class="space-y-4">
						<h2 class="text-2xl font-bold">Acceptance of Terms</h2>
						<p class="leading-relaxed">
							By accessing or using MagicKit's web application template and related services ("Services"), 
							you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, 
							you may not access or use our Services.
						</p>
						<p class="leading-relaxed">
							These Terms apply to all users of the Services, including developers, organizations, and any 
							other individuals or entities that access or use the Services.
						</p>
					</section>

					<!-- Description of Service -->
					<section id="description" class="space-y-4">
						<h2 class="text-2xl font-bold">Description of Service</h2>
						<p class="leading-relaxed">
							MagicKit provides a comprehensive web application template built with modern technologies 
							including SvelteKit, TypeScript, Tailwind CSS, and other open-source tools. Our Services include:
						</p>
						<ul class="list-disc pl-6 space-y-2">
							<li>Access to the MagicKit template and source code</li>
							<li>Documentation and tutorials</li>
							<li>Community support and resources</li>
							<li>Updates and improvements to the template</li>
							<li>Additional tools and integrations</li>
						</ul>
					</section>

					<!-- User Accounts -->
					<section id="user-accounts" class="space-y-6">
						<h2 class="text-2xl font-bold">User Accounts</h2>
						
						<div id="account-creation" class="space-y-4">
							<h3 class="text-xl font-semibold">Account Creation</h3>
							<p class="leading-relaxed">
								To access certain features of our Services, you may need to create an account. When creating 
								an account, you must provide accurate, complete, and current information. You are responsible 
								for maintaining the accuracy of your account information.
							</p>
						</div>

						<div id="account-security" class="space-y-4">
							<h3 class="text-xl font-semibold">Account Security</h3>
							<p class="leading-relaxed">
								You are responsible for maintaining the security of your account credentials and for all 
								activities that occur under your account. You must:
							</p>
							<ul class="list-disc pl-6 space-y-2">
								<li>Keep your password secure and confidential</li>
								<li>Notify us immediately of any unauthorized access</li>
								<li>Use strong authentication methods when available</li>
								<li>Log out of your account when using shared devices</li>
							</ul>
						</div>

						<div id="account-termination" class="space-y-4">
							<h3 class="text-xl font-semibold">Account Termination</h3>
							<p class="leading-relaxed">
								We reserve the right to suspend or terminate your account if you violate these Terms or 
								engage in activities that harm our Services or other users.
							</p>
						</div>
					</section>

					<!-- Acceptable Use Policy -->
					<section id="acceptable-use" class="space-y-6">
						<h2 class="text-2xl font-bold">Acceptable Use Policy</h2>
						
						<div id="permitted-uses" class="space-y-4">
							<h3 class="text-xl font-semibold">Permitted Uses</h3>
							<p class="leading-relaxed">
								You may use our Services for lawful purposes, including:
							</p>
							<ul class="list-disc pl-6 space-y-2">
								<li>Building web applications for personal or commercial use</li>
								<li>Learning and educational purposes</li>
								<li>Contributing to the open-source community</li>
								<li>Sharing knowledge and best practices</li>
							</ul>
						</div>

						<div id="prohibited-activities" class="space-y-4">
							<h3 class="text-xl font-semibold">Prohibited Activities</h3>
							<p class="leading-relaxed">
								You may not use our Services to:
							</p>
							<ul class="list-disc pl-6 space-y-2">
								<li>Violate any applicable laws or regulations</li>
								<li>Infringe on intellectual property rights</li>
								<li>Distribute malware or harmful code</li>
								<li>Engage in fraudulent or deceptive practices</li>
								<li>Harass, abuse, or harm other users</li>
								<li>Attempt to gain unauthorized access to our systems</li>
								<li>Interfere with the proper functioning of our Services</li>
							</ul>
						</div>
					</section>

					<!-- Content Policy -->
					<section id="content-policy" class="space-y-6">
						<h2 class="text-2xl font-bold">Content Policy</h2>
						
						<div id="user-content" class="space-y-4">
							<h3 class="text-xl font-semibold">User-Generated Content</h3>
							<p class="leading-relaxed">
								You retain ownership of any content you create using our Services. However, you are 
								responsible for ensuring that your content complies with applicable laws and does not 
								infringe on the rights of others.
							</p>
						</div>

						<div id="content-rights" class="space-y-4">
							<h3 class="text-xl font-semibold">Content Rights and Licenses</h3>
							<p class="leading-relaxed">
								By using our Services, you grant us a limited, non-exclusive license to host, store, 
								and display your content as necessary to provide the Services. This license terminates 
								when you delete your content or close your account.
							</p>
						</div>

						<div id="content-moderation" class="space-y-4">
							<h3 class="text-xl font-semibold">Content Moderation</h3>
							<p class="leading-relaxed">
								We reserve the right to review, moderate, or remove content that violates these Terms 
								or our community guidelines, but we are not obligated to monitor all content.
							</p>
						</div>
					</section>

					<!-- Intellectual Property -->
					<section id="intellectual-property" class="space-y-6">
						<h2 class="text-2xl font-bold">Intellectual Property</h2>
						
						<div id="our-ip" class="space-y-4">
							<h3 class="text-xl font-semibold">Our Intellectual Property</h3>
							<p class="leading-relaxed">
								MagicKit and its original content, features, and functionality are owned by us and are 
								protected by international copyright, trademark, and other intellectual property laws.
							</p>
						</div>

						<div id="license-grant" class="space-y-4">
							<h3 class="text-xl font-semibold">License Grant to You</h3>
							<p class="leading-relaxed">
								Subject to these Terms, we grant you a limited, non-exclusive, non-transferable license 
								to use our Services for their intended purpose. This license does not include the right to:
							</p>
							<ul class="list-disc pl-6 space-y-2">
								<li>Resell or redistribute our Services</li>
								<li>Remove or modify copyright notices</li>
								<li>Reverse engineer our proprietary code</li>
								<li>Use our trademarks without permission</li>
							</ul>
						</div>

						<div id="dmca-policy" class="space-y-4">
							<h3 class="text-xl font-semibold">DMCA Policy</h3>
							<p class="leading-relaxed">
								We respect intellectual property rights and will respond to valid DMCA takedown notices. 
								If you believe your copyrighted work has been infringed, please contact us with the required information.
							</p>
						</div>
					</section>

					<!-- Privacy and Data Protection -->
					<section id="privacy-data" class="space-y-4">
						<h2 class="text-2xl font-bold">Privacy and Data Protection</h2>
						<p class="leading-relaxed">
							Your privacy is important to us. Our collection and use of personal information is governed 
							by our Privacy Policy, which is incorporated into these Terms by reference. By using our Services, 
							you consent to the collection and use of your information as described in our Privacy Policy.
						</p>
						<Card.Root class="mt-4">
							<Card.Content class="p-4">
								<div class="flex items-center gap-3">
									<Shield class="h-5 w-5 text-primary" />
									<div>
										<p class="font-medium">Privacy Policy</p>
										<p class="text-sm text-muted-foreground">
											Learn more about how we protect your data
										</p>
									</div>
									<Button variant="outline" size="sm" onclick={() => goto('/privacy')} class="ml-auto">
										View Policy
									</Button>
								</div>
							</Card.Content>
						</Card.Root>
					</section>

					<!-- Payment Terms -->
					<section id="payment-terms" class="space-y-6">
						<h2 class="text-2xl font-bold">Payment Terms</h2>
						
						<div id="fees-billing" class="space-y-4">
							<h3 class="text-xl font-semibold">Fees and Billing</h3>
							<p class="leading-relaxed">
								Some features of our Services may require payment. All fees are non-refundable unless 
								otherwise specified. We reserve the right to change our pricing with reasonable notice.
							</p>
						</div>

						<div id="refund-policy" class="space-y-4">
							<h3 class="text-xl font-semibold">Refund Policy</h3>
							<p class="leading-relaxed">
								Refunds may be available in certain circumstances as outlined in our refund policy. 
								Please contact us to discuss refund requests.
							</p>
						</div>
					</section>

					<!-- Disclaimers and Warranties -->
					<section id="disclaimers" class="space-y-6">
						<h2 class="text-2xl font-bold">Disclaimers and Warranties</h2>
						
						<div id="service-availability" class="space-y-4">
							<h3 class="text-xl font-semibold">Service Availability</h3>
							<p class="leading-relaxed">
								We strive to maintain high availability of our Services, but we cannot guarantee 
								uninterrupted access. Services may be temporarily unavailable due to maintenance, 
								updates, or technical issues.
							</p>
						</div>

						<div id="warranty-disclaimer" class="space-y-4">
							<h3 class="text-xl font-semibold">Warranty Disclaimer</h3>
							<p class="leading-relaxed">
								OUR SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, 
								WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, 
								FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
							</p>
						</div>
					</section>

					<!-- Limitation of Liability -->
					<section id="limitation-liability" class="space-y-4">
						<h2 class="text-2xl font-bold">Limitation of Liability</h2>
						<p class="leading-relaxed">
							TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, 
							SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, 
							DATA, OR USE, ARISING OUT OF OR RELATING TO THESE TERMS OR OUR SERVICES.
						</p>
						<p class="leading-relaxed">
							OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATING TO THESE TERMS OR 
							OUR SERVICES SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE MONTHS PRECEDING THE CLAIM.
						</p>
					</section>

					<!-- Indemnification -->
					<section id="indemnification" class="space-y-4">
						<h2 class="text-2xl font-bold">Indemnification</h2>
						<p class="leading-relaxed">
							You agree to indemnify, defend, and hold harmless MagicKit and its officers, directors, 
							employees, and agents from any claims, damages, losses, or expenses arising out of your 
							use of our Services, violation of these Terms, or infringement of any rights of another party.
						</p>
					</section>

					<!-- Termination -->
					<section id="termination" class="space-y-6">
						<h2 class="text-2xl font-bold">Termination</h2>
						
						<div id="termination-by-us" class="space-y-4">
							<h3 class="text-xl font-semibold">Termination by Us</h3>
							<p class="leading-relaxed">
								We may terminate or suspend your access to our Services at any time, with or without 
								cause, with or without notice, for any reason including violation of these Terms.
							</p>
						</div>

						<div id="termination-by-you" class="space-y-4">
							<h3 class="text-xl font-semibold">Termination by You</h3>
							<p class="leading-relaxed">
								You may terminate your account at any time by following the account closure process 
								or by contacting us directly.
							</p>
						</div>

						<div id="effect-termination" class="space-y-4">
							<h3 class="text-xl font-semibold">Effect of Termination</h3>
							<p class="leading-relaxed">
								Upon termination, your right to use our Services will cease immediately. Provisions 
								that by their nature should survive termination will remain in effect.
							</p>
						</div>
					</section>

					<!-- Governing Law and Jurisdiction -->
					<section id="governing-law" class="space-y-4">
						<h2 class="text-2xl font-bold">Governing Law and Jurisdiction</h2>
						<p class="leading-relaxed">
							These Terms shall be governed by and construed in accordance with the laws of [Jurisdiction], 
							without regard to its conflict of law provisions. Any disputes arising under these Terms 
							shall be subject to the exclusive jurisdiction of the courts in [Jurisdiction].
						</p>
					</section>

					<!-- Dispute Resolution -->
					<section id="dispute-resolution" class="space-y-4">
						<h2 class="text-2xl font-bold">Dispute Resolution</h2>
						<p class="leading-relaxed">
							We encourage you to contact us first to resolve any disputes informally. If we cannot 
							resolve a dispute through informal means, any legal action must be commenced within one 
							year after the claim arose.
						</p>
					</section>

					<!-- General Provisions -->
					<section id="general-provisions" class="space-y-4">
						<h2 class="text-2xl font-bold">General Provisions</h2>
						<p class="leading-relaxed">
							These Terms constitute the entire agreement between you and MagicKit regarding our Services. 
							If any provision is found to be unenforceable, the remaining provisions will remain in effect. 
							Our failure to enforce any right or provision does not constitute a waiver of such right or provision.
						</p>
					</section>

					<!-- Changes to Terms -->
					<section id="changes-terms" class="space-y-4">
						<h2 class="text-2xl font-bold">Changes to These Terms</h2>
						<p class="leading-relaxed">
							We reserve the right to modify these Terms at any time. We will notify you of any material 
							changes by posting the updated Terms on our website and updating the "Last Updated" date. 
							Your continued use of our Services after any changes constitutes acceptance of the new Terms.
						</p>
					</section>

					<!-- Contact Information -->
					<section id="contact-information" class="space-y-4">
						<h2 class="text-2xl font-bold">Contact Information</h2>
						<p class="leading-relaxed">
							If you have any questions about these Terms of Service, please contact us:
						</p>
						<Card.Root class="mt-4">
							<Card.Content class="p-6">
								<div class="space-y-4">
									<div class="flex items-center gap-3">
										<Mail class="h-5 w-5 text-primary" />
										<div>
											<p class="font-medium">Email</p>
											<p class="text-sm text-muted-foreground">legal@magickit.dev</p>
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