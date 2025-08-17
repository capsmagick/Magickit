import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { contentService } from '$lib/services/content';
import { ObjectId } from 'mongodb';

export const POST: RequestHandler = async ({ params, request }) => {
	try {
		const { id } = params;
		const { publishedBy, publishedAt } = await request.json();
		
		if (!ObjectId.isValid(id)) {
			return json(
				{
					success: false,
					error: 'Invalid content instance ID'
				},
				{ status: 400 }
			);
		}

		if (!publishedBy) {
			return json(
				{
					success: false,
					error: 'Published by user ID is required'
				},
				{ status: 400 }
			);
		}

		const publishDate = publishedAt ? new Date(publishedAt) : undefined;
		const success = await contentService.publishContentInstance(id, publishedBy, publishDate);

		if (!success) {
			return json(
				{
					success: false,
					error: 'Failed to publish content instance'
				},
				{ status: 500 }
			);
		}

		const updatedContent = await contentService.getContentInstanceById(id);

		return json({
			success: true,
			data: updatedContent,
			message: 'Content published successfully'
		});
	} catch (error) {
		console.error('Error publishing content instance:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Failed to publish content instance'
			},
			{ status: 500 }
		);
	}
};