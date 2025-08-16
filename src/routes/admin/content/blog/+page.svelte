<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import { 
		Plus, 
		Search, 
		Filter, 
		Pencil, 
		Trash2, 
		Eye, 
		Loader2,
		FileText,
		Calendar,
		User
	} from '@lucide/svelte';
	import type { BlogPost } from '$lib/db/models.js';
	import { goto } from '$app/navigation';

	interface Props {
		data: {
			posts: BlogPost[];
			total: number;
		};
	}

	let { data }: Props = $props();

	// State management
	let searchTerm = $state('');
	let selectedStatus = $state<BlogPost['status'] | 'all'>('all');
	let isLoading = $state(false);
	let posts = $state(data.posts);
	let total = $state(data.total);

	// Filter and search functionality
	let filteredPosts = $derived(() => {
		let filtered = posts;

		// Filter by search term
		if (searchTerm.trim()) {
			const query = searchTerm.toLowerCase();
			filtered = filtered.filter(post => 
				post.title.toLowerCase().includes(query) ||
				post.excerpt.toLowerCase().includes(query) ||
				post.tags.some(tag => tag.toLowerCase().includes(query))
			);
		}

		// Filter by status
		if (selectedStatus !== 'all') {
			filtered = filtered.filter(post => post.status === selectedStatus);
		}

		return filtered;
	});

	// Event handlers
	function handleCreatePost() {
		goto('/admin/content/blog/create');
	}

	function handleEditPost(post: BlogPost) {
		goto(`/admin/content/blog/edit/${post._id}`);
	}

	function handleViewPost(post: BlogPost) {
		if (post.status === 'published') {
			window.open(`/blog/${post.slug}`, '_blank');
		} else {
			goto(`/admin/content/blog/preview/${post._id}`);
		}
	}

	async function handleDeletePost(post: BlogPost) {
		if (!confirm(`Are you sure you want to delete "${post.title}"?`)) {
			return;
		}

		isLoading = true;
		try {
			const response = await fetch(`/admin/content/blog/${post._id}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				throw new Error('Failed to delete post');
			}

			// Remove from local state
			posts = posts.filter(p => p._id !== post._id);
			total = total - 1;
		} catch (error) {
			console.error('Error deleting post:', error);
			alert('Failed to delete post. Please try again.');
		} finally {
			isLoading = false;
		}
	}

	function resetFilters() {
		searchTerm = '';
		selectedStatus = 'all';
	}

	function getStatusVariant(status: BlogPost['status']) {
		switch (status) {
			case 'published':
				return 'default';
			case 'draft':
				return 'secondary';
			case 'archived':
				return 'outline';
			default:
				return 'secondary';
		}
	}

	function formatDate(date: Date | string) {
		const d = typeof date === 'string' ? new Date(date) : date;
		return d.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Blog Posts | Admin | Magickit</title>
	<meta name="description" content="Manage blog posts and content" />
</svelte:head>

<div class="space-y-6">
	<!-- Header with Actions -->
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
		<div class="space-y-2">
			<h1 class="text-2xl font-bold">Blog Posts</h1>
			<p class="text-muted-foreground">Create and manage your blog content</p>
		</div>
		<Button onclick={handleCreatePost} class="transition-colors duration-200">
			<Plus class="mr-2 h-4 w-4" />
			Create Post
		</Button>
	</div>

	<!-- Search and Filters -->
	<Card>
		<CardContent class="p-4">
			<div class="flex flex-col sm:flex-row gap-4">
				<div class="flex-1">
					<div class="relative">
						<Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
						<Input 
							type="search" 
							placeholder="Search posts by title, content, or tags..." 
							class="pl-8 transition-colors duration-200" 
							bind:value={searchTerm} 
						/>
					</div>
				</div>
				<div class="flex gap-2">
					<select 
						bind:value={selectedStatus}
						class="px-3 py-2 border border-input bg-background rounded-md text-sm transition-colors duration-200"
					>
						<option value="all">All Status</option>
						<option value="published">Published</option>
						<option value="draft">Draft</option>
						<option value="archived">Archived</option>
					</select>
					<Button variant="outline" onclick={resetFilters} class="transition-colors duration-200">
						Reset
					</Button>
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- Stats Cards -->
	<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
		<Card>
			<CardContent class="p-4">
				<div class="flex items-center space-x-2">
					<FileText class="h-4 w-4 text-muted-foreground" />
					<div>
						<p class="text-sm font-medium">Total Posts</p>
						<p class="text-2xl font-bold">{total}</p>
					</div>
				</div>
			</CardContent>
		</Card>
		<Card>
			<CardContent class="p-4">
				<div class="flex items-center space-x-2">
					<Eye class="h-4 w-4 text-green-600" />
					<div>
						<p class="text-sm font-medium">Published</p>
						<p class="text-2xl font-bold">{posts.filter(p => p.status === 'published').length}</p>
					</div>
				</div>
			</CardContent>
		</Card>
		<Card>
			<CardContent class="p-4">
				<div class="flex items-center space-x-2">
					<Pencil class="h-4 w-4 text-yellow-600" />
					<div>
						<p class="text-sm font-medium">Drafts</p>
						<p class="text-2xl font-bold">{posts.filter(p => p.status === 'draft').length}</p>
					</div>
				</div>
			</CardContent>
		</Card>
		<Card>
			<CardContent class="p-4">
				<div class="flex items-center space-x-2">
					<Calendar class="h-4 w-4 text-blue-600" />
					<div>
						<p class="text-sm font-medium">This Month</p>
						<p class="text-2xl font-bold">
							{posts.filter(p => {
								const postDate = new Date(p.createdAt);
								const now = new Date();
								return postDate.getMonth() === now.getMonth() && 
								       postDate.getFullYear() === now.getFullYear();
							}).length}
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	</div>

	<!-- Blog Posts Table -->
	<Card>
		<CardContent class="p-0">
			{#if isLoading}
				<div class="flex justify-center py-12">
					<Loader2 class="h-8 w-8 animate-spin text-primary" />
				</div>
			{:else if filteredPosts.length === 0}
				<div class="text-center py-12 space-y-4">
					<FileText class="h-12 w-12 mx-auto text-muted-foreground" />
					<div class="space-y-2">
						<h3 class="text-lg font-semibold">
							{searchTerm || selectedStatus !== 'all' ? 'No posts found' : 'No blog posts yet'}
						</h3>
						<p class="text-muted-foreground">
							{searchTerm || selectedStatus !== 'all' 
								? 'Try adjusting your search or filters.' 
								: 'Get started by creating your first blog post.'}
						</p>
					</div>
					{#if !searchTerm && selectedStatus === 'all'}
						<Button onclick={handleCreatePost} class="transition-colors duration-200">
							<Plus class="mr-2 h-4 w-4" />
							Create First Post
						</Button>
					{/if}
				</div>
			{:else}
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Title</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Author</TableHead>
							<TableHead>Created</TableHead>
							<TableHead>Published</TableHead>
							<TableHead class="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each filteredPosts as post}
							<TableRow class="transition-colors duration-200 hover:bg-muted/50">
								<TableCell>
									<div class="space-y-1">
										<p class="font-medium text-sm">{post.title}</p>
										<p class="text-xs text-muted-foreground line-clamp-2">
											{post.excerpt}
										</p>
										{#if post.tags.length > 0}
											<div class="flex flex-wrap gap-1 mt-1">
												{#each post.tags.slice(0, 3) as tag}
													<Badge variant="outline" class="text-xs px-1 py-0">
														{tag}
													</Badge>
												{/each}
												{#if post.tags.length > 3}
													<Badge variant="outline" class="text-xs px-1 py-0">
														+{post.tags.length - 3}
													</Badge>
												{/if}
											</div>
										{/if}
									</div>
								</TableCell>
								<TableCell>
									<Badge variant={getStatusVariant(post.status)}>
										{post.status}
									</Badge>
									{#if post.featured}
										<Badge variant="default" class="ml-1 text-xs">
											Featured
										</Badge>
									{/if}
								</TableCell>
								<TableCell class="text-sm text-muted-foreground">
									<div class="flex items-center gap-1">
										<User class="h-3 w-3" />
										Author
									</div>
								</TableCell>
								<TableCell class="text-sm text-muted-foreground">
									{formatDate(post.createdAt)}
								</TableCell>
								<TableCell class="text-sm text-muted-foreground">
									{post.publishedAt ? formatDate(post.publishedAt) : '-'}
								</TableCell>
								<TableCell class="text-right">
									<div class="flex items-center justify-end gap-2">
										<Button 
											variant="ghost" 
											size="icon" 
											onclick={() => handleViewPost(post)}
											aria-label="View post"
											class="transition-colors duration-200"
										>
											<Eye class="h-4 w-4" />
										</Button>
										<Button 
											variant="ghost" 
											size="icon" 
											onclick={() => handleEditPost(post)}
											aria-label="Edit post"
											class="transition-colors duration-200"
										>
											<Pencil class="h-4 w-4" />
										</Button>
										<Button 
											variant="ghost" 
											size="icon" 
											onclick={() => handleDeletePost(post)}
											aria-label="Delete post"
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
			{/if}
		</CardContent>
	</Card>

	<!-- Pagination would go here if needed -->
	{#if filteredPosts.length > 0 && total > filteredPosts.length}
		<div class="flex justify-center">
			<p class="text-sm text-muted-foreground">
				Showing {filteredPosts.length} of {total} posts
			</p>
		</div>
	{/if}
</div>