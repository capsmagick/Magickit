<script lang="ts">
	import type { ContentInstance, ContentType, ContentField } from '$lib/db/models';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	
	// Field-specific renderers
	import TextFieldRenderer from './content-renderers/TextFieldRenderer.svelte';
	import TextareaFieldRenderer from './content-renderers/TextareaFieldRenderer.svelte';
	import RichTextFieldRenderer from './content-renderers/RichTextFieldRenderer.svelte';
	import ImageFieldRenderer from './content-renderers/ImageFieldRenderer.svelte';
	import VideoFieldRenderer from './content-renderers/VideoFieldRenderer.svelte';
	import SelectFieldRenderer from './content-renderers/SelectFieldRenderer.svelte';
	import BooleanFieldRenderer from './content-renderers/BooleanFieldRenderer.svelte';
	import DateFieldRenderer from './content-renderers/DateFieldRenderer.svelte';
	import NumberFieldRenderer from './content-renderers/NumberFieldRenderer.svelte';
	import UrlFieldRenderer from './content-renderers/UrlFieldRenderer.svelte';
	import EmailFieldRenderer from './content-renderers/EmailFieldRenderer.svelte';

	interface Props {
		content: ContentInstance;
		contentType?: ContentType;
		class?: string;
		showTitle?: boolean;
		titleLevel?: 1 | 2 | 3 | 4 | 5 | 6;
		renderMode?: 'full' | 'preview' | 'excerpt';
	}

	let {
		content,
		contentType,
		class: className = '',
		showTitle = true,
		titleLevel = 1,
		renderMode = 'full'
	}: Props = $props();

	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let resolvedContentType = $state<ContentType | null>(contentType || null);

	// Fetch content type if not provided
	onMount(async () => {
		if (!contentType && browser) {
			try {
				const response = await fetch(`/api/content-types/${content.contentTypeId}`);
				if (response.ok) {
					resolvedContentType = await response.json();
				} else {
					error = 'Failed to load content type';
				}
			} catch (err) {
				error = 'Failed to load content type';
				console.error('Error fetching content type:', err);
			}
		}
		isLoading = false;
	});

	// Get the appropriate heading tag
	function getHeadingTag(level: number): string {
		return `h${Math.max(1, Math.min(6, level))}`;
	}

	// Get field renderer component
	function getFieldRenderer(fieldType: ContentField['type']) {
		switch (fieldType) {
			case 'text':
				return TextFieldRenderer;
			case 'textarea':
				return TextareaFieldRenderer;
			case 'richtext':
				return RichTextFieldRenderer;
			case 'image':
				return ImageFieldRenderer;
			case 'video':
				return VideoFieldRenderer;
			case 'select':
			case 'multiselect':
				return SelectFieldRenderer;
			case 'boolean':
				return BooleanFieldRenderer;
			case 'date':
				return DateFieldRenderer;
			case 'number':
				return NumberFieldRenderer;
			case 'url':
				return UrlFieldRenderer;
			case 'email':
				return EmailFieldRenderer;
			default:
				return TextFieldRenderer; // Fallback
		}
	}

	// Filter fields based on render mode
	function getFieldsToRender(fields: ContentField[]): ContentField[] {
		if (renderMode === 'excerpt') {
			// For excerpt mode, only show first few text-based fields
			return fields
				.filter(field => ['text', 'textarea', 'richtext'].includes(field.type))
				.slice(0, 2);
		}
		
		if (renderMode === 'preview') {
			// For preview mode, show all fields but limit rich text content
			return fields;
		}
		
		// Full mode shows all fields
		return fields;
	}

	// Check if field has content
	function hasFieldContent(field: ContentField, data: Record<string, any>): boolean {
		const value = data[field.name];
		if (value === undefined || value === null) return false;
		
		if (typeof value === 'string') return value.trim().length > 0;
		if (typeof value === 'boolean') return true; // Always show boolean fields
		if (Array.isArray(value)) return value.length > 0;
		if (typeof value === 'object') return Object.keys(value).length > 0;
		
		return true;
	}

	let fieldsToRender = $derived(resolvedContentType 
		? getFieldsToRender(resolvedContentType.fields)
			.filter(field => hasFieldContent(field, content.data))
			.sort((a, b) => (a.order || 0) - (b.order || 0))
		: []);
</script>

