<!-- MediaPicker.svelte - Reusable media picker component for forms -->
<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Badge } from '$lib/components/ui/badge';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { cn } from '$lib/utils';
	import MediaBrowserDialog from './MediaBrowserDialog.svelte';
	import type { MediaFile } from '$lib/db/models';
	
	// Icons
	import ImageIcon from '@lucide/svelte/icons/image';
	import VideoIcon from '@lucide/svelte/icons/video';
	import FileIcon from '@lucide/svelte/icons/file';
	import XIcon from '@lucide/svelte/icons/x';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';

	interface Props {
		value?: MediaFile | MediaFile[] | string | string[];
		multiple?: boolean;
		accept?: string[];
		maxSize?: number;
		label?: string;
		placeholder?: string;
		disabled?: boolean;
		required?: boolean;
		allowUrl?: boolean; // Allow manual URL input
		onValueChange: (value: MediaFile | MediaFile[] | string | string[] | null) => void;
		class?: string;
	}

	let {
		value = $bindable(),
		multiple = false,
		accept = ['image/*'],
		maxSize = 10 * 1024 * 1024,
		label = 'Media',
		placeholder = 'Select media files...',
		disabled = false,
		required = false,
		allowUrl = false,
		onValueChange,
		class: className = ''
	}: Props = $props();

	// State
	let showMediaBrowser = $state(false);
	let urlInput = $state('');
	let showUrlInput = $state(false);

	// Computed values
	let selectedFiles = $derived.by(() => {
		if (!value) return [];
		if (Array.isArray(value)) {
			return value.filter(v => typeof v === 'object' && v !== null) as MediaFile[];
		}
		if (typeof value === 'object' && value !== null) {
			return [value as MediaFile];
		}
		return [];
	});

	let selectedUrls = $derived.by(() => {
		if (!value) return [];
		if (Array.isArray(value)) {
			return value.filter(v => typeof v === 'string') as string[];
		}
		if (typeof value === 'string') {
			return [value];
		}
		return [];
	});

	let hasSelection = $derived(selectedFiles.length > 0 || selectedUrls.length > 0);

	// Helper functions
	function getFileIcon(mimeType: string) {
		if (mimeType.startsWith('image/')) return ImageIcon;
		if (mimeType.startsWith('video/')) return VideoIcon;
		return FileIcon;
	}

	function getThumbnailUrl(file: MediaFile): string {
		const thumbnail = file.variants?.find(v => v.name === 'thumbnail');
		if (thumbnail) return thumbnail.s3Url;
		
		if (file.mimeType?.startsWith('image/')) {
			return file.s3Url;
		}
		
		return '';
	}

	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	// Event handlers
	function handleMediaSelect(files: MediaFile[]) {
		if (multiple) {
			const newValue = [...selectedFiles, ...files];
			if (allowUrl && selectedUrls.length > 0) {
				onValueChange([...newValue, ...selectedUrls]);
			} else {
				onValueChange(newValue);
			}
		} else {
			const newValue = files[0] || null;
			if (allowUrl && selectedUrls.length > 0) {
				onValueChange([newValue, ...selectedUrls]);
			} else {
				onValueChange(newValue);
			}
		}
		showMediaBrowser = false;
	}

	function handleRemoveFile(fileToRemove: MediaFile) {
		if (multiple) {
			const newFiles = selectedFiles.filter(f => f._id !== fileToRemove._id);
			if (allowUrl && selectedUrls.length > 0) {
				onValueChange([...newFiles, ...selectedUrls]);
			} else {
				onValueChange(newFiles.length > 0 ? newFiles : null);
			}
		} else {
			if (allowUrl && selectedUrls.length > 0) {
				onValueChange(selectedUrls);
			} else {
				onValueChange(null);
			}
		}
	}

	function handleRemoveUrl(urlToRemove: string) {
		if (multiple) {
			const newUrls = selectedUrls.filter(url => url !== urlToRemove);
			if (selectedFiles.length > 0) {
				onValueChange([...selectedFiles, ...newUrls]);
			} else {
				onValueChange(newUrls.length > 0 ? newUrls : null);
			}
		} else {
			if (selectedFiles.length > 0) {
				onValueChange(selectedFiles[0]);
			} else {
				onValueChange(null);
			}
		}
	}

	function handleAddUrl() {
		if (!urlInput.trim()) return;

		const url = urlInput.trim();
		
		if (multiple) {
			const newUrls = [...selectedUrls, url];
			if (selectedFiles.length > 0) {
				onValueChange([...selectedFiles, ...newUrls]);
			} else {
				onValueChange(newUrls);
			}
		} else {
			if (selectedFiles.length > 0) {
				onValueChange([selectedFiles[0], url]);
			} else {
				onValueChange(url);
			}
		}

		urlInput = '';
		showUrlInput = false;
	}

	function openMediaBrowser() {
		if (disabled) return;
		showMediaBrowser = true;
	}

	function openUrlInput() {
		if (disabled) return;
		showUrlInput = true;
	}
</script>

