<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Switch } from '$lib/components/ui/switch';
	import { Badge } from '$lib/components/ui/badge';
	import { 
		Save, 
		Eye, 
		ArrowLeft, 
		Loader2, 
		Plus, 
		X,
		Calendar,
		Tag
	} from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { EdraEditor, EdraToolBar, EdraDragHandleExtended } from '$lib/components/edra/shadcn/index.js';
	import type { Content, Editor } from '@tiptap/core';
	import type { BlogPost } from '$lib/db/models.js';

	// Form state
	let formData = $state({
		title: '',
		slug: '',
		excerpt: '',
		content: '',
		tags: [] as string[],
		featured: false,
		status: 'draft' as BlogPost['status'],
		seoTitle: '',
		seoDescription: '',
		publishedAt: null as string | null
	});

	// Editor state
	let editor = $state<Editor>();
	let editorContent = $state<Content>();

	// UI state
	let isSubmitting = $state(false);
	let errors = $state<Record<string, string>>({});
	let newTag = $state('');
	let isGeneratingSlug = $state(false);

	// Auto-generate slug from title
	$effect(() => {
		if (formData.title && !formData.slug) {
			generateSlug();
		}
	});

	// Update content when editor changes
	function onEditorUpdate() {
		if (editor) {
			editorContent = editor.getJSON();
			formData.content = editor.getHTML();
		}
	}

	// Generate slug from title
	async function generateSlug() {
		if (!formData.title.trim()) return;

		isGeneratingSlug = true;
		try {
			const response = await fetch('/admin/content/blog/generate-slug', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: formData.title })
			});

			if (response.ok) {
				const { slug } = await response.json();
				formData.slug = slug;
			}
		} catch (error) {
			console.error('Error generating slug:', error);
		} finally {
			isGeneratingSlug = false;
		}
	}

	// Add tag
	function addTag() {
		const tag = newTag.trim().toLowerCase();
		if (tag && !formData.tags.includes(tag)) {
			formData.tags = [...formData.tags, tag];
			newTag = '';
		}
	}

	// Remove tag
	function removeTag(tagToRemove: string) {
		formData.tags = formData.tags.filter(tag => tag !== tagToRemove);
	}

	// Handle tag input keydown
	function handleTagKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			addTag();
		}
	}

	// Validate form
	function validateForm(): boolean {
		errors = {};

		if (!formData.title.trim()) {
			errors.title = 'Title is required';
		}

		if (!formData.slug.trim()) {
			errors.slug = 'Slug is required';
		}

		if (!formData.excerpt.trim()) {
			errors.excerpt = 'Excerpt is required';
		}

		if (!formData.content.trim()) {
			errors.content = 'Content is required';
		}

		if (formData.status === 'published' && !formData.publishedAt) {
			formData.publishedAt = new Date().toISOString().slice(0, 16);
		}

		return Object.keys(errors).length === 0;
	}

	// Save post
	async function savePost(status: BlogPost['status'] = formData.status) {
		if (!validateForm()) return;

		isSubmitting = true;
		try {
			const postData = {
				...formData,
				status,
				publishedAt: status === 'published' ? (formData.publishedAt || new Date().toISOString()) : null
			};

			const response = await fetch('/admin/content/blog', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(postData)
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to save post');
			}

			const { post } = await response.json();
			
			// Redirect to edit page or back to list
			if (status === 'draft') {
				goto(`/admin/content/blog/edit/${post._id}`);
			} else {
				goto('/admin/content/blog');
			}
		} catch (error) {
			console.error('Error saving post:', error);
			errors.submit = error instanceof Error ? error.message : 'Failed to save post';
		} finally {
			isSubmitting = false;
		}
	}

	// Save as draft
	function saveDraft() {
		savePost('draft');
	}

	// Publish post
	function publishPost() {
		savePost('published');
	}

	// Preview post
	function previewPost() {
		// Store current form data in session storage for preview
		sessionStorage.setItem('blog-preview', JSON.stringify({
			...formData,
			content: editor?.getHTML() || formData.content
		}));
		window.open('/admin/content/blog/preview', '_blank');
	}

	// Go back
	function goBack() {
		goto('/admin/content/blog');
	}
</script>

