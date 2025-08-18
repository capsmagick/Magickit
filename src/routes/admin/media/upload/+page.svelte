<!-- Media Upload Page -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Progress } from '$lib/components/ui/progress';
  import { Badge } from '$lib/components/ui/badge';
  import { Separator } from '$lib/components/ui/separator';
  import { 
    Upload, 
    X, 
    CheckCircle, 
    AlertCircle, 
    FileImage, 
    FileVideo, 
    FileAudio, 
    File,
    Loader2
  } from '@lucide/svelte';
  import * as Select from '$lib/components/ui/select';
  import { toast } from 'svelte-sonner';
  import type { MediaFolder } from '$lib/db/models';

  interface UploadFile {
    id: string;
    file: File;
    status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
    progress: number;
    error?: string;
    result?: any;
    preview?: string;
  }

  // State management
  let state = $state({
    // Upload state
    files: [] as UploadFile[],
    isDragOver: false,
    isUploading: false,
    
    // Settings
    selectedFolder: null as string | null,
    folders: [] as MediaFolder[],
    
    // Progress
    overallProgress: 0,
    completedUploads: 0,
    totalUploads: 0
  });

  // File input reference
  let fileInput: HTMLInputElement;

  // Derived value for folder selection
  const selectedFolderLabel = $derived(() => {
    if (!state.selectedFolder) return 'Root Folder';
    const folder = state.folders.find(f => f._id.toString() === state.selectedFolder);
    return folder ? folder.name : 'Select folder (optional)';
  });

  // Supported file types
  const SUPPORTED_TYPES = {
    'image/jpeg': { icon: FileImage, maxSize: 10 * 1024 * 1024 }, // 10MB
    'image/png': { icon: FileImage, maxSize: 10 * 1024 * 1024 },
    'image/webp': { icon: FileImage, maxSize: 10 * 1024 * 1024 },
    'image/gif': { icon: FileImage, maxSize: 10 * 1024 * 1024 },
    'video/mp4': { icon: FileVideo, maxSize: 100 * 1024 * 1024 }, // 100MB
    'video/webm': { icon: FileVideo, maxSize: 100 * 1024 * 1024 },
    'audio/mp3': { icon: FileAudio, maxSize: 50 * 1024 * 1024 }, // 50MB
    'audio/wav': { icon: FileAudio, maxSize: 50 * 1024 * 1024 },
    'application/pdf': { icon: File, maxSize: 25 * 1024 * 1024 } // 25MB
  };

  // Load folders for selection
  async function loadFolders() {
    try {
      const response = await fetch('/api/admin/media/folders');
      if (!response.ok) throw new Error('Failed to load folders');
      
      const data = await response.json();
      state.folders = data.folders || [];
    } catch (error) {
      console.error('Error loading folders:', error);
      toast.error('Failed to load folders');
    }
  }

  // Handle file selection
  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files) {
      addFiles(Array.from(target.files));
    }
  }

  // Handle drag and drop
  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    state.isDragOver = true;
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    state.isDragOver = false;
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    state.isDragOver = false;
    
    if (event.dataTransfer?.files) {
      addFiles(Array.from(event.dataTransfer.files));
    }
  }

  // Add files to upload queue
  function addFiles(files: File[]) {
    const newFiles: UploadFile[] = [];
    
    for (const file of files) {
      // Validate file type
      if (!SUPPORTED_TYPES[file.type as keyof typeof SUPPORTED_TYPES]) {
        toast.error(`Unsupported file type: ${file.type}`);
        continue;
      }

      // Validate file size
      const typeConfig = SUPPORTED_TYPES[file.type as keyof typeof SUPPORTED_TYPES];
      if (file.size > typeConfig.maxSize) {
        toast.error(`File too large: ${file.name} (max ${formatFileSize(typeConfig.maxSize)})`);
        continue;
      }

      const uploadFile: UploadFile = {
        id: crypto.randomUUID(),
        file,
        status: 'pending',
        progress: 0
      };

      // Generate preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          uploadFile.preview = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      }

      newFiles.push(uploadFile);
    }

    state.files = [...state.files, ...newFiles];
  }

  // Remove file from queue
  function removeFile(id: string) {
    state.files = state.files.filter(f => f.id !== id);
  }

  // Clear all files
  function clearAll() {
    state.files = [];
    state.completedUploads = 0;
    state.totalUploads = 0;
    state.overallProgress = 0;
  }

  // Upload single file
  async function uploadFile(uploadFile: UploadFile): Promise<void> {
    uploadFile.status = 'uploading';
    uploadFile.progress = 0;

    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', uploadFile.file);
      if (state.selectedFolder) {
        formData.append('folderId', state.selectedFolder);
      }

      // Upload with progress tracking
      const response = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      uploadFile.status = 'processing';
      uploadFile.progress = 90;

      const result = await response.json();
      
      uploadFile.status = 'completed';
      uploadFile.progress = 100;
      uploadFile.result = result;
      
      state.completedUploads++;
      
    } catch (error) {
      uploadFile.status = 'error';
      uploadFile.error = error instanceof Error ? error.message : 'Upload failed';
      console.error('Upload error:', error);
    }
  }

  // Upload all files
  async function uploadAll() {
    if (state.files.length === 0) return;

    state.isUploading = true;
    state.totalUploads = state.files.filter(f => f.status === 'pending').length;
    state.completedUploads = 0;

    // Upload files in parallel (max 3 concurrent uploads)
    const concurrentUploads = 3;
    const pendingFiles = state.files.filter(f => f.status === 'pending');
    
    for (let i = 0; i < pendingFiles.length; i += concurrentUploads) {
      const batch = pendingFiles.slice(i, i + concurrentUploads);
      await Promise.all(batch.map(uploadFile));
      
      // Update overall progress
      state.overallProgress = (state.completedUploads / state.totalUploads) * 100;
    }

    state.isUploading = false;
    
    const successCount = state.files.filter(f => f.status === 'completed').length;
    const errorCount = state.files.filter(f => f.status === 'error').length;
    
    if (successCount > 0) {
      toast.success(`Successfully uploaded ${successCount} file(s)`);
    }
    if (errorCount > 0) {
      toast.error(`Failed to upload ${errorCount} file(s)`);
    }
  }

  // Format file size
  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Get file icon
  function getFileIcon(mimeType: string) {
    const typeConfig = SUPPORTED_TYPES[mimeType as keyof typeof SUPPORTED_TYPES];
    return typeConfig?.icon || File;
  }

  // Initialize
  onMount(() => {
    loadFolders();
  });
