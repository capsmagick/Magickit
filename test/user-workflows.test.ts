import { test, expect } from '@playwright/test';

test.describe('User Workflows', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
	});

	test('complete user registration workflow', async ({ page }) => {
		// Navigate to signup
		await page.click('button:has-text("Sign Up")');
		await expect(page).toHaveURL('/signup');

		// Fill registration form
		await page.fill('input[placeholder="John Doe"]', 'Test User');
		await page.fill('input[type="email"]', 'testuser@example.com');
		await page.fill('input[type="password"]:first-of-type', 'SecurePassword123');
		await page.fill('input[type="password"]:last-of-type', 'SecurePassword123');

		// Verify password strength indicator
		await expect(page.locator('text=Password strength: Good')).toBeVisible();
		await expect(page.locator('text=Passwords match')).toBeVisible();

		// Submit form
		await page.click('button[type="submit"]');

		// Should show loading state
		await expect(page.locator('text=Creating account...')).toBeVisible({ timeout: 1000 });

		// Note: In a real test, you'd mock the API or use test credentials
		// For now, we just verify the form submission attempt
	});

	test('contact form submission workflow', async ({ page }) => {
		// Navigate to contact page
		await page.click('a:has-text("Contact")');
		await expect(page).toHaveURL('/contact');

		// Verify contact form is present
		await expect(page.locator('form')).toBeVisible();

		// Fill contact form
		await page.fill('input[name="name"], input[placeholder*="name" i]', 'John Doe');
		await page.fill('input[type="email"]', 'john@example.com');
		await page.fill('input[name="subject"], input[placeholder*="subject" i]', 'Test Inquiry');
		await page.fill('textarea', 'This is a test message for the contact form.');

		// Submit form
		const submitButton = page.locator('button[type="submit"], input[type="submit"]');
		await submitButton.click();

		// Should show loading state
		await expect(page.locator('text=Sending..., text=Submitting...')).toBeVisible({ timeout: 1000 });

		// Form should be validated before submission
		const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]');
		await expect(nameInput).toHaveAttribute('required');
	});

	test('newsletter signup workflow', async ({ page }) => {
		// Scroll to footer where newsletter signup typically is
		await page.locator('footer').scrollIntoViewIfNeeded();

		// Look for newsletter signup form
		const newsletterForm = page.locator('form:has(input[type="email"]):has(button:has-text("Subscribe"))');
		
		if (await newsletterForm.count() > 0) {
			const emailInput = newsletterForm.locator('input[type="email"]');
			const subscribeButton = newsletterForm.locator('button:has-text("Subscribe")');

			// Fill email
			await emailInput.fill('newsletter@example.com');

			// Submit
			await subscribeButton.click();

			// Should show loading state
			await expect(page.locator('text=Subscribing...')).toBeVisible({ timeout: 1000 });
		}
	});

	test('search functionality workflow', async ({ page }) => {
		// Look for search functionality
		const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
		
		if (await searchInput.count() > 0) {
			// Perform search
			await searchInput.fill('test query');
			
			// Submit search (either by pressing Enter or clicking search button)
			const searchButton = page.locator('button:has-text("Search")');
			if (await searchButton.count() > 0) {
				await searchButton.click();
			} else {
				await searchInput.press('Enter');
			}

			// Should navigate to search results or show results
			const currentUrl = page.url();
			expect(currentUrl).toMatch(/search|query/);
		}
	});

	test('responsive design workflow', async ({ page }) => {
		// Test different viewport sizes
		const viewports = [
			{ width: 1920, height: 1080, name: 'Desktop' },
			{ width: 768, height: 1024, name: 'Tablet' },
			{ width: 375, height: 667, name: 'Mobile' }
		];

		for (const viewport of viewports) {
			await page.setViewportSize({ width: viewport.width, height: viewport.height });

			// Check that main content is visible
			await expect(page.locator('h1')).toBeVisible();

			// Check navigation is accessible
			if (viewport.width < 768) {
				// Mobile: should have hamburger menu
				const mobileMenu = page.locator('button[aria-label="Toggle menu"], button:has-text("Menu")');
				await expect(mobileMenu).toBeVisible();
			} else {
				// Desktop/Tablet: should have regular navigation
				const desktopNav = page.locator('nav[aria-label="Main navigation"]');
				await expect(desktopNav).toBeVisible();
			}

			// Check that content doesn't overflow
			const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
			expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 20); // Allow small margin
		}
	});

	test('accessibility workflow with screen reader simulation', async ({ page }) => {
		// Test page structure for screen readers
		await page.goto('/');

		// Check landmark regions
		const landmarks = [
			'header',
			'nav',
			'main',
			'footer'
		];

		for (const landmark of landmarks) {
			const element = page.locator(landmark);
			if (await element.count() > 0) {
				await expect(element).toBeVisible();
			}
		}

		// Check heading structure
		const h1 = page.locator('h1');
		await expect(h1).toHaveCount(1); // Should have exactly one h1

		// Test keyboard navigation through interactive elements
		const interactiveElements = page.locator('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
		const count = await interactiveElements.count();

		if (count > 0) {
			// Tab through first few elements
			for (let i = 0; i < Math.min(5, count); i++) {
				await page.keyboard.press('Tab');
				
				// Verify focus is visible
				const focusedElement = await page.evaluate(() => {
					const focused = document.activeElement;
					return focused ? {
						tagName: focused.tagName,
						visible: focused.offsetWidth > 0 && focused.offsetHeight > 0
					} : null;
				});

				expect(focusedElement?.visible).toBe(true);
			}
		}
	});

	test('form error handling workflow', async ({ page }) => {
		await page.goto('/contact');

		// Submit empty form to trigger validation
		const submitButton = page.locator('button[type="submit"], input[type="submit"]');
		await submitButton.click();

		// Check for HTML5 validation or custom error messages
		const requiredInputs = page.locator('input[required], textarea[required]');
		const requiredCount = await requiredInputs.count();

		for (let i = 0; i < requiredCount; i++) {
			const input = requiredInputs.nth(i);
			
			// Should have validation state
			const isInvalid = await input.evaluate((el: HTMLInputElement) => !el.validity.valid);
			if (isInvalid) {
				// Should show error message or have aria-invalid
				const ariaInvalid = await input.getAttribute('aria-invalid');
				const hasErrorMessage = await page.locator(`[id*="error"]:has-text("required")`).count() > 0;
				
				expect(ariaInvalid === 'true' || hasErrorMessage).toBe(true);
			}
		}
	});

	test('page loading and performance workflow', async ({ page }) => {
		// Test page load performance
		const startTime = Date.now();
		
		await page.goto('/');
		
		// Wait for page to be fully loaded
		await page.waitForLoadState('networkidle');
		
		const loadTime = Date.now() - startTime;
		
		// Page should load within reasonable time (adjust threshold as needed)
		expect(loadTime).toBeLessThan(5000); // 5 seconds

		// Check that critical content is visible quickly
		await expect(page.locator('h1')).toBeVisible();
		await expect(page.locator('nav')).toBeVisible();

		// Check for loading indicators if present
		const loadingIndicators = page.locator('[aria-label*="loading"], .loading, .spinner');
		if (await loadingIndicators.count() > 0) {
			// Loading indicators should disappear
			await expect(loadingIndicators.first()).not.toBeVisible({ timeout: 10000 });
		}
	});

	test('multi-page navigation workflow', async ({ page }) => {
		// Test navigation through multiple pages
		const navigationFlow = [
			{ page: '/', expectedHeading: /welcome|home|magickit/i },
			{ page: '/about', expectedHeading: /about/i },
			{ page: '/services', expectedHeading: /services|features/i },
			{ page: '/contact', expectedHeading: /contact/i },
			{ page: '/blog', expectedHeading: /blog|news/i }
		];

		for (const step of navigationFlow) {
			await page.goto(step.page);
			
			// Check page loads correctly
			await expect(page.locator('h1')).toBeVisible();
			
			// Check heading content matches expectation
			const headingText = await page.locator('h1').textContent();
			if (headingText) {
				expect(headingText.toLowerCase()).toMatch(step.expectedHeading);
			}

			// Check navigation is consistent across pages
			await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible();
			await expect(page.locator('footer')).toBeVisible();
		}
	});

	test('error recovery workflow', async ({ page }) => {
		// Test 404 error handling
		await page.goto('/non-existent-page');
		
		// Should show error page or redirect
		const currentUrl = page.url();
		const pageTitle = await page.title();
		
		if (currentUrl.includes('404') || pageTitle.includes('404') || pageTitle.includes('Not Found')) {
			// Should have helpful error page
			await expect(page.locator('h1')).toBeVisible();
			
			// Should provide navigation options
			const homeLink = page.locator('a[href="/"], a:has-text("Home")');
			await expect(homeLink.first()).toBeVisible();
			
			// Test navigation back to working page
			await homeLink.first().click();
			await expect(page).toHaveURL('/');
		}
	});

	test('theme switching workflow', async ({ page }) => {
		// Look for theme toggle
		const themeToggle = page.locator('button:has-text("theme"), button[aria-label*="theme"], .theme-toggle');
		
		if (await themeToggle.count() > 0) {
			// Get initial theme
			const initialTheme = await page.evaluate(() => {
				return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
			});

			// Toggle theme
			await themeToggle.click();

			// Wait for theme change
			await page.waitForTimeout(100);

			// Check theme changed
			const newTheme = await page.evaluate(() => {
				return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
			});

			expect(newTheme).not.toBe(initialTheme);

			// Theme should persist across page navigation
			await page.goto('/about');
			
			const persistedTheme = await page.evaluate(() => {
				return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
			});

			expect(persistedTheme).toBe(newTheme);
		}
	});
});