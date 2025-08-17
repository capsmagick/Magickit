import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
	test.beforeEach(async ({ page }) => {
		// Start from the homepage
		await page.goto('/');
	});

	test('user can navigate to login page', async ({ page }) => {
		await page.click('button:has-text("Login")');
		await expect(page).toHaveURL('/login');
		await expect(page.locator('h1')).toContainText('Login');
	});

	test('user can navigate to signup page', async ({ page }) => {
		await page.click('button:has-text("Sign Up")');
		await expect(page).toHaveURL('/signup');
		await expect(page.locator('h1')).toContainText('Create Account');
	});

	test('login form has proper validation', async ({ page }) => {
		await page.goto('/login');

		// Try to submit empty form
		await page.click('button[type="submit"]');

		// Check for HTML5 validation
		const emailInput = page.locator('input[type="email"]');
		const passwordInput = page.locator('input[type="password"]');

		await expect(emailInput).toHaveAttribute('required');
		await expect(passwordInput).toHaveAttribute('required');
	});

	test('signup form validates password confirmation', async ({ page }) => {
		await page.goto('/signup');

		// Fill form with mismatched passwords
		await page.fill('input[placeholder="John Doe"]', 'Test User');
		await page.fill('input[type="email"]', 'test@example.com');
		await page.fill('input[type="password"]:first-of-type', 'password123');
		await page.fill('input[type="password"]:last-of-type', 'different');

		// Check for password mismatch error
		await expect(page.locator('text=Passwords do not match')).toBeVisible();
	});

	test('login form shows loading state', async ({ page }) => {
		await page.goto('/login');

		// Fill valid credentials
		await page.fill('input[type="email"]', 'test@example.com');
		await page.fill('input[type="password"]', 'password123');

		// Submit form
		await page.click('button[type="submit"]');

		// Check for loading state (briefly)
		await expect(page.locator('text=Signing in...')).toBeVisible({ timeout: 1000 });
	});

	test('signup form shows password strength indicator', async ({ page }) => {
		await page.goto('/signup');

		const passwordInput = page.locator('input[type="password"]:first-of-type');
		
		// Enter a strong password
		await passwordInput.fill('StrongPassword123');

		// Check for strength indicator
		await expect(page.locator('text=Password strength: Good')).toBeVisible();
	});

	test('forms have proper accessibility attributes', async ({ page }) => {
		await page.goto('/login');

		const emailInput = page.locator('input[type="email"]');
		const passwordInput = page.locator('input[type="password"]');

		// Check ARIA attributes
		await expect(emailInput).toHaveAttribute('aria-describedby');
		await expect(passwordInput).toHaveAttribute('aria-describedby');

		// Check labels are properly associated
		const emailLabel = page.locator('label[for*="email"]');
		const passwordLabel = page.locator('label[for*="password"]');

		await expect(emailLabel).toBeVisible();
		await expect(passwordLabel).toBeVisible();
	});

	test('can navigate between login and signup', async ({ page }) => {
		await page.goto('/login');

		// Go to signup from login
		await page.click('a:has-text("Sign up")');
		await expect(page).toHaveURL('/signup');

		// Go back to login from signup
		await page.click('a:has-text("Sign in")');
		await expect(page).toHaveURL('/login');
	});

	test('forgot password link is present and accessible', async ({ page }) => {
		await page.goto('/login');

		const forgotPasswordLink = page.locator('a:has-text("Forgot password?")');
		await expect(forgotPasswordLink).toBeVisible();
		await expect(forgotPasswordLink).toHaveAttribute('href', '/forgot-password');

		// Check keyboard accessibility
		await forgotPasswordLink.focus();
		await expect(forgotPasswordLink).toBeFocused();
	});

	test('social login buttons are present', async ({ page }) => {
		await page.goto('/login');

		const googleButton = page.locator('button:has-text("Sign in with Google")');
		await expect(googleButton).toBeVisible();

		await page.goto('/signup');

		const googleSignupButton = page.locator('button:has-text("Sign up with Google")');
		await expect(googleSignupButton).toBeVisible();
	});

	test('forms handle keyboard navigation properly', async ({ page }) => {
		await page.goto('/login');

		// Tab through form elements
		await page.keyboard.press('Tab'); // Email input
		await expect(page.locator('input[type="email"]')).toBeFocused();

		await page.keyboard.press('Tab'); // Password input
		await expect(page.locator('input[type="password"]')).toBeFocused();

		await page.keyboard.press('Tab'); // Forgot password link
		await expect(page.locator('a:has-text("Forgot password?")')).toBeFocused();

		await page.keyboard.press('Tab'); // Submit button
		await expect(page.locator('button[type="submit"]')).toBeFocused();
	});

	test('error messages have proper ARIA attributes', async ({ page }) => {
		await page.goto('/signup');

		// Trigger validation error
		const nameInput = page.locator('input[placeholder="John Doe"]');
		await nameInput.fill('A'); // Too short
		await nameInput.blur();

		// Check for error message with proper ARIA
		const errorMessage = page.locator('text=Name must be at least 2 characters');
		await expect(errorMessage).toBeVisible();
		
		// Error should be announced to screen readers
		await expect(nameInput).toHaveAttribute('aria-invalid', 'true');
	});
});