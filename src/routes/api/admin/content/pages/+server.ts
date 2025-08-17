import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { contentService } from '$lib/services/content';
import { ObjectId } from 'mongodb';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const searchParams = url.searchParams;
		const contentTypeId = searchParams.get('contentTypeId');
		const status = searchParams.get('status') as 'draft' | 'published' | 'archived' | undefined;
		const author = searchParams.get('author');
		const search = searchParams.get('search');
		const limit = parseInt(searchParams.get('limit') || '20');
		const skip = parseInt(searchParams.get('skip') || '0');
		const sortBy = searchParams.get('sortBy') as 'createdAt' | 'updatedAt' | 'publishedAt' | 'title' || 'updatedAt';
		const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc';

		const filters: any = {};
		if (contentTypeId) filters.contentTypeId = contentTypeId;
		if (status) filters.status = status;
		if (author) filters.author = author;
		if (search) filters.search = search;

		const options = { limit, skip, sortBy, sortOrder };
		const result = await contentService.getContentInstances(filters, options);

		return json({
			success: true,
			data: result.instances,
			total: result.total,
			pagination: {
				limit,
				skip,
				total: result.total,
				pages: Math.ceil(result.total / limit)
			}
		});
	} catch (error) {
		console.error('Error fetching content instances:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Failed to fetch content instances'
			},
			{ status: 500 }
		);
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = await request.json();
		
		// Validate required fields
		if (!data.contentTypeId || !data.title || !data.slug) {
			return json(
				{
					success: false,
					error: 'Content type ID, title, and slug are required'
				},
				{ status: 400 }
			);
		}

		// Validate ObjectId format
		if (!ObjectId.isValid(data.contentTypeId)) {
			return json(
				{
					success: false,
					error: 'Invalid content type ID'
				},
				{ status: 400 }
			);
		}

		// Set default values
		const contentData = {
			contentTypeId: new ObjectId(data.contentTypeId),
			title: data.title,
			slug: data.slug,
			data: data.data || {},
			status: data.status || 'draft',
			author: new ObjectId(data.author), // Should come from session
			lastModifiedBy: new ObjectId(data.author),
			seo: data.seo || {}
		};

		const contentId = await contentService.createContentInstance(contentData, data.author);

		if (!contentId) {
			return json(
				{
					success: false,
					error: 'Failed to create content instance'
				},
				{ status: 500 }
			);
		}

		const createdContent = await contentService.getContentInstanceById(contentId.toString());

		return json({
			success: true,
			data: createdContent
		});
	} catch (error) {
		console.error('Error creating content instance:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Failed to create content instance'
			},
			{ status: 500 }
		);
	}
};