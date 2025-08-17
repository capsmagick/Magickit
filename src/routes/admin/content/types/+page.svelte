<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import { Plus, Pencil, Trash2, FileText } from '@lucide/svelte';

	let contentTypes = $state([
		{
			id: '1',
			name: 'Blog Post',
			slug: 'blog_post',
			fieldCount: 8,
			status: 'active',
			itemCount: 25,
			lastModified: new Date('2024-01-15')
		},
		{
			id: '2',
			name: 'Portfolio Item',
			slug: 'portfolio_item',
			fieldCount: 6,
			status: 'active',
			itemCount: 12,
			lastModified: new Date('2024-01-10')
		},
		{
			id: '3',
			name: 'Testimonial',
			slug: 'testimonial',
			fieldCount: 4,
			status: 'inactive',
			itemCount: 8,
			lastModified: new Date('2024-01-12')
		}
	]);

	function getStatusBadge(status: string) {
		switch (status) {
			case 'active':
				return { variant: 'default' as const, text: 'Active' };
			case 'inactive':
				return { variant: 'secondary' as const, text: 'Inactive' };
			case 'deprecated':
				return { variant: 'destructive' as const, text: 'Deprecated' };
			default:
				return { variant: 'outline' as const, text: status };
		}
	}

	function handleCreate() {
		console.log('Create new content type');
	}

	function handleEdit(contentType: any) {
		console.log('Edit content type:', contentType);
	}

	function handleDelete(contentType: any) {
		console.log('Delete content type:', contentType);
	}
</script>

<svelte:head>
	<title>Content Types | Content Management | Admin</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
		<div class="space-y-2">
			<h1 class="text-2xl font-bold">Content Types</h1>
			<p class="text-muted-foreground">Define and manage content type schemas</p>
		</div>
		<Button onclick={handleCreate} class="transition-colors duration-200">
			<Plus class="mr-2 h-4 w-4" />
			Create Content Type
		</Button>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>All Content Types</CardTitle>
		</CardHeader>
		<CardContent class="p-0">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Name</TableHead>
						<TableHead>Slug</TableHead>
						<TableHead>Fields</TableHead>
						<TableHead>Items</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Last Modified</TableHead>
						<TableHead class="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each contentTypes as contentType}
						{@const statusInfo = getStatusBadge(contentType.status)}
						<TableRow class="transition-colors duration-200 hover:bg-muted/50">
							<TableCell class="font-medium">
								<div class="flex items-center gap-2">
									<FileText class="h-4 w-4" />
									{contentType.name}
								</div>
							</TableCell>
							<TableCell class="text-sm text-muted-foreground">{contentType.slug}</TableCell>
							<TableCell class="text-sm">{contentType.fieldCount} fields</TableCell>
							<TableCell class="text-sm">{contentType.itemCount} items</TableCell>
							<TableCell>
								<Badge variant={statusInfo.variant}>
									{statusInfo.text}
								</Badge>
							</TableCell>
							<TableCell class="text-sm text-muted-foreground">
								{contentType.lastModified.toLocaleDateString()}
							</TableCell>
							<TableCell class="text-right">
								<div class="flex items-center justify-end gap-2">
									<Button 
										variant="ghost" 
										size="icon" 
										onclick={() => handleEdit(contentType)}
										aria-label="Edit content type"
										class="transition-colors duration-200"
									>
										<Pencil class="h-4 w-4" />
									</Button>
									<Button 
										variant="ghost" 
										size="icon" 
										onclick={() => handleDelete(contentType)}
										aria-label="Delete content type"
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