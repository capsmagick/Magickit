<script lang="ts">
  import { onMount } from 'svelte';
  import { hasPermission, loadUserPermissions, permissionsLoading } from './rbac-client';
  
  // Props
  interface Props {
    resource: string;
    action: string;
    fallback?: any; // Svelte component or content to show when permission is denied
    loading?: any; // Svelte component or content to show while loading
  }
  
  let { resource, action, fallback, loading, children }: Props & { children: any } = $props();
  
  // Reactive permission check
  const canAccess = hasPermission(resource, action);
  
  // Load permissions on mount
  onMount(() => {
    loadUserPermissions();
  });
</script>

{#if $permissionsLoading}
  {#if loading}
    {@render loading()}
  {:else}
    <div class="flex items-center justify-center p-4">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
    </div>
  {/if}
{:else if $canAccess}
  {@render children()}
{:else if fallback}
  {@render fallback()}
{:else}
  <!-- Default fallback: show nothing -->
{/if}