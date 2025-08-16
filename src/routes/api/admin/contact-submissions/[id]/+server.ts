import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { ContactSubmission } from '$lib/db/models';
import { contactSubmissionsCollection } from '$lib/db/collections/contactSubmissions';
import { safeValidateStatusUpdate } from '$lib/db/validation/contactSubmission';
import { ObjectId } from 'mongodb';

export const PATCH: RequestHandler = async ({ params, request }) => {
	try {
		const { id } = params;
		const body = await request.json();

		// Validate the submission ID
		if (!ObjectId.isValid(id)) {
			return json(
				{ error: 'Invalid submission ID' },
				{ status: 400 }
			);
		}

		// Validate the status update data
		const validation = safeValidateStatusUpdate(body);
		if (!validation.success) {
			return json(
				{ 
					error: 'Validation failed',
					details: validation.errors
				},
				{ status: 400 }
			);
		}

		const { status } = validation.data;

		// TODO: Add proper admin authentication check
		// For now, we'll assume the request is authenticated
		// In production, you would verify the user's admin role here

		// Update the submission status using collection utility
		const updatedSubmission = await contactSubmissionsCollection.updateStatus(id, status);

		if (!updatedSubmission) {
			return json(
				{ error: 'Submission not found' },
				{ status: 404 }
			);
		}

		return json({ success: true });

	} catch (error) {
		console.error('Failed to update contact submission:', error);
		
		return json(
			{ error: 'Failed to update contact submission' },
			{ status: 500 }
		);
	}
};