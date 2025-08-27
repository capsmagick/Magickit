<script lang="ts">
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import SkipNavigation from '$lib/components/SkipNavigation.svelte';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { page } from '$app/stores';
	import { generateBreadcrumbs } from '$lib/utils/breadcrumb.js';

	let { children } = $props();

	// Custom labels for better UX
	const customLabels: Record<string, string> = {
		admin: 'Admin Panel',
		users: 'User Management',
		settings: 'Settings',
		dashboard: 'Dashboard',
		analytics: 'Analytics',
		reports: 'Reports',
		permissions: 'Permissions',
		logs: 'System Logs'
	};

	// Generate dynamic breadcrumbs based on current route
	const breadcrumbs = $derived(
		generateBreadcrumbs($page.url.pathname, {
			customLabels,
			excludeSegments: []
		})
	);
</script>

<!-- Skip Navigation Links -->
<SkipNavigation 
	links={[
		{ href: '#main-content', label: 'Skip to main content' },
		{ href: '#navigation', label: 'Skip to navigation' },
		{ href: '#breadcrumbs', label: 'Skip to breadcrumbs' }
	]}
/>

<!-- Live region for screen reader announcements -->
<div 
	id="navigation-announcements" 
	aria-live="polite" 
	aria-atomic="true" 
	class="sr-only"
></div>

<Sidebar.Provider>
	<AppSidebar id="navigation" />
	<Sidebar.Inset>
		<header
			id="breadcrumbs"
			class="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12"
			aria-label="Page header with navigation and breadcrumbs"
		>
			<div class="flex items-center gap-2 px-4">
				<Sidebar.Trigger class="-ml-1" aria-label="Toggle sidebar navigation" />
				<Separator orientation="vertical" class="mr-2 data-[orientation=vertical]:h-4" />

				<!-- Dynamic Breadcrumbs -->
				<Breadcrumb.Root>
					<Breadcrumb.List>
						<!-- Home -->
						<Breadcrumb.Item>
							<Breadcrumb.Link href="/admin">Home</Breadcrumb.Link>
						</Breadcrumb.Item>

						<!-- Dynamic route segments -->
						{#each breadcrumbs as breadcrumb, index}
							<Breadcrumb.Separator />
							<Breadcrumb.Item>
								{#if breadcrumb.isCurrentPage}
									<Breadcrumb.Page>{breadcrumb.label}</Breadcrumb.Page>
								{:else}
									<Breadcrumb.Link href={breadcrumb.href}>
										{breadcrumb.label}
									</Breadcrumb.Link>
								{/if}
							</Breadcrumb.Item>
						{/each}
					</Breadcrumb.List>
				</Breadcrumb.Root>
			</div>
		</header>
		<main 
			id="main-content" 
			class="flex flex-1 flex-col gap-4 p-4 pt-0"
			aria-label="Main content area"
			tabindex="-1"
		>
			{@render children?.()}
		</main>
	</Sidebar.Inset>
</Sidebar.Provider>
