<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import { Plus, Pencil, Trash2, Copy } from '@lucide/svelte';

	let components = $state([
		{
			id: '1',
			name: 'Hero Section',
			type: 'layout',
			status: 'active',
			usageCount: 5,
			lastModified: new Date('2024-01-15')
		},
		{
			id: '2',
			name: 'Feature Grid',
			type: 'content',
			status: 'active',
			usageCount: 3,
			lastModified: new Date('2024-01-10')
		},
		{
			id: '3',
			name: 'Contact Form',
			type: 'form',
			status: 'inactive',
			usageCount: 1,
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

	function getTypeBadge(type: string) {
		switch (type) {
			case 'layout':
				return { variant: 'default' as const, text: 'Layout' };
			case 'content':
				return { variant: 'secondary' as const, text: 'Content' };
			case 'form':
				return { variant: 'outline' as const, text: 'Form' };
			default:
				return { variant: 'outline' as const, text: type };
		}
	}

	function handleCreate() {
		console.log('Create new component');
	}

	function handleEdit(component: any) {
		console.log('Edit component:', component);
	}

	function handleDelete(component: any) {
		console.log('Delete component:', component);
	}

	function handleDuplicate(component: any) {
		console.log('Duplicate component:', component);
	}
</script>

<svelte:head>
	<title>Components | Content Management | Admin</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
		<div class="space-y-2">
			<h1 class="text-2xl font-bold">Components</h1>
			<p class="text-muted-foreground">Manage reusable content components</p>
		</div>
		<Button onclick={handleCreate} class="transition-colors duration-200">
			<Plus class="mr-2 h-4 w-4" />
			Create Component
		</Button>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>All Components</CardTitle>
		</CardHeader>
		<CardContent class="p-0">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Name</TableHead>
						<TableHead>Type</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Usage</TableHead>
						<TableHead>Last Modified</TableHead>
						<TableHead class="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each components as component}
						{@const statusInfo = getStatusBadge(component.status)}
						{@const typeInfo = getTypeBadge(component.type)}
						<TableRow class="transition-colors duration-200 hover:bg-muted/50">
							<TableCell class="font-medium">{component.name}</TableCell>
							<TableCell>
								<Badge variant={typeInfo.variant}>
									{typeInfo.text}
								</Badge>
							</TableCell>
							<TableCell>
								<Badge variant={statusInfo.variant}>
									{statusInfo.text}
								</Badge>
							</TableCell>
							<TableCell class="text-sm">{component.usageCount} pages</TableCell>
							<TableCell class="text-sm text-muted-foreground">
								{component.lastModified.toLocaleDateString()}
							</TableCell>
							<TableCell class="text-right">
								<div class="flex items-center justify-end gap-2">
									<Button 
										variant="ghost" 
										size="icon" 
										onclick={() => handleDuplicate(component)}
										aria-label="Duplicate component"
										class="transition-colors duration-200"
									>
										<Copy class="h-4 w-4" />
									</Button>
									<Button 
										variant="ghost" 
										size="icon" 
										onclick={() => handleEdit(component)}
										aria-label="Edit component"
										class="transition-colors duration-200"
									>
										<Pencil class="h-4 w-4" />
									</Button>
									<Button 
										variant="ghost" 
										size="icon" 
										onclick={() => handleDelete(component)}
										aria-label="Delete component"
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