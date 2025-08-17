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
		Copy,
		Filter,
		Package
	} from '@lucide/svelte';
	import type { ContentInstance, ContentType } from '$lib/db/models';
	import ContentComponentForm from './ContentComponentForm.svelte';

	// State management
	let contentComponents: ContentInstance[] = $state([]);
	let contentTypes: ContentType[] = $state([]);
	let loading = $state(true);
	let loadingTypes = $state(true);
	let searchQuery = $state('');
	let selectedContentType = $state('');
	let selectedCategory = $state('');
	let showCreateDialog = $state(false);
	let showEditDialog = $state(false);
	let showDeleteDialog = $state(false);
	let showPreviewDialog = $state(false);
	let showUsageDialog = $state(false);
	let selectedComponent: ContentInstance | null = $state(null);
	let componentUsage: any[] = $state([]);
	let submitting = $state(false);

	// Pagination
	let currentPage = $state(1);
	let totalPages = $state(1);
	let totalItems = $state(0);
	const itemsPerPage = 20;

	// Component categories
	const categoryOptions = [
		{ value: '', label: 'All Categories' },
		{ value: 'header', label: 'Headers' },
		{ value: 'footer', label: 'Footers' },
		{ value: 'hero', label: 'Hero Sections' },
		{ value: 'cta', label: 'Call to Action' },
		{ value: 'testimonial', label: 'Testimonials' },
		{ value: 'feature', label: 'Features' },
		{ value: 'pricing', label: 'Pricing' },
		{ value: 'contact', label: 'Contact Forms' },
		{ value: 'navigation', label: 'Navigation' },
		{ value: 'content', label: 'Content Blocks' },
		{ value: 'media', label: 'Media Sections' }
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

	// Load content components using the enhanced components API
	async function loadContentComponents() {
		try {
			loading = true;
			const skip = (currentPage - 1) * itemsPerPage;
			const params = new URLSearchParams({
				limit: itemsPerPage.toString(),
				skip: skip.toString(),
				sortBy: 'updated',
				sortOrder: 'desc'
			});

			if (searchQuery.trim()) {
				params.set('search', searchQuery.trim());
			}
			if (selectedContentType) {
				params.set('contentTypeId', selectedContentType);
			}
			if (selectedCategory) {
				params.set('category', selectedCategory);
			}

			const response = await fetch(`/api/admin/content/components?${params}`);
			const result = await response.json();

			if (result.success) {
				contentComponents = result.data;
				totalItems = result.total;
				totalPages = Math.ceil(totalItems / itemsPerPage);
			} else {
				toast.error(result.error || 'Failed to load content components');
			}
		} catch (error) {
			console.error('Error loading content components:', error);
			toast.error('Failed to load content components');
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
			loadContentComponents();
		}, 300);
	}

	// Filter handlers
	function handleContentTypeFilter(selected: any) {
		selectedContentType = selected?.value || '';
		currentPage = 1;
		loadContentComponents();
	}

	function handleCategoryFilter(selected: any) {
		selectedCategory = selected?.value || '';
		currentPage = 1;
		loadContentComponents();
	}

	// Create content component
	async function handleCreate(formData: any) {
		try {
			submitting = true;
			const response = await fetch('/api/admin/content/components', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...formData,
					author: 'temp-user-id', // TODO: Get from session
					category: formData.category || 'content',
					tags: formData.tags || [],
					difficulty: formData.difficulty || 'beginner',
					documentation: formData.documentation || '',
					examples: formData.examples || []
				})
			});

			const result = await response.json();

			if (result.success) {
				toast.success('Component created successfully');
				showCreateDialog = false;
				loadContentComponents();
			} else {
				toast.error(result.error || 'Failed to create component');
			}
		} catch (error) {
			console.error('Error creating component:', error);
			toast.error('Failed to create component');
		} finally {
			submitting = false;
		}
	}

	// Update content component
	async function handleUpdate(formData: any) {
		if (!selectedComponent) return;

		try {
			submitting = true;
			const response = await fetch(`/api/admin/content/components/${selectedComponent._id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...formData,
					updatedBy: 'temp-user-id', // TODO: Get from session
					category: formData.category || 'content',
					tags: formData.tags || [],
					difficulty: formData.difficulty || 'beginner',
					documentation: formData.documentation || '',
					examples: formData.examples || [],
					changeNote: formData.changeNote || 'Component updated',
					changeType: formData.changeType || 'minor',
					isBreakingChange: formData.isBreakingChange || false
				})
			});

			const result = await response.json();

			if (result.success) {
				toast.success('Component updated successfully');
				showEditDialog = false;
				selectedComponent = null;
				loadContentComponents();
			} else {
				toast.error(result.error || 'Failed to update component');
			}
		} catch (error) {
			console.error('Error updating component:', error);
			toast.error('Failed to update component');
		} finally {
			submitting = false;
		}
	}

	// Delete content component
	async function handleDelete() {
		if (!selectedComponent) return;

		try {
			submitting = true;
			const response = await fetch(`/api/admin/content/components/${selectedComponent._id}`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					deletedBy: 'temp-user-id' // TODO: Get from session
				})
			});

			const result = await response.json();

			if (result.success) {
				toast.success('Component deleted successfully');
				showDeleteDialog = false;
				selectedComponent = null;
				loadContentComponents();
			} else {
				toast.error(result.error || 'Failed to delete component');
			}
		} catch (error) {
			console.error('Error deleting component:', error);
			toast.error('Failed to delete component');
		} finally {
			submitting = false;
		}
	}

	// Duplicate component
	async function handleDuplicate(component: ContentInstance) {
		try {
			const duplicateData = {
				...component,
				title: `${component.title} (Copy)`,
				slug: `${component.slug}-copy-${Date.now()}`,
				status: 'published'
			};
			delete duplicateData._id;
			delete duplicateData.createdAt;
			delete duplicateData.updatedAt;

			const response = await fetch('/api/admin/content/components', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...duplicateData,
					author: 'temp-user-id', // TODO: Get from session
					category: component.data?.category || 'content',
					tags: component.data?.componentMetadata?.tags || [],
					difficulty: component.data?.componentMetadata?.difficulty || 'beginner'
				})
			});

			const result = await response.json();

			if (result.success) {
				toast.success('Component duplicated successfully');
				loadContentComponents();
			} else {
				toast.error(result.error || 'Failed to duplicate component');
			}
		} catch (error) {
			console.error('Error duplicating component:', error);
			toast.error('Failed to duplicate component');
		}
	}

	// Event handlers
	function openEditDialog(component: ContentInstance) {
		selectedComponent = component;
		showEditDialog = true;
	}

	function openDeleteDialog(component: ContentInstance) {
		selectedComponent = component;
		showDeleteDialog = true;
	}

	function openPreviewDialog(component: ContentInstance) {
		selectedComponent = component;
		showPreviewDialog = true;
	}

	async function openUsageDialog(component: ContentInstance) {
		selectedComponent = component;
		
		// Load component usage
		try {
			const response = await fetch(`/api/admin/content/components/${component._id}/usage`);
			const result = await response.json();
			
			if (result.success) {
				componentUsage = result.data;
			} else {
				componentUsage = [];
				toast.error('Failed to load component usage');
			}
		} catch (error) {
			console.error('Error loading component usage:', error);
			componentUsage = [];
			toast.error('Failed to load component usage');
		}
		
		showUsageDialog = true;
	}

	function getContentTypeName(contentTypeId: string) {
		const contentType = contentTypes.find(ct => ct._id.toString() === contentTypeId);
		return contentType?.name || 'Unknown';
	}

	function getComponentCategory(component: ContentInstance) {
		return component.data?.category || 'content';
	}

	function getComponentUsageCount(component: ContentInstance) {
		return component.data?.componentMetadata?.usageCount || 0;
	}

	function getComponentDifficulty(component: ContentInstance) {
		return component.data?.componentMetadata?.difficulty || 'beginner';
	}

	function getComponentRating(component: ContentInstance) {
		return component.data?.componentMetadata?.rating || 0;
	}

	function hasComponentPreview(component: ContentInstance) {
		return component.data?.componentMetadata?.hasPreview || false;
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
		loadContentComponents();
	});
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-2xl font-semibold tracking-tight">Content Components</h1>
			<p class="text-sm text-muted-foreground">
				Create and manage reusable content components for your website.
			</p>
		</div>
		<Button onclick={() => showCreateDialog = true} class="gap-2">
			<Plus class="h-4 w-4" />
			Create Component
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
						placeholder="Search components..."
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
					<Select.Root onSelectedChange={handleCategoryFilter}>
						<Select.Trigger class="w-[140px]">
							<Select.Value placeholder="Category" />
						</Select.Trigger>
						<Select.Content>
							{#each categoryOptions as option}
								<Select.Item value={option.value}>
									{option.label}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
				<div class="flex items-center gap-2 text-sm text-muted-foreground">
					<Package class="h-4 w-4" />
					{totalItems} component{totalItems !== 1 ? 's' : ''}
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- Components Table -->
	<Card>
		<CardHeader>
			<CardTitle>Content Components</CardTitle>
			<CardDescription>
				Manage your reusable content components and their categories.
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
			{:else if contentComponents.length === 0}
				<div class="p-12 text-center">
					<Package class="mx-auto h-12 w-12 text-muted-foreground/50" />
					<h3 class="mt-4 text-lg font-semibold">No components found</h3>
					<p class="mt-2 text-sm text-muted-foreground">
						{searchQuery || selectedContentType || selectedCategory 
							? 'No components match your filters.' 
							: 'Get started by creating your first reusable component.'}
					</p>
					{#if !searchQuery && !selectedContentType && !selectedCategory}
						<Button onclick={() => showCreateDialog = true} class="mt-4 gap-2">
							<Plus class="h-4 w-4" />
							Create Component
						</Button>
					{/if}
				</div>
			{:else}
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Name</Table.Head>
							<Table.Head>Type</Table.Head>
							<Table.Head>Category</Table.Head>
							<Table.Head>Usage</Table.Head>
							<Table.Head>Difficulty</Table.Head>
							<Table.Head>Last Modified</Table.Head>
							<Table.Head class="w-[150px]">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each contentComponents as component}
							<Table.Row>
								<Table.Cell class="font-medium">
									<div class="flex flex-col gap-1">
										<div class="flex items-center gap-2">
											<Package class="h-4 w-4 text-muted-foreground" />
											<span>{component.title}</span>
										</div>
										<code class="text-xs text-muted-foreground">/{component.slug}</code>
									</div>
								</Table.Cell>
								<Table.Cell>
									<Badge variant="outline">
										{getContentTypeName(component.contentTypeId.toString())}
									</Badge>
								</Table.Cell>
								<Table.Cell>
									<Badge variant="secondary">
										{categoryOptions.find(cat => cat.value === getComponentCategory(component))?.label || 'Content'}
									</Badge>
								</Table.Cell>
								<Table.Cell>
									<div class="flex items-center gap-2">
										<Badge variant="outline" class="text-xs">
											{getComponentUsageCount(component)} uses
										</Badge>
										{#if hasComponentPreview(component)}
											<Badge variant="outline" class="text-xs bg-green-50 text-green-700">
												<Eye class="h-3 w-3 mr-1" />
												Preview
											</Badge>
										{/if}
									</div>
								</Table.Cell>
								<Table.Cell>
									<Badge 
										variant="outline" 
										class="text-xs {getComponentDifficulty(component) === 'beginner' ? 'bg-green-50 text-green-700' : 
											getComponentDifficulty(component) === 'intermediate' ? 'bg-yellow-50 text-yellow-700' : 
											'bg-red-50 text-red-700'}"
									>
										{getComponentDifficulty(component)}
									</Badge>
								</Table.Cell>
								<Table.Cell class="text-sm text-muted-foreground">
									<div class="flex items-center gap-1">
										<Calendar class="h-3 w-3" />
										{formatDate(component.updatedAt)}
									</div>
								</Table.Cell>
								<Table.Cell>
									<div class="flex items-center gap-1">
										{#if hasComponentPreview(component)}
											<Button
												variant="ghost"
												size="icon"
												onclick={() => openPreviewDialog(component)}
												class="h-8 w-8 text-green-600 hover:text-green-600"
												title="Preview"
											>
												<Eye class="h-4 w-4" />
											</Button>
										{/if}
										<Button
											variant="ghost"
											size="icon"
											onclick={() => openUsageDialog(component)}
											class="h-8 w-8 text-purple-600 hover:text-purple-600"
											title="View Usage"
										>
											<FileText class="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											onclick={() => handleDuplicate(component)}
											class="h-8 w-8 text-blue-600 hover:text-blue-600"
											title="Duplicate"
										>
											<Copy class="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											onclick={() => openEditDialog(component)}
											class="h-8 w-8"
											title="Edit"
										>
											<Edit class="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											onclick={() => openDeleteDialog(component)}
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
								onclick={() => { currentPage = Math.max(1, currentPage - 1); loadContentComponents(); }}
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
								onclick={() => { currentPage = Math.min(totalPages, currentPage + 1); loadContentComponents(); }}
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
			<Dialog.Title>Create Component</Dialog.Title>
			<Dialog.Description>
				Create a new reusable content component.
			</Dialog.Description>
		</Dialog.Header>
		<ContentComponentForm
			{contentTypes}
			{categoryOptions}
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
			<Dialog.Title>Edit Component</Dialog.Title>
			<Dialog.Description>
				Update the component information and content.
			</Dialog.Description>
		</Dialog.Header>
		{#if selectedComponent}
			<ContentComponentForm
				{contentTypes}
				{categoryOptions}
				contentComponent={selectedComponent}
				onSubmit={handleUpdate}
				onCancel={() => { showEditDialog = false; selectedComponent = null; }}
				{submitting}
			/>
		{/if}
	</Dialog.Content>
</Dialog.Root>

<!-- Delete Confirmation Dialog -->
<AlertDialog.Root bind:open={showDeleteDialog}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Delete Component</AlertDialog.Title>
			<AlertDialog.Description>
				Are you sure you want to delete "{selectedComponent?.title}"? This action cannot be undone and may affect pages that use this component.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel onclick={() => { showDeleteDialog = false; selectedComponent = null; }}>
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
				Delete Component
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

<!-- Preview Dialog -->
<Dialog.Root bind:open={showPreviewDialog}>
	<Dialog.Content class="max-w-4xl max-h-[90vh]">
		<Dialog.Header>
			<Dialog.Title>Component Preview</Dialog.Title>
			<Dialog.Description>
				Preview of "{selectedComponent?.title}"
			</Dialog.Description>
		</Dialog.Header>
		{#if selectedComponent}
			<div class="space-y-4">
				<div class="bg-muted/50 p-4 rounded-lg">
					<p class="text-sm text-muted-foreground mb-2">Component Information</p>
					<div class="grid grid-cols-2 gap-4 text-sm">
						<div>
							<span class="font-medium">Category:</span> 
							{categoryOptions.find(cat => cat.value === getComponentCategory(selectedComponent))?.label || 'Content'}
						</div>
						<div>
							<span class="font-medium">Difficulty:</span> 
							{getComponentDifficulty(selectedComponent)}
						</div>
						<div>
							<span class="font-medium">Usage Count:</span> 
							{getComponentUsageCount(selectedComponent)}
						</div>
						<div>
							<span class="font-medium">Rating:</span> 
							{getComponentRating(selectedComponent) || 'Not rated'}
						</div>
					</div>
				</div>
				
				{#if selectedComponent.data?.componentMetadata?.documentation}
					<div>
						<h4 class="font-medium mb-2">Documentation</h4>
						<div class="bg-muted/30 p-3 rounded text-sm">
							{selectedComponent.data.componentMetadata.documentation}
						</div>
					</div>
				{/if}
				
				{#if selectedComponent.data?.componentMetadata?.tags?.length > 0}
					<div>
						<h4 class="font-medium mb-2">Tags</h4>
						<div class="flex flex-wrap gap-2">
							{#each selectedComponent.data.componentMetadata.tags as tag}
								<Badge variant="outline" class="text-xs">{tag}</Badge>
							{/each}
						</div>
					</div>
				{/if}
				
				<div class="text-center py-8 text-muted-foreground">
					<Package class="h-12 w-12 mx-auto mb-2 opacity-50" />
					<p>Component preview rendering not yet implemented</p>
					<p class="text-xs">This will show a visual preview of the component</p>
				</div>
			</div>
		{/if}
		<Dialog.Footer>
			<Button variant="outline" onclick={() => showPreviewDialog = false}>
				Close
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Usage Dialog -->
<Dialog.Root bind:open={showUsageDialog}>
	<Dialog.Content class="max-w-4xl max-h-[90vh]">
		<Dialog.Header>
			<Dialog.Title>Component Usage</Dialog.Title>
			<Dialog.Description>
				Where "{selectedComponent?.title}" is being used
			</Dialog.Description>
		</Dialog.Header>
		<div class="space-y-4">
			{#if componentUsage.length === 0}
				<div class="text-center py-8 text-muted-foreground">
					<FileText class="h-12 w-12 mx-auto mb-2 opacity-50" />
					<p>This component is not being used anywhere yet</p>
					<p class="text-xs">Usage will be tracked automatically when the component is added to pages</p>
				</div>
			{:else}
				<div class="space-y-2">
					{#each componentUsage as usage}
						<div class="flex items-center justify-between p-3 border rounded-lg">
							<div class="flex-1">
								<div class="font-medium">{usage.usedInTitle}</div>
								<div class="text-sm text-muted-foreground">
									<code>/{usage.usedInSlug}</code>
									{#if usage.fieldName}
										• Field: {usage.fieldName}
									{/if}
									{#if usage.position !== undefined}
										• Position: {usage.position + 1}
									{/if}
								</div>
							</div>
							<div class="text-right text-sm text-muted-foreground">
								<Badge variant="outline" class="mb-1">
									{usage.usedInType}
								</Badge>
								<div>Updated {formatDate(usage.updatedAt)}</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => showUsageDialog = false}>
				Close
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>