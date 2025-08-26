<script lang="ts">
	import type { ContentField } from '$lib/db/models';
	import { Badge } from '$lib/components/ui/badge';

	interface Props {
		field: ContentField;
		value: boolean;
		renderMode?: 'full' | 'preview' | 'excerpt';
		class?: string;
	}

	let {
		field,
		value,
		renderMode = 'full',
		class: className = ''
	}: Props = $props();

	let shouldShowLabel = $derived(field.label && field.label !== field.name && renderMode === 'full');
	let displayText = $derived(value ? 'Yes' : 'No');
	let badgeVariant = $derived(value ? 'default' : 'secondary');
	let iconPath = $derived(value 
		? 'M5 13l4 4L19 7' // Check icon
		: 'M6 18L18 6M6 6l12 12'); // X icon
</script>

<div class="boolean-field-renderer {className}">
	{#if shouldShowLabel}
		<div class="field-label" style="font-size: 0.875rem; font-weight: 500; color: hsl(var(--muted-foreground)); margin-bottom: 0.5rem;">
			{field.label}
		</div>
	{/if}
	
	<div class="field-value">
		<Badge 
			variant={badgeVariant}
			style={`display: inline-flex; align-items: center; gap: 0.375rem; font-size: ${renderMode === 'excerpt' ? '0.75rem' : '0.875rem'};`}
		>
			<svg 
				class={renderMode === 'excerpt' ? 'w-3 h-3' : 'w-4 h-4'}
				fill="none" 
				stroke="currentColor" 
				viewBox="0 0 24 24"
				aria-hidden="true"
			>
				<path 
					stroke-linecap="round" 
					stroke-linejoin="round" 
					stroke-width="2" 
					d={iconPath}
				/>
			</svg>
			{displayText}
		</Badge>
	</div>
</div>

<style>
	.boolean-field-renderer {
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
		:global(.boolean-field-renderer .badge) {
			font-size: 0.75rem;
			padding: 0.25rem 0.5rem;
		}
		
		:global(.boolean-field-renderer svg) {
			width: 0.75rem;
			height: 0.75rem;
		}
	}

	/* Print styles */
	@media print {
		.field-label {
			color: #666 !important;
		}
		
		/* Convert badges to simple text for print */
		:global(.boolean-field-renderer .badge) {
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
		
		:global(.boolean-field-renderer .badge) {
			border: 1px solid currentColor;
		}
	}
</style>