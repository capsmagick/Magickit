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

	// Sanitize HTML content for security
	function sanitizeHtml(html: string): string {
		// Basic HTML sanitization - in production, use a proper library like DOMPurify
		return html
			.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
			.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
			.replace(/on\w+="[^"]*"/gi, '')
			.replace(/on\w+='[^']*'/gi, '')
			.replace(/javascript:/gi, '');
	}

	// Truncate HTML content for excerpt mode
	function truncateHtml(html: string, maxLength: number = 300): string {
		// Strip HTML tags for length calculation
		const textContent = html.replace(/<[^>]*>/g, '');
		
		if (textContent.length <= maxLength) return html;
		
		// Simple truncation - in production, use a proper HTML truncation library
		const truncatedText = textContent.substring(0, maxLength);
		const lastSpace = truncatedText.lastIndexOf(' ');
		const finalLength = lastSpace > 0 ? lastSpace : maxLength;
		
		// Find the position in the original HTML
		let charCount = 0;
		let htmlIndex = 0;
		let inTag = false;
		
		while (charCount < finalLength && htmlIndex < html.length) {
			const char = html[htmlIndex];
			
			if (char === '<') {
				inTag = true;
			} else if (char === '>') {
				inTag = false;
			} else if (!inTag) {
				charCount++;
			}
			
			htmlIndex++;
		}
		
		return html.substring(0, htmlIndex) + '...';
	}

	let sanitizedValue = $derived(sanitizeHtml(value));
	let displayValue = $derived(renderMode === 'excerpt' 
		? truncateHtml(sanitizedValue, 300)
		: renderMode === 'preview'
		? truncateHtml(sanitizedValue, 600)
		: sanitizedValue);
	let shouldShowLabel = $derived(field.label && field.label !== field.name && renderMode === 'full');
</script>

