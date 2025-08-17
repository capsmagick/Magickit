<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import * as Table from '$lib/components/ui/table';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import * as Select from '$lib/components/ui/select';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { toast } from 'svelte-sonner';
	import { 
		Plus, 
		Search, 
		Edit, 
		Trash2, 
		FileText, 
		Calendar,
		Loader2,
		Eye,
		Archive,
		Send,
		Filter
	} from '@lucide/svelte';
	import type { ContentInstance, ContentType } from '$lib/db/models';
	import ContentInstanceForm from './ContentInstanceForm.svelte';

	// State management
	let contentInstances: ContentInstance[] = $state([]);
	let contentTypes: ContentType[] = $state([]);
	let loading = $state(true);
	let loadingTypes = $state(true);
	let searchQuery = $state('');
	let selectedContentType = $state('');
	let selectedStatus = $state('');
	let showCreateDialog = $state(false);
	let showEditDialog = $state(false);
	let showDeleteDialog = $state(false);
	let selectedContent: ContentInstance | null = $state(null);
	let submitting = $state(false);

	// Pagination
	let currentPage = $state(1);
	let totalPages = $state(1);
	let totalItems = $state(0);
	const itemsPerPage = 20;

	// Status options
	const statusOptions = [
		{ value: '', label: 'All Statuses' },
		{ value: 'draft', label: 'Draft' },
		{ value: 'published', label: 'Published' },
		{ value: 'archived', label: 'Archived' }
	];

	// Load content types
	async function loadContentTypes() {
		try {
			loadingTypes = true;
			const response = await fetch('/api/admin/content/types');
			const result = await response.json();

			if (result.success) {
				contentTypes = result.data;
			} else {
				toast.error(result.error || 'Failed to load content types');
			}
		} catch (error) {
			console.error('Error loading content types:', error);
			toast.error('Failed to load content types');
		} finally {
			loadingTypes = false;
		}
	}

	// Load content instances
	async function loadContentInstances() {
		try {
			loading = true;
			const skip = (currentPage - 1) * itemsPerPage;
			const params = new URLSearchParams({
				limit: itemsPerPage.toString(),
				skip: skip.toString(),
				sortBy: 'updatedAt',
				sortOrder: 'desc'
			});

			if (searchQuery.trim()) {
				params.set('search', searchQuery.trim());
			}
			if (selectedContentType) {
				params.set('contentTypeId', selectedContentType);
			}
			if (selectedStatus) {
				params.set('status', selectedStatus);
			}

			const response = await fetch(`/api/admin/content/pages?${params}`);
			const result = await response.json();

			if (result.success) {
				contentInstances = result.data;
				totalItems = result.total;
				totalPages = Math.ceil(totalItems / itemsPerPage);
			} else {
				toast.error(result.error || 'Failed to load content instances');
			}
		} catch (error) {
			console.error('Error loading content instances:', error);
			toast.error('Failed to load content instances');
		} finally {
			loading = false;
		}
	}

	// Search with debounce
	let searchTimeout: NodeJS.Timeout;
	function handleSearch() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			currentPage = 1;
			loadContentInstances();
		}, 300);
	}

	// Filter handlers
	function handleContentTypeFilter(selected: any) {
		selectedContentType = selected?.value || '';
		currentPage = 1;
		loadContentInstances();
	}

	function handleStatusFilter(selected: any) {
		selectedStatus = selected?.value || '';
		currentPage = 1;
		loadContentInstances();
	}

	// Create content instance
	async function handleCreate(formData: any) {
		try {
			submitting = true;
			const response = await fetch('/api/admin/content/pages', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...formData,
					author: 'temp-user-id' // TODO: Get from session
				})
			});

			const result = await response.json();

			if (result.success) {
				toast.success('Content created successfully');
				showCreateDialog = false;
				loadContentInstances();
			} else {
				toast.error(result.error || 'Failed to create content');
			}
		} catch (error) {
			console.error('Error creating content:', error);
			toast.error('Failed to create content');
		} finally {
			submitting = false;
		}
	}

	// Update content instance
	async function handleUpdate(formData: any) {
		if (!selectedContent) return;

		try {
			submitting = true;
			const response = await fetch(`/api/admin/content/pages/${selectedContent._id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...formData,
					updatedBy: 'temp-user-id' // TODO: Get from session
				})
			});

			const result = await response.json();

			if (result.success) {
				toast.success('Content updated successfully');
				showEditDialog = false;
				selectedContent = null;
				loadContentInstances();
			} else {
				toast.error(result.error || 'Failed to update content');
			}
		} catch (error) {
			console.error('Error updating content:', error);
			toast.error('Failed to update content');
		} finally {
			submitting = false;
		}
	}

	// Delete content instance
	async function handleDelete() {
		if (!selectedContent) return;

		try {
			submitting = true;
			const response = await fetch(`/api/admin/content/pages/${selectedContent._id}`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					deletedBy: 'temp-user-id' // TODO: Get from session
				})
			});

			const result = await response.json();

			if (result.success) {
				toast.success('Content deleted successfully');
				showDeleteDialog = false;
				selectedContent = null;
				loadContentInstances();
			} else {
				toast.error(result.error || 'Failed to delete content');
			}
		} catch (error) {
			console.error('Error deleting content:', error);
			toast.error('Failed to delete content');
		} finally {
			submitting = false;
		}
	}

	// Publish content
	async function handlePublish(content: ContentInstance) {
		try {
			const response = await fetch(`/api/admin/content/pages/${content._id}/publish`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					publishedBy: 'temp-user-id' // TODO: Get from session
				})
			});

			const result = await response.json();

			if (result.success) {
				toast.success('Content published successfully');
				loadContentInstances();
			} else {
				toast.error(result.error || 'Failed to publish content');
			}
		} catch (error) {
			console.error('Error publishing content:', error);
			toast.error('Failed to publish content');
		}
	}

	// Archive content
	async function handleArchive(content: ContentInstance) {
		try {
			const response = await fetch(`/api/admin/content/pages/${content._id}/archive`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					archivedBy: 'temp-user-id' // TODO: Get from session
				})
			});

			const result = await response.json();

			if (result.success) {
				toast.success('Content archived successfully');
				loadContentInstances();
			} else {
				toast.error(result.error || 'Failed to archive content');
			}
		} catch (error) {
			console.error('Error archiving content:', error);
			toast.error('Failed to archive content');
		}
	}

	// Event handlers
	function openEditDialog(content: ContentInstance) {
		selectedContent = content;
		showEditDialog = true;
	}

	function openDeleteDialog(content: ContentInstance) {
		selectedContent = content;
		showDeleteDialog = true;
	}

	function getContentTypeName(contentTypeId: string) {
		const contentType = contentTypes.find(ct => ct._id.toString() === contentTypeId);
		return contentType?.name || 'Unknown';
	}

	function getStatusBadgeVariant(status: string) {
		switch (status) {
			case 'published': return 'default';
			case 'draft': return 'secondary';
			case 'archived': return 'outline';
			default: return 'secondary';
		}
	}

	function formatDate(date: Date | string) {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	// Load data on mount
	onMount(() => {
		loadContentTypes();
		loadContentInstances();
	});
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-2xl font-semibold tracking-tight">Content Pages</h1>
			<p class="text-sm text-muted-foreground">
				Create and manage dynamic content pages for your website.
			</p>
		</div>
		<Button onclick={() => showCreateDialog = true} class="gap-2">
			<Plus class="h-4 w-4" />
			Create Content
		</Button>
	</div>

	<!-- Search and Filters -->
	<Card>
		<CardContent class="p-6">
			<div class="flex flex-col gap-4 sm:flex-row sm:items-center">
				<div class="relative flex-1">
					<Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						bind:value={searchQuery}
						placeholder="Search content..."
						class="pl-8"
						oninput={handleSearch}
					/>
				</div>
				<div class="flex items-center gap-2">
					<Filter class="h-4 w-4 text-muted-foreground" />
					<Select.Root onSelectedChange={handleContentTypeFilter}>
						<Select.Trigger class="w-[180px]">
							<Select.Value placeholder="Content Type" />
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="">All Types</Select.Item>
							{#each contentTypes as contentType}
								<Select.Item value={contentType._id.toString()}>
									{contentType.name}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					<Select.Root onSelectedChange={handleStatusFilter}>
						<Select.Trigger class="w-[140px]">
							<Select.Value placeholder="Status" />
						</Select.Trigger>
						<Select.Content>
							{#each statusOptions as option}
								<Select.Item value={option.value}>
									{option.label}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
				<div class="flex items-center gap-2 text-sm text-muted-foreground">
					<FileText class="h-4 w-4" />
					{totalItems} content item{totalItems !== 1 ? 's' : ''}
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- Content Table -->
	<Card>
		<CardHeader>
			<CardTitle>Content Pages</CardTitle>
			<CardDescription>
				Manage your dynamic content pages and their publication status.
			</CardDescription>
		</CardHeader>
		<CardContent class="p-0">
			{#if loading}
				<div class="p-6 space-y-4">
					{#each Array(5) as _}
						<div class="flex items-center space-x-4">
							<Skeleton class="h-4 w-[200px]" />
							<Skeleton class="h-4 w-[100px]" />
							<Skeleton class="h-4 w-[150px]" />
							<Skeleton class="h-4 w-[100px]" />
						</div>
					{/each}
				</div>
			{:else if contentInstances.length === 0}
				<div class="p-12 text-center">
					<FileText class="mx-auto h-12 w-12 text-muted-foreground/50" />
					<h3 class="mt-4 text-lg font-semibold">No content found</h3>
					<p class="mt-2 text-sm text-muted-foreground">
						{searchQuery || selectedContentType || selectedStatus 
							? 'No content matches your filters.' 
							: 'Get started by creating your first content page.'}
					</p>
					{#if !searchQuery && !selectedContentType && !selectedStatus}
						<Button onclick={() => showCreateDialog = true} class="mt-4 gap-2">
							<Plus class="h-4 w-4" />
							Create Content
						</Button>
					{/if}
				</div>
			{:else}
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Title</Table.Head>
							<Table.Head>Type</Table.Head>
							<Table.Head>Status</Table.Head>
							<Table.Head>Last Modified</Table.Head>
							<Table.Head class="w-[150px]">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each contentInstances as content}
							<Table.Row>
								<Table.Cell class="font-medium">
									<div class="flex flex-col gap-1">
										<span>{content.title}</span>
										<code class="text-xs text-muted-foreground">/{content.slug}</code>
									</div>
								</Table.Cell>
								<Table.Cell>
									<Badge variant="outline">
										{getContentTypeName(content.contentTypeId.toString())}
									</Badge>
								</Table.Cell>
								<Table.Cell>
									<Badge variant={getStatusBadgeVariant(content.status)}>
										{content.status}
									</Badge>
								</Table.Cell>
								<Table.Cell class="text-sm text-muted-foreground">
									<div class="flex items-center gap-1">
										<Calendar class="h-3 w-3" />
										{formatDate(content.updatedAt)}
									</div>
								</Table.Cell>
								<Table.Cell>
									<div class="flex items-center gap-1">
										{#if content.status === 'draft'}
											<Button
												variant="ghost"
												size="icon"
												onclick={() => handlePublish(content)}
												class="h-8 w-8 text-green-600 hover:text-green-600"
												title="Publish"
											>
												<Send class="h-4 w-4" />
											</Button>
										{/if}
										{#if content.status === 'published'}
											<Button
												variant="ghost"
												size="icon"
												onclick={() => handleArchive(content)}
												class="h-8 w-8 text-orange-600 hover:text-orange-600"
												title="Archive"
											>
												<Archive class="h-4 w-4" />
											</Button>
										{/if}
										<Button
											variant="ghost"
											size="icon"
											onclick={() => openEditDialog(content)}
											class="h-8 w-8"
											title="Edit"
										>
											<Edit class="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											onclick={() => openDeleteDialog(content)}
											class="h-8 w-8 text-destructive hover:text-destructive"
											title="Delete"
										>
											<Trash2 class="h-4 w-4" />
										</Button>
									</div>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>

				<!-- Pagination -->
				{#if totalPages > 1}
					<div class="flex items-center justify-between px-6 py-4 border-t">
						<div class="text-sm text-muted-foreground">
							Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} results
						</div>
						<div class="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								disabled={currentPage === 1}
								onclick={() => { currentPage = Math.max(1, currentPage - 1); loadContentInstances(); }}
							>
								Previous
							</Button>
							<div class="text-sm">
								Page {currentPage} of {totalPages}
							</div>
							<Button
								variant="outline"
								size="sm"
								disabled={currentPage === totalPages}
								onclick={() => { currentPage = Math.min(totalPages, currentPage + 1); loadContentInstances(); }}
							>
								Next
							</Button>
						</div>
					</div>
				{/if}
			{/if}
		</CardContent>
	</Card>
</div>

<!-- Create Dialog -->
<Dialog.Root bind:open={showCreateDialog}>
	<Dialog.Content class="max-w-4xl max-h-[90vh] overflow-y-auto">
		<Dialog.Header>
			<Dialog.Title>Create Content</Dialog.Title>
			<Dialog.Description>
				Create a new content page based on a content type.
			</Dialog.Description>
		</Dialog.Header>
		<ContentInstanceForm
			{contentTypes}
			onSubmit={handleCreate}
			onCancel={() => showCreateDialog = false}
			{submitting}
		/>
	</Dialog.Content>
</Dialog.Root>

<!-- Edit Dialog -->
<Dialog.Root bind:open={showEditDialog}>
	<Dialog.Content class="max-w-4xl max-h-[90vh] overflow-y-auto">
		<Dialog.Header>
			<Dialog.Title>Edit Content</Dialog.Title>
			<Dialog.Description>
				Update the content page information and data.
			</Dialog.Description>
		</Dialog.Header>
		{#if selectedContent}
			<ContentInstanceForm
				{contentTypes}
				contentInstance={selectedContent}
				onSubmit={handleUpdate}
				onCancel={() => { showEditDialog = false; selectedContent = null; }}
				{submitting}
			/>
		{/if}
	</Dialog.Content>
</Dialog.Root>

<!-- Delete Confirmation Dialog -->
<AlertDialog.Root bind:open={showDeleteDialog}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Delete Content</AlertDialog.Title>
			<AlertDialog.Description>
				Are you sure you want to delete "{selectedContent?.title}"? This action cannot be undone and will remove all versions of this content.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel onclick={() => { showDeleteDialog = false; selectedContent = null; }}>
				Cancel
			</AlertDialog.Cancel>
			<AlertDialog.Action
				onclick={handleDelete}
				disabled={submitting}
				class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
			>
				{#if submitting}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
				{/if}
				Delete Content
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>