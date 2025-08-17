<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import { Upload, Search, Grid, List, Folder, Image, FileText, Video } from '@lucide/svelte';

	let viewMode = $state<'grid' | 'list'>('grid');
	let searchTerm = $state('');

	let mediaItems = $state([
		{
			id: '1',
			name: 'hero-image.jpg',
			type: 'image',
			size: '2.4 MB',
			dimensions: '1920x1080',
			uploadDate: new Date('2024-01-15'),
			folder: 'images'
		},
		{
			id: '2',
			name: 'company-logo.png',
			type: 'image',
			size: '156 KB',
			dimensions: '512x512',
			uploadDate: new Date('2024-01-14'),
			folder: 'logos'
		},
		{
			id: '3',
			name: 'product-demo.mp4',
			type: 'video',
			size: '15.2 MB',
			dimensions: '1280x720',
			uploadDate: new Date('2024-01-13'),
			folder: 'videos'
		},
		{
			id: '4',
			name: 'user-manual.pdf',
			type: 'document',
			size: '3.1 MB',
			dimensions: null,
			uploadDate: new Date('2024-01-12'),
			folder: 'documents'
		}
	]);

	let filteredItems = $derived.by(() => {
		if (!searchTerm) return mediaItems;
		return mediaItems.filter(item => 
			item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			item.folder.toLowerCase().includes(searchTerm.toLowerCase())
		);
	});

	function getTypeIcon(type: string) {
		switch (type) {
			case 'image':
				return Image;
			case 'video':
				return Video;
			case 'document':
				return FileText;
			default:
				return FileText;
		}
	}

	function getTypeBadge(type: string) {
		switch (type) {
			case 'image':
				return { variant: 'default' as const, text: 'Image' };
			case 'video':
				return { variant: 'secondary' as const, text: 'Video' };
			case 'document':
				return { variant: 'outline' as const, text: 'Document' };
			default:
				return { variant: 'outline' as const, text: type };
		}
	}

	function handleUpload() {
		console.log('Upload files');
	}

	function handleItemClick(item: any) {
		console.log('View item:', item);
	}
</script>

<svelte:head>
	<title>Media Library | Admin</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
		<div class="space-y-2">
			<h1 class="text-2xl font-bold">Media Library</h1>
			<p class="text-muted-foreground">Manage your media files and assets</p>
		</div>
		<Button onclick={handleUpload} class="transition-colors duration-200">
			<Upload class="mr-2 h-4 w-4" />
			Upload Files
		</Button>
	</div>

	<div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
		<div class="relative flex-1 max-w-sm">
			<Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
			<Input
				bind:value={searchTerm}
				placeholder="Search media files..."
				class="pl-10"
			/>
		</div>
		<div class="flex items-center gap-2">
			<Button
				variant={viewMode === 'grid' ? 'default' : 'outline'}
				size="icon"
				onclick={() => viewMode = 'grid'}
				aria-label="Grid view"
			>
				<Grid class="h-4 w-4" />
			</Button>
			<Button
				variant={viewMode === 'list' ? 'default' : 'outline'}
				size="icon"
				onclick={() => viewMode = 'list'}
				aria-label="List view"
			>
				<List class="h-4 w-4" />
			</Button>
		</div>
	</div>

	{#if viewMode === 'grid'}
		<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
			{#each filteredItems as item}
				{@const TypeIcon = getTypeIcon(item.type)}
				{@const typeBadge = getTypeBadge(item.type)}
				<Card class="cursor-pointer transition-shadow duration-200 hover:shadow-md" onclick={() => handleItemClick(item)}>
					<CardContent class="p-4">
						<div class="space-y-3">
							<div class="flex items-center justify-center h-24 bg-muted rounded-lg">
								<TypeIcon class="h-8 w-8 text-muted-foreground" />
							</div>
							<div class="space-y-2">
								<h4 class="font-medium text-sm truncate" title={item.name}>{item.name}</h4>
								<div class="flex items-center gap-2">
									<Badge variant={typeBadge.variant} class="text-xs">
										{typeBadge.text}
									</Badge>
									<span class="text-xs text-muted-foreground">{item.size}</span>
								</div>
								<div class="flex items-center gap-1 text-xs text-muted-foreground">
									<Folder class="h-3 w-3" />
									<span>{item.folder}</span>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			{/each}
		</div>
	{:else}
		<Card>
			<CardHeader>
				<CardTitle>Media Files</CardTitle>
			</CardHeader>
			<CardContent class="p-0">
				<div class="space-y-2">
					{#each filteredItems as item}
						{@const TypeIcon = getTypeIcon(item.type)}
						{@const typeBadge = getTypeBadge(item.type)}
						<button 
							type="button"
							class="flex items-center gap-4 p-4 hover:bg-muted/50 cursor-pointer transition-colors duration-200 w-full text-left bg-transparent border-none"
							onclick={() => handleItemClick(item)}
						>
							<div class="flex items-center justify-center w-10 h-10 bg-muted rounded">
								<TypeIcon class="h-5 w-5 text-muted-foreground" />
							</div>
							<div class="flex-1 min-w-0">
								<h4 class="font-medium truncate">{item.name}</h4>
								<div class="flex items-center gap-4 text-sm text-muted-foreground">
									<Badge variant={typeBadge.variant} class="text-xs">
										{typeBadge.text}
									</Badge>
									<span>{item.size}</span>
									{#if item.dimensions}
										<span>{item.dimensions}</span>
									{/if}
									<div class="flex items-center gap-1">
										<Folder class="h-3 w-3" />
										<span>{item.folder}</span>
									</div>
								</div>
							</div>
							<div class="text-sm text-muted-foreground">
								{item.uploadDate.toLocaleDateString()}
							</div>
						</button>
					{/each}
				</div>
			</CardContent>
		</Card>
	{/if}
</div>