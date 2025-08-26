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

	// Truncate text for excerpt mode
	function getTruncatedText(text: string, maxLength: number = 150): string {
		if (text.length <= maxLength) return text;
		
		const truncated = text.substring(0, maxLength);
		const lastSpace = truncated.lastIndexOf(' ');
		
		return lastSpace > 0 
			? truncated.substring(0, lastSpace) + '...'
			: truncated + '...';
	}

	let displayValue = $derived(renderMode === 'excerpt' 
		? getTruncatedText(value, 150)
		: value);

	let shouldShowLabel = $derived(field.label && field.label !== field.name && renderMode === 'full');
</script>

{#if value && value.trim()}
	<div class="text-field-renderer {className}">
		{#if shouldShowLabel}
			<div class="field-label text-sm font-medium text-muted-foreground mb-2">
				{field.label}
			</div>
		{/if}
		
		<div 
			class="field-value text-foreground leading-relaxed"
			class:text-lg={renderMode === 'full'}
			class:text-base={renderMode === 'preview'}
			class:text-sm={renderMode === 'excerpt'}
		>
			{displayValue}
		</div>
	</div>
{/if}

<style>
	.text-field-renderer {
		/* Ensure proper text rendering */
		text-rendering: optimizeLegibility;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
	}

	.field-value {
		/* Improve readability */
		word-wrap: break-word;
		overflow-wrap: break-word;
		hyphens: auto;
	}

	/* Responsive typography */
	@media (max-width: 640px) {
		.field-value {
			@apply text-sm;
		}
	}

	/* Print styles */
	@media print {
		.field-label {
			color: #666 !important;
		}
		
		.field-value {
			color: black !important;
		}
	}

	/* High contrast mode support */
	@media (prefers-contrast: high) {
		.field-label {
			font-weight: bold;
		}
	}
</style>