/**
 * Image optimization utilities using Sharp
 */

import sharp from 'sharp';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export interface ImageOptimizationOptions {
	width?: number;
	height?: number;
	quality?: number;
	format?: 'webp' | 'avif' | 'jpeg' | 'png';
	fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
	background?: string;
}

export interface ResponsiveImageSizes {
	sm: number;  // 640px
	md: number;  // 768px
	lg: number;  // 1024px
	xl: number;  // 1280px
	'2xl': number; // 1536px
}

export const defaultResponsiveSizes: ResponsiveImageSizes = {
	sm: 640,
	md: 768,
	lg: 1024,
	xl: 1280,
	'2xl': 1536
};

/**
 * Optimize a single image
 */
export async function optimizeImage(
	inputPath: string,
	outputPath: string,
	options: ImageOptimizationOptions = {}
): Promise<void> {
	const {
		width,
		height,
		quality = 85,
		format = 'webp',
		fit = 'cover',
		background = 'transparent'
	} = options;

	// Ensure output directory exists
	const outputDir = path.dirname(outputPath);
	if (!existsSync(outputDir)) {
		await mkdir(outputDir, { recursive: true });
	}

	let pipeline = sharp(inputPath);

	// Resize if dimensions provided
	if (width || height) {
		pipeline = pipeline.resize(width, height, {
			fit,
			background
		});
	}

	// Apply format and quality
	switch (format) {
		case 'webp':
			pipeline = pipeline.webp({ quality });
			break;
		case 'avif':
			pipeline = pipeline.avif({ quality });
			break;
		case 'jpeg':
			pipeline = pipeline.jpeg({ quality });
			break;
		case 'png':
			pipeline = pipeline.png({ quality });
			break;
	}

	// Save optimized image
	await pipeline.toFile(outputPath);
}

/**
 * Generate responsive image variants
 */
export async function generateResponsiveImages(
	inputPath: string,
	outputDir: string,
	baseName: string,
	sizes: Partial<ResponsiveImageSizes> = defaultResponsiveSizes,
	options: Omit<ImageOptimizationOptions, 'width'> = {}
): Promise<{ [key: string]: string }> {
	const variants: { [key: string]: string } = {};

	// Ensure output directory exists
	if (!existsSync(outputDir)) {
		await mkdir(outputDir, { recursive: true });
	}

	// Generate variants for each size
	for (const [sizeName, width] of Object.entries(sizes)) {
		const outputPath = path.join(outputDir, `${baseName}-${sizeName}.${options.format || 'webp'}`);
		
		await optimizeImage(inputPath, outputPath, {
			...options,
			width
		});

		variants[sizeName] = outputPath;
	}

	return variants;
}

/**
 * Generate WebP and AVIF variants for modern browsers
 */
export async function generateModernFormats(
	inputPath: string,
	outputDir: string,
	baseName: string,
	width?: number,
	height?: number
): Promise<{ webp: string; avif: string; fallback: string }> {
	// Ensure output directory exists
	if (!existsSync(outputDir)) {
		await mkdir(outputDir, { recursive: true });
	}

	const webpPath = path.join(outputDir, `${baseName}.webp`);
	const avifPath = path.join(outputDir, `${baseName}.avif`);
	const fallbackPath = path.join(outputDir, `${baseName}.jpg`);

	// Generate WebP
	await optimizeImage(inputPath, webpPath, {
		width,
		height,
		format: 'webp',
		quality: 85
	});

	// Generate AVIF (smaller file size, better compression)
	await optimizeImage(inputPath, avifPath, {
		width,
		height,
		format: 'avif',
		quality: 80
	});

	// Generate JPEG fallback
	await optimizeImage(inputPath, fallbackPath, {
		width,
		height,
		format: 'jpeg',
		quality: 85
	});

	return {
		webp: webpPath,
		avif: avifPath,
		fallback: fallbackPath
	};
}

/**
 * Get image metadata
 */
export async function getImageMetadata(imagePath: string) {
	const metadata = await sharp(imagePath).metadata();
	return {
		width: metadata.width,
		height: metadata.height,
		format: metadata.format,
		size: metadata.size,
		density: metadata.density,
		hasAlpha: metadata.hasAlpha
	};
}

/**
 * Generate image placeholder (low quality, small size for lazy loading)
 */
export async function generatePlaceholder(
	inputPath: string,
	outputPath: string,
	width: number = 20
): Promise<string> {
	// Ensure output directory exists
	const outputDir = path.dirname(outputPath);
	if (!existsSync(outputDir)) {
		await mkdir(outputDir, { recursive: true });
	}

	// Generate tiny, blurred placeholder
	await sharp(inputPath)
		.resize(width, null, { fit: 'inside' })
		.blur(2)
		.webp({ quality: 20 })
		.toFile(outputPath);

	// Return base64 data URL for inline use
	const buffer = await sharp(inputPath)
		.resize(width, null, { fit: 'inside' })
		.blur(2)
		.webp({ quality: 20 })
		.toBuffer();

	return `data:image/webp;base64,${buffer.toString('base64')}`;
}

/**
 * Batch optimize images in a directory
 */
export async function batchOptimizeImages(
	inputDir: string,
	outputDir: string,
	options: ImageOptimizationOptions = {}
): Promise<void> {
	const fs = await import('fs/promises');
	const files = await fs.readdir(inputDir);
	
	const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.gif'];
	const imageFiles = files.filter(file => 
		imageExtensions.some(ext => file.toLowerCase().endsWith(ext))
	);

	// Process images in parallel (but limit concurrency)
	const concurrency = 4;
	for (let i = 0; i < imageFiles.length; i += concurrency) {
		const batch = imageFiles.slice(i, i + concurrency);
		
		await Promise.all(
			batch.map(async (file) => {
				const inputPath = path.join(inputDir, file);
				const baseName = path.parse(file).name;
				const outputPath = path.join(outputDir, `${baseName}.${options.format || 'webp'}`);
				
				await optimizeImage(inputPath, outputPath, options);
			})
		);
	}
}

/**
 * Create srcset string for responsive images
 */
export function createSrcSet(variants: { [key: string]: string }, baseUrl: string = ''): string {
	const srcsetEntries = Object.entries(variants).map(([sizeName, path]) => {
		const width = defaultResponsiveSizes[sizeName as keyof ResponsiveImageSizes];
		const url = baseUrl ? `${baseUrl}${path}` : path;
		return `${url} ${width}w`;
	});

	return srcsetEntries.join(', ');
}

/**
 * Create sizes attribute for responsive images
 */
export function createSizesAttribute(breakpoints?: Partial<ResponsiveImageSizes>): string {
	const sizes = breakpoints || defaultResponsiveSizes;
	
	const sizeEntries = Object.entries(sizes)
		.sort(([, a], [, b]) => b - a) // Sort by width descending
		.map(([sizeName, width], index, array) => {
			if (index === array.length - 1) {
				// Last entry (smallest) should be the default
				return `${width}px`;
			}
			return `(min-width: ${width}px) ${width}px`;
		});

	return sizeEntries.join(', ');
}