<script lang="ts">
  import { onMount } from 'svelte';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
  } from '$lib/components/ui/select';
  import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
  } from '$lib/components/ui/table';
  import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger 
  } from '$lib/components/ui/dialog';
  import { 
    Calendar,
    Search, 
    Filter, 
    Download, 
    Eye,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Info,
    Loader2,
    RefreshCw
  } from '@lucide/svelte';
  import { toast } from 'svelte-sonner';

  // Component state
  let loading = $state(true);
  let auditLogs = $state<any[]>([]);
  let totalLogs = $state(0);
  let selectedLog = $state<any>(null);
  let showLogDetails = $state(false);

  // Pagination
  let currentPage = $state(1);
  let pageSize = $state(50);
  let totalPages = $derived(Math.ceil(totalLogs / pageSize));

  // Filters
  let filters = $state({
    userId: '',
    action: '',
    resource: '',
    success: '',
    startDate: '',
    endDate: '',
    search: ''
  });

  // Filter options
  const actionOptions = [
    'permission_check',
    'admin_access',
    'role_assigned',
    'role_removed',
    'role_created',
    'role_updated',
    'role_deleted',
    'content_created',
    'content_updated',
    'content_deleted',
    'content_published',
    'media_uploaded',
    'media_deleted',
    'user_created',
    'user_updated',
    'user_deleted'
  ];

  const resourceOptions = [
    'user',
    'role',
    'content',
    'content_type',
    'media',
    'media_folder',
    'system',
    'audit'
  ];

  // Load data on mount
  onMount(async () => {
    await loadAuditLogs();
  });

  async function loadAuditLogs() {
    try {
      loading = true;
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      });

      const response = await fetch(`/api/admin/audit-logs?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        auditLogs = data.logs;
        totalLogs = data.total;
      } else {
        throw new Error('Failed to load audit logs');
      }
    } catch (error) {
      console.error('Error loading audit logs:', error);
      toast.error('Failed to load audit logs');
    } finally {
      loading = false;
    }
  }

  async function exportAuditLogs() {
    try {
      const params = new URLSearchParams({
        export: 'true',
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      });

      const response = await fetch(`/api/admin/audit-logs/export?${params}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast.success('Audit logs exported successfully');
      } else {
        throw new Error('Failed to export audit logs');
      }
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      toast.error('Failed to export audit logs');
    }
  }

  function applyFilters() {
    currentPage = 1;
    loadAuditLogs();
  }

  function clearFilters() {
    filters = {
      userId: '',
      action: '',
      resource: '',
      success: '',
      startDate: '',
      endDate: '',
      search: ''
    };
    currentPage = 1;
    loadAuditLogs();
  }

  function changePage(page: number) {
    currentPage = page;
    loadAuditLogs();
  }

  function viewLogDetails(log: any) {
    selectedLog = log;
    showLogDetails = true;
  }

  function getSuccessIcon(success: boolean) {
    return success ? CheckCircle : XCircle;
  }

  function getSuccessVariant(success: boolean) {
    return success ? 'default' : 'destructive';
  }

  function getActionIcon(action: string) {
    if (action.includes('permission') || action.includes('access')) {
      return CheckCircle;
    } else if (action.includes('created') || action.includes('assigned')) {
      return Info;
    } else if (action.includes('deleted') || action.includes('removed')) {
      return AlertTriangle;
    } else {
      return Info;
    }
  }

  function formatTimestamp(timestamp: string) {
    return new Date(timestamp).toLocaleString();
  }

  function formatDetails(details: any) {
    return JSON.stringify(details, null, 2);
  }

  function truncateText(text: string, maxLength: number = 50) {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Audit Logs</h1>
      <p class="text-muted-foreground">
        View and analyze system activity and security events
      </p>
    </div>
    <div class="flex gap-2">
      <Button variant="outline" onclick={exportAuditLogs} class="gap-2">
        <Download class="h-4 w-4" />
        Export
      </Button>
      <Button onclick={loadAuditLogs} class="gap-2">
        <RefreshCw class="h-4 w-4" />
        Refresh
      </Button>
    </div>
  </div>

  <!-- Filters -->
  <Card>
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <Filter class="h-5 w-5" />
        Filters
      </CardTitle>
      <CardDescription>
        Filter audit logs by various criteria
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="space-y-2">
          <Label for="search">Search</Label>
          <div class="relative">
            <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              bind:value={filters.search}
              placeholder="Search logs..."
              class="pl-8"
            />
          </div>
        </div>

        <div class="space-y-2">
          <Label for="action">Action</Label>
          <Select bind:value={filters.action}>
            <SelectTrigger>
              <SelectValue placeholder="Select action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Actions</SelectItem>
              {#each actionOptions as action}
                <SelectItem value={action}>{action}</SelectItem>
              {/each}
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <Label for="resource">Resource</Label>
          <Select bind:value={filters.resource}>
            <SelectTrigger>
              <SelectValue placeholder="Select resource" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Resources</SelectItem>
              {#each resourceOptions as resource}
                <SelectItem value={resource}>{resource}</SelectItem>
              {/each}
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <Label for="success">Status</Label>
          <Select bind:value={filters.success}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              <SelectItem value="true">Success</SelectItem>
              <SelectItem value="false">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <Label for="start-date">Start Date</Label>
          <Input
            id="start-date"
            type="datetime-local"
            bind:value={filters.startDate}
          />
        </div>

        <div class="space-y-2">
          <Label for="end-date">End Date</Label>
          <Input
            id="end-date"
            type="datetime-local"
            bind:value={filters.endDate}
          />
        </div>

        <div class="space-y-2">
          <Label for="user-id">User ID</Label>
          <Input
            id="user-id"
            bind:value={filters.userId}
            placeholder="Enter user ID"
          />
        </div>

        <div class="flex items-end space-x-2">
          <Button onclick={applyFilters} class="flex-1">
            Apply Filters
          </Button>
          <Button variant="outline" onclick={clearFilters}>
            Clear
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>

  <!-- Audit Logs Table -->
  <Card>
    <CardHeader>
      <CardTitle>Audit Logs</CardTitle>
      <CardDescription>
        {totalLogs} total logs found
      </CardDescription>
    </CardHeader>
    <CardContent>
      {#if loading}
        <div class="flex items-center justify-center py-12">
          <div class="text-center space-y-4">
            <Loader2 class="h-8 w-8 animate-spin mx-auto text-primary" />
            <p class="text-sm text-muted-foreground">Loading audit logs...</p>
          </div>
        </div>
      {:else if auditLogs.length === 0}
        <div class="text-center py-12">
          <p class="text-muted-foreground">No audit logs found</p>
        </div>
      {:else}
        <div class="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Details</TableHead>
                <TableHead class="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {#each auditLogs as log}
                <TableRow>
                  <TableCell class="font-mono text-sm">
                    {formatTimestamp(log.timestamp)}
                  </TableCell>
                  <TableCell>
                    <div class="space-y-1">
                      <div class="font-medium">{log.userName || 'Unknown'}</div>
                      <div class="text-xs text-muted-foreground font-mono">
                        {log.userId}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div class="flex items-center gap-2">
                      {@const ActionIcon = getActionIcon(log.action)}
                      <ActionIcon class="h-4 w-4 text-muted-foreground" />
                      <span class="font-mono text-sm">{log.action}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.resource}</Badge>
                  </TableCell>
                  <TableCell>
                    {@const SuccessIcon = getSuccessIcon(log.success)}
                    <Badge variant={getSuccessVariant(log.success)} class="gap-1">
                      <SuccessIcon class="h-3 w-3" />
                      {log.success ? 'Success' : 'Failed'}
                    </Badge>
                  </TableCell>
                  <TableCell class="font-mono text-sm">
                    {log.ipAddress}
                  </TableCell>
                  <TableCell class="max-w-xs">
                    <div class="text-sm text-muted-foreground">
                      {truncateText(JSON.stringify(log.details))}
                    </div>
                  </TableCell>
                  <TableCell class="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onclick={() => viewLogDetails(log)}
                      class="h-8 w-8 p-0"
                    >
                      <Eye class="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              {/each}
            </TableBody>
          </Table>

          <!-- Pagination -->
          {#if totalPages > 1}
            <div class="flex items-center justify-between">
              <div class="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalLogs)} of {totalLogs} logs
              </div>
              <div class="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onclick={() => changePage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                {#each Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  return page;
                }) as page}
                  <Button
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    onclick={() => changePage(page)}
                  >
                    {page}
                  </Button>
                {/each}
                
                <Button
                  variant="outline"
                  size="sm"
                  onclick={() => changePage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </CardContent>
  </Card>
</div>

<!-- Log Details Dialog -->
<Dialog bind:open={showLogDetails}>
  <DialogContent class="max-w-4xl max-h-[80vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Audit Log Details</DialogTitle>
      <DialogDescription>
        Detailed information about this audit log entry
      </DialogDescription>
    </DialogHeader>
    
    {#if selectedLog}
      <div class="space-y-6">
        <!-- Basic Information -->
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label>Timestamp</Label>
            <div class="font-mono text-sm p-2 bg-muted rounded">
              {formatTimestamp(selectedLog.timestamp)}
            </div>
          </div>
          
          <div class="space-y-2">
            <Label>Status</Label>
            <div>
              {@const SuccessIcon = getSuccessIcon(selectedLog.success)}
              <Badge variant={getSuccessVariant(selectedLog.success)} class="gap-1">
                <SuccessIcon class="h-3 w-3" />
                {selectedLog.success ? 'Success' : 'Failed'}
              </Badge>
            </div>
          </div>
          
          <div class="space-y-2">
            <Label>User</Label>
            <div class="space-y-1">
              <div class="font-medium">{selectedLog.userName || 'Unknown'}</div>
              <div class="text-xs text-muted-foreground font-mono">
                {selectedLog.userId}
              </div>
            </div>
          </div>
          
          <div class="space-y-2">
            <Label>Action</Label>
            <div class="font-mono text-sm p-2 bg-muted rounded">
              {selectedLog.action}
            </div>
          </div>
          
          <div class="space-y-2">
            <Label>Resource</Label>
            <div>
              <Badge variant="outline">{selectedLog.resource}</Badge>
            </div>
          </div>
          
          <div class="space-y-2">
            <Label>Resource ID</Label>
            <div class="font-mono text-sm p-2 bg-muted rounded">
              {selectedLog.resourceId || 'N/A'}
            </div>
          </div>
          
          <div class="space-y-2">
            <Label>IP Address</Label>
            <div class="font-mono text-sm p-2 bg-muted rounded">
              {selectedLog.ipAddress}
            </div>
          </div>
          
          <div class="space-y-2">
            <Label>User Agent</Label>
            <div class="text-sm p-2 bg-muted rounded break-all">
              {selectedLog.userAgent}
            </div>
          </div>
        </div>

        <!-- Details -->
        <div class="space-y-2">
          <Label>Details</Label>
          <pre class="text-sm p-4 bg-muted rounded overflow-x-auto">
{formatDetails(selectedLog.details)}
          </pre>
        </div>
      </div>
    {/if}
  </DialogContent>
</Dialog>