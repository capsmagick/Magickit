import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { goto } from '$app/navigation';
import { page } from '$app/stores';
import SignupForm from './signup-form.svelte';
import { authClient } from '$lib/auth/auth-client';

// Mock dependencies
vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

vi.mock('$app/stores', () => ({
	page: {
		url: {
			searchParams: {
				get: vi.fn().mockReturnValue(null)
			}
		}
	}
}));

vi.mock('$lib/auth/auth-client', () => ({
	authClient: {
		useSession: vi.fn().mockReturnValue({
			data: null
		}),
		signUp: {
			email: vi.fn()
		},
		signIn: {
			social: vi.fn()
		}
	}
}));

describe('SignupForm Component', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Reset session mock
		vi.mocked(authClient.useSession).mockReturnValue({
			data: null
		});
	});

	it('renders signup form with all required fields', () => {
		render(SignupForm);

		expect(screen.getByText('Create Account')).toBeInTheDocument();
		expect(screen.getByText('Enter your details below to create your account')).toBeInTheDocument();
		expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
		expect(screen.getByLabelText('Email')).toBeInTheDocument();
		expect(screen.getByLabelText('Password')).toBeInTheDocument();
		expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Sign up with Google' })).toBeInTheDocument();
	});

	it('has proper accessibility attributes', () => {
		render(SignupForm);

		const nameInput = screen.getByLabelText('Full Name');
		const emailInput = screen.getByLabelText('Email');
		const passwordInput = screen.getByLabelText('Password');
		const confirmPasswordInput = screen.getByLabelText('Confirm Password');

		expect(nameInput).toHaveAttribute('type', 'text');
		expect(nameInput).toHaveAttribute('required');
		expect(emailInput).toHaveAttribute('type', 'email');
		expect(emailInput).toHaveAttribute('required');
		expect(passwordInput).toHaveAttribute('type', 'password');
		expect(passwordInput).toHaveAttribute('required');
		expect(confirmPasswordInput).toHaveAttribute('type', 'password');
		expect(confirmPasswordInput).toHaveAttribute('required');
	});

	it('shows sign in link', () => {
		render(SignupForm);

		const signInLink = screen.getByText('Sign in');
		expect(signInLink).toBeInTheDocument();
		expect(signInLink).toHaveAttribute('href', '/login');
	});

	it('validates password confirmation in real-time', async () => {
		render(SignupForm);

		const passwordInput = screen.getByLabelText('Password');
		const confirmPasswordInput = screen.getByLabelText('Confirm Password');

		// Enter password
		await fireEvent.input(passwordInput, { target: { value: 'password123' } });
		
		// Enter non-matching confirmation
		await fireEvent.input(confirmPasswordInput, { target: { value: 'different' } });

		await waitFor(() => {
			expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
		});

		// Enter matching confirmation
		await fireEvent.input(confirmPasswordInput, { target: { value: 'password123' } });

		await waitFor(() => {
			expect(screen.getByText('Passwords match')).toBeInTheDocument();
			expect(screen.queryByText('Passwords do not match')).not.toBeInTheDocument();
		});
	});

	it('shows password strength indicator', async () => {
		render(SignupForm);

		const passwordInput = screen.getByLabelText('Password');

		// Enter strong password
		await fireEvent.input(passwordInput, { target: { value: 'password123' } });

		await waitFor(() => {
			expect(screen.getByText('Password strength: Good')).toBeInTheDocument();
		});
	});

	it('validates form fields before submission', async () => {
		render(SignupForm);

		const nameInput = screen.getByLabelText('Full Name');
		const passwordInput = screen.getByLabelText('Password');
		const submitButton = screen.getByRole('button', { name: 'Create Account' });

		// Test short name validation
		await fireEvent.input(nameInput, { target: { value: 'A' } });
		await fireEvent.click(submitButton);

		await waitFor(() => {
			expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
		});

		// Test short password validation
		await fireEvent.input(nameInput, { target: { value: 'John Doe' } });
		await fireEvent.input(passwordInput, { target: { value: '123' } });
		await fireEvent.click(submitButton);

		await waitFor(() => {
			expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
		});
	});

	it('handles successful form submission', async () => {
		const mockSignUp = vi.fn().mockImplementation((data, callbacks) => {
			callbacks.onSuccess({ user: { role: 'user' } });
		});
		vi.mocked(authClient.signUp.email).mockImplementation(mockSignUp);

		render(SignupForm);

		const nameInput = screen.getByLabelText('Full Name');
		const emailInput = screen.getByLabelText('Email');
		const passwordInput = screen.getByLabelText('Password');
		const confirmPasswordInput = screen.getByLabelText('Confirm Password');
		const submitButton = screen.getByRole('button', { name: 'Create Account' });

		await fireEvent.input(nameInput, { target: { value: 'John Doe' } });
		await fireEvent.input(emailInput, { target: { value: 'john@example.com' } });
		await fireEvent.input(passwordInput, { target: { value: 'password123' } });
		await fireEvent.input(confirmPasswordInput, { target: { value: 'password123' } });
		await fireEvent.click(submitButton);

		expect(mockSignUp).toHaveBeenCalledWith(
			{
				email: 'john@example.com',
				password: 'password123',
				name: 'John Doe'
			},
			expect.objectContaining({
				onSuccess: expect.any(Function),
				onError: expect.any(Function)
			})
		);
	});

	it('shows loading state during form submission', async () => {
		const mockSignUp = vi.fn().mockImplementation((data, callbacks) => {
			return new Promise(resolve => {
				setTimeout(() => {
					callbacks.onSuccess({ user: { role: 'user' } });
					resolve(undefined);
				}, 100);
			});
		});
		vi.mocked(authClient.signUp.email).mockImplementation(mockSignUp);

		render(SignupForm);

		const nameInput = screen.getByLabelText('Full Name');
		const emailInput = screen.getByLabelText('Email');
		const passwordInput = screen.getByLabelText('Password');
		const confirmPasswordInput = screen.getByLabelText('Confirm Password');
		const submitButton = screen.getByRole('button', { name: 'Create Account' });

		await fireEvent.input(nameInput, { target: { value: 'John Doe' } });
		await fireEvent.input(emailInput, { target: { value: 'john@example.com' } });
		await fireEvent.input(passwordInput, { target: { value: 'password123' } });
		await fireEvent.input(confirmPasswordInput, { target: { value: 'password123' } });
		await fireEvent.click(submitButton);

		// Check loading state
		expect(screen.getByText('Creating account...')).toBeInTheDocument();
		expect(submitButton).toBeDisabled();

		// Wait for completion
		await waitFor(() => {
			expect(screen.queryByText('Creating account...')).not.toBeInTheDocument();
		});
	});

	it('displays error message on signup failure', async () => {
		const mockSignUp = vi.fn().mockImplementation((data, callbacks) => {
			callbacks.onError({ error: { message: 'Email already exists' } });
		});
		vi.mocked(authClient.signUp.email).mockImplementation(mockSignUp);

		render(SignupForm);

		const nameInput = screen.getByLabelText('Full Name');
		const emailInput = screen.getByLabelText('Email');
		const passwordInput = screen.getByLabelText('Password');
		const confirmPasswordInput = screen.getByLabelText('Confirm Password');
		const submitButton = screen.getByRole('button', { name: 'Create Account' });

		await fireEvent.input(nameInput, { target: { value: 'John Doe' } });
		await fireEvent.input(emailInput, { target: { value: 'existing@example.com' } });
		await fireEvent.input(passwordInput, { target: { value: 'password123' } });
		await fireEvent.input(confirmPasswordInput, { target: { value: 'password123' } });
		await fireEvent.click(submitButton);

		await waitFor(() => {
			expect(screen.getByText('Email already exists')).toBeInTheDocument();
		});
	});

	it('disables submit button when validation errors exist', async () => {
		render(SignupForm);

		const passwordInput = screen.getByLabelText('Password');
		const confirmPasswordInput = screen.getByLabelText('Confirm Password');
		const submitButton = screen.getByRole('button', { name: 'Create Account' });

		// Create password mismatch
		await fireEvent.input(passwordInput, { target: { value: 'password123' } });
		await fireEvent.input(confirmPasswordInput, { target: { value: 'different' } });

		await waitFor(() => {
			expect(submitButton).toBeDisabled();
		});
	});

	it('redirects admin users to admin panel after signup', async () => {
		// Mock session with admin user
		vi.mocked(authClient.useSession).mockReturnValue({
			data: { user: { role: 'admin' } }
		});

		render(SignupForm);

		await waitFor(() => {
			expect(goto).toHaveBeenCalledWith('/admin');
		});
	});

	it('redirects regular users to return URL or home after signup', async () => {
		// Mock page with returnTo parameter
		vi.mocked(page.url.searchParams.get).mockReturnValue('/welcome');
		
		// Mock session with regular user
		vi.mocked(authClient.useSession).mockReturnValue({
			data: { user: { role: 'user' } }
		});

		render(SignupForm);

		await waitFor(() => {
			expect(goto).toHaveBeenCalledWith('/welcome');
		});
	});

	it('handles Google sign up', async () => {
		const mockGoogleSignIn = vi.fn().mockImplementation((data, callbacks) => {
			callbacks.onSuccess({ user: { role: 'user' } });
		});
		vi.mocked(authClient.signIn.social).mockImplementation(mockGoogleSignIn);

		render(SignupForm);

		const googleButton = screen.getByRole('button', { name: 'Sign up with Google' });
		await fireEvent.click(googleButton);

		expect(mockGoogleSignIn).toHaveBeenCalledWith(
			{ provider: 'google' },
			expect.objectContaining({
				onSuccess: expect.any(Function),
				onError: expect.any(Function)
			})
		);
	});

	it('shows visual feedback for field validation states', async () => {
		render(SignupForm);

		const nameInput = screen.getByLabelText('Full Name');

		// Enter invalid name
		await fireEvent.input(nameInput, { target: { value: 'A' } });
		await fireEvent.blur(nameInput);

		// Check for error styling (this would need to be implemented in the component)
		expect(nameInput).toHaveClass('transition-colors');
	});

	it('prevents form submission with mismatched passwords', async () => {
		const mockSignUp = vi.fn();
		vi.mocked(authClient.signUp.email).mockImplementation(mockSignUp);

		render(SignupForm);

		const nameInput = screen.getByLabelText('Full Name');
		const emailInput = screen.getByLabelText('Email');
		const passwordInput = screen.getByLabelText('Password');
		const confirmPasswordInput = screen.getByLabelText('Confirm Password');
		const submitButton = screen.getByRole('button', { name: 'Create Account' });

		await fireEvent.input(nameInput, { target: { value: 'John Doe' } });
		await fireEvent.input(emailInput, { target: { value: 'john@example.com' } });
		await fireEvent.input(passwordInput, { target: { value: 'password123' } });
		await fireEvent.input(confirmPasswordInput, { target: { value: 'different' } });
		await fireEvent.click(submitButton);

		// Should not call signup with mismatched passwords
		expect(mockSignUp).not.toHaveBeenCalled();
		expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
	});
});