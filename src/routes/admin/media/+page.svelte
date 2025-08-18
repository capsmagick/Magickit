<!-- Media Library Main Page -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Separator } from '$lib/components/ui/separator';
  import { 
    Search, 
    Grid, 
    List, 
    Upload, 
    FolderPlus, 
    Filter,
    MoreHorizontal,
    Trash2,
    Edit,
    Move,
    Download,
    Eye,
    Loader2
  } from '@lucide/svelte';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import * as Select from '$lib/components/ui/select';
  import * as Checkbox from '$lib/components/ui/checkbox';
  import { toast } from 'svelte-sonner';
  import type { MediaFile, MediaFolder } from '$lib/db/models';

  // State management
  let state = $state({
    // View settings
    view: 'grid' as 'grid' | 'list',
    selectedFiles: [] as MediaFile[],
    
    // Data
    files: [] as MediaFile[],
    folders: [] as MediaFolder[],
    currentFolder: null as MediaFolder | null,
    
    // Filtering and search
    searchQuery: '',
    selectedMimeType: 'all',
    sortBy: 'createdAt' as 'filename' | 'createdAt' | 'size',
    sortOrder: 'desc' as 'asc' | 'desc',
    
    // UI state
    loading: true,
    error: null as string | null,
    
    // Pagination
    currentPage: 1,
    itemsPerPage: 20,
    totalItems: 0
  });

  // Computed values
  const totalPages = $derived(Math.ceil(state.totalItems / state.itemsPerPage));
  const hasSelection = $derived(state.selectedFiles.length > 0);
  const isAllSelected = $derived(state.files.length > 0 && state.selectedFiles.length === state.files.length);

  // Load media data
  async function loadMedia() {
    state.loading = true;
    state.error = null;
    
    try {
      const params = new URLSearchParams({
        folderId: state.currentFolder?._id?.toString() || '',
        search: state.searchQuery,
        mimeType: state.selectedMimeType === 'all' ? '' : state.selectedMimeType,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        limit: state.itemsPerPage.toString(),
        skip: ((state.currentPage - 1) * state.itemsPerPage).toString()
      });

      const [filesResponse, foldersResponse] = await Promise.all([
        fetch(`/api/admin/media/files?${params}`),
        fetch(`/api/admin/media/folders?${params}`)
      ]);

      if (!filesResponse.ok || !foldersResponse.ok) {
        throw new Error('Failed to load media data');
      }

      const filesData = await filesResponse.json();
      const foldersData = await foldersResponse.json();

      state.files = filesData.files || [];
      state.totalItems = filesData.total || 0;
      state.folders = foldersData.folders || [];
    } catch (error) {
      console.error('Error loading media:', error);
      state.error = error instanceof Error ? error.message : 'Failed to load media';
      toast.error('Failed to load media files');
    } finally {
      state.loading = false;
    }
  }

  // Handle search
  function handleSearch() {
    state.currentPage = 1;
    loadMedia();
  }

  // Handle folder navigation
  function navigateToFolder(folder: MediaFolder | null) {
    state.currentFolder = folder;
    state.currentPage = 1;
    state.selectedFiles = [];
    loadMedia();
  }

  // Handle file selection
  function toggleFileSelection(file: MediaFile) {
    const index = state.selectedFiles.findIndex(f => f._id === file._id);
    if (index >= 0) {
      state.selectedFiles.splice(index, 1);
    } else {
      state.selectedFiles.push(file);
    }
  }

  // Handle select all
  function toggleSelectAll() {
    if (isAllSelected) {
      state.selectedFiles = [];
    } else {
      state.selectedFiles = [...state.files];
    }
  }

  // Handle bulk operations
  async function handleBulkDelete() {
    if (!hasSelection) return;
    
    if (!confirm(`Are you sure you want to delete ${state.selectedFiles.length} file(s)?`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/media/files/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileIds: state.selectedFiles.map(f => f._id)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to delete files');
      }

      toast.success(`Deleted ${state.selectedFiles.length} file(s)`);
      state.selectedFiles = [];
      loadMedia();
    } catch (error) {
      console.error('Error deleting files:', error);
      toast.error('Failed to delete files');
    }
  }

  async function handleBulkMove(folderId: string | null) {
    if (!hasSelection) return;

    try {
      const response = await fetch('/api/admin/media/files/bulk-move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileIds: state.selectedFiles.map(f => f._id),
          folderId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to move files');
      }

      toast.success(`Moved ${state.selectedFiles.length} file(s)`);
      state.selectedFiles = [];
      loadMedia();
    } catch (error) {
      console.error('Error moving files:', error);
      toast.error('Failed to move files');
    }
  }

  // Format file size
  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Format date
  function formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Get file type icon
  function getFileTypeIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType === 'application/pdf') return '📄';
    return '📁';
  }

  // Initialize
  onMount(() => {
    loadMedia();
  });


	const selectedMimeTypeOptions = [
		{ value: 'all', label: 'All Types' },
		{ value: 'image/', label: 'Images' },
		{ value: 'video/', label: 'Videos' },
		{ value: 'audio/', label: 'Audio' },
		{ value: 'application/pdf', label: 'Documents' }
	];

	const selectedMimeTypeLabel = $derived(
		selectedMimeTypeOptions.find(option => option.value === state.selectedMimeType)?.label ?? 'File Type'
	);

	const sortByOptions = [
		{ value: 'createdAt', label: 'Date' },
		{ value: 'filename', label: 'Name' },
		{ value: 'size', label: 'Size' }
	];

	const sortByLabel = $derived(
		sortByOptions.find(option => option.value === state.sortBy)?.label ?? 'Sort by'
	);
