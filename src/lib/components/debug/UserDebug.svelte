<script lang="ts">
  import { authClient } from '$lib/auth/auth-client';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  
  const session = authClient.useSession();
  
  let showDebug = $state(false);
</script>

{#if $session.data?.user}
  <Card class="mb-4">
    <CardHeader>
      <CardTitle class="flex items-center justify-between">
        User Debug Info
        <button 
          onclick={() => showDebug = !showDebug}
          class="text-sm text-muted-foreground hover:text-foreground"
        >
          {showDebug ? 'Hide' : 'Show'}
        </button>
      </CardTitle>
    </CardHeader>
    {#if showDebug}
      <CardContent class="space-y-2">
        <div class="grid grid-cols-2 gap-2 text-sm">
          <div><strong>ID:</strong> {$session.data.user.id}</div>
          <div><strong>Email:</strong> {$session.data.user.email}</div>
          <div><strong>Name:</strong> {$session.data.user.name}</div>
          <div>
            <strong>Role:</strong> 
            <Badge variant={$session.data.user.role === 'admin' ? 'default' : 'secondary'}>
              {$session.data.user.role}
            </Badge>
          </div>
          <div><strong>Is Admin:</strong> {$session.data.user.role === 'admin' ? 'Yes' : 'No'}</div>
        </div>
        <details class="mt-4">
          <summary class="cursor-pointer text-sm font-medium">Full Session Data</summary>
          <pre class="mt-2 p-2 bg-muted rounded text-xs overflow-auto">{JSON.stringify($session.data, null, 2)}</pre>
        </details>
      </CardContent>
    {/if}
  </Card>
{:else}
  <Card class="mb-4">
    <CardContent class="p-4">
      <p class="text-sm text-muted-foreground">No user session found</p>
    </CardContent>
  </Card>
{/if}