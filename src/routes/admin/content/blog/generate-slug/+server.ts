import { json, error } from '@sveltejs/kit';
import { BlogPostsCollection } from '$lib/db/collections/blogPosts.js';
import { ObjectId } from 'mongodb';
import type { RequestHandler } from './$types.js';

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
		const { title, excludeId } = await request.json();

		if (!title?.trim()) {
			throw error(400, 'Title is required');
		}

		const slug = await BlogPostsCollection.generateSlug(
			title.trim(), 
			excludeId ? new ObjectId(excludeId) : undefined
		);

		return json({ slug });
	} catch (err) {
		console.error('Error generating slug:', err);
		throw error(500, 'Failed to generate slug');
	}
};