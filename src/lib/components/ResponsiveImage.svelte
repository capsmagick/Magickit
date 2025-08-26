<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { getOptimizedImageSources, generatePlaceholderDataUrl, preloadImage } from '$lib/utils/image-helpers';

	interface Props {
		src: string;
		alt: string;
		width?: number;
		height?: number;
		class?: string;
		loading?: 'lazy' | 'eager';
		sizes?: string;
		srcset?: string;
		placeholder?: string;
		webpSrc?: string;
		avifSrc?: string;
		fallbackSrc?: string;
		objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none';
		priority?: boolean;
	}

	let {
		src,
		alt,
		width,
		height,
		class: className = '',
		loading = 'lazy',
		sizes,
		srcset,
		placeholder,
		webpSrc,
		avifSrc,
		fallbackSrc,
		objectFit = 'cover',
		priority = false
	}: Props = $props();

	let imageElement = $state<HTMLImageElement>();
	let isLoaded = $state(false);
	let hasError = $state(false);
	let isIntersecting = $state(false);

	// Use eager loading for priority images or when loading is set to eager
	const shouldLoadEagerly = priority || loading === 'eager';

	// Get optimized image sources
	const optimizedSources = getOptimizedImageSources(src, { 
		width, 
		height, 
		generateResponsive: !width || !height 
	});

	// Use provided sources or fall back to optimized ones
	const finalWebpSrc = webpSrc || optimizedSources.webp;
	const finalAvifSrc = avifSrc || optimizedSources.avif;
	const finalFallbackSrc = fallbackSrc || optimizedSources.fallback;
	const finalSrcset = srcset || optimizedSources.srcset;
	const finalSizes = sizes || optimizedSources.sizes || '100vw';

	// Generate placeholder if not provided
	const finalPlaceholder = placeholder || generatePlaceholderDataUrl(width || 20, height || 20);

	// Preload priority images
	onMount(() => {
		if (priority && browser) {
			preloadImage(finalAvifSrc || finalWebpSrc || src);
		}
	});

	// Intersection Observer for lazy loading
	onMount(() => {
		if (!browser || shouldLoadEagerly) {
			isIntersecting = true;
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						isIntersecting = true;
						observer.unobserve(entry.target);
					}
				});
			},
			{
				rootMargin: '50px' // Start loading 50px before the image enters viewport
			}
		);

		if (imageElement) {
			observer.observe(imageElement);
		}

		return () => {
			observer.disconnect();
		};
	});

	function handleLoad() {
		isLoaded = true;
	}

	function handleError() {
		hasError = true;
		isLoaded = true;
	}

	// Determine which source to use
	const shouldLoad = $derived(shouldLoadEagerly || isIntersecting);
	const imageSrc = $derived(shouldLoad ? (hasError ? finalFallbackSrc : src) : finalPlaceholder);
	const imageSrcset = $derived(shouldLoad ? finalSrcset : '');
</script>

<div 
	class="relative overflow-hidden {className}"
	style:aspect-ratio={width && height ? `${width} / ${height}` : undefined}
>
	{#if shouldLoad}
		<!-- Modern format support with picture element -->
		{#if finalWebpSrc || finalAvifSrc}
			<picture>
				{#if finalAvifSrc}
					<source srcset={finalAvifSrc} sizes={finalSizes} type="image/avif" />
				{/if}
				{#if finalWebpSrc}
					<source srcset={finalWebpSrc} sizes={finalSizes} type="image/webp" />
				{/if}
				<img
					bind:this={imageElement}
					src={imageSrc}
					{alt}
					{width}
					{height}
					srcset={imageSrcset}
					sizes={finalSizes}
					loading={shouldLoadEagerly ? 'eager' : 'lazy'}
					decoding="async"
					onload={handleLoad}
					onerror={handleError}
					class="w-full h-full transition-opacity duration-300 {isLoaded ? 'opacity-100' : 'opacity-0'}"
					style:object-fit={objectFit}
				/>
			</picture>
		{:else}
			<!-- Standard img element -->
			<img
				bind:this={imageElement}
				src={imageSrc}
				{alt}
				{width}
				{height}
				srcset={imageSrcset}
				sizes={finalSizes}
				loading={shouldLoadEagerly ? 'eager' : 'lazy'}
				decoding="async"
				onload={handleLoad}
				onerror={handleError}
				class="w-full h-full transition-opacity duration-300 {isLoaded ? 'opacity-100' : 'opacity-0'}"
				style:object-fit={objectFit}
			/>
		{/if}
	{:else}
		<!-- Placeholder while not in viewport -->
		<div 
			bind:this={imageElement}
			class="w-full h-full bg-muted animate-pulse flex items-center justify-center"
			role="img"
			aria-label={alt}
		>
			{#if finalPlaceholder}
				<img
					src={finalPlaceholder}
					{alt}
					class="w-full h-full blur-sm scale-110 transition-all duration-300"
					style:object-fit={objectFit}
				/>
			{:else}
				<div class="w-8 h-8 bg-muted-foreground/20 rounded"></div>
			{/if}
		</div>
	{/if}

	<!-- Loading indicator -->
	{#if !isLoaded && shouldLoad}
		<div class="absolute inset-0 flex items-center justify-center bg-muted/50">
			<div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
		</div>
	{/if}

	<!-- Error state -->
	{#if hasError}
		<div class="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
			<div class="text-center space-y-2">
				<div class="w-8 h-8 mx-auto bg-muted-foreground/20 rounded"></div>
				<p class="text-sm">Failed to load image</p>
			</div>
		</div>
	{/if}
</div>

<style>
	/* Ensure images don't cause layout shift */
	img {
		max-width: 100%;
		height: auto;
	}

	/* Smooth loading animation */
	.transition-opacity {
		transition-property: opacity;
		transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
		transition-duration: 300ms;
	}

	/* Blur effect for placeholder */
	.blur-sm {
		filter: blur(4px);
	}

	.scale-110 {
		transform: scale(1.1);
	}
</style>