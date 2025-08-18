<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Select from "$lib/components/ui/select";
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle,
		DialogTrigger
	} from '$lib/components/ui/dialog/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { authClient } from '$lib/auth/auth-client';
	import { goto } from '$app/navigation';
	import {
		Plus,
		Search,
		Filter,
		MessageCircle,
		Clock,
		User,
		AlertCircle,
		CheckCircle,
		XCircle,
		Loader2,
		Trash2,
		Eye,
		Edit
	} from '@lucide/svelte';
	import type { SupportTicket } from '$lib/types/index.js';

	let hasCheckedAuth = $state(false);
	let showCreateDialog = $state(false);
	let showReplyDialog = $state(false);
	let selectedTicket: SupportTicket | null = $state(null);
	let searchTerm = $state('');
	let statusFilter = $state<string>('all');
	let priorityFilter = $state<string>('all');
	let isLoading = $state(false);

	const session = authClient.useSession();

	// Mock data for demonstration
	let supportTickets = $state<SupportTicket[]>([
		{
			id: 'TKT-001',
			title: 'Cannot access admin panel',
			description:
				"I'm getting a 403 error when trying to access the admin panel after the recent update.",
			status: 'open',
			priority: 'high',
			category: 'technical',
			user: {
				name: 'John Smith',
				email: 'john@example.com',
				avatar: ''
			},
			assignedTo: {
				name: 'Admin User',
				email: 'admin@example.com'
			},
			createdAt: new Date('2024-01-20T09:00:00'),
			updatedAt: new Date('2024-01-20T14:30:00'),
			replies: [
				{
					id: '1',
					user: 'admin@example.com',
					message:
						'Can you check if you have admin privileges? Also, please clear your browser cache.',
					timestamp: new Date('2024-01-20T10:00:00')
				}
			]
		},
		{
			id: 'TKT-002',
			title: 'Password reset not working',
			description:
				'The password reset email is not being sent to my inbox. I have checked spam folder.',
			status: 'in_progress',
			priority: 'medium',
			category: 'authentication',
			user: {
				name: 'Jane Doe',
				email: 'jane@example.com',
				avatar: ''
			},
			assignedTo: {
				name: 'Admin User',
				email: 'admin@example.com'
			},
			createdAt: new Date('2024-01-19T15:00:00'),
			updatedAt: new Date('2024-01-20T11:00:00'),
			replies: []
		},
		{
			id: 'TKT-003',
			title: 'Feature request: Dark mode',
			description:
				'Would love to see a dark mode option in the user interface for better usability.',
			status: 'resolved',
			priority: 'low',
			category: 'feature-request',
			user: {
				name: 'Mike Johnson',
				email: 'mike@example.com',
				avatar: ''
			},
			assignedTo: {
				name: 'Admin User',
				email: 'admin@example.com'
			},
			createdAt: new Date('2024-01-18T10:00:00'),
			updatedAt: new Date('2024-01-19T16:00:00'),
			replies: [
				{
					id: '2',
					user: 'admin@example.com',
					message: 'Great suggestion! We have added dark mode support in the latest update.',
					timestamp: new Date('2024-01-19T16:00:00')
				}
			]
		}
	]);

	// Form data
	let newTicket = $state({
		title: '',
		description: '',
		category: 'technical',
		priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent'
	});

	let newReply = $state({
		message: ''
	});

	// Check authentication
	$effect(() => {
		if (!hasCheckedAuth && $session.data) {
			hasCheckedAuth = true;
			if ($session.data.user.role !== 'admin') {
				goto('/login?returnTo=/admin/support/tickets');
				return;
			}
		}
	});

	// Filter tickets based on search and filters
	const filteredTickets = $derived(() => {
		return supportTickets.filter((ticket) => {
			const matchesSearch =
				ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
				ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
				ticket.user.name.toLowerCase().includes(searchTerm.toLowerCase());

			const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
			const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;

			return matchesSearch && matchesStatus && matchesPriority;
		});
	});

	function createTicket() {
		if (!newTicket.title || !newTicket.description) {
			return;
		}

		const ticket = {
			id: `TKT-${String(supportTickets.length + 1).padStart(3, '0')}`,
			title: newTicket.title,
			description: newTicket.description,
			status: 'open',
			priority: newTicket.priority,
			category: newTicket.category,
			user: {
				name: $session.data?.user?.name || 'Admin User',
				email: $session.data?.user?.email || 'admin@example.com',
				avatar: $session.data?.user?.image || ''
			},
			assignedTo: {
				name: 'Admin User',
				email: 'admin@example.com'
			},
			createdAt: new Date(),
			updatedAt: new Date(),
			replies: []
		};

		supportTickets = [...supportTickets, ticket];
		newTicket = { title: '', description: '', category: 'technical', priority: 'medium' };
		showCreateDialog = false;
	}

	function addReply() {
		if (!newReply.message || !selectedTicket) {
			return;
		}

		const reply = {
			id: Date.now().toString(),
			user: $session.data?.user?.email || 'admin@example.com',
			message: newReply.message,
			timestamp: new Date()
		};

		selectedTicket.replies = [...selectedTicket.replies, reply];
		selectedTicket.updatedAt = new Date();
		selectedTicket.status = 'in_progress';

		// Update the ticket in the main array
		supportTickets = supportTickets.map((ticket) =>
			ticket.id === selectedTicket.id ? selectedTicket : ticket
		);

		newReply.message = '';
		showReplyDialog = false;
	}

	function updateTicketStatus(ticketId: string, status: string) {
		supportTickets = supportTickets.map((ticket) =>
			ticket.id === ticketId ? { ...ticket, status, updatedAt: new Date() } : ticket
		);
	}

	function deleteTicket(ticketId: string) {
		if (confirm('Are you sure you want to delete this ticket?')) {
			supportTickets = supportTickets.filter((ticket) => ticket.id !== ticketId);
		}
	}

	function openTicket(ticket: any) {
		selectedTicket = ticket;
		showReplyDialog = true;
	}

	function getStatusBadge(status: string) {
		switch (status) {
			case 'open':
				return { variant: 'destructive' as const, text: 'Open', icon: AlertCircle };
			case 'in_progress':
				return { variant: 'secondary' as const, text: 'In Progress', icon: Clock };
			case 'resolved':
				return { variant: 'default' as const, text: 'Resolved', icon: CheckCircle };
			case 'closed':
				return { variant: 'outline' as const, text: 'Closed', icon: XCircle };
			default:
				return { variant: 'outline' as const, text: status, icon: AlertCircle };
		}
	}

	function getPriorityBadge(priority: string) {
		switch (priority) {
			case 'urgent':
				return { variant: 'destructive' as const, text: 'Urgent' };
			case 'high':
				return { variant: 'destructive' as const, text: 'High' };
			case 'medium':
				return { variant: 'secondary' as const, text: 'Medium' };
			case 'low':
				return { variant: 'outline' as const, text: 'Low' };
			default:
				return { variant: 'outline' as const, text: priority };
		}
	}

	function resetFilters() {
		searchTerm = '';
		statusFilter = 'all';
		priorityFilter = 'all';
	}


	const newTicketCategoryOptions = [
		{ value: 'all', label: 'All Categories' },
		{ value: 'general', label: 'General' },
		{ value: 'technical', label: 'Technical' },
		{ value: 'billing', label: 'Billing' },
		{ value: 'authentication', label: 'Authentication' },
		{ value: 'feature-request', label: 'Feature Request' },
		{ value: 'bug-report', label: 'Bug Report' }
	];

	const selectedNewTicketCategoryLabel = $derived(
		newTicketCategoryOptions.find(option => option.value === newTicket.category)?.label ?? 'Select option'
	);

	const newTicketPriorityOptions = [
		{ value: 'all', label: 'All Priority' },
		{ value: 'low', label: 'Low' },
		{ value: 'medium', label: 'Medium' },
		{ value: 'high', label: 'High' },
		{ value: 'urgent', label: 'Urgent' }
	];

	const selectedNewTicketPriorityLabel = $derived(
		newTicketPriorityOptions.find(option => option.value === newTicket.priority)?.label ?? 'Select option'
	);

	const statusFilterOptions = [
		{ value: 'all', label: 'All Status' },
		{ value: 'open', label: 'Open' },
		{ value: 'closed', label: 'Closed' },
		{ value: 'resolved', label: 'Resolved' },
		{ value: 'in_progress', label: 'In Progress' }
	];

	const selectedStatusFilterLabel = $derived(
		statusFilterOptions.find(option => option.value === statusFilter)?.label ?? 'Status'
	);

	const priorityFilterOptions = [
		{ value: 'all', label: 'All Priority' },
		{ value: 'low', label: 'Low' },
		{ value: 'medium', label: 'Medium' },
		{ value: 'high', label: 'High' },
		{ value: 'urgent', label: 'Urgent' }
	];

	const selectedPriorityFilterLabel = $derived(
		priorityFilterOptions.find(option => option.value === priorityFilter)?.label ?? 'Priority'
	);
