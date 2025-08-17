import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { optimizeImage, generateModernFormats, getImageMetadata } from '$lib/utils/image-optimization';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export const POST: RequestHandler = async ({ request, url }) => {
	try {
		const formData = await request.formData();
		const file = formData.get('image') as File;
		const width = formData.get('width') ? parseInt(formData.get('width') as string) : undefined;
		const height = formData.get('height') ? parseInt(formData.get('height') as string) : undefined;
		const quality = formData.get('quality') ? parseInt(formData.get('quality') as string) : 85;
		const format = (formData.get('format') as string) || 'webp';
		const generateResponsive = formData.get('responsive') === 'true';

		if (!file) {
			throw error(400, 'No image file provided');
		}

		// Validate file type
		if (!file.type.startsWith('image/')) {
			throw error(400, 'File must be an image');
		}

		// Create temporary directories
		const tempDir = path.join(process.cwd(), 'temp');
		const outputDir = path.join(process.cwd(), 'static', 'optimized');
		
		if (!existsSync(tempDir)) {
			await mkdir(tempDir, { recursive: true });
		}
		if (!existsSync(outputDir)) {
			await mkdir(outputDir, { recursive: true });
		}

		// Save uploaded file temporarily
		const tempFileName = `temp_${Date.now()}_${file.name}`;
		const tempFilePath = path.join(tempDir, tempFileName);
		const buffer = await file.arrayBuffer();
		await writeFile(tempFilePath, Buffer.from(buffer));

		// Get original image metadata
		const metadata = await getImageMetadata(tempFilePath);

		// Generate optimized filename
		const baseName = path.parse(file.name).name;
		const timestamp = Date.now();
		const optimizedBaseName = `${baseName}_${timestamp}`;

		let results: any = {
			original: {
				width: metadata.width,
				height: metadata.height,
				format: metadata.format,
				size: metadata.size
			}
		};

		if (generateResponsive) {
			// Generate responsive images with modern formats
			const responsiveSizes = {
				sm: 640,
				md: 768,
				lg: 1024,
				xl: 1280,
				'2xl': 1536
			};

			const variants: any = {};

			for (const [sizeName, sizeWidth] of Object.entries(responsiveSizes)) {
				// Skip sizes larger than original image
				if (metadata.width && sizeWidth > metadata.width) continue;

				const sizeBaseName = `${optimizedBaseName}_${sizeName}`;
				const formats = await generateModernFormats(
					tempFilePath,
					outputDir,
					sizeBaseName,
					sizeWidth
				);

				variants[sizeName] = {
					webp: `/optimized/${path.basename(formats.webp)}`,
					avif: `/optimized/${path.basename(formats.avif)}`,
					fallback: `/optimized/${path.basename(formats.fallback)}`,
					width: sizeWidth
				};
			}

			results.responsive = variants;
		} else {
			// Generate single optimized image
			const outputPath = path.join(outputDir, `${optimizedBaseName}.${format}`);
			
			await optimizeImage(tempFilePath, outputPath, {
				width,
				height,
				quality,
				format: format as any
			});

			const optimizedMetadata = await getImageMetadata(outputPath);
			
			results.optimized = {
				url: `/optimized/${path.basename(outputPath)}`,
				width: optimizedMetadata.width,
				height: optimizedMetadata.height,
				format: optimizedMetadata.format,
				size: optimizedMetadata.size
			};
		}

		// Clean up temporary file
		try {
			const fs = await import('fs/promises');
			await fs.unlink(tempFilePath);
		} catch (e) {
			// Ignore cleanup errors
		}

		return json(results);

	} catch (err) {
		console.error('Image optimization error:', err);
		throw error(500, 'Failed to optimize image');
	}
};

export const GET: RequestHandler = async ({ url }) => {
	// Get image optimization info/stats
	const src = url.searchParams.get('src');
	
	if (!src) {
		throw error(400, 'Source image path required');
	}

	try {
		const imagePath = path.join(process.cwd(), 'static', src);
		
		if (!existsSync(imagePath)) {
			throw error(404, 'Image not found');
		}

		const metadata = await getImageMetadata(imagePath);
		
		return json({
			path: src,
			metadata: {
				width: metadata.width,
				height: metadata.height,
				format: metadata.format,
				size: metadata.size,
				density: metadata.density,
				hasAlpha: metadata.hasAlpha
			}
		});

	} catch (err) {
		console.error('Image metadata error:', err);
		throw error(500, 'Failed to get image metadata');
	}
};