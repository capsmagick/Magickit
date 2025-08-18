<!-- MediaGrid.svelte -->
<script lang="ts">
  import { ScrollArea } from '$lib/components/ui/scroll-area';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { cn } from '$lib/utils';
  
  // Icons
  import ImageIcon from '@lucide/svelte/icons/image';
  import FileIcon from '@lucide/svelte/icons/file';
  import VideoIcon from '@lucide/svelte/icons/video';
  import AudioIcon from '@lucide/svelte/icons/audio-lines';
  import CheckIcon from '@lucide/svelte/icons/check';
  
  import type { MediaFile } from '$lib/db/models';

  interface Props {
    files: MediaFile[];
    view: 'grid' | 'list';
    multiple: boolean;
    selectedFiles: MediaFile[];
    onFileSelect: (file: MediaFile) => void;
  }

  let { 
    files, 
    view, 
    multiple, 
    selectedFiles, 
    onFileSelect 
  }: Props = $props();

  // Helper function to get file icon
  function getFileIcon(mimeType: string) {
    if (mimeType.startsWith('image/')) return ImageIcon;
    if (mimeType.startsWith('video/')) return VideoIcon;
    if (mimeType.startsWith('audio/')) return AudioIcon;
    return FileIcon;
  }

  // Helper function to format file size
  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Helper function to get thumbnail URL
  function getThumbnailUrl(file: MediaFile): string {
    // Look for thumbnail variant first
    const thumbnail = file.variants.find(v => v.name === 'thumbnail');
    if (thumbnail) return thumbnail.s3Url;
    
    // For images, use the original if no thumbnail
    if (file.mimeType.startsWith('image/')) {
      return file.s3Url;
    }
    
    // For other files, return empty string (will show icon instead)
    return '';
  }

  // Check if file is selected
  function isSelected(file: MediaFile): boolean {
    return selectedFiles.some(f => f._id === file._id);
  }

  // Handle file click
  function handleFileClick(file: MediaFile) {
    onFileSelect(file);
  }

  // Handle keyboard navigation
  function handleKeydown(event: KeyboardEvent, file: MediaFile) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleFileClick(file);
    }
  }
</script>

<ScrollArea class="h-full">
  {#if files.length === 0}
    <div class="flex flex-col items-center justify-center py-12 text-center">
      <ImageIcon class="h-12 w-12 text-muted-foreground mb-4" />
      <h3 class="text-lg font-medium text-muted-foreground mb-2">No media files found</h3>
      <p class="text-sm text-muted-foreground">
        Upload some files or try adjusting your search criteria.
      </p>
    </div>
  {:else if view === 'grid'}
    <!-- Grid View -->
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
      {#each files as file (file._id)}
        {@const selected = isSelected(file)}
        {@const thumbnailUrl = getThumbnailUrl(file)}
        {@const FileIconComponent = getFileIcon(file.mimeType)}
        
        <button
          class={cn(
            "relative group rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            selected 
              ? "border-primary bg-primary/5" 
              : "border-border hover:border-primary/50 hover:bg-accent/50"
          )}
          onclick={() => handleFileClick(file)}
          onkeydown={(e) => handleKeydown(e, file)}
          aria-label={`Select ${file.filename}`}
          role="option"
          aria-selected={selected}
        >
          <!-- Selection indicator -->
          {#if multiple}
            <div class={cn(
              "absolute top-2 right-2 z-10 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200",
              selected 
                ? "bg-primary border-primary text-primary-foreground" 
                : "bg-background border-border group-hover:border-primary/50"
            )}>
              {#if selected}
                <CheckIcon class="h-3 w-3" />
              {/if}
            </div>
          {/if}
          
          <!-- File preview -->
          <div class="aspect-square rounded-t-lg overflow-hidden bg-muted flex items-center justify-center">
            {#if thumbnailUrl}
              <img 
                src={thumbnailUrl} 
                alt={file.altText || file.filename}
                class="w-full h-full object-cover"
                loading="lazy"
              />
            {:else}
              <FileIconComponent class="h-8 w-8 text-muted-foreground" />
            {/if}
          </div>
          
          <!-- File info -->
          <div class="p-3 space-y-1">
            <p class="text-xs font-medium truncate" title={file.filename}>
              {file.filename}
            </p>
            <div class="flex items-center justify-between">
              <Badge variant="secondary" class="text-xs">
                {file.mimeType.split('/')[0]}
              </Badge>
              <span class="text-xs text-muted-foreground">
                {formatFileSize(file.size)}
              </span>
            </div>
          </div>
        </button>
      {/each}
    </div>
  {:else}
    <!-- List View -->
    <div class="divide-y divide-border">
      {#each files as file (file._id)}
        {@const selected = isSelected(file)}
        {@const thumbnailUrl = getThumbnailUrl(file)}
        {@const FileIconComponent = getFileIcon(file.mimeType)}
        
        <button
          class={cn(
            "w-full flex items-center gap-4 p-4 text-left transition-all duration-200 hover:bg-accent/50 focus:outline-none focus:bg-accent/50",
            selected && "bg-primary/5"
          )}
          onclick={() => handleFileClick(file)}
          onkeydown={(e) => handleKeydown(e, file)}
          aria-label={`Select ${file.filename}`}
          role="option"
          aria-selected={selected}
        >
          <!-- Selection indicator -->
          {#if multiple}
            <div class={cn(
              "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 shrink-0",
              selected 
                ? "bg-primary border-primary text-primary-foreground" 
                : "bg-background border-border"
            )}>
              {#if selected}
                <CheckIcon class="h-3 w-3" />
              {/if}
            </div>
          {/if}
          
          <!-- File thumbnail -->
          <div class="w-12 h-12 rounded-lg overflow-hidden bg-muted flex items-center justify-center shrink-0">
            {#if thumbnailUrl}
              <img 
                src={thumbnailUrl} 
                alt={file.altText || file.filename}
                class="w-full h-full object-cover"
                loading="lazy"
              />
            {:else}
              <FileIconComponent class="h-6 w-6 text-muted-foreground" />
            {/if}
          </div>
          
          <!-- File info -->
          <div class="flex-1 min-w-0">
            <p class="font-medium truncate" title={file.filename}>
              {file.filename}
            </p>
            <div class="flex items-center gap-2 mt-1">
              <Badge variant="secondary" class="text-xs">
                {file.mimeType.split('/')[0]}
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
          
          <!-- Upload date -->
          <div class="text-sm text-muted-foreground shrink-0">
            {new Date(file.createdAt).toLocaleDateString()}
          </div>
        </button>
      {/each}
    </div>
  {/if}
</ScrollArea>