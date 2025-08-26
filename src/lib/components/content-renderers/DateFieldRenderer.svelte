<script lang="ts">
	import type { ContentField } from '$lib/db/models';

	interface Props {
		field: ContentField;
		value: string | Date;
		renderMode?: 'full' | 'preview' | 'excerpt';
		class?: string;
	}

	let {
		field,
		value,
		renderMode = 'full',
		class: className = ''
	}: Props = $props();

	// Parse date value
	let dateValue = $derived(value instanceof Date ? value : new Date(value));
	let isValidDate = $derived(!isNaN(dateValue.getTime()));
	let shouldShowLabel = $derived(field.label && field.label !== field.name && renderMode === 'full');

	// Format date based on render mode
	function formatDate(date: Date, mode: string): string {
		if (!isValidDate) return 'Invalid date';
		
		const options: Intl.DateTimeFormatOptions = mode === 'excerpt'
			? { month: 'short', day: 'numeric', year: 'numeric' }
			: mode === 'preview'
			? { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }
			: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
		
		return date.toLocaleDateString('en-US', options);
	}

	// Get relative time (e.g., "2 days ago")
	function getRelativeTime(date: Date): string {
		if (!isValidDate) return '';
		
		const now = new Date();
		const diffInMs = now.getTime() - date.getTime();
		const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
		
		if (diffInDays === 0) return 'Today';
		if (diffInDays === 1) return 'Yesterday';
		if (diffInDays === -1) return 'Tomorrow';
		if (diffInDays > 0 && diffInDays < 7) return `${diffInDays} days ago`;
		if (diffInDays < 0 && diffInDays > -7) return `In ${Math.abs(diffInDays)} days`;
		
		return '';
	}

	let formattedDate = $derived(formatDate(dateValue, renderMode));
	let relativeTime = $derived(getRelativeTime(dateValue));
	let showRelativeTime = $derived(renderMode === 'full' && relativeTime);
</script>

{#if isValidDate}
	<div class="date-field-renderer {className}">
		{#if shouldShowLabel}
			<div class="field-label text-sm font-medium text-muted-foreground mb-2">
				{field.label}
			</div>
		{/if}
		
		<div class="field-value">
			<time 
				datetime={dateValue.toISOString()}
				class="inline-flex items-center gap-2 text-foreground"
				class:text-sm={renderMode === 'excerpt'}
				class:text-base={renderMode !== 'excerpt'}
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
						d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
					/>
				</svg>
				
				<span class="font-medium">
					{formattedDate}
				</span>
				
				{#if showRelativeTime}
					<span class="text-sm text-muted-foreground">
						({relativeTime})
					</span>
				{/if}
			</time>
		</div>
	</div>
{:else}
	<div class="date-field-renderer {className}">
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
				Invalid date
			</span>
		</div>
	</div>
{/if}

<style>
	.date-field-renderer {
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
		.field-value time {
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
		
		.field-value time {
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