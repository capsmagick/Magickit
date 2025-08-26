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

	let shouldShowLabel = $derived(field.label && field.label !== field.name && renderMode === 'full');

	// Validate email format
	function isValidEmail(email: string): boolean {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}

	// Extract domain from email
	function getDomain(email: string): string {
		const parts = email.split('@');
		return parts.length === 2 ? parts[1] : '';
	}

	// Truncate email for display
	function truncateEmail(email: string, maxLength: number): string {
		if (email.length <= maxLength) return email;
		
		const [localPart, domain] = email.split('@');
		if (!domain) return email.substring(0, maxLength) + '...';
		
		const availableLength = maxLength - domain.length - 4; // -4 for '@' and '...'
		if (availableLength <= 0) return '...' + email.substring(email.length - maxLength + 3);
		
		return localPart.substring(0, availableLength) + '...@' + domain;
	}

	let isValid = $derived(isValidEmail(value));
	let domain = $derived(isValid ? getDomain(value) : '');
	let displayText = $derived(renderMode === 'excerpt' 
		? truncateEmail(value, 25)
		: renderMode === 'preview'
		? truncateEmail(value, 40)
		: value);
</script>

{#if value && value.trim()}
	<div class="email-field-renderer {className}">
		{#if shouldShowLabel}
			<div class="field-label text-sm font-medium text-muted-foreground mb-2">
				{field.label}
			</div>
		{/if}
		
		<div class="field-value">
			{#if isValid}
				<a 
					href="mailto:{value}"
					class="inline-flex items-center gap-2 text-primary hover:text-primary/80 underline underline-offset-2 transition-colors duration-200"
					class:text-sm={renderMode === 'excerpt'}
					class:text-base={renderMode !== 'excerpt'}
				>
					<svg 
						class="w-4 h-4 flex-shrink-0" 
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
							d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
						/>
					</svg>
					
					<span class="break-all font-mono">
						{displayText}
					</span>
					
					{#if renderMode === 'full' && domain}
						<span class="text-xs text-muted-foreground">
							({domain})
						</span>
					{/if}
				</a>
			{:else}
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
					
					<span class="break-all font-mono">
						{displayText} (Invalid email)
					</span>
				</span>
			{/if}
		</div>
	</div>
{/if}

<style>
	.email-field-renderer {
		/* Ensure proper spacing */
		display: block;
	}

	.field-value {
		/* Ensure proper alignment */
		display: flex;
		align-items: flex-start;
	}

	/* Link styling */
	.field-value a {
		/* Improve link accessibility */
		text-decoration-thickness: 1px;
		text-underline-offset: 2px;
	}

	.field-value a:hover {
		text-decoration-thickness: 2px;
	}

	.field-value a:focus {
		outline: 2px solid hsl(var(--primary));
		outline-offset: 2px;
		border-radius: 2px;
	}

	/* Responsive adjustments */
	@media (max-width: 640px) {
		.field-value a,
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
		
		.field-value a {
			color: black !important;
			text-decoration: underline !important;
		}
		
		.field-value a::after {
			content: ' (' attr(href) ')';
			font-size: 0.8em;
			color: #666;
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
		
		.field-value a {
			text-decoration-thickness: 2px;
		}
	}
</style>