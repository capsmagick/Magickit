<script lang="ts">
	import type { ContentField } from '$lib/db/models';
	import ResponsiveImage from '../ResponsiveImage.svelte';

	interface Props {
		field: ContentField;
		value: string | { url: string; alt?: string; caption?: string; width?: number; height?: number; };
		renderMode?: 'full' | 'preview' | 'excerpt';
		class?: string;
	}

	let {
		field,
		value,
		renderMode = 'full',
		class: className = ''
	}: Props = $props();

	// Parse image value - can be string URL or object with metadata
	let imageData = $derived(typeof value === 'string' 
		? { url: value, alt: field.label || 'Image' }
		: value);

	let shouldShowLabel = $derived(field.label && field.label !== field.name && renderMode === 'full');
	let shouldShowCaption = $derived(imageData.caption && renderMode !== 'excerpt');

	// Determine image size based on render mode
	let imageSize = $derived(renderMode === 'excerpt' 
		? { width: 200, height: 150 }
		: renderMode === 'preview'
		? { width: 400, height: 300 }
		: { width: imageData.width, height: imageData.height });
</script>

{#if imageData?.url}
	<figure class="image-field-renderer {className}">
		{#if shouldShowLabel}
			<div class="field-label" style="font-size: 0.875rem; font-weight: 500; color: hsl(var(--muted-foreground)); margin-bottom: 0.75rem;">
				{field.label}
			</div>
		{/if}
		
		<div 
			class="image-container"
			class:max-w-sm={renderMode === 'excerpt'}
			class:max-w-md={renderMode === 'preview'}
			class:max-w-full={renderMode === 'full'}
		>
			<ResponsiveImage
				src={imageData.url}
				alt={imageData.alt || field.label || 'Image'}
				width={imageSize.width}
				height={imageSize.height}
				class="rounded-lg shadow-sm"
				loading={renderMode === 'excerpt' ? 'lazy' : 'eager'}
				priority={renderMode === 'full'}
			/>
		</div>
		
		{#if shouldShowCaption}
			<figcaption class="image-caption mt-2 text-sm text-muted-foreground text-center">
				{imageData.caption}
			</figcaption>
		{/if}
	</figure>
{/if}

<style>
	.image-field-renderer {
		/* Ensure proper spacing and alignment */
		display: block;
		margin: 0;
	}

	.image-container {
		/* Center images and ensure responsive behavior */
		margin: 0 auto;
		display: block;
	}

	.image-caption {
		/* Improve caption readability */
		line-height: 1.4;
		font-style: italic;
	}

	/* Responsive adjustments */
	@media (max-width: 640px) {
		.image-container {
			max-width: 100% !important;
		}
		
		.image-caption {
			font-size: 0.75rem;
		}
	}

	/* Print styles */
	@media print {
		.field-label {
			color: #666 !important;
		}
		
		.image-caption {
			color: #666 !important;
		}
		
		/* Ensure images print well */
		:global(.image-field-renderer img) {
			max-width: 100% !important;
			height: auto !important;
			page-break-inside: avoid;
		}
	}

	/* High contrast mode support */
	@media (prefers-contrast: high) {
		.field-label {
			font-weight: bold;
		}
		
		:global(.image-field-renderer img) {
			border: 1px solid currentColor;
		}
	}

	/* Reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		:global(.image-field-renderer img) {
			transition: none !important;
		}
	}
</style>