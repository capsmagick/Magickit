import { describe, it, expect } from 'vitest';
import type { ContentInstance, ContentType } from '$lib/db/models';

describe('DynamicContentRenderer', () => {
	const mockContentType: ContentType = {
		_id: '1',
		name: 'Test Content Type',
		slug: 'test-content-type',
		fields: [
			{
				_id: '1',
				name: 'title',
				label: 'Title',
				type: 'text',
				required: true,
				order: 0
			},
			{
				_id: '2',
				name: 'description',
				label: 'Description',
				type: 'textarea',
				required: false,
				order: 1
			},
			{
				_id: '3',
				name: 'featured',
				label: 'Featured',
				type: 'boolean',
				required: false,
				order: 2
			}
		],
		isSystemType: false,
		createdAt: new Date(),
		updatedAt: new Date()
	};

	const mockContentInstance: ContentInstance = {
		_id: '1',
		contentTypeId: '1',
		slug: 'test-content',
		title: 'Test Content',
		data: {
			title: 'Sample Title',
			description: 'This is a sample description with multiple lines.\n\nSecond paragraph here.',
			featured: true
		},
		status: 'published',
		publishedAt: new Date('2024-01-01'),
		author: 'user1',
		lastModifiedBy: 'user1',
		version: 1,
		seo: {
			title: 'Test Content',
			description: 'Sample content for testing'
		},
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-01')
	};

	it('should have valid content type structure', () => {
		expect(mockContentType).toBeDefined();
		expect(mockContentType.fields).toHaveLength(3);
		expect(mockContentType.fields[0].type).toBe('text');
		expect(mockContentType.fields[1].type).toBe('textarea');
		expect(mockContentType.fields[2].type).toBe('boolean');
	});

	it('should have valid content instance structure', () => {
		expect(mockContentInstance).toBeDefined();
		expect(mockContentInstance.data).toBeDefined();
		expect(mockContentInstance.data.title).toBe('Sample Title');
		expect(mockContentInstance.data.featured).toBe(true);
		expect(mockContentInstance.status).toBe('published');
	});

	it('should validate field types', () => {
		const textField = mockContentType.fields.find(f => f.type === 'text');
		const textareaField = mockContentType.fields.find(f => f.type === 'textarea');
		const booleanField = mockContentType.fields.find(f => f.type === 'boolean');

		expect(textField).toBeDefined();
		expect(textareaField).toBeDefined();
		expect(booleanField).toBeDefined();

		expect(textField?.required).toBe(true);
		expect(textareaField?.required).toBe(false);
		expect(booleanField?.required).toBe(false);
	});

	it('should have proper field ordering', () => {
		const sortedFields = [...mockContentType.fields].sort((a, b) => (a.order || 0) - (b.order || 0));
		
		expect(sortedFields[0].name).toBe('title');
		expect(sortedFields[1].name).toBe('description');
		expect(sortedFields[2].name).toBe('featured');
	});
});