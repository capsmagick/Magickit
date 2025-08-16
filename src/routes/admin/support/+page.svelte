<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { authClient } from '$lib/auth/auth-client';
	import { goto } from '$app/navigation';
	import {
		MessageCircle,
		BookOpen,
		MessageSquare,
		TrendingUp,
		Users,
		Clock,
		CheckCircle
	} from '@lucide/svelte';

	let hasCheckedAuth = $state(false);

	const session = authClient.useSession();

	// Mock data for overview
	const supportStats = {
		totalTickets: 15,
		openTickets: 8,
		pendingFeedback: 5,
		kbArticles: 23,
		avgResponseTime: '2.4 hours',
		satisfactionRate: '94%'
	};

	// Check authentication
	$effect(() => {
		if (!hasCheckedAuth && $session.data) {
			hasCheckedAuth = true;
			if ($session.data.user.role !== 'admin') {
				goto('/login?returnTo=/admin/support');
				return;
			}
		}
	});
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="space-y-2">
		<h1 class="text-2xl font-bold">Support Overview</h1>
		<p class="text-muted-foreground">
			Manage support tickets, knowledge base, and user feedback
		</p>
	</div>

	<!-- Stats Cards -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
		<Card.Root>
			<Card.Content class="p-4">
				<div class="flex items-center justify-between">
					<div class="space-y-1">
						<p class="text-sm text-muted-foreground">Total Tickets</p>
						<p class="text-2xl font-bold">{supportStats.totalTickets}</p>
					</div>
					<MessageCircle class="h-8 w-8 text-primary" />
				</div>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Content class="p-4">
				<div class="flex items-center justify-between">
					<div class="space-y-1">
						<p class="text-sm text-muted-foreground">Open Tickets</p>
						<p class="text-2xl font-bold">{supportStats.openTickets}</p>
					</div>
					<Clock class="h-8 w-8 text-orange-600" />
				</div>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Content class="p-4">
				<div class="flex items-center justify-between">
					<div class="space-y-1">
						<p class="text-sm text-muted-foreground">KB Articles</p>
						<p class="text-2xl font-bold">{supportStats.kbArticles}</p>
					</div>
					<BookOpen class="h-8 w-8 text-green-600" />
				</div>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Content class="p-4">
				<div class="flex items-center justify-between">
					<div class="space-y-1">
						<p class="text-sm text-muted-foreground">Pending Feedback</p>
						<p class="text-2xl font-bold">{supportStats.pendingFeedback}</p>
					</div>
					<MessageSquare class="h-8 w-8 text-blue-600" />
				</div>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Content class="p-4">
				<div class="flex items-center justify-between">
					<div class="space-y-1">
						<p class="text-sm text-muted-foreground">Avg Response Time</p>
						<p class="text-2xl font-bold">{supportStats.avgResponseTime}</p>
					</div>
					<TrendingUp class="h-8 w-8 text-purple-600" />
				</div>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Content class="p-4">
				<div class="flex items-center justify-between">
					<div class="space-y-1">
						<p class="text-sm text-muted-foreground">Satisfaction Rate</p>
						<p class="text-2xl font-bold">{supportStats.satisfactionRate}</p>
					</div>
					<CheckCircle class="h-8 w-8 text-green-600" />
				</div>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Quick Actions -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
		<Card.Root class="transition-shadow duration-200 hover:shadow-md">
			<Card.Header class="space-y-2">
				<div class="flex items-center gap-3">
					<div class="rounded-lg bg-primary/10 p-2">
						<MessageCircle class="h-6 w-6 text-primary" />
					</div>
					<Card.Title class="text-lg">Support Tickets</Card.Title>
				</div>
				<Card.Description>
					Manage and respond to user support requests
				</Card.Description>
			</Card.Header>
			<Card.Content>
				<p class="text-sm text-muted-foreground mb-4">
					Track, assign, and resolve customer support tickets with built-in escalation workflow.
				</p>
				<Button onclick={() => goto('/admin/support/tickets')} class="w-full transition-colors duration-200">
					Manage Tickets
				</Button>
			</Card.Content>
		</Card.Root>

		<Card.Root class="transition-shadow duration-200 hover:shadow-md">
			<Card.Header class="space-y-2">
				<div class="flex items-center gap-3">
					<div class="rounded-lg bg-green-100 dark:bg-green-900 p-2">
						<BookOpen class="h-6 w-6 text-green-600" />
					</div>
					<Card.Title class="text-lg">Knowledge Base</Card.Title>
				</div>
				<Card.Description>
					Create and organize help articles
				</Card.Description>
			</Card.Header>
			<Card.Content>
				<p class="text-sm text-muted-foreground mb-4">
					Build a comprehensive knowledge base with categorized articles and usage analytics.
				</p>
				<Button onclick={() => goto('/admin/support/knowledge-base')} variant="secondary" class="w-full transition-colors duration-200">
					Manage Articles
				</Button>
			</Card.Content>
		</Card.Root>

		<Card.Root class="transition-shadow duration-200 hover:shadow-md">
			<Card.Header class="space-y-2">
				<div class="flex items-center gap-3">
					<div class="rounded-lg bg-blue-100 dark:bg-blue-900 p-2">
						<MessageSquare class="h-6 w-6 text-blue-600" />
					</div>
					<Card.Title class="text-lg">User Feedback</Card.Title>
				</div>
				<Card.Description>
					Review and analyze user feedback
				</Card.Description>
			</Card.Header>
			<Card.Content>
				<p class="text-sm text-muted-foreground mb-4">
					Collect, categorize, and respond to user feedback with rating analytics.
				</p>
				<Button onclick={() => goto('/admin/support/feedback')} variant="outline" class="w-full transition-colors duration-200">
					View Feedback
				</Button>
			</Card.Content>
		</Card.Root>
	</div>
</div>
