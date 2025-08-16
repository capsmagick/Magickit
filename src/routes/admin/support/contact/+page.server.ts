import type { PageServerLoad } from './$types';
import { contactSubmissionsCollection } from '$lib/db/collections/contactSubmissions';

export const load: PageServerLoad = async () => {
	try {
		// Fetch all contact submissions using collection utility
		const submissions = await contactSubmissionsCollection.findAll();

		// Convert ObjectId to string for JSON serialization
		const serializedSubmissions = submissions.map(submission => ({
			...submission,
			_id: submission._id.toString(),
			submittedAt: submission.submittedAt.toISOString(),
			respondedAt: submission.respondedAt?.toISOString()
		}));

		return {
			submissions: serializedSubmissions
		};
	} catch (error) {
		console.error('Failed to load contact submissions:', error);
		return {
			submissions: []
		};
	}
};