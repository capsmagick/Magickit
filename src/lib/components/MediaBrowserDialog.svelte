<!-- MediaBrowserDialog.svelte -->
<script lang="ts">
  import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Card, CardContent } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Separator } from '$lib/components/ui/separator';
  import { ScrollArea } from '$lib/components/ui/scroll-area';
  
  // Icons
  import SearchIcon from '@lucide/svelte/icons/search';
  import GridIcon from '@lucide/svelte/icons/grid-3x3';
  import ListIcon from '@lucide/svelte/icons/list';
  import UploadIcon from '@lucide/svelte/icons/upload';
  import FolderIcon from '@lucide/svelte/icons/folder';
  import ImageIcon from '@lucide/svelte/icons/image';
  import FileIcon from '@lucide/svelte/icons/file';
  import Loader2Icon from '@lucide/svelte/icons/loader-2';
  import XIcon from '@lucide/svelte/icons/x';
  
  import type { MediaFile, MediaFolder } from '$lib/db/models';
  import MediaGrid from './MediaGrid.svelte';
  import MediaUpload from './MediaUpload.svelte';
  import FolderNavigation from './FolderNavigation.svelte';

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
    maxSize = 10 * 1024 * 1024, // 10MB default
    onSelect,
    onClose 
  }: Props = $props();

  // State management
  let state = $state({
    currentFolder: null as MediaFolder | null,
    files: [] as MediaFile[],
    folders: [] as MediaFolder[],
    selectedFiles: [] as MediaFile[],
    view: 'grid' as 'grid' | 'list',
    sortBy: 'createdAt' as 'filename' | 'createdAt' | 'size',
    sortOrder: 'desc' as 'asc' | 'desc',
    searchQuery: '',
    isLoading: false,
    isUploading: false,
    uploadProgress: 0,
    error: null as string | null
  });

  // Load media files and folders
  async function loadMedia() {
    state.isLoading = true;
    state.error = null;
    
    try {
      const mediaParams = new URLSearchParams({
        folderId: state.currentFolder?._id?.toString() || '',
        search: state.searchQuery || '',
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        limit: '50'
      });

      const folderParams = new URLSearchParams({
        parentId: state.currentFolder?._id?.toString() || ''
      });

      const [mediaResponse, foldersResponse] = await Promise.all([
        fetch(`/api/admin/media/files?${mediaParams}`),
        fetch(`/api/admin/media/folders?${folderParams}`)
      ]);

      if (!mediaResponse.ok || !foldersResponse.ok) {
        throw new Error('Failed to load media data');
      }

      const mediaResult = await mediaResponse.json();
      const foldersResult = await foldersResponse.json();
      
      state.files = mediaResult.files;
      state.folders = foldersResult.folders;
    } catch (error) {
      console.error('Error loading media:', error);
      state.error = 'Failed to load media files';
    } finally {
      state.isLoading = false;
    }
  }

  // Handle file upload
  async function handleUpload(files: FileList) {
    if (!files.length) return;
    
    state.isUploading = true;
    state.error = null;
    
    try {
      const uploadPromises = Array.from(files).map(async (file, index) => {
        // Basic file validation
        if (maxSize && file.size > maxSize) {
          throw new Error(`File ${file.name} is too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`);
        }
        
        if (accept && accept.length > 0) {
          const isAccepted = accept.some(acceptType => {
            if (acceptType.endsWith('/*')) {
              return file.type.startsWith(acceptType.slice(0, -1));
            }
            return file.type === acceptType;
          });
          
          if (!isAccepted) {
            throw new Error(`File ${file.name} type ${file.type} is not accepted`);
          }
        }
        
        // Update progress
        state.uploadProgress = ((index + 1) / files.length) * 100;
        
        // Create media file record (simplified for now)
        const buffer = await file.arrayBuffer();
        const mediaFile: Omit<MediaFile, '_id' | 'createdAt' | 'updatedAt'> = {
          filename: file.name,
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          folderId: state.currentFolder?._id,
          s3Key: `uploads/${Date.now()}-${file.name}`,
          s3Url: `https://example.com/uploads/${Date.now()}-${file.name}`, // Placeholder
          variants: [],
          metadata: {},
          altText: '',
          caption: '',
          tags: [],
          uploadedBy: 'current-user-id' // This should come from auth context
        };
        
        // For now, just add a placeholder - real upload would use the upload API
        const placeholderFile: MediaFile = {
          _id: `temp-${Date.now()}-${index}`,
          ...mediaFile,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        state.files = [placeholderFile, ...state.files];
      });
      
      await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading files:', error);
      state.error = error instanceof Error ? error.message : 'Failed to upload files';
    } finally {
      state.isUploading = false;
      state.uploadProgress = 0;
    }
  }

  // Handle folder navigation
  function handleFolderChange(folder: MediaFolder | null) {
    state.currentFolder = folder;
    state.selectedFiles = []; // Clear selection when changing folders
    loadMedia();
  }

  // Handle file selection
  function handleFileSelect(file: MediaFile) {
    if (multiple) {
      const index = state.selectedFiles.findIndex(f => f._id === file._id);
      if (index >= 0) {
        state.selectedFiles.splice(index, 1);
      } else {
        state.selectedFiles.push(file);
      }
    } else {
      state.selectedFiles = [file];
    }
  }

  // Handle select button click
  function handleSelect() {
    onSelect(state.selectedFiles);
    onClose();
  }

  // Handle search
  function handleSearch() {
    loadMedia();
  }

  // Load initial data when dialog opens
  $effect(() => {
    if (open) {
      loadMedia();
    }
  });

  // Clear selection when dialog closes
  $effect(() => {
    if (!open) {
      state.selectedFiles = [];
      state.searchQuery = '';
      state.currentFolder = null;
      state.error = null;
    }
  });
</script>

<Dialog bind:open>
  <DialogContent class="max-w-6xl max-h-[80vh] p-0">
    <DialogHeader class="px-6 pt-6 pb-0">
      <DialogTitle class="text-2xl font-semibold">Media Library</DialogTitle>
    </DialogHeader>
    
    <div class="flex flex-col h-[60vh] px-6">
      <!-- Toolbar -->
      <div class="flex flex-col sm:flex-row gap-4 mb-4">
        <div class="flex-1">
          <div class="relative">
            <SearchIcon class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              bind:value={state.searchQuery}
              placeholder="Search media files..."
              class="pl-8"
              onkeydown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
        </div>
        <div class="flex gap-2">
          <Button 
            variant={state.view === 'grid' ? 'default' : 'outline'}
            size="icon"
            onclick={() => state.view = 'grid'}
            aria-label="Grid view"
          >
            <GridIcon class="h-4 w-4" />
          </Button>
          <Button 
            variant={state.view === 'list' ? 'default' : 'outline'}
            size="icon"
            onclick={() => state.view = 'list'}
            aria-label="List view"
          >
            <ListIcon class="h-4 w-4" />
          </Button>
          <MediaUpload onUpload={handleUpload} {accept} {maxSize} />
        </div>
      </div>

      <Separator class="mb-4" />
      
      <!-- Main Content -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        <!-- Sidebar -->
        <div class="lg:col-span-1">
          <Card class="h-full">
            <CardContent class="p-4">
              <FolderNavigation 
                folders={state.folders}
                currentFolder={state.currentFolder}
                onFolderChange={handleFolderChange}
              />
            </CardContent>
          </Card>
        </div>
        
        <!-- Media Grid -->
        <div class="lg:col-span-3">
          <Card class="h-full">
            <CardContent class="p-0 h-full">
              {#if state.error}
                <div class="flex justify-center items-center py-12">
                  <div class="text-center space-y-4">
                    <XIcon class="h-8 w-8 mx-auto text-destructive" />
                    <p class="text-sm text-destructive">{state.error}</p>
                    <Button variant="outline" onclick={loadMedia}>
                      Try Again
                    </Button>
                  </div>
                </div>
              {:else if state.isUploading}
                <div class="flex justify-center items-center py-12">
                  <div class="text-center space-y-4">
                    <Loader2Icon class="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p class="text-sm text-muted-foreground">
                      Uploading files... {Math.round(state.uploadProgress)}%
                    </p>
                  </div>
                </div>
              {:else if state.isLoading}
                <div class="flex justify-center items-center py-12">
                  <div class="text-center space-y-4">
                    <Loader2Icon class="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p class="text-sm text-muted-foreground">Loading media files...</p>
                  </div>
                </div>
              {:else}
                <MediaGrid 
                  files={state.files}
                  view={state.view}
                  {multiple}
                  selectedFiles={state.selectedFiles}
                  onFileSelect={handleFileSelect}
                />
              {/if}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    
    <DialogFooter class="px-6 pb-6 pt-4">
      <div class="flex items-center justify-between w-full">
        <div class="flex items-center gap-2">
          <Badge variant="secondary">
            {state.selectedFiles.length} file{state.selectedFiles.length !== 1 ? 's' : ''} selected
          </Badge>
        </div>
        <div class="flex gap-2">
          <Button variant="outline" onclick={onClose}>
            Cancel
          </Button>
          <Button 
            onclick={handleSelect}
            disabled={state.selectedFiles.length === 0}
          >
            Select Files
          </Button>
        </div>
      </div>
    </DialogFooter>
  </DialogContent>
</Dialog>