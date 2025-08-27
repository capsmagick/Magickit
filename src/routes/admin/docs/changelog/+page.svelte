<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { 
		ArrowLeft, 
		Calendar, 
		Plus, 
		Bug, 
		Zap, 
		Shield,
		Sparkles
	} from '@lucide/svelte';
	import { goto } from '$app/navigation';

	const changelog = [
		{
			version: 'v2.1.0',
			date: '2024-01-20',
			type: 'major',
			changes: [
				{ type: 'feature', text: 'Added dynamic content management system' },
				{ type: 'feature', text: 'Implemented media browser dialog component' },
				{ type: 'feature', text: 'Enhanced system health monitoring' },
				{ type: 'improvement', text: 'Improved admin navigation structure' },
				{ type: 'improvement', text: 'Updated UI components to Svelte 5' },
				{ type: 'security', text: 'Enhanced brute force protection' }
			]
		},
		{
			version: 'v2.0.5',
			date: '2024-01-15',
			type: 'patch',
			changes: [
				{ type: 'bugfix', text: 'Fixed user session management issues' },
				{ type: 'bugfix', text: 'Resolved media upload progress tracking' },
				{ type: 'improvement', text: 'Optimized database query performance' }
			]
		},
		{
			version: 'v2.0.4',
			date: '2024-01-10',
			type: 'patch',
			changes: [
				{ type: 'security', text: 'Updated authentication middleware' },
				{ type: 'bugfix', text: 'Fixed role assignment validation' },
				{ type: 'improvement', text: 'Enhanced error handling in forms' }
			]
		},
		{
			version: 'v2.0.3',
			date: '2024-01-05',
			type: 'patch',
			changes: [
				{ type: 'feature', text: 'Added email template management' },
				{ type: 'improvement', text: 'Improved responsive design on mobile' },
				{ type: 'bugfix', text: 'Fixed notification system timing issues' }
			]
		},
		{
			version: 'v2.0.0',
			date: '2024-01-01',
			type: 'major',
			changes: [
				{ type: 'feature', text: 'Complete admin panel redesign' },
				{ type: 'feature', text: 'Implemented RBAC system' },
				{ type: 'feature', text: 'Added comprehensive user management' },
				{ type: 'feature', text: 'Integrated system monitoring dashboard' },
				{ type: 'security', text: 'Enhanced security features' },
				{ type: 'improvement', text: 'Migrated to SvelteKit with Svelte 5' }
			]
		}
	];

	function getVersionBadge(type: string) {
		switch (type) {
			case 'major':
				return { variant: 'default' as const, text: 'Major Release' };
			case 'minor':
				return { variant: 'secondary' as const, text: 'Minor Release' };
			case 'patch':
				return { variant: 'outline' as const, text: 'Patch Release' };
			default:
				return { variant: 'outline' as const, text: 'Release' };
		}
	}

	function getChangeIcon(type: string) {
		switch (type) {
			case 'feature':
				return { icon: Plus, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/20' };
			case 'improvement':
				return { icon: Zap, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/20' };
			case 'bugfix':
				return { icon: Bug, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/20' };
			case 'security':
				return { icon: Shield, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/20' };
			default:
				return { icon: Sparkles, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/20' };
		}
	}

	function getChangeTypeText(type: string) {
		switch (type) {
			case 'feature':
				return 'New Feature';
			case 'improvement':
				return 'Improvement';
			case 'bugfix':
				return 'Bug Fix';
			case 'security':
				return 'Security';
			default:
				return 'Change';
		}
	}
</script>

<svelte:head>
	<title>Changelog | Documentation | Admin | Magickit</title>
	<meta name="description" content="Magickit admin panel changelog and version history" />
</svelte:head>

<div class="space-y-6">
	<!-- Navigation -->
	<div class="flex items-center justify-between">
		<Button variant="ghost" onclick={() => goto('/admin/docs')} class="transition-colors duration-200">
			<ArrowLeft class="mr-2 h-4 w-4" />
			Back to Documentation
		</Button>
	</div>

	<!-- Header -->
	<div class="space-y-4">
		<div class="flex items-center gap-2">
			<Calendar class="h-6 w-6 text-primary" />
			<h1 class="text-3xl font-bold">Changelog</h1>
		</div>
		<p class="text-lg text-muted-foreground">
			Track all updates, new features, and improvements to the admin panel.
		</p>
	</div>

	<!-- Current Version Info -->
	<Card class="border-primary/50 bg-primary/5">
		<CardContent class="p-6">
			<div class="flex items-center justify-between">
				<div class="space-y-1">
					<div class="flex items-center gap-2">
						<h3 class="text-xl font-semibold">Current Version: v2.1.0</h3>
						<Badge variant="default">Latest</Badge>
					</div>
					<p class="text-muted-foreground">Released on January 20, 2024</p>
				</div>
				<div class="text-right">
					<p class="text-sm text-muted-foreground">Next Release</p>
					<p class="font-medium">v2.2.0 - Q2 2024</p>
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- Changelog Entries -->
	<div class="space-y-6">
		{#each changelog as release}
			{@const versionInfo = getVersionBadge(release.type)}
			
			<Card>
				<CardHeader>
					<div class="flex items-center justify-between">
						<div class="space-y-1">
							<div class="flex items-center gap-2">
								<CardTitle class="text-xl">{release.version}</CardTitle>
								<Badge variant={versionInfo.variant}>
									{versionInfo.text}
								</Badge>
							</div>
							<div class="flex items-center gap-1 text-sm text-muted-foreground">
								<Calendar class="h-4 w-4" />
								{new Date(release.date).toLocaleDateString('en-US', { 
									year: 'numeric', 
									month: 'long', 
									day: 'numeric' 
								})}
							</div>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<div class="space-y-3">
						{#each release.changes as change}
							{@const changeInfo = getChangeIcon(change.type)}
							
							<div class="flex items-start gap-3">
								<div class="flex-shrink-0 p-1.5 rounded-md {changeInfo.bg}">
									<svelte:component this={changeInfo.icon} class="h-3 w-3 {changeInfo.color}" />
								</div>
								<div class="space-y-1">
									<div class="flex items-center gap-2">
										<span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">
											{getChangeTypeText(change.type)}
										</span>
									</div>
									<p class="text-sm">{change.text}</p>
								</div>
							</div>
						{/each}
					</div>
				</CardContent>
			</Card>
		{/each}
	</div>

	<!-- Footer -->
	<Card class="bg-muted/50">
		<CardContent class="p-6 text-center space-y-4">
			<div class="space-y-2">
				<h3 class="font-semibold">Stay Updated</h3>
				<p class="text-sm text-muted-foreground">
					Want to be notified about new releases and updates?
				</p>
			</div>
			<div class="flex flex-col sm:flex-row gap-2 justify-center">
				<Button variant="outline" onclick={() => goto('/admin/notifications/user')}>
					Enable Notifications
				</Button>
				<Button variant="outline" onclick={() => goto('/admin/support/feedback')}>
					Request Features
				</Button>
			</div>
		</CardContent>
	</Card>

	<!-- Navigation -->
	<div class="flex items-center justify-center pt-6 border-t border-border">
		<Button variant="outline" onclick={() => goto('/admin/docs')} class="transition-colors duration-200">
			<ArrowLeft class="mr-2 h-4 w-4" />
			Back to Documentation
		</Button>
	</div>
</div>