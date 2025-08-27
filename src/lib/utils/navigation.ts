/**
 * Navigation utilities for keyboard navigation and accessibility
 */

export interface NavigationItem {
	title: string;
	url: string;
	icon?: any;
	items?: NavigationItem[];
}

/**
 * Handle keyboard navigation within a menu
 */
export function handleMenuKeyNavigation(
	event: KeyboardEvent,
	menuItems: NodeListOf<Element> | Element[],
	currentIndex: number
): number {
	let newIndex = currentIndex;

	switch (event.key) {
		case 'ArrowDown':
			event.preventDefault();
			newIndex = (currentIndex + 1) % menuItems.length;
			break;
		case 'ArrowUp':
			event.preventDefault();
			newIndex = currentIndex === 0 ? menuItems.length - 1 : currentIndex - 1;
			break;
		case 'Home':
			event.preventDefault();
			newIndex = 0;
			break;
		case 'End':
			event.preventDefault();
			newIndex = menuItems.length - 1;
			break;
		case 'Enter':
		case ' ':
			event.preventDefault();
			// Trigger click on current item
			const clickItem = menuItems[currentIndex] as HTMLElement;
			clickItem.click();
			return currentIndex;
		case 'Escape':
			event.preventDefault();
			// Close menu or return to parent
			const escapeItem = menuItems[currentIndex] as HTMLElement;
			escapeItem.blur();
			return currentIndex;
	}

	// Focus the new item
	if (newIndex !== currentIndex && menuItems[newIndex]) {
		const newItem = menuItems[newIndex] as HTMLElement;
		newItem.focus();
	}

	return newIndex;
}

/**
 * Check if a navigation item is active based on current path
 */
export function isNavigationItemActive(item: NavigationItem, currentPath: string): boolean {
	// Check if current path matches the main item URL
	if (currentPath === item.url) {
		return true;
	}

	// Check if current path matches any sub-item URL
	if (item.items) {
		return item.items.some(subItem => 
			currentPath === subItem.url || currentPath.startsWith(subItem.url + '/')
		);
	}

	// Check if current path starts with the item URL (for nested routes)
	return currentPath.startsWith(item.url + '/');
}

/**
 * Check if a specific sub-item is active
 */
export function isSubItemActive(subItem: NavigationItem, currentPath: string): boolean {
	return currentPath === subItem.url || currentPath.startsWith(subItem.url + '/');
}

/**
 * Generate ARIA attributes for navigation items
 */
export function getNavigationAriaAttributes(
	item: NavigationItem,
	isActive: boolean,
	hasSubItems: boolean = false
) {
	const attributes: Record<string, string | boolean | undefined> = {
		'aria-current': isActive ? 'page' : undefined,
	};

	if (hasSubItems) {
		attributes['aria-expanded'] = isActive;
		attributes['aria-haspopup'] = 'menu';
	}

	return attributes;
}

/**
 * Focus management for skip links
 */
export function focusSkipTarget(targetId: string): void {
	const target = document.getElementById(targetId.replace('#', ''));
	if (target) {
		// Make target focusable if it isn't already
		if (!target.hasAttribute('tabindex')) {
			target.setAttribute('tabindex', '-1');
		}
		
		// Focus the target element
		target.focus();
		
		// Scroll to target
		target.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}
}

/**
 * Announce navigation changes to screen readers
 */
export function announceNavigationChange(message: string): void {
	// Create or update live region for announcements
	let liveRegion = document.getElementById('navigation-announcements');
	
	if (!liveRegion) {
		liveRegion = document.createElement('div');
		liveRegion.id = 'navigation-announcements';
		liveRegion.setAttribute('aria-live', 'polite');
		liveRegion.setAttribute('aria-atomic', 'true');
		liveRegion.className = 'sr-only';
		document.body.appendChild(liveRegion);
	}
	
	// Clear and set new message
	liveRegion.textContent = '';
	setTimeout(() => {
		liveRegion!.textContent = message;
	}, 100);
}