</script>

<div class="space-y-6">
	<!-- Header with Actions -->
	<div class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
		<div class="space-y-2">
			<h1 class="text-2xl font-bold">Support Tickets</h1>
			<p class="text-muted-foreground">Manage and respond to user support requests</p>
		</div>
		<Dialog bind:open={showCreateDialog}>
			<DialogTrigger>
				<Button class="transition-colors duration-200">
					<Plus class="mr-2 h-4 w-4" />
					Create Ticket
				</Button>
			</DialogTrigger>
			<DialogContent class="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Create Support Ticket</DialogTitle>
					<DialogDescription>Create a new support ticket for tracking purposes.</DialogDescription>
				</DialogHeader>
				<form
					onsubmit={(e) => {
						e.preventDefault();
						createTicket();
					}}
					class="space-y-4"
				>
					<div class="space-y-2">
						<Label for="ticketTitle">Title *</Label>
						<Input
							id="ticketTitle"
							bind:value={newTicket.title}
							placeholder="Brief description of the issue"
							required
							class="transition-colors duration-200"
						/>
					</div>
					<div class="space-y-2">
						<Label for="ticketDescription">Description *</Label>
						<Textarea
							id="ticketDescription"
							bind:value={newTicket.description}
							placeholder="Detailed description of the issue"
							rows={4}
							required
							class="resize-none transition-colors duration-200"
						/>
					</div>
					<div class="space-y-2">
						<Label for="ticketCategory">Category</Label>
						<Select.Root type="single" bind:value={newTicket.category}>
				<Select.Trigger class="w-32">
					{selectedNewTicketCategoryLabel}
				</Select.Trigger>
				<Select.Content>
					{#each newTicketCategoryOptions as option}
						<Select.Item value={option.value}>{option.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
					</div>
					<div class="space-y-2">
						<Label for="ticketPriority">Priority</Label>
						<Select.Root type="single" bind:value={newTicket.priority}>
				<Select.Trigger class="w-32">
					{selectedNewTicketPriorityLabel}
				</Select.Trigger>
				<Select.Content>
					{#each newTicketPriorityOptions as option}
						<Select.Item value={option.value}>{option.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
					</div>
					<DialogFooter>
						<Button type="button" variant="outline" onclick={() => (showCreateDialog = false)}>
							Cancel
						</Button>
						<Button type="submit" class="transition-colors duration-200">
							<Plus class="mr-2 h-4 w-4" />
							Create Ticket
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	</div>

	<!-- Search and Filters -->
	<Card.Root>
		<Card.Content class="p-4">
			<div class="flex flex-col gap-4 sm:flex-row">
				<div class="flex-1">
					<div class="relative">
						<Search class="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
						<Input
							type="search"
							placeholder="Search tickets..."
							class="pl-8 transition-colors duration-200"
							bind:value={searchTerm}
						/>
					</div>
				</div>
				<div class="flex gap-2">
					<Select.Root type="single" bind:value={statusFilter}>
				<Select.Trigger class="w-32">
					{selectedStatusFilterLabel}
				</Select.Trigger>
				<Select.Content>
					{#each statusFilterOptions as option}
						<Select.Item value={option.value}>{option.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
					<Select.Root type="single" bind:value={priorityFilter}>
				<Select.Trigger class="w-32">
					{selectedPriorityFilterLabel}
				</Select.Trigger>
				<Select.Content>
					{#each priorityFilterOptions as option}
						<Select.Item value={option.value}>{option.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
					<Button variant="outline" onclick={resetFilters} class="transition-colors duration-200">
						Reset
					</Button>
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Tickets Table -->
	<Card.Root>
		<Card.Content class="p-0">
			{#if isLoading}
				<div class="flex justify-center py-12">
					<Loader2 class="h-8 w-8 animate-spin text-primary" />
				</div>
			{:else if filteredTickets.length === 0}
				<div class="space-y-4 py-12 text-center">
					<MessageCircle class="mx-auto h-12 w-12 text-muted-foreground" />
					<div class="space-y-2">
						<h3 class="text-lg font-semibold">No tickets found</h3>
						<p class="text-muted-foreground">
							{searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
								? 'Try adjusting your search or filters.'
								: 'Get started by creating your first support ticket.'}
						</p>
					</div>
					{#if !searchTerm && statusFilter === 'all' && priorityFilter === 'all'}
						<Button
							onclick={() => (showCreateDialog = true)}
							class="transition-colors duration-200"
						>
							<Plus class="mr-2 h-4 w-4" />
							Create Ticket
						</Button>
					{/if}
				</div>
			{:else}
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Ticket</Table.Head>
							<Table.Head>User</Table.Head>
							<Table.Head>Status</Table.Head>
							<Table.Head>Priority</Table.Head>
							<Table.Head>Created</Table.Head>
							<Table.Head>Replies</Table.Head>
							<Table.Head class="text-right">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each filteredTickets() as ticket}
							<Table.Row class="transition-colors duration-200 hover:bg-muted/50">
								<Table.Cell>
									<div class="space-y-1">
										<p class="text-sm font-medium">{ticket.id}</p>
										<p class="font-medium">{ticket.title}</p>
										<p class="line-clamp-2 text-sm text-muted-foreground">{ticket.description}</p>
									</div>
								</Table.Cell>
								<Table.Cell>
									<div class="flex items-center gap-2">
										<div
											class="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10"
										>
											<User class="h-4 w-4 text-primary" />
										</div>
										<div class="space-y-1">
											<p class="text-sm font-medium">{ticket.user.name}</p>
											<p class="text-sm text-muted-foreground">{ticket.user.email}</p>
										</div>
									</div>
								</Table.Cell>
								<Table.Cell>
									{@const statusInfo = getStatusBadge(ticket.status)}
									<Badge variant={statusInfo.variant} class="flex w-fit items-center gap-1">
										<statusInfo.icon class="h-3 w-3" />
										{statusInfo.text}
									</Badge>
								</Table.Cell>
								<Table.Cell>
									{@const priorityInfo = getPriorityBadge(ticket.priority)}
									<Badge variant={priorityInfo.variant}>
										{priorityInfo.text}
									</Badge>
								</Table.Cell>
								<Table.Cell class="text-sm text-muted-foreground">
									{ticket.createdAt.toLocaleDateString()}
								</Table.Cell>
								<Table.Cell>
									<div class="flex items-center gap-1">
										<MessageCircle class="h-4 w-4 text-muted-foreground" />
										<span class="text-sm">{ticket.replies.length}</span>
									</div>
								</Table.Cell>
								<Table.Cell class="text-right">
									<div class="flex items-center justify-end gap-2">
										<Button
											variant="ghost"
											size="icon"
											onclick={() => openTicket(ticket)}
											aria-label="Reply to ticket"
											class="transition-colors duration-200"
										>
											<MessageCircle class="h-4 w-4" />
										</Button>
										<Select.Root
											value={ticket.status}
											onValueChange={(value: string) => value && updateTicketStatus(ticket.id, value)}
										>
											<Select.Trigger class="w-32">
												<Select.Value />
											</Select.Trigger>
											<Select.Content>
												<Select.Item value="open">Open</Select.Item>
												<Select.Item value="in_progress">In Progress</Select.Item>
												<Select.Item value="resolved">Resolved</Select.Item>
												<Select.Item value="closed">Closed</Select.Item>
											</Select.Content>
										</Select.Root>
										<Button
											variant="ghost"
											size="icon"
											onclick={() => deleteTicket(ticket.id)}
											aria-label="Delete ticket"
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
</div>

<!-- Reply Dialog -->
<Dialog bind:open={showReplyDialog}>
	<DialogContent class="max-h-[80vh] overflow-y-auto sm:max-w-2xl">
		<DialogHeader>
			<DialogTitle>Reply to Ticket - {selectedTicket?.id || 'Unknown'}</DialogTitle>
			<DialogDescription>Add a reply to this support ticket.</DialogDescription>
		</DialogHeader>

		{#if selectedTicket}
			{@const statusInfo = getStatusBadge(selectedTicket.status)}
			{@const priorityInfo = getPriorityBadge(selectedTicket.priority)}
			<div class="space-y-6">
				<!-- Ticket Details -->
				<div class="rounded-lg border bg-muted/50 p-4">
					<div class="mb-3 flex items-start justify-between">
						<h4 class="font-medium">{selectedTicket.title}</h4>
						<div class="flex items-center gap-2">
							<Badge variant={statusInfo.variant} class="flex items-center gap-1">
								<statusInfo.icon class="h-3 w-3" />
								{statusInfo.text}
							</Badge>
							<Badge variant={priorityInfo.variant}>
								{priorityInfo.text}
							</Badge>
						</div>
					</div>
					<p class="mb-3 text-sm text-muted-foreground">{selectedTicket.description}</p>
					<div class="flex items-center gap-4 text-xs text-muted-foreground">
						<span>From: {selectedTicket.user.name} ({selectedTicket.user.email})</span>
						<span>Created: {selectedTicket.createdAt.toLocaleDateString()}</span>
						<span>Category: {selectedTicket.category}</span>
					</div>
				</div>

				<!-- Previous Replies -->
				{#if selectedTicket.replies.length > 0}
					<div>
						<h4 class="mb-3 font-medium">Previous Replies ({selectedTicket.replies.length})</h4>
						<div class="max-h-60 space-y-3 overflow-y-auto">
							{#each selectedTicket.replies as reply}
								<div class="rounded-lg border p-3">
									<div class="mb-2 flex items-center justify-between">
										<span class="text-sm font-medium">{reply.user}</span>
										<span class="text-xs text-muted-foreground">
											{reply.timestamp.toLocaleString()}
										</span>
									</div>
									<p class="text-sm">{reply.message}</p>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Add Reply Form -->
				<form
					onsubmit={(e) => {
						e.preventDefault();
						addReply();
					}}
					class="space-y-4"
				>
					<div class="space-y-2">
						<Label for="replyMessage">Your Reply *</Label>
						<Textarea
							id="replyMessage"
							bind:value={newReply.message}
							placeholder="Type your reply here..."
							rows={4}
							required
							class="resize-none transition-colors duration-200"
						/>
					</div>
					<DialogFooter>
						<Button type="button" variant="outline" onclick={() => (showReplyDialog = false)}>
							Cancel
						</Button>
						<Button type="submit" class="transition-colors duration-200">
							<MessageCircle class="mr-2 h-4 w-4" />
							Send Reply
						</Button>
					</DialogFooter>
				</form>
			</div>
		{/if}
	</DialogContent>
</Dialog>
