<script lang="ts">
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { FileTextIcon, ComponentIcon, MenuIcon, TypeIcon } from '@lucide/svelte';
</script>

<div class="container mx-auto p-6 space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Content Management</h1>
			<p class="text-muted-foreground">
				Manage all your website content, pages, components, and content types
			</p>
		</div>
	</div>

	<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
		<Card class="hover:shadow-md transition-shadow">
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Pages</CardTitle>
				<FileTextIcon class="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">12</div>
				<p class="text-xs text-muted-foreground">
					Published pages
				</p>
				<Button href="/admin/content/pages" variant="outline" size="sm" class="mt-4 w-full">
					Manage Pages
				</Button>
			</CardContent>
		</Card>

		<Card class="hover:shadow-md transition-shadow">
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Components</CardTitle>
				<ComponentIcon class="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">8</div>
				<p class="text-xs text-muted-foreground">
					Reusable components
				</p>
				<Button href="/admin/content/components" variant="outline" size="sm" class="mt-4 w-full">
					Manage Components
				</Button>
			</CardContent>
		</Card>

		<Card class="hover:shadow-md transition-shadow">
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Menus</CardTitle>
				<MenuIcon class="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">3</div>
				<p class="text-xs text-muted-foreground">
					Navigation menus
				</p>
				<Button href="/admin/content/menus" variant="outline" size="sm" class="mt-4 w-full">
					Manage Menus
				</Button>
			</CardContent>
		</Card>

		<Card class="hover:shadow-md transition-shadow">
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Content Types</CardTitle>
				<TypeIcon class="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">5</div>
				<p class="text-xs text-muted-foreground">
					Defined content types
				</p>
				<Button href="/admin/content/types" variant="outline" size="sm" class="mt-4 w-full">
					Manage Types
				</Button>
			</CardContent>
		</Card>
	</div>

	<div class="grid gap-6 md:grid-cols-2">
		<Card>
			<CardHeader>
				<CardTitle>Recent Activity</CardTitle>
				<CardDescription>Latest content updates and changes</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="space-y-4">
					<div class="flex items-center space-x-4">
						<div class="w-2 h-2 bg-green-500 rounded-full"></div>
						<div class="flex-1">
							<p class="text-sm font-medium">Homepage updated</p>
							<p class="text-xs text-muted-foreground">2 hours ago</p>
						</div>
					</div>
					<div class="flex items-center space-x-4">
						<div class="w-2 h-2 bg-blue-500 rounded-full"></div>
						<div class="flex-1">
							<p class="text-sm font-medium">New blog post created</p>
							<p class="text-xs text-muted-foreground">5 hours ago</p>
						</div>
					</div>
					<div class="flex items-center space-x-4">
						<div class="w-2 h-2 bg-yellow-500 rounded-full"></div>
						<div class="flex-1">
							<p class="text-sm font-medium">About page draft saved</p>
							<p class="text-xs text-muted-foreground">1 day ago</p>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle>Quick Actions</CardTitle>
				<CardDescription>Common content management tasks</CardDescription>
			</CardHeader>
			<CardContent class="space-y-2">
				<Button href="/admin/content/pages" variant="outline" class="w-full justify-start">
					<FileTextIcon class="mr-2 h-4 w-4" />
					Create New Page
				</Button>
				<Button href="/admin/content/components" variant="outline" class="w-full justify-start">
					<ComponentIcon class="mr-2 h-4 w-4" />
					Add Component
				</Button>
				<Button href="/admin/content/types" variant="outline" class="w-full justify-start">
					<TypeIcon class="mr-2 h-4 w-4" />
					Define Content Type
				</Button>
			</CardContent>
		</Card>
	</div>
</div>