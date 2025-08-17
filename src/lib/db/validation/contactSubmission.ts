import { z } from 'zod';
import type { ContactSubmission } from '../models';

// Contact form validation schema
export const ContactFormSchema = z.object({
	name: z.string()
		.min(2, 'Name must be at least 2 characters')
		.max(100, 'Name must be less than 100 characters')
		.trim(),
	email: z.string()
		.email('Please enter a valid email address')
		.max(255, 'Email must be less than 255 characters')
		.toLowerCase(),
	subject: z.string()
		.min(5, 'Subject must be at least 5 characters')
		.max(200, 'Subject must be less than 200 characters')
		.trim(),
	message: z.string()
		.min(10, 'Message must be at least 10 characters')
		.max(2000, 'Message must be less than 2000 characters')
		.trim()
});

// Status update validation schema
export const ContactStatusUpdateSchema = z.object({
	status: z.enum(['new', 'read', 'replied', 'closed'], {
		errorMap: () => ({ message: 'Status must be one of: new, read, replied, closed' })
	})
});

// Admin query parameters schema
export const ContactQuerySchema = z.object({
	status: z.enum(['new', 'read', 'replied', 'closed']).optional(),
	page: z.coerce.number().min(1).default(1),
	limit: z.coerce.number().min(1).max(100).default(20),
	search: z.string().max(100).optional()
});

// Type exports for use in components
export type ContactFormData = z.infer<typeof ContactFormSchema>;
export type ContactStatusUpdate = z.infer<typeof ContactStatusUpdateSchema>;
export type ContactQuery = z.infer<typeof ContactQuerySchema>;

// Validation functions
export function validateContactForm(data: unknown): ContactFormData {
	return ContactFormSchema.parse(data);
}

export function validateStatusUpdate(data: unknown): ContactStatusUpdate {
	return ContactStatusUpdateSchema.parse(data);
}

export function validateContactQuery(data: unknown): ContactQuery {
	return ContactQuerySchema.parse(data);
}

// Safe validation functions that return results instead of throwing
export function safeValidateContactForm(data: unknown) {
	const result = ContactFormSchema.safeParse(data);
	return {
		success: result.success,
		data: result.success ? result.data : null,
		errors: result.success ? null : result.error.errors
	};
}

export function safeValidateStatusUpdate(data: unknown) {
	const result = ContactStatusUpdateSchema.safeParse(data);
	return {
		success: result.success,
		data: result.success ? result.data : null,
		errors: result.success ? null : result.error.errors
	};
}