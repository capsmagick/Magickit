<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger,
		SelectValue
	} from '$lib/components/ui/select/index.js';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle,
		DialogTrigger
	} from '$lib/components/ui/dialog/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { authClient } from '$lib/auth/auth-client';
	import { goto } from '$app/navigation';
	import {
		Plus,
		Search,
		Filter,
		BookOpen,
		Eye,
		Edit,
		Trash2,
		Loader2,
		TrendingUp,
		ThumbsUp,
		Calendar,
		User,
		Tag,
		BarChart3
	} from '@lucide/svelte';

	let hasCheckedAuth = $state(false);
	let showCreateDialog = $state(false);
	let showEditDialog = $state(false);
	let selectedArticle: any = $state(null);
	let searchTerm = $state('');
	let categoryFilter = $state('all');
	let isLoading = $state(false);

	const session = authClient.useSession();

	// Mock data for demonstration
	let knowledgeBase = $state([
		{
			id: 'KB-001',
			title: 'How to reset your password',
			content: `# Password Reset Guide

If you've forgotten your password, follow these simple steps to reset it:

## Step 1: Navigate to Login Page
Go to the login page and click on "Forgot Password?" link.

## Step 2: Enter Your Email
Enter the email address associated with your account.

## Step 3: Check Your Email
Look for a password reset email in your inbox. Check your spam folder if you don't see it within 5 minutes.

## Step 4: Click Reset Link
Click the reset link in the email. This link is valid for 24 hours.

## Step 5: Create New Password
Enter your new password. Make sure it meets our security requirements:
- At least 8 characters long
- Contains uppercase and lowercase letters
- Contains at least one number
- Contains at least one special character

## Troubleshooting
If you're still having issues, please contact our support team.`,
			excerpt: 'Learn how to reset your password in 5 simple steps.',
			category: 'authentication',
			tags: ['password', 'reset', 'login', 'security'],
			author: {
				name: 'Admin User',
				email: 'admin@example.com'
			},
			createdAt: new Date('2024-01-01T10:00:00'),
			updatedAt: new Date('2024-01-15T14:30:00'),
			views: 245,
			helpful: 32,
			notHelpful: 3,
			status: 'published'
		},
		{
			id: 'KB-002',
			title: 'Admin panel access guide',
			content: `# Admin Panel Access Guide

This guide explains how to access and navigate the admin panel.

## Prerequisites
- You must have admin privileges
- You must be logged in to your account

## Accessing the Admin Panel
1. Log in to your account
2. Click on your profile menu in the top right
3. Select "Admin Panel" from the dropdown
4. You will be redirected to the admin dashboard

## Admin Panel Features
The admin panel includes several sections:

### Dashboard
- Overview of system statistics
- Recent activity feed
- Quick action buttons

### User Management
- View all users
- Edit user profiles
- Manage user permissions

### Content Management
- Create and edit content
- Manage categories and tags
- Review and publish content

## Troubleshooting
If you can't access the admin panel, check:
- Your user role (must be admin)
- Your login status
- Browser permissions and cookies`,
			excerpt: 'Complete guide to accessing and using the admin panel.',
			category: 'administration',
			tags: ['admin', 'panel', 'access', 'guide'],
			author: {
				name: 'Admin User',
				email: 'admin@example.com'
			},
			createdAt: new Date('2024-01-05T09:00:00'),
			updatedAt: new Date('2024-01-20T11:00:00'),
			views: 123,
			helpful: 18,
			notHelpful: 1,
			status: 'published'
		},
		{
			id: 'KB-003',
			title: 'API Documentation Overview',
			content: `# API Documentation Overview

Our API provides programmatic access to platform features.

## Getting Started
1. Obtain API credentials from your account settings
2. Review the authentication requirements
3. Test endpoints using our interactive documentation

## Authentication
All API requests require authentication using API keys.

## Rate Limits
- 1000 requests per hour for standard users
- 5000 requests per hour for premium users

## Support
For API support, contact our technical team.`,
			excerpt: 'Overview of our API documentation and getting started guide.',
			category: 'api',
			tags: ['api', 'documentation', 'development'],
			author: {
				name: 'Tech Team',
				email: 'tech@example.com'
			},
			createdAt: new Date('2024-01-10T15:00:00'),
			updatedAt: new Date('2024-01-10T15:00:00'),
			views: 89,
			helpful: 12,
			notHelpful: 0,
			status: 'draft'
		}
	]);

	// Form data
	let newArticle = $state({
		title: '',
		content: '',
		excerpt: '',
		category: 'general',
		tags: '',
		status: 'draft'
	});

	let editArticle = $state({
		title: '',
		content: '',
		excerpt: '',
		category: 'general',
		tags: '',
		status: 'draft'
	});

	// Check authentication
	$effect(() => {
		if (!hasCheckedAuth && $session.data) {
			hasCheckedAuth = true;
			if ($session.data.user.role !== 'admin') {
				goto('/login?returnTo=/admin/support/knowledge-base');
				return;
			}
		}
	});

	// Filter articles based on search and filters
	const filteredArticles = $derived(() => {
		return knowledgeBase.filter(article => {
			const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
				article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
				article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
			
			const matchesCategory = categoryFilter === 'all' || article.category === categoryFilter;
			
			return matchesSearch && matchesCategory;
		});
	});

	// Get unique categories
	const categories = $derived(() => {
		const cats = [...new Set(knowledgeBase.map(article => article.category))];
		return cats.sort();
	});

	function createArticle() {
		if (!newArticle.title || !newArticle.content) {
			return;
		}

		const article = {
			id: `KB-${String(knowledgeBase.length + 1).padStart(3, '0')}`,
			title: newArticle.title,
			content: newArticle.content,
			excerpt: newArticle.excerpt || newArticle.content.substring(0, 150) + '...',
			category: newArticle.category,
			tags: newArticle.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
			author: {
				name: $session.data?.user?.name || 'Admin User',
				email: $session.data?.user?.email || 'admin@example.com'
			},
			createdAt: new Date(),
			updatedAt: new Date(),
			views: 0,
			helpful: 0,
			notHelpful: 0,
			status: newArticle.status
		};

		knowledgeBase = [...knowledgeBase, article];
		newArticle = { title: '', content: '', excerpt: '', category: 'general', tags: '', status: 'draft' };
		showCreateDialog = false;
	}

	function updateArticle() {
		if (!editArticle.title || !editArticle.content || !selectedArticle) {
			return;
		}

		const updatedArticle = {
			...selectedArticle,
			title: editArticle.title,
			content: editArticle.content,
			excerpt: editArticle.excerpt || editArticle.content.substring(0, 150) + '...',
			category: editArticle.category,
			tags: editArticle.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
			status: editArticle.status,
			updatedAt: new Date()
		};

		knowledgeBase = knowledgeBase.map(article =>
			article.id === selectedArticle.id ? updatedArticle : article
		);

		showEditDialog = false;
		selectedArticle = null;
	}

	function deleteArticle(articleId: string) {
		if (confirm('Are you sure you want to delete this article?')) {
			knowledgeBase = knowledgeBase.filter(article => article.id !== articleId);
		}
	}

	function openEditDialog(article: any) {
		selectedArticle = article;
		editArticle = {
			title: article.title,
			content: article.content,
			excerpt: article.excerpt,
			category: article.category,
			tags: article.tags.join(', '),
			status: article.status
		};
		showEditDialog = true;
	}

	function getStatusBadge(status: string) {
		switch (status) {
			case 'published':
				return { variant: 'default' as const, text: 'Published' };
			case 'draft':
				return { variant: 'secondary' as const, text: 'Draft' };
			case 'archived':
				return { variant: 'outline' as const, text: 'Archived' };
			default:
				return { variant: 'outline' as const, text: status };
		}
	}

	function getCategoryBadge(category: string) {
		const colors: Record<string, string> = {
			'authentication': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
			'administration': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
			'api': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
			'troubleshooting': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
			'general': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
		};
		
		return colors[category] || colors['general'];
	}

	function resetFilters() {
		searchTerm = '';
		categoryFilter = 'all';
	}

	// Calculate analytics
	const analytics = $derived(() => {
		const totalArticles = knowledgeBase.length;
		const publishedArticles = knowledgeBase.filter(a => a.status === 'published').length;
		const totalViews = knowledgeBase.reduce((sum, a) => sum + a.views, 0);
		const totalHelpful = knowledgeBase.reduce((sum, a) => sum + a.helpful, 0);
		const avgHelpfulRating = totalArticles > 0 ? (totalHelpful / totalArticles).toFixed(1) : '0';
		
		return {
			totalArticles,
			publishedArticles,
			totalViews,
			avgHelpfulRating
		};
	});
