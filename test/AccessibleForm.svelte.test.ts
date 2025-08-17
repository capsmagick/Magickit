import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import AccessibleForm from './AccessibleForm.svelte';
import { announceToScreenReader } from '$lib/utils/accessibility';

// Mock the accessibility utility
vi.mock('$lib/utils/accessibility', () => ({
	generateId: vi.fn().mockImplementation((prefix) => `${prefix}-mock-id`),
	announceToScreenReader: vi.fn()
}));

describe('AccessibleForm Component', () => {
	const mockFields = [
		{
			id: 'name',
			name: 'name',
			label: 'Full Name',
			type: 'text' as const,
			value: '',
			required: true,
			helpText: 'Enter your full name as it appears on official documents'
		},
		{
			id: 'email',
			name: 'email',
			label: 'Email Address',
			type: 'email' as const,
			value: '',
			required: true,
			placeholder: 'you@example.com'
		},
		{
			id: 'phone',
			name: 'phone',
			label: 'Phone Number',
			type: 'tel' as const,
			value: '',
			required: false,
			pattern: '[0-9]{3}-[0-9]{3}-[0-9]{4}'
		}
	];

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders form with title and description', () => {
		render(AccessibleForm, {
			props: {
				fields: mockFields,
				title: 'Contact Form',
				description: 'Please fill out all required fields'
			}
		});

		expect(screen.getByText('Contact Form')).toBeInTheDocument();
		expect(screen.getByText('Please fill out all required fields')).toBeInTheDocument();
	});

	it('renders all form fields with proper labels', () => {
		render(AccessibleForm, {
			props: { fields: mockFields }
		});

		expect(screen.getByLabelText('Full Name *')).toBeInTheDocument();
		expect(screen.getByLabelText('Email Address *')).toBeInTheDocument();
		expect(screen.getByLabelText('Phone Number')).toBeInTheDocument();
	});

	it('shows required field indicators', () => {
		render(AccessibleForm, {
			props: { fields: mockFields }
		});

		const requiredIndicators = screen.getAllByText('*');
		expect(requiredIndicators).toHaveLength(2); // name and email are required
	});

	it('displays help text for fields', () => {
		render(AccessibleForm, {
			props: { fields: mockFields }
		});

		expect(screen.getByText('Enter your full name as it appears on official documents')).toBeInTheDocument();
	});

	it('has proper accessibility attributes', () => {
		render(AccessibleForm, {
			props: { fields: mockFields }
		});

		const nameInput = screen.getByLabelText('Full Name *');
		const emailInput = screen.getByLabelText('Email Address *');
		const phoneInput = screen.getByLabelText('Phone Number');

		expect(nameInput).toHaveAttribute('aria-required', 'true');
		expect(emailInput).toHaveAttribute('aria-required', 'true');
		expect(phoneInput).not.toHaveAttribute('aria-required');

		// Check aria-describedby for help text
		expect(nameInput).toHaveAttribute('aria-describedby');
	});

	it('validates required fields on blur', async () => {
		render(AccessibleForm, {
			props: { fields: mockFields }
		});

		const nameInput = screen.getByLabelText('Full Name *');
		
		await fireEvent.blur(nameInput);

		await waitFor(() => {
			expect(screen.getByText('Full Name is required')).toBeInTheDocument();
		});

		expect(announceToScreenReader).toHaveBeenCalledWith(
			'Error in Full Name: Full Name is required',
			'assertive'
		);
	});

	it('validates email format', async () => {
		render(AccessibleForm, {
			props: { fields: mockFields }
		});

		const emailInput = screen.getByLabelText('Email Address *');
		
		await fireEvent.input(emailInput, { target: { value: 'invalid-email' } });
		await fireEvent.blur(emailInput);

		await waitFor(() => {
			expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
		});
	});

	it('validates phone number format', async () => {
		render(AccessibleForm, {
			props: { fields: mockFields }
		});

		const phoneInput = screen.getByLabelText('Phone Number');
		
		await fireEvent.input(phoneInput, { target: { value: 'invalid-phone' } });
		await fireEvent.blur(phoneInput);

		await waitFor(() => {
			expect(screen.getByText('Please enter a valid phone number')).toBeInTheDocument();
		});
	});

	it('clears errors on valid input', async () => {
		render(AccessibleForm, {
			props: { fields: mockFields }
		});

		const nameInput = screen.getByLabelText('Full Name *');
		
		// Trigger error
		await fireEvent.blur(nameInput);
		await waitFor(() => {
			expect(screen.getByText('Full Name is required')).toBeInTheDocument();
		});

		// Fix error
		await fireEvent.input(nameInput, { target: { value: 'John Doe' } });

		await waitFor(() => {
			expect(screen.queryByText('Full Name is required')).not.toBeInTheDocument();
		});
	});

	it('shows validation status when form is valid', async () => {
		render(AccessibleForm, {
			props: { fields: mockFields }
		});

		const nameInput = screen.getByLabelText('Full Name *');
		const emailInput = screen.getByLabelText('Email Address *');

		await fireEvent.input(nameInput, { target: { value: 'John Doe' } });
		await fireEvent.input(emailInput, { target: { value: 'john@example.com' } });
		await fireEvent.blur(nameInput);
		await fireEvent.blur(emailInput);

		await waitFor(() => {
			expect(screen.getByText('Form is valid')).toBeInTheDocument();
		});
	});

	it('handles form submission with valid data', async () => {
		const mockSubmit = vi.fn().mockResolvedValue(undefined);
		
		render(AccessibleForm, {
			props: {
				fields: mockFields,
				onSubmit: mockSubmit
			}
		});

		const nameInput = screen.getByLabelText('Full Name *');
		const emailInput = screen.getByLabelText('Email Address *');
		const submitButton = screen.getByRole('button', { name: 'Submit' });

		await fireEvent.input(nameInput, { target: { value: 'John Doe' } });
		await fireEvent.input(emailInput, { target: { value: 'john@example.com' } });
		await fireEvent.click(submitButton);

		expect(mockSubmit).toHaveBeenCalledWith({
			name: 'John Doe',
			email: 'john@example.com',
			phone: ''
		});

		await waitFor(() => {
			expect(announceToScreenReader).toHaveBeenCalledWith('Form submitted successfully');
		});
	});

	it('prevents submission with invalid data', async () => {
		const mockSubmit = vi.fn();
		
		render(AccessibleForm, {
			props: {
				fields: mockFields,
				onSubmit: mockSubmit
			}
		});

		const submitButton = screen.getByRole('button', { name: 'Submit' });
		await fireEvent.click(submitButton);

		expect(mockSubmit).not.toHaveBeenCalled();
		
		await waitFor(() => {
			expect(announceToScreenReader).toHaveBeenCalledWith(
				'Form has errors. Please correct them and try again.',
				'assertive'
			);
		});
	});

	it('shows loading state during submission', async () => {
		render(AccessibleForm, {
			props: {
				fields: mockFields,
				isSubmitting: true
			}
		});

		const submitButton = screen.getByRole('button', { name: 'Submitting...' });
		expect(submitButton).toBeDisabled();
		expect(screen.getByText('Submitting...')).toBeInTheDocument();
	});

	it('handles submission errors gracefully', async () => {
		const mockSubmit = vi.fn().mockRejectedValue(new Error('Network error'));
		
		render(AccessibleForm, {
			props: {
				fields: mockFields,
				onSubmit: mockSubmit
			}
		});

		const nameInput = screen.getByLabelText('Full Name *');
		const emailInput = screen.getByLabelText('Email Address *');
		const submitButton = screen.getByRole('button', { name: 'Submit' });

		await fireEvent.input(nameInput, { target: { value: 'John Doe' } });
		await fireEvent.input(emailInput, { target: { value: 'john@example.com' } });
		await fireEvent.click(submitButton);

		await waitFor(() => {
			expect(announceToScreenReader).toHaveBeenCalledWith(
				'Form submission failed. Please try again.',
				'assertive'
			);
		});
	});

	it('renders textarea fields correctly', () => {
		const textareaFields = [
			{
				id: 'message',
				name: 'message',
				label: 'Message',
				type: 'textarea' as const,
				value: '',
				required: true,
				placeholder: 'Enter your message...'
			}
		];

		render(AccessibleForm, {
			props: { fields: textareaFields }
		});

		const textarea = screen.getByLabelText('Message *');
		expect(textarea.tagName).toBe('TEXTAREA');
		expect(textarea).toHaveAttribute('placeholder', 'Enter your message...');
	});

	it('renders select fields correctly', () => {
		const selectFields = [
			{
				id: 'country',
				name: 'country',
				label: 'Country',
				type: 'select' as const,
				value: '',
				required: true,
				placeholder: 'Select a country',
				options: [
					{ value: 'us', label: 'United States' },
					{ value: 'ca', label: 'Canada' },
					{ value: 'uk', label: 'United Kingdom' }
				]
			}
		];

		render(AccessibleForm, {
			props: { fields: selectFields }
		});

		const select = screen.getByLabelText('Country *');
		expect(select.tagName).toBe('SELECT');
		expect(screen.getByText('Select a country')).toBeInTheDocument();
		expect(screen.getByText('United States')).toBeInTheDocument();
		expect(screen.getByText('Canada')).toBeInTheDocument();
		expect(screen.getByText('United Kingdom')).toBeInTheDocument();
	});

	it('validates field length constraints', async () => {
		const fieldsWithLength = [
			{
				id: 'username',
				name: 'username',
				label: 'Username',
				type: 'text' as const,
				value: '',
				required: true,
				minLength: 3,
				maxLength: 20
			}
		];

		render(AccessibleForm, {
			props: { fields: fieldsWithLength }
		});

		const usernameInput = screen.getByLabelText('Username *');

		// Test minimum length
		await fireEvent.input(usernameInput, { target: { value: 'ab' } });
		await fireEvent.blur(usernameInput);

		await waitFor(() => {
			expect(screen.getByText('Username must be at least 3 characters')).toBeInTheDocument();
		});

		// Test maximum length
		await fireEvent.input(usernameInput, { target: { value: 'a'.repeat(25) } });
		await fireEvent.blur(usernameInput);

		await waitFor(() => {
			expect(screen.getByText('Username must be no more than 20 characters')).toBeInTheDocument();
		});
	});

	it('uses custom validation function', async () => {
		const fieldsWithCustomValidation = [
			{
				id: 'password',
				name: 'password',
				label: 'Password',
				type: 'password' as const,
				value: '',
				required: true,
				validation: (value: string) => {
					if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
						return 'Password must contain at least one lowercase letter, one uppercase letter, and one number';
					}
					return null;
				}
			}
		];

		render(AccessibleForm, {
			props: { fields: fieldsWithCustomValidation }
		});

		const passwordInput = screen.getByLabelText('Password *');

		await fireEvent.input(passwordInput, { target: { value: 'weakpassword' } });
		await fireEvent.blur(passwordInput);

		await waitFor(() => {
			expect(screen.getByText(/Password must contain at least one lowercase letter/)).toBeInTheDocument();
		});
	});

	it('focuses first error field on submission', async () => {
		render(AccessibleForm, {
			props: { fields: mockFields }
		});

		const submitButton = screen.getByRole('button', { name: 'Submit' });
		const nameInput = screen.getByLabelText('Full Name *');

		await fireEvent.click(submitButton);

		await waitFor(() => {
			expect(document.activeElement).toBe(nameInput);
		});
	});

	it('disables submit button when form is invalid', () => {
		render(AccessibleForm, {
			props: { fields: mockFields }
		});

		const submitButton = screen.getByRole('button', { name: 'Submit' });
		expect(submitButton).toBeDisabled();
	});

	it('has proper error styling and ARIA attributes', async () => {
		render(AccessibleForm, {
			props: { fields: mockFields }
		});

		const nameInput = screen.getByLabelText('Full Name *');
		
		await fireEvent.blur(nameInput);

		await waitFor(() => {
			const errorMessage = screen.getByText('Full Name is required');
			expect(errorMessage).toHaveAttribute('role', 'alert');
			expect(errorMessage).toHaveAttribute('aria-live', 'polite');
			expect(nameInput).toHaveAttribute('aria-invalid', 'true');
		});
	});
});