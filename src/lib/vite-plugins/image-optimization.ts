/**
 * Vite plugin for automatic image optimization
 */

import type { Plugin } from 'vite';
import { existsSync } from 'fs';
import { mkdir } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

interface ImageOptimizationOptions {
	inputDir?: string;
	outputDir?: string;
	formats?: ('webp' | 'avif' | 'jpeg')[];
	quality?: number;
	enableInDev?: boolean;
}

export function imageOptimization(options: ImageOptimizationOptions = {}): Plugin {
	const {
		inputDir = 'static',
		outputDir = 'static/optimized',
		formats = ['webp', 'avif'],
		quality = 85,
		enableInDev = false
	} = options;

	return {
		name: 'image-optimization',
		configResolved(config) {
			// Only run in build mode unless explicitly enabled in dev
			if (config.command === 'serve' && !enableInDev) {
				return;
			}
		},
		async buildStart() {
			// Ensure output directory exists
			if (!existsSync(outputDir)) {
				await mkdir(outputDir, { recursive: true });
			}
		},
		async load(id) {
			// Intercept image imports and provide optimized versions
			if (id.includes('?optimize')) {
				const [imagePath, query] = id.split('?');
				const params = new URLSearchParams(query);
				
				if (params.has('optimize')) {
					const width = params.get('width') ? parseInt(params.get('width')) : undefined;
					const height = params.get('height') ? parseInt(params.get('height')) : undefined;
					const format = params.get('format') || 'webp';
					
					// Generate optimized image
					const baseName = path.parse(imagePath).name;
					const outputPath = path.join(outputDir, `${baseName}-optimized.${format}`);
					
					// Simple image optimization using Sharp directly
					let pipeline = sharp(imagePath);
					
					if (width || height) {
						pipeline = pipeline.resize(width, height, { fit: 'cover' });
					}
					
					if (format === 'webp') {
						pipeline = pipeline.webp({ quality });
					} else if (format === 'avif') {
						pipeline = pipeline.avif({ quality });
					} else {
						pipeline = pipeline.jpeg({ quality });
					}
					
					await pipeline.toFile(outputPath);
					
					return `export default "${outputPath}";`;
				}
			}
		},
		generateBundle(options, bundle) {
			// Process images during bundle generation
			Object.keys(bundle).forEach(fileName => {
				const chunk = bundle[fileName];
				if (chunk.type === 'asset' && chunk.fileName.match(/\.(jpg|jpeg|png|webp)$/i)) {
					// Mark for optimization
					console.log(`Image asset found: ${fileName}`);
				}
			});
		}
	};
}

/**
 * Transform image URLs in HTML to use optimized versions
 */
export function transformImageUrls(): Plugin {
	return {
		name: 'transform-image-urls',
		transformIndexHtml(html) {
			// Transform img src attributes to use optimized versions
			return html.replace(
				/<img([^>]*)\ssrc=["']([^"']*\.(jpg|jpeg|png|webp))["']([^>]*)>/gi,
				(match, beforeSrc, src, ext, afterSrc) => {
					// Check if optimized version exists
					const optimizedSrc = src.replace(/\.(jpg|jpeg|png|webp)$/i, '.webp');
					const optimizedPath = path.join('static', optimizedSrc);
					
					if (existsSync(optimizedPath)) {
						return `<img${beforeSrc} src="${optimizedSrc}"${afterSrc}>`;
					}
					
					return match;
				}
			);
		}
	};
}

/**
 * Generate responsive image markup
 */
export function generateResponsiveMarkup(
	src: string,
	alt: string,
	sizes?: string,
	className?: string
): string {
	const baseName = path.parse(src).name;
	const ext = path.parse(src).ext;
	
	// Generate srcset for different sizes
	const responsiveSizes = [640, 768, 1024, 1280, 1536];
	const webpSrcset = responsiveSizes
		.map(size => `/optimized/${baseName}-${size}w.webp ${size}w`)
		.join(', ');
	
	const avifSrcset = responsiveSizes
		.map(size => `/optimized/${baseName}-${size}w.avif ${size}w`)
		.join(', ');
	
	const fallbackSrcset = responsiveSizes
		.map(size => `/optimized/${baseName}-${size}w.jpg ${size}w`)
		.join(', ');
	
	const defaultSizes = sizes || '(min-width: 1536px) 1536px, (min-width: 1280px) 1280px, (min-width: 1024px) 1024px, (min-width: 768px) 768px, (min-width: 640px) 640px, 100vw';
	
	return `
		<picture${className ? ` class="${className}"` : ''}>
			<source srcset="${avifSrcset}" sizes="${defaultSizes}" type="image/avif">
			<source srcset="${webpSrcset}" sizes="${defaultSizes}" type="image/webp">
			<img src="${src}" srcset="${fallbackSrcset}" sizes="${defaultSizes}" alt="${alt}" loading="lazy" decoding="async">
		</picture>
	`.trim();
}