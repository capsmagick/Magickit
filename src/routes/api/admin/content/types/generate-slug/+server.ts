import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ContentTypesCollection } from '$lib/db/collections/contentTypes';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { name, excludeId } = await request.json();
		
		if (!name || typeof name !== 'string') {
			return json(
				{
					success: false,
					error: 'Name is required'
				},
				{ status: 400 }
			);
		}

		const slug = await ContentTypesCollection.generateSlug(name, excludeId);

		return json({
			success: true,
			data: { slug }
		});
	} catch (error) {
		console.error('Error generating slug:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Failed to generate slug'
			},
			{ status: 500 }
		);
	}
};