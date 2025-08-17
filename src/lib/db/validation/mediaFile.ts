import { z } from 'zod';
import type { MediaFile, MediaFolder, MediaVariant, MediaMetadata } from '../models';

// Media metadata schema
export const MediaMetadataSchema = z.object({
	exif: z.record(z.any()).optional(),
	colorProfile: z.string().optional(),
	hasTransparency: z.boolean().optional(),
	averageColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Average color must be a valid hex color').optional(),
	dominantColors: z.array(z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a valid hex color')).optional(),
	faces: z.number().min(0).optional(),
	objects: z.array(z.string().max(50, 'Object label must be less than 50 characters')).optional(),
	text: z.string().max(5000, 'Extracted text must be less than 5000 characters').optional()
});

// Media variant schema
export const MediaVariantSchema = z.object({
	name: z.string()
		.min(1, 'Variant name is required')
		.max(50, 'Variant name must be less than 50 characters')
		.regex(/^[a-zA-Z0-9_-]+$/, 'Variant name must contain only letters, numbers, underscores, and hyphens'),
	width: z.number().min(1, 'Width must be greater than 0'),
	height: z.number().min(1, 'Height must be greater than 0'),
	format: z.string()
		.min(1, 'Format is required')
		.max(10, 'Format must be less than 10 characters'),
	quality: z.number().min(1).max(100).optional(),
	s3Key: z.string().min(1, 'S3 key is required'),
	s3Url: z.string().url('S3 URL must be a valid URL'),
	cdnUrl: z.string().url('CDN URL must be a valid URL').optional(),
	size: z.number().min(1, 'Size must be greater than 0')
});

// Media file creation schema
export const MediaFileCreateSchema = z.object({
	filename: z.string()
		.min(1, 'Filename is required')
		.max(255, 'Filename must be less than 255 characters')
		.regex(/^[a-zA-Z0-9._-]+$/, 'Filename must contain only letters, numbers, dots, underscores, and hyphens'),
	originalName: z.string()
		.min(1, 'Original name is required')
		.max(255, 'Original name must be less than 255 characters'),
	mimeType: z.string()
		.min(1, 'MIME type is required')
		.regex(/^[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^_]*\/[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^_.]*$/, 'Invalid MIME type format'),
	size: z.number().min(1, 'Size must be greater than 0'),
	width: z.number().min(1).optional(),
	height: z.number().min(1).optional(),
	duration: z.number().min(0).optional(),
	folderId: z.string()
		.regex(/^[0-9a-fA-F]{24}$/, 'Folder ID must be a valid ObjectId')
		.optional(),
	s3Key: z.string().min(1, 'S3 key is required'),
	s3Url: z.string().url('S3 URL must be a valid URL'),
	cdnUrl: z.string().url('CDN URL must be a valid URL').optional(),
	variants: z.array(MediaVariantSchema).default([]),
	metadata: MediaMetadataSchema.default({}),
	tags: z.array(z.string().max(50, 'Tag must be less than 50 characters')).default([]),
	altText: z.string()
		.max(255, 'Alt text must be less than 255 characters')
		.optional(),
	caption: z.string()
		.max(500, 'Caption must be less than 500 characters')
		.optional(),
	uploadedBy: z.string()
		.regex(/^[0-9a-fA-F]{24}$/, 'Uploaded by ID must be a valid ObjectId')
});

// Media file update schema
export const MediaFileUpdateSchema = z.object({
	folderId: z.string()
		.regex(/^[0-9a-fA-F]{24}$/, 'Folder ID must be a valid ObjectId')
		.nullable()
		.optional(),
	tags: z.array(z.string().max(50, 'Tag must be less than 50 characters')).optional(),
	altText: z.string()
		.max(255, 'Alt text must be less than 255 characters')
		.optional(),
	caption: z.string()
		.max(500, 'Caption must be less than 500 characters')
		.optional()
});

// Media folder creation schema
export const MediaFolderCreateSchema = z.object({
	name: z.string()
		.min(1, 'Folder name is required')
		.max(100, 'Folder name must be less than 100 characters')
		.regex(/^[a-zA-Z0-9\s._-]+$/, 'Folder name must contain only letters, numbers, spaces, dots, underscores, and hyphens')
		.trim(),
	parentId: z.string()
		.regex(/^[0-9a-fA-F]{24}$/, 'Parent ID must be a valid ObjectId')
		.optional(),
	description: z.string()
		.max(500, 'Description must be less than 500 characters')
		.optional(),
	createdBy: z.string()
		.regex(/^[0-9a-fA-F]{24}$/, 'Created by ID must be a valid ObjectId')
});

// Media folder update schema
export const MediaFolderUpdateSchema = z.object({
	name: z.string()
		.min(1, 'Folder name is required')
		.max(100, 'Folder name must be less than 100 characters')
		.regex(/^[a-zA-Z0-9\s._-]+$/, 'Folder name must contain only letters, numbers, spaces, dots, underscores, and hyphens')
		.trim()
		.optional(),
	parentId: z.string()
		.regex(/^[0-9a-fA-F]{24}$/, 'Parent ID must be a valid ObjectId')
		.nullable()
		.optional(),
	description: z.string()
		.max(500, 'Description must be less than 500 characters')
		.optional()
});

// Media query schema
export const MediaQuerySchema = z.object({
	folderId: z.string()
		.regex(/^[0-9a-fA-F]{24}$/, 'Folder ID must be a valid ObjectId')
		.optional(),
	mimeType: z.string().optional(),
	tags: z.array(z.string()).optional(),
	page: z.coerce.number().min(1).default(1),
	limit: z.coerce.number().min(1).max(100).default(20),
	search: z.string().max(100).optional(),
	sortBy: z.enum(['filename', 'createdAt', 'updatedAt', 'size']).default('createdAt'),
	sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// File upload validation schema
export const FileUploadSchema = z.object({
	file: z.instanceof(File, { message: 'File is required' }),
	folderId: z.string()
		.regex(/^[0-9a-fA-F]{24}$/, 'Folder ID must be a valid ObjectId')
		.optional(),
	altText: z.string()
		.max(255, 'Alt text must be less than 255 characters')
		.optional(),
	caption: z.string()
		.max(500, 'Caption must be less than 500 characters')
		.optional(),
	tags: z.array(z.string().max(50, 'Tag must be less than 50 characters')).default([])
}).refine(
	(data) => {
		// Validate file size (10MB max)
		const maxSize = 10 * 1024 * 1024; // 10MB
		return data.file.size <= maxSize;
	},
	{
		message: 'File size must be less than 10MB',
		path: ['file']
	}
).refine(
	(data) => {
		// Validate file type
		const allowedTypes = [
			'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
			'video/mp4', 'video/webm', 'video/ogg',
			'audio/mp3', 'audio/wav', 'audio/ogg',
			'application/pdf'
		];
		return allowedTypes.includes(data.file.type);
	},
	{
		message: 'File type not supported',
		path: ['file']
	}
);

// Type exports
export type MediaFileCreateData = z.infer<typeof MediaFileCreateSchema>;
export type MediaFileUpdateData = z.infer<typeof MediaFileUpdateSchema>;
export type MediaFolderCreateData = z.infer<typeof MediaFolderCreateSchema>;
export type MediaFolderUpdateData = z.infer<typeof MediaFolderUpdateSchema>;
export type MediaQuery = z.infer<typeof MediaQuerySchema>;
export type FileUploadData = z.infer<typeof FileUploadSchema>;
export type MediaVariantData = z.infer<typeof MediaVariantSchema>;
export type MediaMetadataData = z.infer<typeof MediaMetadataSchema>;

// Validation functions
export function validateMediaFileCreate(data: unknown): MediaFileCreateData {
	return MediaFileCreateSchema.parse(data);
}

export function validateMediaFileUpdate(data: unknown): MediaFileUpdateData {
	return MediaFileUpdateSchema.parse(data);
}

export function validateMediaFolderCreate(data: unknown): MediaFolderCreateData {
	return MediaFolderCreateSchema.parse(data);
}

export function validateMediaFolderUpdate(data: unknown): MediaFolderUpdateData {
	return MediaFolderUpdateSchema.parse(data);
}

export function validateMediaQuery(data: unknown): MediaQuery {
	return MediaQuerySchema.parse(data);
}

export function validateFileUpload(data: unknown): FileUploadData {
	return FileUploadSchema.parse(data);
}

// Safe validation functions
export function safeValidateMediaFileCreate(data: unknown) {
	const result = MediaFileCreateSchema.safeParse(data);
	return {
		success: result.success,
		data: result.success ? result.data : null,
		errors: result.success ? null : result.error.errors
	};
}

export function safeValidateMediaFileUpdate(data: unknown) {
	const result = MediaFileUpdateSchema.safeParse(data);
	return {
		success: result.success,
		data: result.success ? result.data : null,
		errors: result.success ? null : result.error.errors
	};
}

export function safeValidateMediaFolderCreate(data: unknown) {
	const result = MediaFolderCreateSchema.safeParse(data);
	return {
		success: result.success,
		data: result.success ? result.data : null,
		errors: result.success ? null : result.error.errors
	};
}

export function safeValidateMediaFolderUpdate(data: unknown) {
	const result = MediaFolderUpdateSchema.safeParse(data);
	return {
		success: result.success,
		data: result.success ? result.data : null,
		errors: result.success ? null : result.error.errors
	};
}

export function safeValidateMediaQuery(data: unknown) {
	const result = MediaQuerySchema.safeParse(data);
	return {
		success: result.success,
		data: result.success ? result.data : null,
		errors: result.success ? null : result.error.errors
	};
}

export function safeValidateFileUpload(data: unknown) {
	const result = FileUploadSchema.safeParse(data);
	return {
		success: result.success,
		data: result.success ? result.data : null,
		errors: result.success ? null : result.error.errors
	};
}