<script lang="ts">
	import type { ContentField } from '$lib/db/models';

	interface Props {
		field: ContentField;
		value: number;
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
	let isValidNumber = $derived(typeof value === 'number' && !isNaN(value));

	// Format number based on context and value
	function formatNumber(num: number): string {
		if (!isValidNumber) return 'Invalid number';
		
		// Check if it's a whole number
		if (Number.isInteger(num)) {
			// Format large integers with commas
			if (Math.abs(num) >= 1000) {
				return num.toLocaleString('en-US');
			}
			return num.toString();
		}
		
		// Format decimal numbers
		if (Math.abs(num) >= 1000) {
			return num.toLocaleString('en-US', { 
				minimumFractionDigits: 0,
				maximumFractionDigits: 2 
			});
		}
		
		// For smaller decimals, show up to 3 decimal places but remove trailing zeros
		return parseFloat(num.toFixed(3)).toString();
	}

	// Get number type for styling (currency, percentage, etc.)
	function getNumberType(fieldName: string): 'currency' | 'percentage' | 'rating' | 'default' {
		const name = fieldName.toLowerCase();
		if (name.includes('price') || name.includes('cost') || name.includes('amount') || name.includes('currency')) {
			return 'currency';
		}
		if (name.includes('percent') || name.includes('rate') || name.includes('%')) {
			return 'percentage';
		}
		if (name.includes('rating') || name.includes('score') || name.includes('stars')) {
			return 'rating';
		}
		return 'default';
	}

	// Format based on detected type
	function getFormattedValue(num: number, type: string): string {
		if (!isValidNumber) return 'Invalid number';
		
		switch (type) {
			case 'currency':
				return new Intl.NumberFormat('en-US', {
					style: 'currency',
					currency: 'USD'
				}).format(num);
			case 'percentage':
				return `${formatNumber(num)}%`;
			case 'rating':
				return `${formatNumber(num)} / 5`;
			default:
				return formatNumber(num);
		}
	}

	let numberType = $derived(getNumberType(field.name));
	let formattedValue = $derived(getFormattedValue(value, numberType));

	// Get appropriate icon based on number type
	function getIcon(type: string): string {
		switch (type) {
			case 'currency':
				return 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1'; // Dollar sign
			case 'percentage':
				return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'; // Percentage/progress
			case 'rating':
				return 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z'; // Star
			default:
				return 'M7 20l4-16m2 16l4-16M6 9h14M4 15h14'; // Hash/number
		}
	}

	let iconPath = $derived(getIcon(numberType));
</script>

{#if isValidNumber}
	<div class="number-field-renderer {className}">
		{#if shouldShowLabel}
			<div class="field-label text-sm font-medium text-muted-foreground mb-2">
				{field.label}
			</div>
		{/if}
		
		<div class="field-value">
			<span 
				class="inline-flex items-center gap-2 font-mono font-medium"
				class:text-sm={renderMode === 'excerpt'}
				class:text-base={renderMode === 'preview'}
				class:text-lg={renderMode === 'full'}
			>
				<svg 
					class="w-4 h-4 text-muted-foreground flex-shrink-0" 
					class:w-3={renderMode === 'excerpt'}
					class:h-3={renderMode === 'excerpt'}
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
				
				<span class="text-foreground">
					{formattedValue}
				</span>
			</span>
		</div>
	</div>
{:else}
	<div class="number-field-renderer {className}">
		{#if shouldShowLabel}
			<div class="field-label text-sm font-medium text-muted-foreground mb-2">
				{field.label}
			</div>
		{/if}
		
		<div class="field-value">
			<span class="inline-flex items-center gap-2 text-muted-foreground">
				<svg 
					class="w-4 h-4 flex-shrink-0" 
					fill="none" 
					stroke="currentColor" 
					viewBox="0 0 24 24"
					aria-hidden="true"
				>
					<path 
						stroke-linecap="round" 
						stroke-linejoin="round" 
						stroke-width="2" 
						d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
					/>
				</svg>
				Invalid number
			</span>
		</div>
	</div>
{/if}

<style>
	.number-field-renderer {
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
		.field-value span {
			@apply text-sm;
		}
		
		.field-value svg {
			@apply w-3 h-3;
		}
	}

	/* Print styles */
	@media print {
		.field-label {
			color: #666 !important;
		}
		
		.field-value span {
			color: black !important;
		}
		
		.field-value svg {
			display: none;
		}
	}

	/* High contrast mode support */
	@media (prefers-contrast: high) {
		.field-label {
			font-weight: bold;
		}
	}
</style>