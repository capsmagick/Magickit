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
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { authClient } from '$lib/auth/auth-client';
	import { goto } from '$app/navigation';
	import {
		LifeBuoy,
		Plus,
		Edit,
		Trash2,
		Search,
		RefreshCw,
		MessageSquare,
		BookOpen,
		MessageCircle,
		Eye,
		Settings,
		Clock,
		User,
		AlertCircle,
		CheckCircle,
		XCircle,
		Star,
		WrenchIcon,
		CreditCardIcon,
		LightbulbIcon,
		BugIcon,
		HelpCircleIcon
	} from '@lucide/svelte';

	let hasCheckedAuth = $state(false);
	let activeTab = $state('tickets');
	let showCreateTicketDialog = $state(false);
	let showCreateArticleDialog = $state(false);
	let showReplyDialog = $state(false);
	let selectedTicket: any = $state(null);

	const session = authClient.useSession();

	// Mock data for demonstration
	let supportTickets = $state([
		{
			id: '1',
			title: 'Cannot access admin panel',
			description: "I'm getting a 403 error when trying to access the admin panel.",
			status: 'open',
			priority: 'high',
			category: 'technical',
			user: 'john@example.com',
			assignedTo: 'admin@example.com',
			createdAt: new Date('2024-01-20T09:00:00'),
			updatedAt: new Date('2024-01-20T14:30:00'),
			replies: [
				{
					id: '1',
					user: 'admin@example.com',
					message: 'Can you check if you have admin privileges?',
					timestamp: new Date('2024-01-20T10:00:00')
				}
			]
		},
		{
			id: '2',
			title: 'Password reset not working',
			description: 'The password reset email is not being sent.',
			status: 'in_progress',
			priority: 'medium',
			category: 'authentication',
			user: 'jane@example.com',
			assignedTo: 'admin@example.com',
			createdAt: new Date('2024-01-19T15:00:00'),
			updatedAt: new Date('2024-01-20T11:00:00'),
			replies: []
		}
	]);

	let knowledgeBase = $state([
		{
			id: '1',
			title: 'How to reset your password',
			content: 'Follow these steps to reset your password...',
			category: 'authentication',
			author: 'admin@example.com',
			createdAt: new Date('2024-01-01'),
			updatedAt: new Date('2024-01-01'),
			views: 45,
			helpful: 12
		},
		{
			id: '2',
			title: 'Admin panel access guide',
			content: 'Learn how to access and use the admin panel...',
			category: 'administration',
			author: 'admin@example.com',
			createdAt: new Date('2024-01-05'),
			updatedAt: new Date('2024-01-15'),
			views: 23,
			helpful: 8
		}
	]);

	let feedback = $state([
		{
			id: '1',
			title: 'Great user interface',
			message: 'The new admin interface is much more intuitive and user-friendly.',
			rating: 5,
			user: 'user@example.com',
			createdAt: new Date('2024-01-20T12:00:00'),
			status: 'reviewed'
		},
		{
			id: '2',
			title: 'Could use more features',
			message: 'The system works well but could benefit from additional reporting features.',
			rating: 4,
			user: 'manager@example.com',
			createdAt: new Date('2024-01-19T16:00:00'),
			status: 'pending'
		}
	]);

	// Form data
	let newTicket = $state({
		title: '',
		description: '',
		category: 'technical',
		priority: 'medium'
	});

	let newArticle = $state({
		title: '',
		content: '',
		category: 'general'
	});

	let newReply = $state({
		message: ''
	});

	// Helper function to get icon component
	function getTypeIcon(type: string) {
		const iconMap: Record<string, any> = {
			technical: WrenchIcon,
			billing: CreditCardIcon,
			'feature-request': LightbulbIcon,
			'bug-report': BugIcon,
			general: HelpCircleIcon
		};
		return iconMap[type] || null;
	}

	// Reactive statement to check session and redirect if needed
	$effect(() => {
		if (!hasCheckedAuth && $session.data) {
			hasCheckedAuth = true;
			if ($session.data.user.role !== 'admin') {
				goto('/login?returnTo=/admin/support');
				return;
			}
		}
	});

	function createTicket() {
		if (!newTicket.title || !newTicket.description) {
			return;
		}

		const ticket = {
			id: Date.now().toString(),
			title: newTicket.title,
			description: newTicket.description,
			status: 'open',
			priority: newTicket.priority,
			category: newTicket.category,
			user: $session.data?.user?.email || 'admin',
			assignedTo: 'admin@example.com',
			createdAt: new Date(),
			updatedAt: new Date(),
			replies: []
		};

		supportTickets = [...supportTickets, ticket];
		newTicket = { title: '', description: '', category: 'technical', priority: 'medium' };
		showCreateTicketDialog = false;
	}

	function createArticle() {
		if (!newArticle.title || !newArticle.content) {
			return;
		}

		const article = {
			id: Date.now().toString(),
			title: newArticle.title,
			content: newArticle.content,
			category: newArticle.category,
			author: $session.data?.user?.email || 'admin',
			createdAt: new Date(),
			updatedAt: new Date(),
			views: 0,
			helpful: 0
		};

		knowledgeBase = [...knowledgeBase, article];
		newArticle = { title: '', content: '', category: 'general' };
		showCreateArticleDialog = false;
	}

	function addReply() {
		if (!newReply.message || !selectedTicket) {
			return;
		}

		const reply = {
			id: Date.now().toString(),
			user: $session.data?.user?.email || 'admin',
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
		supportTickets = supportTickets.filter((ticket) => ticket.id !== ticketId);
	}

	function deleteArticle(articleId: string) {
		knowledgeBase = knowledgeBase.filter((article) => article.id !== articleId);
	}

	function deleteFeedback(feedbackId: string) {
		feedback = feedback.filter((item) => item.id !== feedbackId);
	}

	function openTicket(ticket: any) {
		selectedTicket = ticket;
		showReplyDialog = true;
	}

	function getStatusBadge(status: string) {
		switch (status) {
			case 'open':
				return { variant: 'destructive', text: 'Open' };
			case 'in_progress':
				return { variant: 'secondary', text: 'In Progress' };
			case 'resolved':
				return { variant: 'default', text: 'Resolved' };
			case 'closed':
				return { variant: 'outline', text: 'Closed' };
			default:
				return { variant: 'outline', text: status };
		}
	}

	function getPriorityBadge(priority: string) {
		switch (priority) {
			case 'high':
				return { variant: 'destructive', text: 'High' };
			case 'medium':
				return { variant: 'secondary', text: 'Medium' };
			case 'low':
				return { variant: 'outline', text: 'Low' };
			default:
				return { variant: 'outline', text: priority };
		}
	}

	function getRatingStars(rating: number) {
		return Array.from({ length: 5 }, (_, i) => i < rating);
	}
</script>

<div class="container mx-auto space-y-6 p-6">
	<!-- Header -->
	<div class="mb-8">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-3xl font-bold text-gray-900 dark:text-white">Support</h1>
				<p class="mt-2 text-gray-600 dark:text-gray-400">
					Manage support tickets, knowledge base, and user feedback
				</p>
			</div>
			<div class="flex gap-2">
				<Button variant="outline" onclick={() => (showCreateTicketDialog = true)}>
					<Plus class="mr-2 h-4 w-4" />
					Create Ticket
				</Button>
				<Button variant="outline" onclick={() => (showCreateArticleDialog = true)}>
					<Plus class="mr-2 h-4 w-4" />
					Create Article
				</Button>
			</div>
		</div>
	</div>

	<!-- Main Content -->
	<Tabs bind:value={activeTab} class="space-y-6">
		<TabsList class="grid w-full grid-cols-3">
			<TabsTrigger value="tickets">Support Tickets</TabsTrigger>
			<TabsTrigger value="kb">Knowledge Base</TabsTrigger>
			<TabsTrigger value="feedback">Feedback</TabsTrigger>
		</TabsList>

		<!-- Support Tickets Tab -->
		<TabsContent value="tickets" class="space-y-6">
			<Card.Root>
				<Card.Header>
					<Card.Title class="text-xl">Support Tickets</Card.Title>
					<Card.Description>Manage and respond to user support requests</Card.Description>
				</Card.Header>
				<Card.Content>
					<div class="space-y-4">
						{#each supportTickets as ticket}
							<div class="flex items-center justify-between rounded-lg border p-4">
								<div class="flex items-center gap-3">
									<div class="rounded-lg bg-primary/10 p-2">
										{#if getTypeIcon(ticket.type)}
											{@render getTypeIcon(ticket.type)({ class: 'h-4 w-4 text-primary' })}
										{/if}
									</div>
									<div>
										<h4 class="font-medium">{ticket.title}</h4>
										<p class="text-sm text-muted-foreground">{ticket.description}</p>
										<div class="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
											<span>By: {ticket.user}</span>
											{#if ticket.status}
												<Badge variant={getStatusBadge(ticket.status).variant}
													>{getStatusBadge(ticket.status).text}</Badge
												>
											{/if}
											{#if ticket.priority}
												<Badge variant={getPriorityBadge(ticket.priority).variant}
													>{getPriorityBadge(ticket.priority).text}</Badge
												>
											{/if}
											<span>Category: {ticket.category}</span>
											<span>Created: {ticket.createdAt.toLocaleDateString()}</span>
											<span>Replies: {ticket.replies.length}</span>
										</div>
									</div>
								</div>
								<div class="flex items-center gap-2">
									<Button variant="ghost" size="sm" onclick={() => openTicket(ticket)}>
										<MessageCircle class="h-3 w-3" />
									</Button>
									<Select
										value={ticket.status}
										onValueChange={(value) => updateTicketStatus(ticket.id, value)}
									>
										<SelectTrigger class="w-32">
											{ticket.status || 'Select status'}
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="open">Open</SelectItem>
											<SelectItem value="in_progress">In Progress</SelectItem>
											<SelectItem value="resolved">Resolved</SelectItem>
											<SelectItem value="closed">Closed</SelectItem>
										</SelectContent>
									</Select>
									<Button variant="ghost" size="sm" onclick={() => deleteTicket(ticket.id)}>
										<Trash2 class="h-3 w-3" />
									</Button>
								</div>
							</div>
						{/each}
					</div>
				</Card.Content>
			</Card.Root>
		</TabsContent>

		<!-- Knowledge Base Tab -->
		<TabsContent value="kb" class="space-y-6">
			<Card.Root>
				<Card.Header>
					<Card.Title class="text-xl">Knowledge Base</Card.Title>
					<Card.Description>Manage help articles and documentation</Card.Description>
				</Card.Header>
				<Card.Content>
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						{#each knowledgeBase as article}
							<Card.Root class="transition-shadow hover:shadow-lg">
								<Card.Header>
									<div class="flex items-center justify-between">
										<Card.Title class="text-lg">{article.title}</Card.Title>
										<Badge variant="outline">{article.category}</Badge>
									</div>
									<Card.Description>By {article.author}</Card.Description>
								</Card.Header>
								<Card.Content>
									<div class="space-y-3">
										<p class="line-clamp-3 text-sm text-muted-foreground">
											{article.content}
										</p>
										<div class="flex items-center justify-between text-sm text-muted-foreground">
											<div class="flex items-center gap-4">
												<span>Views: {article.views}</span>
												<span>Helpful: {article.helpful}</span>
											</div>
											<div class="flex gap-1">
												<Button variant="ghost" size="sm">
													<Edit class="h-3 w-3" />
												</Button>
												<Button variant="ghost" size="sm" onclick={() => deleteArticle(article.id)}>
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

		<!-- Feedback Tab -->
		<TabsContent value="feedback" class="space-y-6">
			<Card.Root>
				<Card.Header>
					<Card.Title class="text-xl">User Feedback</Card.Title>
					<Card.Description>Review and manage user feedback and ratings</Card.Description>
				</Card.Header>
				<Card.Content>
					<div class="space-y-4">
						{#each feedback as item}
							<div class="flex items-center justify-between rounded-lg border p-4">
								<div class="flex items-center gap-3">
									<div class="rounded-lg bg-primary/10 p-2">
										<MessageCircle class="h-4 w-4 text-primary" />
									</div>
									<div>
										<h4 class="font-medium">{item.title}</h4>
										<p class="text-sm text-muted-foreground">{item.message}</p>
										<div class="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
											<span>By: {item.user}</span>
											<span>Created: {item.createdAt.toLocaleDateString()}</span>
											<div class="flex items-center gap-1">
												{#each getRatingStars(item.rating) as isStar}
													<Star
														class="h-3 w-3 {isStar
															? 'fill-current text-yellow-500'
															: 'text-gray-300'}"
													/>
												{/each}
												<span class="ml-1">({item.rating}/5)</span>
											</div>
											<Badge variant={item.status === 'pending' ? 'secondary' : 'default'}>
												{item.status}
											</Badge>
										</div>
									</div>
								</div>
								<div class="flex items-center gap-2">
									<Button variant="ghost" size="sm">
										<Eye class="h-3 w-3" />
									</Button>
									<Button variant="ghost" size="sm" onclick={() => deleteFeedback(item.id)}>
										<Trash2 class="h-3 w-3" />
									</Button>
								</div>
							</div>
						{/each}
					</div>
				</Card.Content>
			</Card.Root>
		</TabsContent>
	</Tabs>

	<!-- Create Ticket Dialog -->
	<Dialog bind:open={showCreateTicketDialog}>
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
					<Label for="ticketTitle">Title</Label>
					<Input
						id="ticketTitle"
						bind:value={newTicket.title}
						placeholder="Brief description of the issue"
						required
					/>
				</div>
				<div class="space-y-2">
					<Label for="ticketDescription">Description</Label>
					<Textarea
						id="ticketDescription"
						bind:value={newTicket.description}
						placeholder="Detailed description of the issue"
						required
					/>
				</div>
				<div class="space-y-2">
					<Label for="ticketCategory">Category</Label>
					<Select type="single" bind:value={newTicket.category}>
						<SelectTrigger>
							{newTicket.category || 'Select category'}
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="technical">Technical</SelectItem>
							<SelectItem value="billing">Billing</SelectItem>
							<SelectItem value="feature-request">Feature Request</SelectItem>
							<SelectItem value="bug-report">Bug Report</SelectItem>
							<SelectItem value="general">General</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div class="space-y-2">
					<Label for="ticketPriority">Priority</Label>
					<Select type="single" bind:value={newTicket.priority}>
						<SelectTrigger>
							{newTicket.priority || 'Select priority'}
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="low">Low</SelectItem>
							<SelectItem value="medium">Medium</SelectItem>
							<SelectItem value="high">High</SelectItem>
							<SelectItem value="urgent">Urgent</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<DialogFooter>
					<Button type="button" variant="outline" onclick={() => (showCreateTicketDialog = false)}>
						Cancel
					</Button>
					<Button type="submit">Create Ticket</Button>
				</DialogFooter>
			</form>
		</DialogContent>
	</Dialog>

	<!-- Create Article Dialog -->
	<Dialog bind:open={showCreateArticleDialog}>
		<DialogContent class="sm:max-w-md">
			<DialogHeader>
				<DialogTitle>Create Knowledge Base Article</DialogTitle>
				<DialogDescription>Create a new help article for the knowledge base.</DialogDescription>
			</DialogHeader>
			<form
				onsubmit={(e) => {
					e.preventDefault();
					createArticle();
				}}
				class="space-y-4"
			>
				<div class="space-y-2">
					<Label for="articleTitle">Title</Label>
					<Input
						id="articleTitle"
						bind:value={newArticle.title}
						placeholder="Article title"
						required
					/>
				</div>
				<div class="space-y-2">
					<Label for="articleContent">Content</Label>
					<Textarea
						id="articleContent"
						bind:value={newArticle.content}
						placeholder="Article content"
						class="min-h-[150px]"
						required
					/>
				</div>
				<div class="space-y-2">
					<Label for="articleCategory">Category</Label>
					<Select type="single" bind:value={newArticle.category}>
						<SelectTrigger>
							{newArticle.category || 'Select category'}
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="getting-started">Getting Started</SelectItem>
							<SelectItem value="troubleshooting">Troubleshooting</SelectItem>
							<SelectItem value="features">Features</SelectItem>
							<SelectItem value="api">API</SelectItem>
							<SelectItem value="faq">FAQ</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<DialogFooter>
					<Button type="button" variant="outline" onclick={() => (showCreateArticleDialog = false)}>
						Cancel
					</Button>
					<Button type="submit">Create Article</Button>
				</DialogFooter>
			</form>
		</DialogContent>
	</Dialog>

	<!-- Reply Dialog -->
	<Dialog bind:open={showReplyDialog}>
		<DialogContent class="sm:max-w-2xl">
			<DialogHeader>
				<DialogTitle>Reply to Ticket - {selectedTicket?.title || 'Unknown'}</DialogTitle>
				<DialogDescription>Add a reply to this support ticket.</DialogDescription>
			</DialogHeader>

			{#if selectedTicket}
				<div class="space-y-6">
					<!-- Ticket Details -->
					<div class="rounded-lg border bg-muted/50 p-4">
						<h4 class="mb-2 font-medium">Ticket Details</h4>
						<p class="mb-3 text-sm text-muted-foreground">{selectedTicket.description}</p>
						<div class="flex items-center gap-4 text-xs text-muted-foreground">
							{#if selectedTicket.status}
								<span>
									Status: <Badge
										variant={getStatusBadge(selectedTicket.status).variant}
										class="ml-1">{getStatusBadge(selectedTicket.status).text}</Badge
									>
								</span>
							{/if}
							{#if selectedTicket.priority}
								<span>
									Priority: <Badge
										variant={getPriorityBadge(selectedTicket.priority).variant}
										class="ml-1">{getPriorityBadge(selectedTicket.priority).text}</Badge
									>
								</span>
							{/if}
							<span>Created: {selectedTicket.createdAt.toLocaleDateString()}</span>
						</div>
					</div>

					<!-- Previous Replies -->
					{#if selectedTicket.replies.length > 0}
						<div>
							<h4 class="mb-3 font-medium">Previous Replies</h4>
							<div class="space-y-3">
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
							<Label for="replyMessage">Your Reply</Label>
							<Textarea
								id="replyMessage"
								bind:value={newReply.message}
								placeholder="Type your reply here..."
								class="min-h-[100px]"
								required
							/>
						</div>
						<DialogFooter>
							<Button type="button" variant="outline" onclick={() => (showReplyDialog = false)}>
								Cancel
							</Button>
							<Button type="submit">Send Reply</Button>
						</DialogFooter>
					</form>
				</div>
			{/if}
		</DialogContent>
	</Dialog>
</div>
