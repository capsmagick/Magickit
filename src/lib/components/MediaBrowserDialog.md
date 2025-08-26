# MediaBrowserDialog Component

A reusable media browser dialog component that provides comprehensive media selection and upload functionality for content management systems.

## Features

- **Single and Multiple Selection**: Support for both single file selection and multiple file selection modes
- **File Type Filtering**: Configurable file type acceptance (images, videos, audio, documents)
- **File Size Validation**: Configurable maximum file size limits with user-friendly error messages
- **Search and Filtering**: Real-time search functionality with debounced API calls
- **Folder Navigation**: Hierarchical folder structure with breadcrumb navigation
- **Upload Functionality**: Drag-and-drop and click-to-upload with progress indicators
- **Grid and List Views**: Toggle between grid and list display modes
- **Accessibility Compliant**: Full keyboard navigation, ARIA labels, and screen reader support
- **Responsive Design**: Mobile-friendly interface that adapts to different screen sizes

## Usage

### Basic Usage

```svelte
<script>
  import MediaBrowserDialog from '$lib/components/MediaBrowserDialog.svelte';
  import type { MediaFile } from '$lib/db/models';

  let showDialog = false;
  let selectedFiles: MediaFile[] = [];

  function handleSelect(files: MediaFile[]) {
    selectedFiles = files;
    console.log('Selected files:', files);
  }

  function handleClose() {
    showDialog = false;
  }
</script>

<button onclick={() => showDialog = true}>
  Open Media Browser
</button>

<MediaBrowserDialog
  bind:open={showDialog}
  onSelect={handleSelect}
  onClose={handleClose}
/>
```

### Advanced Usage

```svelte
<script>
  import MediaBrowserDialog from '$lib/components/MediaBrowserDialog.svelte';
  import type { MediaFile } from '$lib/db/models';

  let showDialog = false;
  let selectedFiles: MediaFile[] = [];

  function handleSelect(files: MediaFile[]) {
    selectedFiles = files;
    // Process selected files
    files.forEach(file => {
      console.log(`Selected: ${file.filename} (${file.mimeType})`);
    });
  }

  function handleClose() {
    showDialog = false;
  }
</script>

<MediaBrowserDialog
  bind:open={showDialog}
  multiple={true}
  accept={['image/*', 'video/*']}
  maxSize={50 * 1024 * 1024}
  onSelect={handleSelect}
  onClose={handleClose}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | `false` | Controls dialog visibility (bindable) |
| `multiple` | `boolean` | `false` | Enable multiple file selection |
| `accept` | `string[]` | `['image/*']` | Accepted file types (MIME types or patterns) |
| `maxSize` | `number` | `10 * 1024 * 1024` | Maximum file size in bytes (10MB default) |
| `onSelect` | `(files: MediaFile[]) => void` | Required | Callback when files are selected |
| `onClose` | `() => void` | Required | Callback when dialog is closed |

## File Type Patterns

The `accept` prop supports various file type patterns:

```typescript
// Specific MIME types
accept={['image/jpeg', 'image/png']}

// Category patterns
accept={['image/*', 'video/*', 'audio/*']}

// Mixed patterns
accept={['image/*', 'application/pdf', 'text/plain']}
```

## Supported File Types

### Images
- JPEG (`image/jpeg`)
- PNG (`image/png`)
- WebP (`image/webp`)
- GIF (`image/gif`)
- SVG (`image/svg+xml`)

### Videos
- MP4 (`video/mp4`)
- WebM (`video/webm`)
- OGG (`video/ogg`)

### Audio
- MP3 (`audio/mp3`)
- WAV (`audio/wav`)
- OGG (`audio/ogg`)

### Documents
- PDF (`application/pdf`)

## API Integration

The component integrates with the following API endpoints:

### Get Media Files and Folders
```
POST /api/media
```

Request body:
```json
{
  "action": "getMedia",
  "folderId": "string | null",
  "search": "string",
  "sortBy": "createdAt | filename | size",
  "sortOrder": "asc | desc",
  "limit": 50
}
```

### Upload Files
```
POST /api/media/upload
```

Form data:
- `file`: File to upload
- `folderId`: Optional folder ID

## Accessibility Features

The MediaBrowserDialog component is fully accessible and includes:

- **Keyboard Navigation**: Full keyboard support with Tab, Enter, and Arrow keys
- **ARIA Labels**: Proper labeling for screen readers
- **Role Attributes**: Correct semantic roles for dialog and interactive elements
- **Focus Management**: Proper focus trapping and restoration
- **Screen Reader Support**: Descriptive text for all interactive elements

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Tab` | Navigate between elements |
| `Enter` / `Space` | Select files or activate buttons |
| `Escape` | Close dialog |
| `Arrow Keys` | Navigate through file grid |

