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

	// Validate and parse URL
	function parseUrl(url: string): { isValid: boolean; displayText: string; href: string; domain?: string; } {
		try {
			// Add protocol if missing
			const urlWithProtocol = url.startsWith('http') ? url : `https://${url}`;
			const parsedUrl = new URL(urlWithProtocol);
			
			return {
				isValid: true,
				displayText: url,
				href: parsedUrl.href,
				domain: parsedUrl.hostname
			};
		} catch {
			return {
				isValid: false,
				displayText: url,
				href: '#'
			};
		}
	}

	// Truncate URL for display
	function truncateUrl(url: string, maxLength: number): string {
		if (url.length <= maxLength) return url;
		
		const start = url.substring(0, maxLength / 2);
		const end = url.substring(url.length - maxLength / 2);
		
		return `${start}...${end}`;
	}

	let urlData = $derived(parseUrl(value));
	let displayText = $derived(renderMode === 'excerpt' 
		? truncateUrl(urlData.displayText, 30)
		: renderMode === 'preview'
		? truncateUrl(urlData.displayText, 50)
		: urlData.displayText);
</script>

{#if value && value.trim()}
	<div class="url-field-renderer {className}">
		{#if shouldShowLabel}
			<div class="field-label text-sm font-medium text-muted-foreground mb-2">
				{field.label}
			</div>
		{/if}
		
		<div class="field-value">
			{#if urlData.isValid}
				<a 
					href={urlData.href}
					target="_blank"
					rel="noopener noreferrer"
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
							d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
						/>
					</svg>
					
					<span class="break-all">
						{displayText}
					</span>
					
					{#if renderMode === 'full' && urlData.domain}
						<span class="text-xs text-muted-foreground">
							({urlData.domain})
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
					
					<span class="break-all">
						{displayText} (Invalid URL)
					</span>
				</span>
			{/if}
		</div>
	</div>
{/if}

<style>
	.url-field-renderer {
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
			font-size: 0.875rem;
		}
		
		.field-value svg {
			width: 0.75rem;
			height: 0.75rem;
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