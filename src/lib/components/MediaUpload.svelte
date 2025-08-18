<!-- MediaUpload.svelte -->
<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { cn } from '$lib/utils';
  
  // Icons
  import UploadIcon from '@lucide/svelte/icons/upload';
  import XIcon from '@lucide/svelte/icons/x';
  
  interface Props {
    accept?: string[];
    maxSize?: number;
    onUpload: (files: FileList) => void;
  }

  let { 
    accept = ['image/*'], 
    maxSize = 10 * 1024 * 1024, // 10MB default
    onUpload 
  }: Props = $props();

  let fileInput: HTMLInputElement;
  let isDragOver = $state(false);

  // Convert accept array to string for input element
  const acceptString = accept.join(',');

  // Handle file selection
  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      onUpload(target.files);
      // Reset input
      target.value = '';
    }
  }

  // Handle drag and drop
  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    isDragOver = true;
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    isDragOver = false;
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    isDragOver = false;
    
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      onUpload(event.dataTransfer.files);
    }
  }

  // Open file dialog
  function openFileDialog() {
    fileInput?.click();
  }

  // Format file size for display
  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
</script>

<!-- Hidden file input -->
<input
  bind:this={fileInput}
  type="file"
  {accept}
  multiple
  class="hidden"
  onchange={handleFileSelect}
/>

<!-- Upload button -->
<Button onclick={openFileDialog} class="gap-2">
  <UploadIcon class="h-4 w-4" />
  Upload Files
</Button>

<!-- Drag and drop overlay (when dragging) -->
{#if isDragOver}
  <div 
    class="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center"
    role="dialog"
    tabindex="-1"
    aria-label="File drop zone overlay"
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
  >
    <div class="bg-card border-2 border-dashed border-primary rounded-lg p-8 text-center max-w-md">
      <UploadIcon class="h-12 w-12 mx-auto text-primary mb-4" />
      <h3 class="text-lg font-medium mb-2">Drop files here</h3>
      <p class="text-sm text-muted-foreground mb-4">
        Supported formats: {accept.join(', ')}
      </p>
      <p class="text-xs text-muted-foreground">
        Maximum file size: {formatFileSize(maxSize)}
      </p>
    </div>
  </div>
{/if}

<!-- Global drag and drop handlers -->
<svelte:window
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
  ondrop={handleDrop}
/>