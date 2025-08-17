import { z } from 'zod';
import type { ContentInstance } from '../models';

// SEO schema for content instances
export const SEOSchema = z.object({
	title: z.string()
		.max(60, 'SEO title should be less than 60 characters for optimal display')
		.optional(),
	description: z.string()
		.max(160, 'SEO description should be less than 160 characters for optimal display')
		.optional(),
	keywords: z.array(z.string().max(50, 'Keyword must be less than 50 characters'))
		.max(10, 'Maximum 10 keywords allowed')
		.optional(),
	ogImage: z.string().url('Open Graph image must be a valid URL').optional(),
	noIndex: z.boolean().default(false)
});

// Content instance creation schema
export const ContentInstanceCreateSchema = z.object({
	contentTypeId: z.string()
		.min(1, 'Content type ID is required')
		.regex(/^[0-9a-fA-F]{24}$/, 'Content type ID must be a valid ObjectId'),
	slug: z.string()
		.min(1, 'Slug is required')
		.max(200, 'Slug must be less than 200 characters')
		.regex(/^[a-z0-9-\/]+$/, 'Slug must contain only lowercase letters, numbers, hyphens, and forward slashes')
		.trim(),
	title: z.string()
		.min(1, 'Title is required')
		.max(200, 'Title must be less than 200 characters')
		.trim(),
	data: z.record(z.any()), // Dynamic field data - validated against content type
	status: z.enum(['draft', 'published', 'archived', 'scheduled']).default('draft'),
	publishedAt: z.date().optional(),
	scheduledAt: z.date().optional(),
	author: z.string()
		.regex(/^[0-9a-fA-F]{24}$/, 'Author ID must be a valid ObjectId'),
	version: z.number().min(1).default(1),
	seo: SEOSchema.default({})
});

// Content instance update schema
export const ContentInstanceUpdateSchema = ContentInstanceCreateSchema.partial().extend({
	lastModifiedBy: z.string()
		.regex(/^[0-9a-fA-F]{24}$/, 'Last modified by ID must be a valid ObjectId')
		.optional()
});

// Content publishing schema
export const ContentPublishSchema = z.object({
	publishedAt: z.date().optional(),
	scheduledAt: z.date().optional()
}).refine(
	(data) => {
		// If scheduling, scheduledAt must be in the future
		if (data.scheduledAt && data.scheduledAt <= new Date()) {
			return false;
		}
		return true;
	},
	{
		message: 'Scheduled date must be in the future',
		path: ['scheduledAt']
	}
);

// Content query schema
export const ContentInstanceQuerySchema = z.object({
	contentTypeId: z.string()
		.regex(/^[0-9a-fA-F]{24}$/, 'Content type ID must be a valid ObjectId')
		.optional(),
	status: z.enum(['draft', 'published', 'archived', 'scheduled']).optional(),
	author: z.string()
		.regex(/^[0-9a-fA-F]{24}$/, 'Author ID must be a valid ObjectId')
		.optional(),
	page: z.coerce.number().min(1).default(1),
	limit: z.coerce.number().min(1).max(100).default(20),
	search: z.string().max(100).optional(),
	sortBy: z.enum(['title', 'createdAt', 'updatedAt', 'publishedAt']).default('updatedAt'),
	sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// Content version schema
export const ContentVersionCreateSchema = z.object({
	contentInstanceId: z.string()
		.regex(/^[0-9a-fA-F]{24}$/, 'Content instance ID must be a valid ObjectId'),
	version: z.number().min(1),
	data: z.record(z.any()),
	author: z.string()
		.regex(/^[0-9a-fA-F]{24}$/, 'Author ID must be a valid ObjectId'),
	changeNote: z.string()
		.max(500, 'Change note must be less than 500 characters')
		.optional()
});

// Type exports
export type ContentInstanceCreateData = z.infer<typeof ContentInstanceCreateSchema>;
export type ContentInstanceUpdateData = z.infer<typeof ContentInstanceUpdateSchema>;
export type ContentPublishData = z.infer<typeof ContentPublishSchema>;
export type ContentInstanceQuery = z.infer<typeof ContentInstanceQuerySchema>;
export type ContentVersionCreateData = z.infer<typeof ContentVersionCreateSchema>;
export type SEOData = z.infer<typeof SEOSchema>;

// Validation functions
export function validateContentInstanceCreate(data: unknown): ContentInstanceCreateData {
	return ContentInstanceCreateSchema.parse(data);
}

export function validateContentInstanceUpdate(data: unknown): ContentInstanceUpdateData {
	return ContentInstanceUpdateSchema.parse(data);
}

export function validateContentPublish(data: unknown): ContentPublishData {
	return ContentPublishSchema.parse(data);
}

export function validateContentInstanceQuery(data: unknown): ContentInstanceQuery {
	return ContentInstanceQuerySchema.parse(data);
}

export function validateContentVersionCreate(data: unknown): ContentVersionCreateData {
	return ContentVersionCreateSchema.parse(data);
}

// Safe validation functions
export function safeValidateContentInstanceCreate(data: unknown) {
	const result = ContentInstanceCreateSchema.safeParse(data);
	return {
		success: result.success,
		data: result.success ? result.data : null,
		errors: result.success ? null : result.error.errors
	};
}

export function safeValidateContentInstanceUpdate(data: unknown) {
	const result = ContentInstanceUpdateSchema.safeParse(data);
	return {
		success: result.success,
		data: result.success ? result.data : null,
		errors: result.success ? null : result.error.errors
	};
}

export function safeValidateContentPublish(data: unknown) {
	const result = ContentPublishSchema.safeParse(data);
	return {
		success: result.success,
		data: result.success ? result.data : null,
		errors: result.success ? null : result.error.errors
	};
}

export function safeValidateContentInstanceQuery(data: unknown) {
	const result = ContentInstanceQuerySchema.safeParse(data);
	return {
		success: result.success,
		data: result.success ? result.data : null,
		errors: result.success ? null : result.error.errors
	};
}