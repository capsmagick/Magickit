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
	import { authClient } from '$lib/auth/auth-client';
	import { goto } from '$app/navigation';
	import {
		Bell,
		Plus,
		Edit,
		Trash2,
		Search,
		Send,
		Calendar,
		Users,
		Eye,
		Loader2,
		AlertCircle,
		CheckCircle,
		Clock
	} from '@lucide/svelte';

	let hasCheckedAuth = $state(false);
	let showCreateDialog = $state(false);
	let showPreviewDialog = $state(false);
	let selectedNotification = $state(null);
	let searchTerm = $state('');
	let isLoading = $state(false);
	let isSending = $state(false);

	const session = authClient.useSession();

	// Mock data for user notifications with status tracking
	let notifications = $state([
		{
			id: '1',
			title: 'Welcome to the platform',
			message: 'Thank you for joining us! Get started by completing your profile and exploring our features.',
			type: 'info',
			recipients: ['all_users'],
			status: 'sent',
			priority: 'normal',
			sentAt: new Date('2024-01-20T09:00:00'),
			scheduledFor: null,
			readCount: 45,
			totalCount: 50,
			createdBy: 'admin@example.com',
			createdAt: new Date('2024-01-20T08:45:00')
		},
		{
			id: '2',
			title: 'Maintenance Notice',
			message: 'Scheduled maintenance on Sunday from 2-4 AM EST. Some features may be temporarily unavailable.',
			type: 'warning',
			recipients: ['premium_users'],
			status: 'scheduled',
			priority: 'high',
			sentAt: null,
			scheduledFor: new Date('2024-01-21T14:00:00'),
			readCount: 0,
			totalCount: 25,
			createdBy: 'admin@example.com',
			createdAt: new Date('2024-01-20T10:00:00')
		},
		{
			id: '3',
			title: 'New Feature Release',
			message: 'We\'ve just released exciting new features! Check out the dashboard to see what\'s new.',
			type: 'success',
			recipients: ['active_users'],
			status: 'draft',
			priority: 'normal',
			sentAt: null,
			scheduledFor: null,
			readCount: 0,
			totalCount: 0,
			createdBy: 'admin@example.com',
			createdAt: new Date('2024-01-20T11:30:00')
		}
	]);

	// Form data for new notification
	let newNotification = $state({
		title: '',
		message: '',
		type: 'info',
		recipients: 'all_users',
		priority: 'normal',
		scheduledFor: '',
		sendImmediately: true
	});

	// Reactive statement to check session and redirect if needed
	$effect(() => {
		if (!hasCheckedAuth && $session.data) {
			hasCheckedAuth = true;
			if ($session.data.user.role !== 'admin') {
				goto('/login?returnTo=/admin/notifications/user');
				return;
			}
		}
	});

	// Filtered notifications based on search
	const filteredNotifications = $derived(
		notifications.filter(notification =>
			notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
			notification.message.toLowerCase().includes(searchTerm.toLowerCase())
		)
	);

	function createNotification() {
		if (!newNotification.title || !newNotification.message) {
			return;
		}

		isSending = true;

		// Simulate API call
		setTimeout(() => {
			const notification = {
				id: Date.now().toString(),
				title: newNotification.title,
				message: newNotification.message,
				type: newNotification.type,
				recipients: [newNotification.recipients],
				priority: newNotification.priority,
				status: newNotification.sendImmediately ? 'sent' : 
					newNotification.scheduledFor ? 'scheduled' : 'draft',
				scheduledFor: newNotification.scheduledFor ? new Date(newNotification.scheduledFor) : null,
				sentAt: newNotification.sendImmediately ? new Date() : null,
				readCount: 0,
				totalCount: getRecipientCount(newNotification.recipients),
				createdBy: $session.data?.user?.email || 'admin@example.com',
				createdAt: new Date()
			};

			notifications = [notification, ...notifications];
			resetForm();
			showCreateDialog = false;
			isSending = false;
		}, 1000);
	}

	function resetForm() {
		newNotification = {
			title: '',
			message: '',
			type: 'info',
			recipients: 'all_users',
			priority: 'normal',
			scheduledFor: '',
			sendImmediately: true
		};
	}

	function deleteNotification(id: string) {
		notifications = notifications.filter(n => n.id !== id);
	}

	function duplicateNotification(notification: any) {
		const duplicate = {
			...notification,
			id: Date.now().toString(),
			title: `${notification.title} (Copy)`,
			status: 'draft',
			sentAt: null,
			scheduledFor: null,
			readCount: 0,
			createdAt: new Date()
		};
		notifications = [duplicate, ...notifications];
	}

	function previewNotification(notification: any) {
		selectedNotification = notification;
		showPreviewDialog = true;
	}

	function sendNotification(id: string) {
		notifications = notifications.map(n =>
			n.id === id ? { ...n, status: 'sent', sentAt: new Date() } : n
		);
	}

	function getRecipientCount(recipients: string): number {
		const counts: Record<string, number> = {
			'all_users': 150,
			'premium_users': 25,
			'active_users': 80,
			'admin_users': 5
		};
		return counts[recipients] || 0;
	}

	function getStatusBadge(status: string) {
		switch (status) {
			case 'sent':
				return { variant: 'default' as const, text: 'Sent', icon: CheckCircle };
			case 'scheduled':
				return { variant: 'secondary' as const, text: 'Scheduled', icon: Clock };
			case 'draft':
				return { variant: 'outline' as const, text: 'Draft', icon: Edit };
			default:
				return { variant: 'outline' as const, text: status, icon: AlertCircle };
		}
	}

	function getTypeBadge(type: string) {
		switch (type) {
			case 'info':
				return { variant: 'default' as const, text: 'Info' };
			case 'warning':
				return { variant: 'destructive' as const, text: 'Warning' };
			case 'success':
				return { variant: 'default' as const, text: 'Success' };
			case 'error':
				return { variant: 'destructive' as const, text: 'Error' };
			default:
				return { variant: 'secondary' as const, text: type };
		}
	}

	function getPriorityBadge(priority: string) {
		switch (priority) {
			case 'high':
				return { variant: 'destructive' as const, text: 'High' };
			case 'normal':
				return { variant: 'secondary' as const, text: 'Normal' };
			case 'low':
				return { variant: 'outline' as const, text: 'Low' };
			default:
				return { variant: 'secondary' as const, text: priority };
		}
	}

	function formatRecipients(recipients: string[]): string {
		return recipients.map(r => r.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())).join(', ');
	}


	const newNotificationTypeOptions = [
		{ value: 'info', label: 'Info' },
		{ value: 'warning', label: 'Warning' },
		{ value: 'success', label: 'Success' },
		{ value: 'error', label: 'Error' }
	];

	const selectedNewNotificationTypeLabel = $derived(
		newNotificationTypeOptions.find(option => option.value === newNotification.type)?.label ?? 'Select type'
	);

	const newNotificationRecipientsOptions = [
		{ value: 'all_users', label: `All Users (${getRecipientCount('all_users')})` },
		{ value: 'premium_users', label: `Premium Users (${getRecipientCount('premium_users')})` },
		{ value: 'active_users', label: `Active Users (${getRecipientCount('active_users')})` },
		{ value: 'admin_users', label: `Admin Users (${getRecipientCount('admin_users')})` }
	];

	const selectedNewNotificationRecipientsLabel = $derived(
		newNotificationRecipientsOptions.find(option => option.value === newNotification.recipients)?.label ?? 'Select recipients'
	);

	const newNotificationPriorityOptions = [
		{ value: 'all', label: 'All Priority' },
		{ value: 'low', label: 'Low' },
		{ value: 'high', label: 'High' },
		{ value: 'normal', label: 'Normal' }
	];

	const selectedNewNotificationPriorityLabel = $derived(
		newNotificationPriorityOptions.find(option => option.value === newNotification.priority)?.label ?? 'Select priority'
	);
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
		<div class="space-y-2">
			<h1 class="text-2xl font-bold">User Notifications</h1>
			<p class="text-muted-foreground">Send and manage notifications to users with status tracking</p>
		</div>
		<Button onclick={() => (showCreateDialog = true)} class="transition-colors duration-200">
			<Plus class="mr-2 h-4 w-4" />
			Create Notification
		</Button>
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
							placeholder="Search notifications..." 
							class="pl-8 transition-colors duration-200" 
							bind:value={searchTerm} 
						/>
					</div>
				</div>
				<div class="flex gap-2">
					<Button variant="outline" onclick={() => (searchTerm = '')} class="transition-colors duration-200">
						Reset
					</Button>
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Notifications Table -->
	<Card.Root>
		<Card.Content class="p-0">
			{#if isLoading}
				<div class="flex justify-center py-12">
					<Loader2 class="h-8 w-8 animate-spin text-primary" />
				</div>
			{:else if filteredNotifications.length === 0}
				<div class="text-center py-12 space-y-4">
					<Bell class="h-12 w-12 mx-auto text-muted-foreground" />
					<div class="space-y-2">
						<h3 class="text-lg font-semibold">No notifications found</h3>
						<p class="text-muted-foreground">
							{searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating your first notification.'}
						</p>
					</div>
					{#if !searchTerm}
						<Button onclick={() => (showCreateDialog = true)} class="transition-colors duration-200">
							<Plus class="mr-2 h-4 w-4" />
							Create Notification
						</Button>
					{/if}
				</div>
			{:else}
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Notification</Table.Head>
							<Table.Head>Recipients</Table.Head>
							<Table.Head>Status</Table.Head>
							<Table.Head>Priority</Table.Head>
							<Table.Head>Engagement</Table.Head>
							<Table.Head>Date</Table.Head>
							<Table.Head class="text-right">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each filteredNotifications as notification}
							{@const statusInfo = getStatusBadge(notification.status)}
							<Table.Row class="transition-colors duration-200 hover:bg-muted/50">
								<Table.Cell>
									<div class="space-y-1">
										<div class="flex items-center gap-2">
											<p class="font-medium text-sm">{notification.title}</p>
											<Badge variant={getTypeBadge(notification.type).variant} class="text-xs">
												{getTypeBadge(notification.type).text}
											</Badge>
										</div>
										<p class="text-sm text-muted-foreground line-clamp-2">
											{notification.message}
										</p>
									</div>
								</Table.Cell>
								<Table.Cell>
									<div class="space-y-1">
										<p class="text-sm font-medium">{formatRecipients(notification.recipients)}</p>
										<p class="text-xs text-muted-foreground">{notification.totalCount} users</p>
									</div>
								</Table.Cell>
								<Table.Cell>
									<div class="flex items-center gap-2">
										<statusInfo.icon class="h-3 w-3" />
										<Badge variant={statusInfo.variant} class="text-xs">
											{statusInfo.text}
										</Badge>
									</div>
								</Table.Cell>
								<Table.Cell>
									<Badge variant={getPriorityBadge(notification.priority).variant} class="text-xs">
										{getPriorityBadge(notification.priority).text}
									</Badge>
								</Table.Cell>
								<Table.Cell>
									{#if notification.status === 'sent'}
										<div class="space-y-1">
											<p class="text-sm font-medium">
												{notification.readCount}/{notification.totalCount}
											</p>
											<p class="text-xs text-muted-foreground">
												{Math.round((notification.readCount / notification.totalCount) * 100)}% read
											</p>
										</div>
									{:else}
										<span class="text-sm text-muted-foreground">-</span>
									{/if}
								</Table.Cell>
								<Table.Cell>
									<div class="space-y-1">
										{#if notification.sentAt}
											<p class="text-sm">Sent</p>
											<p class="text-xs text-muted-foreground">
												{notification.sentAt.toLocaleDateString()}
											</p>
										{:else if notification.scheduledFor}
											<p class="text-sm">Scheduled</p>
											<p class="text-xs text-muted-foreground">
												{notification.scheduledFor.toLocaleDateString()}
											</p>
										{:else}
											<p class="text-sm">Created</p>
											<p class="text-xs text-muted-foreground">
												{notification.createdAt.toLocaleDateString()}
											</p>
										{/if}
									</div>
								</Table.Cell>
								<Table.Cell class="text-right">
									<div class="flex items-center justify-end gap-2">
										<Button 
											variant="ghost" 
											size="icon" 
											onclick={() => previewNotification(notification)}
											aria-label="Preview notification"
											class="transition-colors duration-200"
										>
											<Eye class="h-4 w-4" />
										</Button>
										{#if notification.status === 'draft'}
											<Button 
												variant="ghost" 
												size="icon" 
												onclick={() => sendNotification(notification.id)}
												aria-label="Send notification"
												class="transition-colors duration-200"
											>
												<Send class="h-4 w-4" />
											</Button>
										{/if}
										<Button 
											variant="ghost" 
											size="icon" 
											onclick={() => duplicateNotification(notification)}
											aria-label="Duplicate notification"
											class="transition-colors duration-200"
										>
											<Edit class="h-4 w-4" />
										</Button>
										<Button 
											variant="ghost" 
											size="icon" 
											onclick={() => deleteNotification(notification.id)}
											aria-label="Delete notification"
											class="transition-colors duration-200 hover:text-destructive"
										>
											<Trash2 class="h-4 w-4" />
										</Button>
									</div>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			{/if}
		</Card.Content>
	</Card.Root>

	<!-- Create Notification Dialog -->
	<Dialog.Root bind:open={showCreateDialog}>
		<Dialog.Content class="sm:max-w-2xl">
			<Dialog.Header>
				<Dialog.Title>Create New Notification</Dialog.Title>
				<Dialog.Description>
					Send a notification to users or schedule it for later delivery.
				</Dialog.Description>
			</Dialog.Header>
			<form
				onsubmit={(e) => {
					e.preventDefault();
					createNotification();
				}}
				class="space-y-6"
			>
				<!-- Title and Type Row -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div class="space-y-2">
						<Label for="title">Title *</Label>
						<Input
							id="title"
							bind:value={newNotification.title}
							placeholder="Notification title"
							required
							class="transition-colors duration-200"
						/>
					</div>
					<div class="space-y-2">
						<Label for="type">Type</Label>
						<Select.Root type="single" bind:value={newNotification.type}>
				<Select.Trigger class="w-32">
					{selectedNewNotificationTypeLabel}
				</Select.Trigger>
				<Select.Content>
					{#each newNotificationTypeOptions as option}
						<Select.Item value={option.value}>{option.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
					</div>
				</div>

				<!-- Message -->
				<div class="space-y-2">
					<Label for="message">Message *</Label>
					<Textarea
						id="message"
						bind:value={newNotification.message}
						placeholder="Enter your notification message..."
						rows={4}
						required
						class="transition-colors duration-200 resize-none"
					/>
				</div>

				<!-- Recipients and Priority Row -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div class="space-y-2">
						<Label for="recipients">Recipients</Label>
						<Select.Root type="single" bind:value={newNotification.recipients}>
				<Select.Trigger class="w-32">
					{selectedNewNotificationRecipientsLabel}
				</Select.Trigger>
				<Select.Content>
					{#each newNotificationRecipientsOptions as option}
						<Select.Item value={option.value}>{option.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
					</div>
					<div class="space-y-2">
						<Label for="priority">Priority</Label>
						<Select.Root type="single" bind:value={newNotification.priority}>
				<Select.Trigger class="w-32">
					{selectedNewNotificationPriorityLabel}
				</Select.Trigger>
				<Select.Content>
					{#each newNotificationPriorityOptions as option}
						<Select.Item value={option.value}>{option.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
					</div>
				</div>

				<!-- Scheduling Options -->
				<div class="space-y-4">
					<div class="flex items-center space-x-2">
						<input
							type="radio"
							id="sendNow"
							bind:group={newNotification.sendImmediately}
							value={true}
							class="h-4 w-4"
						/>
						<Label for="sendNow" class="text-sm font-medium">Send immediately</Label>
					</div>
					<div class="flex items-center space-x-2">
						<input
							type="radio"
							id="schedule"
							bind:group={newNotification.sendImmediately}
							value={false}
							class="h-4 w-4"
						/>
						<Label for="schedule" class="text-sm font-medium">Schedule for later</Label>
					</div>
					{#if !newNotification.sendImmediately}
						<div class="ml-6 space-y-2">
							<Label for="scheduledFor">Schedule Date & Time</Label>
							<Input
								id="scheduledFor"
								type="datetime-local"
								bind:value={newNotification.scheduledFor}
								class="transition-colors duration-200"
							/>
						</div>
					{/if}
				</div>

				<!-- Preview Alert -->
				{#if newNotification.title && newNotification.message}
					<Alert.Root>
						<AlertCircle class="h-4 w-4" />
						<Alert.Title>Preview</Alert.Title>
						<Alert.Description>
							<strong>{newNotification.title}</strong><br />
							{newNotification.message}
						</Alert.Description>
					</Alert.Root>
				{/if}

				<Dialog.Footer>
					<Button
						type="button"
						variant="outline"
						onclick={() => {
							showCreateDialog = false;
							resetForm();
						}}
						disabled={isSending}
					>
						Cancel
					</Button>
					<Button type="submit" disabled={isSending} class="transition-colors duration-200">
						{#if isSending}
							<Loader2 class="mr-2 h-4 w-4 animate-spin" />
							Creating...
						{:else}
							<Send class="mr-2 h-4 w-4" />
							{newNotification.sendImmediately ? 'Send Now' : 'Schedule'}
						{/if}
					</Button>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Root>

	<!-- Preview Dialog -->
	<Dialog.Root bind:open={showPreviewDialog}>
		<Dialog.Content class="sm:max-w-md">
			<Dialog.Header>
				<Dialog.Title>Notification Preview</Dialog.Title>
			</Dialog.Header>
			{#if selectedNotification}
				<div class="space-y-4">
					<Alert.Root>
						<Bell class="h-4 w-4" />
						<Alert.Title>{selectedNotification.title}</Alert.Title>
						<Alert.Description>
							{selectedNotification.message}
						</Alert.Description>
					</Alert.Root>
					<div class="grid grid-cols-2 gap-4 text-sm">
						<div>
							<p class="font-medium">Type:</p>
							<Badge variant={getTypeBadge(selectedNotification.type).variant} class="text-xs">
								{getTypeBadge(selectedNotification.type).text}
							</Badge>
						</div>
						<div>
							<p class="font-medium">Priority:</p>
							<Badge variant={getPriorityBadge(selectedNotification.priority).variant} class="text-xs">
								{getPriorityBadge(selectedNotification.priority).text}
							</Badge>
						</div>
						<div>
							<p class="font-medium">Recipients:</p>
							<p class="text-muted-foreground">{formatRecipients(selectedNotification.recipients)}</p>
						</div>
						<div>
							<p class="font-medium">Status:</p>
							<Badge variant={getStatusBadge(selectedNotification.status).variant} class="text-xs">
								{getStatusBadge(selectedNotification.status).text}
							</Badge>
						</div>
					</div>
				</div>
			{/if}
			<Dialog.Footer>
				<Button onclick={() => (showPreviewDialog = false)}>Close</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
</div>