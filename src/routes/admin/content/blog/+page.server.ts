import { error } from '@sveltejs/kit';
import { BlogPostsCollection } from '$lib/db/collections/blogPosts.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ url, locals }) => {
	// Check if user is authenticated and has admin role
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	// Check if user has admin role (using Better Auth admin plugin)
	if (locals.user.role !== 'admin') {
		throw error(403, 'Forbidden - Admin access required');
	}

	try {
		// Get query parameters for filtering and pagination
		const page = parseInt(url.searchParams.get('page') || '1');
		const limit = parseInt(url.searchParams.get('limit') || '20');
		const status = url.searchParams.get('status') as 'draft' | 'published' | 'archived' | null;
		const featured = url.searchParams.get('featured') === 'true' ? true : undefined;
		const sortBy = url.searchParams.get('sortBy') as 'createdAt' | 'publishedAt' | 'title' || 'createdAt';
		const sortOrder = url.searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc';

		const skip = (page - 1) * limit;

		// Fetch blog posts
		const result = await BlogPostsCollection.findAll({
			status: status || undefined,
			featured,
			limit,
			skip,
			sortBy,
			sortOrder
		});

		return {
			posts: result.posts.map(post => ({
				...post,
				_id: post._id.toString(),
				author: post.author.toString(),
				createdAt: post.createdAt.toISOString(),
				updatedAt: post.updatedAt.toISOString(),
				publishedAt: post.publishedAt?.toISOString() || null
			})),
			total: result.total,
			pagination: {
				page,
				limit,
				totalPages: Math.ceil(result.total / limit)
			}
		};
	} catch (err) {
		console.error('Error loading blog posts:', err);
		throw error(500, 'Failed to load blog posts');
	}
};