<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger
	} from '$lib/components/ui/select/index.js';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog/index.js';
	import { authClient } from '$lib/auth/auth-client';
	import { goto } from '$app/navigation';
	import {
		Bell,
		Plus,
		Edit,
		Trash2,
		Search,
		RefreshCw,
		AlertTriangle,
		Info,
		CheckCircle,
		XCircle,
		Mail,
		Settings,
		FileTextIcon,
		MessageSquareIcon
	} from '@lucide/svelte';

	let hasCheckedAuth = $state(false);
	let activeTab = $state('users');
	let showCreateNotificationDialog = $state(false);
	let showCreateTemplateDialog = $state(false);

	const session = authClient.useSession();

	// Mock data for demonstration
	let userNotifications = $state([
		{
			id: '1',
			title: 'Welcome to the platform',
			message: 'Thank you for joining us! Get started by completing your profile.',
			type: 'info',
			recipients: ['all_users'],
			status: 'sent',
			sentAt: new Date('2024-01-20T09:00:00'),
			readCount: 45,
			totalCount: 50
		},
		{
			id: '2',
			title: 'Maintenance Notice',
			message: 'Scheduled maintenance on Sunday from 2-4 AM EST.',
			type: 'warning',
			recipients: ['premium_users'],
			status: 'scheduled',
			scheduledFor: new Date('2024-01-21T14:00:00'),
			readCount: 0,
			totalCount: 25
		}
	]);

	let systemAlerts = $state([
		{
			id: '1',
			title: 'High CPU Usage',
			message: 'Server CPU usage has exceeded 80% for the last 10 minutes.',
			severity: 'high',
			status: 'active',
			detectedAt: new Date('2024-01-20T10:30:00'),
			acknowledged: false
		},
		{
			id: '2',
			title: 'Database Connection Pool',
			message: 'Database connection pool is at 90% capacity.',
			severity: 'medium',
			status: 'resolved',
			detectedAt: new Date('2024-01-20T08:15:00'),
			resolvedAt: new Date('2024-01-20T08:45:00'),
			acknowledged: true
		}
	]);

	let emailTemplates = $state([
		{
			id: '1',
			name: 'Welcome Email',
			subject: 'Welcome to {platform_name}',
			body: "Hi {user_name},\n\nWelcome to {platform_name}! We're excited to have you on board.",
			category: 'onboarding',
			variables: ['platform_name', 'user_name']
		},
		{
			id: '2',
			name: 'Password Reset',
			subject: 'Reset your password',
			body: 'Hi {user_name},\n\nClick the link below to reset your password: {reset_link}',
			category: 'security',
			variables: ['user_name', 'reset_link']
		}
	]);

	// Form data
	let newNotification = $state({
		title: '',
		message: '',
		type: 'info',
		recipients: 'all_users',
		scheduledFor: ''
	});

	let newTemplate = $state({
		name: '',
		subject: '',
		body: '',
		category: 'general'
	});

	// Reactive statement to check session and redirect if needed
	$effect(() => {
		if (!hasCheckedAuth && $session.data) {
			hasCheckedAuth = true;
			if ($session.data.user.role !== 'admin') {
				goto('/login?returnTo=/admin/notifications');
				return;
			}
		}
	});

	function createNotification() {
		if (!newNotification.title || !newNotification.message) {
			return;
		}

		const notification = {
			id: Date.now().toString(),
			title: newNotification.title,
			message: newNotification.message,
			type: newNotification.type,
			recipients: [newNotification.recipients],
			status: newNotification.scheduledFor ? 'scheduled' : 'draft',
			scheduledFor: newNotification.scheduledFor
				? new Date(newNotification.scheduledFor)
				: undefined,
			sentAt: newNotification.scheduledFor ? undefined : new Date(),
			readCount: 0,
			totalCount: 0
		};

		userNotifications = [...userNotifications, notification];
		newNotification = {
			title: '',
			message: '',
			type: 'info',
			recipients: 'all_users',
			scheduledFor: ''
		};
		showCreateNotificationDialog = false;
	}

	function createTemplate() {
		if (!newTemplate.name || !newTemplate.subject || !newTemplate.body) {
			return;
		}

		const template = {
			id: Date.now().toString(),
			name: newTemplate.name,
			subject: newTemplate.subject,
			body: newTemplate.body,
			category: newTemplate.category,
			variables: []
		};

		emailTemplates = [...emailTemplates, template];
		newTemplate = { name: '', subject: '', body: '', category: 'general' };
		showCreateTemplateDialog = false;
	}

	function acknowledgeAlert(alertId: string) {
		systemAlerts = systemAlerts.map((alert) =>
			alert.id === alertId ? { ...alert, acknowledged: true } : alert
		);
	}

	function resolveAlert(alertId: string) {
		systemAlerts = systemAlerts.map((alert) =>
			alert.id === alertId ? { ...alert, status: 'resolved', resolvedAt: new Date() } : alert
		);
	}

	function deleteNotification(id: string) {
		userNotifications = userNotifications.filter((n) => n.id !== id);
	}

	function deleteTemplate(id: string) {
		emailTemplates = emailTemplates.filter((t) => t.id !== id);
	}

	// Helper function to get icon component
	function getTypeIconComponent(type: string) {
		const iconMap: Record<string, any> = {
			email: FileTextIcon,
			sms: MessageSquareIcon,
			push: Bell,
			'in-app': Bell
		};
		return iconMap[type] || null;
	}

	function getSeverityColor(severity: string) {
		switch (severity) {
			case 'high':
				return 'bg-red-500';
			case 'medium':
				return 'bg-yellow-500';
			case 'low':
				return 'bg-blue-500';
			default:
				return 'bg-gray-500';
		}
	}

	function getStatusBadge(status: string) {
		switch (status) {
			case 'sent':
				return { variant: 'default' as const, text: 'Sent' };
			case 'scheduled':
				return { variant: 'secondary' as const, text: 'Scheduled' };
			case 'draft':
				return { variant: 'outline' as const, text: 'Draft' };
			default:
				return { variant: 'outline' as const, text: status };
		}
	}