<svelte:head>
	<title>Create Blog Post | Admin | Magickit</title>
	<meta name="description" content="Create a new blog post" />
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			<Button variant="ghost" size="icon" onclick={goBack} aria-label="Go back">
				<ArrowLeft class="h-4 w-4" />
			</Button>
			<div>
				<h1 class="text-2xl font-bold">Create Blog Post</h1>
				<p class="text-muted-foreground">Write and publish your blog content</p>
			</div>
		</div>
		<div class="flex items-center gap-2">
			<Button variant="outline" onclick={previewPost} disabled={!formData.title}>
				<Eye class="mr-2 h-4 w-4" />
				Preview
			</Button>
			<Button variant="outline" onclick={saveDraft} disabled={isSubmitting}>
				{#if isSubmitting && formData.status === 'draft'}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
				{:else}
					<Save class="mr-2 h-4 w-4" />
				{/if}
				Save Draft
			</Button>
			<Button onclick={publishPost} disabled={isSubmitting}>
				{#if isSubmitting && formData.status === 'published'}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
				{:else}
					<Calendar class="mr-2 h-4 w-4" />
				{/if}
				Publish
			</Button>
		</div>
	</div>

	{#if errors.submit}
		<Card class="border-destructive">
			<CardContent class="p-4">
				<p class="text-sm text-destructive">{errors.submit}</p>
			</CardContent>
		</Card>
	{/if}

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Main Content -->
		<div class="lg:col-span-2 space-y-6">
			<!-- Title and Slug -->
			<Card>
				<CardHeader>
					<CardTitle>Post Details</CardTitle>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="space-y-2">
						<Label for="title">Title *</Label>
						<Input 
							id="title"
							bind:value={formData.title}
							placeholder="Enter post title..."
							class={errors.title ? 'border-destructive' : ''}
						/>
						{#if errors.title}
							<p class="text-sm text-destructive">{errors.title}</p>
						{/if}
					</div>

					<div class="space-y-2">
						<Label for="slug">Slug *</Label>
						<div class="flex gap-2">
							<Input 
								id="slug"
								bind:value={formData.slug}
								placeholder="post-url-slug"
								class={errors.slug ? 'border-destructive' : ''}
							/>
							<Button 
								variant="outline" 
								onclick={generateSlug} 
								disabled={isGeneratingSlug || !formData.title}
							>
								{#if isGeneratingSlug}
									<Loader2 class="h-4 w-4 animate-spin" />
								{:else}
									Generate
								{/if}
							</Button>
						</div>
						{#if errors.slug}
							<p class="text-sm text-destructive">{errors.slug}</p>
						{/if}
					</div>

					<div class="space-y-2">
						<Label for="excerpt">Excerpt *</Label>
						<Textarea 
							id="excerpt"
							bind:value={formData.excerpt}
							placeholder="Brief description of the post..."
							rows={3}
							class={errors.excerpt ? 'border-destructive' : ''}
						/>
						{#if errors.excerpt}
							<p class="text-sm text-destructive">{errors.excerpt}</p>
						{/if}
					</div>
				</CardContent>
			</Card>

			<!-- Content Editor -->
			<Card>
				<CardHeader>
					<CardTitle>Content *</CardTitle>
				</CardHeader>
				<CardContent class="p-0">
					<div class="border-b">
						{#if editor && !editor.isDestroyed}
							<EdraToolBar
								class="bg-secondary/50 flex w-full items-center overflow-x-auto border-b border-dashed p-0.5"
								{editor}
							/>
							<EdraDragHandleExtended {editor} />
						{/if}
					</div>
					<EdraEditor
						bind:editor
						content={editorContent}
						class="min-h-[400px] max-h-screen overflow-y-scroll pr-2 pl-6"
						onUpdate={onEditorUpdate}
					/>
					{#if errors.content}
						<div class="p-4 border-t">
							<p class="text-sm text-destructive">{errors.content}</p>
						</div>
					{/if}
				</CardContent>
			</Card>
		</div>

		<!-- Sidebar -->
		<div class="space-y-6">
			<!-- Publish Settings -->
			<Card>
				<CardHeader>
					<CardTitle>Publish Settings</CardTitle>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="flex items-center justify-between">
						<Label for="featured">Featured Post</Label>
						<Switch id="featured" bind:checked={formData.featured} />
					</div>

					{#if formData.status === 'published' || formData.publishedAt}
						<div class="space-y-2">
							<Label for="publishedAt">Publish Date</Label>
							<Input 
								id="publishedAt"
								type="datetime-local"
								bind:value={formData.publishedAt}
							/>
						</div>
					{/if}
				</CardContent>
			</Card>

			<!-- Tags -->
			<Card>
				<CardHeader>
					<CardTitle>Tags</CardTitle>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="flex gap-2">
						<Input 
							bind:value={newTag}
							placeholder="Add tag..."
							onkeydown={handleTagKeydown}
						/>
						<Button variant="outline" size="icon" onclick={addTag} disabled={!newTag.trim()}>
							<Plus class="h-4 w-4" />
						</Button>
					</div>

					{#if formData.tags.length > 0}
						<div class="flex flex-wrap gap-2">
							{#each formData.tags as tag}
								<Badge variant="secondary" class="flex items-center gap-1">
									<Tag class="h-3 w-3" />
									{tag}
									<button 
										onclick={() => removeTag(tag)}
										class="ml-1 hover:text-destructive"
										aria-label="Remove tag"
									>
										<X class="h-3 w-3" />
									</button>
								</Badge>
							{/each}
						</div>
					{/if}
				</CardContent>
			</Card>

			<!-- SEO Settings -->
			<Card>
				<CardHeader>
					<CardTitle>SEO Settings</CardTitle>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="space-y-2">
						<Label for="seoTitle">SEO Title</Label>
						<Input 
							id="seoTitle"
							bind:value={formData.seoTitle}
							placeholder="Custom title for search engines..."
						/>
						<p class="text-xs text-muted-foreground">
							{formData.seoTitle.length}/60 characters
						</p>
					</div>

					<div class="space-y-2">
						<Label for="seoDescription">SEO Description</Label>
						<Textarea 
							id="seoDescription"
							bind:value={formData.seoDescription}
							placeholder="Description for search engines..."
							rows={3}
						/>
						<p class="text-xs text-muted-foreground">
							{formData.seoDescription.length}/160 characters
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	</div>
</div>