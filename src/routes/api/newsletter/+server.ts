import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/db/dbClient';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { email } = await request.json();

		// Validate email
		if (!email || typeof email !== 'string') {
			return json({ error: 'Email is required' }, { status: 400 });
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return json({ error: 'Please enter a valid email address' }, { status: 400 });
		}

		const newsletterCollection = db.collection('newsletter_subscriptions');

		// Check if email already exists
		const existingSubscription = await newsletterCollection.findOne({ email });
		if (existingSubscription) {
			return json({ error: 'This email is already subscribed' }, { status: 409 });
		}

		// Add new subscription
		await newsletterCollection.insertOne({
			email,
			subscribedAt: new Date(),
			status: 'active',
			source: 'footer'
		});

		return json({ 
			success: true, 
			message: 'Successfully subscribed to newsletter' 
		});

	} catch (error) {
		console.error('Newsletter subscription error:', error);
		return json({ 
			error: 'Failed to subscribe. Please try again later.' 
		}, { status: 500 });
	}
};