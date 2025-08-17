import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ContentTypesCollection } from '$lib/db/collections/contentTypes';
import { ObjectId } from 'mongodb';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const { id } = params;
		
		if (!ObjectId.isValid(id)) {
			return json(
				{
					success: false,
					error: 'Invalid content type ID'
				},
				{ status: 400 }
			);
		}

		const contentType = await ContentTypesCollection.findById(id);
		
		if (!contentType) {
			return json(
				{
					success: false,
					error: 'Content type not found'
				},
				{ status: 404 }
			);
		}

		return json({
			success: true,
			data: contentType
		});
	} catch (error) {
		console.error('Error fetching content type:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Failed to fetch content type'
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
					error: 'Invalid content type ID'
				},
				{ status: 400 }
			);
		}

		// Validate required fields if provided
		if (data.name !== undefined && !data.name) {
			return json(
				{
					success: false,
					error: 'Name is required'
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

		// Ensure fields is an array if provided
		if (data.fields !== undefined && !Array.isArray(data.fields)) {
			data.fields = [];
		}

		const updatedContentType = await ContentTypesCollection.update(id, data);

		return json({
			success: true,
			data: updatedContentType
		});
	} catch (error) {
		console.error('Error updating content type:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Failed to update content type'
			},
			{ status: 500 }
		);
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const { id } = params;
		
		if (!ObjectId.isValid(id)) {
			return json(
				{
					success: false,
					error: 'Invalid content type ID'
				},
				{ status: 400 }
			);
		}

		await ContentTypesCollection.delete(id);

		return json({
			success: true,
			message: 'Content type deleted successfully'
		});
	} catch (error) {
		console.error('Error deleting content type:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Failed to delete content type'
			},
			{ status: 500 }
		);
	}
};