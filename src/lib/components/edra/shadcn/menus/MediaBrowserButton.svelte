<!-- MediaBrowserButton.svelte - Media browser button for Edra toolbar -->
<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import type { Editor } from '@tiptap/core';
	import MediaBrowserDialog from '$lib/components/MediaBrowserDialog.svelte';
	import type { MediaFile } from '$lib/db/models';
	
	// Icons
	import ImageIcon from '@lucide/svelte/icons/image';

	interface Props {
		editor: Editor;
		class?: string;
	}

	let { editor, class: className = '' }: Props = $props();

	// State
	let showMediaBrowser = $state(false);

	// Insert image into editor
	function insertImage(file: MediaFile) {
		const url = file.s3Url;
		const alt = file.altText || file.filename;
		
		editor
			.chain()
			.focus()
			.setImage({ 
				src: url, 
				alt: alt,
				title: file.filename
			})
			.run();
	}

	// Insert video into editor
	function insertVideo(file: MediaFile) {
		const url = file.s3Url;
		
		// Insert as HTML for video support
		const videoHtml = `<video controls style="max-width: 100%; height: auto;">
			<source src="${url}" type="${file.mimeType}">
			Your browser does not support the video tag.
		</video>`;
		
		editor
			.chain()
			.focus()
			.insertContent(videoHtml)
			.run();
	}

	// Handle media selection
	function handleMediaSelect(files: MediaFile[]) {
		files.forEach(file => {
			if (file.mimeType.startsWith('image/')) {
				insertImage(file);
			} else if (file.mimeType.startsWith('video/')) {
				insertVideo(file);
			} else {
				// For other file types, insert as link
				const linkHtml = `<a href="${file.s3Url}" target="_blank" rel="noopener noreferrer">${file.filename}</a>`;
				editor
					.chain()
					.focus()
					.insertContent(linkHtml)
					.run();
			}
		});
		
		showMediaBrowser = false;
	}

	// Open media browser
	function openMediaBrowser() {
		showMediaBrowser = true;
	}
</script>

<Button
	variant="ghost"
	size="sm"
	onclick={openMediaBrowser}
	class={cn(
		'h-8 w-8 p-0 transition-colors duration-200',
		'hover:bg-accent hover:text-accent-foreground',
		'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
		className
	)}
	aria-label="Insert media"
	title="Insert media (Ctrl+Shift+M)"
>
	<ImageIcon class="h-4 w-4" />
</Button>

<!-- Media Browser Dialog -->
<MediaBrowserDialog
	bind:open={showMediaBrowser}
	multiple={true}
	accept={['image/*', 'video/*', 'audio/*']}
	onSelect={handleMediaSelect}
	onClose={() => showMediaBrowser = false}
/>