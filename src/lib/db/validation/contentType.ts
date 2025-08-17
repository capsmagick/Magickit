import { z } from 'zod';
import type { ContentType, ContentField, ValidationRule } from '../models';

// Validation rule schema
export const ValidationRuleSchema = z.object({
	type: z.enum(['minLength', 'maxLength', 'pattern', 'min', 'max', 'required', 'email', 'url']),
	value: z.any(),
	message: z.string().min(1, 'Validation message is required')
});

// Content field schema
export const ContentFieldSchema = z.object({
	name: z.string()
		.min(1, 'Field name is required')
		.max(50, 'Field name must be less than 50 characters')
		.regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Field name must start with a letter and contain only letters, numbers, and underscores')
		.trim(),
	label: z.string()
		.min(1, 'Field label is required')
		.max(100, 'Field label must be less than 100 characters')
		.trim(),
	type: z.enum(['text', 'textarea', 'richtext', 'image', 'video', 'select', 'multiselect', 'boolean', 'date', 'number', 'url', 'email']),
	required: z.boolean().default(false),
	defaultValue: z.any().optional(),
	validation: z.array(ValidationRuleSchema).optional(),
	options: z.array(z.string()).optional(),
	helpText: z.string().max(500, 'Help text must be less than 500 characters').optional(),
	placeholder: z.string().max(100, 'Placeholder must be less than 100 characters').optional(),
	order: z.number().min(0, 'Order must be a positive number').default(0)
});

// Content type creation schema
export const ContentTypeCreateSchema = z.object({
	name: z.string()
		.min(1, 'Content type name is required')
		.max(100, 'Content type name must be less than 100 characters')
		.trim(),
	slug: z.string()
		.min(1, 'Slug is required')
		.max(100, 'Slug must be less than 100 characters')
		.regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
		.trim(),
	description: z.string()
		.max(500, 'Description must be less than 500 characters')
		.optional(),
	fields: z.array(ContentFieldSchema)
		.min(1, 'At least one field is required'),
	template: z.string()
		.max(50, 'Template name must be less than 50 characters')
		.optional(),
	isSystemType: z.boolean().default(false)
});

// Content type update schema
export const ContentTypeUpdateSchema = ContentTypeCreateSchema.partial();

// Content type query schema
export const ContentTypeQuerySchema = z.object({
	page: z.coerce.number().min(1).default(1),
	limit: z.coerce.number().min(1).max(100).default(20),
	search: z.string().max(100).optional(),
	isSystemType: z.boolean().optional()
});

// Type exports
export type ContentTypeCreateData = z.infer<typeof ContentTypeCreateSchema>;
export type ContentTypeUpdateData = z.infer<typeof ContentTypeUpdateSchema>;
export type ContentTypeQuery = z.infer<typeof ContentTypeQuerySchema>;
export type ContentFieldData = z.infer<typeof ContentFieldSchema>;
export type ValidationRuleData = z.infer<typeof ValidationRuleSchema>;

// Validation functions
export function validateContentTypeCreate(data: unknown): ContentTypeCreateData {
	return ContentTypeCreateSchema.parse(data);
}

export function validateContentTypeUpdate(data: unknown): ContentTypeUpdateData {
	return ContentTypeUpdateSchema.parse(data);
}

export function validateContentTypeQuery(data: unknown): ContentTypeQuery {
	return ContentTypeQuerySchema.parse(data);
}

// Safe validation functions
export function safeValidateContentTypeCreate(data: unknown) {
	const result = ContentTypeCreateSchema.safeParse(data);
	return {
		success: result.success,
		data: result.success ? result.data : null,
		errors: result.success ? null : result.error.errors
	};
}

export function safeValidateContentTypeUpdate(data: unknown) {
	const result = ContentTypeUpdateSchema.safeParse(data);
	return {
		success: result.success,
		data: result.success ? result.data : null,
		errors: result.success ? null : result.error.errors
	};
}

export function safeValidateContentTypeQuery(data: unknown) {
	const result = ContentTypeQuerySchema.safeParse(data);
	return {
		success: result.success,
		data: result.success ? result.data : null,
		errors: result.success ? null : result.error.errors
	};
}