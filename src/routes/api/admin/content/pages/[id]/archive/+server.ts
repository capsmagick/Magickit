import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { contentService } from '$lib/services/content';
import { ObjectId } from 'mongodb';

export const POST: RequestHandler = async ({ params, request }) => {
	try {
		const { id } = params;
		const { archivedBy } = await request.json();
		
		if (!ObjectId.isValid(id)) {
			return json(
				{
					success: false,
					error: 'Invalid content instance ID'
				},
				{ status: 400 }
			);
		}

		if (!archivedBy) {
			return json(
				{
					success: false,
					error: 'Archived by user ID is required'
				},
				{ status: 400 }
			);
		}

		const success = await contentService.archiveContentInstance(id, archivedBy);

		if (!success) {
			return json(
				{
					success: false,
					error: 'Failed to archive content instance'
				},
				{ status: 500 }
			);
		}

		const updatedContent = await contentService.getContentInstanceById(id);

		return json({
			success: true,
			data: updatedContent,
			message: 'Content archived successfully'
		});
	} catch (error) {
		console.error('Error archiving content instance:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Failed to archive content instance'
			},
			{ status: 500 }
		);
	}
};