{#if isLoading}
	<div class="flex items-center justify-center py-8 {className}">
		<div class="flex items-center space-x-2 text-muted-foreground">
			<div class="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
			<span class="text-sm">Loading content...</span>
		</div>
	</div>
{:else if error}
	<div class="flex items-center justify-center py-8 {className}">
		<div class="text-center space-y-2">
			<div class="w-8 h-8 mx-auto bg-destructive/20 rounded-full flex items-center justify-center">
				<svg class="w-4 h-4 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
			</div>
			<p class="text-sm text-muted-foreground">{error}</p>
		</div>
	</div>
{:else if !resolvedContentType}
	<div class="flex items-center justify-center py-8 {className}">
		<div class="text-center space-y-2">
			<div class="w-8 h-8 mx-auto bg-muted rounded-full flex items-center justify-center">
				<svg class="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
				</svg>
			</div>
			<p class="text-sm text-muted-foreground">Content type not found</p>
		</div>
	</div>
{:else}
	<article class="dynamic-content {className}" aria-label={content.title}>
		{#if showTitle && content.title}
			<svelte:element this={getHeadingTag(titleLevel)} class="content-title mb-6 font-bold leading-tight">
				{content.title}
			</svelte:element>
		{/if}

		{#if fieldsToRender.length === 0}
			<div class="text-center py-8">
				<div class="w-12 h-12 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
					<svg class="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
					</svg>
				</div>
				<p class="text-muted-foreground">No content to display</p>
			</div>
		{:else}
			<div class="content-fields space-y-6">
				{#each fieldsToRender as field (field._id)}
					{@const FieldRenderer = getFieldRenderer(field.type)}
					{@const fieldValue = content.data[field.name]}
					
					{#if fieldValue !== undefined && fieldValue !== null}
						<div class="content-field" data-field-type={field.type} data-field-name={field.name}>
							<FieldRenderer 
								{field}
								value={fieldValue}
								{renderMode}
								class="w-full"
							/>
						</div>
					{/if}
				{/each}
			</div>
		{/if}

		<!-- Content metadata for SEO and accessibility -->
		{#if content.publishedAt}
			<div class="content-meta mt-8 pt-6 border-t border-border text-sm text-muted-foreground">
				<time datetime={content.publishedAt.toISOString()} class="block">
					Published on {new Date(content.publishedAt).toLocaleDateString('en-US', {
						year: 'numeric',
						month: 'long',
						day: 'numeric'
					})}
				</time>
				{#if content.updatedAt && content.updatedAt > content.publishedAt}
					<time datetime={content.updatedAt.toISOString()} class="block mt-1">
						Last updated on {new Date(content.updatedAt).toLocaleDateString('en-US', {
							year: 'numeric',
							month: 'long',
							day: 'numeric'
						})}
					</time>
				{/if}
			</div>
		{/if}
	</article>
{/if}

<style>
	.dynamic-content {
		/* Ensure proper text rendering */
		text-rendering: optimizeLegibility;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
	}

	/* Title styling based on level */
	.content-title {
		scroll-margin-top: 2rem;
	}

	:global(.dynamic-content h1.content-title) {
		font-size: 2.25rem;
		line-height: 2.5rem;
	}

	:global(.dynamic-content h2.content-title) {
		font-size: 1.875rem;
		line-height: 2.25rem;
	}

	:global(.dynamic-content h3.content-title) {
		font-size: 1.5rem;
		line-height: 2rem;
	}

	:global(.dynamic-content h4.content-title) {
		font-size: 1.25rem;
		line-height: 1.75rem;
	}

	:global(.dynamic-content h5.content-title) {
		font-size: 1.125rem;
		line-height: 1.75rem;
	}

	:global(.dynamic-content h6.content-title) {
		font-size: 1rem;
		line-height: 1.5rem;
	}

	/* Content field spacing and typography */
	.content-fields {
		line-height: 1.7;
	}

	/* Responsive spacing */
	@media (max-width: 640px) {
		.content-fields > * + * {
			margin-top: 1rem;
		}
	}

	/* Print styles */
	@media print {
		.dynamic-content {
			color: black !important;
			background: white !important;
		}
		
		.content-meta {
			border-top: 1px solid #ccc !important;
		}
	}

	/* High contrast mode support */
	@media (prefers-contrast: high) {
		.content-meta {
			border-top-color: currentColor;
		}
	}

	/* Reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		.animate-spin {
			animation: none;
		}
	}
</style>