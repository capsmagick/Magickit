import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import Footer from './footer.svelte';

// Mock fetch for newsletter signup
global.fetch = vi.fn();

describe('Footer Component', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(fetch).mockClear();
	});

	it('renders company information', () => {
		render(Footer);

		expect(screen.getByText('MagicKit')).toBeInTheDocument();
		expect(screen.getByText(/A powerful universal web application template/)).toBeInTheDocument();
		expect(screen.getByText(/123 Business Street/)).toBeInTheDocument();
		expect(screen.getByText('+1 (555) 123-4567')).toBeInTheDocument();
		expect(screen.getByText('hello@magickit.dev')).toBeInTheDocument();
	});

	it('renders navigation sections', () => {
		render(Footer);

		// Check section headers
		expect(screen.getByText('Product')).toBeInTheDocument();
		expect(screen.getByText('Resources')).toBeInTheDocument();
		expect(screen.getByText('Legal')).toBeInTheDocument();

		// Check some navigation links
		expect(screen.getByRole('link', { name: 'About' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Services' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Blog' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Privacy Policy' })).toBeInTheDocument();
	});

	it('renders newsletter signup form', () => {
		render(Footer);

		expect(screen.getByText('Stay Updated')).toBeInTheDocument();
		expect(screen.getByText(/Subscribe to our newsletter/)).toBeInTheDocument();
		expect(screen.getByLabelText('Email address')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Subscribe' })).toBeInTheDocument();
	});

	it('renders social media links', () => {
		render(Footer);

		expect(screen.getByText('Follow us:')).toBeInTheDocument();
		expect(screen.getByLabelText('Follow us on Twitter')).toBeInTheDocument();
		expect(screen.getByLabelText('Connect with us on LinkedIn')).toBeInTheDocument();
		expect(screen.getByLabelText('View our code on GitHub')).toBeInTheDocument();
	});

	it('renders copyright information', () => {
		render(Footer);

		const currentYear = new Date().getFullYear();
		expect(screen.getByText(`© ${currentYear} MagicKit. All rights reserved.`)).toBeInTheDocument();
	});

	it('has proper accessibility attributes', () => {
		render(Footer);

		const footer = screen.getByRole('contentinfo');
		expect(footer).toBeInTheDocument();

		// Check navigation sections have proper labels
		const productNav = screen.getByLabelText('Product navigation');
		expect(productNav).toBeInTheDocument();

		const resourcesNav = screen.getByLabelText('Resources navigation');
		expect(resourcesNav).toBeInTheDocument();

		const legalNav = screen.getByLabelText('Legal navigation');
		expect(legalNav).toBeInTheDocument();
	});

	it('handles newsletter signup with valid email', async () => {
		vi.mocked(fetch).mockResolvedValueOnce({
			ok: true,
			json: async () => ({ success: true })
		} as Response);

		render(Footer);

		const emailInput = screen.getByLabelText('Email address');
		const subscribeButton = screen.getByRole('button', { name: 'Subscribe' });

		await fireEvent.input(emailInput, { target: { value: 'test@example.com' } });
		await fireEvent.click(subscribeButton);

		expect(fetch).toHaveBeenCalledWith('/api/newsletter', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ email: 'test@example.com' })
		});

		await waitFor(() => {
			expect(screen.getByText(/Thank you for subscribing/)).toBeInTheDocument();
		});
	});

	it('shows error for invalid email', async () => {
		render(Footer);

		const emailInput = screen.getByLabelText('Email address');
		const subscribeButton = screen.getByRole('button', { name: 'Subscribe' });

		await fireEvent.input(emailInput, { target: { value: 'invalid-email' } });
		await fireEvent.click(subscribeButton);

		await waitFor(() => {
			expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
		});

		// Should not make API call for invalid email
		expect(fetch).not.toHaveBeenCalled();
	});

	it('shows error for empty email', async () => {
		render(Footer);

		const subscribeButton = screen.getByRole('button', { name: 'Subscribe' });
		await fireEvent.click(subscribeButton);

		await waitFor(() => {
			expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
		});

		expect(fetch).not.toHaveBeenCalled();
	});

	it('handles newsletter signup API error', async () => {
		vi.mocked(fetch).mockResolvedValueOnce({
			ok: false,
			json: async () => ({ error: 'Email already subscribed' })
		} as Response);

		render(Footer);

		const emailInput = screen.getByLabelText('Email address');
		const subscribeButton = screen.getByRole('button', { name: 'Subscribe' });

		await fireEvent.input(emailInput, { target: { value: 'test@example.com' } });
		await fireEvent.click(subscribeButton);

		await waitFor(() => {
			expect(screen.getByText('Email already subscribed')).toBeInTheDocument();
		});
	});

	it('handles network error during newsletter signup', async () => {
		vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

		render(Footer);

		const emailInput = screen.getByLabelText('Email address');
		const subscribeButton = screen.getByRole('button', { name: 'Subscribe' });

		await fireEvent.input(emailInput, { target: { value: 'test@example.com' } });
		await fireEvent.click(subscribeButton);

		await waitFor(() => {
			expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeInTheDocument();
		});
	});

	it('shows loading state during newsletter submission', async () => {
		vi.mocked(fetch).mockImplementation(() => 
			new Promise(resolve => {
				setTimeout(() => {
					resolve({
						ok: true,
						json: async () => ({ success: true })
					} as Response);
				}, 100);
			})
		);

		render(Footer);

		const emailInput = screen.getByLabelText('Email address');
		const subscribeButton = screen.getByRole('button', { name: 'Subscribe' });

		await fireEvent.input(emailInput, { target: { value: 'test@example.com' } });
		await fireEvent.click(subscribeButton);

		// Check loading state
		expect(screen.getByText('Subscribing...')).toBeInTheDocument();
		expect(subscribeButton).toBeDisabled();
		expect(emailInput).toBeDisabled();

		// Wait for completion
		await waitFor(() => {
			expect(screen.queryByText('Subscribing...')).not.toBeInTheDocument();
		});
	});

	it('clears email field after successful subscription', async () => {
		vi.mocked(fetch).mockResolvedValueOnce({
			ok: true,
			json: async () => ({ success: true })
		} as Response);

		render(Footer);

		const emailInput = screen.getByLabelText('Email address') as HTMLInputElement;
		const subscribeButton = screen.getByRole('button', { name: 'Subscribe' });

		await fireEvent.input(emailInput, { target: { value: 'test@example.com' } });
		await fireEvent.click(subscribeButton);

		await waitFor(() => {
			expect(emailInput.value).toBe('');
		});
	});

	it('auto-hides status messages after 5 seconds', async () => {
		vi.useFakeTimers();
		
		render(Footer);

		const emailInput = screen.getByLabelText('Email address');
		const subscribeButton = screen.getByRole('button', { name: 'Subscribe' });

		await fireEvent.input(emailInput, { target: { value: 'invalid-email' } });
		await fireEvent.click(subscribeButton);

		await waitFor(() => {
			expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
		});

		// Fast-forward 5 seconds
		vi.advanceTimersByTime(5000);

		await waitFor(() => {
			expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument();
		});

		vi.useRealTimers();
	});

	it('has proper contact link attributes', () => {
		render(Footer);

		const phoneLink = screen.getByRole('link', { name: '+1 (555) 123-4567' });
		expect(phoneLink).toHaveAttribute('href', 'tel:+1 (555) 123-4567');

		const emailLink = screen.getByRole('link', { name: 'hello@magickit.dev' });
		expect(emailLink).toHaveAttribute('href', 'mailto:hello@magickit.dev');
	});

	it('opens social media links in new tab', () => {
		render(Footer);

		const twitterButton = screen.getByLabelText('Follow us on Twitter');
		const linkedinButton = screen.getByLabelText('Connect with us on LinkedIn');
		const githubButton = screen.getByLabelText('View our code on GitHub');

		// Mock window.open
		const mockOpen = vi.fn();
		Object.defineProperty(window, 'open', { value: mockOpen });

		fireEvent.click(twitterButton);
		expect(mockOpen).toHaveBeenCalledWith('https://twitter.com/magickit', '_blank');

		fireEvent.click(linkedinButton);
		expect(mockOpen).toHaveBeenCalledWith('https://linkedin.com/company/magickit', '_blank');

		fireEvent.click(githubButton);
		expect(mockOpen).toHaveBeenCalledWith('https://github.com/magickit', '_blank');
	});

	it('has proper ARIA live region for status messages', async () => {
		render(Footer);

		const emailInput = screen.getByLabelText('Email address');
		const subscribeButton = screen.getByRole('button', { name: 'Subscribe' });

		await fireEvent.input(emailInput, { target: { value: 'invalid-email' } });
		await fireEvent.click(subscribeButton);

		await waitFor(() => {
			const statusMessage = screen.getByText('Please enter a valid email address');
			expect(statusMessage).toHaveAttribute('aria-live', 'polite');
			expect(statusMessage).toHaveAttribute('role', 'status');
		});
	});

	it('prevents multiple simultaneous submissions', async () => {
		vi.mocked(fetch).mockImplementation(() => 
			new Promise(resolve => {
				setTimeout(() => {
					resolve({
						ok: true,
						json: async () => ({ success: true })
					} as Response);
				}, 100);
			})
		);

		render(Footer);

		const emailInput = screen.getByLabelText('Email address');
		const subscribeButton = screen.getByRole('button', { name: 'Subscribe' });

		await fireEvent.input(emailInput, { target: { value: 'test@example.com' } });
		
		// Click multiple times rapidly
		await fireEvent.click(subscribeButton);
		await fireEvent.click(subscribeButton);
		await fireEvent.click(subscribeButton);

		// Should only make one API call
		expect(fetch).toHaveBeenCalledTimes(1);
	});
});