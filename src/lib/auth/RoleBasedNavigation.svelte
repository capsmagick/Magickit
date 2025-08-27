<script lang="ts">
  import { onMount } from 'svelte';
  import { canAccessAdminSection, loadUserPermissions, permissionsLoading } from './rbac-client';
  
  // Props
  interface Props {
    sections: Array<{
      section: 'content' | 'media' | 'system' | 'users' | 'roles' | 'audit';
      component: any;
    }>;
  }
  
  let { sections }: Props = $props();
  
  // Load permissions on mount
  onMount(() => {
    loadUserPermissions();
  });
  
  // Create reactive permission checks for each section
  const sectionPermissions = sections.map(({ section }) => ({
    section,
    canAccess: canAccessAdminSection(section)
  }));
</script>

{#if !$permissionsLoading}
  {#each sections as { section, component }, index}
    {#if $sectionPermissions[index].canAccess}
      {@render component()}
    {/if}
  {/each}
{/if}