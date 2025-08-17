import { test, expect } from '@playwright/test';

test.describe('Performance Testing', () => {
	test('homepage loads within performance budget', async ({ page }) => {
		// Start performance monitoring
		const startTime = Date.now();

		// Navigate to homepage
		await page.goto('/');

		// Wait for page to be fully loaded
		await page.waitForLoadState('networkidle');

		const loadTime = Date.now() - startTime;

		// Performance budget: page should load within 3 seconds
		expect(loadTime).toBeLessThan(3000);

		// Check Core Web Vitals
		const webVitals = await page.evaluate(() => {
			return new Promise((resolve) => {
				const vitals: Record<string, number> = {};
				
				// Largest Contentful Paint (LCP)
				new PerformanceObserver((list) => {
					const entries = list.getEntries();
					const lastEntry = entries[entries.length - 1];
					vitals.lcp = lastEntry.startTime;
				}).observe({ entryTypes: ['largest-contentful-paint'] });

				// First Input Delay (FID) - simulated
				vitals.fid = 0; // Would need real user interaction

				// Cumulative Layout Shift (CLS)
				let clsValue = 0;
				new PerformanceObserver((list) => {
					for (const entry of list.getEntries()) {
						if (!(entry as any).hadRecentInput) {
							clsValue += (entry as any).value;
						}
					}
					vitals.cls = clsValue;
				}).observe({ entryTypes: ['layout-shift'] });

				// Give time for metrics to be collected
				setTimeout(() => resolve(vitals), 2000);
			});
		});

		// Core Web Vitals thresholds
		if ((webVitals as any).lcp) {
			expect((webVitals as any).lcp).toBeLessThan(2500); // LCP < 2.5s
		}
		if ((webVitals as any).cls !== undefined) {
			expect((webVitals as any).cls).toBeLessThan(0.1); // CLS < 0.1
		}
	});

	test('images are optimized and load efficiently', async ({ page }) => {
		await page.goto('/');

		// Get all images on the page
		const images = page.locator('img');
		const imageCount = await images.count();

		if (imageCount > 0) {
			for (let i = 0; i < imageCount; i++) {
				const img = images.nth(i);
				
				// Check if image has proper attributes
				const src = await img.getAttribute('src');
				const alt = await img.getAttribute('alt');
				const loading = await img.getAttribute('loading');

				// Images should have src and alt attributes
				expect(src).toBeTruthy();
				expect(alt).not.toBeNull(); // Alt can be empty for decorative images

				// Non-critical images should have lazy loading
				if (i > 2) { // First few images might not be lazy loaded
					expect(loading).toBe('lazy');
				}

				// Check if image uses modern formats
				if (src) {
					const isModernFormat = src.includes('.webp') || src.includes('.avif');
					// Note: This is optional, depends on implementation
				}
			}
		}
	});

	test('CSS and JavaScript are minified and compressed', async ({ page }) => {
		// Monitor network requests
		const responses: any[] = [];
		
		page.on('response', (response) => {
			responses.push({
				url: response.url(),
				status: response.status(),
				headers: response.headers(),
				size: response.headers()['content-length']
			});
		});

		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// Check CSS files
		const cssResponses = responses.filter(r => r.url.includes('.css'));
		for (const css of cssResponses) {
			// Should have compression headers
			expect(css.headers['content-encoding']).toMatch(/gzip|br|deflate/);
		}

		// Check JavaScript files
		const jsResponses = responses.filter(r => r.url.includes('.js'));
		for (const js of jsResponses) {
			// Should have compression headers
			expect(js.headers['content-encoding']).toMatch(/gzip|br|deflate/);
		}
	});

	test('fonts load efficiently without layout shift', async ({ page }) => {
		await page.goto('/');

		// Check for font loading optimization
		const fontFaces = await page.evaluate(() => {
			return Array.from(document.fonts).map(font => ({
				family: font.family,
				status: font.status,
				display: font.display
			}));
		});

		// Fonts should be loaded or loading
		for (const font of fontFaces) {
			expect(['loaded', 'loading', 'unloaded']).toContain(font.status);
		}

		// Check for font-display optimization in CSS
		const stylesheets = await page.evaluate(() => {
			return Array.from(document.styleSheets).map(sheet => {
				try {
					return Array.from(sheet.cssRules).map(rule => rule.cssText).join('');
				} catch {
					return '';
				}
			}).join('');
		});

		// Should use font-display: swap or similar for web fonts
		if (stylesheets.includes('@font-face')) {
			expect(stylesheets).toMatch(/font-display:\s*(swap|fallback|optional)/);
		}
	});

	test('page uses efficient caching strategies', async ({ page }) => {
		const responses: any[] = [];
		
		page.on('response', (response) => {
			responses.push({
				url: response.url(),
				headers: response.headers()
			});
		});

		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// Check static assets have proper cache headers
		const staticAssets = responses.filter(r => 
			r.url.includes('.css') || 
			r.url.includes('.js') || 
			r.url.includes('.png') || 
			r.url.includes('.jpg') || 
			r.url.includes('.webp')
		);

		for (const asset of staticAssets) {
			// Should have cache control headers
			const cacheControl = asset.headers['cache-control'];
			if (cacheControl) {
				// Static assets should have long cache times
				expect(cacheControl).toMatch(/max-age=\d+/);
			}
		}
	});

	test('page has minimal render-blocking resources', async ({ page }) => {
		const startTime = Date.now();
		
		await page.goto('/');
		
		// Wait for first contentful paint
		await page.waitForFunction(() => {
			return performance.getEntriesByType('paint').length > 0;
		});

		const paintEntries = await page.evaluate(() => {
			return performance.getEntriesByType('paint').map(entry => ({
				name: entry.name,
				startTime: entry.startTime
			}));
		});

		// First Contentful Paint should happen quickly
		const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
		if (fcp) {
			expect(fcp.startTime).toBeLessThan(1500); // FCP < 1.5s
		}
	});

	test('JavaScript bundles are optimized', async ({ page }) => {
		const responses: any[] = [];
		
		page.on('response', (response) => {
			responses.push({
				url: response.url(),
				size: parseInt(response.headers()['content-length'] || '0'),
				type: response.headers()['content-type']
			});
		});

		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// Check JavaScript bundle sizes
		const jsResponses = responses.filter(r => 
			r.url.includes('.js') && r.type?.includes('javascript')
		);

		let totalJSSize = 0;
		for (const js of jsResponses) {
			totalJSSize += js.size;
		}

		// Total JavaScript should be under reasonable limit (adjust as needed)
		expect(totalJSSize).toBeLessThan(500000); // 500KB total JS
	});

	test('page handles slow network conditions gracefully', async ({ page }) => {
		// Simulate slow 3G connection
		await page.route('**/*', async (route) => {
			await new Promise(resolve => setTimeout(resolve, 100)); // Add 100ms delay
			await route.continue();
		});

		const startTime = Date.now();
		await page.goto('/');

		// Page should still be usable even with slow connection
		await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
		
		const loadTime = Date.now() - startTime;
		
		// Should handle slow connections reasonably
		expect(loadTime).toBeLessThan(10000); // 10 seconds max
	});

	test('page uses resource hints effectively', async ({ page }) => {
		await page.goto('/');

		// Check for resource hints in the HTML
		const resourceHints = await page.evaluate(() => {
			const hints = [];
			
			// DNS prefetch
			const dnsPrefetch = document.querySelectorAll('link[rel="dns-prefetch"]');
			hints.push(...Array.from(dnsPrefetch).map(link => ({
				type: 'dns-prefetch',
				href: link.getAttribute('href')
			})));

			// Preconnect
			const preconnect = document.querySelectorAll('link[rel="preconnect"]');
			hints.push(...Array.from(preconnect).map(link => ({
				type: 'preconnect',
				href: link.getAttribute('href')
			})));

			// Preload
			const preload = document.querySelectorAll('link[rel="preload"]');
			hints.push(...Array.from(preload).map(link => ({
				type: 'preload',
				href: link.getAttribute('href'),
				as: link.getAttribute('as')
			})));

			return hints;
		});

		// Should have some resource hints for optimization
		if (resourceHints.length > 0) {
			// Verify hints are properly formatted
			for (const hint of resourceHints) {
				expect(hint.href).toBeTruthy();
				if (hint.type === 'preload') {
					expect(hint.as).toBeTruthy();
				}
			}
		}
	});

	test('page minimizes layout shifts during load', async ({ page }) => {
		let layoutShifts: any[] = [];

		// Monitor layout shifts
		await page.addInitScript(() => {
			new PerformanceObserver((list) => {
				for (const entry of list.getEntries()) {
					(window as any).layoutShifts = (window as any).layoutShifts || [];
					(window as any).layoutShifts.push({
						value: (entry as any).value,
						hadRecentInput: (entry as any).hadRecentInput,
						startTime: entry.startTime
					});
				}
			}).observe({ entryTypes: ['layout-shift'] });
		});

		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// Get layout shifts
		layoutShifts = await page.evaluate(() => (window as any).layoutShifts || []);

		// Calculate CLS
		let cls = 0;
		for (const shift of layoutShifts) {
			if (!shift.hadRecentInput) {
				cls += shift.value;
			}
		}

		// CLS should be minimal
		expect(cls).toBeLessThan(0.1);
	});

	test('API responses are optimized', async ({ page }) => {
		const apiResponses: any[] = [];
		
		page.on('response', (response) => {
			if (response.url().includes('/api/')) {
				apiResponses.push({
					url: response.url(),
					status: response.status(),
					headers: response.headers(),
					timing: response.timing()
				});
			}
		});

		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// Check API response times
		for (const apiResponse of apiResponses) {
			// API responses should be fast
			if (apiResponse.timing) {
				const responseTime = apiResponse.timing.responseEnd - apiResponse.timing.requestStart;
				expect(responseTime).toBeLessThan(1000); // 1 second max
			}

			// Should have proper headers
			expect(apiResponse.headers['content-type']).toBeTruthy();
		}
	});

	test('page works offline with service worker', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// Check if service worker is registered
		const hasServiceWorker = await page.evaluate(() => {
			return 'serviceWorker' in navigator;
		});

		if (hasServiceWorker) {
			const swRegistration = await page.evaluate(async () => {
				const registration = await navigator.serviceWorker.getRegistration();
				return !!registration;
			});

			if (swRegistration) {
				// Test offline functionality
				await page.setOfflineMode(true);
				
				// Page should still work (at least partially)
				await page.reload();
				
				// Should show some content or offline message
				await expect(page.locator('body')).not.toBeEmpty();
				
				await page.setOfflineMode(false);
			}
		}
	});
});