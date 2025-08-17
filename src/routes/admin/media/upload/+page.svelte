<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select';
	import { Upload, X, File, Image, Video, FileText } from '@lucide/svelte';

	let selectedFolder = $state('');
	let uploadedFiles = $state<File[]>([]);
	let isDragOver = $state(false);

	let folders = [
		{ value: 'images', label: 'Images' },
		{ value: 'videos', label: 'Videos' },
		{ value: 'documents', label: 'Documents' },
		{ value: 'logos', label: 'Logos' },
		{ value: 'icons', label: 'Icons' }
	];

	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files) {
			const newFiles = Array.from(target.files);
			uploadedFiles = [...uploadedFiles, ...newFiles];
		}
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDragOver = false;
		
		if (event.dataTransfer?.files) {
			const newFiles = Array.from(event.dataTransfer.files);
			uploadedFiles = [...uploadedFiles, ...newFiles];
		}
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		isDragOver = true;
	}

	function handleDragLeave() {
		isDragOver = false;
	}

	function removeFile(index: number) {
		uploadedFiles = uploadedFiles.filter((_, i) => i !== index);
	}

	function getFileIcon(file: File) {
		if (file.type.startsWith('image/')) return Image;
		if (file.type.startsWith('video/')) return Video;
		if (file.type.includes('pdf') || file.type.includes('document')) return FileText;
		return File;
	}

	function formatFileSize(bytes: number) {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	function handleUpload() {
		console.log('Uploading files:', uploadedFiles, 'to folder:', selectedFolder);
		// Here you would implement the actual upload logic
		uploadedFiles = [];
		selectedFolder = '';
	}
</script>

<svelte:head>
	<title>Upload Files | Media Management | Admin</title>
</svelte:head>

<div class="space-y-6">
	<div class="space-y-2">
		<h1 class="text-2xl font-bold">Upload Files</h1>
		<p class="text-muted-foreground">Upload new media files to your library</p>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<Card>
			<CardHeader>
				<CardTitle>File Upload</CardTitle>
			</CardHeader>
			<CardContent class="space-y-6">
				<div class="space-y-2">
					<Label for="folder-select">Destination Folder</Label>
					<Select bind:value={selectedFolder}>
						<SelectTrigger>
							<SelectValue placeholder="Select a folder" />
						</SelectTrigger>
						<SelectContent>
							{#each folders as folder}
								<SelectItem value={folder.value}>{folder.label}</SelectItem>
							{/each}
						</SelectContent>
					</Select>
				</div>

				<div 
					class="border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 {isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}"
					role="button"
					tabindex="0"
					ondrop={handleDrop}
					ondragover={handleDragOver}
					ondragleave={handleDragLeave}
				>
					<Upload class="mx-auto h-12 w-12 text-muted-foreground mb-4" />
					<div class="space-y-2">
						<h3 class="text-lg font-medium">Drop files here</h3>
						<p class="text-muted-foreground">or click to browse</p>
					</div>
					<Input
						type="file"
						multiple
						class="hidden"
						id="file-upload"
						onchange={handleFileSelect}
					/>
					<Label for="file-upload" class="cursor-pointer">
						<Button type="button" class="mt-4">
							Choose Files
						</Button>
					</Label>
				</div>

				{#if uploadedFiles.length > 0}
					<div class="space-y-2">
						<div class="flex items-center justify-between">
							<h4 class="font-medium">Selected Files ({uploadedFiles.length})</h4>
							<Button 
								onclick={handleUpload} 
								disabled={!selectedFolder}
								class="transition-colors duration-200"
							>
								Upload All
							</Button>
						</div>
					</div>
				{/if}
			</CardContent>
		</Card>

		{#if uploadedFiles.length > 0}
			<Card>
				<CardHeader>
					<CardTitle>File Preview</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="space-y-3 max-h-96 overflow-y-auto">
						{#each uploadedFiles as file, index}
							{@const FileIcon = getFileIcon(file)}
							<div class="flex items-center gap-3 p-3 border rounded-lg">
								<div class="flex items-center justify-center w-10 h-10 bg-muted rounded">
									<FileIcon class="h-5 w-5 text-muted-foreground" />
								</div>
								<div class="flex-1 min-w-0">
									<h4 class="font-medium text-sm truncate" title={file.name}>{file.name}</h4>
									<p class="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
								</div>
								<Button
									variant="ghost"
									size="icon"
									onclick={() => removeFile(index)}
									aria-label="Remove file"
									class="transition-colors duration-200 hover:text-destructive"
								>
									<X class="h-4 w-4" />
								</Button>
							</div>
						{/each}
					</div>
				</CardContent>
			</Card>
		{/if}
	</div>
</div>