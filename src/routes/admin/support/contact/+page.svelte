<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Badge from '$lib/components/ui/badge/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { 
		Search, 
		Filter, 
		Mail, 
		MailOpen, 
		MessageSquare, 
		Clock,
		CheckCircle,
		X,
		Eye,
		Reply,
		Archive,
		Loader2
	} from '@lucide/svelte';
	import type { PageData } from './$types';

	interface ContactSubmission {
		_id: string;
		name: string;
		email: string;
		subject: string;
		message: string;
		status: 'new' | 'read' | 'replied' | 'closed';
		submittedAt: string;
		respondedAt?: string;
		respondedBy?: string;
		ipAddress: string;
	}

	let { data }: { data: PageData } = $props();
	
	let submissions = $state<ContactSubmission[]>(data.submissions);
	let isLoading = $state(false);
	let searchTerm = $state('');
	let selectedStatus = $state<string>('all');
	let selectedSubmission = $state<ContactSubmission | null>(null);
	let showDetailsDialog = $state(false);

	// Filtered submissions based on search and status
	let filteredSubmissions = $derived(() => {
		return submissions.filter(submission => {
			const matchesSearch = searchTerm === '' || 
				submission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				submission.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
				submission.subject.toLowerCase().includes(searchTerm.toLowerCase());
			
			const matchesStatus = selectedStatus === 'all' || submission.status === selectedStatus;
			
			return matchesSearch && matchesStatus;
		});
	});

	// Status counts for badges
	let statusCounts = $derived(() => {
		const counts = { new: 0, read: 0, replied: 0, closed: 0 };
		submissions.forEach(submission => {
			counts[submission.status]++;
		});
		return counts;
	});

	async function loadSubmissions() {
		try {
			isLoading = true;
			console.log('Loading contact submissions...');
			const response = await fetch('/api/admin/contact-submissions');
			console.log('Response status:', response.status);
			if (response.ok) {
				const newData = await response.json();
				console.log('Loaded submissions:', newData);
				submissions = newData;
			} else {
				console.error('Failed to load contact submissions, status:', response.status);
			}
		} catch (error) {
			console.error('Error loading contact submissions:', error);
		} finally {
			isLoading = false;
		}
	}

	async function updateSubmissionStatus(id: string, status: ContactSubmission['status']) {
		try {
			const response = await fetch(`/api/admin/contact-submissions/${id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ status })
			});

			if (response.ok) {
				// Update local state
				const index = submissions.findIndex(s => s._id === id);
				if (index !== -1) {
					submissions[index] = { ...submissions[index], status };
					// If we're updating the selected submission, update it too
					if (selectedSubmission && selectedSubmission._id === id) {
						selectedSubmission = { ...selectedSubmission, status };
					}
				}
			} else {
				console.error('Failed to update submission status');
			}
		} catch (error) {
			console.error('Error updating submission status:', error);
		}
	}

	function viewSubmission(submission: ContactSubmission) {
		selectedSubmission = submission;
		showDetailsDialog = true;
		
		// Mark as read if it's new
		if (submission.status === 'new') {
			updateSubmissionStatus(submission._id, 'read');
		}
	}

	function getStatusVariant(status: ContactSubmission['status']) {
		switch (status) {
			case 'new': return 'destructive';
			case 'read': return 'secondary';
			case 'replied': return 'default';
			case 'closed': return 'outline';
			default: return 'secondary';
		}
	}

	function getStatusIcon(status: ContactSubmission['status']) {
		switch (status) {
			case 'new': return Mail;
			case 'read': return MailOpen;
			case 'replied': return Reply;
			case 'closed': return Archive;
			default: return Mail;
		}
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleString();
	}

	function resetFilters() {
		searchTerm = '';
		selectedStatus = 'all';
	}
</script>

<svelte:head>
	<title>Contact Submissions | Admin</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
		<div class="space-y-2">
			<h1 class="text-2xl font-bold">Contact Submissions</h1>
			<p class="text-muted-foreground">Manage and respond to contact form submissions</p>
		</div>
		<div class="flex gap-2">
			<Button variant="outline" onclick={loadSubmissions} disabled={isLoading}>
				{#if isLoading}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
				{/if}
				Refresh
			</Button>
		</div>
	</div>

	<!-- Status Overview Cards -->
	<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
		<Card.Root>
			<Card.Content class="p-4">
				<div class="flex items-center justify-between">
					<div class="space-y-1">
						<p class="text-sm text-muted-foreground">New</p>
						<p class="text-2xl font-bold text-red-600">{statusCounts.new}</p>
					</div>
					<Mail class="h-8 w-8 text-red-600" />
				</div>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Content class="p-4">
				<div class="flex items-center justify-between">
					<div class="space-y-1">
						<p class="text-sm text-muted-foreground">Read</p>
						<p class="text-2xl font-bold text-blue-600">{statusCounts.read}</p>
					</div>
					<MailOpen class="h-8 w-8 text-blue-600" />
				</div>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Content class="p-4">
				<div class="flex items-center justify-between">
					<div class="space-y-1">
						<p class="text-sm text-muted-foreground">Replied</p>
						<p class="text-2xl font-bold text-green-600">{statusCounts.replied}</p>
					</div>
					<Reply class="h-8 w-8 text-green-600" />
				</div>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Content class="p-4">
				<div class="flex items-center justify-between">
					<div class="space-y-1">
						<p class="text-sm text-muted-foreground">Closed</p>
						<p class="text-2xl font-bold text-gray-600">{statusCounts.closed}</p>
					</div>
					<Archive class="h-8 w-8 text-gray-600" />
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
							placeholder="Search submissions..." 
							class="pl-8 transition-colors duration-200" 
							bind:value={searchTerm} 
						/>
					</div>
				</div>
				<div class="flex gap-2">
					<select 
						bind:value={selectedStatus}
						class="px-3 py-2 border border-input bg-background rounded-md text-sm transition-colors duration-200"
					>
						<option value="all">All Status</option>
						<option value="new">New</option>
						<option value="read">Read</option>
						<option value="replied">Replied</option>
						<option value="closed">Closed</option>
					</select>
					<Button variant="outline" onclick={resetFilters} class="transition-colors duration-200">
						Reset
					</Button>
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Submissions Table -->
	<Card.Root>
		<Card.Content class="p-0">
			{#if isLoading}
				<div class="flex justify-center py-12">
					<Loader2 class="h-8 w-8 animate-spin text-primary" />
				</div>
			{:else if filteredSubmissions.length === 0}
				<div class="text-center py-12 space-y-4">
					<MessageSquare class="h-12 w-12 mx-auto text-muted-foreground" />
					<div class="space-y-2">
						<h3 class="text-lg font-semibold">No submissions found</h3>
						<p class="text-muted-foreground">
							{searchTerm || selectedStatus !== 'all' 
								? 'Try adjusting your search or filters.' 
								: 'Contact submissions will appear here when received.'}
						</p>
					</div>
					{#if searchTerm || selectedStatus !== 'all'}
						<Button onclick={resetFilters} class="transition-colors duration-200">
							Clear Filters
						</Button>
					{/if}
				</div>
			{:else}
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Contact</Table.Head>
							<Table.Head>Subject</Table.Head>
							<Table.Head>Status</Table.Head>
							<Table.Head>Submitted</Table.Head>
							<Table.Head class="text-right">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each filteredSubmissions as submission}
							<Table.Row class="transition-colors duration-200 hover:bg-muted/50">
								<Table.Cell>
									<div class="space-y-1">
										<p class="font-medium text-sm">{submission.name}</p>
										<p class="text-sm text-muted-foreground">{submission.email}</p>
									</div>
								</Table.Cell>
								<Table.Cell>
									<p class="text-sm font-medium truncate max-w-xs" title={submission.subject}>
										{submission.subject}
									</p>
								</Table.Cell>
								<Table.Cell>
									<Badge variant={getStatusVariant(submission.status)}>
										<svelte:component this={getStatusIcon(submission.status)} class="mr-1 h-3 w-3" />
										{submission.status}
									</Badge>
								</Table.Cell>
								<Table.Cell class="text-sm text-muted-foreground">
									{formatDate(submission.submittedAt)}
								</Table.Cell>
								<Table.Cell class="text-right">
									<div class="flex items-center justify-end gap-2">
										<Button 
											variant="ghost" 
											size="icon" 
											onclick={() => viewSubmission(submission)}
											aria-label="View submission"
											class="transition-colors duration-200"
										>
											<Eye class="h-4 w-4" />
										</Button>
										{#if submission.status !== 'closed'}
											<Button 
												variant="ghost" 
												size="icon" 
												onclick={() => updateSubmissionStatus(submission._id, 'closed')}
												aria-label="Close submission"
												class="transition-colors duration-200 hover:text-destructive"
											>
												<X class="h-4 w-4" />
											</Button>
										{/if}
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

<!-- Submission Details Dialog -->
<Dialog.Root bind:open={showDetailsDialog}>
	<Dialog.Content class="max-w-2xl">
		{#if selectedSubmission}
			<Dialog.Header>
				<Dialog.Title class="flex items-center gap-2">
					<svelte:component this={getStatusIcon(selectedSubmission.status)} class="h-5 w-5" />
					Contact Submission Details
				</Dialog.Title>
				<Dialog.Description>
					Submitted on {formatDate(selectedSubmission.submittedAt)}
				</Dialog.Description>
			</Dialog.Header>
			
			<div class="space-y-6">
				<!-- Contact Information -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div class="space-y-2">
						<label class="text-sm font-medium">Name</label>
						<p class="text-sm p-2 bg-muted rounded">{selectedSubmission.name}</p>
					</div>
					<div class="space-y-2">
						<label class="text-sm font-medium">Email</label>
						<p class="text-sm p-2 bg-muted rounded">
							<a href="mailto:{selectedSubmission.email}" class="text-primary hover:underline">
								{selectedSubmission.email}
							</a>
						</p>
					</div>
				</div>
				
				<!-- Subject -->
				<div class="space-y-2">
					<label class="text-sm font-medium">Subject</label>
					<p class="text-sm p-2 bg-muted rounded">{selectedSubmission.subject}</p>
				</div>
				
				<!-- Message -->
				<div class="space-y-2">
					<label class="text-sm font-medium">Message</label>
					<div class="p-4 bg-muted rounded-lg">
						<p class="text-sm whitespace-pre-wrap leading-relaxed">{selectedSubmission.message}</p>
					</div>
				</div>
				
				<!-- Status and Actions -->
				<div class="flex items-center justify-between pt-4 border-t">
					<div class="flex items-center gap-2">
						<span class="text-sm font-medium">Status:</span>
						<Badge variant={getStatusVariant(selectedSubmission.status)}>
							<svelte:component this={getStatusIcon(selectedSubmission.status)} class="mr-1 h-3 w-3" />
							{selectedSubmission.status}
						</Badge>
					</div>
					<div class="flex gap-2">
						{#if selectedSubmission.status !== 'replied'}
							<Button 
								variant="default" 
								onclick={() => updateSubmissionStatus(selectedSubmission._id, 'replied')}
								class="transition-colors duration-200"
							>
								<Reply class="mr-2 h-4 w-4" />
								Mark as Replied
							</Button>
						{/if}
						{#if selectedSubmission.status !== 'closed'}
							<Button 
								variant="outline" 
								onclick={() => updateSubmissionStatus(selectedSubmission._id, 'closed')}
								class="transition-colors duration-200"
							>
								<Archive class="mr-2 h-4 w-4" />
								Close
							</Button>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>