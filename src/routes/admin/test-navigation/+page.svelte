<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { 
		CheckCircle, 
		XCircle, 
		Clock, 
		ExternalLink,
		RefreshCw,
		AlertTriangle
	} from '@lucide/svelte';
	import { goto } from '$app/navigation';

	// All admin routes that should be accessible
	const adminRoutes = [
		// Dashboard
		{ path: '/admin', title: 'Dashboard', category: 'Core' },
		
		// User Management
		{ path: '/admin/users', title: 'All Users', category: 'User Management' },
		{ path: '/admin/users/profiles', title: 'User Profiles', category: 'User Management' },
		{ path: '/admin/users/sessions', title: 'Login Sessions', category: 'User Management' },
		
		// Access Control
		{ path: '/admin/access-control', title: 'Access Control Overview', category: 'Access Control' },
		{ path: '/admin/access-control/roles', title: 'Roles', category: 'Access Control' },
		{ path: '/admin/access-control/permissions', title: 'Permissions', category: 'Access Control' },
		{ path: '/admin/access-control/assign', title: 'Assign Roles', category: 'Access Control' },
		{ path: '/admin/access-control/audit', title: 'Audit Access', category: 'Access Control' },
		
		// Content Management
		{ path: '/admin/content', title: 'Content Overview', category: 'Content Management' },
		{ path: '/admin/content/pages', title: 'Pages', category: 'Content Management' },
		{ path: '/admin/content/components', title: 'Components', category: 'Content Management' },
		{ path: '/admin/content/menus', title: 'Menus', category: 'Content Management' },
		{ path: '/admin/content/types', title: 'Content Types', category: 'Content Management' },
		{ path: '/admin/content/blog', title: 'Blog Posts', category: 'Content Management' },
		{ path: '/admin/content/blog/create', title: 'Create Blog Post', category: 'Content Management' },
		
		// Media Management
		{ path: '/admin/media', title: 'Media Library', category: 'Media Management' },
		{ path: '/admin/media/upload', title: 'Upload Files', category: 'Media Management' },
		{ path: '/admin/media/folders', title: 'Organize Folders', category: 'Media Management' },
		
		// System Health
		{ path: '/admin/system', title: 'System Overview', category: 'System Health' },
		{ path: '/admin/system/status', title: 'System Status', category: 'System Health' },
		{ path: '/admin/system/monitoring', title: 'Real-time Monitoring', category: 'System Health' },
		{ path: '/admin/system/logs', title: 'System Logs', category: 'System Health' },
		{ path: '/admin/system/performance', title: 'Performance Metrics', category: 'System Health' },
		
		// Documentation
		{ path: '/admin/docs', title: 'Documentation Home', category: 'Documentation' },
		{ path: '/admin/docs/introduction', title: 'Introduction', category: 'Documentation' },
		{ path: '/admin/docs/getting-started', title: 'Getting Started', category: 'Documentation' },
		{ path: '/admin/docs/tutorials', title: 'Tutorials', category: 'Documentation' },
		{ path: '/admin/docs/changelog', title: 'Changelog', category: 'Documentation' },
		
		// Notifications
		{ path: '/admin/notifications', title: 'Notifications Overview', category: 'Notifications' },
		{ path: '/admin/notifications/user', title: 'User Notifications', category: 'Notifications' },
		{ path: '/admin/notifications/system', title: 'System Alerts', category: 'Notifications' },
		{ path: '/admin/notifications/templates', title: 'Email Templates', category: 'Notifications' },
		
		// Security
		{ path: '/admin/security', title: 'Security Overview', category: 'Security' },
		{ path: '/admin/security/ip-access', title: 'IP Access Control', category: 'Security' },
		{ path: '/admin/security/brute-force', title: 'Brute Force Protection', category: 'Security' },
		{ path: '/admin/security/audit-trails', title: 'Audit Trails', category: 'Security' },
		
		// Support
		{ path: '/admin/support', title: 'Support Overview', category: 'Support' },
		{ path: '/admin/support/tickets', title: 'Support Tickets', category: 'Support' },
		{ path: '/admin/support/contact', title: 'Contact Submissions', category: 'Support' },
		{ path: '/admin/support/knowledge-base', title: 'Knowledge Base', category: 'Support' },
		{ path: '/admin/support/feedback', title: 'Feedback', category: 'Support' }
	];

	let testResults = $state<Record<string, 'pending' | 'success' | 'error' | 'warning'>>({});
	let isTestingAll = $state(false);
	let testProgress = $state(0);

	// Group routes by category
	const routesByCategory = $derived(() => {
		const grouped: Record<string, typeof adminRoutes> = {};
		adminRoutes.forEach(route => {
			if (!grouped[route.category]) {
				grouped[route.category] = [];
			}
			grouped[route.category].push(route);
		});
		return grouped;
	});

	// Calculate test statistics
	const testStats = $derived(() => {
		const total = adminRoutes.length;
		const tested = Object.keys(testResults).length;
		const passed = Object.values(testResults).filter(result => result === 'success').length;
		const failed = Object.values(testResults).filter(result => result === 'error').length;
		const warnings = Object.values(testResults).filter(result => result === 'warning').length;
		
		return { total, tested, passed, failed, warnings };
	});

	async function testRoute(path: string): Promise<'success' | 'error' | 'warning'> {
		try {
			const response = await fetch(path, { method: 'HEAD' });
			
			if (response.status === 200) {
				return 'success';
			} else if (response.status === 404) {
				return 'error';
			} else {
				return 'warning';
			}
		} catch (error) {
			console.error(`Error testing route ${path}:`, error);
			return 'error';
		}
	}

	async function testSingleRoute(route: typeof adminRoutes[0]) {
		testResults[route.path] = 'pending';
		const result = await testRoute(route.path);
		testResults[route.path] = result;
	}

	async function testAllRoutes() {
		isTestingAll = true;
		testProgress = 0;
		testResults = {};

		for (let i = 0; i < adminRoutes.length; i++) {
			const route = adminRoutes[i];
			await testSingleRoute(route);
			testProgress = ((i + 1) / adminRoutes.length) * 100;
			
			// Small delay to prevent overwhelming the server
			await new Promise(resolve => setTimeout(resolve, 100));
		}

		isTestingAll = false;
	}

	function getStatusIcon(status: string) {
		switch (status) {
			case 'success':
				return { icon: CheckCircle, color: 'text-green-600' };
			case 'error':
				return { icon: XCircle, color: 'text-red-600' };
			case 'warning':
				return { icon: AlertTriangle, color: 'text-yellow-600' };
			case 'pending':
				return { icon: Clock, color: 'text-blue-600' };
			default:
				return { icon: Clock, color: 'text-gray-400' };
		}
	}

	function getStatusBadge(status: string) {
		switch (status) {
			case 'success':
				return { variant: 'default' as const, text: 'Available' };
			case 'error':
				return { variant: 'destructive' as const, text: 'Not Found' };
			case 'warning':
				return { variant: 'secondary' as const, text: 'Warning' };
			case 'pending':
				return { variant: 'outline' as const, text: 'Testing...' };
			default:
				return { variant: 'outline' as const, text: 'Not Tested' };
		}
	}
