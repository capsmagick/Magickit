<script lang="ts">
	import DynamicContentRenderer from './DynamicContentRenderer.svelte';
	import type { ContentInstance, ContentType } from '$lib/db/models';

	// Example content type definition
	const exampleContentType: ContentType = {
		_id: 'example-type-1',
		name: 'Blog Post',
		slug: 'blog-post',
		fields: [
			{
				_id: 'field-1',
				name: 'title',
				label: 'Title',
				type: 'text',
				required: true,
				order: 0
			},
			{
				_id: 'field-2',
				name: 'excerpt',
				label: 'Excerpt',
				type: 'textarea',
				required: false,
				order: 1
			},
			{
				_id: 'field-3',
				name: 'content',
				label: 'Content',
				type: 'richtext',
				required: true,
				order: 2
			},
			{
				_id: 'field-4',
				name: 'featured_image',
				label: 'Featured Image',
				type: 'image',
				required: false,
				order: 3
			},
			{
				_id: 'field-5',
				name: 'published',
				label: 'Published',
				type: 'boolean',
				required: false,
				order: 4
			},
			{
				_id: 'field-6',
				name: 'publish_date',
				label: 'Publish Date',
				type: 'date',
				required: false,
				order: 5
			},
			{
				_id: 'field-7',
				name: 'read_time',
				label: 'Read Time (minutes)',
				type: 'number',
				required: false,
				order: 6
			},
			{
				_id: 'field-8',
				name: 'author_website',
				label: 'Author Website',
				type: 'url',
				required: false,
				order: 7
			},
			{
				_id: 'field-9',
				name: 'contact_email',
				label: 'Contact Email',
				type: 'email',
				required: false,
				order: 8
			},
			{
				_id: 'field-10',
				name: 'tags',
				label: 'Tags',
				type: 'multiselect',
				required: false,
				options: ['Technology', 'Design', 'Development', 'Tutorial', 'News'],
				order: 9
			}
		],
		isSystemType: false,
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-01')
	};

	// Example content instance
	const exampleContent: ContentInstance = {
		_id: 'content-1',
		contentTypeId: 'example-type-1',
		slug: 'getting-started-with-sveltekit',
		title: 'Getting Started with SvelteKit',
		data: {
			title: 'Getting Started with SvelteKit',
			excerpt: 'Learn how to build modern web applications with SvelteKit, the official framework for building Svelte applications.',
			content: `
				<h2>Introduction</h2>
				<p>SvelteKit is a powerful framework that makes building web applications with Svelte a breeze. In this comprehensive guide, we'll explore the key concepts and features that make SvelteKit an excellent choice for modern web development.</p>
				
				<h3>Key Features</h3>
				<ul>
					<li><strong>Server-side rendering (SSR)</strong> - Fast initial page loads</li>
					<li><strong>Static site generation (SSG)</strong> - Deploy anywhere</li>
					<li><strong>Progressive enhancement</strong> - Works without JavaScript</li>
					<li><strong>File-based routing</strong> - Intuitive project structure</li>
				</ul>
				
				<h3>Getting Started</h3>
				<p>To create a new SvelteKit project, run the following command:</p>
				<pre><code>npm create svelte@latest my-app
cd my-app
npm install
npm run dev</code></pre>
				
				<blockquote>
					<p>SvelteKit provides an excellent developer experience with hot module replacement, TypeScript support, and built-in optimizations.</p>
				</blockquote>
			`,
			featured_image: {
				url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=400&fit=crop',
				alt: 'Developer working on code',
				caption: 'Building modern web applications with SvelteKit'
			},
			published: true,
			publish_date: new Date('2024-01-15'),
			read_time: 8,
			author_website: 'https://example.com',
			contact_email: 'author@example.com',
			tags: ['Technology', 'Development', 'Tutorial']
		},
		status: 'published',
		publishedAt: new Date('2024-01-15'),
		author: 'author-1',
		lastModifiedBy: 'author-1',
		version: 1,
		seo: {
			title: 'Getting Started with SvelteKit - Complete Guide',
			description: 'Learn how to build modern web applications with SvelteKit. Complete tutorial covering SSR, SSG, routing, and more.',
			keywords: ['SvelteKit', 'Svelte', 'Web Development', 'JavaScript', 'Framework']
		},
		createdAt: new Date('2024-01-10'),
		updatedAt: new Date('2024-01-15')
	};

	let renderMode: 'full' | 'preview' | 'excerpt' = $state('full');
	let showTitle = $state(true);
	let titleLevel: 1 | 2 | 3 | 4 | 5 | 6 = $state(1);
</script>

<div class="max-w-4xl mx-auto p-6 space-y-8">
	<div class="space-y-4">
		<h1 class="text-3xl font-bold">DynamicContentRenderer Example</h1>
		<p class="text-muted-foreground">
			This example demonstrates the DynamicContentRenderer component with various field types and render modes.
		</p>
	</div>

	<!-- Controls -->
	<div class="bg-muted/50 p-4 rounded-lg space-y-4">
		<h2 class="text-lg font-semibold">Controls</h2>
		
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<div class="space-y-2">
				<label class="text-sm font-medium">Render Mode</label>
				<select bind:value={renderMode} class="w-full p-2 border rounded">
					<option value="full">Full</option>
					<option value="preview">Preview</option>
					<option value="excerpt">Excerpt</option>
				</select>
			</div>
			
			<div class="space-y-2">
				<label class="text-sm font-medium">Title Level</label>
				<select bind:value={titleLevel} class="w-full p-2 border rounded">
					<option value={1}>H1</option>
					<option value={2}>H2</option>
					<option value={3}>H3</option>
					<option value={4}>H4</option>
					<option value={5}>H5</option>
					<option value={6}>H6</option>
				</select>
			</div>
			
			<div class="space-y-2">
				<label class="text-sm font-medium">Show Title</label>
				<label class="flex items-center space-x-2">
					<input type="checkbox" bind:checked={showTitle} class="rounded">
					<span class="text-sm">Display title</span>
				</label>
			</div>
		</div>
	</div>

	<!-- Rendered Content -->
	<div class="border rounded-lg p-6 bg-background">
		<DynamicContentRenderer
			content={exampleContent}
			contentType={exampleContentType}
			{renderMode}
			{showTitle}
			{titleLevel}
			class="example-content"
		/>
	</div>

	<!-- Content Type Information -->
	<details class="bg-muted/30 p-4 rounded-lg">
		<summary class="font-semibold cursor-pointer">Content Type Definition</summary>
		<div class="mt-4 space-y-2">
			<p><strong>Name:</strong> {exampleContentType.name}</p>
			<p><strong>Slug:</strong> {exampleContentType.slug}</p>
			<p><strong>Fields:</strong> {exampleContentType.fields.length}</p>
			
			<div class="mt-4">
				<h4 class="font-medium mb-2">Field Types:</h4>
				<div class="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
					{#each exampleContentType.fields as field}
						<div class="bg-background p-2 rounded border">
							<div class="font-medium">{field.label}</div>
							<div class="text-muted-foreground">{field.type}</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</details>
</div>

<style>
	:global(.example-content) {
		/* Custom styling for the example */
		font-family: system-ui, -apple-system, sans-serif;
	}
	
	select, input[type="checkbox"] {
		border: 1px solid hsl(var(--border));
		border-radius: 0.375rem;
	}
	
	select:focus, input[type="checkbox"]:focus {
		outline: 2px solid hsl(var(--primary));
		outline-offset: 2px;
	}
</style>