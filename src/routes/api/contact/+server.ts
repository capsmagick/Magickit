import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { ContactSubmission } from '$lib/db/models';
import { contactSubmissionsCollection } from '$lib/db/collections/contactSubmissions';
import { sendContactNotification, sendContactConfirmation } from '$lib/server/email';
import { safeValidateContactForm } from '$lib/db/validation/contactSubmission';

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	try {
		const body = await request.json();

		// Validate form data
		const validation = safeValidateContactForm(body);
		if (!validation.success) {
			return json(
				{ 
					error: 'Validation failed',
					details: validation.errors
				},
				{ status: 400 }
			);
		}

		const { name, email, subject, message } = validation.data;

		// Get client information
		const ipAddress = getClientAddress();
		const userAgent = request.headers.get('user-agent') || '';

		// Create contact submission document (validation already trimmed and normalized the data)
		const contactSubmissionData: Omit<ContactSubmission, '_id'> = {
			name,
			email,
			subject,
			message,
			status: 'new',
			submittedAt: new Date(),
			ipAddress,
			userAgent
		};

		// Insert into database using collection utility
		const contactSubmission = await contactSubmissionsCollection.create(contactSubmissionData);

		// Send email notifications
		const emailData = {
			name: contactSubmission.name,
			email: contactSubmission.email,
			subject: contactSubmission.subject,
			message: contactSubmission.message,
			submittedAt: contactSubmission.submittedAt,
			ipAddress: contactSubmission.ipAddress
		};

		// Send notification to admin (don't block the response if this fails)
		sendContactNotification(emailData).catch(error => {
			console.error('Failed to send admin notification:', error);
		});

		// Send confirmation to user (don't block the response if this fails)
		sendContactConfirmation(emailData).catch(error => {
			console.error('Failed to send user confirmation:', error);
		});

		console.log('New contact submission received:', {
			id: contactSubmission._id,
			name,
			email,
			subject
		});

		return json(
			{ 
				success: true, 
				message: 'Thank you for your message! We\'ll get back to you soon.',
				id: contactSubmission._id
			},
			{ status: 201 }
		);

	} catch (error) {
		console.error('Contact form submission error:', error);
		
		return json(
			{ error: 'An unexpected error occurred. Please try again.' },
			{ status: 500 }
		);
	}
};