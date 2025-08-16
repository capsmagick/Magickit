import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { contactSubmissionsCollection } from '$lib/db/collections/contactSubmissions';

export const GET: RequestHandler = async ({ request }) => {
	try {
		// TODO: Add proper admin authentication check
		// For now, we'll assume the request is authenticated
		// In production, you would verify the user's admin role here
		
		// Fetch all contact submissions using collection utility
		const submissions = await contactSubmissionsCollection.findAll();

		// Convert ObjectId to string for JSON serialization
		const serializedSubmissions = submissions.map(submission => ({
			...submission,
			_id: submission._id.toString()
		}));

		return json(serializedSubmissions);

	} catch (error) {
		console.error('Failed to fetch contact submissions:', error);
		
		return json(
			{ error: 'Failed to fetch contact submissions' },
			{ status: 500 }
		);
	}
};