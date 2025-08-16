import { json, error } from '@sveltejs/kit';
import { BlogPostsCollection } from '$lib/db/collections/blogPosts.js';
import { ObjectId } from 'mongodb';
import type { RequestHandler } from './$types.js';

// Create new blog post
export const POST: RequestHandler = async ({ request, locals }) => {
	// Check authentication
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	// Check admin role
	if (locals.user.role !== 'admin') {
		throw error(403, 'Forbidden - Admin access required');
	}

	try {
		const postData = await request.json();

		// Validate required fields
		if (!postData.title?.trim()) {
			throw error(400, 'Title is required');
		}
		if (!postData.slug?.trim()) {
			throw error(400, 'Slug is required');
		}
		if (!postData.excerpt?.trim()) {
			throw error(400, 'Excerpt is required');
		}
		if (!postData.content?.trim()) {
			throw error(400, 'Content is required');
		}

		// Create the blog post
		const newPost = await BlogPostsCollection.create({
			title: postData.title.trim(),
			slug: postData.slug.trim(),
			excerpt: postData.excerpt.trim(),
			content: postData.content,
			author: new ObjectId(locals.user.id),
			tags: postData.tags || [],
			featured: postData.featured || false,
			status: postData.status || 'draft',
			seoTitle: postData.seoTitle?.trim() || '',
			seoDescription: postData.seoDescription?.trim() || '',
			publishedAt: postData.status === 'published' && postData.publishedAt 
				? new Date(postData.publishedAt) 
				: postData.status === 'published' 
					? new Date() 
					: undefined
		});

		return json({
			success: true,
			post: {
				...newPost,
				_id: newPost._id.toString(),
				author: newPost.author.toString(),
				createdAt: newPost.createdAt.toISOString(),
				updatedAt: newPost.updatedAt.toISOString(),
				publishedAt: newPost.publishedAt?.toISOString() || null
			}
		});
	} catch (err) {
		console.error('Error creating blog post:', err);
		
		if (err instanceof Error) {
			if (err.message.includes('slug already exists')) {
				throw error(400, 'A post with this slug already exists');
			}
			throw error(500, err.message);
		}
		
		throw error(500, 'Failed to create blog post');
	}
};