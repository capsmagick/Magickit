<script lang="ts">
	import type { ContentField } from '$lib/db/models';

	interface Props {
		field: ContentField;
		value: string;
		renderMode?: 'full' | 'preview' | 'excerpt';
		class?: string;
	}

	let {
		field,
		value,
		renderMode = 'full',
		class: className = ''
	}: Props = $props();

	// Convert line breaks to paragraphs for better display
	function formatTextarea(text: string): string[] {
		return text
			.split('\n')
			.map(line => line.trim())
			.filter(line => line.length > 0);
	}

	// Truncate text for excerpt mode
	function getTruncatedParagraphs(paragraphs: string[], maxParagraphs: number = 2): string[] {
		if (renderMode === 'excerpt') {
			return paragraphs.slice(0, maxParagraphs);
		}
		if (renderMode === 'preview') {
			return paragraphs.slice(0, 4);
		}
		return paragraphs;
	}

	let paragraphs = $derived(formatTextarea(value));
	let displayParagraphs = $derived(getTruncatedParagraphs(paragraphs));
	let shouldShowLabel = $derived(field.label && field.label !== field.name && renderMode === 'full');
	let hasMoreContent = $derived(renderMode !== 'full' && paragraphs.length > displayParagraphs.length);
</script>

{#if value && value.trim()}
	<div class="textarea-field-renderer {className}">
		{#if shouldShowLabel}
			<div class="field-label" style="font-size: 0.875rem; font-weight: 500; color: hsl(var(--muted-foreground)); margin-bottom: 0.75rem;">
				{field.label}
			</div>
		{/if}
		
		<div class="field-value prose prose-sm max-w-none">
			{#each displayParagraphs as paragraph}
				<p class="mb-4 last:mb-0 text-foreground leading-relaxed">
					{paragraph}
				</p>
			{/each}
			
			{#if hasMoreContent}
				<div class="text-sm text-muted-foreground italic mt-2">
					... and {paragraphs.length - displayParagraphs.length} more paragraph{paragraphs.length - displayParagraphs.length !== 1 ? 's' : ''}
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.textarea-field-renderer {
		/* Ensure proper text rendering */
		text-rendering: optimizeLegibility;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
	}

	.field-value p {
		/* Improve readability */
		word-wrap: break-word;
		overflow-wrap: break-word;
		hyphens: auto;
	}

	/* Responsive spacing */
	@media (max-width: 640px) {
		.field-value p {
			margin-bottom: 0.75rem;
			font-size: 0.875rem;
		}
	}

	/* Print styles */
	@media print {
		.field-label {
			color: #666 !important;
		}
		
		.field-value p {
			color: black !important;
			margin-bottom: 0.75rem !important;
		}
	}

	/* High contrast mode support */
	@media (prefers-contrast: high) {
		.field-label {
			font-weight: bold;
		}
	}
</style>