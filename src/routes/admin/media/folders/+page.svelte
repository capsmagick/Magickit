<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '$lib/components/ui/dialog';
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
	import { Plus, Folder, Pencil, Trash2, FolderOpen } from '@lucide/svelte';

	let showCreateDialog = $state(false);
	let newFolderName = $state('');

	let folders = $state([
		{
			id: '1',
			name: 'Images',
			slug: 'images',
			fileCount: 45,
			size: '125.3 MB',
			createdDate: new Date('2024-01-01'),
			lastModified: new Date('2024-01-15')
		},
		{
			id: '2',
			name: 'Videos',
			slug: 'videos',
			fileCount: 8,
			size: '2.1 GB',
			createdDate: new Date('2024-01-02'),
			lastModified: new Date('2024-01-14')
		},
		{
			id: '3',
			name: 'Documents',
			slug: 'documents',
			fileCount: 23,
			size: '45.7 MB',
			createdDate: new Date('2024-01-03'),
			lastModified: new Date('2024-01-13')
		},
		{
			id: '4',
			name: 'Logos',
			slug: 'logos',
			fileCount: 12,
			size: '8.2 MB',
			createdDate: new Date('2024-01-04'),
			lastModified: new Date('2024-01-12')
		}
	]);

	function handleCreateFolder() {
		if (newFolderName.trim()) {
			const newFolder = {
				id: String(folders.length + 1),
				name: newFolderName.trim(),
				slug: newFolderName.trim().toLowerCase().replace(/\s+/g, '-'),
				fileCount: 0,
				size: '0 MB',
				createdDate: new Date(),
				lastModified: new Date()
			};
			folders = [...folders, newFolder];
			newFolderName = '';
			showCreateDialog = false;
		}
	}

	function handleEditFolder(folder: any) {
		console.log('Edit folder:', folder);
	}

	function handleDeleteFolder(folder: any) {
		console.log('Delete folder:', folder);
		folders = folders.filter(f => f.id !== folder.id);
	}

	function handleOpenFolder(folder: any) {
		console.log('Open folder:', folder);
	}
</script>

<svelte:head>
	<title>Organize Folders | Media Management | Admin</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
		<div class="space-y-2">
			<h1 class="text-2xl font-bold">Organize Folders</h1>
			<p class="text-muted-foreground">Manage your media library folder structure</p>
		</div>
		<Dialog bind:open={showCreateDialog}>
			<DialogTrigger asChild let:builder>
				<Button builders={[builder]} class="transition-colors duration-200">
					<Plus class="mr-2 h-4 w-4" />
					Create Folder
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create New Folder</DialogTitle>
				</DialogHeader>
				<div class="space-y-4">
					<div class="space-y-2">
						<Label for="folder-name">Folder Name</Label>
						<Input
							id="folder-name"
							bind:value={newFolderName}
							placeholder="Enter folder name"
							onkeydown={(e) => e.key === 'Enter' && handleCreateFolder()}
						/>
					</div>
					<div class="flex justify-end gap-2">
						<Button variant="outline" onclick={() => showCreateDialog = false}>
							Cancel
						</Button>
						<Button onclick={handleCreateFolder} disabled={!newFolderName.trim()}>
							Create Folder
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	</div>

	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
		{#each folders as folder}
			<Card class="cursor-pointer transition-shadow duration-200 hover:shadow-md" onclick={() => handleOpenFolder(folder)}>
				<CardContent class="p-4">
					<div class="space-y-3">
						<div class="flex items-center justify-center h-16 bg-muted rounded-lg">
							<Folder class="h-8 w-8 text-primary" />
						</div>
						<div class="space-y-1">
							<h4 class="font-medium truncate" title={folder.name}>{folder.name}</h4>
							<div class="text-sm text-muted-foreground">
								<p>{folder.fileCount} files</p>
								<p>{folder.size}</p>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		{/each}
	</div>

	<Card>
		<CardHeader>
			<CardTitle>Folder Details</CardTitle>
		</CardHeader>
		<CardContent class="p-0">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Name</TableHead>
						<TableHead>Files</TableHead>
						<TableHead>Size</TableHead>
						<TableHead>Created</TableHead>
						<TableHead>Last Modified</TableHead>
						<TableHead class="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each folders as folder}
						<TableRow class="transition-colors duration-200 hover:bg-muted/50">
							<TableCell class="font-medium">
								<div class="flex items-center gap-2">
									<Folder class="h-4 w-4 text-primary" />
									{folder.name}
								</div>
							</TableCell>
							<TableCell class="text-sm">{folder.fileCount}</TableCell>
							<TableCell class="text-sm">{folder.size}</TableCell>
							<TableCell class="text-sm text-muted-foreground">
								{folder.createdDate.toLocaleDateString()}
							</TableCell>
							<TableCell class="text-sm text-muted-foreground">
								{folder.lastModified.toLocaleDateString()}
							</TableCell>
							<TableCell class="text-right">
								<div class="flex items-center justify-end gap-2">
									<Button 
										variant="ghost" 
										size="icon" 
										onclick={() => handleOpenFolder(folder)}
										aria-label="Open folder"
										class="transition-colors duration-200"
									>
										<FolderOpen class="h-4 w-4" />
									</Button>
									<Button 
										variant="ghost" 
										size="icon" 
										onclick={() => handleEditFolder(folder)}
										aria-label="Edit folder"
										class="transition-colors duration-200"
									>
										<Pencil class="h-4 w-4" />
									</Button>
									<Button 
										variant="ghost" 
										size="icon" 
										onclick={() => handleDeleteFolder(folder)}
										aria-label="Delete folder"
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