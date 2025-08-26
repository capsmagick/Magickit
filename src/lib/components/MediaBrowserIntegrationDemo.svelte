<!-- MediaBrowserIntegrationDemo.svelte - Demo component showing media browser integration -->
<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import MediaPicker from './MediaPicker.svelte';
	import type { MediaFile } from '$lib/db/models';

	// Demo state
	let singleImage = $state<MediaFile | string | null>(null);
	let multipleImages = $state<MediaFile[] | string[]>([]);
	let profileImage = $state<MediaFile | string | null>(null);
	let videoFile = $state<MediaFile | string | null>(null);

	// Demo data
	const demoStats = $derived({
		singleImageSelected: singleImage !== null,
		multipleImagesCount: Array.isArray(multipleImages) ? multipleImages.length : 0,
		profileImageSelected: profileImage !== null,
		videoSelected: videoFile !== null
	});

	function resetDemo() {
		singleImage = null;
		multipleImages = [];
		profileImage = null;
		videoFile = null;
	}

	function getValueType(value: any): string {
		if (!value) return 'null';
		if (Array.isArray(value)) return `array (${value.length} items)`;
		if (typeof value === 'string') return 'string (URL)';
		if (typeof value === 'object' && value._id) return 'MediaFile object';
		return typeof value;
	}

	function getValuePreview(value: any): string {
		if (!value) return 'No selection';
		if (Array.isArray(value)) {
			if (value.length === 0) return 'Empty array';
			const first = value[0];
			if (typeof first === 'string') return `URLs: ${first.substring(0, 30)}...`;
			if (first.filename) return `Files: ${first.filename}${value.length > 1 ? ` +${value.length - 1} more` : ''}`;
			return `${value.length} items`;
		}
		if (typeof value === 'string') return `URL: ${value.substring(0, 50)}...`;
		if (value.filename) return `File: ${value.filename}`;
		return 'Selected';
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-2xl font-bold">Media Browser Integration Demo</h2>
			<p class="text-muted-foreground">
				Demonstrates the MediaPicker component integration across different use cases
			</p>
		</div>
		<Button variant="outline" onclick={resetDemo}>
			Reset Demo
		</Button>
	</div>

	<!-- Demo Stats -->
	<Card>
		<CardHeader>
			<CardTitle class="text-lg">Demo Status</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
				<div class="text-center">
					<div class="text-2xl font-bold text-primary">
						{demoStats.singleImageSelected ? '✓' : '○'}
					</div>
					<div class="text-sm text-muted-foreground">Single Image</div>
				</div>
				<div class="text-center">
					<div class="text-2xl font-bold text-primary">
						{demoStats.multipleImagesCount}
					</div>
					<div class="text-sm text-muted-foreground">Multiple Images</div>
				</div>
				<div class="text-center">
					<div class="text-2xl font-bold text-primary">
						{demoStats.profileImageSelected ? '✓' : '○'}
					</div>
					<div class="text-sm text-muted-foreground">Profile Image</div>
				</div>
				<div class="text-center">
					<div class="text-2xl font-bold text-primary">
						{demoStats.videoSelected ? '✓' : '○'}
					</div>
					<div class="text-sm text-muted-foreground">Video File</div>
				</div>
			</div>
		</CardContent>
	</Card>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Single Image Selection -->
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					Single Image Selection
					<Badge variant="outline">Content Forms</Badge>
				</CardTitle>
			</CardHeader>
			<CardContent class="space-y-4">
				<MediaPicker
					value={singleImage}
					accept={['image/*']}
					allowUrl={true}
					placeholder="Select a single image..."
					label="Featured Image"
					onValueChange={(value) => {
						singleImage = value;
					}}
				/>
				<div class="text-sm space-y-1">
					<div><strong>Type:</strong> {getValueType(singleImage)}</div>
					<div><strong>Value:</strong> {getValuePreview(singleImage)}</div>
				</div>
			</CardContent>
		</Card>

		<!-- Multiple Image Selection -->
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					Multiple Image Selection
					<Badge variant="outline">Gallery Forms</Badge>
				</CardTitle>
			</CardHeader>
			<CardContent class="space-y-4">
				<MediaPicker
					value={multipleImages}
					multiple={true}
					accept={['image/*']}
					allowUrl={true}
					placeholder="Select multiple images..."
					label="Image Gallery"
					onValueChange={(value) => {
						multipleImages = value || [];
					}}
				/>
				<div class="text-sm space-y-1">
					<div><strong>Type:</strong> {getValueType(multipleImages)}</div>
					<div><strong>Value:</strong> {getValuePreview(multipleImages)}</div>
				</div>
			</CardContent>
		</Card>

		<!-- Profile Image Selection -->
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					Profile Image Selection
					<Badge variant="outline">User Profile</Badge>
				</CardTitle>
			</CardHeader>
			<CardContent class="space-y-4">
				<MediaPicker
					value={profileImage}
					accept={['image/*']}
					allowUrl={true}
					placeholder="Select profile image..."
					label="Avatar"
					required={true}
					onValueChange={(value) => {
						profileImage = value;
					}}
				/>
				<div class="text-sm space-y-1">
					<div><strong>Type:</strong> {getValueType(profileImage)}</div>
					<div><strong>Value:</strong> {getValuePreview(profileImage)}</div>
				</div>
			</CardContent>
		</Card>

		<!-- Video Selection -->
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					Video Selection
					<Badge variant="outline">Media Content</Badge>
				</CardTitle>
			</CardHeader>
			<CardContent class="space-y-4">
				<MediaPicker
					value={videoFile}
					accept={['video/*']}
					allowUrl={true}
					placeholder="Select a video file..."
					label="Video Content"
					maxSize={50 * 1024 * 1024} // 50MB
					onValueChange={(value) => {
						videoFile = value;
					}}
				/>
				<div class="text-sm space-y-1">
					<div><strong>Type:</strong> {getValueType(videoFile)}</div>
					<div><strong>Value:</strong> {getValuePreview(videoFile)}</div>
				</div>
			</CardContent>
		</Card>
	</div>

	<!-- Integration Examples -->
	<Card>
		<CardHeader>
			<CardTitle>Integration Examples</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="space-y-4">
				<div>
					<h4 class="font-medium mb-2">1. Content Management Forms</h4>
					<p class="text-sm text-muted-foreground mb-2">
						Image and video fields in content forms automatically use MediaPicker for file selection.
					</p>
					<Badge variant="secondary">ContentInstanceForm.svelte</Badge>
					<Badge variant="secondary">ContentComponentForm.svelte</Badge>
				</div>

				<div>
					<h4 class="font-medium mb-2">2. Rich Text Editor</h4>
					<p class="text-sm text-muted-foreground mb-2">
						Media browser button in the Edra toolbar allows inserting images and videos directly into content.
					</p>
					<Badge variant="secondary">MediaBrowserButton.svelte</Badge>
					<Badge variant="secondary">Edra Toolbar Integration</Badge>
				</div>

				<div>
					<h4 class="font-medium mb-2">3. User Profile Management</h4>
					<p class="text-sm text-muted-foreground mb-2">
						Profile image selection in user management forms with avatar preview.
					</p>
					<Badge variant="secondary">User Profiles Page</Badge>
				</div>

				<div>
					<h4 class="font-medium mb-2">4. Reusable Component</h4>
					<p class="text-sm text-muted-foreground mb-2">
						MediaPicker can be used in any form with customizable options for file types, multiple selection, and URL input.
					</p>
					<Badge variant="secondary">MediaPicker.svelte</Badge>
				</div>
			</div>
		</CardContent>
	</Card>
</div>