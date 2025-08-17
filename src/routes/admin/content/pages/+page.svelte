<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import { Plus, Pencil, Trash2, Eye } from '@lucide/svelte';

	let pages = $state([
		{
			id: '1',
			title: 'Home Page',
			slug: 'home',
			status: 'published',
			lastModified: new Date('2024-01-15'),
			author: 'Admin'
		},
		{
			id: '2',
			title: 'About Us',
			slug: 'about',
			status: 'published',
			lastModified: new Date('2024-01-10'),
			author: 'Admin'
		},
		{
			id: '3',
			title: 'Contact',
			slug: 'contact',
			status: 'draft',
			lastModified: new Date('2024-01-12'),
			author: 'Editor'
		}
	]);

	function getStatusBadge(status: string) {
		switch (status) {
			case 'published':
				return { variant: 'default' as const, text: 'Published' };
			case 'draft':
				return { variant: 'secondary' as const, text: 'Draft' };
			case 'archived':
				return { variant: 'outline' as const, text: 'Archived' };
			default:
				return { variant: 'outline' as const, text: status };
		}
	}

	function handleCreate() {
		console.log('Create new page');
	}

	function handleEdit(page: any) {
		console.log('Edit page:', page);
	}

	function handleDelete(page: any) {
		console.log('Delete page:', page);
	}

	function handleView(page: any) {
		console.log('View page:', page);
	}
</script>

<svelte:head>
	<title>Pages | Content Management | Admin</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
		<div class="space-y-2">
			<h1 class="text-2xl font-bold">Pages</h1>
			<p class="text-muted-foreground">Manage your website pages and content</p>
		</div>
		<Button onclick={handleCreate} class="transition-colors duration-200">
			<Plus class="mr-2 h-4 w-4" />
			Create Page
		</Button>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>All Pages</CardTitle>
		</CardHeader>
		<CardContent class="p-0">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Title</TableHead>
						<TableHead>Slug</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Author</TableHead>
						<TableHead>Last Modified</TableHead>
						<TableHead class="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each pages as page}
						{@const statusInfo = getStatusBadge(page.status)}
						<TableRow class="transition-colors duration-200 hover:bg-muted/50">
							<TableCell class="font-medium">{page.title}</TableCell>
							<TableCell class="text-sm text-muted-foreground">/{page.slug}</TableCell>
							<TableCell>
								<Badge variant={statusInfo.variant}>
									{statusInfo.text}
								</Badge>
							</TableCell>
							<TableCell class="text-sm">{page.author}</TableCell>
							<TableCell class="text-sm text-muted-foreground">
								{page.lastModified.toLocaleDateString()}
							</TableCell>
							<TableCell class="text-right">
								<div class="flex items-center justify-end gap-2">
									<Button 
										variant="ghost" 
										size="icon" 
										onclick={() => handleView(page)}
										aria-label="View page"
										class="transition-colors duration-200"
									>
										<Eye class="h-4 w-4" />
									</Button>
									<Button 
										variant="ghost" 
										size="icon" 
										onclick={() => handleEdit(page)}
										aria-label="Edit page"
										class="transition-colors duration-200"
									>
										<Pencil class="h-4 w-4" />
									</Button>
									<Button 
										variant="ghost" 
										size="icon" 
										onclick={() => handleDelete(page)}
										aria-label="Delete page"
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