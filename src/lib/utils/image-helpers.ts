/**
 * Helper functions for working with optimized images in components
 */

export interface OptimizedImageSources {
	webp?: string;
	avif?: string;
	fallback: string;
	srcset?: string;
	sizes?: string;
}

export interface ResponsiveImageConfig {
	src: string;
	alt: string;
	width?: number;
	height?: number;
	sizes?: string;
	priority?: boolean;
	className?: string;
}

/**
 * Generate optimized image sources for a given image
 */
export function getOptimizedImageSources(
	src: string,
	options: {
		width?: number;
		height?: number;
		quality?: number;
		generateResponsive?: boolean;
	} = {}
): OptimizedImageSources {
	const { width, height, quality = 85, generateResponsive = true } = options;
	
	// Extract filename without extension
	const pathParts = src.split('/');
	const filename = pathParts[pathParts.length - 1];
	const baseName = filename.split('.')[0];
	const baseDir = pathParts.slice(0, -1).join('/');
	
	// Generate optimized paths
	const optimizedDir = '/optimized';
	
	let sources: OptimizedImageSources = {
		fallback: src
	};

	if (generateResponsive) {
		// Generate responsive srcsets
		const responsiveSizes = [640, 768, 1024, 1280, 1536];
		
		const webpSrcset = responsiveSizes
			.map(size => `${optimizedDir}/${baseName}-${size}w.webp ${size}w`)
			.join(', ');
		
		const avifSrcset = responsiveSizes
			.map(size => `${optimizedDir}/${baseName}-${size}w.avif ${size}w`)
			.join(', ');
		
		const fallbackSrcset = responsiveSizes
			.map(size => `${optimizedDir}/${baseName}-${size}w.jpg ${size}w`)
			.join(', ');

		sources = {
			webp: webpSrcset,
			avif: avifSrcset,
			fallback: src,
			srcset: fallbackSrcset,
			sizes: '(min-width: 1536px) 1536px, (min-width: 1280px) 1280px, (min-width: 1024px) 1024px, (min-width: 768px) 768px, (min-width: 640px) 640px, 100vw'
		};
	} else {
		// Single optimized image
		const suffix = width ? `-${width}w` : '';
		
		sources = {
			webp: `${optimizedDir}/${baseName}${suffix}.webp`,
			avif: `${optimizedDir}/${baseName}${suffix}.avif`,
			fallback: `${optimizedDir}/${baseName}${suffix}.jpg`
		};
	}

	return sources;
}

/**
 * Generate placeholder image data URL
 */
export function generatePlaceholderDataUrl(
	width: number = 20,
	height: number = 20,
	color: string = '#f3f4f6'
): string {
	// Create a simple SVG placeholder
	const svg = `
		<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
			<rect width="100%" height="100%" fill="${color}"/>
		</svg>
	`;
	
	return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Calculate aspect ratio from width and height
 */
export function calculateAspectRatio(width: number, height: number): string {
	const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
	const divisor = gcd(width, height);
	return `${width / divisor} / ${height / divisor}`;
}

/**
 * Generate sizes attribute for responsive images
 */
export function generateSizesAttribute(
	breakpoints: { [key: string]: string } = {}
): string {
	const defaultBreakpoints = {
		'(min-width: 1536px)': '1536px',
		'(min-width: 1280px)': '1280px',
		'(min-width: 1024px)': '1024px',
		'(min-width: 768px)': '768px',
		'(min-width: 640px)': '640px'
	};

	const allBreakpoints = { ...defaultBreakpoints, ...breakpoints };
	
	const sizeEntries = Object.entries(allBreakpoints).map(([query, size]) => `${query} ${size}`);
	sizeEntries.push('100vw'); // Default fallback
	
	return sizeEntries.join(', ');
}

/**
 * Check if WebP is supported in the browser
 */
export function supportsWebP(): Promise<boolean> {
	return new Promise((resolve) => {
		const webP = new Image();
		webP.onload = webP.onerror = () => {
			resolve(webP.height === 2);
		};
		webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
	});
}

/**
 * Check if AVIF is supported in the browser
 */
export function supportsAVIF(): Promise<boolean> {
	return new Promise((resolve) => {
		const avif = new Image();
		avif.onload = avif.onerror = () => {
			resolve(avif.height === 2);
		};
		avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
	});
}

/**
 * Get the best supported image format
 */
export async function getBestImageFormat(): Promise<'avif' | 'webp' | 'jpeg'> {
	if (await supportsAVIF()) {
		return 'avif';
	} else if (await supportsWebP()) {
		return 'webp';
	} else {
		return 'jpeg';
	}
}

/**
 * Preload critical images
 */
export function preloadImage(src: string, as: 'image' = 'image'): void {
	if (typeof document === 'undefined') return;

	const link = document.createElement('link');
	link.rel = 'preload';
	link.as = as;
	link.href = src;
	document.head.appendChild(link);
}

/**
 * Preload responsive images
 */
export function preloadResponsiveImage(sources: OptimizedImageSources): void {
	if (typeof document === 'undefined') return;

	// Preload the most appropriate format
	getBestImageFormat().then(format => {
		let srcToPreload = sources.fallback;
		
		if (format === 'avif' && sources.avif) {
			srcToPreload = sources.avif.split(' ')[0]; // Get first source from srcset
		} else if (format === 'webp' && sources.webp) {
			srcToPreload = sources.webp.split(' ')[0]; // Get first source from srcset
		}
		
		preloadImage(srcToPreload);
	});
}

/**
 * Lazy load image with intersection observer
 */
export function lazyLoadImage(
	img: HTMLImageElement,
	src: string,
	options: IntersectionObserverInit = {}
): void {
	if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
		// Fallback for browsers without IntersectionObserver
		img.src = src;
		return;
	}

	const observer = new IntersectionObserver((entries) => {
		entries.forEach(entry => {
			if (entry.isIntersecting) {
				img.src = src;
				img.classList.remove('lazy');
				observer.unobserve(img);
			}
		});
	}, {
		rootMargin: '50px',
		...options
	});

	observer.observe(img);
}