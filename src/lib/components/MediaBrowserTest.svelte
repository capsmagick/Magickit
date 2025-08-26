<!-- MediaBrowserTest.svelte - Test component for MediaBrowserDialog -->
<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import MediaBrowserDialog from './MediaBrowserDialog.svelte';
  import type { MediaFile } from '$lib/db/models';

  let showSingleDialog = $state(false);
  let showMultipleDialog = $state(false);
  let selectedFiles = $state<MediaFile[]>([]);
  let lastSelectionType = $state<'single' | 'multiple'>('single');

  function handleSingleSelect(files: MediaFile[]) {
    selectedFiles = files;
    lastSelectionType = 'single';
    console.log('Selected files (single):', files);
  }

  function handleMultipleSelect(files: MediaFile[]) {
    selectedFiles = files;
    lastSelectionType = 'multiple';
    console.log('Selected files (multiple):', files);
  }

  function handleSingleClose() {
    showSingleDialog = false;
  }

  function handleMultipleClose() {
    showMultipleDialog = false;
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
</script>

<div class="container mx-auto p-6 space-y-6">
  <div class="space-y-2">
    <h1 class="text-3xl font-bold">Media Browser Dialog Test</h1>
    <p class="text-muted-foreground">
      Test the MediaBrowserDialog component with different configurations.
    </p>
  </div>
  
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <!-- Single Select Test -->
    <Card>
      <CardHeader>
        <CardTitle>Single Select Mode</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <p class="text-sm text-muted-foreground">
          Test single file selection with image files only.
        </p>
        <Button onclick={() => showSingleDialog = true} class="w-full">
          Open Media Browser (Single Select)
        </Button>
      </CardContent>
    </Card>

    <!-- Multiple Select Test -->
    <Card>
      <CardHeader>
        <CardTitle>Multiple Select Mode</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <p class="text-sm text-muted-foreground">
          Test multiple file selection with images and videos.
        </p>
        <Button onclick={() => showMultipleDialog = true} class="w-full">
          Open Media Browser (Multiple Select)
        </Button>
      </CardContent>
    </Card>
  </div>

  <!-- Selected Files Display -->
  {#if selectedFiles.length > 0}
    <Card>
      <CardHeader>
        <CardTitle>
          Selected Files ({lastSelectionType} mode)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-3">
          {#each selectedFiles as file}
            <div class="flex items-center gap-4 p-3 border rounded-lg">
              {#if file.variants.find(v => v.name === 'thumbnail')}
                <img 
                  src={file.variants.find(v => v.name === 'thumbnail')?.s3Url || file.s3Url}
                  alt={file.altText || file.filename}
                  class="w-12 h-12 object-cover rounded"
                />
              {:else}
                <div class="w-12 h-12 bg-muted rounded flex items-center justify-center">
                  <span class="text-xs text-muted-foreground">
                    {file.mimeType.split('/')[0].toUpperCase()}
                  </span>
                </div>
              {/if}
              <div class="flex-1 min-w-0">
                <p class="font-medium truncate" title={file.filename}>
                  {file.filename}
                </p>
                <div class="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{file.mimeType}</span>
                  <span>•</span>
                  <span>{formatFileSize(file.size)}</span>
                  {#if file.width && file.height}
                    <span>•</span>
                    <span>{file.width} × {file.height}</span>
                  {/if}
                </div>
              </div>
            </div>
          {/each}
        </div>
      </CardContent>
    </Card>
  {/if}

  <!-- Single Select Dialog -->
  <MediaBrowserDialog
    bind:open={showSingleDialog}
    multiple={false}
    accept={['image/*']}
    maxSize={10 * 1024 * 1024}
    onSelect={handleSingleSelect}
    onClose={handleSingleClose}
  />

  <!-- Multiple Select Dialog -->
  <MediaBrowserDialog
    bind:open={showMultipleDialog}
    multiple={true}
    accept={['image/*', 'video/*']}
    maxSize={50 * 1024 * 1024}
    onSelect={handleMultipleSelect}
    onClose={handleMultipleClose}
  />
</div>