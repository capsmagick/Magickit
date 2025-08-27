<script lang="ts">
  import AdminSectionGuard from '$lib/auth/AdminSectionGuard.svelte';
  import PermissionManager from '$lib/components/admin/PermissionManager.svelte';
  import AuditLogViewer from '$lib/components/admin/AuditLogViewer.svelte';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
  import { Badge } from '$lib/components/ui/badge';
  import { 
    Shield, 
    Users, 
    Key, 
    FileText, 
    Activity,
    CheckCircle,
    AlertTriangle
  } from '@lucide/svelte';

  // Mock statistics - in a real app, these would come from the server
  let stats = $state({
    totalRoles: 6,
    totalPermissions: 25,
    activeUsers: 142,
    recentAuditLogs: 1247,
    systemRoles: 2,
    customRoles: 4,
    criticalAlerts: 0,
    successfulLogins: 98.5
  });
</script>

<AdminSectionGuard section="roles">
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Access Control (RBAC)</h1>
        <p class="text-muted-foreground">
          Manage roles, permissions, and access control for your application
        </p>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Total Roles</CardTitle>
          <Shield class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{stats.totalRoles}</div>
          <div class="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" class="text-xs">
              {stats.systemRoles} System
            </Badge>
            <Badge variant="secondary" class="text-xs">
              {stats.customRoles} Custom
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Permissions</CardTitle>
          <Key class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{stats.totalPermissions}</div>
          <p class="text-xs text-muted-foreground">
            Granular access control
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Active Users</CardTitle>
          <Users class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{stats.activeUsers}</div>
          <div class="flex items-center gap-1 text-xs text-green-600">
            <CheckCircle class="h-3 w-3" />
            {stats.successfulLogins}% success rate
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Audit Logs</CardTitle>
          <Activity class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{stats.recentAuditLogs}</div>
          <div class="flex items-center gap-1 text-xs">
            {#if stats.criticalAlerts > 0}
              <AlertTriangle class="h-3 w-3 text-red-500" />
              <span class="text-red-600">{stats.criticalAlerts} alerts</span>
            {:else}
              <CheckCircle class="h-3 w-3 text-green-600" />
              <span class="text-green-600">No alerts</span>
            {/if}
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Main Content Tabs -->
    <Tabs value="roles" class="space-y-6">
      <TabsList class="grid w-full grid-cols-2">
        <TabsTrigger value="roles" class="gap-2">
          <Shield class="h-4 w-4" />
          Role Management
        </TabsTrigger>
        <TabsTrigger value="audit" class="gap-2">
          <FileText class="h-4 w-4" />
          Audit Logs
        </TabsTrigger>
      </TabsList>

      <TabsContent value="roles" class="space-y-6">
        <PermissionManager />
      </TabsContent>

      <TabsContent value="audit" class="space-y-6">
        <AuditLogViewer />
      </TabsContent>
    </Tabs>
  </div>
</AdminSectionGuard>