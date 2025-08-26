<script lang="ts">
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import { Separator } from '$lib/components/ui/separator';
  import { 
    Activity, 
    AlertTriangle, 
    CheckCircle, 
    XCircle, 
    Clock, 
    Server, 
    Database, 
    HardDrive,
    Cpu,
    MemoryStick,
    RefreshCw,
    TrendingUp,
    Users,
    Zap
  } from '@lucide/svelte';
  import type { PageData } from './$types';
  import { onMount } from 'svelte';
  import { invalidateAll } from '$app/navigation';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  // Auto-refresh every 30 seconds
  let refreshInterval: NodeJS.Timeout;
  let isRefreshing = $state(false);

  onMount(() => {
    refreshInterval = setInterval(async () => {
      if (!isRefreshing) {
        await refreshData();
      }
    }, 30000);

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  });

  async function refreshData() {
    isRefreshing = true;
    try {
      await invalidateAll();
    } finally {
      isRefreshing = false;
    }
  }

  async function forceMetricsCollection() {
    isRefreshing = true;
    try {
      const response = await fetch('/api/admin/system/collect-metrics', {
        method: 'POST'
      });
      
      if (response.ok) {
        await invalidateAll();
      }
    } catch (error) {
      console.error('Error forcing metrics collection:', error);
    } finally {
      isRefreshing = false;
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'healthy':
        return CheckCircle;
      case 'warning':
        return AlertTriangle;
      case 'critical':
        return XCircle;
      default:
        return Activity;
    }
  }

  function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  function formatBytes(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  let systemStatus = $derived(data.systemStatus);
  let systemStats = $derived(data.systemStats);
  let latestMetrics = $derived(data.latestMetrics);
  let StatusIcon = $derived(getStatusIcon(systemStatus.status));
</script>

<svelte:head>
  <title>System Status - Admin Dashboard</title>
</svelte:head>

<div class="container mx-auto p-6 space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">System Status</h1>
      <p class="text-muted-foreground">
        Real-time system health monitoring and status overview
      </p>
    </div>
    <div class="flex items-center gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        onclick={refreshData}
        disabled={isRefreshing}
        class="transition-colors duration-200"
      >
        <RefreshCw class="h-4 w-4 {isRefreshing ? 'animate-spin' : ''}" />
        Refresh
      </Button>
      <Button 
        size="sm" 
        onclick={forceMetricsCollection}
        disabled={isRefreshing}
        class="transition-colors duration-200"
      >
        <Zap class="h-4 w-4" />
        Collect Metrics
      </Button>
    </div>
  </div>

  <!-- System Status Overview -->
  <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
    <!-- Overall Status -->
    <Card class="border-2 {getStatusColor(systemStatus.status)}">
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">System Status</CardTitle>
        <StatusIcon class="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold capitalize">{systemStatus.status}</div>
        <p class="text-xs text-muted-foreground">
          Last check: {new Date(systemStatus.lastCheck).toLocaleTimeString()}
        </p>
      </CardContent>
    </Card>

    <!-- Uptime -->
    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">System Uptime</CardTitle>
        <Clock class="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold">{formatUptime(systemStatus.uptime)}</div>
        <p class="text-xs text-muted-foreground">
          Since last restart
        </p>
      </CardContent>
    </Card>

    <!-- Active Alerts -->
    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Active Alerts</CardTitle>
        <AlertTriangle class="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold">{systemStats.activeAlerts}</div>
        <p class="text-xs text-muted-foreground">
          {systemStats.criticalAlerts} critical
        </p>
      </CardContent>
    </Card>

    <!-- Health Score -->
    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Health Score</CardTitle>
        <TrendingUp class="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold">{systemStats.averageHealthScore}%</div>
        <p class="text-xs text-muted-foreground">
          Average over last 10 checks
        </p>
      </CardContent>
    </Card>
  </div>

  <!-- Current System Metrics -->
  {#if latestMetrics}
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <!-- CPU Usage -->
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">CPU Usage</CardTitle>
          <Cpu class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{latestMetrics.cpu.usage.toFixed(1)}%</div>
          <div class="mt-2 space-y-1">
            <div class="flex justify-between text-xs">
              <span>Load Average:</span>
              <span>{latestMetrics.cpu.loadAverage.map(l => l.toFixed(2)).join(', ')}</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div 
                class="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style="width: {Math.min(100, latestMetrics.cpu.usage)}%"
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Memory Usage -->
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Memory Usage</CardTitle>
          <MemoryStick class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{latestMetrics.memory.percentage.toFixed(1)}%</div>
          <div class="mt-2 space-y-1">
            <div class="flex justify-between text-xs">
              <span>Used:</span>
              <span>{formatBytes(latestMetrics.memory.used)}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span>Total:</span>
              <span>{formatBytes(latestMetrics.memory.total)}</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div 
                class="bg-green-600 h-2 rounded-full transition-all duration-300" 
                style="width: {Math.min(100, latestMetrics.memory.percentage)}%"
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Disk Usage -->
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Disk Usage</CardTitle>
          <HardDrive class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{latestMetrics.disk.percentage.toFixed(1)}%</div>
          <div class="mt-2 space-y-1">
            <div class="flex justify-between text-xs">
              <span>Used:</span>
              <span>{formatBytes(latestMetrics.disk.used)}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span>Total:</span>
              <span>{formatBytes(latestMetrics.disk.total)}</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div 
                class="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                style="width: {Math.min(100, latestMetrics.disk.percentage)}%"
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Database Performance -->
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Database</CardTitle>
          <Database class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{latestMetrics.database.connections}</div>
          <div class="mt-2 space-y-1">
            <div class="flex justify-between text-xs">
              <span>Connections:</span>
              <span>{latestMetrics.database.connections}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span>Query Time:</span>
              <span>{latestMetrics.database.queryTime.toFixed(1)}ms</span>
            </div>
            <div class="flex justify-between text-xs">
              <span>Slow Queries:</span>
              <span>{latestMetrics.database.slowQueries}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Application Performance -->
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Application</CardTitle>
          <Server class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{latestMetrics.application.responseTime.toFixed(0)}ms</div>
          <div class="mt-2 space-y-1">
            <div class="flex justify-between text-xs">
              <span>Response Time:</span>
              <span>{latestMetrics.application.responseTime.toFixed(0)}ms</span>
            </div>
            <div class="flex justify-between text-xs">
              <span>Error Rate:</span>
              <span>{latestMetrics.application.errorRate.toFixed(2)}%</span>
            </div>
            <div class="flex justify-between text-xs">
              <span>Requests/min:</span>
              <span>{latestMetrics.application.requestsPerMinute}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Active Users -->
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Active Users</CardTitle>
          <Users class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{latestMetrics.application.activeUsers}</div>
          <div class="mt-2 space-y-1">
            <div class="flex justify-between text-xs">
              <span>Current Sessions:</span>
              <span>{latestMetrics.application.activeUsers}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span>Uptime:</span>
              <span>{formatUptime(latestMetrics.application.uptime)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  {/if}

  <!-- Active Alerts -->
  {#if systemStatus.alerts.length > 0}
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <AlertTriangle class="h-5 w-5 text-yellow-600" />
          Active Alerts ({systemStatus.alerts.length})
        </CardTitle>
        <CardDescription>
          Current system alerts requiring attention
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="space-y-3">
          {#each systemStatus.alerts as alert}
            <Alert class="border-l-4 {alert.type === 'critical' ? 'border-l-red-500' : alert.type === 'error' ? 'border-l-orange-500' : 'border-l-yellow-500'}">
              <AlertDescription class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <Badge variant={alert.type === 'critical' ? 'destructive' : 'secondary'}>
                    {alert.type}
                  </Badge>
                  <span class="font-medium">{alert.title || alert.message}</span>
                  <span class="text-sm text-muted-foreground">
                    {new Date(alert.createdAt).toLocaleString()}
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    Acknowledge
                  </Button>
                  <Button variant="outline" size="sm">
                    Resolve
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          {/each}
        </div>
      </CardContent>
    </Card>
  {:else}
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <CheckCircle class="h-5 w-5 text-green-600" />
          No Active Alerts
        </CardTitle>
        <CardDescription>
          All systems are operating normally
        </CardDescription>
      </CardHeader>
    </Card>
  {/if}

  <!-- Quick Actions -->
  <Card>
    <CardHeader>
      <CardTitle>Quick Actions</CardTitle>
      <CardDescription>
        Common system management tasks
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Button variant="outline" class="h-auto p-4 flex flex-col items-center gap-2">
          <RefreshCw class="h-6 w-6" />
          <span class="text-sm">Refresh Metrics</span>
        </Button>
        <Button variant="outline" class="h-auto p-4 flex flex-col items-center gap-2">
          <Database class="h-6 w-6" />
          <span class="text-sm">Database Status</span>
        </Button>
        <Button variant="outline" class="h-auto p-4 flex flex-col items-center gap-2">
          <Server class="h-6 w-6" />
          <span class="text-sm">Service Health</span>
        </Button>
        <Button variant="outline" class="h-auto p-4 flex flex-col items-center gap-2">
          <Activity class="h-6 w-6" />
          <span class="text-sm">View Logs</span>
        </Button>
      </div>
    </CardContent>
  </Card>

  <!-- Last Updated -->
  <div class="text-center text-sm text-muted-foreground">
    Last updated: {new Date(data.timestamp).toLocaleString()}
    {#if isRefreshing}
      <span class="ml-2 inline-flex items-center gap-1">
        <RefreshCw class="h-3 w-3 animate-spin" />
        Refreshing...
      </span>
    {/if}
  </div>
</div>