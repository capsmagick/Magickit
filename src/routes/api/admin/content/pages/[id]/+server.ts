import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { contentService } from '$lib/services/content';
import { ObjectId } from 'mongodb';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const { id } = params;
		
		if (!ObjectId.isValid(id)) {
			return json(
				{
					success: false,
					error: 'Invalid content instance ID'
				},
				{ status: 400 }
			);
		}

		const contentInstance = await contentService.getContentInstanceById(id);
		
		if (!contentInstance) {
			return json(
				{
					success: false,
					error: 'Content instance not found'
				},
				{ status: 404 }
			);
		}

		return json({
			success: true,
			data: contentInstance
		});
	} catch (error) {
		console.error('Error fetching content instance:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Failed to fetch content instance'
			},
			{ status: 500 }
		);
	}
};

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const { id } = params;
		const data = await request.json();
		
		if (!ObjectId.isValid(id)) {
			return json(
				{
					success: false,
					error: 'Invalid content instance ID'
				},
				{ status: 400 }
			);
		}

		// Validate required fields if provided
		if (data.title !== undefined && !data.title) {
			return json(
				{
					success: false,
					error: 'Title is required'
				},
				{ status: 400 }
			);
		}

		if (data.slug !== undefined && !data.slug) {
			return json(
				{
					success: false,
					error: 'Slug is required'
				},
				{ status: 400 }
			);
		}

		const success = await contentService.updateContentInstance(
			id, 
			data, 
			data.updatedBy || data.author, 
			data.changeNote
		);

		if (!success) {
			return json(
				{
					success: false,
					error: 'Failed to update content instance'
				},
				{ status: 500 }
			);
		}

		const updatedContent = await contentService.getContentInstanceById(id);

		return json({
			success: true,
			data: updatedContent
		});
	} catch (error) {
		console.error('Error updating content instance:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Failed to update content instance'
			},
			{ status: 500 }
		);
	}
};

export const DELETE: RequestHandler = async ({ params, request }) => {
	try {
		const { id } = params;
		const { deletedBy } = await request.json();
		
		if (!ObjectId.isValid(id)) {
			return json(
				{
					success: false,
					error: 'Invalid content instance ID'
				},
				{ status: 400 }
			);
		}

		const success = await contentService.deleteContentInstance(id, deletedBy);

		if (!success) {
			return json(
				{
					success: false,
					error: 'Failed to delete content instance'
				},
				{ status: 500 }
			);
		}

		return json({
			success: true,
			message: 'Content instance deleted successfully'
		});
	} catch (error) {
		console.error('Error deleting content instance:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Failed to delete content instance'
			},
			{ status: 500 }
		);
	}
};