<div class={cn('space-y-2', className)}>
	{#if label}
		<Label class="text-sm font-medium">
			{label}
			{#if required}
				<span class="text-destructive">*</span>
			{/if}
		</Label>
	{/if}

	<!-- Selection Display -->
	{#if hasSelection}
		<div class="space-y-2">
			<!-- Selected Files -->
			{#each selectedFiles as file}
				{@const thumbnailUrl = getThumbnailUrl(file)}
				{@const FileIconComponent = getFileIcon(file.mimeType)}
				
				<Card class="transition-all duration-200">
					<CardContent class="p-3">
						<div class="flex items-center gap-3">
							<!-- Thumbnail/Icon -->
							<div class="w-12 h-12 rounded-lg overflow-hidden bg-muted flex items-center justify-center shrink-0">
								{#if thumbnailUrl}
									<img 
										src={thumbnailUrl} 
										alt={file.altText || file.filename}
										class="w-full h-full object-cover"
									/>
								{:else}
									<FileIconComponent class="h-6 w-6 text-muted-foreground" />
								{/if}
							</div>
							
							<!-- File Info -->
							<div class="flex-1 min-w-0">
								<p class="font-medium truncate" title={file.filename}>
									{file.filename}
								</p>
								<div class="flex items-center gap-2 mt-1">
									<Badge variant="secondary" class="text-xs">
										{file.mimeType?.split('/')[0] || 'file'}
									</Badge>
									<span class="text-sm text-muted-foreground">
										{formatFileSize(file.size)}
									</span>
									{#if file.width && file.height}
										<span class="text-sm text-muted-foreground">
											{file.width} × {file.height}
										</span>
									{/if}
								</div>
							</div>
							
							<!-- Actions -->
							<div class="flex items-center gap-1">
								{#if file.s3Url}
									<Button 
										variant="ghost" 
										size="icon" 
										class="h-8 w-8"
										onclick={() => window.open(file.s3Url, '_blank')}
										aria-label="View file"
									>
										<ExternalLinkIcon class="h-4 w-4" />
									</Button>
								{/if}
								<Button 
									variant="ghost" 
									size="icon" 
									class="h-8 w-8 text-destructive hover:text-destructive"
									onclick={() => handleRemoveFile(file)}
									disabled={disabled}
									aria-label="Remove file"
								>
									<XIcon class="h-4 w-4" />
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			{/each}

			<!-- Selected URLs -->
			{#each selectedUrls as url}
				<Card class="transition-all duration-200">
					<CardContent class="p-3">
						<div class="flex items-center gap-3">
							<!-- URL Icon -->
							<div class="w-12 h-12 rounded-lg overflow-hidden bg-muted flex items-center justify-center shrink-0">
								<ExternalLinkIcon class="h-6 w-6 text-muted-foreground" />
							</div>
							
							<!-- URL Info -->
							<div class="flex-1 min-w-0">
								<p class="font-medium truncate" title={url}>
									{url}
								</p>
								<Badge variant="outline" class="text-xs mt-1">
									External URL
								</Badge>
							</div>
							
							<!-- Actions -->
							<div class="flex items-center gap-1">
								<Button 
									variant="ghost" 
									size="icon" 
									class="h-8 w-8"
									onclick={() => window.open(url, '_blank')}
									aria-label="View URL"
								>
									<ExternalLinkIcon class="h-4 w-4" />
								</Button>
								<Button 
									variant="ghost" 
									size="icon" 
									class="h-8 w-8 text-destructive hover:text-destructive"
									onclick={() => handleRemoveUrl(url)}
									disabled={disabled}
									aria-label="Remove URL"
								>
									<XIcon class="h-4 w-4" />
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			{/each}
		</div>
	{/if}

	<!-- URL Input -->
	{#if showUrlInput}
		<Card class="transition-all duration-200">
			<CardContent class="p-3">
				<div class="flex gap-2">
					<Input
						bind:value={urlInput}
						placeholder="Enter media URL..."
						class="flex-1"
						onkeydown={(e) => e.key === 'Enter' && handleAddUrl()}
					/>
					<Button onclick={handleAddUrl} disabled={!urlInput.trim()}>
						Add
					</Button>
					<Button variant="outline" onclick={() => { showUrlInput = false; urlInput = ''; }}>
						Cancel
					</Button>
				</div>
			</CardContent>
		</Card>
	{/if}

	<!-- Action Buttons -->
	<div class="flex gap-2">
		<Button 
			variant="outline" 
			onclick={openMediaBrowser}
			disabled={disabled}
			class="transition-colors duration-200"
		>
			<PlusIcon class="mr-2 h-4 w-4" />
			{hasSelection ? 'Add More' : placeholder}
		</Button>
		
		{#if allowUrl}
			<Button 
				variant="outline" 
				onclick={openUrlInput}
				disabled={disabled || showUrlInput}
				class="transition-colors duration-200"
			>
				<ExternalLinkIcon class="mr-2 h-4 w-4" />
				Add URL
			</Button>
		{/if}
	</div>
</div>

<!-- Media Browser Dialog -->
<MediaBrowserDialog
	bind:open={showMediaBrowser}
	{multiple}
	{accept}
	{maxSize}
	onSelect={handleMediaSelect}
	onClose={() => showMediaBrowser = false}
/>