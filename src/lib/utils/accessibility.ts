/**
 * Accessibility utilities and helpers
 */

/**
 * Generate unique IDs for form elements and ARIA relationships
 */
export function generateId(prefix: string = 'id'): string {
	return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Announce text to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
	if (typeof document === 'undefined') return;

	const announcement = document.createElement('div');
	announcement.setAttribute('aria-live', priority);
	announcement.setAttribute('aria-atomic', 'true');
	announcement.className = 'sr-only';
	announcement.textContent = message;

	document.body.appendChild(announcement);

	// Remove after announcement
	setTimeout(() => {
		document.body.removeChild(announcement);
	}, 1000);
}

/**
 * Trap focus within an element (for modals, dropdowns, etc.)
 */
export function trapFocus(element: HTMLElement): () => void {
	const focusableElements = element.querySelectorAll(
		'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
	) as NodeListOf<HTMLElement>;

	const firstFocusable = focusableElements[0];
	const lastFocusable = focusableElements[focusableElements.length - 1];

	function handleTabKey(e: KeyboardEvent) {
		if (e.key !== 'Tab') return;

		if (e.shiftKey) {
			// Shift + Tab
			if (document.activeElement === firstFocusable) {
				lastFocusable.focus();
				e.preventDefault();
			}
		} else {
			// Tab
			if (document.activeElement === lastFocusable) {
				firstFocusable.focus();
				e.preventDefault();
			}
		}
	}

	function handleEscapeKey(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			// Dispatch custom event for parent components to handle
			element.dispatchEvent(new CustomEvent('escape-pressed'));
		}
	}

	element.addEventListener('keydown', handleTabKey);
	element.addEventListener('keydown', handleEscapeKey);

	// Focus first element
	firstFocusable?.focus();

	// Return cleanup function
	return () => {
		element.removeEventListener('keydown', handleTabKey);
		element.removeEventListener('keydown', handleEscapeKey);
	};
}

/**
 * Check if an element is visible to screen readers
 */
export function isVisibleToScreenReader(element: HTMLElement): boolean {
	const style = window.getComputedStyle(element);
	
	return !(
		style.display === 'none' ||
		style.visibility === 'hidden' ||
		element.hasAttribute('aria-hidden') ||
		element.getAttribute('aria-hidden') === 'true'
	);
}

/**
 * Get accessible name for an element
 */
export function getAccessibleName(element: HTMLElement): string {
	// Check aria-label first
	const ariaLabel = element.getAttribute('aria-label');
	if (ariaLabel) return ariaLabel;

	// Check aria-labelledby
	const ariaLabelledBy = element.getAttribute('aria-labelledby');
	if (ariaLabelledBy) {
		const labelElement = document.getElementById(ariaLabelledBy);
		if (labelElement) return labelElement.textContent || '';
	}

	// Check associated label for form elements
	if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
		const labels = element.labels;
		if (labels && labels.length > 0) {
			return labels[0].textContent || '';
		}
	}

	// Fall back to text content
	return element.textContent || '';
}

/**
 * Validate color contrast ratio
 */
export function getContrastRatio(foreground: string, background: string): number {
	// Convert hex to RGB
	function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
		const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result ? {
			r: parseInt(result[1], 16),
			g: parseInt(result[2], 16),
			b: parseInt(result[3], 16)
		} : null;
	}

	// Calculate relative luminance
	function getLuminance(r: number, g: number, b: number): number {
		const [rs, gs, bs] = [r, g, b].map(c => {
			c = c / 255;
			return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
		});
		return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
	}

	const fgRgb = hexToRgb(foreground);
	const bgRgb = hexToRgb(background);

	if (!fgRgb || !bgRgb) return 0;

	const fgLuminance = getLuminance(fgRgb.r, fgRgb.g, fgRgb.b);
	const bgLuminance = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);

	const lighter = Math.max(fgLuminance, bgLuminance);
	const darker = Math.min(fgLuminance, bgLuminance);

	return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG standards
 */
export function meetsContrastRequirement(
	foreground: string, 
	background: string, 
	level: 'AA' | 'AAA' = 'AA',
	size: 'normal' | 'large' = 'normal'
): boolean {
	const ratio = getContrastRatio(foreground, background);
	
	if (level === 'AAA') {
		return size === 'large' ? ratio >= 4.5 : ratio >= 7;
	} else {
		return size === 'large' ? ratio >= 3 : ratio >= 4.5;
	}
}

/**
 * Create skip link for keyboard navigation
 */
export function createSkipLink(targetId: string, text: string = 'Skip to main content'): HTMLElement {
	const skipLink = document.createElement('a');
	skipLink.href = `#${targetId}`;
	skipLink.textContent = text;
	skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg';
	
	return skipLink;
}

/**
 * Manage focus for single-page applications
 */
export class FocusManager {
	private previousFocus: HTMLElement | null = null;

