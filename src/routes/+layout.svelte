<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from '$lib/components/ui/sonner';
	import Header from '$lib/components/header.svelte';
	import Footer from '$lib/components/footer.svelte';
	import SkipNavigation from '$lib/components/SkipNavigation.svelte';
	import { page } from '$app/stores';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<ModeWatcher />

<!-- Skip Navigation -->
<SkipNavigation />

<!-- Page Structure with Semantic Landmarks -->
{#if !$page.url.pathname.startsWith('/admin')}
	<Header />
{/if}

<main id="main-content" tabindex="-1" aria-label="Main content">
	{@render children?.()}
</main>

{#if !$page.url.pathname.startsWith('/admin')}
	<Footer />
{/if}

<!-- Toast notifications -->
<Toaster />