</script>

<div class="space-y-6">
	<!-- Header with Actions -->
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
		<div class="space-y-2">
			<h1 class="text-2xl font-bold">Knowledge Base</h1>
			<p class="text-muted-foreground">Manage help articles and documentation</p>
		</div>
		<Dialog bind:open={showCreateDialog}>
			<DialogTrigger>
				<Button class="transition-colors duration-200">
					<Plus class="mr-2 h-4 w-4" />
					Create Article
				</Button>
			</DialogTrigger>
			<DialogContent class="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Create Knowledge Base Article</DialogTitle>
					<DialogDescription>Create a new help article for the knowledge base.</DialogDescription>
				</DialogHeader>
				<form
					onsubmit={(e) => {
						e.preventDefault();
						createArticle();
					}}
					class="space-y-4"
				>
					<div class="space-y-2">
						<Label for="articleTitle">Title *</Label>
						<Input
							id="articleTitle"
							bind:value={newArticle.title}
							placeholder="Article title"
							required
							class="transition-colors duration-200"
						/>
					</div>
					<div class="space-y-2">
						<Label for="articleExcerpt">Excerpt</Label>
						<Input
							id="articleExcerpt"
							bind:value={newArticle.excerpt}
							placeholder="Brief description (optional - will be auto-generated if empty)"
							class="transition-colors duration-200"
						/>
					</div>
					<div class="space-y-2">
						<Label for="articleContent">Content *</Label>
						<Textarea
							id="articleContent"
							bind:value={newArticle.content}
							placeholder="Article content (supports Markdown)"
							rows={8}
							required
							class="transition-colors duration-200 resize-none font-mono text-sm"
						/>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div class="space-y-2">
							<Label for="articleCategory">Category</Label>
							<Select bind:value={newArticle.category}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="general">General</SelectItem>
									<SelectItem value="getting-started">Getting Started</SelectItem>
									<SelectItem value="troubleshooting">Troubleshooting</SelectItem>
									<SelectItem value="features">Features</SelectItem>
									<SelectItem value="api">API</SelectItem>
									<SelectItem value="authentication">Authentication</SelectItem>
									<SelectItem value="administration">Administration</SelectItem>
									<SelectItem value="faq">FAQ</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div class="space-y-2">
							<Label for="articleStatus">Status</Label>
							<Select bind:value={newArticle.status}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="draft">Draft</SelectItem>
									<SelectItem value="published">Published</SelectItem>
									<SelectItem value="archived">Archived</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
					<div class="space-y-2">
						<Label for="articleTags">Tags</Label>
						<Input
							id="articleTags"
							bind:value={newArticle.tags}
							placeholder="Comma-separated tags (e.g., password, reset, login)"
							class="transition-colors duration-200"
						/>
					</div>
					<DialogFooter>
						<Button type="button" variant="outline" onclick={() => (showCreateDialog = false)}>
							Cancel
						</Button>
						<Button type="submit" class="transition-colors duration-200">
							<Plus class="mr-2 h-4 w-4" />
							Create Article
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	</div>

	<!-- Analytics Cards -->
	<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
		<Card.Root>
			<Card.Content class="p-4">
				<div class="flex items-center justify-between">
					<div class="space-y-1">
						<p class="text-sm text-muted-foreground">Total Articles</p>
						<p class="text-2xl font-bold">{analytics.totalArticles}</p>
					</div>
					<BookOpen class="h-8 w-8 text-primary" />
				</div>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Content class="p-4">
				<div class="flex items-center justify-between">
					<div class="space-y-1">
						<p class="text-sm text-muted-foreground">Published</p>
						<p class="text-2xl font-bold">{analytics.publishedArticles}</p>
					</div>
					<BarChart3 class="h-8 w-8 text-green-600" />
				</div>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Content class="p-4">
				<div class="flex items-center justify-between">
					<div class="space-y-1">
						<p class="text-sm text-muted-foreground">Total Views</p>
						<p class="text-2xl font-bold">{analytics.totalViews}</p>
					</div>
					<TrendingUp class="h-8 w-8 text-blue-600" />
				</div>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Content class="p-4">
				<div class="flex items-center justify-between">
					<div class="space-y-1">
						<p class="text-sm text-muted-foreground">Avg. Helpful Rating</p>
						<p class="text-2xl font-bold">{analytics.avgHelpfulRating}</p>
					</div>
					<ThumbsUp class="h-8 w-8 text-yellow-600" />
				</div>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Search and Filters -->
	<Card.Root>
		<Card.Content class="p-4">
			<div class="flex flex-col sm:flex-row gap-4">
				<div class="flex-1">
					<div class="relative">
						<Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
						<Input 
							type="search" 
							placeholder="Search articles..." 
							class="pl-8 transition-colors duration-200" 
							bind:value={searchTerm} 
						/>
					</div>
				</div>
				<div class="flex gap-2">
					<Select bind:value={categoryFilter}>
						<SelectTrigger class="w-40">
							<SelectValue placeholder="Category" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Categories</SelectItem>
							{#each categories as category}
								<SelectItem value={category}>{category}</SelectItem>
							{/each}
						</SelectContent>
					</Select>
					<Button variant="outline" onclick={resetFilters} class="transition-colors duration-200">
						Reset
					</Button>
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Articles Grid -->
	{#if isLoading}
		<div class="flex justify-center py-12">
			<Loader2 class="h-8 w-8 animate-spin text-primary" />
		</div>
	{:else if filteredArticles.length === 0}
		<div class="text-center py-12 space-y-4">
			<BookOpen class="h-12 w-12 mx-auto text-muted-foreground" />
			<div class="space-y-2">
				<h3 class="text-lg font-semibold">No articles found</h3>
				<p class="text-muted-foreground">
					{searchTerm || categoryFilter !== 'all' 
						? 'Try adjusting your search or filters.' 
						: 'Get started by creating your first knowledge base article.'}
				</p>
			</div>
			{#if !searchTerm && categoryFilter === 'all'}
				<Button onclick={() => showCreateDialog = true} class="transition-colors duration-200">
					<Plus class="mr-2 h-4 w-4" />
					Create Article
				</Button>
			{/if}
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each filteredArticles as article}
				{@const statusInfo = getStatusBadge(article.status)}
				<Card.Root class="transition-shadow duration-200 hover:shadow-md">
					<Card.Header class="space-y-2">
						<div class="flex items-start justify-between">
							<div class="space-y-1 flex-1">
								<Card.Title class="text-lg line-clamp-2">{article.title}</Card.Title>
								<div class="flex items-center gap-2">
									<Badge 
										class={getCategoryBadge(article.category)}
										variant="outline"
									>
										{article.category}
									</Badge>
									<Badge variant={statusInfo.variant}>
										{statusInfo.text}
									</Badge>
								</div>
							</div>
						</div>
						<Card.Description class="line-clamp-3">
							{article.excerpt}
						</Card.Description>
					</Card.Header>
					<Card.Content class="space-y-4">
						<!-- Tags -->
						{#if article.tags.length > 0}
							<div class="flex flex-wrap gap-1">
								{#each article.tags.slice(0, 3) as tag}
									<Badge variant="outline" class="text-xs">
										<Tag class="h-3 w-3 mr-1" />
										{tag}
									</Badge>
								{/each}
								{#if article.tags.length > 3}
									<Badge variant="outline" class="text-xs">
										+{article.tags.length - 3} more
									</Badge>
								{/if}
							</div>
						{/if}

						<!-- Stats -->
						<div class="flex items-center justify-between text-sm text-muted-foreground">
							<div class="flex items-center gap-4">
								<div class="flex items-center gap-1">
									<Eye class="h-4 w-4" />
									<span>{article.views}</span>
								</div>
								<div class="flex items-center gap-1">
									<ThumbsUp class="h-4 w-4" />
									<span>{article.helpful}</span>
								</div>
							</div>
							<div class="flex items-center gap-1">
								<Calendar class="h-4 w-4" />
								<span>{article.updatedAt.toLocaleDateString()}</span>
							</div>
						</div>

						<!-- Author -->
						<div class="flex items-center gap-2 text-sm text-muted-foreground">
							<User class="h-4 w-4" />
							<span>By {article.author.name}</span>
						</div>
					</Card.Content>
					<Card.Footer class="flex justify-between">
						<Button 
							variant="ghost" 
							size="sm" 
							onclick={() => openEditDialog(article)}
							class="transition-colors duration-200"
						>
							<Edit class="h-4 w-4 mr-2" />
							Edit
						</Button>
						<Button 
							variant="ghost" 
							size="sm" 
							onclick={() => deleteArticle(article.id)}
							class="transition-colors duration-200 hover:text-destructive"
						>
							<Trash2 class="h-4 w-4 mr-2" />
							Delete
						</Button>
					</Card.Footer>
				</Card.Root>
			{/each}
		</div>
	{/if}
</div>



<!-- Edit Article Dialog -->
<Dialog bind:open={showEditDialog}>
	<DialogContent class="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
		<DialogHeader>
			<DialogTitle>Edit Article - {selectedArticle?.title || 'Unknown'}</DialogTitle>
			<DialogDescription>Update the knowledge base article.</DialogDescription>
		</DialogHeader>
		<form
			onsubmit={(e) => {
				e.preventDefault();
				updateArticle();
			}}
			class="space-y-4"
		>
			<div class="space-y-2">
				<Label for="editTitle">Title *</Label>
				<Input
					id="editTitle"
					bind:value={editArticle.title}
					placeholder="Article title"
					required
					class="transition-colors duration-200"
				/>
			</div>
			<div class="space-y-2">
				<Label for="editExcerpt">Excerpt</Label>
				<Input
					id="editExcerpt"
					bind:value={editArticle.excerpt}
					placeholder="Brief description"
					class="transition-colors duration-200"
				/>
			</div>
			<div class="space-y-2">
				<Label for="editContent">Content *</Label>
				<Textarea
					id="editContent"
					bind:value={editArticle.content}
					placeholder="Article content (supports Markdown)"
					rows={8}
					required
					class="transition-colors duration-200 resize-none font-mono text-sm"
				/>
			</div>
			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="editCategory">Category</Label>
					<Select bind:value={editArticle.category}>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="general">General</SelectItem>
							<SelectItem value="getting-started">Getting Started</SelectItem>
							<SelectItem value="troubleshooting">Troubleshooting</SelectItem>
							<SelectItem value="features">Features</SelectItem>
							<SelectItem value="api">API</SelectItem>
							<SelectItem value="authentication">Authentication</SelectItem>
							<SelectItem value="administration">Administration</SelectItem>
							<SelectItem value="faq">FAQ</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div class="space-y-2">
					<Label for="editStatus">Status</Label>
					<Select bind:value={editArticle.status}>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="draft">Draft</SelectItem>
							<SelectItem value="published">Published</SelectItem>
							<SelectItem value="archived">Archived</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>
			<div class="space-y-2">
				<Label for="editTags">Tags</Label>
				<Input
					id="editTags"
					bind:value={editArticle.tags}
					placeholder="Comma-separated tags"
					class="transition-colors duration-200"
				/>
			</div>
			<DialogFooter>
				<Button type="button" variant="outline" onclick={() => (showEditDialog = false)}>
					Cancel
				</Button>
				<Button type="submit" class="transition-colors duration-200">
					<Edit class="mr-2 h-4 w-4" />
					Update Article
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>