</script>

<div class="flex flex-col gap-6 p-6">
  <!-- Header -->
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Upload Media Files</h1>
      <p class="text-muted-foreground">
        Upload images, videos, audio files, and documents
      </p>
    </div>
    
    <div class="flex gap-2">
      <Button variant="outline" onclick={() => window.history.back()}>
        Back to Library
      </Button>
    </div>
  </div>

  <!-- Upload Settings -->
  <Card>
    <CardHeader>
      <CardTitle>Upload Settings</CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Folder Selection -->
        <div class="space-y-2">
          <label for="folder-select" class="text-sm font-medium">Upload to Folder</label>
          <Select.Root type="single" bind:value={state.selectedFolder}>
            <Select.Trigger id="folder-select">
              {selectedFolderLabel()}
            </Select.Trigger>
            <Select.Content>
              <Select.Item value={null}>Root Folder</Select.Item>
              {#each state.folders as folder}
                <Select.Item value={folder._id.toString()}>
                  {folder.name}
                </Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        </div>

        <!-- Supported Formats -->
        <div class="space-y-2">
          <div class="text-sm font-medium">Supported Formats</div>
          <div class="flex flex-wrap gap-1">
            <Badge variant="secondary">JPEG</Badge>
            <Badge variant="secondary">PNG</Badge>
            <Badge variant="secondary">WebP</Badge>
            <Badge variant="secondary">GIF</Badge>
            <Badge variant="secondary">MP4</Badge>
            <Badge variant="secondary">WebM</Badge>
            <Badge variant="secondary">MP3</Badge>
            <Badge variant="secondary">WAV</Badge>
            <Badge variant="secondary">PDF</Badge>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>

  <!-- Upload Area -->
  <Card>
    <CardContent class="p-0">
      <!-- Drop Zone -->
      <div
        class="border-2 border-dashed rounded-lg p-8 text-center transition-colors {state.isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}"
        role="button"
        tabindex="0"
        aria-label="File drop zone - drag and drop files here or click to select"
        ondragover={handleDragOver}
        ondragleave={handleDragLeave}
        ondrop={handleDrop}
        onkeydown={(e) => e.key === 'Enter' && document.getElementById('file-input')?.click()}
      >
        <div class="space-y-4">
          <div class="text-6xl">📁</div>
          <div>
            <h3 class="text-lg font-semibold mb-2">
              {state.isDragOver ? 'Drop files here' : 'Drag and drop files here'}
            </h3>
            <p class="text-muted-foreground mb-4">
              or click to browse your computer
            </p>
            <Button onclick={() => fileInput.click()}>
              <Upload class="h-4 w-4 mr-2" />
              Choose Files
            </Button>
          </div>
        </div>
      </div>

      <!-- Hidden File Input -->
      <input
        bind:this={fileInput}
        type="file"
        multiple
        accept="image/*,video/*,audio/*,application/pdf"
        class="hidden"
        onchange={handleFileSelect}
      />
    </CardContent>
  </Card>

  <!-- Upload Queue -->
  {#if state.files.length > 0}
    <Card>
      <CardHeader class="flex flex-row items-center justify-between">
        <CardTitle>Upload Queue ({state.files.length} files)</CardTitle>
        <div class="flex gap-2">
          <Button variant="outline" onclick={clearAll} disabled={state.isUploading}>
            Clear All
          </Button>
          <Button onclick={uploadAll} disabled={state.isUploading || state.files.every(f => f.status !== 'pending')}>
            {#if state.isUploading}
              <Loader2 class="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            {:else}
              <Upload class="h-4 w-4 mr-2" />
              Upload All
            {/if}
          </Button>
        </div>
      </CardHeader>
      <CardContent class="space-y-4">
        <!-- Overall Progress -->
        {#if state.isUploading}
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>{state.completedUploads} / {state.totalUploads}</span>
            </div>
            <Progress value={state.overallProgress} class="h-2" />
          </div>
          <Separator />
        {/if}

        <!-- File List -->
        <div class="space-y-3">
          {#each state.files as uploadFile (uploadFile.id)}
            <div class="flex items-center gap-4 p-3 border rounded-lg">
              <!-- File Preview/Icon -->
              <div class="w-12 h-12 bg-muted rounded flex items-center justify-center flex-shrink-0">
                {#if uploadFile.preview}
                  <img
                    src={uploadFile.preview}
                    alt={uploadFile.file.name}
                    class="w-full h-full object-cover rounded"
                  />
                {:else}
                  {@const IconComponent = getFileIcon(uploadFile.file.type)}
                  <IconComponent class="h-6 w-6 text-muted-foreground" />
                {/if}
              </div>

              <!-- File Info -->
              <div class="flex-1 min-w-0">
                <p class="font-medium truncate">{uploadFile.file.name}</p>
                <p class="text-sm text-muted-foreground">
                  {uploadFile.file.type} • {formatFileSize(uploadFile.file.size)}
                </p>
                
                <!-- Progress Bar -->
                {#if uploadFile.status === 'uploading' || uploadFile.status === 'processing'}
                  <div class="mt-2 space-y-1">
                    <div class="flex justify-between text-xs">
                      <span>
                        {uploadFile.status === 'uploading' ? 'Uploading...' : 'Processing...'}
                      </span>
                      <span>{uploadFile.progress}%</span>
                    </div>
                    <Progress value={uploadFile.progress} class="h-1" />
                  </div>
                {/if}

                <!-- Error Message -->
                {#if uploadFile.status === 'error' && uploadFile.error}
                  <p class="text-sm text-destructive mt-1">{uploadFile.error}</p>
                {/if}
              </div>

              <!-- Status Badge -->
              <div class="flex items-center gap-2">
                {#if uploadFile.status === 'pending'}
                  <Badge variant="secondary">Pending</Badge>
                {:else if uploadFile.status === 'uploading'}
                  <Badge variant="default">
                    <Loader2 class="h-3 w-3 mr-1 animate-spin" />
                    Uploading
                  </Badge>
                {:else if uploadFile.status === 'processing'}
                  <Badge variant="default">
                    <Loader2 class="h-3 w-3 mr-1 animate-spin" />
                    Processing
                  </Badge>
                {:else if uploadFile.status === 'completed'}
                  <Badge variant="default" class="bg-green-500">
                    <CheckCircle class="h-3 w-3 mr-1" />
                    Complete
                  </Badge>
                {:else if uploadFile.status === 'error'}
                  <Badge variant="destructive">
                    <AlertCircle class="h-3 w-3 mr-1" />
                    Error
                  </Badge>
                {/if}

                <!-- Remove Button -->
                {#if uploadFile.status === 'pending' || uploadFile.status === 'error'}
                  <Button
                    variant="ghost"
                    size="sm"
                    onclick={() => removeFile(uploadFile.id)}
                  >
                    <X class="h-4 w-4" />
                  </Button>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </CardContent>
    </Card>
  {/if}

  <!-- Upload Guidelines -->
  <Card>
    <CardHeader>
      <CardTitle>Upload Guidelines</CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 class="font-semibold mb-2">File Size Limits</h4>
          <ul class="text-sm text-muted-foreground space-y-1">
            <li>• Images: 10 MB maximum</li>
            <li>• Videos: 100 MB maximum</li>
            <li>• Audio: 50 MB maximum</li>
            <li>• Documents: 25 MB maximum</li>
          </ul>
        </div>
        
        <div>
          <h4 class="font-semibold mb-2">Processing</h4>
          <ul class="text-sm text-muted-foreground space-y-1">
            <li>• Images are automatically optimized</li>
            <li>• Multiple variants are generated</li>
            <li>• WebP format created for better compression</li>
            <li>• Metadata is extracted and stored</li>
          </ul>
        </div>
      </div>
    </CardContent>
  </Card>
</div>