{#if value && value.trim()}
	<div class="richtext-field-renderer {className}">
		{#if shouldShowLabel}
			<div class="field-label" style="font-size: 0.875rem; font-weight: 500; color: hsl(var(--muted-foreground)); margin-bottom: 0.75rem;">
				{field.label}
			</div>
		{/if}
		
		<div 
			class="field-value prose prose-gray max-w-none"
			class:prose-sm={renderMode === 'excerpt'}
			class:prose-base={renderMode === 'preview'}
			class:prose-lg={renderMode === 'full'}
		>
			{@html displayValue}
		</div>
	</div>
{/if}

<style>
	.richtext-field-renderer {
		/* Ensure proper text rendering */
		text-rendering: optimizeLegibility;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
	}

	/* Custom prose styling to match design system */
	:global(.richtext-field-renderer .prose) {
		color: hsl(var(--foreground));
	}

	:global(.richtext-field-renderer .prose h1) {
		font-size: 1.875rem;
		font-weight: 700;
		margin-bottom: 1rem;
		margin-top: 2rem;
		color: hsl(var(--foreground));
	}

	:global(.richtext-field-renderer .prose h1:first-child) {
		margin-top: 0;
	}

	:global(.richtext-field-renderer .prose h2) {
		font-size: 1.5rem;
		font-weight: 700;
		margin-bottom: 0.75rem;
		margin-top: 1.5rem;
		color: hsl(var(--foreground));
	}

	:global(.richtext-field-renderer .prose h2:first-child) {
		margin-top: 0;
	}

	:global(.richtext-field-renderer .prose h3) {
		font-size: 1.25rem;
		font-weight: 700;
		margin-bottom: 0.75rem;
		margin-top: 1.5rem;
		color: hsl(var(--foreground));
	}

	:global(.richtext-field-renderer .prose h3:first-child) {
		margin-top: 0;
	}

	:global(.richtext-field-renderer .prose h4) {
		font-size: 1.125rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
		margin-top: 1rem;
		color: hsl(var(--foreground));
	}

	:global(.richtext-field-renderer .prose h4:first-child) {
		margin-top: 0;
	}

	:global(.richtext-field-renderer .prose h5) {
		font-size: 1rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
		margin-top: 1rem;
		color: hsl(var(--foreground));
	}

	:global(.richtext-field-renderer .prose h5:first-child) {
		margin-top: 0;
	}

	:global(.richtext-field-renderer .prose h6) {
		font-size: 0.875rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
		margin-top: 1rem;
		color: hsl(var(--foreground));
	}

	:global(.richtext-field-renderer .prose h6:first-child) {
		margin-top: 0;
	}

	:global(.richtext-field-renderer .prose p) {
		margin-bottom: 1rem;
		line-height: 1.625;
		color: hsl(var(--foreground));
	}

	:global(.richtext-field-renderer .prose ul) {
		margin-bottom: 1rem;
		padding-left: 1.5rem;
	}

	:global(.richtext-field-renderer .prose ul > li + li) {
		margin-top: 0.25rem;
	}

	:global(.richtext-field-renderer .prose ol) {
		margin-bottom: 1rem;
		padding-left: 1.5rem;
	}

	:global(.richtext-field-renderer .prose ol > li + li) {
		margin-top: 0.25rem;
	}

	:global(.richtext-field-renderer .prose li) {
		color: hsl(var(--foreground));
	}

	:global(.richtext-field-renderer .prose blockquote) {
		border-left: 4px solid hsl(var(--border));
		padding-left: 1rem;
		font-style: italic;
		color: hsl(var(--muted-foreground));
		margin-bottom: 1rem;
	}

	:global(.richtext-field-renderer .prose code) {
		background-color: hsl(var(--muted));
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		font-size: 0.875rem;
		font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
	}

	:global(.richtext-field-renderer .prose pre) {
		background-color: hsl(var(--muted));
		padding: 1rem;
		border-radius: 0.5rem;
		overflow-x: auto;
		margin-bottom: 1rem;
	}

	:global(.richtext-field-renderer .prose pre code) {
		background-color: transparent;
		padding: 0;
	}

	:global(.richtext-field-renderer .prose a) {
		color: hsl(var(--primary));
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	:global(.richtext-field-renderer .prose a:hover) {
		color: hsl(var(--primary) / 0.8);
	}

	:global(.richtext-field-renderer .prose img) {
		border-radius: 0.5rem;
		margin-bottom: 1rem;
		max-width: 100%;
		height: auto;
	}

	:global(.richtext-field-renderer .prose table) {
		width: 100%;
		border-collapse: collapse;
		border: 1px solid hsl(var(--border));
		margin-bottom: 1rem;
	}

	:global(.richtext-field-renderer .prose th) {
		border: 1px solid hsl(var(--border));
		padding: 0.75rem;
		background-color: hsl(var(--muted));
		font-weight: 600;
		text-align: left;
	}

	:global(.richtext-field-renderer .prose td) {
		border: 1px solid hsl(var(--border));
		padding: 0.75rem;
	}

	:global(.richtext-field-renderer .prose hr) {
		border: 0;
		border-top: 1px solid hsl(var(--border));
		margin: 2rem 0;
	}

	/* Responsive adjustments */
	@media (max-width: 640px) {
		:global(.richtext-field-renderer .prose) {
			font-size: 0.875rem;
		}

		:global(.richtext-field-renderer .prose h1) {
			font-size: 1.5rem;
		}

		:global(.richtext-field-renderer .prose h2) {
			font-size: 1.25rem;
		}

		:global(.richtext-field-renderer .prose h3) {
			font-size: 1.125rem;
		}
	}

	/* Print styles */
	@media print {
		:global(.richtext-field-renderer .prose) {
			color: black !important;
		}

		:global(.richtext-field-renderer .prose h1),
		:global(.richtext-field-renderer .prose h2),
		:global(.richtext-field-renderer .prose h3),
		:global(.richtext-field-renderer .prose h4),
		:global(.richtext-field-renderer .prose h5),
		:global(.richtext-field-renderer .prose h6) {
			color: black !important;
		}

		:global(.richtext-field-renderer .prose a) {
			color: black !important;
			text-decoration: underline !important;
		}
	}

	/* High contrast mode support */
	@media (prefers-contrast: high) {
		:global(.richtext-field-renderer .prose blockquote) {
			border-left-color: currentColor;
		}

		:global(.richtext-field-renderer .prose code) {
			background-color: transparent;
			border: 1px solid currentColor;
		}
	}
</style>