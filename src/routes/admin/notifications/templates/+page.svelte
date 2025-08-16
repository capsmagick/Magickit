<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { authClient } from '$lib/auth/auth-client';
	import { goto } from '$app/navigation';
	import {
		Mail,
		Plus,
		Edit,
		Trash2,
		Search,
		Copy,
		Send,
		Eye,
		Code,
		FileText,
		Settings,
		Loader2,
		CheckCircle,
		AlertCircle,
		Palette,
		Type,
		Image
	} from '@lucide/svelte';

	let hasCheckedAuth = $state(false);
	let showCreateDialog = $state(false);
	let showEditDialog = $state(false);
	let showPreviewDialog = $state(false);
	let showTestDialog = $state(false);
	let selectedTemplate = $state(null);
	let searchTerm = $state('');
	let categoryFilter = $state('all');
	let isLoading = $state(false);
	let isSaving = $state(false);
	let isTesting = $state(false);

	const session = authClient.useSession();

	// Mock data for email templates with variables and personalization
	let templates = $state([
		{
			id: '1',
			name: 'Welcome Email',
			subject: 'Welcome to {platform_name}, {user_name}!',
			body: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome to {platform_name}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #007bff; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to {platform_name}!</h1>
        </div>
        <div class="content">
            <h2>Hi {user_name},</h2>
            <p>Welcome to {platform_name}! We're excited to have you on board.</p>
            <p>To get started, please verify your email address by clicking the button below:</p>
            <p style="text-align: center;">
                <a href="{verification_link}" class="button">Verify Email Address</a>
            </p>
            <p>If you have any questions, feel free to reach out to our support team.</p>
            <p>Best regards,<br>The {platform_name} Team</p>
        </div>
    </div>
</body>
</html>`,
			category: 'onboarding',
			variables: ['platform_name', 'user_name', 'verification_link'],
			isActive: true,
			createdAt: new Date('2024-01-15T10:00:00'),
			updatedAt: new Date('2024-01-20T14:30:00'),
			lastUsed: new Date('2024-01-20T09:15:00'),
			usageCount: 45
		},
		{
			id: '2',
			name: 'Password Reset',
			subject: 'Reset your {platform_name} password',
			body: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Password Reset</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background: #dc3545; color: white; text-decoration: none; border-radius: 4px; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset Request</h1>
        </div>
        <div class="content">
            <h2>Hi {user_name},</h2>
            <p>We received a request to reset your password for your {platform_name} account.</p>
            <p>Click the button below to reset your password:</p>
            <p style="text-align: center;">
                <a href="{reset_link}" class="button">Reset Password</a>
            </p>
            <div class="warning">
                <strong>Security Notice:</strong> This link will expire in {expiry_hours} hours. If you didn't request this reset, please ignore this email.
            </div>
            <p>Best regards,<br>The {platform_name} Team</p>
        </div>
    </div>
</body>
</html>`,
			category: 'security',
			variables: ['platform_name', 'user_name', 'reset_link', 'expiry_hours'],
			isActive: true,
			createdAt: new Date('2024-01-10T15:30:00'),
			updatedAt: new Date('2024-01-18T11:20:00'),
			lastUsed: new Date('2024-01-19T16:45:00'),
			usageCount: 23
		},
		{
			id: '3',
			name: 'Monthly Newsletter',
			subject: '{platform_name} Monthly Update - {month} {year}',
			body: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Monthly Newsletter</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #28a745; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .feature { background: white; padding: 15px; margin: 15px 0; border-radius: 4px; border-left: 4px solid #28a745; }
        .button { display: inline-block; padding: 12px 24px; background: #28a745; color: white; text-decoration: none; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{platform_name} Monthly Update</h1>
            <p>{month} {year}</p>
        </div>
        <div class="content">
            <h2>Hi {user_name},</h2>
            <p>Here's what's new this month at {platform_name}:</p>
            
            <div class="feature">
                <h3>🚀 New Features</h3>
                <p>{new_features}</p>
            </div>
            
            <div class="feature">
                <h3>📊 Your Stats</h3>
                <p>You've been active with {user_activity} this month!</p>
            </div>
            
            <div class="feature">
                <h3>💡 Tips & Tricks</h3>
                <p>{monthly_tip}</p>
            </div>
            
            <p style="text-align: center;">
                <a href="{dashboard_link}" class="button">Visit Your Dashboard</a>
            </p>
            
            <p>Thanks for being part of our community!</p>
            <p>Best regards,<br>The {platform_name} Team</p>
        </div>
    </div>
</body>
</html>`,
			category: 'marketing',
			variables: ['platform_name', 'user_name', 'month', 'year', 'new_features', 'user_activity', 'monthly_tip', 'dashboard_link'],
			isActive: false,
			createdAt: new Date('2024-01-05T09:00:00'),
			updatedAt: new Date('2024-01-15T13:45:00'),
			lastUsed: new Date('2024-01-01T10:00:00'),
			usageCount: 12
		}
	]);

	// Form data for new/edit template
	let templateForm = $state({
		name: '',
		subject: '',
		body: '',
		category: 'general',
		variables: [],
		isActive: true
	});

	// Test email form
	let testForm = $state({
		email: '',
		variables: {}
	});

	// Template statistics
	const templateStats = $derived({
		total: templates.length,
		active: templates.filter(t => t.isActive).length,
		inactive: templates.filter(t => !t.isActive).length,
		totalUsage: templates.reduce((sum, t) => sum + t.usageCount, 0)
	});

	// Reactive statement to check session and redirect if needed
	$effect(() => {
		if (!hasCheckedAuth && $session.data) {
			hasCheckedAuth = true;
			if ($session.data.user.role !== 'admin') {
				goto('/login?returnTo=/admin/notifications/templates');
				return;
			}
		}
	});

	// Filtered templates based on search and category
	const filteredTemplates = $derived(
		templates.filter(template => {
			const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				template.subject.toLowerCase().includes(searchTerm.toLowerCase());
			const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
			return matchesSearch && matchesCategory;
		})
	);

	function createTemplate() {
		if (!templateForm.name || !templateForm.subject || !templateForm.body) {
			return;
		}

		isSaving = true;

		// Extract variables from template
		const extractedVariables = extractVariables(templateForm.subject + ' ' + templateForm.body);

		// Simulate API call
		setTimeout(() => {
			const template = {
				id: Date.now().toString(),
				name: templateForm.name,
				subject: templateForm.subject,
				body: templateForm.body,
				category: templateForm.category,
				variables: extractedVariables,
				isActive: templateForm.isActive,
				createdAt: new Date(),
				updatedAt: new Date(),
				lastUsed: null,
				usageCount: 0
			};

			templates = [template, ...templates];
			resetForm();
			showCreateDialog = false;
			isSaving = false;
		}, 1000);
	}

	function editTemplate() {
		if (!templateForm.name || !templateForm.subject || !templateForm.body) {
			return;
		}

		isSaving = true;

		// Extract variables from template
		const extractedVariables = extractVariables(templateForm.subject + ' ' + templateForm.body);

		// Simulate API call
		setTimeout(() => {
			templates = templates.map(t =>
				t.id === selectedTemplate.id ? {
					...t,
					name: templateForm.name,
					subject: templateForm.subject,
					body: templateForm.body,
					category: templateForm.category,
					variables: extractedVariables,
					isActive: templateForm.isActive,
					updatedAt: new Date()
				} : t
			);

			resetForm();
			showEditDialog = false;
			selectedTemplate = null;
			isSaving = false;
		}, 1000);
	}

	function resetForm() {
		templateForm = {
			name: '',
			subject: '',
			body: '',
			category: 'general',
			variables: [],
			isActive: true
		};
	}

	function deleteTemplate(id: string) {
		templates = templates.filter(t => t.id !== id);
	}

	function duplicateTemplate(template: any) {
		const duplicate = {
			...template,
			id: Date.now().toString(),
			name: `${template.name} (Copy)`,
			createdAt: new Date(),
			updatedAt: new Date(),
			lastUsed: null,
			usageCount: 0
		};
		templates = [duplicate, ...templates];
	}

	function toggleTemplateStatus(id: string) {
		templates = templates.map(t =>
			t.id === id ? { ...t, isActive: !t.isActive, updatedAt: new Date() } : t
		);
	}

	function openEditDialog(template: any) {
		selectedTemplate = template;
		templateForm = {
			name: template.name,
			subject: template.subject,
			body: template.body,
			category: template.category,
			variables: template.variables,
			isActive: template.isActive
		};
		showEditDialog = true;
	}

	function previewTemplate(template: any) {
		selectedTemplate = template;
		showPreviewDialog = true;
	}

	function openTestDialog(template: any) {
		selectedTemplate = template;
		testForm = {
			email: $session.data?.user?.email || '',
			variables: template.variables.reduce((acc, variable) => {
				acc[variable] = getSampleValue(variable);
				return acc;
			}, {})
		};
		showTestDialog = true;
	}

	function sendTestEmail() {
		if (!testForm.email) return;

		isTesting = true;

		// Simulate API call
		setTimeout(() => {
			// Update last used
			templates = templates.map(t =>
				t.id === selectedTemplate.id ? { ...t, lastUsed: new Date() } : t
			);

			showTestDialog = false;
			isTesting = false;
		}, 2000);
	}

	function extractVariables(text: string): string[] {
		const matches = text.match(/\{([^}]+)\}/g);
		if (!matches) return [];
		return [...new Set(matches.map(match => match.slice(1, -1)))];
	}

	function getSampleValue(variable: string): string {
		const sampleValues: Record<string, string> = {
			'platform_name': 'Magickit',
			'user_name': 'John Doe',
			'user_email': 'john@example.com',
			'verification_link': 'https://example.com/verify/abc123',
			'reset_link': 'https://example.com/reset/xyz789',
			'expiry_hours': '24',
			'month': 'January',
			'year': '2024',
			'new_features': 'Enhanced dashboard and improved performance',
			'user_activity': '15 tasks completed',
			'monthly_tip': 'Use keyboard shortcuts to work faster',
			'dashboard_link': 'https://example.com/dashboard'
		};
		return sampleValues[variable] || `[${variable}]`;
	}

	function renderPreview(template: any): string {
		let rendered = template.body;
		template.variables.forEach(variable => {
			const value = getSampleValue(variable);
			rendered = rendered.replace(new RegExp(`\\{${variable}\\}`, 'g'), value);
		});
		return rendered;
	}

	function getCategoryBadge(category: string) {
		switch (category) {
			case 'onboarding':
				return { variant: 'default' as const, text: 'Onboarding' };
			case 'security':
				return { variant: 'destructive' as const, text: 'Security' };
			case 'marketing':
				return { variant: 'secondary' as const, text: 'Marketing' };
			case 'notification':
				return { variant: 'outline' as const, text: 'Notification' };
			case 'transactional':
				return { variant: 'default' as const, text: 'Transactional' };
			default:
				return { variant: 'outline' as const, text: 'General' };
		}
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
		<div class="space-y-2">
			<h1 class="text-2xl font-bold">Email Templates</h1>
			<p class="text-muted-foreground">Manage reusable email templates with variables and personalization</p>
		</div>
		<Button onclick={() => (showCreateDialog = true)} class="transition-colors duration-200">
			<Plus class="mr-2 h-4 w-4" />
			Create Template
		</Button>
	</div>

	<!-- Template Statistics -->
	<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
		<Card.Root>
			<Card.Content class="p-4 text-center">
				<div class="text-2xl font-bold">{templateStats.total}</div>
				<div class="text-sm text-muted-foreground">Total Templates</div>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Content class="p-4 text-center">
				<div class="text-2xl font-bold text-green-600">{templateStats.active}</div>
				<div class="text-sm text-muted-foreground">Active</div>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Content class="p-4 text-center">
				<div class="text-2xl font-bold text-muted-foreground">{templateStats.inactive}</div>
				<div class="text-sm text-muted-foreground">Inactive</div>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Content class="p-4 text-center">
				<div class="text-2xl font-bold text-blue-600">{templateStats.totalUsage}</div>
				<div class="text-sm text-muted-foreground">Total Usage</div>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Search and Filters -->
	<Card.Root>
		<Card.Content class="p-4">
			<div class="flex flex-col sm:flex-row gap-4">
				<div class="flex-1">
					<div class="relative">
						<Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
						<Input 
							type="search" 
							placeholder="Search templates..." 
							class="pl-8 transition-colors duration-200" 
							bind:value={searchTerm} 
						/>
					</div>
				</div>
				<div class="flex gap-2">
					<Select.Root bind:selected={categoryFilter}>
						<Select.Trigger class="w-40">
							<Select.Value placeholder="Category" />
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="all">All Categories</Select.Item>
							<Select.Item value="onboarding">Onboarding</Select.Item>
							<Select.Item value="security">Security</Select.Item>
							<Select.Item value="marketing">Marketing</Select.Item>
							<Select.Item value="notification">Notification</Select.Item>
							<Select.Item value="transactional">Transactional</Select.Item>
							<Select.Item value="general">General</Select.Item>
						</Select.Content>
					</Select.Root>
					<Button variant="outline" onclick={() => {
						searchTerm = '';
						categoryFilter = 'all';
					}} class="transition-colors duration-200">
						Reset
					</Button>
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Templates Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
		{#if isLoading}
			<div class="col-span-full flex justify-center py-12">
				<Loader2 class="h-8 w-8 animate-spin text-primary" />
			</div>
		{:else if filteredTemplates.length === 0}
			<div class="col-span-full text-center py-12 space-y-4">
				<Mail class="h-12 w-12 mx-auto text-muted-foreground" />
				<div class="space-y-2">
					<h3 class="text-lg font-semibold">No templates found</h3>
					<p class="text-muted-foreground">
						{searchTerm || categoryFilter !== 'all' 
							? 'Try adjusting your search or filters.' 
							: 'Get started by creating your first email template.'}
					</p>
				</div>
				{#if !searchTerm && categoryFilter === 'all'}
					<Button onclick={() => (showCreateDialog = true)} class="transition-colors duration-200">
						<Plus class="mr-2 h-4 w-4" />
						Create Template
					</Button>
				{/if}
			</div>
		{:else}
			{#each filteredTemplates as template}
				<Card.Root class="transition-shadow duration-200 hover:shadow-md">
					<Card.Header class="pb-3">
						<div class="flex items-start justify-between">
							<div class="space-y-1">
								<Card.Title class="text-lg">{template.name}</Card.Title>
								<div class="flex items-center gap-2">
									<Badge variant={getCategoryBadge(template.category).variant} class="text-xs">
										{getCategoryBadge(template.category).text}
									</Badge>
									<Badge variant={template.isActive ? 'default' : 'secondary'} class="text-xs">
										{template.isActive ? 'Active' : 'Inactive'}
									</Badge>
								</div>
							</div>
							<Button
								variant="ghost"
								size="icon"
								onclick={() => toggleTemplateStatus(template.id)}
								class="transition-colors duration-200"
							>
								{#if template.isActive}
									<CheckCircle class="h-4 w-4 text-green-600" />
								{:else}
									<AlertCircle class="h-4 w-4 text-muted-foreground" />
								{/if}
							</Button>
						</div>
					</Card.Header>
					<Card.Content class="space-y-4">
						<div class="space-y-2">
							<p class="text-sm font-medium">Subject:</p>
							<p class="text-sm text-muted-foreground line-clamp-2">{template.subject}</p>
						</div>

						<div class="space-y-2">
							<p class="text-sm font-medium">Variables ({template.variables.length}):</p>
							<div class="flex flex-wrap gap-1">
								{#each template.variables.slice(0, 3) as variable}
									<Badge variant="outline" class="text-xs">
										{variable}
									</Badge>
								{/each}
								{#if template.variables.length > 3}
									<Badge variant="outline" class="text-xs">
										+{template.variables.length - 3} more
									</Badge>
								{/if}
							</div>
						</div>

						<div class="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
							<div>
								<p class="font-medium">Usage:</p>
								<p>{template.usageCount} times</p>
							</div>
							<div>
								<p class="font-medium">Last Used:</p>
								<p>{template.lastUsed ? template.lastUsed.toLocaleDateString() : 'Never'}</p>
							</div>
						</div>

						<div class="flex items-center justify-between pt-2 border-t">
							<div class="flex gap-1">
								<Button 
									variant="ghost" 
									size="icon" 
									onclick={() => previewTemplate(template)}
									aria-label="Preview template"
									class="transition-colors duration-200"
								>
									<Eye class="h-4 w-4" />
								</Button>
								<Button 
									variant="ghost" 
									size="icon" 
									onclick={() => openTestDialog(template)}
									aria-label="Test template"
									class="transition-colors duration-200"
								>
									<Send class="h-4 w-4" />
								</Button>
								<Button 
									variant="ghost" 
									size="icon" 
									onclick={() => openEditDialog(template)}
									aria-label="Edit template"
									class="transition-colors duration-200"
								>
									<Edit class="h-4 w-4" />
								</Button>
							</div>
							<div class="flex gap-1">
								<Button 
									variant="ghost" 
									size="icon" 
									onclick={() => duplicateTemplate(template)}
									aria-label="Duplicate template"
									class="transition-colors duration-200"
								>
									<Copy class="h-4 w-4" />
								</Button>
								<Button 
									variant="ghost" 
									size="icon" 
									onclick={() => deleteTemplate(template.id)}
									aria-label="Delete template"
									class="transition-colors duration-200 hover:text-destructive"
								>
									<Trash2 class="h-4 w-4" />
								</Button>
							</div>
						</div>
					</Card.Content>
				</Card.Root>
			{/each}
		{/if}
	</div>

	<!-- Create Template Dialog -->
	<Dialog.Root bind:open={showCreateDialog}>
		<Dialog.Content class="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
			<Dialog.Header>
				<Dialog.Title>Create Email Template</Dialog.Title>
				<Dialog.Description>
					Create a reusable email template with variables for personalization.
				</Dialog.Description>
			</Dialog.Header>
			<form
				onsubmit={(e) => {
					e.preventDefault();
					createTemplate();
				}}
				class="space-y-6"
			>
				<!-- Template Info -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div class="space-y-2">
						<Label for="name">Template Name *</Label>
						<Input
							id="name"
							bind:value={templateForm.name}
							placeholder="e.g., Welcome Email"
							required
							class="transition-colors duration-200"
						/>
					</div>
					<div class="space-y-2">
						<Label for="category">Category</Label>
						<Select.Root bind:selected={templateForm.category}>
							<Select.Trigger>
								<Select.Value placeholder="Select category" />
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="onboarding">Onboarding</Select.Item>
								<Select.Item value="security">Security</Select.Item>
								<Select.Item value="marketing">Marketing</Select.Item>
								<Select.Item value="notification">Notification</Select.Item>
								<Select.Item value="transactional">Transactional</Select.Item>
								<Select.Item value="general">General</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>
				</div>

				<!-- Subject -->
				<div class="space-y-2">
					<Label for="subject">Email Subject *</Label>
					<Input
						id="subject"
						bind:value={templateForm.subject}
						placeholder="Use {variable_name} for dynamic content"
						required
						class="transition-colors duration-200"
					/>
				</div>

				<!-- Template Editor -->
				<Tabs.Root value="editor" class="space-y-4">
					<Tabs.List class="grid w-full grid-cols-2">
						<Tabs.Trigger value="editor">
							<Code class="mr-2 h-4 w-4" />
							HTML Editor
						</Tabs.Trigger>
						<Tabs.Trigger value="preview">
							<Eye class="mr-2 h-4 w-4" />
							Preview
						</Tabs.Trigger>
					</Tabs.List>
					
					<Tabs.Content value="editor" class="space-y-2">
						<Label for="body">Email Body (HTML) *</Label>
						<Textarea
							id="body"
							bind:value={templateForm.body}
							placeholder="Enter HTML content with {variable_name} for dynamic content..."
							rows={15}
							required
							class="transition-colors duration-200 resize-none font-mono text-sm"
						/>
						<p class="text-xs text-muted-foreground">
							Use {'{variable_name}'} syntax for dynamic content. Variables will be automatically detected.
						</p>
					</Tabs.Content>
					
					<Tabs.Content value="preview" class="space-y-2">
						<Label>Preview</Label>
						<div class="border rounded-md p-4 bg-white min-h-[400px]">
							{#if templateForm.body}
								{@html renderPreview({ ...templateForm, variables: extractVariables(templateForm.subject + ' ' + templateForm.body) })}
							{:else}
								<p class="text-muted-foreground text-center py-8">Enter HTML content to see preview</p>
							{/if}
						</div>
					</Tabs.Content>
				</Tabs.Root>

				<!-- Variables Preview -->
				{#if templateForm.subject || templateForm.body}
					{@const detectedVariables = extractVariables(templateForm.subject + ' ' + templateForm.body)}
					{#if detectedVariables.length > 0}
						<div class="space-y-2">
							<Label>Detected Variables ({detectedVariables.length})</Label>
							<div class="flex flex-wrap gap-2">
								{#each detectedVariables as variable}
									<Badge variant="outline" class="text-xs">
										{variable}
									</Badge>
								{/each}
							</div>
						</div>
					{/if}
				{/if}

				<!-- Status -->
				<div class="flex items-center space-x-2">
					<input
						type="checkbox"
						id="isActive"
						bind:checked={templateForm.isActive}
						class="h-4 w-4"
					/>
					<Label for="isActive" class="text-sm font-medium">Template is active</Label>
				</div>

				<Dialog.Footer>
					<Button
						type="button"
						variant="outline"
						onclick={() => {
							showCreateDialog = false;
							resetForm();
						}}
						disabled={isSaving}
					>
						Cancel
					</Button>
					<Button type="submit" disabled={isSaving} class="transition-colors duration-200">
						{#if isSaving}
							<Loader2 class="mr-2 h-4 w-4 animate-spin" />
							Creating...
						{:else}
							<Plus class="mr-2 h-4 w-4" />
							Create Template
						{/if}
					</Button>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Root>

	<!-- Edit Template Dialog -->
	<Dialog.Root bind:open={showEditDialog}>
		<Dialog.Content class="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
			<Dialog.Header>
				<Dialog.Title>Edit Email Template</Dialog.Title>
				<Dialog.Description>
					Update your email template and variables.
				</Dialog.Description>
			</Dialog.Header>
			<form
				onsubmit={(e) => {
					e.preventDefault();
					editTemplate();
				}}
				class="space-y-6"
			>
				<!-- Same form fields as create dialog -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div class="space-y-2">
						<Label for="editName">Template Name *</Label>
						<Input
							id="editName"
							bind:value={templateForm.name}
							placeholder="e.g., Welcome Email"
							required
							class="transition-colors duration-200"
						/>
					</div>
					<div class="space-y-2">
						<Label for="editCategory">Category</Label>
						<Select.Root bind:selected={templateForm.category}>
							<Select.Trigger>
								<Select.Value placeholder="Select category" />
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="onboarding">Onboarding</Select.Item>
								<Select.Item value="security">Security</Select.Item>
								<Select.Item value="marketing">Marketing</Select.Item>
								<Select.Item value="notification">Notification</Select.Item>
								<Select.Item value="transactional">Transactional</Select.Item>
								<Select.Item value="general">General</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>
				</div>

				<div class="space-y-2">
					<Label for="editSubject">Email Subject *</Label>
					<Input
						id="editSubject"
						bind:value={templateForm.subject}
						placeholder="Use {variable_name} for dynamic content"
						required
						class="transition-colors duration-200"
					/>
				</div>

				<Tabs.Root value="editor" class="space-y-4">
					<Tabs.List class="grid w-full grid-cols-2">
						<Tabs.Trigger value="editor">
							<Code class="mr-2 h-4 w-4" />
							HTML Editor
						</Tabs.Trigger>
						<Tabs.Trigger value="preview">
							<Eye class="mr-2 h-4 w-4" />
							Preview
						</Tabs.Trigger>
					</Tabs.List>
					
					<Tabs.Content value="editor" class="space-y-2">
						<Label for="editBody">Email Body (HTML) *</Label>
						<Textarea
							id="editBody"
							bind:value={templateForm.body}
							placeholder="Enter HTML content with {variable_name} for dynamic content..."
							rows={15}
							required
							class="transition-colors duration-200 resize-none font-mono text-sm"
						/>
					</Tabs.Content>
					
					<Tabs.Content value="preview" class="space-y-2">
						<Label>Preview</Label>
						<div class="border rounded-md p-4 bg-white min-h-[400px]">
							{#if templateForm.body}
								{@html renderPreview({ ...templateForm, variables: extractVariables(templateForm.subject + ' ' + templateForm.body) })}
							{:else}
								<p class="text-muted-foreground text-center py-8">Enter HTML content to see preview</p>
							{/if}
						</div>
					</Tabs.Content>
				</Tabs.Root>

				{#if templateForm.subject || templateForm.body}
					{@const detectedVariables = extractVariables(templateForm.subject + ' ' + templateForm.body)}
					{#if detectedVariables.length > 0}
						<div class="space-y-2">
							<Label>Detected Variables ({detectedVariables.length})</Label>
							<div class="flex flex-wrap gap-2">
								{#each detectedVariables as variable}
									<Badge variant="outline" class="text-xs">
										{variable}
									</Badge>
								{/each}
							</div>
						</div>
					{/if}
				{/if}

				<div class="flex items-center space-x-2">
					<input
						type="checkbox"
						id="editIsActive"
						bind:checked={templateForm.isActive}
						class="h-4 w-4"
					/>
					<Label for="editIsActive" class="text-sm font-medium">Template is active</Label>
				</div>

				<Dialog.Footer>
					<Button
						type="button"
						variant="outline"
						onclick={() => {
							showEditDialog = false;
							resetForm();
							selectedTemplate = null;
						}}
						disabled={isSaving}
					>
						Cancel
					</Button>
					<Button type="submit" disabled={isSaving} class="transition-colors duration-200">
						{#if isSaving}
							<Loader2 class="mr-2 h-4 w-4 animate-spin" />
							Saving...
						{:else}
							<CheckCircle class="mr-2 h-4 w-4" />
							Save Changes
						{/if}
					</Button>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Root>

	<!-- Preview Dialog -->
	<Dialog.Root bind:open={showPreviewDialog}>
		<Dialog.Content class="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
			<Dialog.Header>
				<Dialog.Title>Template Preview</Dialog.Title>
				<Dialog.Description>
					Preview how the email will look with sample data.
				</Dialog.Description>
			</Dialog.Header>
			{#if selectedTemplate}
				<div class="space-y-4">
					<div class="grid grid-cols-2 gap-4 text-sm">
						<div>
							<p class="font-medium">Template:</p>
							<p class="text-muted-foreground">{selectedTemplate.name}</p>
						</div>
						<div>
							<p class="font-medium">Category:</p>
							<Badge variant={getCategoryBadge(selectedTemplate.category).variant} class="text-xs">
								{getCategoryBadge(selectedTemplate.category).text}
							</Badge>
						</div>
					</div>
					<div class="space-y-2">
						<p class="font-medium">Subject:</p>
						<p class="text-sm bg-muted p-2 rounded">
							{selectedTemplate.subject.replace(/\{([^}]+)\}/g, (match, variable) => getSampleValue(variable))}
						</p>
					</div>
					<div class="space-y-2">
						<p class="font-medium">Email Content:</p>
						<div class="border rounded-md p-4 bg-white max-h-96 overflow-y-auto">
							{@html renderPreview(selectedTemplate)}
						</div>
					</div>
				</div>
			{/if}
			<Dialog.Footer>
				<Button onclick={() => (showPreviewDialog = false)}>Close</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>

	<!-- Test Email Dialog -->
	<Dialog.Root bind:open={showTestDialog}>
		<Dialog.Content class="sm:max-w-2xl">
			<Dialog.Header>
				<Dialog.Title>Send Test Email</Dialog.Title>
				<Dialog.Description>
					Send a test email with sample data to verify the template.
				</Dialog.Description>
			</Dialog.Header>
			{#if selectedTemplate}
				<form
					onsubmit={(e) => {
						e.preventDefault();
						sendTestEmail();
					}}
					class="space-y-6"
				>
					<div class="space-y-2">
						<Label for="testEmail">Test Email Address *</Label>
						<Input
							id="testEmail"
							type="email"
							bind:value={testForm.email}
							placeholder="Enter email address"
							required
							class="transition-colors duration-200"
						/>
					</div>

					<div class="space-y-4">
						<Label>Variable Values</Label>
						{#each selectedTemplate.variables as variable}
							<div class="space-y-2">
								<Label for="var-{variable}" class="text-sm">{variable}</Label>
								<Input
									id="var-{variable}"
									bind:value={testForm.variables[variable]}
									placeholder="Enter value for {variable}"
									class="transition-colors duration-200"
								/>
							</div>
						{/each}
					</div>

					<Alert.Root>
						<Mail class="h-4 w-4" />
						<Alert.Title>Test Email Preview</Alert.Title>
						<Alert.Description>
							<strong>To:</strong> {testForm.email}<br />
							<strong>Subject:</strong> {selectedTemplate.subject.replace(/\{([^}]+)\}/g, (match, variable) => testForm.variables[variable] || getSampleValue(variable))}
						</Alert.Description>
					</Alert.Root>

					<Dialog.Footer>
						<Button
							type="button"
							variant="outline"
							onclick={() => (showTestDialog = false)}
							disabled={isTesting}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isTesting} class="transition-colors duration-200">
							{#if isTesting}
								<Loader2 class="mr-2 h-4 w-4 animate-spin" />
								Sending...
							{:else}
								<Send class="mr-2 h-4 w-4" />
								Send Test Email
							{/if}
						</Button>
					</Dialog.Footer>
				</form>
			{/if}
		</Dialog.Content>
	</Dialog.Root>
</div>