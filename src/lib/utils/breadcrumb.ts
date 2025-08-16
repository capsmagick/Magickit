export interface BreadcrumbItem {
	label: string;
	href: string;
	isCurrentPage: boolean;
}

export interface BreadcrumbConfig {
	homeLabel?: string;
	homeHref?: string;
	customLabels?: Record<string, string>;
	excludeSegments?: string[];
}

/**
 * Generate breadcrumbs from a path string
 */
export function generateBreadcrumbs(path: string, config: BreadcrumbConfig = {}): BreadcrumbItem[] {
	const { homeLabel = 'Home', homeHref = '/', customLabels = {}, excludeSegments = [] } = config;

	const segments = path.split('/').filter(Boolean);

	// Filter out excluded segments
	const filteredSegments = segments.filter((segment) => !excludeSegments.includes(segment));

	if (filteredSegments.length === 0) {
		return [];
	}

	const breadcrumbs: BreadcrumbItem[] = [];

	// Add path segments
	filteredSegments.forEach((segment, index) => {
		const label = getBreadcrumbLabel(segment, customLabels);
		const href = '/' + filteredSegments.slice(0, index + 1).join('/');
		const isCurrentPage = index === filteredSegments.length - 1;

		breadcrumbs.push({ label, href, isCurrentPage });
	});

	return breadcrumbs;
}

/**
 * Format breadcrumb label (capitalize, replace dashes/underscores, apply custom labels)
 */
export function getBreadcrumbLabel(
	segment: string,
	customLabels: Record<string, string> = {}
): string {
	// Check for custom label first
	if (customLabels[segment]) {
		return customLabels[segment];
	}

	// Default formatting
	return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ').replace(/_/g, ' ');
}

/**
 * Get breadcrumb href from path segments
 */
export function getBreadcrumbHref(segments: string[], index: number): string {
	return '/' + segments.slice(0, index + 1).join('/');
}

/**
 * Check if a path should show breadcrumbs
 */
export function shouldShowBreadcrumbs(path: string, excludePaths: string[] = []): boolean {
	return !excludePaths.some((excludePath) => path.startsWith(excludePath));
}
