<!-- MediaBrowserTest.svelte - Test component for MediaBrowserDialog -->
<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import MediaBrowserDialog from './MediaBrowserDialog.svelte';
  import type { MediaFile } from '$lib/db/models';

  let showDialog = $state(false);
  let selectedFiles = $state<MediaFile[]>([]);

  function handleSelect(files: MediaFile[]) {
    selectedFiles = files;
    console.log('Selected files:', files);
  }

  function handleClose() {
    showDialog = false;
  }
</script>

<div class="p-6 space-y-4">
  <h2 class="text-2xl font-semibold">Media Browser Dialog Test</h2>
  
  <div class="space-y-2">
    <Button onclick={() => showDialog = true}>
      Open Media Browser (Single Select)
    </Button>
    
    <Button onclick={() => showDialog = true}>
      Open Media Browser (Multiple Select)
    </Button>
  </div>

  {#if selectedFiles.length > 0}
    <div class="space-y-2">
      <h3 class="text-lg font-medium">Selected Files:</h3>
      <ul class="list-disc list-inside space-y-1">
        {#each selectedFiles as file}
          <li class="text-sm">
            {file.filename} ({file.mimeType}, {Math.round(file.size / 1024)}KB)
          </li>
        {/each}
      </ul>
    </div>
  {/if}

  <MediaBrowserDialog
    bind:open={showDialog}
    multiple={true}
    accept={['image/*', 'video/*']}
    maxSize={50 * 1024 * 1024}
    onSelect={handleSelect}
    onClose={handleClose}
  />
</div>