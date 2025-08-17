import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ContentTypesCollection } from '$lib/db/collections/contentTypes';
import { ObjectId } from 'mongodb';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const searchParams = url.searchParams;
		const search = searchParams.get('search');
		const limit = parseInt(searchParams.get('limit') || '20');
		const skip = parseInt(searchParams.get('skip') || '0');
		const sortBy = searchParams.get('sortBy') as 'name' | 'createdAt' | 'updatedAt' || 'createdAt';
		const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc';
		const isSystemType = searchParams.get('isSystemType');

		let result;
		if (search) {
			result = await ContentTypesCollection.search(search, { limit, skip });
		} else {
			const options: any = { limit, skip, sortBy, sortOrder };
			if (isSystemType !== null) {
				options.isSystemType = isSystemType === 'true';
			}
			result = await ContentTypesCollection.findAll(options);
		}

		return json({
			success: true,
			data: result.contentTypes,
			total: result.total,
			pagination: {
				limit,
				skip,
				total: result.total,
				pages: Math.ceil(result.total / limit)
			}
		});
	} catch (error) {
		console.error('Error fetching content types:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Failed to fetch content types'
			},
			{ status: 500 }
		);
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = await request.json();
		
		// Validate required fields
		if (!data.name || !data.slug) {
			return json(
				{
					success: false,
					error: 'Name and slug are required'
				},
				{ status: 400 }
			);
		}

		// Ensure fields have proper structure
		if (!Array.isArray(data.fields)) {
			data.fields = [];
		}

		// Set default values
		const contentTypeData = {
			name: data.name,
			slug: data.slug,
			description: data.description || '',
			fields: data.fields,
			template: data.template || '',
			isSystemType: false
		};

		const contentType = await ContentTypesCollection.create(contentTypeData);

		return json({
			success: true,
			data: contentType
		});
	} catch (error) {
		console.error('Error creating content type:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Failed to create content type'
			},
			{ status: 500 }
		);
	}
};