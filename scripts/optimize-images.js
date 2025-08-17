#!/usr/bin/env node

/**
 * Build-time image optimization script
 * Optimizes all images in the static directory
 */

import { fileURLToPath } from 'url';
import { dirname, join, parse, relative } from 'path';
import { readdir, stat, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Configuration
const config = {
	inputDir: join(projectRoot, 'static'),
	outputDir: join(projectRoot, 'static', 'optimized'),
	formats: ['webp', 'avif'],
	qualities: {
		webp: 85,
		avif: 80,
		jpeg: 85
	},
	responsiveSizes: [640, 768, 1024, 1280, 1536],
	skipDirs: ['optimized', 'favicon'],
	supportedExtensions: ['.jpg', '.jpeg', '.png', '.tiff', '.webp']
};

/**
 * Get all image files recursively
 */
async function getImageFiles(dir, baseDir = dir) {
	const files = [];
	const entries = await readdir(dir);

	for (const entry of entries) {
		const fullPath = join(dir, entry);
		const stats = await stat(fullPath);
		const relativePath = relative(baseDir, fullPath);

		// Skip certain directories
		if (stats.isDirectory()) {
			const shouldSkip = config.skipDirs.some(skipDir => 
				relativePath.includes(skipDir)
			);
			
			if (!shouldSkip) {
				const subFiles = await getImageFiles(fullPath, baseDir);
				files.push(...subFiles);
			}
		} else if (stats.isFile()) {
			const ext = parse(entry).ext.toLowerCase();
			if (config.supportedExtensions.includes(ext)) {
				files.push({
					path: fullPath,
					relativePath,
					name: parse(entry).name,
					ext
				});
			}
		}
	}

	return files;
}

/**
 * Optimize a single image with multiple formats and sizes
 */
async function optimizeImage(inputPath, outputDir, baseName) {
	const results = {
		formats: {},
		responsive: {},
		original: {}
	};

	try {
		// Get original image metadata
		const metadata = await sharp(inputPath).metadata();
		results.original = {
			width: metadata.width,
			height: metadata.height,
			format: metadata.format,
			size: metadata.size
		};

		console.log(`  Processing: ${baseName} (${metadata.width}x${metadata.height})`);

		// Generate modern formats at original size
		for (const format of config.formats) {
			const outputPath = join(outputDir, `${baseName}.${format}`);
			const quality = config.qualities[format];

			await sharp(inputPath)
				[format]({ quality })
				.toFile(outputPath);

			const optimizedMetadata = await sharp(outputPath).metadata();
			results.formats[format] = {
				path: outputPath,
				size: optimizedMetadata.size,
				savings: Math.round(((metadata.size - optimizedMetadata.size) / metadata.size) * 100)
			};
		}

		// Generate responsive sizes
		for (const width of config.responsiveSizes) {
			// Skip if responsive size is larger than original
			if (width >= metadata.width) continue;

			const responsiveResults = {};

			// Generate each format at this size
			for (const format of ['webp', 'avif', 'jpeg']) {
				const outputPath = join(outputDir, `${baseName}-${width}w.${format}`);
				const quality = config.qualities[format] || config.qualities.jpeg;

				let pipeline = sharp(inputPath).resize(width, null, {
					fit: 'inside',
					withoutEnlargement: true
				});

				if (format === 'webp') {
					pipeline = pipeline.webp({ quality });
				} else if (format === 'avif') {
					pipeline = pipeline.avif({ quality });
				} else {
					pipeline = pipeline.jpeg({ quality });
				}

				await pipeline.toFile(outputPath);

				const optimizedMetadata = await sharp(outputPath).metadata();
				responsiveResults[format] = {
					path: outputPath,
					size: optimizedMetadata.size,
					width: optimizedMetadata.width,
					height: optimizedMetadata.height
				};
			}

			results.responsive[`${width}w`] = responsiveResults;
		}

		return results;

	} catch (error) {
		console.error(`  Error processing ${baseName}:`, error.message);
		return null;
	}
}

/**
 * Main optimization function
 */
async function optimizeImages() {
	console.log('🖼️  Starting image optimization...\n');

	// Ensure output directory exists
	if (!existsSync(config.outputDir)) {
		await mkdir(config.outputDir, { recursive: true });
	}

	// Get all image files
	console.log('📁 Scanning for images...');
	const imageFiles = await getImageFiles(config.inputDir);
	console.log(`Found ${imageFiles.length} images to process\n`);

	if (imageFiles.length === 0) {
		console.log('No images found to optimize.');
		return;
	}

	// Process images
	let processed = 0;
	let totalOriginalSize = 0;
	let totalOptimizedSize = 0;

	for (const file of imageFiles) {
		console.log(`[${processed + 1}/${imageFiles.length}] ${file.relativePath}`);
		
		const result = await optimizeImage(file.path, config.outputDir, file.name);
		
		if (result) {
			totalOriginalSize += result.original.size || 0;
			
			// Calculate total optimized size
			Object.values(result.formats).forEach(format => {
				totalOptimizedSize += format.size || 0;
			});
			
			Object.values(result.responsive).forEach(sizeGroup => {
				Object.values(sizeGroup).forEach(format => {
					totalOptimizedSize += format.size || 0;
				});
			});
		}
		
		processed++;
		console.log(''); // Empty line for readability
	}

	// Summary
	console.log('✅ Image optimization complete!\n');
	console.log('📊 Summary:');
	console.log(`   Images processed: ${processed}`);
	console.log(`   Original total size: ${formatBytes(totalOriginalSize)}`);
	console.log(`   Optimized total size: ${formatBytes(totalOptimizedSize)}`);
	
	if (totalOriginalSize > 0) {
		const savings = Math.round(((totalOriginalSize - totalOptimizedSize) / totalOriginalSize) * 100);
		console.log(`   Total savings: ${savings}%`);
	}
	
	console.log(`   Output directory: ${relative(projectRoot, config.outputDir)}`);
}

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes, decimals = 2) {
	if (bytes === 0) return '0 Bytes';

	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Run the optimization
if (import.meta.url === `file://${process.argv[1]}`) {
	optimizeImages().catch(console.error);
}

export { optimizeImages };