## Error Handling

The component handles various error scenarios:

- **Network Errors**: Displays user-friendly error messages for API failures
- **File Validation Errors**: Shows specific error messages for invalid files
- **Upload Errors**: Provides feedback for failed uploads
- **Loading States**: Shows loading indicators during operations

## Styling

The component uses Tailwind CSS classes and follows the established design system:

- **Colors**: Uses theme colors (primary, secondary, muted, destructive)
- **Typography**: Follows established text size hierarchy
- **Spacing**: Uses consistent gap and padding patterns
- **Animations**: Smooth transitions and loading states

## Performance Considerations

- **Debounced Search**: Search queries are debounced to reduce API calls
- **Lazy Loading**: Images are loaded lazily for better performance
- **Optimized Rendering**: Efficient re-rendering with Svelte's reactivity
- **Memory Management**: Proper cleanup of event listeners and timers

## Testing

The component includes comprehensive tests covering:

- **Unit Tests**: Individual function testing
- **Integration Tests**: API integration testing
- **Accessibility Tests**: ARIA compliance and keyboard navigation
- **Error Handling Tests**: Various error scenarios

Run tests with:
```bash
npm test MediaBrowserDialog
```

## Browser Support

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile Browsers**: iOS Safari 14+, Chrome Mobile 90+
- **Features**: File API, Drag and Drop API, Fetch API

## Dependencies

- **Svelte 5**: Component framework
- **Lucide Svelte**: Icons
- **Tailwind CSS**: Styling
- **shadcn-svelte**: UI components (Dialog, Button, Input, etc.)

## Related Components

- `MediaGrid.svelte`: Grid display for media files
- `MediaUpload.svelte`: File upload functionality
- `FolderNavigation.svelte`: Folder tree navigation
- `MediaBrowserTest.svelte`: Test component for demonstration

## Examples

### Image Selection for Blog Posts

```svelte
<script>
  let featuredImage = null;
  let showImageBrowser = false;

  function selectFeaturedImage(files) {
    featuredImage = files[0];
    showImageBrowser = false;
  }
</script>

<div class="form-field">
  <label>Featured Image</label>
  {#if featuredImage}
    <img src={featuredImage.variants.find(v => v.name === 'thumbnail')?.s3Url} 
         alt={featuredImage.altText} />
    <button onclick={() => showImageBrowser = true}>Change Image</button>
  {:else}
    <button onclick={() => showImageBrowser = true}>Select Image</button>
  {/if}
</div>

<MediaBrowserDialog
  bind:open={showImageBrowser}
  accept={['image/*']}
  onSelect={selectFeaturedImage}
  onClose={() => showImageBrowser = false}
/>
```

### Multiple File Selection for Gallery

```svelte
<script>
  let galleryImages = [];
  let showGalleryBrowser = false;

  function selectGalleryImages(files) {
    galleryImages = [...galleryImages, ...files];
    showGalleryBrowser = false;
  }
</script>

<div class="gallery-manager">
  <h3>Gallery Images ({galleryImages.length})</h3>
  
  <div class="image-grid">
    {#each galleryImages as image}
      <div class="image-item">
        <img src={image.variants.find(v => v.name === 'thumbnail')?.s3Url} 
             alt={image.altText} />
        <button onclick={() => galleryImages = galleryImages.filter(i => i._id !== image._id)}>
          Remove
        </button>
      </div>
    {/each}
  </div>
  
  <button onclick={() => showGalleryBrowser = true}>Add Images</button>
</div>

<MediaBrowserDialog
  bind:open={showGalleryBrowser}
  multiple={true}
  accept={['image/*']}
  maxSize={20 * 1024 * 1024}
  onSelect={selectGalleryImages}
  onClose={() => showGalleryBrowser = false}
/>
```

## Contributing

When contributing to this component:

1. Follow the existing code style and patterns
2. Add tests for new functionality
3. Update documentation for any API changes
4. Ensure accessibility compliance
5. Test across different browsers and devices

## License

This component is part of the Magickit template and follows the same license terms.