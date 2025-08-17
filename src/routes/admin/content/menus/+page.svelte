<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import { Plus, Pencil, Trash2, Menu } from '@lucide/svelte';

	let menus = $state([
		{
			id: '1',
			name: 'Main Navigation',
			location: 'header',
			itemCount: 5,
			status: 'active',
			lastModified: new Date('2024-01-15')
		},
		{
			id: '2',
			name: 'Footer Links',
			location: 'footer',
			itemCount: 8,
			status: 'active',
			lastModified: new Date('2024-01-10')
		},
		{
			id: '3',
			name: 'Sidebar Menu',
			location: 'sidebar',
			itemCount: 3,
			status: 'inactive',
			lastModified: new Date('2024-01-12')
		}
	]);

	function getStatusBadge(status: string) {
		switch (status) {
			case 'active':
				return { variant: 'default' as const, text: 'Active' };
			case 'inactive':
				return { variant: 'secondary' as const, text: 'Inactive' };
			default:
				return { variant: 'outline' as const, text: status };
		}
	}

	function getLocationBadge(location: string) {
		switch (location) {
			case 'header':
				return { variant: 'default' as const, text: 'Header' };
			case 'footer':
				return { variant: 'secondary' as const, text: 'Footer' };
			case 'sidebar':
				return { variant: 'outline' as const, text: 'Sidebar' };
			default:
				return { variant: 'outline' as const, text: location };
		}
	}

	function handleCreate() {
		console.log('Create new menu');
	}

	function handleEdit(menu: any) {
		console.log('Edit menu:', menu);
	}

	function handleDelete(menu: any) {
		console.log('Delete menu:', menu);
	}
</script>

<svelte:head>
	<title>Menus | Content Management | Admin</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
		<div class="space-y-2">
			<h1 class="text-2xl font-bold">Menus</h1>
			<p class="text-muted-foreground">Manage navigation menus and menu items</p>
		</div>
		<Button onclick={handleCreate} class="transition-colors duration-200">
			<Plus class="mr-2 h-4 w-4" />
			Create Menu
		</Button>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>All Menus</CardTitle>
		</CardHeader>
		<CardContent class="p-0">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Name</TableHead>
						<TableHead>Location</TableHead>
						<TableHead>Items</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Last Modified</TableHead>
						<TableHead class="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each menus as menu}
						{@const statusInfo = getStatusBadge(menu.status)}
						{@const locationInfo = getLocationBadge(menu.location)}
						<TableRow class="transition-colors duration-200 hover:bg-muted/50">
							<TableCell class="font-medium">
								<div class="flex items-center gap-2">
									<Menu class="h-4 w-4" />
									{menu.name}
								</div>
							</TableCell>
							<TableCell>
								<Badge variant={locationInfo.variant}>
									{locationInfo.text}
								</Badge>
							</TableCell>
							<TableCell class="text-sm">{menu.itemCount} items</TableCell>
							<TableCell>
								<Badge variant={statusInfo.variant}>
									{statusInfo.text}
								</Badge>
							</TableCell>
							<TableCell class="text-sm text-muted-foreground">
								{menu.lastModified.toLocaleDateString()}
							</TableCell>
							<TableCell class="text-right">
								<div class="flex items-center justify-end gap-2">
									<Button 
										variant="ghost" 
										size="icon" 
										onclick={() => handleEdit(menu)}
										aria-label="Edit menu"
										class="transition-colors duration-200"
									>
										<Pencil class="h-4 w-4" />
									</Button>
									<Button 
										variant="ghost" 
										size="icon" 
										onclick={() => handleDelete(menu)}
										aria-label="Delete menu"
										class="transition-colors duration-200 hover:text-destructive"
									>
										<Trash2 class="h-4 w-4" />
									</Button>
								</div>
							</TableCell>
						</TableRow>
					{/each}
				</TableBody>
			</Table>
		</CardContent>
	</Card>
</div>