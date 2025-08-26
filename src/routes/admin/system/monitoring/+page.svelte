<script lang="ts">
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
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
    Zap,
    Settings,
    Bell,
    BarChart3,
    LineChart
  } from '@lucide/svelte';
  import type { PageData } from './$types';
  import { onMount, onDestroy } from 'svelte';
  import { invalidateAll } from '$app/navigation';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  // Real-time monitoring state
  let isLiveMode = $state(true);
  let refreshInterval: NodeJS.Timeout;
  let isRefreshing = $state(false);
  let selectedTimeRange = $state('1h');
  let alertThresholds = $state({
    cpu: { warning: 70, critical: 90 },
    memory: { warning: 80, critical: 95 },
    disk: { warning: 85, critical: 95 },
    responseTime: { warning: 1000, critical: 2000 },
    errorRate: { warning: 5, critical: 10 }
  });

  // Chart data processing
  let chartData = $state({
    cpu: [] as Array<{ time: string; value: number }>,
    memory: [] as Array<{ time: string; value: number }>,
    disk: [] as Array<{ time: string; value: number }>,
    responseTime: [] as Array<{ time: string; value: number }>,
    errorRate: [] as Array<{ time: string; value: number }>
  });

  onMount(() => {
    processChartData();
    
    if (isLiveMode) {
      startLiveUpdates();
    }

    return () => {
      stopLiveUpdates();
    };
  });

  onDestroy(() => {
    stopLiveUpdates();
  });

  function processChartData() {
    if (!data.metricsHistory || data.metricsHistory.length === 0) {
      return;
    }

    const sortedMetrics = [...data.metricsHistory].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    chartData.cpu = sortedMetrics.map(m => ({
      time: new Date(m.timestamp).toLocaleTimeString(),
      value: m.cpu.usage
    }));

    chartData.memory = sortedMetrics.map(m => ({
      time: new Date(m.timestamp).toLocaleTimeString(),
      value: m.memory.percentage
    }));

    chartData.disk = sortedMetrics.map(m => ({
      time: new Date(m.timestamp).toLocaleTimeString(),
      value: m.disk.percentage
    }));

    chartData.responseTime = sortedMetrics.map(m => ({
      time: new Date(m.timestamp).toLocaleTimeString(),
      value: m.application.responseTime
    }));

    chartData.errorRate = sortedMetrics.map(m => ({
      time: new Date(m.timestamp).toLocaleTimeString(),
      value: m.application.errorRate
    }));
  }

  function startLiveUpdates() {
    refreshInterval = setInterval(async () => {
      if (!isRefreshing && isLiveMode) {
        await refreshData();
      }
    }, 10000); // Update every 10 seconds
  }

  function stopLiveUpdates() {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
  }

  async function refreshData() {
    isRefreshing = true;
    try {
      await invalidateAll();
      processChartData();
    } finally {
      isRefreshing = false;
    }
  }

  function toggleLiveMode() {
    isLiveMode = !isLiveMode;
    if (isLiveMode) {
      startLiveUpdates();
    } else {
      stopLiveUpdates();
    }
  }

  async function changeTimeRange(range: string) {
    selectedTimeRange = range;
    // In a real implementation, you would reload data with the new time range
    await refreshData();
  }

  function getMetricColor(value: number, thresholds: { warning: number; critical: number }) {
    if (value >= thresholds.critical) return 'text-red-600';
    if (value >= thresholds.warning) return 'text-yellow-600';
    return 'text-green-600';
  }

  function getProgressBarColor(value: number, thresholds: { warning: number; critical: number }) {
    if (value >= thresholds.critical) return 'bg-red-500';
    if (value >= thresholds.warning) return 'bg-yellow-500';
    return 'bg-green-500';
  }

  function formatBytes(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  let latestMetrics = $derived(data.latestMetrics);
  let systemStatus = $derived(data.systemStatus);
  let alertStats = $derived(data.alertStatistics);
</script>

<svelte:head>
  <title>Real-time Monitoring - Admin Dashboard</title>
</svelte:head>

<div class="container mx-auto p-6 space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Real-time Monitoring</h1>
      <p class="text-muted-foreground">
        Live system metrics and performance monitoring
      </p>
    </div>
    <div class="flex items-center gap-2">
      <Button 
        variant={isLiveMode ? "default" : "outline"}
        size="sm" 
        onclick={toggleLiveMode}
        class="transition-colors duration-200"
      >
        <Activity class="h-4 w-4 {isLiveMode ? 'animate-pulse' : ''}" />
        {isLiveMode ? 'Live' : 'Paused'}
      </Button>
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
    </div>
  </div>

  <!-- Time Range Selector -->
  <Card>
    <CardHeader>
      <CardTitle class="text-lg">Time Range</CardTitle>
    </CardHeader>
    <CardContent>
      <div class="flex gap-2">
        {#each ['15m', '1h', '6h', '24h', '7d'] as range}
          <Button 
            variant={selectedTimeRange === range ? 'default' : 'outline'}
            size="sm"
            onclick={() => changeTimeRange(range)}
          >
            {range}
          </Button>
        {/each}
      </div>
    </CardContent>
  </Card>

  <Tabs value="metrics" class="space-y-6">
    <TabsList class="grid w-full grid-cols-3">
      <TabsTrigger value="metrics">Live Metrics</TabsTrigger>
      <TabsTrigger value="charts">Historical Charts</TabsTrigger>
      <TabsTrigger value="alerts">Alert Configuration</TabsTrigger>
    </TabsList>

    <!-- Live Metrics Tab -->
    <TabsContent value="metrics" class="space-y-6">
      {#if latestMetrics}
        <!-- Current Metrics Grid -->
        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <!-- CPU Usage -->
          <Card>
            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle class="text-sm font-medium">CPU Usage</CardTitle>
              <Cpu class="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div class="text-2xl font-bold {getMetricColor(latestMetrics.cpu.usage, alertThresholds.cpu)}">
                {latestMetrics.cpu.usage.toFixed(1)}%
              </div>
              <div class="mt-2 space-y-2">
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    class="h-2 rounded-full transition-all duration-300 {getProgressBarColor(latestMetrics.cpu.usage, alertThresholds.cpu)}" 
                    style="width: {Math.min(100, latestMetrics.cpu.usage)}%"
                  ></div>
                </div>
                <div class="flex justify-between text-xs text-muted-foreground">
                  <span>Load: {latestMetrics.cpu.loadAverage[0].toFixed(2)}</span>
                  <span>Cores: {latestMetrics.cpu.cores || 'N/A'}</span>
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
              <div class="text-2xl font-bold {getMetricColor(latestMetrics.memory.percentage, alertThresholds.memory)}">
                {latestMetrics.memory.percentage.toFixed(1)}%
              </div>
              <div class="mt-2 space-y-2">
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    class="h-2 rounded-full transition-all duration-300 {getProgressBarColor(latestMetrics.memory.percentage, alertThresholds.memory)}" 
                    style="width: {Math.min(100, latestMetrics.memory.percentage)}%"
                  ></div>
                </div>
                <div class="flex justify-between text-xs text-muted-foreground">
                  <span>{formatBytes(latestMetrics.memory.used)}</span>
                  <span>{formatBytes(latestMetrics.memory.total)}</span>
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
              <div class="text-2xl font-bold {getMetricColor(latestMetrics.disk.percentage, alertThresholds.disk)}">
                {latestMetrics.disk.percentage.toFixed(1)}%
              </div>
              <div class="mt-2 space-y-2">
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    class="h-2 rounded-full transition-all duration-300 {getProgressBarColor(latestMetrics.disk.percentage, alertThresholds.disk)}" 
                    style="width: {Math.min(100, latestMetrics.disk.percentage)}%"
                  ></div>
                </div>
                <div class="flex justify-between text-xs text-muted-foreground">
                  <span>{formatBytes(latestMetrics.disk.used)}</span>
                  <span>{formatBytes(latestMetrics.disk.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Response Time -->
          <Card>
            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle class="text-sm font-medium">Response Time</CardTitle>
              <Clock class="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div class="text-2xl font-bold {getMetricColor(latestMetrics.application.responseTime, alertThresholds.responseTime)}">
                {latestMetrics.application.responseTime.toFixed(0)}ms
              </div>
              <div class="mt-2 space-y-2">
                <div class="flex justify-between text-xs text-muted-foreground">
                  <span>Requests/min: {latestMetrics.application.requestsPerMinute}</span>
                  <span>Active Users: {latestMetrics.application.activeUsers}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Error Rate -->
          <Card>
            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle class="text-sm font-medium">Error Rate</CardTitle>
              <AlertTriangle class="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div class="text-2xl font-bold {getMetricColor(latestMetrics.application.errorRate, alertThresholds.errorRate)}">
                {latestMetrics.application.errorRate.toFixed(2)}%
              </div>
              <div class="mt-2 space-y-2">
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    class="h-2 rounded-full transition-all duration-300 {getProgressBarColor(latestMetrics.application.errorRate, alertThresholds.errorRate)}" 
                    style="width: {Math.min(100, latestMetrics.application.errorRate)}%"
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
                <div class="flex justify-between text-xs text-muted-foreground">
                  <span>Connections:</span>
                  <span>{latestMetrics.database.connections}</span>
                </div>
                <div class="flex justify-between text-xs text-muted-foreground">
                  <span>Query Time:</span>
                  <span>{latestMetrics.database.queryTime.toFixed(1)}ms</span>
                </div>
                <div class="flex justify-between text-xs text-muted-foreground">
                  <span>Slow Queries:</span>
                  <span>{latestMetrics.database.slowQueries}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      {:else}
        <Card>
          <CardContent class="flex items-center justify-center py-12">
            <div class="text-center space-y-4">
              <Server class="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h3 class="text-lg font-semibold">No Metrics Available</h3>
                <p class="text-muted-foreground">Waiting for system metrics to be collected...</p>
              </div>
              <Button onclick={refreshData} disabled={isRefreshing}>
                <RefreshCw class="h-4 w-4 mr-2 {isRefreshing ? 'animate-spin' : ''}" />
                Collect Metrics
              </Button>
            </div>
          </CardContent>
        </Card>
      {/if}
    </TabsContent>

    <!-- Historical Charts Tab -->
    <TabsContent value="charts" class="space-y-6">
      <div class="grid gap-6 md:grid-cols-2">
        <!-- CPU Chart -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Cpu class="h-5 w-5" />
              CPU Usage Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="h-64 flex items-center justify-center border rounded-lg bg-muted/10">
              <div class="text-center space-y-2">
                <BarChart3 class="h-8 w-8 mx-auto text-muted-foreground" />
                <p class="text-sm text-muted-foreground">
                  Chart visualization would be implemented here
                </p>
                <p class="text-xs text-muted-foreground">
                  Data points: {chartData.cpu.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Memory Chart -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <MemoryStick class="h-5 w-5" />
              Memory Usage Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="h-64 flex items-center justify-center border rounded-lg bg-muted/10">
              <div class="text-center space-y-2">
                <LineChart class="h-8 w-8 mx-auto text-muted-foreground" />
                <p class="text-sm text-muted-foreground">
                  Chart visualization would be implemented here
                </p>
                <p class="text-xs text-muted-foreground">
                  Data points: {chartData.memory.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Response Time Chart -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Clock class="h-5 w-5" />
              Response Time Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="h-64 flex items-center justify-center border rounded-lg bg-muted/10">
              <div class="text-center space-y-2">
                <TrendingUp class="h-8 w-8 mx-auto text-muted-foreground" />
                <p class="text-sm text-muted-foreground">
                  Chart visualization would be implemented here
                </p>
                <p class="text-xs text-muted-foreground">
                  Data points: {chartData.responseTime.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Error Rate Chart -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <AlertTriangle class="h-5 w-5" />
              Error Rate Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="h-64 flex items-center justify-center border rounded-lg bg-muted/10">
              <div class="text-center space-y-2">
                <Activity class="h-8 w-8 mx-auto text-muted-foreground" />
                <p class="text-sm text-muted-foreground">
                  Chart visualization would be implemented here
                </p>
                <p class="text-xs text-muted-foreground">
                  Data points: {chartData.errorRate.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TabsContent>

    <!-- Alert Configuration Tab -->
    <TabsContent value="alerts" class="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Settings class="h-5 w-5" />
            Alert Thresholds
          </CardTitle>
          <CardDescription>
            Configure warning and critical thresholds for system metrics
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-6">
          <!-- CPU Thresholds -->
          <div class="space-y-3">
            <Label class="text-sm font-medium">CPU Usage (%)</Label>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <Label for="cpu-warning" class="text-xs text-muted-foreground">Warning</Label>
                <Input 
                  id="cpu-warning"
                  type="number" 
                  bind:value={alertThresholds.cpu.warning}
                  min="0" 
                  max="100"
                  class="mt-1"
                />
              </div>
              <div>
                <Label for="cpu-critical" class="text-xs text-muted-foreground">Critical</Label>
                <Input 
                  id="cpu-critical"
                  type="number" 
                  bind:value={alertThresholds.cpu.critical}
                  min="0" 
                  max="100"
                  class="mt-1"
                />
              </div>
            </div>
          </div>

          <!-- Memory Thresholds -->
          <div class="space-y-3">
            <Label class="text-sm font-medium">Memory Usage (%)</Label>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <Label for="memory-warning" class="text-xs text-muted-foreground">Warning</Label>
                <Input 
                  id="memory-warning"
                  type="number" 
                  bind:value={alertThresholds.memory.warning}
                  min="0" 
                  max="100"
                  class="mt-1"
                />
              </div>
              <div>
                <Label for="memory-critical" class="text-xs text-muted-foreground">Critical</Label>
                <Input 
                  id="memory-critical"
                  type="number" 
                  bind:value={alertThresholds.memory.critical}
                  min="0" 
                  max="100"
                  class="mt-1"
                />
              </div>
            </div>
          </div>

          <!-- Disk Thresholds -->
          <div class="space-y-3">
            <Label class="text-sm font-medium">Disk Usage (%)</Label>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <Label for="disk-warning" class="text-xs text-muted-foreground">Warning</Label>
                <Input 
                  id="disk-warning"
                  type="number" 
                  bind:value={alertThresholds.disk.warning}
                  min="0" 
                  max="100"
                  class="mt-1"
                />
              </div>
              <div>
                <Label for="disk-critical" class="text-xs text-muted-foreground">Critical</Label>
                <Input 
                  id="disk-critical"
                  type="number" 
                  bind:value={alertThresholds.disk.critical}
                  min="0" 
                  max="100"
                  class="mt-1"
                />
              </div>
            </div>
          </div>

          <!-- Response Time Thresholds -->
          <div class="space-y-3">
            <Label class="text-sm font-medium">Response Time (ms)</Label>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <Label for="response-warning" class="text-xs text-muted-foreground">Warning</Label>
                <Input 
                  id="response-warning"
                  type="number" 
                  bind:value={alertThresholds.responseTime.warning}
                  min="0"
                  class="mt-1"
                />
              </div>
              <div>
                <Label for="response-critical" class="text-xs text-muted-foreground">Critical</Label>
                <Input 
                  id="response-critical"
                  type="number" 
                  bind:value={alertThresholds.responseTime.critical}
                  min="0"
                  class="mt-1"
                />
              </div>
            </div>
          </div>

          <div class="flex justify-end">
            <Button>
              <Bell class="h-4 w-4 mr-2" />
              Save Alert Configuration
            </Button>
          </div>
        </CardContent>
      </Card>

      <!-- Alert Statistics -->
      <Card>
        <CardHeader>
          <CardTitle>Alert Statistics</CardTitle>
          <CardDescription>
            Overview of system alerts for the selected time period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div class="text-center p-4 border rounded-lg">
              <div class="text-2xl font-bold text-red-600">{alertStats.overall.critical}</div>
              <div class="text-sm text-muted-foreground">Critical</div>
            </div>
            <div class="text-center p-4 border rounded-lg">
              <div class="text-2xl font-bold text-orange-600">{alertStats.overall.error}</div>
              <div class="text-sm text-muted-foreground">Error</div>
            </div>
            <div class="text-center p-4 border rounded-lg">
              <div class="text-2xl font-bold text-yellow-600">{alertStats.overall.warning}</div>
              <div class="text-sm text-muted-foreground">Warning</div>
            </div>
            <div class="text-center p-4 border rounded-lg">
              <div class="text-2xl font-bold text-green-600">{alertStats.overall.resolved}</div>
              <div class="text-sm text-muted-foreground">Resolved</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  </Tabs>

  <!-- Status Footer -->
  <div class="text-center text-sm text-muted-foreground">
    {#if isLiveMode}
      <span class="inline-flex items-center gap-1">
        <Activity class="h-3 w-3 animate-pulse text-green-500" />
        Live monitoring active - Updates every 10 seconds
      </span>
    {:else}
      <span>Live monitoring paused</span>
    {/if}
    <span class="mx-2">•</span>
    Last updated: {new Date(data.timestamp).toLocaleString()}
  </div>
</div>