<script lang="ts">
	import type { ContentField } from '$lib/db/models';

	interface Props {
		field: ContentField;
		value: string | { url: string; poster?: string; caption?: string; autoplay?: boolean; controls?: boolean; };
		renderMode?: 'full' | 'preview' | 'excerpt';
		class?: string;
	}

	let {
		field,
		value,
		renderMode = 'full',
		class: className = ''
	}: Props = $props();

	// Parse video value - can be string URL or object with metadata
	let videoData = $derived(typeof value === 'string' 
		? { url: value, controls: true, autoplay: false }
		: { controls: true, autoplay: false, ...value });

	let shouldShowLabel = $derived(field.label && field.label !== field.name && renderMode === 'full');
	let shouldShowCaption = $derived(videoData.caption && renderMode !== 'excerpt');

	// Determine if it's a YouTube/Vimeo embed or direct video file
	let isYouTube = $derived(videoData.url.includes('youtube.com') || videoData.url.includes('youtu.be'));
	let isVimeo = $derived(videoData.url.includes('vimeo.com'));
	let isEmbed = $derived(isYouTube || isVimeo);

	// Convert YouTube/Vimeo URLs to embed format
	function getEmbedUrl(url: string): string {
		if (isYouTube) {
			const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
			return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
		}
		
		if (isVimeo) {
			const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
			return videoId ? `https://player.vimeo.com/video/${videoId}` : url;
		}
		
		return url;
	}

	let embedUrl = $derived(isEmbed ? getEmbedUrl(videoData.url) : videoData.url);

	// Determine video dimensions based on render mode
	let videoDimensions = $derived(renderMode === 'excerpt' 
		? { width: '300', height: '169' } // 16:9 aspect ratio
		: renderMode === 'preview'
		? { width: '480', height: '270' }
		: { width: '100%', height: 'auto' });
</script>

{#if videoData?.url}
	<figure class="video-field-renderer {className}">
		{#if shouldShowLabel}
			<div class="field-label" style="font-size: 0.875rem; font-weight: 500; color: hsl(var(--muted-foreground)); margin-bottom: 0.75rem;">
				{field.label}
			</div>
		{/if}
		
		<div 
			class="video-container"
			class:max-w-sm={renderMode === 'excerpt'}
			class:max-w-md={renderMode === 'preview'}
			class:max-w-full={renderMode === 'full'}
		>
			{#if isEmbed}
				<!-- Embedded video (YouTube, Vimeo) -->
				<div class="video-embed aspect-video">
					<iframe
						src={embedUrl}
						title={field.label || 'Video'}
						width={videoDimensions.width}
						height={videoDimensions.height}
						frameborder="0"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
						allowfullscreen
						class="w-full h-full rounded-lg"
						loading={renderMode === 'excerpt' ? 'lazy' : 'eager'}
					></iframe>
				</div>
			{:else}
				<!-- Direct video file -->
				<video
					src={videoData.url}
					poster={videoData.poster}
					controls={videoData.controls}
					autoplay={videoData.autoplay && renderMode === 'full'}
					muted={videoData.autoplay} 
					preload={renderMode === 'full' ? 'metadata' : 'none'}
					class="w-full h-auto rounded-lg shadow-sm"
					style="max-width: {videoDimensions.width}; max-height: {videoDimensions.height};"
				>
					<track kind="captions" />
					Your browser does not support the video tag.
				</video>
			{/if}
		</div>
		
		{#if shouldShowCaption}
			<figcaption class="video-caption mt-2 text-sm text-muted-foreground text-center">
				{videoData.caption}
			</figcaption>
		{/if}
	</figure>
{/if}

<style>
	.video-field-renderer {
		/* Ensure proper spacing and alignment */
		display: block;
		margin: 0;
	}

	.video-container {
		/* Center videos and ensure responsive behavior */
		margin: 0 auto;
		display: block;
	}

	.video-embed {
		/* Maintain aspect ratio for embedded videos */
		position: relative;
		width: 100%;
		height: 0;
		padding-bottom: 56.25%; /* 16:9 aspect ratio */
		overflow: hidden;
		border-radius: 0.5rem;
	}

	.video-embed iframe {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}

	.video-caption {
		/* Improve caption readability */
		line-height: 1.4;
		font-style: italic;
	}

	/* Responsive adjustments */
	@media (max-width: 640px) {
		.video-container {
			max-width: 100% !important;
		}
		
		.video-caption {
			@apply text-xs;
		}
	}

	/* Print styles */
	@media print {
		.field-label {
			color: #666 !important;
		}
		
		.video-caption {
			color: #666 !important;
		}
		
		/* Hide videos in print and show placeholder */
		.video-container::after {
			content: '[Video: ' attr(title) ']';
			display: block;
			padding: 2rem;
			text-align: center;
			border: 2px dashed #ccc;
			color: #666;
		}
		
		video,
		iframe {
			display: none;
		}
	}

	/* High contrast mode support */
	@media (prefers-contrast: high) {
		.field-label {
			font-weight: bold;
		}
		
		video,
		.video-embed {
			border: 1px solid currentColor;
		}
	}

	/* Reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		video {
			/* Disable autoplay for users who prefer reduced motion */
			autoplay: false !important;
		}
	}

	/* Focus styles for accessibility */
	video:focus,
	iframe:focus {
		outline: 2px solid hsl(var(--primary));
		outline-offset: 2px;
	}
</style>