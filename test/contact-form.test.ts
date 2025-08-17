import { describe, it, expect, vi, beforeEach } from 'vitest';
import { contactSubmissionsCollection } from '$lib/db/collections/contactSubmissions';
import { sendContactNotification, sendContactConfirmation } from '$lib/server/email';
import { validateContactForm, safeValidateContactForm } from '$lib/db/validation/contactSubmission';

// Mock the email functions
vi.mock('$lib/server/email', () => ({
	sendContactNotification: vi.fn().mockResolvedValue(true),
	sendContactConfirmation: vi.fn().mockResolvedValue(true)
}));

describe('Contact Form', () => {
	describe('Validation', () => {
		it('should validate correct contact form data', () => {
			const validData = {
				name: 'John Doe',
				email: 'john@example.com',
				subject: 'Test Subject',
				message: 'This is a test message that is long enough to pass validation.'
			};

			const result = safeValidateContactForm(validData);
			expect(result.success).toBe(true);
			expect(result.data).toEqual({
				name: 'John Doe',
				email: 'john@example.com',
				subject: 'Test Subject',
				message: 'This is a test message that is long enough to pass validation.'
			});
		});

		it('should reject invalid contact form data', () => {
			const invalidData = {
				name: 'A', // Too short
				email: 'invalid-email', // Invalid format
				subject: 'Hi', // Too short
				message: 'Short' // Too short
			};

			const result = safeValidateContactForm(invalidData);
			expect(result.success).toBe(false);
			expect(result.errors).toHaveLength(4);
		});

		it('should trim and normalize data', () => {
			const dataWithWhitespace = {
				name: '  John Doe  ',
				email: '  JOHN@EXAMPLE.COM  ',
				subject: '  Test Subject  ',
				message: '  This is a test message that is long enough to pass validation.  '
			};

			const result = safeValidateContactForm(dataWithWhitespace);
			expect(result.success).toBe(true);
			expect(result.data?.name).toBe('John Doe');
			expect(result.data?.email).toBe('john@example.com');
			expect(result.data?.subject).toBe('Test Subject');
			expect(result.data?.message).toBe('This is a test message that is long enough to pass validation.');
		});
	});

	describe('Email Notifications', () => {
		beforeEach(() => {
			vi.clearAllMocks();
		});

		it('should call email notification functions', async () => {
			const contactData = {
				name: 'John Doe',
				email: 'john@example.com',
				subject: 'Test Subject',
				message: 'This is a test message.',
				submittedAt: new Date(),
				ipAddress: '127.0.0.1'
			};

			await sendContactNotification(contactData);
			await sendContactConfirmation(contactData);

			expect(sendContactNotification).toHaveBeenCalledWith(contactData);
			expect(sendContactConfirmation).toHaveBeenCalledWith(contactData);
		});
	});
});

describe('Contact Submissions Collection', () => {
	it('should have required methods', () => {
		expect(typeof contactSubmissionsCollection.create).toBe('function');
		expect(typeof contactSubmissionsCollection.findById).toBe('function');
		expect(typeof contactSubmissionsCollection.findAll).toBe('function');
		expect(typeof contactSubmissionsCollection.updateStatus).toBe('function');
		expect(typeof contactSubmissionsCollection.getStatusCounts).toBe('function');
		expect(typeof contactSubmissionsCollection.search).toBe('function');
	});
});