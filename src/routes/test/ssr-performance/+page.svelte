<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Clock, Database, Zap, CheckCircle } from '@lucide/svelte';
	import { onMount } from 'svelte';

	interface TestResult {
		url: string;
		responseTime: number;
		cacheStatus: 'HIT' | 'MISS';
		status: number;
		contentLength: number;
		timestamp: Date;
	}

	let testResults = $state<TestResult[]>([]);
	let isRunning = $state(false);

	const testUrls = [
		'/',
		'/about',
		'/services',
		'/contact',
		'/blog',
		'/portfolio'
	];

	async function runSSRTest() {
		isRunning = true;
		testResults = [];

		for (const url of testUrls) {
			try {
				const startTime = performance.now();
				const response = await fetch(url, {
					headers: {
						'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
					}
				});
				const endTime = performance.now();

				const result: TestResult = {
					url,
					responseTime: endTime - startTime,
					cacheStatus: response.headers.get('x-cache') as 'HIT' | 'MISS' || 'UNKNOWN',
					status: response.status,
					contentLength: parseInt(response.headers.get('content-length') || '0'),
					timestamp: new Date()
				};

				testResults = [...testResults, result];
			} catch (error) {
				console.error(`Failed to test ${url}:`, error);
				testResults = [...testResults, {
					url,
					responseTime: -1,
					cacheStatus: 'MISS',
					status: 500,
					contentLength: 0,
					timestamp: new Date()
				}];
			}

			// Small delay between requests
			await new Promise(resolve => setTimeout(resolve, 100));
		}

		isRunning = false;
	}

	function formatResponseTime(ms: number): string {
		if (ms < 0) return 'Error';
		if (ms < 1000) return `${ms.toFixed(0)}ms`;
		return `${(ms / 1000).toFixed(2)}s`;
	}

	function getPerformanceBadge(ms: number): { variant: 'default' | 'secondary' | 'destructive'; text: string } {
		if (ms < 0) return { variant: 'destructive', text: 'Error' };
		if (ms < 200) return { variant: 'default', text: 'Excellent' };
		if (ms < 500) return { variant: 'secondary', text: 'Good' };
		return { variant: 'destructive', text: 'Slow' };
	}

	function formatContentLength(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
	}

	onMount(() => {
		// Run initial test
		runSSRTest();
	});
</script>

<svelte:head>
	<title>SSR Performance Test - MagicKit</title>
	<meta name="description" content="Test server-side rendering performance and caching" />
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<div class="max-w-4xl mx-auto space-y-6">
		<!-- Header -->
		<div class="text-center space-y-4">
			<h1 class="text-2xl lg:text-4xl font-bold">SSR Performance Test</h1>
			<p class="text-lg text-muted-foreground">
				Test server-side rendering performance and caching efficiency
			</p>
			<Button onclick={runSSRTest} disabled={isRunning} class="transition-colors duration-200">
				{#if isRunning}
					<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
					Running Tests...
				{:else}
					<Zap class="mr-2 h-4 w-4" />
					Run Performance Test
				{/if}
			</Button>
		</div>

		<!-- Test Results Summary -->
		{#if testResults.length > 0}
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
				<Card>
					<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle class="text-sm font-medium">Average Response Time</CardTitle>
						<Clock class="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						{@const validResults = testResults.filter(r => r.responseTime > 0)}
						{@const avgTime = validResults.length > 0 
							? validResults.reduce((sum, r) => sum + r.responseTime, 0) / validResults.length 
							: 0}
						<div class="text-2xl font-bold">{formatResponseTime(avgTime)}</div>
						<p class="text-xs text-muted-foreground">
							{avgTime < 200 ? 'Excellent' : avgTime < 500 ? 'Good' : 'Needs improvement'}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle class="text-sm font-medium">Cache Hit Rate</CardTitle>
						<Database class="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						{@const cacheHits = testResults.filter(r => r.cacheStatus === 'HIT').length}
						{@const hitRate = testResults.length > 0 ? (cacheHits / testResults.length) * 100 : 0}
						<div class="text-2xl font-bold">{hitRate.toFixed(1)}%</div>
						<p class="text-xs text-muted-foreground">
							{cacheHits}/{testResults.length} cache hits
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle class="text-sm font-medium">Success Rate</CardTitle>
						<CheckCircle class="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						{@const successCount = testResults.filter(r => r.status === 200).length}
						{@const successRate = testResults.length > 0 ? (successCount / testResults.length) * 100 : 0}
						<div class="text-2xl font-bold">{successRate.toFixed(1)}%</div>
						<p class="text-xs text-muted-foreground">
							{successCount}/{testResults.length} successful
						</p>
					</CardContent>
				</Card>
			</div>
		{/if}

		<!-- Detailed Results -->
		{#if testResults.length > 0}
			<Card>
				<CardHeader>
					<CardTitle>Test Results</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="space-y-3">
						{#each testResults as result}
							<div class="flex items-center justify-between p-4 border rounded-lg">
								<div class="flex items-center gap-3">
									<div class="font-medium">{result.url}</div>
									<Badge variant={getPerformanceBadge(result.responseTime).variant}>
										{getPerformanceBadge(result.responseTime).text}
									</Badge>
									<Badge variant={result.cacheStatus === 'HIT' ? 'default' : 'secondary'}>
										{result.cacheStatus}
									</Badge>
									<Badge variant={result.status === 200 ? 'default' : 'destructive'}>
										{result.status}
									</Badge>
								</div>
								<div class="flex items-center gap-4 text-sm text-muted-foreground">
									<span>{formatResponseTime(result.responseTime)}</span>
									<span>{formatContentLength(result.contentLength)}</span>
									<span>{result.timestamp.toLocaleTimeString()}</span>
								</div>
							</div>
						{/each}
					</div>
				</CardContent>
			</Card>
		{/if}

		<!-- Performance Tips -->
		<Card>
			<CardHeader>
				<CardTitle>Performance Optimization Tips</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="space-y-4">
					<div class="space-y-2">
						<h3 class="font-medium">Server-Side Rendering (SSR)</h3>
						<ul class="text-sm text-muted-foreground space-y-1 ml-4">
							<li>• Content is rendered on the server for better SEO and initial load performance</li>
							<li>• Dynamic content is fetched from the database and cached for subsequent requests</li>
							<li>• Cache headers are set to optimize browser and CDN caching</li>
						</ul>
					</div>
					
					<div class="space-y-2">
						<h3 class="font-medium">Caching Strategy</h3>
						<ul class="text-sm text-muted-foreground space-y-1 ml-4">
							<li>• First request (MISS): Content loaded from database and cached</li>
							<li>• Subsequent requests (HIT): Content served from cache for faster response</li>
							<li>• Cache automatically invalidates when content is updated</li>
						</ul>
					</div>

					<div class="space-y-2">
						<h3 class="font-medium">Performance Monitoring</h3>
						<ul class="text-sm text-muted-foreground space-y-1 ml-4">
							<li>• Response times are tracked for all SSR requests</li>
							<li>• Database query counts are monitored to identify optimization opportunities</li>
							<li>• Memory usage is tracked to prevent memory leaks</li>
						</ul>
					</div>
				</div>
			</CardContent>
		</Card>
	</div>
</div>