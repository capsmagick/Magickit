<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
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
		Search,
		Filter,
		MessageCircle,
		Star,
		TrendingUp,
		TrendingDown,
		BarChart3,
		Eye,
		MessageSquare,
		Trash2,
		Loader2,
		User,
		Calendar,
		ThumbsUp,
		ThumbsDown,
		AlertCircle,
		CheckCircle
	} from '@lucide/svelte';

	let hasCheckedAuth = $state(false);
	let showResponseDialog = $state(false);
	let selectedFeedback: any = $state(null);
	let searchTerm = $state('');
	let statusFilter = $state('all');
	let ratingFilter = $state('all');
	let categoryFilter = $state('all');
	let isLoading = $state(false);

	const session = authClient.useSession();

	// Mock data for demonstration
	let feedback = $state([
		{
			id: 'FB-001',
			title: 'Great user interface improvements',
			message: 'The new admin interface is much more intuitive and user-friendly. The navigation is clearer and the overall design feels modern. Really appreciate the dark mode option!',
			rating: 5,
			category: 'ui-ux',
			user: {
				name: 'Sarah Johnson',
				email: 'sarah@example.com',
				avatar: ''
			},
			createdAt: new Date('2024-01-20T12:00:00'),
			status: 'reviewed',
			response: {
				message: 'Thank you for the positive feedback! We\'re glad you\'re enjoying the new interface.',
				respondedBy: 'admin@example.com',
				respondedAt: new Date('2024-01-20T15:30:00')
			},
			tags: ['ui', 'design', 'navigation']
		},
		{
			id: 'FB-002',
			title: 'Could use more reporting features',
			message: 'The system works well overall, but it would be great to have more detailed reporting capabilities. Specifically, I\'d love to see analytics on user engagement and custom report builders.',
			rating: 4,
			category: 'features',
			user: {
				name: 'Mike Chen',
				email: 'mike@example.com',
				avatar: ''
			},
			createdAt: new Date('2024-01-19T16:00:00'),
			status: 'pending',
			response: null,
			tags: ['reporting', 'analytics', 'features']
		},
		{
			id: 'FB-003',
			title: 'Performance issues on mobile',
			message: 'The app is quite slow on mobile devices, especially when loading large datasets. It would be great if this could be optimized for better mobile performance.',
			rating: 2,
			category: 'performance',
			user: {
				name: 'Lisa Rodriguez',
				email: 'lisa@example.com',
				avatar: ''
			},
			createdAt: new Date('2024-01-18T10:30:00'),
			status: 'in_progress',
			response: {
				message: 'We\'re aware of the mobile performance issues and are working on optimizations. Expect improvements in the next release.',
				respondedBy: 'admin@example.com',
				respondedAt: new Date('2024-01-18T14:00:00')
			},
			tags: ['mobile', 'performance', 'optimization']
		},
		{
			id: 'FB-004',
			title: 'Excellent customer support',
			message: 'Had an issue with my account and the support team resolved it quickly and professionally. Very impressed with the level of service.',
			rating: 5,
			category: 'support',
			user: {
				name: 'David Wilson',
				email: 'david@example.com',
				avatar: ''
			},
			createdAt: new Date('2024-01-17T14:20:00'),
			status: 'reviewed',
			response: {
				message: 'Thank you for the kind words! We\'re always here to help.',
				respondedBy: 'admin@example.com',
				respondedAt: new Date('2024-01-17T16:00:00')
			},
			tags: ['support', 'service']
		},
		{
			id: 'FB-005',
			title: 'Login process is confusing',
			message: 'The login process has too many steps and the password requirements are not clear. It took me several attempts to create an account.',
			rating: 2,
			category: 'authentication',
			user: {
				name: 'Emma Thompson',
				email: 'emma@example.com',
				avatar: ''
			},
			createdAt: new Date('2024-01-16T09:15:00'),
			status: 'pending',
			response: null,
			tags: ['login', 'authentication', 'ux']
		}
	]);

	// Form data
	let newResponse = $state({
		message: ''
	});

	// Check authentication
	$effect(() => {
		if (!hasCheckedAuth && $session.data) {
			hasCheckedAuth = true;
			if ($session.data.user.role !== 'admin') {
				goto('/login?returnTo=/admin/support/feedback');
				return;
			}
		}
	});

	// Filter feedback based on search and filters
	const filteredFeedback = $derived.by(() => {
		return feedback.filter(item => {
			const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
				item.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
				item.user.name.toLowerCase().includes(searchTerm.toLowerCase());
			
			const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
			const matchesRating = ratingFilter === 'all' || item.rating.toString() === ratingFilter;
			const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
			
			return matchesSearch && matchesStatus && matchesRating && matchesCategory;
		});
	});

	// Get unique categories
	const categories = $derived.by(() => {
		const cats = [...new Set(feedback.map(item => item.category))];
		return cats.sort();
	});

	// Calculate analytics
	const analytics = $derived.by(() => {
		const totalFeedback = feedback.length;
		const avgRating = totalFeedback > 0 
			? (feedback.reduce((sum, item) => sum + item.rating, 0) / totalFeedback).toFixed(1)
			: '0';
		const positiveCount = feedback.filter(item => item.rating >= 4).length;
		const negativeCount = feedback.filter(item => item.rating <= 2).length;
		const pendingCount = feedback.filter(item => item.status === 'pending').length;
		const responseRate = totalFeedback > 0 
			? ((feedback.filter(item => item.response).length / totalFeedback) * 100).toFixed(1)
			: '0';
		
		return {
			totalFeedback,
			avgRating,
			positiveCount,
			negativeCount,
			pendingCount,
			responseRate
		};
	});

	function addResponse() {
		if (!newResponse.message || !selectedFeedback) {
			return;
		}

		const response = {
			message: newResponse.message,
			respondedBy: $session.data?.user?.email || 'admin@example.com',
			respondedAt: new Date()
		};

		selectedFeedback.response = response;
		selectedFeedback.status = 'reviewed';

		// Update the feedback in the main array
		feedback = feedback.map((item) =>
			item.id === selectedFeedback.id ? selectedFeedback : item
		);

		newResponse.message = '';
		showResponseDialog = false;
	}

	function updateFeedbackStatus(feedbackId: string, status: string) {
		feedback = feedback.map((item) =>
			item.id === feedbackId ? { ...item, status } : item
		);
	}

	function deleteFeedback(feedbackId: string) {
		if (confirm('Are you sure you want to delete this feedback?')) {
			feedback = feedback.filter((item) => item.id !== feedbackId);
		}
	}

	function openResponseDialog(item: any) {
		selectedFeedback = item;
		newResponse.message = item.response?.message || '';
		showResponseDialog = true;
	}

	function getStatusBadge(status: string) {
		switch (status) {
			case 'pending':
				return { variant: 'secondary' as const, text: 'Pending', icon: AlertCircle };
			case 'in_progress':
				return { variant: 'default' as const, text: 'In Progress', icon: MessageCircle };
			case 'reviewed':
				return { variant: 'outline' as const, text: 'Reviewed', icon: CheckCircle };
			default:
				return { variant: 'outline' as const, text: status, icon: AlertCircle };
		}
	}

	function getCategoryBadge(category: string) {
		const colors: Record<string, string> = {
			'ui-ux': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
			'features': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
			'performance': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
			'support': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
			'authentication': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
			'general': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
		};
		
		return colors[category] || colors['general'];
	}

	function getRatingStars(rating: number) {
		return Array.from({ length: 5 }, (_, i) => i < rating);
	}

	function getRatingColor(rating: number) {
		if (rating >= 4) return 'text-green-600';
		if (rating === 3) return 'text-yellow-600';
		return 'text-red-600';
	}

	function resetFilters() {
		searchTerm = '';
		statusFilter = 'all';
		ratingFilter = 'all';
		categoryFilter = 'all';
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="space-y-2">
		<h1 class="text-2xl font-bold">User Feedback</h1>
		<p class="text-muted-foreground">Review and manage user feedback and ratings</p>
	</div>

	<!-- Analytics Cards -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
		<Card.Root>
			<Card.Content class="p-4">
				<div class="flex items-center justify-between">
					<div class="space-y-1">
						<p class="text-sm text-muted-foreground">Total Feedback</p>
						<p class="text-2xl font-bold">{analytics.totalFeedback}</p>
					</div>
					<MessageCircle class="h-8 w-8 text-primary" />
				</div>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Content class="p-4">
				<div class="flex items-center justify-between">
					<div class="space-y-1">
						<p class="text-sm text-muted-foreground">Avg. Rating</p>
						<p class="text-2xl font-bold">{analytics.avgRating}/5</p>
					</div>
					<Star class="h-8 w-8 text-yellow-600" />
				</div>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Content class="p-4">
				<div class="flex items-center justify-between">
					<div class="space-y-1">
						<p class="text-sm text-muted-foreground">Positive</p>
						<p class="text-2xl font-bold">{analytics.positiveCount}</p>
					</div>
					<TrendingUp class="h-8 w-8 text-green-600" />
				</div>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Content class="p-4">
				<div class="flex items-center justify-between">
					<div class="space-y-1">
						<p class="text-sm text-muted-foreground">Negative</p>
						<p class="text-2xl font-bold">{analytics.negativeCount}</p>
					</div>
					<TrendingDown class="h-8 w-8 text-red-600" />
				</div>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Content class="p-4">
				<div class="flex items-center justify-between">
					<div class="space-y-1">
						<p class="text-sm text-muted-foreground">Pending</p>
						<p class="text-2xl font-bold">{analytics.pendingCount}</p>
					</div>
					<AlertCircle class="h-8 w-8 text-orange-600" />
				</div>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Content class="p-4">
				<div class="flex items-center justify-between">
					<div class="space-y-1">
						<p class="text-sm text-muted-foreground">Response Rate</p>
						<p class="text-2xl font-bold">{analytics.responseRate}%</p>
					</div>
					<BarChart3 class="h-8 w-8 text-blue-600" />
				</div>
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
							placeholder="Search feedback..." 
							class="pl-8 transition-colors duration-200" 
							bind:value={searchTerm} 
						/>
					</div>
				</div>
				<div class="flex gap-2">
					<Select.Root bind:value={statusFilter}>
						<Select.Trigger class="w-32">
							<Select.Value placeholder="Status" />
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="all">All Status</Select.Item>
							<Select.Item value="pending">Pending</Select.Item>
							<Select.Item value="in_progress">In Progress</Select.Item>
							<Select.Item value="reviewed">Reviewed</Select.Item>
						</Select.Content>
					</Select.Root>
					<Select.Root bind:value={ratingFilter}>
						<Select.Trigger class="w-32">
							<Select.Value placeholder="Rating" />
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="all">All Ratings</Select.Item>
							<Select.Item value="5">5 Stars</Select.Item>
							<Select.Item value="4">4 Stars</Select.Item>
							<Select.Item value="3">3 Stars</Select.Item>
							<Select.Item value="2">2 Stars</Select.Item>
							<Select.Item value="1">1 Star</Select.Item>
						</Select.Content>
					</Select.Root>
					<Select.Root bind:value={categoryFilter}>
						<Select.Trigger class="w-32">
							<Select.Value placeholder="Category" />
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="all">All Categories</Select.Item>
							{#each categories as category}
								<Select.Item value={category}>{category}</Select.Item>
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

	<!-- Feedback Table -->
	<Card.Root>
		<Card.Content class="p-0">
			{#if isLoading}
				<div class="flex justify-center py-12">
					<Loader2 class="h-8 w-8 animate-spin text-primary" />
				</div>
			{:else if filteredFeedback.length === 0}
				<div class="text-center py-12 space-y-4">
					<MessageCircle class="h-12 w-12 mx-auto text-muted-foreground" />
					<div class="space-y-2">
						<h3 class="text-lg font-semibold">No feedback found</h3>
						<p class="text-muted-foreground">
							{searchTerm || statusFilter !== 'all' || ratingFilter !== 'all' || categoryFilter !== 'all'
								? 'Try adjusting your search or filters.' 
								: 'No user feedback has been submitted yet.'}
						</p>
					</div>
				</div>
			{:else}
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Feedback</Table.Head>
							<Table.Head>User</Table.Head>
							<Table.Head>Rating</Table.Head>
							<Table.Head>Category</Table.Head>
							<Table.Head>Status</Table.Head>
							<Table.Head>Date</Table.Head>
							<Table.Head class="text-right">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each filteredFeedback as item}
							<Table.Row class="transition-colors duration-200 hover:bg-muted/50">
								<Table.Cell>
									<div class="space-y-2 max-w-md">
										<p class="font-medium">{item.title}</p>
										<p class="text-sm text-muted-foreground line-clamp-2">{item.message}</p>
										{#if item.response}
											<div class="bg-muted/50 rounded p-2 text-sm">
												<p class="font-medium text-xs text-muted-foreground mb-1">Response:</p>
												<p class="line-clamp-2">{item.response.message}</p>
											</div>
										{/if}
									</div>
								</Table.Cell>
								<Table.Cell>
									<div class="flex items-center gap-2">
										<div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
											<User class="h-4 w-4 text-primary" />
										</div>
										<div class="space-y-1">
											<p class="font-medium text-sm">{item.user.name}</p>
											<p class="text-sm text-muted-foreground">{item.user.email}</p>
										</div>
									</div>
								</Table.Cell>
								<Table.Cell>
									<div class="flex items-center gap-2">
										<div class="flex items-center">
											{#each getRatingStars(item.rating) as isStar}
												<Star
													class="h-4 w-4 {isStar
														? 'fill-current text-yellow-500'
														: 'text-gray-300'}"
												/>
											{/each}
										</div>
										<span class="text-sm font-medium {getRatingColor(item.rating)}">
											{item.rating}/5
										</span>
									</div>
								</Table.Cell>
								<Table.Cell>
									<Badge 
										class={getCategoryBadge(item.category)}
										variant="outline"
									>
										{item.category}
									</Badge>
								</Table.Cell>
								<Table.Cell>
									{@const statusInfo = getStatusBadge(item.status)}
									<Badge variant={statusInfo.variant} class="flex items-center gap-1 w-fit">
										<statusInfo.icon class="h-3 w-3" />
										{statusInfo.text}
									</Badge>
								</Table.Cell>
								<Table.Cell class="text-sm text-muted-foreground">
									<div class="flex items-center gap-1">
										<Calendar class="h-4 w-4" />
										{item.createdAt.toLocaleDateString()}
									</div>
								</Table.Cell>
								<Table.Cell class="text-right">
									<div class="flex items-center justify-end gap-2">
										<Button 
											variant="ghost" 
											size="icon" 
											onclick={() => openResponseDialog(item)}
											aria-label="Respond to feedback"
											class="transition-colors duration-200"
										>
											<MessageSquare class="h-4 w-4" />
										</Button>
										<Select.Root
											bind:value={item.status}
											onValueChange={(value: string) => value && updateFeedbackStatus(item.id, value)}
										>
											<Select.Trigger class="w-32">
												<Select.Value />
											</Select.Trigger>
											<Select.Content>
												<Select.Item value="pending">Pending</Select.Item>
												<Select.Item value="in_progress">In Progress</Select.Item>
												<Select.Item value="reviewed">Reviewed</Select.Item>
											</Select.Content>
										</Select.Root>
										<Button 
											variant="ghost" 
											size="icon" 
											onclick={() => deleteFeedback(item.id)}
											aria-label="Delete feedback"
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

<!-- Response Dialog -->
<Dialog bind:open={showResponseDialog}>
	<DialogContent class="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
		<DialogHeader>
			<DialogTitle>
				{selectedFeedback?.response ? 'Update Response' : 'Respond to Feedback'} - {selectedFeedback?.id || 'Unknown'}
			</DialogTitle>
			<DialogDescription>
				{selectedFeedback?.response ? 'Update your response to this feedback.' : 'Add a response to this user feedback.'}
			</DialogDescription>
		</DialogHeader>

		{#if selectedFeedback}
			<div class="space-y-6">
				<!-- Feedback Details -->
				<div class="rounded-lg border bg-muted/50 p-4">
					<div class="flex items-start justify-between mb-3">
						<h4 class="font-medium">{selectedFeedback.title}</h4>
						<div class="flex items-center gap-2">
							<div class="flex items-center">
								{#each getRatingStars(selectedFeedback.rating) as isStar}
									<Star
										class="h-4 w-4 {isStar
											? 'fill-current text-yellow-500'
											: 'text-gray-300'}"
									/>
								{/each}
							</div>
							<span class="text-sm font-medium {getRatingColor(selectedFeedback.rating)}">
								{selectedFeedback.rating}/5
							</span>
						</div>
					</div>
					<p class="text-sm text-muted-foreground mb-3">{selectedFeedback.message}</p>
					<div class="flex items-center gap-4 text-xs text-muted-foreground">
						<span>From: {selectedFeedback.user.name} ({selectedFeedback.user.email})</span>
						<span>Date: {selectedFeedback.createdAt.toLocaleDateString()}</span>
						<Badge 
							class={getCategoryBadge(selectedFeedback.category)}
							variant="outline"
						>
							{selectedFeedback.category}
						</Badge>
					</div>
				</div>

				<!-- Previous Response -->
				{#if selectedFeedback.response}
					<div>
						<h4 class="mb-3 font-medium">Current Response</h4>
						<div class="rounded-lg border p-3 bg-background">
							<div class="mb-2 flex items-center justify-between">
								<span class="text-sm font-medium">{selectedFeedback.response.respondedBy}</span>
								<span class="text-xs text-muted-foreground">
									{selectedFeedback.response.respondedAt.toLocaleString()}
								</span>
							</div>
							<p class="text-sm">{selectedFeedback.response.message}</p>
						</div>
					</div>
				{/if}

				<!-- Response Form -->
				<form
					onsubmit={(e) => {
						e.preventDefault();
						addResponse();
					}}
					class="space-y-4"
				>
					<div class="space-y-2">
						<Label for="responseMessage">
							{selectedFeedback.response ? 'Update Response' : 'Your Response'} *
						</Label>
						<Textarea
							id="responseMessage"
							bind:value={newResponse.message}
							placeholder="Type your response here..."
							rows={4}
							required
							class="transition-colors duration-200 resize-none"
						/>
					</div>
					<DialogFooter>
						<Button type="button" variant="outline" onclick={() => (showResponseDialog = false)}>
							Cancel
						</Button>
						<Button type="submit" class="transition-colors duration-200">
							<MessageSquare class="mr-2 h-4 w-4" />
							{selectedFeedback.response ? 'Update Response' : 'Send Response'}
						</Button>
					</DialogFooter>
				</form>
			</div>
		{/if}
	</DialogContent>
</Dialog>