</script>

<div class="container mx-auto space-y-6 p-6">
	<!-- Header -->
	<div class="mb-8">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-3xl font-bold text-gray-900 dark:text-white">Notifications</h1>
				<p class="mt-2 text-gray-600 dark:text-gray-400">
					Manage system notifications, alerts, and email templates
				</p>
			</div>
			<div class="flex gap-2">
				<Button variant="outline" onclick={() => (showCreateNotificationDialog = true)}>
					<Plus class="mr-2 h-4 w-4" />
					Create Notification
				</Button>
				<Button variant="outline" onclick={() => (showCreateTemplateDialog = true)}>
					<Plus class="mr-2 h-4 w-4" />
					Create Template
				</Button>
			</div>
		</div>
	</div>

	<!-- Main Content -->
	<Tabs bind:value={activeTab} class="space-y-6">
		<TabsList class="grid w-full grid-cols-3">
			<TabsTrigger value="users">User Notifications</TabsTrigger>
			<TabsTrigger value="system">System Alerts</TabsTrigger>
			<TabsTrigger value="templates">Email Templates</TabsTrigger>
		</TabsList>

		<!-- User Notifications Tab -->
		<TabsContent value="users" class="space-y-6">
			<Card.Root>
				<Card.Header>
					<Card.Title class="text-xl">User Notifications</Card.Title>
					<Card.Description>Send and manage notifications to users</Card.Description>
				</Card.Header>
				<Card.Content>
					<div class="space-y-4">
						{#each userNotifications as notification}
							<div class="flex items-center justify-between rounded-lg border p-4">
								<div class="flex items-center gap-3">
									<div class="rounded-lg bg-primary/10 p-2">
										{#if getTypeIconComponent(notification.type)}
											{@render getTypeIconComponent(notification.type)({
												class: 'h-4 w-4 text-primary'
											})}
										{/if}
									</div>
									<div>
										<h4 class="font-medium">{notification.title}</h4>
										<p class="text-sm text-muted-foreground">{notification.message}</p>
										<div class="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
											<span>Recipients: {notification.recipients.join(', ')}</span>
											{#if notification.status}
												<span>
													Status: <Badge
														variant={getStatusBadge(notification.status).variant}
														class="ml-1">{getStatusBadge(notification.status).text}</Badge
													>
												</span>
											{/if}
											{#if notification.scheduledFor}
												<span>Scheduled: {notification.scheduledFor.toLocaleString()}</span>
											{:else if notification.sentAt}
												<span>Sent: {notification.sentAt.toLocaleString()}</span>
											{/if}
										</div>
									</div>
								</div>
								<div class="flex items-center gap-2">
									<Badge variant="outline">
										{notification.readCount}/{notification.totalCount} read
									</Badge>
									<Button variant="ghost" size="sm">
										<Edit class="h-3 w-3" />
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onclick={() => deleteNotification(notification.id)}
									>
										<Trash2 class="h-3 w-3" />
									</Button>
								</div>
							</div>
						{/each}
					</div>
				</Card.Content>
			</Card.Root>
		</TabsContent>

		<!-- System Alerts Tab -->
		<TabsContent value="system" class="space-y-6">
			<Card.Root>
				<Card.Header>
					<Card.Title class="text-xl">System Alerts</Card.Title>
					<Card.Description>Monitor and manage system health alerts</Card.Description>
				</Card.Header>
				<Card.Content>
					<div class="space-y-4">
						{#each systemAlerts as alert}
							<div class="flex items-center justify-between rounded-lg border p-4">
								<div class="flex items-center gap-3">
									<div class="rounded-lg p-2 {getSeverityColor(alert.severity)} text-white">
										<AlertTriangle class="h-4 w-4" />
									</div>
									<div>
										<h4 class="font-medium">{alert.title}</h4>
										<p class="text-sm text-muted-foreground">{alert.message}</p>
										<div class="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
											<span>Detected: {alert.detectedAt.toLocaleString()}</span>
											<Badge variant={alert.status === 'active' ? 'destructive' : 'default'}>
												{alert.status}
											</Badge>
											{#if alert.resolvedAt}
												<span>Resolved: {alert.resolvedAt.toLocaleString()}</span>
											{/if}
										</div>
									</div>
								</div>
								<div class="flex items-center gap-2">
									{#if !alert.acknowledged}
										<Button variant="outline" size="sm" onclick={() => acknowledgeAlert(alert.id)}>
											Acknowledge
										</Button>
									{/if}
									{#if alert.status === 'active'}
										<Button variant="outline" size="sm" onclick={() => resolveAlert(alert.id)}>
											Resolve
										</Button>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</Card.Content>
			</Card.Root>
		</TabsContent>

		<!-- Email Templates Tab -->
		<TabsContent value="templates" class="space-y-6">
			<Card.Root>
				<Card.Header>
					<Card.Title class="text-xl">Email Templates</Card.Title>
					<Card.Description>Manage reusable email templates for notifications</Card.Description>
				</Card.Header>
				<Card.Content>
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						{#each emailTemplates as template}
							<Card.Root class="transition-shadow hover:shadow-lg">
								<Card.Header>
									<div class="flex items-center justify-between">
										<Card.Title class="text-lg">{template.name}</Card.Title>
										<Badge variant="outline">{template.category}</Badge>
									</div>
									<Card.Description>Subject: {template.subject}</Card.Description>
								</Card.Header>
								<Card.Content>
									<div class="space-y-3">
										<div>
											<h4 class="mb-2 text-sm font-medium">Template Variables:</h4>
											<div class="flex flex-wrap gap-1">
												{#each template.variables as variable}
													<Badge variant="outline" class="text-xs">
														{variable}
													</Badge>
												{/each}
											</div>
										</div>
										<div class="flex items-center justify-between text-sm text-muted-foreground">
											<div class="flex gap-1">
												<Button variant="ghost" size="sm">
													<Edit class="h-3 w-3" />
												</Button>
												<Button
													variant="ghost"
													size="sm"
													onclick={() => deleteTemplate(template.id)}
												>
													<Trash2 class="h-3 w-3" />
												</Button>
											</div>
										</div>
									</div>
								</Card.Content>
							</Card.Root>
						{/each}
					</div>
				</Card.Content>
			</Card.Root>
		</TabsContent>
	</Tabs>

	<!-- Create Notification Dialog -->
	<Dialog bind:open={showCreateNotificationDialog}>
		<DialogContent class="sm:max-w-md">
			<DialogHeader>
				<DialogTitle>Create New Notification</DialogTitle>
				<DialogDescription>
					Send a notification to users or schedule it for later.
				</DialogDescription>
			</DialogHeader>
			<form
				onsubmit={(e) => {
					e.preventDefault();
					createNotification();
				}}
				class="space-y-4"
			>
				<div class="space-y-2">
					<Label for="notificationTitle">Title</Label>
					<Input
						id="notificationTitle"
						bind:value={newNotification.title}
						placeholder="Notification title"
						required
					/>
				</div>
				<div class="space-y-2">
					<Label for="notificationMessage">Message</Label>
					<Input
						id="notificationMessage"
						bind:value={newNotification.message}
						placeholder="Notification message"
						required
					/>
				</div>
				<div class="space-y-2">
					<Label for="notificationType">Type</Label>
					<Select type="single" bind:value={newNotification.type}>
						<SelectTrigger>
							{newNotification.type || 'Select type'}
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="email">Email</SelectItem>
							<SelectItem value="sms">SMS</SelectItem>
							<SelectItem value="push">Push Notification</SelectItem>
							<SelectItem value="in-app">In-App</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div class="space-y-2">
					<Label for="notificationRecipients">Recipients</Label>
					<Select bind:value={newNotification.recipients}>
						<SelectTrigger>
							{newNotification.recipients || 'Select recipients'}
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all_users">All Users</SelectItem>
							<SelectItem value="premium_users">Premium Users</SelectItem>
							<SelectItem value="admin_users">Admin Users</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div class="space-y-2">
					<Label for="notificationScheduledFor">Schedule For (Optional)</Label>
					<Input
						id="notificationScheduledFor"
						type="datetime-local"
						bind:value={newNotification.scheduledFor}
					/>
				</div>
				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onclick={() => (showCreateNotificationDialog = false)}
					>
						Cancel
					</Button>
					<Button type="submit">Create Notification</Button>
				</DialogFooter>
			</form>
		</DialogContent>
	</Dialog>

	<!-- Create Template Dialog -->
	<Dialog bind:open={showCreateTemplateDialog}>
		<DialogContent class="sm:max-w-md">
			<DialogHeader>
				<DialogTitle>Create Email Template</DialogTitle>
				<DialogDescription>Create a reusable email template for notifications.</DialogDescription>
			</DialogHeader>
			<form
				onsubmit={(e) => {
					e.preventDefault();
					createTemplate();
				}}
				class="space-y-4"
			>
				<div class="space-y-2">
					<Label for="templateName">Template Name</Label>
					<Input
						id="templateName"
						bind:value={newTemplate.name}
						placeholder="e.g., Welcome Email"
						required
					/>
				</div>
				<div class="space-y-2">
					<Label for="templateSubject">Subject</Label>
					<Input
						id="templateSubject"
						bind:value={newTemplate.subject}
						placeholder="Email subject line"
						required
					/>
				</div>
				<div class="space-y-2">
					<Label for="templateBody">Body</Label>
					<textarea
						id="templateBody"
						bind:value={newTemplate.body}
						rows="6"
						class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
						placeholder="Enter template body..."
					></textarea>
				</div>
				<div class="space-y-2">
					<Label for="templateCategory">Category</Label>
					<Select type="single" bind:value={newTemplate.category}>
						<SelectTrigger>
							{newTemplate.category || 'Select category'}
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="general">General</SelectItem>
							<SelectItem value="welcome">Welcome</SelectItem>
							<SelectItem value="password-reset">Password Reset</SelectItem>
							<SelectItem value="notification">Notification</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onclick={() => (showCreateTemplateDialog = false)}
					>
						Cancel
					</Button>
					<Button type="submit">Create Template</Button>
				</DialogFooter>
			</form>
		</DialogContent>
	</Dialog>
</div>
