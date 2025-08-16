import { error } from '@sveltejs/kit';
import { BlogPostsCollection } from '$lib/db/collections/blogPosts.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ params }) => {
	try {
		const { slug } = params;

		// Fetch the blog post by slug
		const post = await BlogPostsCollection.findBySlug(slug);

		if (!post) {
			throw error(404, 'Blog post not found');
		}

		// Only show published posts to public users
		if (post.status !== 'published') {
			throw error(404, 'Blog post not found');
		}

		// Fetch related posts (same tags, excluding current post)
		const relatedPosts = await BlogPostsCollection.getPublishedPosts({
			tags: post.tags,
			limit: 3
		});

		// Filter out the current post from related posts
		const filteredRelatedPosts = relatedPosts.posts.filter(
			relatedPost => relatedPost._id.toString() !== post._id.toString()
		);

		return {
			post: {
				...post,
				_id: post._id.toString(),
				author: post.author.toString(),
				createdAt: post.createdAt.toISOString(),
				updatedAt: post.updatedAt.toISOString(),
				publishedAt: post.publishedAt?.toISOString() || null
			},
			relatedPosts: filteredRelatedPosts.slice(0, 3).map(relatedPost => ({
				...relatedPost,
				_id: relatedPost._id.toString(),
				author: relatedPost.author.toString(),
				createdAt: relatedPost.createdAt.toISOString(),
				updatedAt: relatedPost.updatedAt.toISOString(),
				publishedAt: relatedPost.publishedAt?.toISOString() || null
			}))
		};
	} catch (err) {
		console.error('Error loading blog post:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(500, 'Failed to load blog post');
	}
};