	/**
	 * Save current focus and move to new element
	 */
	moveFocus(element: HTMLElement, savePrevious: boolean = true): void {
		if (savePrevious) {
			this.previousFocus = document.activeElement as HTMLElement;
		}
		
		element.focus();
		
		// Announce focus change to screen readers
		const accessibleName = getAccessibleName(element);
		if (accessibleName) {
			announceToScreenReader(`Focused on ${accessibleName}`);
		}
	}

	/**
	 * Return focus to previously focused element
	 */
	returnFocus(): void {
		if (this.previousFocus && document.contains(this.previousFocus)) {
			this.previousFocus.focus();
			this.previousFocus = null;
		}
	}

	/**
	 * Focus first focusable element in container
	 */
	focusFirst(container: HTMLElement): void {
		const focusable = container.querySelector(
			'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
		) as HTMLElement;
		
		if (focusable) {
			this.moveFocus(focusable);
		}
	}
}

/**
 * Keyboard navigation helpers
 */
export const KeyboardNavigation = {
	/**
	 * Handle arrow key navigation in lists
	 */
	handleArrowKeys(
		event: KeyboardEvent,
		items: HTMLElement[],
		currentIndex: number,
		options: {
			loop?: boolean;
			orientation?: 'horizontal' | 'vertical' | 'both';
		} = {}
	): number {
		const { loop = true, orientation = 'vertical' } = options;
		let newIndex = currentIndex;

		switch (event.key) {
			case 'ArrowDown':
				if (orientation === 'vertical' || orientation === 'both') {
					newIndex = loop && currentIndex === items.length - 1 ? 0 : Math.min(currentIndex + 1, items.length - 1);
					event.preventDefault();
				}
				break;
			case 'ArrowUp':
				if (orientation === 'vertical' || orientation === 'both') {
					newIndex = loop && currentIndex === 0 ? items.length - 1 : Math.max(currentIndex - 1, 0);
					event.preventDefault();
				}
				break;
			case 'ArrowRight':
				if (orientation === 'horizontal' || orientation === 'both') {
					newIndex = loop && currentIndex === items.length - 1 ? 0 : Math.min(currentIndex + 1, items.length - 1);
					event.preventDefault();
				}
				break;
			case 'ArrowLeft':
				if (orientation === 'horizontal' || orientation === 'both') {
					newIndex = loop && currentIndex === 0 ? items.length - 1 : Math.max(currentIndex - 1, 0);
					event.preventDefault();
				}
				break;
			case 'Home':
				newIndex = 0;
				event.preventDefault();
				break;
			case 'End':
				newIndex = items.length - 1;
				event.preventDefault();
				break;
		}

		if (newIndex !== currentIndex) {
			items[newIndex]?.focus();
		}

		return newIndex;
	},

	/**
	 * Handle typeahead search in lists
	 */
	handleTypeahead(
		event: KeyboardEvent,
		items: HTMLElement[],
		currentIndex: number,
		getItemText: (item: HTMLElement) => string = (item) => item.textContent || ''
	): number {
		if (event.key.length !== 1 || event.ctrlKey || event.altKey || event.metaKey) {
			return currentIndex;
		}

		const searchChar = event.key.toLowerCase();
		const startIndex = (currentIndex + 1) % items.length;

		// Search from current position forward
		for (let i = 0; i < items.length; i++) {
			const index = (startIndex + i) % items.length;
			const item = items[index];
			const text = getItemText(item).toLowerCase();

			if (text.startsWith(searchChar)) {
				item.focus();
				return index;
			}
		}

		return currentIndex;
	}
};

/**
 * ARIA live region manager
 */
export class LiveRegionManager {
	private regions: Map<string, HTMLElement> = new Map();

	/**
	 * Create or get a live region
	 */
	getRegion(id: string, priority: 'polite' | 'assertive' = 'polite'): HTMLElement {
		if (this.regions.has(id)) {
			return this.regions.get(id)!;
		}

		const region = document.createElement('div');
		region.id = id;
		region.setAttribute('aria-live', priority);
		region.setAttribute('aria-atomic', 'true');
		region.className = 'sr-only';
		
		document.body.appendChild(region);
		this.regions.set(id, region);

		return region;
	}

	/**
	 * Announce message in a live region
	 */
	announce(message: string, regionId: string = 'default', priority: 'polite' | 'assertive' = 'polite'): void {
		const region = this.getRegion(regionId, priority);
		region.textContent = message;

		// Clear after announcement
		setTimeout(() => {
			region.textContent = '';
		}, 1000);
	}

	/**
	 * Clean up all regions
	 */
	cleanup(): void {
		this.regions.forEach(region => {
			if (document.body.contains(region)) {
				document.body.removeChild(region);
			}
		});
		this.regions.clear();
	}
}

// Global instances
export const focusManager = new FocusManager();
export const liveRegionManager = new LiveRegionManager();