#!/usr/bin/env node

/**
 * Performance Audit Script
 * Analyzes the application for performance issues and provides recommendations
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

class PerformanceAuditor {
	constructor() {
		this.results = {
			timestamp: new Date().toISOString(),
			scores: {},
			issues: [],
			recommendations: [],
			metrics: {}
		};
	}

	/**
	 * Run complete performance audit
	 */
	async runAudit() {
		console.log('🔍 Starting Performance Audit...\n');

		try {
			await this.auditBundleSize();
			await this.auditImageOptimization();
			await this.auditDependencies();
			await this.auditCodeSplitting();
			await this.auditCaching();
			await this.generateReport();
		} catch (error) {
			console.error('❌ Audit failed:', error.message);
			process.exit(1);
		}
	}

	/**
	 * Audit JavaScript bundle sizes
	 */
	async auditBundleSize() {
		console.log('📦 Auditing bundle sizes...');

		try {
			// Check if build exists
			const buildDir = join(projectRoot, '.svelte-kit/output');
			if (!existsSync(buildDir)) {
				this.addIssue('Bundle analysis skipped - no build found. Run `npm run build` first.');
				return;
			}

			// Analyze bundle sizes
			const clientDir = join(buildDir, 'client');
			if (existsSync(clientDir)) {
				const bundleStats = this.analyzeBundleDirectory(clientDir);
				this.results.metrics.bundleSize = bundleStats;

				// Check bundle size thresholds
				if (bundleStats.totalSize > 500000) { // 500KB
					this.addIssue(`Large bundle size: ${this.formatBytes(bundleStats.totalSize)}`, 'warning');
					this.addRecommendation('Consider code splitting and lazy loading for large bundles');
				}

				if (bundleStats.largestFile.size > 200000) { // 200KB
					this.addIssue(`Large individual file: ${bundleStats.largestFile.name} (${this.formatBytes(bundleStats.largestFile.size)})`, 'warning');
					this.addRecommendation('Split large files into smaller chunks');
				}

				console.log(`   Total bundle size: ${this.formatBytes(bundleStats.totalSize)}`);
				console.log(`   Largest file: ${bundleStats.largestFile.name} (${this.formatBytes(bundleStats.largestFile.size)})`);
			}
		} catch (error) {
			this.addIssue(`Bundle size analysis failed: ${error.message}`, 'error');
		}
	}

	/**
	 * Audit image optimization
	 */
	async auditImageOptimization() {
		console.log('🖼️  Auditing image optimization...');

		try {
			const staticDir = join(projectRoot, 'static');
			const optimizedDir = join(staticDir, 'optimized');

			if (!existsSync(staticDir)) {
				this.addIssue('Static directory not found');
				return;
			}

			const imageStats = this.analyzeImages(staticDir);
			this.results.metrics.images = imageStats;

			// Check for unoptimized images
			if (imageStats.unoptimizedCount > 0) {
				this.addIssue(`${imageStats.unoptimizedCount} unoptimized images found`, 'warning');
				this.addRecommendation('Run image optimization script: npm run optimize:images');
			}

			// Check for modern formats
			if (imageStats.modernFormatRatio < 0.5) {
				this.addIssue('Low usage of modern image formats (WebP/AVIF)', 'info');
				this.addRecommendation('Convert images to WebP or AVIF for better compression');
			}

			console.log(`   Total images: ${imageStats.totalImages}`);
			console.log(`   Optimized: ${imageStats.optimizedCount}`);
			console.log(`   Modern formats: ${Math.round(imageStats.modernFormatRatio * 100)}%`);
		} catch (error) {
			this.addIssue(`Image optimization analysis failed: ${error.message}`, 'error');
		}
	}

	/**
	 * Audit dependencies for performance impact
	 */
	async auditDependencies() {
		console.log('📚 Auditing dependencies...');

		try {
			const packageJsonPath = join(projectRoot, 'package.json');
			const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

			const depStats = this.analyzeDependencies(packageJson);
			this.results.metrics.dependencies = depStats;

			// Check for heavy dependencies
			if (depStats.heavyDependencies.length > 0) {
				this.addIssue(`Heavy dependencies detected: ${depStats.heavyDependencies.join(', ')}`, 'warning');
				this.addRecommendation('Consider lighter alternatives or lazy loading for heavy dependencies');
			}

			// Check for unused dependencies
			if (depStats.devDependenciesInProd.length > 0) {
				this.addIssue(`Dev dependencies in production: ${depStats.devDependenciesInProd.join(', ')}`, 'error');
				this.addRecommendation('Move development-only dependencies to devDependencies');
			}

			console.log(`   Total dependencies: ${depStats.totalDependencies}`);
			console.log(`   Heavy dependencies: ${depStats.heavyDependencies.length}`);
		} catch (error) {
			this.addIssue(`Dependency analysis failed: ${error.message}`, 'error');
		}
	}

	/**
	 * Audit code splitting implementation
	 */
	async auditCodeSplitting() {
		console.log('✂️  Auditing code splitting...');

		try {
			// Check SvelteKit configuration
			const svelteConfigPath = join(projectRoot, 'svelte.config.js');
			if (existsSync(svelteConfigPath)) {
				const config = readFileSync(svelteConfigPath, 'utf8');
				
				// Check for proper code splitting configuration
				if (!config.includes('split') && !config.includes('chunk')) {
					this.addRecommendation('Consider implementing manual code splitting for large routes');
				}
			}

			// Check for dynamic imports in source code
			const dynamicImports = this.findDynamicImports();
			this.results.metrics.codeSplitting = {
				dynamicImports: dynamicImports.length,
				files: dynamicImports
			};

			if (dynamicImports.length === 0) {
				this.addIssue('No dynamic imports found', 'info');
				this.addRecommendation('Consider using dynamic imports for code splitting: import("./module")');
			}

			console.log(`   Dynamic imports found: ${dynamicImports.length}`);
		} catch (error) {
			this.addIssue(`Code splitting analysis failed: ${error.message}`, 'error');
		}
	}

	/**
	 * Audit caching strategies
	 */
	async auditCaching() {
		console.log('💾 Auditing caching strategies...');

		try {
			// Check for service worker
			const swPath = join(projectRoot, 'src/service-worker.js');
			const hasServiceWorker = existsSync(swPath);

			// Check SvelteKit configuration for caching
			const appHtmlPath = join(projectRoot, 'src/app.html');
			let hasCacheHeaders = false;
			
			if (existsSync(appHtmlPath)) {
				const appHtml = readFileSync(appHtmlPath, 'utf8');
				hasCacheHeaders = appHtml.includes('cache-control') || appHtml.includes('expires');
			}

			this.results.metrics.caching = {
				serviceWorker: hasServiceWorker,
				cacheHeaders: hasCacheHeaders
			};

			if (!hasServiceWorker) {
				this.addRecommendation('Consider implementing a service worker for offline caching');
			}

			if (!hasCacheHeaders) {
				this.addRecommendation('Configure proper cache headers for static assets');
			}

			console.log(`   Service worker: ${hasServiceWorker ? '✅' : '❌'}`);
			console.log(`   Cache headers: ${hasCacheHeaders ? '✅' : '❌'}`);
		} catch (error) {
			this.addIssue(`Caching analysis failed: ${error.message}`, 'error');
		}
	}

	/**
	 * Generate performance report
	 */
	async generateReport() {
		console.log('\n📊 Generating Performance Report...');

		// Calculate overall score
		const totalIssues = this.results.issues.length;
		const errorCount = this.results.issues.filter(i => i.severity === 'error').length;
		const warningCount = this.results.issues.filter(i => i.severity === 'warning').length;

		let score = 100;
		score -= errorCount * 20;
		score -= warningCount * 10;
		score -= (totalIssues - errorCount - warningCount) * 5;
		score = Math.max(0, score);

		this.results.scores.overall = score;

		// Write report to file
		const reportPath = join(projectRoot, 'performance-report.json');
		writeFileSync(reportPath, JSON.stringify(this.results, null, 2));

		// Display summary
		console.log('\n' + '='.repeat(50));
		console.log('📈 PERFORMANCE AUDIT SUMMARY');
		console.log('='.repeat(50));
		console.log(`Overall Score: ${score}/100 ${this.getScoreEmoji(score)}`);
		console.log(`Issues Found: ${totalIssues}`);
		console.log(`  - Errors: ${errorCount}`);
		console.log(`  - Warnings: ${warningCount}`);
		console.log(`  - Info: ${totalIssues - errorCount - warningCount}`);
		console.log(`Recommendations: ${this.results.recommendations.length}`);

		if (this.results.issues.length > 0) {
			console.log('\n🔍 Issues Found:');
			this.results.issues.forEach((issue, index) => {
				const icon = this.getSeverityIcon(issue.severity);
				console.log(`  ${index + 1}. ${icon} ${issue.message}`);
			});
		}

		if (this.results.recommendations.length > 0) {
			console.log('\n💡 Recommendations:');
			this.results.recommendations.forEach((rec, index) => {
				console.log(`  ${index + 1}. ${rec}`);
			});
		}

		console.log(`\n📄 Full report saved to: ${reportPath}`);
	}

	/**
	 * Helper methods
	 */
	addIssue(message, severity = 'info') {
		this.results.issues.push({
			message,
			severity,
			timestamp: new Date().toISOString()
		});
	}

	addRecommendation(message) {
		this.results.recommendations.push(message);
	}

	analyzeBundleDirectory(dir) {
		const files = this.getFilesRecursively(dir);
		const jsFiles = files.filter(f => f.endsWith('.js'));
		
		let totalSize = 0;
		let largestFile = { name: '', size: 0 };

		jsFiles.forEach(file => {
			try {
				const stats = require('fs').statSync(file);
				totalSize += stats.size;
				
				if (stats.size > largestFile.size) {
					largestFile = {
						name: file.split('/').pop(),
						size: stats.size
					};
				}
			} catch (error) {
				// Ignore files that can't be read
			}
		});

		return {
			totalFiles: jsFiles.length,
			totalSize,
			largestFile
		};
	}

	analyzeImages(dir) {
		const files = this.getFilesRecursively(dir);
		const imageFiles = files.filter(f => /\.(jpg|jpeg|png|gif|webp|avif)$/i.test(f));
		
		const modernFormats = imageFiles.filter(f => /\.(webp|avif)$/i.test(f));
		const optimizedDir = join(dir, 'optimized');
		const hasOptimizedDir = existsSync(optimizedDir);
		
		return {
			totalImages: imageFiles.length,
			optimizedCount: hasOptimizedDir ? this.getFilesRecursively(optimizedDir).length : 0,
			unoptimizedCount: hasOptimizedDir ? Math.max(0, imageFiles.length - this.getFilesRecursively(optimizedDir).length) : imageFiles.length,
			modernFormatRatio: imageFiles.length > 0 ? modernFormats.length / imageFiles.length : 0
		};
	}

	analyzeDependencies(packageJson) {
		const deps = packageJson.dependencies || {};
		const devDeps = packageJson.devDependencies || {};
		
		// Known heavy dependencies
		const heavyDeps = ['lodash', 'moment', 'rxjs', 'three', 'chart.js'];
		const heavyDependencies = Object.keys(deps).filter(dep => 
			heavyDeps.some(heavy => dep.includes(heavy))
		);

		// Check for dev dependencies that might be in production
		const devDependenciesInProd = Object.keys(deps).filter(dep =>
			dep.includes('test') || dep.includes('dev') || dep.includes('mock')
		);

		return {
			totalDependencies: Object.keys(deps).length,
			heavyDependencies,
			devDependenciesInProd
		};
	}

	findDynamicImports() {
		const srcDir = join(projectRoot, 'src');
		if (!existsSync(srcDir)) return [];

		const files = this.getFilesRecursively(srcDir);
		const jsFiles = files.filter(f => /\.(js|ts|svelte)$/.test(f));
		
		const dynamicImports = [];
		
		jsFiles.forEach(file => {
			try {
				const content = readFileSync(file, 'utf8');
				if (content.includes('import(')) {
					dynamicImports.push(file.replace(projectRoot, ''));
				}
			} catch (error) {
				// Ignore files that can't be read
			}
		});

		return dynamicImports;
	}

	getFilesRecursively(dir) {
		if (!existsSync(dir)) return [];
		
		const files = [];
		const items = require('fs').readdirSync(dir);
		
		items.forEach(item => {
			const fullPath = join(dir, item);
			const stats = require('fs').statSync(fullPath);
			
			if (stats.isDirectory()) {
				files.push(...this.getFilesRecursively(fullPath));
			} else {
				files.push(fullPath);
			}
		});
		
		return files;
	}

	formatBytes(bytes) {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	getScoreEmoji(score) {
		if (score >= 90) return '🟢';
		if (score >= 70) return '🟡';
		return '🔴';
	}

	getSeverityIcon(severity) {
		switch (severity) {
			case 'error': return '❌';
			case 'warning': return '⚠️';
			default: return 'ℹ️';
		}
	}
}

// Run audit if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
	const auditor = new PerformanceAuditor();
	auditor.runAudit().catch(console.error);
}

export default PerformanceAuditor;