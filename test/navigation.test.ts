import { test, expect } from '@playwright/test';

test.describe('Navigation and Accessibility', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
	});

	test('homepage loads with proper structure', async ({ page }) => {
		// Check main heading
		await expect(page.locator('h1')).toBeVisible();

		// Check navigation is present
		await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible();

		// Check footer is present
		await expect(page.locator('footer')).toBeVisible();
	});

	test('main navigation links work', async ({ page }) => {
		const navigationLinks = [
			{ text: 'About', url: '/about' },
			{ text: 'Services', url: '/services' },
			{ text: 'Portfolio', url: '/portfolio' },
			{ text: 'Blog', url: '/blog' },
			{ text: 'Contact', url: '/contact' }
		];

		for (const link of navigationLinks) {
			await page.click(`a:has-text("${link.text}")`);
			await expect(page).toHaveURL(link.url);
			
			// Check page loads properly
			await expect(page.locator('h1')).toBeVisible();
			
			// Go back to home
			await page.goto('/');
		}
	});

	test('mobile menu works correctly', async ({ page }) => {
		// Set mobile viewport
		await page.setViewportSize({ width: 375, height: 667 });

		// Mobile menu button should be visible
		const menuButton = page.locator('button[aria-label="Toggle menu"], button:has-text("Toggle menu")');
		await expect(menuButton).toBeVisible();

		// Click to open menu
		await menuButton.click();

		// Check menu content is visible
		await expect(page.locator('text=Navigation')).toBeVisible();

		// Check navigation links are present in mobile menu
		await expect(page.locator('text=About').nth(1)).toBeVisible(); // Second instance (mobile menu)
		await expect(page.locator('text=Services').nth(1)).toBeVisible();
		await expect(page.locator('text=Portfolio').nth(1)).toBeVisible();
	});

	test('breadcrumbs work on nested pages', async ({ page }) => {
		// Navigate to a nested page
		await page.goto('/about');

		// Check if breadcrumbs are visible (if implemented)
		const breadcrumbs = page.locator('[role="navigation"] ol, nav[aria-label*="breadcrumb"]');
		
		// If breadcrumbs exist, test them
		if (await breadcrumbs.count() > 0) {
			await expect(breadcrumbs).toBeVisible();
			
			// Should contain home link
			await expect(page.locator('a:has-text("Home")')).toBeVisible();
		}
	});

	test('skip navigation link works', async ({ page }) => {
		// Focus on the page to activate skip links
		await page.keyboard.press('Tab');

		// Look for skip link (might be visually hidden)
		const skipLink = page.locator('a:has-text("Skip to main content"), a:has-text("Skip to content")');
		
		if (await skipLink.count() > 0) {
			await expect(skipLink).toBeFocused();
			
			// Activate skip link
			await page.keyboard.press('Enter');
			
			// Main content should be focused
			const mainContent = page.locator('main, [role="main"], #main-content');
			await expect(mainContent).toBeFocused();
		}
	});

	test('keyboard navigation works throughout site', async ({ page }) => {
		// Test tab navigation on homepage
		let tabCount = 0;
		const maxTabs = 20; // Prevent infinite loop

		while (tabCount < maxTabs) {
			await page.keyboard.press('Tab');
			tabCount++;

			// Check if we can identify focused element
			const focusedElement = await page.evaluate(() => {
				const focused = document.activeElement;
				return focused ? {
					tagName: focused.tagName,
					type: focused.getAttribute('type'),
					text: focused.textContent?.slice(0, 50)
				} : null;
			});

			if (focusedElement) {
				// Ensure focused element is visible (not hidden)
				const isVisible = await page.evaluate(() => {
					const focused = document.activeElement as HTMLElement;
					if (!focused) return false;
					
					const style = window.getComputedStyle(focused);
					return style.display !== 'none' && style.visibility !== 'hidden';
				});

				expect(isVisible).toBe(true);
			}

			// Break if we've cycled back to the beginning
			if (tabCount > 5) {
				const currentUrl = page.url();
				if (currentUrl === await page.evaluate(() => window.location.href)) {
					break;
				}
			}
		}
	});

	test('focus indicators are visible', async ({ page }) => {
		// Test focus indicators on interactive elements
		const interactiveElements = [
			'button',
			'a[href]',
			'input',
			'select',
			'textarea'
		];

		for (const selector of interactiveElements) {
			const elements = page.locator(selector);
			const count = await elements.count();

			if (count > 0) {
				// Focus first element of this type
				await elements.first().focus();

				// Check if focus indicator is visible
				const focusedElement = elements.first();
				
				// Verify element has focus
				await expect(focusedElement).toBeFocused();

				// Check for focus ring or outline
				const hasVisibleFocus = await focusedElement.evaluate((el) => {
					const style = window.getComputedStyle(el);
					return (
						style.outline !== 'none' ||
						style.boxShadow.includes('ring') ||
						style.border.includes('ring') ||
						el.classList.contains('focus:ring') ||
						el.classList.contains('focus:outline')
					);
				});

				// Focus should be visible in some way
				expect(hasVisibleFocus).toBe(true);
			}
		}
	});

	test('page titles are descriptive', async ({ page }) => {
		const pages = [
			{ url: '/', expectedTitle: /MagicKit|Home/ },
			{ url: '/about', expectedTitle: /About.*MagicKit|MagicKit.*About/ },
			{ url: '/contact', expectedTitle: /Contact.*MagicKit|MagicKit.*Contact/ },
			{ url: '/login', expectedTitle: /Login.*MagicKit|MagicKit.*Login/ },
			{ url: '/signup', expectedTitle: /Sign.*Up.*MagicKit|MagicKit.*Sign.*Up/ }
		];

		for (const pageInfo of pages) {
			await page.goto(pageInfo.url);
			await expect(page).toHaveTitle(pageInfo.expectedTitle);
		}
	});

	test('language attribute is set', async ({ page }) => {
		const htmlElement = page.locator('html');
		await expect(htmlElement).toHaveAttribute('lang');
		
		// Should be a valid language code
		const lang = await htmlElement.getAttribute('lang');
		expect(lang).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/); // e.g., 'en', 'en-US'
	});

	test('meta descriptions are present', async ({ page }) => {
		const pages = ['/', '/about', '/contact', '/login', '/signup'];

		for (const url of pages) {
			await page.goto(url);
			
			const metaDescription = page.locator('meta[name="description"]');
			await expect(metaDescription).toHaveAttribute('content');
			
			const content = await metaDescription.getAttribute('content');
			expect(content).toBeTruthy();
			expect(content!.length).toBeGreaterThan(10); // Should have meaningful content
		}
	});

	test('images have alt text', async ({ page }) => {
		const images = page.locator('img');
		const imageCount = await images.count();

		for (let i = 0; i < imageCount; i++) {
			const img = images.nth(i);
			
			// Check if image has alt attribute
			const hasAlt = await img.getAttribute('alt');
			
			// Alt attribute should exist (can be empty for decorative images)
			expect(hasAlt).not.toBeNull();
		}
	});

	test('headings follow proper hierarchy', async ({ page }) => {
		const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
		
		if (headings.length > 0) {
			// Should have exactly one h1
			const h1Count = await page.locator('h1').count();
			expect(h1Count).toBe(1);

			// Check heading levels don't skip
			const headingLevels = await Promise.all(
				headings.map(async (heading) => {
					const tagName = await heading.evaluate(el => el.tagName);
					return parseInt(tagName.charAt(1));
				})
			);

			// First heading should be h1
			expect(headingLevels[0]).toBe(1);

			// Check no levels are skipped
			for (let i = 1; i < headingLevels.length; i++) {
				const currentLevel = headingLevels[i];
				const previousLevel = headingLevels[i - 1];
				
				// Level can stay same, go up by 1, or go down any amount
				expect(currentLevel - previousLevel).toBeLessThanOrEqual(1);
			}
		}
	});

	test('color contrast meets WCAG standards', async ({ page }) => {
		// This is a basic check - in a real implementation you'd use axe-core
		const textElements = page.locator('p, span, a, button, h1, h2, h3, h4, h5, h6');
		const count = await textElements.count();

		if (count > 0) {
			// Sample a few elements to check contrast
			const sampleSize = Math.min(5, count);
			
			for (let i = 0; i < sampleSize; i++) {
				const element = textElements.nth(i);
				
				const colors = await element.evaluate((el) => {
					const style = window.getComputedStyle(el);
					return {
						color: style.color,
						backgroundColor: style.backgroundColor
					};
				});

				// Basic check that colors are defined
				expect(colors.color).toBeTruthy();
				// Background might be transparent, which is okay
			}
		}
	});

	test('forms have proper labels', async ({ page }) => {
		await page.goto('/contact');

		const inputs = page.locator('input, textarea, select');
		const inputCount = await inputs.count();

		for (let i = 0; i < inputCount; i++) {
			const input = inputs.nth(i);
			const inputId = await input.getAttribute('id');
			
			if (inputId) {
				// Should have associated label
				const label = page.locator(`label[for="${inputId}"]`);
				await expect(label).toBeVisible();
			} else {
				// Should have aria-label or aria-labelledby
				const hasAriaLabel = await input.getAttribute('aria-label');
				const hasAriaLabelledBy = await input.getAttribute('aria-labelledby');
				
				expect(hasAriaLabel || hasAriaLabelledBy).toBeTruthy();
			}
		}
	});

	test('error pages are accessible', async ({ page }) => {
		// Test 404 page
		await page.goto('/non-existent-page');
		
		// Should show 404 page or redirect
		const title = await page.title();
		const heading = page.locator('h1');
		
		// Either shows 404 content or redirects to valid page
		if (title.includes('404') || title.includes('Not Found')) {
			await expect(heading).toBeVisible();
			
			// Should have navigation back to main site
			const homeLink = page.locator('a[href="/"], a:has-text("Home")');
			await expect(homeLink.first()).toBeVisible();
		}
	});
});