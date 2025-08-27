<script lang="ts">
  import { onMount } from 'svelte';
  import { canAccessAdminSection, loadUserPermissions, permissionsLoading } from './rbac-client';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import { Button } from '$lib/components/ui/button';
  import { ShieldX, Loader2 } from '@lucide/svelte';
  
  // Props
  interface Props {
    section: 'content' | 'media' | 'system' | 'users' | 'roles' | 'audit';
    fallback?: any; // Svelte component or content to show when access is denied
    loading?: any; // Svelte component or content to show while loading
    showFallback?: boolean; // Whether to show default fallback or hide completely
  }
  
  let { 
    section, 
    fallback, 
    loading, 
    showFallback = true,
    children 
  }: Props & { children: any } = $props();
  
  // Reactive permission check for admin section
  const canAccess = canAccessAdminSection(section);
  
  // Load permissions on mount
  onMount(() => {
    loadUserPermissions();
  });

  // Section display names
  const sectionNames = {
    content: 'Content Management',
    media: 'Media Management', 
    system: 'System Administration',
    users: 'User Management',
    roles: 'Role Management',
    audit: 'Audit Logs'
  };
</script>

{#if $permissionsLoading}
  {#if loading}
    {@render loading()}
  {:else}
    <div class="flex items-center justify-center p-8">
      <div class="text-center space-y-4">
        <Loader2 class="h-8 w-8 animate-spin mx-auto text-primary" />
        <p class="text-sm text-muted-foreground">Checking permissions...</p>
      </div>
    </div>
  {/if}
{:else if $canAccess}
  {@render children()}
{:else if fallback}
  {@render fallback()}
{:else if showFallback}
  <div class="container mx-auto px-4 py-8">
    <Alert variant="destructive" class="max-w-2xl mx-auto">
      <ShieldX class="h-4 w-4" />
      <AlertDescription class="space-y-4">
        <div>
          <h3 class="font-semibold mb-2">Access Denied</h3>
          <p class="text-sm">
            You don't have permission to access <strong>{sectionNames[section]}</strong>. 
            Please contact your administrator if you believe this is an error.
          </p>
        </div>
        <div class="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onclick={() => window.history.back()}
          >
            Go Back
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onclick={() => window.location.href = '/admin'}
          >
            Admin Dashboard
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  </div>
{:else}
  <!-- Show nothing when showFallback is false -->
{/if}