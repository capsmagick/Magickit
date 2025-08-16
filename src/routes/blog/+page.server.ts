import { error } from '@sveltejs/kit';
import { BlogPostsCollection } from '$lib/db/collections/blogPosts.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ url }) => {
	try {
		// Get query parameters
		const page = parseInt(url.searchParams.get('page') || '1');
		const limit = parseInt(url.searchParams.get('limit') || '12');
		const tag = url.searchParams.get('tag');

		const skip = (page - 1) * limit;

		// Fetch published posts
		const result = await BlogPostsCollection.getPublishedPosts({
			limit,
			skip,
			tags: tag ? [tag] : undefined
		});

		// Fetch featured posts separately
		const featuredResult = await BlogPostsCollection.getPublishedPosts({
			featured: true,
			limit: 3
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
			featuredPosts: featuredResult.posts.map(post => ({
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