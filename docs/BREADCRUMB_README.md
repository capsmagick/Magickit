# Dynamic Breadcrumb System

The breadcrumb component in your Magickit application now automatically updates based on the current route, providing users with clear navigation context and easy navigation back to previous levels.

## How It Works

### 1. Automatic Route Detection

The breadcrumbs are automatically generated using SvelteKit's `$page` store, which provides real-time access to the current URL pathname.

### 2. Dynamic Generation

- **Path Parsing**: The current URL is split into segments (e.g., `/admin/users` becomes `['admin', 'users']`)
- **Label Formatting**: Each segment is automatically formatted (e.g., `admin` becomes `Admin Panel`, `users` becomes `User Management`)
- **Link Generation**: Each breadcrumb item gets a proper href for navigation
- **Current Page Detection**: The last segment is marked as the current page

### 3. Smart Labeling

Custom labels are applied for better user experience:

- `admin` → `Admin Panel`
- `users` → `User Management`
- `login` → `Sign In`
- `signup` → `Sign Up`
- `my-account` → `My Account`

## Implementation

### Core Utility Function

```typescript
// src/lib/utils/breadcrumb.ts
export function generateBreadcrumbs(path: string, config: BreadcrumbConfig = {}): BreadcrumbItem[];
```

### Usage in Components

```svelte
<script lang="ts">
	import { page } from '$app/stores';
	import { generateBreadcrumbs } from '$lib/utils/breadcrumb.js';

	const breadcrumbs = $derived(
		generateBreadcrumbs($page.url.pathname, {
			customLabels: { admin: 'Admin Panel' }
		})
	);
</script>
```

## Where Breadcrumbs Appear

### 1. Admin Routes (`/admin/*`)

- Located in the admin sidebar header
- Shows: `Home > Admin Panel > [Current Section]`
- Custom labels for admin-specific terms

### 2. Public Routes (non-admin)

- Located in the main header
- Shows: `[Current Section]` (e.g., `Sign In`, `My Account`)
- Automatically hidden for admin routes

## Features

✅ **Automatic Updates**: Breadcrumbs update instantly when navigating between routes
✅ **Custom Labels**: Human-readable labels instead of raw URL segments
✅ **Clickable Navigation**: Users can click any breadcrumb to navigate back
✅ **Current Page Highlighting**: The current page is visually distinguished
✅ **Responsive Design**: Adapts to different screen sizes
✅ **Accessibility**: Proper ARIA labels and semantic HTML
✅ **No Manual Configuration**: Works automatically for all new routes

## Adding New Routes

**No additional configuration needed!** When you add new routes to your application:

1. Create the route file (e.g., `src/routes/settings/+page.svelte`)
2. The breadcrumb will automatically show: `Home > Settings`
3. If you want a custom label, add it to the `customLabels` object

### Example: Adding a Settings Route

```typescript
// In your layout or component
const customLabels = {
	admin: 'Admin Panel',
	settings: 'Settings', // Add this line
	users: 'User Management'
};
```

## Customization

### Custom Labels

```typescript
const customLabels = {
	'your-route': 'Your Custom Label',
	'another-route': 'Another Custom Label'
};
```

### Excluding Segments

```typescript
const breadcrumbs = generateBreadcrumbs($page.url.pathname, {
	excludeSegments: ['api', 'internal']
});
```

### Custom Home Label

```typescript
const breadcrumbs = generateBreadcrumbs($page.url.pathname, {
	homeLabel: 'Dashboard',
	homeHref: '/dashboard'
});
```

## File Structure

```
src/
├── lib/
│   ├── components/
│   │   ├── ui/
│   │   │   └── breadcrumb/          # Breadcrumb UI components
│   │   └── header.svelte            # Header with breadcrumbs
│   └── utils/
│       └── breadcrumb.ts            # Breadcrumb utility functions
└── routes/
    ├── admin/
    │   └── +layout.svelte           # Admin layout with breadcrumbs
    └── +layout.svelte               # Root layout
```

## Testing

Visit `/test-breadcrumbs` to see a demonstration of the breadcrumb functionality with navigation examples.

## Benefits

1. **Better UX**: Users always know where they are in the application
2. **Easier Navigation**: One-click access to parent pages
3. **Professional Appearance**: Modern, polished navigation experience
4. **Zero Maintenance**: Automatically works with new routes
5. **Consistent Design**: Unified breadcrumb appearance across the app

## Technical Details

- Uses Svelte 5 runes (`$derived`) for reactive updates
- Integrates with SvelteKit's routing system
- Built with existing shadcn-svelte components
- Fully responsive and accessible
- TypeScript support with proper interfaces
