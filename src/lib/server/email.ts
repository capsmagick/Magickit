/**
 * Email service for sending notifications
 * This is a basic implementation that can be extended with actual email providers
 * like SendGrid, Resend, Nodemailer, etc.
 */

export interface EmailOptions {
	to: string;
	subject: string;
	html: string;
	text?: string;
}

export interface ContactNotificationData {
	name: string;
	email: string;
	subject: string;
	message: string;
	submittedAt: Date;
	ipAddress: string;
}

/**
 * Send email notification
 * TODO: Implement with actual email service provider
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
	try {
		// For now, just log the email that would be sent
		// In production, this would integrate with an email service
		console.log('📧 Email would be sent:', {
			to: options.to,
			subject: options.subject,
			timestamp: new Date().toISOString()
		});
		
		// Simulate email sending delay
		await new Promise(resolve => setTimeout(resolve, 100));
		
		return true;
	} catch (error) {
		console.error('Failed to send email:', error);
		return false;
	}
}

/**
 * Send contact form notification to admin
 */
export async function sendContactNotification(data: ContactNotificationData): Promise<boolean> {
	const adminEmail = 'admin@magickit.dev'; // TODO: Make this configurable
	
	const html = `
		<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
			<h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
				New Contact Form Submission
			</h2>
			
			<div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
				<h3 style="color: #495057; margin-top: 0;">Contact Details</h3>
				<p><strong>Name:</strong> ${escapeHtml(data.name)}</p>
				<p><strong>Email:</strong> <a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></p>
				<p><strong>Subject:</strong> ${escapeHtml(data.subject)}</p>
				<p><strong>Submitted:</strong> ${data.submittedAt.toLocaleString()}</p>
				<p><strong>IP Address:</strong> ${data.ipAddress}</p>
			</div>
			
			<div style="background: #fff; padding: 20px; border: 1px solid #dee2e6; border-radius: 8px;">
				<h3 style="color: #495057; margin-top: 0;">Message</h3>
				<p style="white-space: pre-wrap; line-height: 1.6;">${escapeHtml(data.message)}</p>
			</div>
			
			<div style="margin-top: 20px; padding: 15px; background: #e7f3ff; border-radius: 8px;">
				<p style="margin: 0; color: #0066cc;">
					<strong>Action Required:</strong> Please respond to this inquiry within 24 hours.
				</p>
			</div>
		</div>
	`;

	const text = `
New Contact Form Submission

Name: ${data.name}
Email: ${data.email}
Subject: ${data.subject}
Submitted: ${data.submittedAt.toLocaleString()}
IP Address: ${data.ipAddress}

Message:
${data.message}

Please respond to this inquiry within 24 hours.
	`.trim();

	return await sendEmail({
		to: adminEmail,
		subject: `New Contact: ${data.subject}`,
		html,
		text
	});
}

/**
 * Send auto-reply confirmation to user
 */
export async function sendContactConfirmation(data: ContactNotificationData): Promise<boolean> {
	const html = `
		<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
			<h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
				Thank You for Contacting Us
			</h2>
			
			<p>Hi ${escapeHtml(data.name)},</p>
			
			<p>Thank you for reaching out to us. We've received your message and will get back to you within 24 hours during business days.</p>
			
			<div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
				<h3 style="color: #495057; margin-top: 0;">Your Message Summary</h3>
				<p><strong>Subject:</strong> ${escapeHtml(data.subject)}</p>
				<p><strong>Submitted:</strong> ${data.submittedAt.toLocaleString()}</p>
			</div>
			
			<p>If you have any urgent questions, please don't hesitate to call us at <strong>+1 (555) 123-4567</strong>.</p>
			
			<p>Best regards,<br>The Magickit Team</p>
			
			<hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
			<p style="color: #6c757d; font-size: 12px;">
				This is an automated message. Please do not reply to this email.
			</p>
		</div>
	`;

	const text = `
Thank You for Contacting Us

Hi ${data.name},

Thank you for reaching out to us. We've received your message and will get back to you within 24 hours during business days.

Your Message Summary:
Subject: ${data.subject}
Submitted: ${data.submittedAt.toLocaleString()}

If you have any urgent questions, please don't hesitate to call us at +1 (555) 123-4567.

Best regards,
The Magickit Team

This is an automated message. Please do not reply to this email.
	`.trim();

	return await sendEmail({
		to: data.email,
		subject: 'Thank you for contacting us - Magickit',
		html,
		text
	});
}

/**
 * Escape HTML to prevent XSS in email templates
 */
function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}