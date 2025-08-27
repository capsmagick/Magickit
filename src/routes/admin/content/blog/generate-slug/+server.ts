import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { title } = await request.json();
		
		if (!title || typeof title !== 'string') {
			return json({ error: 'Title is required' }, { status: 400 });
		}

		// Generate slug from title
		const slug = title
			.toLowerCase()
			.trim()
			.replace(/[^\w\s-]/g, '') // Remove special characters
			.replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
			.replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

		return json({ slug });
	} catch (error) {
		console.error('Error generating slug:', error);
		return json({ error: 'Failed to generate slug' }, { status: 500 });
	}
};