</script>

<svelte:head>
	<title>Navigation Test | Admin | Magickit</title>
	<meta name="description" content="Test all admin navigation routes" />
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="space-y-2">
			<h1 class="text-2xl font-bold">Navigation Test</h1>
			<p class="text-muted-foreground">
				Test all admin panel routes to ensure proper navigation and error handling
			</p>
		</div>
		<Button 
			onclick={testAllRoutes} 
			disabled={isTestingAll}
			class="transition-colors duration-200"
		>
			{#if isTestingAll}
				<RefreshCw class="mr-2 h-4 w-4 animate-spin" />
				Testing... ({Math.round(testProgress)}%)
			{:else}
				<RefreshCw class="mr-2 h-4 w-4" />
				Test All Routes
			{/if}
		</Button>
	</div>

	<!-- Test Statistics -->
	<div class="grid grid-cols-2 md:grid-cols-5 gap-4">
		<Card>
			<CardContent class="p-4 text-center">
				<div class="text-2xl font-bold">{testStats.total}</div>
				<div class="text-sm text-muted-foreground">Total Routes</div>
			</CardContent>
		</Card>
		<Card>
			<CardContent class="p-4 text-center">
				<div class="text-2xl font-bold">{testStats.tested}</div>
				<div class="text-sm text-muted-foreground">Tested</div>
			</CardContent>
		</Card>
		<Card>
			<CardContent class="p-4 text-center">
				<div class="text-2xl font-bold text-green-600">{testStats.passed}</div>
				<div class="text-sm text-muted-foreground">Passed</div>
			</CardContent>
		</Card>
		<Card>
			<CardContent class="p-4 text-center">
				<div class="text-2xl font-bold text-yellow-600">{testStats.warnings}</div>
				<div class="text-sm text-muted-foreground">Warnings</div>
			</CardContent>
		</Card>
		<Card>
			<CardContent class="p-4 text-center">
				<div class="text-2xl font-bold text-red-600">{testStats.failed}</div>
				<div class="text-sm text-muted-foreground">Failed</div>
			</CardContent>
		</Card>
	</div>

	<!-- Progress Bar -->
	{#if isTestingAll}
		<Card>
			<CardContent class="p-4">
				<div class="space-y-2">
					<div class="flex justify-between text-sm">
						<span>Testing Progress</span>
						<span>{Math.round(testProgress)}%</span>
					</div>
					<div class="w-full bg-muted rounded-full h-2">
						<div 
							class="bg-primary h-2 rounded-full transition-all duration-300" 
							style="width: {testProgress}%"
						></div>
					</div>
				</div>
			</CardContent>
		</Card>
	{/if}

	<!-- Route Tests by Category -->
	{#each Object.entries(routesByCategory) as [category, routes]}
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center justify-between">
					<span>{category}</span>
					<Badge variant="outline">{routes.length} routes</Badge>
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="space-y-3">
					{#each routes as route}
						{@const status = testResults[route.path]}
						{@const statusInfo = getStatusIcon(status)}
						{@const badgeInfo = getStatusBadge(status)}
						
						<div class="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 transition-colors duration-200">
							<div class="flex items-center gap-3">
								<statusInfo.icon class="h-4 w-4 {statusInfo.color}" />
								<div class="space-y-1">
									<h4 class="font-medium text-sm">{route.title}</h4>
									<p class="text-xs text-muted-foreground font-mono">{route.path}</p>
								</div>
							</div>
							<div class="flex items-center gap-2">
								<Badge variant={badgeInfo.variant} class="text-xs">
									{badgeInfo.text}
								</Badge>
								<Button 
									variant="ghost" 
									size="icon"
									onclick={() => testSingleRoute(route)}
									disabled={status === 'pending'}
									class="transition-colors duration-200"
								>
									<RefreshCw class="h-4 w-4 {status === 'pending' ? 'animate-spin' : ''}" />
								</Button>
								<Button 
									variant="ghost" 
									size="icon"
									onclick={() => goto(route.path)}
									class="transition-colors duration-200"
								>
									<ExternalLink class="h-4 w-4" />
								</Button>
							</div>
						</div>
					{/each}
				</div>
			</CardContent>
		</Card>
	{/each}

	<!-- Help Section -->
	<Card class="bg-muted/50">
		<CardContent class="p-6 text-center space-y-4">
			<div class="space-y-2">
				<h3 class="font-semibold">About This Test</h3>
				<p class="text-sm text-muted-foreground">
					This page tests all admin panel routes to ensure they are accessible and properly configured. 
					Routes that return 404 errors may need to be implemented or fixed.
				</p>
			</div>
			<div class="flex flex-col sm:flex-row gap-2 justify-center">
				<Button variant="outline" onclick={() => goto('/admin/docs')} class="transition-colors duration-200">
					View Documentation
				</Button>
				<Button variant="outline" onclick={() => goto('/admin/support/contact')} class="transition-colors duration-200">
					Report Issues
				</Button>
			</div>
		</CardContent>
	</Card>
</div>