</script>

<div class="flex flex-col gap-6 p-6">
  <!-- Header -->
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Media Library</h1>
      <p class="text-muted-foreground">
        Manage your media files and folders
      </p>
    </div>
    
    <div class="flex gap-2">
      <Button variant="outline" onclick={() => window.location.href = '/admin/media/folders'}>
        <FolderPlus class="h-4 w-4 mr-2" />
        Manage Folders
      </Button>
      <Button variant="outline" onclick={() => window.location.href = '/admin/media/upload'}>
        <Upload class="h-4 w-4 mr-2" />
        Upload Files
      </Button>
    </div>
  </div>

  <!-- Breadcrumb Navigation -->
  {#if state.currentFolder}
    <nav class="flex items-center space-x-2 text-sm text-muted-foreground">
      <button 
        class="hover:text-foreground transition-colors"
        onclick={() => navigateToFolder(null)}
      >
        Root
      </button>
      <span>/</span>
      <span class="text-foreground font-medium">{state.currentFolder.name}</span>
    </nav>
  {/if}

  <!-- Toolbar -->
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <!-- Search and Filters -->
    <div class="flex flex-1 gap-2">
      <div class="relative flex-1 max-w-sm">
        <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          bind:value={state.searchQuery}
          placeholder="Search media files..."
          class="pl-8"
          onkeydown={(e) => e.key === 'Enter' && handleSearch()}
        />
      </div>
      
      <Select.Root type="single" bind:value={state.selectedMimeType}>
				<Select.Trigger class="w-32">
					{selectedMimeTypeLabel}
				</Select.Trigger>
				<Select.Content>
					{#each selectedMimeTypeOptions as option}
						<Select.Item value={option.value}>{option.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>

      <Select.Root type="single" bind:value={state.sortBy}>
				<Select.Trigger class="w-32">
					{sortByLabel}
				</Select.Trigger>
				<Select.Content>
					{#each sortByOptions as option}
						<Select.Item value={option.value}>{option.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
    </div>

    <!-- View Controls -->
    <div class="flex items-center gap-2">
      <!-- Bulk Actions -->
      {#if hasSelection}
        <div class="flex items-center gap-2 mr-4">
          <Badge variant="secondary">
            {state.selectedFiles.length} selected
          </Badge>
          
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild let:builder>
              <Button builders={[builder]} variant="outline" size="sm">
                Actions
                <MoreHorizontal class="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              <DropdownMenu.Item onclick={handleBulkDelete}>
                <Trash2 class="h-4 w-4 mr-2" />
                Delete Selected
              </DropdownMenu.Item>
              <DropdownMenu.Item onclick={() => handleBulkMove(null)}>
                <Move class="h-4 w-4 mr-2" />
                Move to Root
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>
      {/if}

      <!-- View Toggle -->
      <div class="flex border rounded-md">
        <Button
          variant={state.view === 'grid' ? 'default' : 'ghost'}
          size="sm"
          class="rounded-r-none"
          onclick={() => state.view = 'grid'}
        >
          <Grid class="h-4 w-4" />
        </Button>
        <Button
          variant={state.view === 'list' ? 'default' : 'ghost'}
          size="sm"
          class="rounded-l-none"
          onclick={() => state.view = 'list'}
        >
          <List class="h-4 w-4" />
        </Button>
      </div>
    </div>
  </div>

  <!-- Content Area -->
  <div class="flex-1">
    {#if state.loading}
      <div class="flex items-center justify-center py-12">
        <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
        <span class="ml-2 text-muted-foreground">Loading media files...</span>
      </div>
    {:else if state.error}
      <Card>
        <CardContent class="flex items-center justify-center py-12">
          <div class="text-center">
            <p class="text-destructive mb-2">Error loading media files</p>
            <p class="text-sm text-muted-foreground mb-4">{state.error}</p>
            <Button onclick={loadMedia}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    {:else}
      <!-- Folders Section -->
      {#if state.folders.length > 0}
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-3">Folders</h3>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {#each state.folders as folder}
              <Card class="cursor-pointer hover:bg-muted/50 transition-colors" onclick={() => navigateToFolder(folder)}>
                <CardContent class="p-4 text-center">
                  <div class="text-4xl mb-2">📁</div>
                  <p class="text-sm font-medium truncate">{folder.name}</p>
                  <p class="text-xs text-muted-foreground">
                    {formatDate(folder.createdAt)}
                  </p>
                </CardContent>
              </Card>
            {/each}
          </div>
        </div>
        <Separator class="my-6" />
      {/if}

      <!-- Files Section -->
      {#if state.files.length > 0}
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold">Files ({state.totalItems})</h3>
          
          {#if state.files.length > 0}
            <div class="flex items-center gap-2">
              <Checkbox.Root
                id="select-all-checkbox"
                checked={isAllSelected}
                onCheckedChange={toggleSelectAll}
              />
              <label for="select-all-checkbox" class="text-sm">Select All</label>
            </div>
          {/if}
        </div>

        <!-- Grid View -->
        {#if state.view === 'grid'}
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {#each state.files as file}
              <Card class="group relative overflow-hidden">
                <CardContent class="p-0">
                  <!-- Selection Checkbox -->
                  <div class="absolute top-2 left-2 z-10">
                    <Checkbox.Root
                      checked={state.selectedFiles.some(f => f._id === file._id)}
                      onCheckedChange={() => toggleFileSelection(file)}
                      class="bg-background/80 backdrop-blur-sm"
                    />
                  </div>

                  <!-- File Preview -->
                  <div class="aspect-square bg-muted flex items-center justify-center">
                    {#if file.mimeType.startsWith('image/')}
                      <img
                        src={file.variants?.find(v => v.name === 'thumbnail')?.s3Url || file.s3Url}
                        alt={file.altText || file.filename}
                        class="w-full h-full object-cover"
                        loading="lazy"
                      />
                    {:else}
                      <div class="text-4xl">
                        {getFileTypeIcon(file.mimeType)}
                      </div>
                    {/if}
                  </div>

                  <!-- File Info -->
                  <div class="p-3">
                    <p class="text-sm font-medium truncate" title={file.filename}>
                      {file.filename}
                    </p>
                    <p class="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>

                  <!-- Actions Overlay -->
                  <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="sm" variant="secondary">
                      <Eye class="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="secondary">
                      <Download class="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="secondary">
                      <Edit class="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            {/each}
          </div>
        {:else}
          <!-- List View -->
          <Card>
            <CardContent class="p-0">
              <div class="divide-y">
                {#each state.files as file}
                  <div class="flex items-center gap-4 p-4 hover:bg-muted/50">
                    <Checkbox.Root
                      checked={state.selectedFiles.some(f => f._id === file._id)}
                      onCheckedChange={() => toggleFileSelection(file)}
                    />
                    
                    <div class="w-12 h-12 bg-muted rounded flex items-center justify-center flex-shrink-0">
                      {#if file.mimeType.startsWith('image/')}
                        <img
                          src={file.variants?.find(v => v.name === 'thumbnail')?.s3Url || file.s3Url}
                          alt={file.altText || file.filename}
                          class="w-full h-full object-cover rounded"
                          loading="lazy"
                        />
                      {:else}
                        <span class="text-lg">
                          {getFileTypeIcon(file.mimeType)}
                        </span>
                      {/if}
                    </div>

                    <div class="flex-1 min-w-0">
                      <p class="font-medium truncate">{file.filename}</p>
                      <p class="text-sm text-muted-foreground">
                        {file.mimeType} • {formatFileSize(file.size)}
                      </p>
                    </div>

                    <div class="text-sm text-muted-foreground">
                      {formatDate(file.createdAt)}
                    </div>

                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild let:builder>
                        <Button builders={[builder]} variant="ghost" size="sm">
                          <MoreHorizontal class="h-4 w-4" />
                        </Button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Content>
                        <DropdownMenu.Item>
                          <Eye class="h-4 w-4 mr-2" />
                          View
                        </DropdownMenu.Item>
                        <DropdownMenu.Item>
                          <Download class="h-4 w-4 mr-2" />
                          Download
                        </DropdownMenu.Item>
                        <DropdownMenu.Item>
                          <Edit class="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenu.Item>
                        <DropdownMenu.Separator />
                        <DropdownMenu.Item class="text-destructive">
                          <Trash2 class="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Root>
                  </div>
                {/each}
              </div>
            </CardContent>
          </Card>
        {/if}

        <!-- Pagination -->
        {#if totalPages > 1}
          <div class="flex items-center justify-between mt-6">
            <p class="text-sm text-muted-foreground">
              Showing {((state.currentPage - 1) * state.itemsPerPage) + 1} to {Math.min(state.currentPage * state.itemsPerPage, state.totalItems)} of {state.totalItems} files
            </p>
            
            <div class="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={state.currentPage === 1}
                onclick={() => { state.currentPage--; loadMedia(); }}
              >
                Previous
              </Button>
              
              <span class="text-sm">
                Page {state.currentPage} of {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                disabled={state.currentPage === totalPages}
                onclick={() => { state.currentPage++; loadMedia(); }}
              >
                Next
              </Button>
            </div>
          </div>
        {/if}
      {:else}
        <!-- Empty State -->
        <Card>
          <CardContent class="flex flex-col items-center justify-center py-12">
            <div class="text-6xl mb-4">📁</div>
            <h3 class="text-lg font-semibold mb-2">No media files found</h3>
            <p class="text-muted-foreground text-center mb-4">
              {state.searchQuery || state.selectedMimeType !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Upload your first media files to get started'
              }
            </p>
            {#if !state.searchQuery && state.selectedMimeType === 'all'}
              <Button>
                <Upload class="h-4 w-4 mr-2" />
                Upload Files
              </Button>
            {/if}
          </CardContent>
        </Card>
      {/if}
    {/if}
  </div>
</div>