<!-- Media Folder Management Page -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Separator } from '$lib/components/ui/separator';
  import * as Dialog from '$lib/components/ui/dialog';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import * as Breadcrumb from '$lib/components/ui/breadcrumb';
  import { 
    FolderPlus, 
    Folder, 
    FolderOpen,
    MoreHorizontal,
    Edit,
    Trash2,
    Move,
    ChevronRight,
    Home,
    Loader2,
    Search
  } from '@lucide/svelte';
  import { toast } from 'svelte-sonner';
  import type { MediaFolder } from '$lib/db/models';

  // State management
  let state = $state({
    // Data
    folders: [] as MediaFolder[],
    currentFolder: null as MediaFolder | null,
    folderHierarchy: [] as MediaFolder[],
    
    // UI state
    loading: true,
    error: null as string | null,
    searchQuery: '',
    
    // Dialog states
    createDialogOpen: false,
    editDialogOpen: false,
    deleteDialogOpen: false,
    moveDialogOpen: false,
    
    // Form data
    folderForm: {
      name: '',
      description: '',
      parentId: null as string | null
    },
    
    // Selected folder for operations
    selectedFolder: null as MediaFolder | null
  });

  // Load folders
  async function loadFolders() {
    state.loading = true;
    state.error = null;
    
    try {
      const params = new URLSearchParams({
        parentId: state.currentFolder?._id?.toString() || '',
        search: state.searchQuery
      });

      const response = await fetch(`/api/admin/media/folders?${params}`);
      if (!response.ok) throw new Error('Failed to load folders');
      
      const data = await response.json();
      state.folders = data.folders || [];
      
      // Load folder hierarchy if we're in a subfolder
      if (state.currentFolder) {
        await loadFolderHierarchy(state.currentFolder._id.toString());
      } else {
        state.folderHierarchy = [];
      }
    } catch (error) {
      console.error('Error loading folders:', error);
      state.error = error instanceof Error ? error.message : 'Failed to load folders';
      toast.error('Failed to load folders');
    } finally {
      state.loading = false;
    }
  }

  // Load folder hierarchy for breadcrumbs
  async function loadFolderHierarchy(folderId: string) {
    try {
      const response = await fetch(`/api/admin/media/folders/${folderId}/hierarchy`);
      if (!response.ok) throw new Error('Failed to load folder hierarchy');
      
      const data = await response.json();
      state.folderHierarchy = data.hierarchy || [];
    } catch (error) {
      console.error('Error loading folder hierarchy:', error);
    }
  }

  // Navigate to folder
  function navigateToFolder(folder: MediaFolder | null) {
    state.currentFolder = folder;
    state.searchQuery = '';
    loadFolders();
  }

  // Handle search
  function handleSearch() {
    loadFolders();
  }

  // Create folder
  async function createFolder() {
    if (!state.folderForm.name.trim()) {
      toast.error('Folder name is required');
      return;
    }

    try {
      const response = await fetch('/api/admin/media/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: state.folderForm.name.trim(),
          description: state.folderForm.description.trim() || undefined,
          parentId: state.currentFolder?._id?.toString() || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create folder');
      }

      toast.success('Folder created successfully');
      state.createDialogOpen = false;
      resetFolderForm();
      loadFolders();
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create folder');
    }
  }

  // Edit folder
  async function editFolder() {
    if (!state.selectedFolder || !state.folderForm.name.trim()) {
      toast.error('Folder name is required');
      return;
    }

    try {
      const response = await fetch(`/api/admin/media/folders/${state.selectedFolder._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: state.folderForm.name.trim(),
          description: state.folderForm.description.trim() || undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update folder');
      }

      toast.success('Folder updated successfully');
      state.editDialogOpen = false;
      resetFolderForm();
      loadFolders();
    } catch (error) {
      console.error('Error updating folder:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update folder');
    }
  }

  // Delete folder
  async function deleteFolder() {
    if (!state.selectedFolder) return;

    try {
      const response = await fetch(`/api/admin/media/folders/${state.selectedFolder._id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete folder');
      }

      toast.success('Folder deleted successfully');
      state.deleteDialogOpen = false;
      state.selectedFolder = null;
      loadFolders();
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete folder');
    }
  }

  // Open create dialog
  function openCreateDialog() {
    resetFolderForm();
    state.createDialogOpen = true;
  }

  // Open edit dialog
  function openEditDialog(folder: MediaFolder) {
    state.selectedFolder = folder;
    state.folderForm.name = folder.name;
    state.folderForm.description = folder.description || '';
    state.editDialogOpen = true;
  }

  // Open delete dialog
  function openDeleteDialog(folder: MediaFolder) {
    state.selectedFolder = folder;
    state.deleteDialogOpen = true;
  }

  // Reset form
  function resetFolderForm() {
    state.folderForm = {
      name: '',
      description: '',
      parentId: null
    };
    state.selectedFolder = null;
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

  // Initialize
  onMount(() => {
    loadFolders();
  });
</script>

<div class="flex flex-col gap-6 p-6">
  <!-- Header -->
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Folder Management</h1>
      <p class="text-muted-foreground">
        Organize your media files with folders and subfolders
      </p>
    </div>
    
    <div class="flex gap-2">
      <Button variant="outline" onclick={() => window.history.back()}>
        Back to Library
      </Button>
      <Button onclick={openCreateDialog}>
        <FolderPlus class="h-4 w-4 mr-2" />
        New Folder
      </Button>
    </div>
  </div>

  <!-- Breadcrumb Navigation -->
  <Card>
    <CardContent class="p-4">
      <Breadcrumb.Root>
        <Breadcrumb.List>
          <Breadcrumb.Item>
            <Breadcrumb.Link 
              href="#" 
              onclick={() => navigateToFolder(null)}
              class="flex items-center gap-1"
            >
              <Home class="h-4 w-4" />
              Root
            </Breadcrumb.Link>
          </Breadcrumb.Item>
          
          {#each state.folderHierarchy as folder, index}
            <Breadcrumb.Separator>
              <ChevronRight class="h-4 w-4" />
            </Breadcrumb.Separator>
            <Breadcrumb.Item>
              {#if index === state.folderHierarchy.length - 1}
                <Breadcrumb.Page>{folder.name}</Breadcrumb.Page>
              {:else}
                <Breadcrumb.Link 
                  href="#" 
                  onclick={() => navigateToFolder(folder)}
                >
                  {folder.name}
                </Breadcrumb.Link>
              {/if}
            </Breadcrumb.Item>
          {/each}
        </Breadcrumb.List>
      </Breadcrumb.Root>
    </CardContent>
  </Card>

  <!-- Search and Filters -->
  <Card>
    <CardContent class="p-4">
      <div class="flex gap-4">
        <div class="relative flex-1 max-w-sm">
          <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            bind:value={state.searchQuery}
            placeholder="Search folders..."
            class="pl-8"
            onkeydown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Button variant="outline" onclick={handleSearch}>
          Search
        </Button>
      </div>
    </CardContent>
  </Card>

  <!-- Folders Grid -->
  <div class="flex-1">
    {#if state.loading}
      <div class="flex items-center justify-center py-12">
        <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
        <span class="ml-2 text-muted-foreground">Loading folders...</span>
      </div>
    {:else if state.error}
      <Card>
        <CardContent class="flex items-center justify-center py-12">
          <div class="text-center">
            <p class="text-destructive mb-2">Error loading folders</p>
            <p class="text-sm text-muted-foreground mb-4">{state.error}</p>
            <Button onclick={loadFolders}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    {:else if state.folders.length > 0}
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {#each state.folders as folder}
          <Card class="group relative overflow-hidden hover:shadow-md transition-shadow">
            <CardContent class="p-4">
              <!-- Folder Icon and Info -->
              <button 
                class="cursor-pointer text-center w-full border-0 bg-transparent p-0"
                onclick={() => navigateToFolder(folder)}
                onkeydown={(e) => e.key === 'Enter' && navigateToFolder(folder)}
                aria-label={`Open folder ${folder.name}`}
              >
                <div class="text-5xl mb-3 group-hover:scale-110 transition-transform">
                  {#if state.currentFolder?._id === folder._id}
                    <FolderOpen class="h-12 w-12 mx-auto text-primary" />
                  {:else}
                    <Folder class="h-12 w-12 mx-auto text-muted-foreground" />
                  {/if}
                </div>
                
                <h3 class="font-medium text-sm truncate mb-1" title={folder.name}>
                  {folder.name}
                </h3>
                
                {#if folder.description}
                  <p class="text-xs text-muted-foreground truncate mb-2" title={folder.description}>
                    {folder.description}
                  </p>
                {/if}
                
                <p class="text-xs text-muted-foreground">
                  {formatDate(folder.createdAt)}
                </p>
              </button>

              <!-- Actions Menu -->
              <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild let:builder>
                    <Button builders={[builder]} variant="ghost" size="sm" class="h-8 w-8 p-0">
                      <MoreHorizontal class="h-4 w-4" />
                    </Button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content>
                    <DropdownMenu.Item onclick={() => navigateToFolder(folder)}>
                      <FolderOpen class="h-4 w-4 mr-2" />
                      Open
                    </DropdownMenu.Item>
                    <DropdownMenu.Item onclick={() => openEditDialog(folder)}>
                      <Edit class="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator />
                    <DropdownMenu.Item 
                      onclick={() => openDeleteDialog(folder)}
                      class="text-destructive"
                    >
                      <Trash2 class="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              </div>
            </CardContent>
          </Card>
        {/each}
      </div>
    {:else}
      <!-- Empty State -->
      <Card>
        <CardContent class="flex flex-col items-center justify-center py-12">
          <div class="text-6xl mb-4">📁</div>
          <h3 class="text-lg font-semibold mb-2">No folders found</h3>
          <p class="text-muted-foreground text-center mb-4">
            {state.searchQuery 
              ? 'Try adjusting your search query'
              : 'Create your first folder to organize your media files'
            }
          </p>
          {#if !state.searchQuery}
            <Button onclick={openCreateDialog}>
              <FolderPlus class="h-4 w-4 mr-2" />
              Create Folder
            </Button>
          {/if}
        </CardContent>
      </Card>
    {/if}
  </div>
</div>

<!-- Create Folder Dialog -->
<Dialog.Root bind:open={state.createDialogOpen}>
  <Dialog.Content class="sm:max-w-[425px]">
    <Dialog.Header>
      <Dialog.Title>Create New Folder</Dialog.Title>
      <Dialog.Description>
        Create a new folder {state.currentFolder ? `inside "${state.currentFolder.name}"` : 'in the root directory'}.
      </Dialog.Description>
    </Dialog.Header>
    
    <div class="grid gap-4 py-4">
      <div class="space-y-2">
        <label for="folder-name" class="text-sm font-medium">Folder Name</label>
        <Input
          id="folder-name"
          bind:value={state.folderForm.name}
          placeholder="Enter folder name"
          class="w-full"
        />
      </div>
      
      <div class="space-y-2">
        <label for="folder-description" class="text-sm font-medium">Description (Optional)</label>
        <Textarea
          id="folder-description"
          bind:value={state.folderForm.description}
          placeholder="Enter folder description"
          class="w-full"
          rows="3"
        />
      </div>
    </div>
    
    <Dialog.Footer>
      <Button variant="outline" onclick={() => state.createDialogOpen = false}>
        Cancel
      </Button>
      <Button onclick={createFolder}>
        <FolderPlus class="h-4 w-4 mr-2" />
        Create Folder
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- Edit Folder Dialog -->
<Dialog.Root bind:open={state.editDialogOpen}>
  <Dialog.Content class="sm:max-w-[425px]">
    <Dialog.Header>
      <Dialog.Title>Edit Folder</Dialog.Title>
      <Dialog.Description>
        Update the folder name and description.
      </Dialog.Description>
    </Dialog.Header>
    
    <div class="grid gap-4 py-4">
      <div class="space-y-2">
        <label for="edit-folder-name" class="text-sm font-medium">Folder Name</label>
        <Input
          id="edit-folder-name"
          bind:value={state.folderForm.name}
          placeholder="Enter folder name"
          class="w-full"
        />
      </div>
      
      <div class="space-y-2">
        <label for="edit-folder-description" class="text-sm font-medium">Description (Optional)</label>
        <Textarea
          id="edit-folder-description"
          bind:value={state.folderForm.description}
          placeholder="Enter folder description"
          class="w-full"
          rows="3"
        />
      </div>
    </div>
    
    <Dialog.Footer>
      <Button variant="outline" onclick={() => state.editDialogOpen = false}>
        Cancel
      </Button>
      <Button onclick={editFolder}>
        <Edit class="h-4 w-4 mr-2" />
        Update Folder
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- Delete Folder Dialog -->
<Dialog.Root bind:open={state.deleteDialogOpen}>
  <Dialog.Content class="sm:max-w-[425px]">
    <Dialog.Header>
      <Dialog.Title>Delete Folder</Dialog.Title>
      <Dialog.Description>
        Are you sure you want to delete "{state.selectedFolder?.name}"? This action cannot be undone.
        The folder must be empty to be deleted.
      </Dialog.Description>
    </Dialog.Header>
    
    <Dialog.Footer>
      <Button variant="outline" onclick={() => state.deleteDialogOpen = false}>
        Cancel
      </Button>
      <Button variant="destructive" onclick={deleteFolder}>
        <Trash2 class="h-4 w-4 mr-2" />
        Delete Folder
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>