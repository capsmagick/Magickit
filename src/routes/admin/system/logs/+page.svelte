<script lang="ts">
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select';
  import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import { 
    Search, 
    Download, 
    RefreshCw, 
    Filter,
    Calendar,
    FileText,
    AlertTriangle,
    Info,
    AlertCircle,
    Bug,
    ChevronLeft,
    ChevronRight,
    BarChart3,
    TrendingUp,
    Activity,
    Clock
  } from '@lucide/svelte';
  import type { PageData } from './$types';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  // Filter state
  let searchQuery = $state(data.filters.search);
  let selectedLevel = $state(data.filters.level);
  let startDate = $state(data.filters.startDate.split('T')[0]);
  let endDate = $state(data.filters.endDate.split('T')[0]);
  let isRefreshing = $state(false);

  // Pagination state
  let currentPage = $state(data.filters.page);
  let pageSize = $state(data.filters.limit);

  async function applyFilters() {
    const params = new URLSearchParams();
    
    if (searchQuery) params.set('search', searchQuery);
    if (selectedLevel !== 'all') params.set('level', selectedLevel);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    params.set('page', '1'); // Reset to first page
    params.set('limit', pageSize.toString());

    await goto(`?${params.toString()}`);
  }

  async function changePage(newPage: number) {
    const params = new URLSearchParams($page.url.searchParams);
    params.set('page', newPage.toString());
    await goto(`?${params.toString()}`);
  }

  async function refreshLogs() {
    isRefreshing = true;
    try {
      await applyFilters();
    } finally {
      isRefreshing = false;
    }
  }

  async function exportLogs() {
    // In a real implementation, this would trigger a server-side export
    const params = new URLSearchParams($page.url.searchParams);
    params.set('export', 'true');
    
    // Create a temporary link to trigger download
    const link = document.createElement('a');
    link.href = `/api/admin/system/logs/export?${params.toString()}`;
    link.download = `system-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function getLogLevelColor(level: string) {
    switch (level) {
      case 'error':
        return 'destructive';
      case 'warn':
        return 'secondary';
      case 'info':
        return 'default';
      case 'debug':
        return 'outline';
      default:
        return 'secondary';
    }
  }

  function getLogLevelIcon(level: string) {
    switch (level) {
      case 'error':
        return AlertCircle;
      case 'warn':
        return AlertTriangle;
      case 'info':
        return Info;
      case 'debug':
        return Bug;
      default:
        return FileText;
    }
  }

  function formatTimestamp(timestamp: string) {
    return new Date(timestamp).toLocaleString();
  }

  function formatDuration(ms: number) {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }

  let logs = $derived(data.logs);
  let systemStats = $derived(data.systemStats);
  let alertStats = $derived(data.alertStatistics);
</script>

<svelte:head>
  <title>System Logs - Admin Dashboard</title>
</svelte:head>

<div class="container mx-auto p-6 space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">System Logs</h1>
      <p class="text-muted-foreground">
        System logs, performance metrics, and automated reports
      </p>
    </div>
    <div class="flex items-center gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        onclick={refreshLogs}
        disabled={isRefreshing}
        class="transition-colors duration-200"
      >
        <RefreshCw class="h-4 w-4 {isRefreshing ? 'animate-spin' : ''}" />
        Refresh
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        onclick={exportLogs}
        class="transition-colors duration-200"
      >
        <Download class="h-4 w-4" />
        Export
      </Button>
    </div>
  </div>

  <Tabs value="logs" class="space-y-6">
    <TabsList class="grid w-full grid-cols-3">
      <TabsTrigger value="logs">System Logs</TabsTrigger>
      <TabsTrigger value="performance">Performance Analysis</TabsTrigger>
      <TabsTrigger value="reports">Automated Reports</TabsTrigger>
    </TabsList>

    <!-- System Logs Tab -->
    <TabsContent value="logs" class="space-y-6">
      <!-- Filters -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Filter class="h-5 w-5" />
            Log Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <!-- Search -->
            <div class="space-y-2">
              <Label for="search">Search</Label>
              <div class="relative">
                <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="search"
                  bind:value={searchQuery}
                  placeholder="Search logs..."
                  class="pl-8"
                />
              </div>
            </div>

            <!-- Log Level -->
            <div class="space-y-2">
              <Label>Log Level</Label>
              <Select bind:value={selectedLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="All levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="warn">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="debug">Debug</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <!-- Start Date -->
            <div class="space-y-2">
              <Label for="start-date">Start Date</Label>
              <Input 
                id="start-date"
                type="date" 
                bind:value={startDate}
              />
            </div>

            <!-- End Date -->
            <div class="space-y-2">
              <Label for="end-date">End Date</Label>
              <Input 
                id="end-date"
                type="date" 
                bind:value={endDate}
              />
            </div>

            <!-- Apply Filters -->
            <div class="space-y-2">
              <Label>&nbsp;</Label>
              <Button onclick={applyFilters} class="w-full">
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Log Statistics -->
      <div class="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Total Logs</CardTitle>
            <FileText class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{logs.total.toLocaleString()}</div>
            <p class="text-xs text-muted-foreground">
              Showing {logs.entries.length} of {logs.total}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Error Logs</CardTitle>
            <AlertCircle class="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold text-red-600">
              {logs.entries.filter(log => log.level === 'error').length}
            </div>
            <p class="text-xs text-muted-foreground">
              In current view
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Warning Logs</CardTitle>
            <AlertTriangle class="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold text-yellow-600">
              {logs.entries.filter(log => log.level === 'warn').length}
            </div>
            <p class="text-xs text-muted-foreground">
              In current view
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Active Alerts</CardTitle>
            <Activity class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{systemStats.activeAlerts}</div>
            <p class="text-xs text-muted-foreground">
              System-wide
            </p>
          </CardContent>
        </Card>
      </div>

      <!-- Log Entries -->
      <Card>
        <CardHeader>
          <CardTitle>Log Entries</CardTitle>
          <CardDescription>
            System log entries for the selected time period and filters
          </CardDescription>
        </CardHeader>
        <CardContent>
          {#if logs.entries.length > 0}
            <div class="space-y-4">
              <!-- Log Table -->
              <div class="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead class="w-[180px]">Timestamp</TableHead>
                      <TableHead class="w-[80px]">Level</TableHead>
                      <TableHead class="w-[120px]">Source</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead class="w-[100px]">Duration</TableHead>
                      <TableHead class="w-[80px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {#each logs.entries as log}
                      <TableRow>
                        <TableCell class="font-mono text-xs">
                          {formatTimestamp(log.timestamp)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getLogLevelColor(log.level)} class="text-xs">
                            {#if getLogLevelIcon(log.level)}
                              {@const Icon = getLogLevelIcon(log.level)}
                              <Icon class="h-3 w-3 mr-1" />
                            {/if}
                            {log.level}
                          </Badge>
                        </TableCell>
                        <TableCell class="font-medium text-sm">
                          {log.source}
                        </TableCell>
                        <TableCell class="text-sm">
                          {log.message}
                          {#if log.details.userId}
                            <span class="text-xs text-muted-foreground ml-2">
                              User: {log.details.userId}
                            </span>
                          {/if}
                        </TableCell>
                        <TableCell class="font-mono text-xs">
                          {formatDuration(log.details.duration)}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={log.details.statusCode >= 500 ? 'destructive' : 
                                   log.details.statusCode >= 400 ? 'secondary' : 'default'}
                            class="text-xs"
                          >
                            {log.details.statusCode}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    {/each}
                  </TableBody>
                </Table>
              </div>

              <!-- Pagination -->
              <div class="flex items-center justify-between">
                <div class="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, logs.total)} of {logs.total} entries
                </div>
                <div class="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onclick={() => changePage(currentPage - 1)}
                    disabled={!logs.hasPrev}
                  >
                    <ChevronLeft class="h-4 w-4" />
                    Previous
                  </Button>
                  <span class="text-sm">
                    Page {currentPage} of {logs.totalPages}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onclick={() => changePage(currentPage + 1)}
                    disabled={!logs.hasNext}
                  >
                    Next
                    <ChevronRight class="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          {:else}
            <div class="text-center py-12">
              <FileText class="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 class="text-lg font-semibold mb-2">No logs found</h3>
              <p class="text-muted-foreground mb-4">
                No log entries match your current filters.
              </p>
              <Button variant="outline" onclick={() => { searchQuery = ''; selectedLevel = 'all'; applyFilters(); }}>
                Clear Filters
              </Button>
            </div>
          {/if}
        </CardContent>
      </Card>
    </TabsContent>

    <!-- Performance Analysis Tab -->
    <TabsContent value="performance" class="space-y-6">
      <!-- Performance Metrics Overview -->
      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              {data.metricsHistory.length > 0 
                ? Math.round(data.metricsHistory.reduce((sum, m) => sum + m.application.responseTime, 0) / data.metricsHistory.length)
                : 0}ms
            </div>
            <p class="text-xs text-muted-foreground">
              Over selected period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              {data.metricsHistory.length > 0 
                ? (data.metricsHistory.reduce((sum, m) => sum + m.application.errorRate, 0) / data.metricsHistory.length).toFixed(2)
                : 0}%
            </div>
            <p class="text-xs text-muted-foreground">
              Average error rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Requests/Min</CardTitle>
            <TrendingUp class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              {data.metricsHistory.length > 0 
                ? Math.round(data.metricsHistory.reduce((sum, m) => sum + m.application.requestsPerMinute, 0) / data.metricsHistory.length)
                : 0}
            </div>
            <p class="text-xs text-muted-foreground">
              Average throughput
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Health Score</CardTitle>
            <Activity class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{systemStats.averageHealthScore}%</div>
            <p class="text-xs text-muted-foreground">
              System health
            </p>
          </CardContent>
        </Card>
      </div>

      <!-- Performance Charts Placeholder -->
      <div class="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <BarChart3 class="h-5 w-5" />
              Response Time Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="h-64 flex items-center justify-center border rounded-lg bg-muted/10">
              <div class="text-center space-y-2">
                <BarChart3 class="h-8 w-8 mx-auto text-muted-foreground" />
                <p class="text-sm text-muted-foreground">
                  Performance chart visualization would be implemented here
                </p>
                <p class="text-xs text-muted-foreground">
                  Data points: {data.metricsHistory.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <TrendingUp class="h-5 w-5" />
              Error Rate Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="h-64 flex items-center justify-center border rounded-lg bg-muted/10">
              <div class="text-center space-y-2">
                <TrendingUp class="h-8 w-8 mx-auto text-muted-foreground" />
                <p class="text-sm text-muted-foreground">
                  Error rate chart visualization would be implemented here
                </p>
                <p class="text-xs text-muted-foreground">
                  Alert threshold breaches: {alertStats.overall.critical + alertStats.overall.error}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Performance Recommendations -->
      <Card>
        <CardHeader>
          <CardTitle>Performance Recommendations</CardTitle>
          <CardDescription>
            Automated analysis and suggestions for system optimization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <Alert>
              <Info class="h-4 w-4" />
              <AlertDescription>
                <strong>Database Performance:</strong> Consider adding indexes for frequently queried fields. 
                Average query time is within acceptable limits.
              </AlertDescription>
            </Alert>
            
            <Alert>
              <AlertTriangle class="h-4 w-4" />
              <AlertDescription>
                <strong>Memory Usage:</strong> Memory usage has been consistently above 80% during peak hours. 
                Consider scaling up or optimizing memory-intensive operations.
              </AlertDescription>
            </Alert>
            
            <Alert>
              <Info class="h-4 w-4" />
              <AlertDescription>
                <strong>Response Time:</strong> API response times are performing well. 
                95th percentile is under 500ms for most endpoints.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </TabsContent>

    <!-- Automated Reports Tab -->
    <TabsContent value="reports" class="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Automated Reports</CardTitle>
          <CardDescription>
            Scheduled system reports and analysis summaries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="space-y-6">
            <!-- Report Generation -->
            <div class="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle class="text-lg">Daily System Report</CardTitle>
                  <CardDescription>
                    Comprehensive daily system health and performance summary
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div class="space-y-4">
                    <div class="text-sm text-muted-foreground">
                      Last generated: {new Date().toLocaleDateString()}
                    </div>
                    <Button class="w-full">
                      <Download class="h-4 w-4 mr-2" />
                      Generate Daily Report
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle class="text-lg">Weekly Performance Analysis</CardTitle>
                  <CardDescription>
                    Weekly trends, patterns, and performance insights
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div class="space-y-4">
                    <div class="text-sm text-muted-foreground">
                      Last generated: {new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </div>
                    <Button class="w-full">
                      <Download class="h-4 w-4 mr-2" />
                      Generate Weekly Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <!-- Report History -->
            <Card>
              <CardHeader>
                <CardTitle>Report History</CardTitle>
                <CardDescription>
                  Previously generated system reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div class="space-y-3">
                  {#each Array(5) as _, i}
                    <div class="flex items-center justify-between p-3 border rounded-lg">
                      <div class="flex items-center gap-3">
                        <FileText class="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div class="font-medium">
                            {i === 0 ? 'Daily System Report' : i === 1 ? 'Weekly Performance Analysis' : 'Monthly Summary'}
                          </div>
                          <div class="text-sm text-muted-foreground">
                            Generated {new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div class="flex items-center gap-2">
                        <Badge variant="outline">PDF</Badge>
                        <Button variant="outline" size="sm">
                          <Download class="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  {/each}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  </Tabs>

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