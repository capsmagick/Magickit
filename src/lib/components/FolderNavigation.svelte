<!-- FolderNavigation.svelte -->
<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { ScrollArea } from '$lib/components/ui/scroll-area';
  import { cn } from '$lib/utils';
  
  // Icons
  import FolderIcon from '@lucide/svelte/icons/folder';
  import FolderOpenIcon from '@lucide/svelte/icons/folder-open';
  import HomeIcon from '@lucide/svelte/icons/home';
  
  import type { MediaFolder } from '$lib/db/models';

  interface Props {
    folders: MediaFolder[];
    currentFolder: MediaFolder | null;
    onFolderChange: (folder: MediaFolder | null) => void;
  }

  let { 
    folders, 
    currentFolder, 
    onFolderChange 
  }: Props = $props();

  // Build folder hierarchy for display
  function buildFolderHierarchy(folders: MediaFolder[]): FolderNode[] {
    const folderMap = new Map<string, FolderNode>();
    const rootFolders: FolderNode[] = [];

    // Create folder nodes
    folders.forEach(folder => {
      const node: FolderNode = {
        folder,
        children: [],
        isExpanded: false
      };
      folderMap.set(folder._id, node);
    });

    // Build hierarchy
    folders.forEach(folder => {
      const node = folderMap.get(folder._id)!;
      
      if (folder.parentId) {
        const parent = folderMap.get(folder.parentId);
        if (parent) {
          parent.children.push(node);
        } else {
          // Parent not found, treat as root
          rootFolders.push(node);
        }
      } else {
        rootFolders.push(node);
      }
    });

    // Sort folders alphabetically
    const sortFolders = (nodes: FolderNode[]) => {
      nodes.sort((a, b) => a.folder.name.localeCompare(b.folder.name));
      nodes.forEach(node => sortFolders(node.children));
    };
    
    sortFolders(rootFolders);
    return rootFolders;
  }

  interface FolderNode {
    folder: MediaFolder;
    children: FolderNode[];
    isExpanded: boolean;
  }

  // Get folder hierarchy
  let folderHierarchy = $derived(buildFolderHierarchy(folders));

  // Handle folder selection
  function handleFolderSelect(folder: MediaFolder | null) {
    onFolderChange(folder);
  }

  // Check if folder is currently selected
  function isSelected(folder: MediaFolder | null): boolean {
    if (!folder && !currentFolder) return true;
    if (!folder || !currentFolder) return false;
    return folder._id === currentFolder._id;
  }

  // Toggle folder expansion
  function toggleFolder(node: FolderNode) {
    node.isExpanded = !node.isExpanded;
  }

  // Render folder tree recursively
  function renderFolderNode(node: FolderNode, depth: number = 0) {
    const hasChildren = node.children.length > 0;
    const selected = isSelected(node.folder);
    
    return {
      node,
      depth,
      hasChildren,
      selected
    };
  }
</script>

<div class="space-y-2">
  <h3 class="text-sm font-medium text-muted-foreground mb-3">Folders</h3>
  
  <!-- Root folder (All Files) -->
  <Button
    variant={isSelected(null) ? 'default' : 'ghost'}
    class="w-full justify-start gap-2 h-8"
    onclick={() => handleFolderSelect(null)}
  >
    <HomeIcon class="h-4 w-4" />
    All Files
  </Button>

  <!-- Folder tree -->
  <ScrollArea class="max-h-[300px]">
    <div class="space-y-1">
      {#each folderHierarchy as node}
        {@render folderTree(node, 0)}
      {/each}
    </div>
  </ScrollArea>
</div>

{#snippet folderTree(node: FolderNode, depth: number)}
  {@const hasChildren = node.children.length > 0}
  {@const selected = isSelected(node.folder)}
  {@const paddingLeft = depth * 16 + 8}
  
  <div>
    <!-- Folder button -->
    <Button
      variant={selected ? 'default' : 'ghost'}
      class="w-full justify-start gap-2 h-8 text-sm"
      style="padding-left: {paddingLeft}px"
      onclick={() => handleFolderSelect(node.folder)}
    >
      {#if hasChildren}
        <button
          class="p-0 hover:bg-transparent"
          onclick={(e) => {
            e.stopPropagation();
            toggleFolder(node);
          }}
        >
          {#if node.isExpanded}
            <FolderOpenIcon class="h-4 w-4" />
          {:else}
            <FolderIcon class="h-4 w-4" />
          {/if}
        </button>
      {:else}
        <FolderIcon class="h-4 w-4" />
      {/if}
      
      <span class="truncate" title={node.folder.name}>
        {node.folder.name}
      </span>
    </Button>
    
    <!-- Children (if expanded) -->
    {#if hasChildren && node.isExpanded}
      {#each node.children as childNode}
        {@render folderTree(childNode, depth + 1)}
      {/each}
    {/if}
  </div>
{/snippet}