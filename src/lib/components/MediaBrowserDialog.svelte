<!-- MediaBrowserDialog.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Card, CardContent } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { ScrollArea } from '$lib/components/ui/scroll-area';
  import { cn } from '$lib/utils';
  
  // Icons
  import Loader2 from '@lucide/svelte/icons/loader-2';
  import Upload from '@lucide/svelte/icons/upload';
  import Grid from '@lucide/svelte/icons/grid-3x3';
  import List from '@lucide/svelte/icons/list';
  import Search from '@lucide/svelte/icons/search';
  import FolderIcon from '@lucide/svelte/icons/folder';
  import HomeIcon from '@lucide/svelte/icons/home';
  import ImageIcon from '@lucide/svelte/icons/image';
  import FileIcon from '@lucide/svelte/icons/file';
  import VideoIcon from '@lucide/svelte/icons/video';
  import AudioIcon from '@lucide/svelte/icons/audio-lines';
  import CheckIcon from '@lucide/svelte/icons/check';
  
  import type { MediaFile, MediaFolder } from '$lib/db/models';

  interface Props {
    open: boolean;
    multiple?: boolean;
    accept?: string[];
    maxSize?: number;
    onSelect: (files: MediaFile[]) => void;
    onClose: () => void;
  }

  let { 
    open = $bindable(),
    multiple = false, 
    accept = ['image/*'], 
    maxSize = 10 * 1024 * 1024,
    onSelect,
    onClose 
  }: Props = $props();

  // State management
  let currentFolder = $state<MediaFolder | null>(null);
  let files = $state<MediaFile[]>([]);
  let folders = $state<MediaFolder[]>([]);
  let selectedFiles = $state<MediaFile[]>([]);
  let view = $state<'grid' | 'list'>('grid');
  let sortBy = $state<'filename' | 'createdAt' | 'size'>('createdAt');
  let sortOrder = $state<'asc' | 'desc'>('desc');
  let searchQuery = $state('');
  let isLoading = $state(false);
  let isUploading = $state(false);
  let uploadProgress = $state(0);
  let error = $state<string | null>(null);

  // File input reference
  let fileInput: HTMLInputElement;

  // Load media files and folders
  async function loadMedia() {
    if (!open) return;
    
    isLoading = true;
    error = null;
    
    try {
      const response = await fetch('/api/media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'getMedia',
          folderId: currentFolder?._id,
          search: searchQuery,
          sortBy,
          sortOrder,
          limit: 50
        })
      });

      if (!response.ok) {
        throw new Error('Failed to load media');
      }

      const data = await response.json();
      files = data.files || [];
      folders = data.folders || [];
    } catch (err) {
      console.error('Error loading media:', err);
      error = 'Failed to load media files';
      files = [];
      folders = [];
    } finally {
      isLoading = false;
    }
  }

  // Handle file upload
  async function handleUpload(uploadFiles: FileList) {
    if (!uploadFiles || uploadFiles.length === 0) return;

    isUploading = true;
    uploadProgress = 0;
    error = null;

    try {
      for (let i = 0; i < uploadFiles.length; i++) {
        const file = uploadFiles[i];
        
        // Validate file
        const validation = validateFile(file);
        if (!validation.isValid) {
          throw new Error(validation.error);
        }

        // Create form data
        const formData = new FormData();
        formData.append('file', file);
        if (currentFolder) {
          formData.append('folderId', currentFolder._id);
        }

        // Upload file
        const response = await fetch('/api/media/upload', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }

        const uploadedFile = await response.json();
        files = [uploadedFile, ...files];
        
        uploadProgress = ((i + 1) / uploadFiles.length) * 100;
      }
    } catch (err) {
      console.error('Error uploading files:', err);
      error = err instanceof Error ? err.message : 'Upload failed';
    } finally {
      isUploading = false;
      uploadProgress = 0;
      // Reset file input
      if (fileInput) {
        fileInput.value = '';
      }
    }
  }

  // Validate file before upload
  function validateFile(file: File): { isValid: boolean; error?: string } {
    // Check file size
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `File size exceeds maximum allowed size of ${formatFileSize(maxSize)}`
      };
    }

    // Check file type
    const isAllowed = accept.some(allowedType => {
      if (allowedType.endsWith('/*')) {
        const category = allowedType.replace('/*', '');
        return file.type.startsWith(category + '/');
      }
      return file.type === allowedType;
    });

    if (!isAllowed) {
      return {
        isValid: false,
        error: `File type '${file.type}' is not allowed`
      };
    }

    return { isValid: true };
  }

  // Handle file selection
  function handleFileSelect(file: MediaFile) {
    if (multiple) {
      const index = selectedFiles.findIndex(f => f._id === file._id);
      if (index >= 0) {
        selectedFiles = selectedFiles.filter(f => f._id !== file._id);
      } else {
        selectedFiles = [...selectedFiles, file];
      }
    } else {
      selectedFiles = [file];
    }
  }

  // Handle folder change
  function handleFolderChange(folder: MediaFolder | null) {
    currentFolder = folder;
    selectedFiles = []; // Clear selection when changing folders
    loadMedia();
  }

  // Handle final selection
  function handleSelect() {
    onSelect(selectedFiles);
    onClose();
  }

  // Handle dialog close
  function handleClose() {
    selectedFiles = [];
    searchQuery = '';
    currentFolder = null;
    onClose();
  }

  // Handle file input change
  function handleFileInputChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      handleUpload(target.files);
    }
  }

  // Open file dialog
  function openFileDialog() {
    fileInput?.click();
  }

  // Helper functions
  function getFileIcon(mimeType: string) {
    if (mimeType.startsWith('image/')) return ImageIcon;
    if (mimeType.startsWith('video/')) return VideoIcon;
    if (mimeType.startsWith('audio/')) return AudioIcon;
    return FileIcon;
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function getThumbnailUrl(file: MediaFile): string {
    const thumbnail = file.variants.find(v => v.name === 'thumbnail');
    if (thumbnail) return thumbnail.s3Url;
    
    if (file.mimeType.startsWith('image/')) {
      return file.s3Url;
    }
    
    return '';
  }

  function isSelected(file: MediaFile): boolean {
    return selectedFiles.some(f => f._id === file._id);
  }

  // Load media when dialog opens
  $effect(() => {
    if (open) {
      loadMedia();
    }
  });

  // Handle search
  $effect(() => {
    if (open) {
      const timeoutId = setTimeout(() => {
        loadMedia();
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  });
</script>

<!-- Hidden file input -->
<input
  bind:this={fileInput}
  type="file"
  accept={accept.join(',')}
  multiple
  class="hidden"
  onchange={handleFileInputChange}
/>

<Dialog bind:open>
  <DialogContent class="max-w-6xl max-h-[80vh] overflow-hidden">
    <DialogHeader>
      <DialogTitle class="text-2xl">Media Library</DialogTitle>
    </DialogHeader>
    
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[60vh] min-h-0">
      <!-- Sidebar -->
      <div class="lg:col-span-1">
        <Card class="h-full">
          <CardContent class="p-4">
            <div class="space-y-2">
              <h3 class="text-sm font-medium text-muted-foreground mb-3">Folders</h3>
              
              <!-- Root folder (All Files) -->
              <Button
                variant={currentFolder === null ? 'default' : 'ghost'}
                class="w-full justify-start gap-2 h-8"
                onclick={() => handleFolderChange(null)}
              >
                <HomeIcon class="h-4 w-4" />
                All Files
              </Button>

              <!-- Folder tree -->
              <ScrollArea class="max-h-[300px]">
                <div class="space-y-1">
                  {#each folders as folder}
                    <Button
                      variant={currentFolder?._id === folder._id ? 'default' : 'ghost'}
                      class="w-full justify-start gap-2 h-8 text-sm"
                      onclick={() => handleFolderChange(folder)}
                    >
                      <FolderIcon class="h-4 w-4" />
                      <span class="truncate" title={folder.name}>
                        {folder.name}
                      </span>
                    </Button>
                  {/each}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <!-- Main Content -->
      <div class="lg:col-span-3 space-y-4 min-h-0 flex flex-col">
        <!-- Toolbar -->
        <div class="flex flex-col sm:flex-row gap-4 shrink-0">
          <div class="flex-1">
            <div class="relative">
              <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                bind:value={searchQuery}
                placeholder="Search media..."
                class="pl-8 transition-colors duration-200"
              />
            </div>
          </div>
          <div class="flex gap-2">
            <Button 
              variant={view === 'grid' ? 'default' : 'outline'}
              size="icon"
              onclick={() => view = 'grid'}
              class="transition-colors duration-200"
            >
              <Grid class="h-4 w-4" />
            </Button>
            <Button 
              variant={view === 'list' ? 'default' : 'outline'}
              size="icon"
              onclick={() => view = 'list'}
              class="transition-colors duration-200"
            >
              <List class="h-4 w-4" />
            </Button>
            <Button onclick={openFileDialog} class="gap-2">
              <Upload class="h-4 w-4" />
              Upload
            </Button>
          </div>
        </div>
        
        <!-- Error message -->
        {#if error}
          <div class="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
            {error}
          </div>
        {/if}
        
        <!-- Media Grid -->
        <Card class="flex-1 overflow-hidden min-h-0">
          <CardContent class="p-0 h-full">
            {#if isLoading}
              <div class="flex justify-center items-center py-12">
                <div class="text-center space-y-4">
                  <Loader2 class="h-8 w-8 animate-spin mx-auto text-primary" />
                  <p class="text-sm text-muted-foreground">Loading media...</p>
                </div>
              </div>
            {:else if isUploading}
              <div class="flex justify-center items-center py-12">
                <div class="text-center space-y-4">
                  <Loader2 class="h-8 w-8 animate-spin mx-auto text-primary" />
                  <p class="text-sm text-muted-foreground">Uploading... {Math.round(uploadProgress)}%</p>
                </div>
              </div>
            {:else if files.length === 0}
              <div class="flex flex-col items-center justify-center py-12 text-center">
                <ImageIcon class="h-12 w-12 text-muted-foreground mb-4" />
                <h3 class="text-lg font-medium text-muted-foreground mb-2">No media files found</h3>
                <p class="text-sm text-muted-foreground mb-4">
                  {searchQuery ? 'Try adjusting your search criteria.' : 'Upload some files to get started.'}
                </p>
                <Button onclick={openFileDialog} class="gap-2">
                  <Upload class="h-4 w-4" />
                  Upload Files
                </Button>
              </div>
            {:else}
              <ScrollArea class="h-full">
                {#if view === 'grid'}
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
                        onclick={() => handleFileSelect(file)}
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
                        onclick={() => handleFileSelect(file)}
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
            {/if}
          </CardContent>
        </Card>
      </div>
    </div>
    
    <DialogFooter>
      <div class="flex items-center justify-between w-full">
        <div class="flex items-center gap-2">
          <Badge variant="secondary">
            {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
          </Badge>
        </div>
        <div class="flex gap-2">
          <Button variant="outline" onclick={handleClose} class="transition-colors duration-200">
            Cancel
          </Button>
          <Button 
            onclick={handleSelect}
            disabled={selectedFiles.length === 0}
            class="transition-colors duration-200"
          >
            Select Files
          </Button>
        </div>
      </div>
    </DialogFooter>
  </DialogContent>
</Dialog>