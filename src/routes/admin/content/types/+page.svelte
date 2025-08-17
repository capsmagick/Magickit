<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import * as Table from '$lib/components/ui/table';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { toast } from 'svelte-sonner';
	import { 
		Plus, 
		Search, 
		Edit, 
		Trash2, 
		FileText, 
		Settings,
		Calendar,
		Loader2
	} from '@lucide/svelte';
	import type { ContentType } from '$lib/db/models';
	import ContentTypeForm from './ContentTypeForm.svelte';

	// State management
	let contentTypes: ContentType[] = $state([]);
	let loading = $state(true);
	let searchQuery = $state('');
	let showCreateDialog = $state(false);
	let showEditDialog = $state(false);
	let showDeleteDialog = $state(false);
	let selectedContentType: ContentType | null = $state(null);
	let submitting = $state(false);

	// Pagination
	let currentPage = $state(1);
	let totalPages = $state(1);
	let totalItems = $state(0);
	const itemsPerPage = 20;

	// Load content types
	async function loadContentTypes() {
		try {
			loading = true;
			const skip = (currentPage - 1) * itemsPerPage;
			const params = new URLSearchParams({
				limit: itemsPerPage.toString(),
				skip: skip.toString(),
				sortBy: 'createdAt',
				sortOrder: 'desc'
			});

			if (searchQuery.trim()) {
				params.set('search', searchQuery.trim());
			}

			const response = await fetch(`/api/admin/content/types?${params}`);
			const result = await response.json();

			if (result.success) {
				contentTypes = result.data;
				totalItems = result.total;
				totalPages = Math.ceil(totalItems / itemsPerPage);
			} else {
				toast.error(result.error || 'Failed to load content types');
			}
		} catch (error) {
			console.error('Error loading content types:', error);
			toast.error('Failed to load content types');
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
			loadContentTypes();
		}, 300);
	}

	// Create content type
	async function handleCreate(formData: any) {
		try {
			submitting = true;
			const response = await fetch('/api/admin/content/types', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			});

			const result = await response.json();

			if (result.success) {
				toast.success('Content type created successfully');
				showCreateDialog = false;
				loadContentTypes();
			} else {
				toast.error(result.error || 'Failed to create content type');
			}
		} catch (error) {
			console.error('Error creating content type:', error);
			toast.error('Failed to create content type');
		} finally {
			submitting = false;
		}
	}

	// Update content type
	async function handleUpdate(formData: any) {
		if (!selectedContentType) return;

		try {
			submitting = true;
			const response = await fetch(`/api/admin/content/types/${selectedContentType._id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			});

			const result = await response.json();

			if (result.success) {
				toast.success('Content type updated successfully');
				showEditDialog = false;
				selectedContentType = null;
				loadContentTypes();
			} else {
				toast.error(result.error || 'Failed to update content type');
			}
		} catch (error) {
			console.error('Error updating content type:', error);
			toast.error('Failed to update content type');
		} finally {
			submitting = false;
		}
	}

	// Delete content type
	async function handleDelete() {
		if (!selectedContentType) return;

		try {
			submitting = true;
			const response = await fetch(`/api/admin/content/types/${selectedContentType._id}`, {
				method: 'DELETE'
			});

			const result = await response.json();

			if (result.success) {
				toast.success('Content type deleted successfully');
				showDeleteDialog = false;
				selectedContentType = null;
				loadContentTypes();
			} else {
				toast.error(result.error || 'Failed to delete content type');
			}
		} catch (error) {
			console.error('Error deleting content type:', error);
			toast.error('Failed to delete content type');
		} finally {
			submitting = false;
		}
	}

	// Event handlers
	function openEditDialog(contentType: ContentType) {
		selectedContentType = contentType;
		showEditDialog = true;
	}

	function openDeleteDialog(contentType: ContentType) {
		selectedContentType = contentType;
		showDeleteDialog = true;
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
	});
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-2xl font-semibold tracking-tight">Content Types</h1>
			<p class="text-sm text-muted-foreground">
				Define and manage content type structures for dynamic content creation.
			</p>
		</div>
		<Button onclick={() => showCreateDialog = true} class="gap-2">
			<Plus class="h-4 w-4" />
			Create Content Type
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
						placeholder="Search content types..."
						class="pl-8"
						oninput={handleSearch}
					/>
				</div>
				<div class="flex items-center gap-2 text-sm text-muted-foreground">
					<FileText class="h-4 w-4" />
					{totalItems} content type{totalItems !== 1 ? 's' : ''}
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- Content Types Table -->
	<Card>
		<CardHeader>
			<CardTitle>Content Types</CardTitle>
			<CardDescription>
				Manage your content type definitions and field structures.
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
			{:else if contentTypes.length === 0}
				<div class="p-12 text-center">
					<FileText class="mx-auto h-12 w-12 text-muted-foreground/50" />
					<h3 class="mt-4 text-lg font-semibold">No content types found</h3>
					<p class="mt-2 text-sm text-muted-foreground">
						{searchQuery ? 'No content types match your search.' : 'Get started by creating your first content type.'}
					</p>
					{#if !searchQuery}
						<Button onclick={() => showCreateDialog = true} class="mt-4 gap-2">
							<Plus class="h-4 w-4" />
							Create Content Type
						</Button>
					{/if}
				</div>
			{:else}
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Name</Table.Head>
							<Table.Head>Slug</Table.Head>
							<Table.Head>Fields</Table.Head>
							<Table.Head>Type</Table.Head>
							<Table.Head>Created</Table.Head>
							<Table.Head class="w-[100px]">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each contentTypes as contentType}
							<Table.Row>
								<Table.Cell class="font-medium">
									<div class="flex items-center gap-2">
										<FileText class="h-4 w-4 text-muted-foreground" />
										{contentType.name}
									</div>
								</Table.Cell>
								<Table.Cell>
									<code class="text-xs bg-muted px-2 py-1 rounded">
										{contentType.slug}
									</code>
								</Table.Cell>
								<Table.Cell>
									<Badge variant="secondary">
										{contentType.fields.length} field{contentType.fields.length !== 1 ? 's' : ''}
									</Badge>
								</Table.Cell>
								<Table.Cell>
									<Badge variant={contentType.isSystemType ? 'default' : 'outline'}>
										{contentType.isSystemType ? 'System' : 'Custom'}
									</Badge>
								</Table.Cell>
								<Table.Cell class="text-sm text-muted-foreground">
									<div class="flex items-center gap-1">
										<Calendar class="h-3 w-3" />
										{formatDate(contentType.createdAt)}
									</div>
								</Table.Cell>
								<Table.Cell>
									<div class="flex items-center gap-1">
										<Button
											variant="ghost"
											size="icon"
											onclick={() => openEditDialog(contentType)}
											class="h-8 w-8"
										>
											<Edit class="h-4 w-4" />
										</Button>
										{#if !contentType.isSystemType}
											<Button
												variant="ghost"
												size="icon"
												onclick={() => openDeleteDialog(contentType)}
												class="h-8 w-8 text-destructive hover:text-destructive"
											>
												<Trash2 class="h-4 w-4" />
											</Button>
										{/if}
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
								onclick={() => { currentPage = Math.max(1, currentPage - 1); loadContentTypes(); }}
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
								onclick={() => { currentPage = Math.min(totalPages, currentPage + 1); loadContentTypes(); }}
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
			<Dialog.Title>Create Content Type</Dialog.Title>
			<Dialog.Description>
				Define a new content type with custom fields and validation rules.
			</Dialog.Description>
		</Dialog.Header>
		<ContentTypeForm
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
			<Dialog.Title>Edit Content Type</Dialog.Title>
			<Dialog.Description>
				Update the content type definition and field structure.
			</Dialog.Description>
		</Dialog.Header>
		{#if selectedContentType}
			<ContentTypeForm
				contentType={selectedContentType}
				onSubmit={handleUpdate}
				onCancel={() => { showEditDialog = false; selectedContentType = null; }}
				{submitting}
			/>
		{/if}
	</Dialog.Content>
</Dialog.Root>

<!-- Delete Confirmation Dialog -->
<AlertDialog.Root bind:open={showDeleteDialog}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Delete Content Type</AlertDialog.Title>
			<AlertDialog.Description>
				Are you sure you want to delete "{selectedContentType?.name}"? This action cannot be undone.
				{#if selectedContentType?.isSystemType}
					<br><br>
					<strong class="text-destructive">Warning:</strong> This is a system content type and deleting it may affect core functionality.
				{/if}
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel onclick={() => { showDeleteDialog = false; selectedContentType = null; }}>
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
				Delete Content Type
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>