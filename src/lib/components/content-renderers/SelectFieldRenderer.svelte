<script lang="ts">
	import type { ContentField } from '$lib/db/models';
	import { Badge } from '$lib/components/ui/badge';

	interface Props {
		field: ContentField;
		value: string | string[];
		renderMode?: 'full' | 'preview' | 'excerpt';
		class?: string;
	}

	let {
		field,
		value,
		renderMode = 'full',
		class: className = ''
	}: Props = $props();

	let isMultiSelect = $derived(field.type === 'multiselect');
	let values = $derived(Array.isArray(value) ? value : [value]);
	let shouldShowLabel = $derived(field.label && field.label !== field.name && renderMode === 'full');

	// Limit displayed values for excerpt mode
	let displayValues = $derived(renderMode === 'excerpt' 
		? values.slice(0, 2)
		: renderMode === 'preview'
		? values.slice(0, 4)
		: values);

	let hasMoreValues = $derived(values.length > displayValues.length);
	let remainingCount = $derived(values.length - displayValues.length);
</script>

{#if values.length > 0}
	<div class="select-field-renderer {className}">
		{#if shouldShowLabel}
			<div class="field-label text-sm font-medium text-muted-foreground mb-2">
				{field.label}
			</div>
		{/if}
		
		<div class="field-value">
			{#if isMultiSelect}
				<!-- Multi-select: Display as badges -->
				<div class="flex flex-wrap gap-2">
					{#each displayValues as selectedValue}
						<Badge 
							variant="secondary" 
							class={renderMode === 'excerpt' ? 'text-xs' : 'text-sm'}
						>
							{selectedValue}
						</Badge>
					{/each}
					
					{#if hasMoreValues}
						<Badge variant="outline" class="text-xs text-muted-foreground">
							+{remainingCount} more
						</Badge>
					{/if}
				</div>
			{:else}
				<!-- Single select: Display as text -->
				<span 
					class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground"
					class:text-xs={renderMode === 'excerpt'}
					class:text-sm={renderMode !== 'excerpt'}
				>
					{displayValues[0]}
				</span>
			{/if}
		</div>
	</div>
{/if}

<style>
	.select-field-renderer {
		/* Ensure proper spacing */
		display: block;
	}

	.field-value {
		/* Ensure proper alignment */
		display: flex;
		align-items: flex-start;
	}

	/* Responsive adjustments */
	@media (max-width: 640px) {
		:global(.select-field-renderer .badge) {
			@apply text-xs px-2 py-1;
		}
	}

	/* Print styles */
	@media print {
		.field-label {
			color: #666 !important;
		}
		
		/* Convert badges to simple text for print */
		:global(.select-field-renderer .badge) {
			background: transparent !important;
			color: black !important;
			border: 1px solid #ccc !important;
		}
	}

	/* High contrast mode support */
	@media (prefers-contrast: high) {
		.field-label {
			font-weight: bold;
		}
		
		:global(.select-field-renderer .badge) {
			border: 1px solid currentColor;
		}
	}
</style>