<script lang="ts">
	interface SkipLink {
		href: string;
		label: string;
	}

	interface Props {
		links?: SkipLink[];
	}

	let {
		links = [
			{ href: '#main-content', label: 'Skip to main content' },
			{ href: '#navigation', label: 'Skip to navigation' },
			{ href: '#footer', label: 'Skip to footer' }
		]
	}: Props = $props();

	function handleSkipClick(event: MouseEvent, href: string) {
		event.preventDefault();
		
		const target = document.querySelector(href);
		if (target) {
			// Make target focusable if it isn't already
			if (!target.hasAttribute('tabindex')) {
				target.setAttribute('tabindex', '-1');
			}
			
			// Focus the target element
			(target as HTMLElement).focus();
			
			// Scroll to target
			target.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}
</script>

<!-- Skip Navigation Links -->
<div class="skip-navigation" aria-label="Skip navigation links">
	{#each links as link}
		<a
			href={link.href}
			class="skip-link"
			onclick={(e) => handleSkipClick(e, link.href)}
		>
			{link.label}
		</a>
	{/each}
</div>

<style>
	.skip-navigation {
		position: relative;
		z-index: 9999;
	}

	.skip-link {
		position: absolute;
		top: -40px;
		left: 6px;
		background: hsl(var(--primary));
		color: hsl(var(--primary-foreground));
		padding: 8px 16px;
		text-decoration: none;
		border-radius: 4px;
		font-weight: 600;
		font-size: 14px;
		box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
		transition: top 0.3s ease;
		z-index: 10000;
	}

	.skip-link:focus {
		top: 6px;
		outline: 2px solid hsl(var(--ring));
		outline-offset: 2px;
	}

	.skip-link:hover:focus {
		background: hsl(var(--primary) / 0.9);
	}

	/* Ensure skip links are always visible when focused */
	.skip-link:focus {
		clip: auto !important;
		height: auto !important;
		margin: 0 !important;
		overflow: visible !important;
		position: absolute !important;
		width: auto !important;
		white-space: normal !important;
	}
</style>