import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { goto } from '$app/navigation';
import { page } from '$app/stores';
import LoginForm from './login-form.svelte';
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
		signIn: {
			email: vi.fn(),
			social: vi.fn()
		}
	}
}));

describe('LoginForm Component', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Reset session mock
		vi.mocked(authClient.useSession).mockReturnValue({
			data: null
		});
	});

	it('renders login form with all required fields', () => {
		render(LoginForm, { props: { id: 'test' } });

		expect(screen.getByText('Login')).toBeInTheDocument();
		expect(screen.getByText('Enter your email below to login to your account')).toBeInTheDocument();
		expect(screen.getByLabelText('Email')).toBeInTheDocument();
		expect(screen.getByLabelText('Password')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Sign in with Google' })).toBeInTheDocument();
	});

	it('has proper accessibility attributes', () => {
		render(LoginForm, { props: { id: 'test' } });

		const emailInput = screen.getByLabelText('Email');
		const passwordInput = screen.getByLabelText('Password');

		expect(emailInput).toHaveAttribute('type', 'email');
		expect(emailInput).toHaveAttribute('required');
		expect(passwordInput).toHaveAttribute('type', 'password');
		expect(passwordInput).toHaveAttribute('required');
	});

	it('shows forgot password link', () => {
		render(LoginForm, { props: { id: 'test' } });

		const forgotPasswordLink = screen.getByText('Forgot password?');
		expect(forgotPasswordLink).toBeInTheDocument();
		expect(forgotPasswordLink).toHaveAttribute('href', '/forgot-password');
	});

	it('shows sign up link', () => {
		render(LoginForm, { props: { id: 'test' } });

		const signUpLink = screen.getByText('Sign up');
		expect(signUpLink).toBeInTheDocument();
		expect(signUpLink).toHaveAttribute('href', '/signup');
	});

	it('handles form submission with valid data', async () => {
		const mockSignIn = vi.fn().mockImplementation((data, callbacks) => {
			callbacks.onSuccess({ user: { role: 'user' } });
		});
		vi.mocked(authClient.signIn.email).mockImplementation(mockSignIn);

		render(LoginForm, { props: { id: 'test' } });

		const emailInput = screen.getByLabelText('Email');
		const passwordInput = screen.getByLabelText('Password');
		const submitButton = screen.getByRole('button', { name: 'Sign In' });

		await fireEvent.input(emailInput, { target: { value: 'test@example.com' } });
		await fireEvent.input(passwordInput, { target: { value: 'password123' } });
		await fireEvent.click(submitButton);

		expect(mockSignIn).toHaveBeenCalledWith(
			{
				email: 'test@example.com',
				password: 'password123'
			},
			expect.objectContaining({
				onSuccess: expect.any(Function),
				onError: expect.any(Function)
			})
		);
	});

	it('shows loading state during form submission', async () => {
		const mockSignIn = vi.fn().mockImplementation((data, callbacks) => {
			// Simulate async operation
			return new Promise(resolve => {
				setTimeout(() => {
					callbacks.onSuccess({ user: { role: 'user' } });
					resolve(undefined);
				}, 100);
			});
		});
		vi.mocked(authClient.signIn.email).mockImplementation(mockSignIn);

		render(LoginForm, { props: { id: 'test' } });

		const emailInput = screen.getByLabelText('Email');
		const passwordInput = screen.getByLabelText('Password');
		const submitButton = screen.getByRole('button', { name: 'Sign In' });

		await fireEvent.input(emailInput, { target: { value: 'test@example.com' } });
		await fireEvent.input(passwordInput, { target: { value: 'password123' } });
		await fireEvent.click(submitButton);

		// Check loading state
		expect(screen.getByText('Signing in...')).toBeInTheDocument();
		expect(submitButton).toBeDisabled();
		expect(emailInput).toBeDisabled();
		expect(passwordInput).toBeDisabled();

		// Wait for completion
		await waitFor(() => {
			expect(screen.queryByText('Signing in...')).not.toBeInTheDocument();
		});
	});

	it('displays error message on login failure', async () => {
		const mockSignIn = vi.fn().mockImplementation((data, callbacks) => {
			callbacks.onError({ error: { message: 'Invalid credentials' } });
		});
		vi.mocked(authClient.signIn.email).mockImplementation(mockSignIn);

		render(LoginForm, { props: { id: 'test' } });

		const emailInput = screen.getByLabelText('Email');
		const passwordInput = screen.getByLabelText('Password');
		const submitButton = screen.getByRole('button', { name: 'Sign In' });

		await fireEvent.input(emailInput, { target: { value: 'test@example.com' } });
		await fireEvent.input(passwordInput, { target: { value: 'wrongpassword' } });
		await fireEvent.click(submitButton);

		await waitFor(() => {
			expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
		});
	});

	it('redirects admin users to admin panel', async () => {
		// Mock session with admin user
		vi.mocked(authClient.useSession).mockReturnValue({
			data: { user: { role: 'admin' } }
		});

		render(LoginForm, { props: { id: 'test' } });

		await waitFor(() => {
			expect(goto).toHaveBeenCalledWith('/admin');
		});
	});

	it('redirects regular users to return URL or home', async () => {
		// Mock page with returnTo parameter
		vi.mocked(page.url.searchParams.get).mockReturnValue('/dashboard');
		
		// Mock session with regular user
		vi.mocked(authClient.useSession).mockReturnValue({
			data: { user: { role: 'user' } }
		});

		render(LoginForm, { props: { id: 'test' } });

		await waitFor(() => {
			expect(goto).toHaveBeenCalledWith('/dashboard');
		});
	});

	it('handles Google sign in', async () => {
		const mockGoogleSignIn = vi.fn().mockImplementation((data, callbacks) => {
			callbacks.onSuccess({ user: { role: 'user' } });
		});
		vi.mocked(authClient.signIn.social).mockImplementation(mockGoogleSignIn);

		render(LoginForm, { props: { id: 'test' } });

		const googleButton = screen.getByRole('button', { name: 'Sign in with Google' });
		await fireEvent.click(googleButton);

		expect(mockGoogleSignIn).toHaveBeenCalledWith(
			{ provider: 'google' },
			expect.objectContaining({
				onSuccess: expect.any(Function),
				onError: expect.any(Function)
			})
		);
	});

	it('shows error for Google sign in failure', async () => {
		const mockGoogleSignIn = vi.fn().mockImplementation((data, callbacks) => {
			callbacks.onError({ error: { message: 'Google signin failed' } });
		});
		vi.mocked(authClient.signIn.social).mockImplementation(mockGoogleSignIn);

		render(LoginForm, { props: { id: 'test' } });

		const googleButton = screen.getByRole('button', { name: 'Sign in with Google' });
		await fireEvent.click(googleButton);

		await waitFor(() => {
			expect(screen.getByText('Google signin failed')).toBeInTheDocument();
		});
	});

	it('prevents form submission when loading', async () => {
		const mockSignIn = vi.fn();
		vi.mocked(authClient.signIn.email).mockImplementation(mockSignIn);

		render(LoginForm, { props: { id: 'test' } });

		const emailInput = screen.getByLabelText('Email');
		const passwordInput = screen.getByLabelText('Password');
		const submitButton = screen.getByRole('button', { name: 'Sign In' });

		await fireEvent.input(emailInput, { target: { value: 'test@example.com' } });
		await fireEvent.input(passwordInput, { target: { value: 'password123' } });
		
		// First click
		await fireEvent.click(submitButton);
		
		// Second click while loading (should be prevented)
		await fireEvent.click(submitButton);

		// Should only be called once
		expect(mockSignIn).toHaveBeenCalledTimes(1);
	});

	it('has proper keyboard navigation support', () => {
		render(LoginForm, { props: { id: 'test' } });

		const forgotPasswordLink = screen.getByText('Forgot password?');
		const signUpLink = screen.getByText('Sign up');

		expect(forgotPasswordLink).toHaveAttribute('tabindex', '0');
		expect(signUpLink).toHaveClass('focus:outline-none', 'focus:ring-2');
	});
});