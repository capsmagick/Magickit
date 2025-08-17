#!/usr/bin/env node

/**
 * Bundle Analyzer Script
 * Analyzes JavaScript bundles for size optimization opportunities
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname, extname, basename } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

class BundleAnalyzer {
	constructor() {
		this.results = {
			timestamp: new Date().toISOString(),
			bundles: [],
			analysis: {},
			recommendations: []
		};
	}

	/**
	 * Run complete bundle analysis
	 */
	async analyze() {
		console.log('📦 Starting Bundle Analysis...\n');

		try {
			await this.analyzeBundles();
			await this.analyzeDependencies();
			await this.analyzeChunks();
			await this.generateRecommendations();
			await this.generateReport();
		} catch (error) {
			console.error('❌ Bundle analysis failed:', error.message);
			process.exit(1);
		}
	}

	/**
	 * Analyze JavaScript bundles
	 */
	async analyzeBundles() {
		console.log('🔍 Analyzing JavaScript bundles...');

		const buildDir = join(projectRoot, '.svelte-kit/output');
		if (!existsSync(buildDir)) {
			console.log('⚠️  No build found. Run `npm run build` first.');
			return;
		}

		const clientDir = join(buildDir, 'client');
		if (!existsSync(clientDir)) {
			console.log('⚠️  No client build found.');
			return;
		}

		// Analyze all JavaScript files
		const jsFiles = this.findJavaScriptFiles(clientDir);
		
		for (const file of jsFiles) {
			const analysis = await this.analyzeFile(file);
			this.results.bundles.push(analysis);
		}

		// Calculate totals
		const totalSize = this.results.bundles.reduce((sum, bundle) => sum + bundle.size, 0);
		const totalGzipSize = this.results.bundles.reduce((sum, bundle) => sum + (bundle.gzipSize || 0), 0);

		this.results.analysis.totalSize = totalSize;
		this.results.analysis.totalGzipSize = totalGzipSize;
		this.results.analysis.fileCount = this.results.bundles.length;

		console.log(`   Found ${this.results.bundles.length} JavaScript files`);
		console.log(`   Total size: ${this.formatBytes(totalSize)}`);
		console.log(`   Estimated gzipped: ${this.formatBytes(totalGzipSize)}`);
	}

	/**
	 * Analyze individual file
	 */
	async analyzeFile(filePath) {
		const stats = statSync(filePath);
		const content = readFileSync(filePath, 'utf8');
		const relativePath = filePath.replace(projectRoot, '');

		// Basic analysis
		const analysis = {
			path: relativePath,
			name: basename(filePath),
			size: stats.size,
			gzipSize: this.estimateGzipSize(content),
			lines: content.split('\n').length,
			type: this.determineFileType(filePath, content),
			issues: []
		};

		// Analyze content for issues
		this.analyzeFileContent(content, analysis);

		return analysis;
	}

	/**
	 * Analyze file content for optimization opportunities
	 */
	analyzeFileContent(content, analysis) {
		// Check for large inline data
		const base64Matches = content.match(/data:[^;]+;base64,[A-Za-z0-9+/=]+/g);
		if (base64Matches) {
			const totalBase64Size = base64Matches.reduce((sum, match) => sum + match.length, 0);
			if (totalBase64Size > 10000) { // 10KB
				analysis.issues.push({
					type: 'large-inline-data',
					message: `Large inline data detected (${this.formatBytes(totalBase64Size)})`,
					severity: 'warning'
				});
			}
		}

		// Check for console statements in production
		const consoleMatches = content.match(/console\.(log|warn|error|debug|info)/g);
		if (consoleMatches && consoleMatches.length > 5) {
			analysis.issues.push({
				type: 'console-statements',
				message: `${consoleMatches.length} console statements found`,
				severity: 'info'
			});
		}

		// Check for large string literals
		const stringMatches = content.match(/"[^"]{1000,}"|'[^']{1000,}'/g);
		if (stringMatches) {
			analysis.issues.push({
				type: 'large-strings',
				message: `${stringMatches.length} large string literals found`,
				severity: 'warning'
			});
		}

		// Check for duplicate code patterns
		const duplicatePatterns = this.findDuplicatePatterns(content);
		if (duplicatePatterns.length > 0) {
			analysis.issues.push({
				type: 'duplicate-code',
				message: `${duplicatePatterns.length} potential duplicate code patterns`,
				severity: 'info'
			});
		}

		// Check for unused imports (basic check)
		const importMatches = content.match(/import\s+.*?\s+from\s+['"][^'"]+['"]/g);
		if (importMatches) {
			const unusedImports = this.findUnusedImports(content, importMatches);
			if (unusedImports.length > 0) {
				analysis.issues.push({
					type: 'unused-imports',
					message: `${unusedImports.length} potentially unused imports`,
					severity: 'warning'
				});
			}
		}
	}

	/**
	 * Analyze dependencies impact on bundle size
	 */
	async analyzeDependencies() {
		console.log('📚 Analyzing dependency impact...');

		try {
			const packageJsonPath = join(projectRoot, 'package.json');
			const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
			
			const dependencies = packageJson.dependencies || {};
			const depAnalysis = [];

			// Analyze each dependency
			for (const [name, version] of Object.entries(dependencies)) {
				const analysis = await this.analyzeDependency(name, version);
				depAnalysis.push(analysis);
			}

			// Sort by estimated size
			depAnalysis.sort((a, b) => b.estimatedSize - a.estimatedSize);

			this.results.analysis.dependencies = {
				total: depAnalysis.length,
				heaviest: depAnalysis.slice(0, 10),
				totalEstimatedSize: depAnalysis.reduce((sum, dep) => sum + dep.estimatedSize, 0)
			};

			console.log(`   Analyzed ${depAnalysis.length} dependencies`);
			console.log(`   Heaviest: ${depAnalysis[0]?.name} (~${this.formatBytes(depAnalysis[0]?.estimatedSize || 0)})`);
		} catch (error) {
			console.log(`   ⚠️  Dependency analysis failed: ${error.message}`);
		}
	}

	/**
	 * Analyze individual dependency
	 */
	async analyzeDependency(name, version) {
		// This is a simplified analysis - in a real implementation,
		// you might use bundlephobia API or analyze node_modules
		const knownSizes = {
			'lodash': 500000,
			'moment': 300000,
			'rxjs': 200000,
			'three': 1200000,
			'chart.js': 250000,
			'@tiptap/core': 100000,
			'@tiptap/starter-kit': 150000,
			'mongodb': 800000,
			'better-auth': 200000
		};

		return {
			name,
			version,
			estimatedSize: knownSizes[name] || 50000, // Default estimate
			category: this.categorizeDependency(name)
		};
	}

	/**
	 * Analyze code splitting and chunks
	 */
	async analyzeChunks() {
		console.log('✂️  Analyzing code splitting...');

		const chunks = this.results.bundles.filter(bundle => 
			bundle.name.includes('chunk') || bundle.name.includes('app')
		);

		const routes = this.results.bundles.filter(bundle =>
			bundle.path.includes('routes') || bundle.name.match(/^[a-f0-9]{8}\.js$/)
		);

		this.results.analysis.chunks = {
			totalChunks: chunks.length,
			routeChunks: routes.length,
			averageChunkSize: chunks.length > 0 ? 
				chunks.reduce((sum, chunk) => sum + chunk.size, 0) / chunks.length : 0,
			largestChunk: chunks.reduce((largest, chunk) => 
				chunk.size > (largest?.size || 0) ? chunk : largest, null)
		};

		console.log(`   Found ${chunks.length} chunks`);
		console.log(`   Route-specific chunks: ${routes.length}`);
		
		if (this.results.analysis.chunks.largestChunk) {
			console.log(`   Largest chunk: ${this.results.analysis.chunks.largestChunk.name} (${this.formatBytes(this.results.analysis.chunks.largestChunk.size)})`);
		}
	}

	/**
	 * Generate optimization recommendations
	 */
	async generateRecommendations() {
		console.log('💡 Generating recommendations...');

		const recommendations = [];

		// Bundle size recommendations
		if (this.results.analysis.totalSize > 1000000) { // 1MB
			recommendations.push({
				type: 'bundle-size',
				priority: 'high',
				message: 'Total bundle size is large (>1MB). Consider code splitting and lazy loading.',
				action: 'Implement dynamic imports for route-based code splitting'
			});
		}

		// Large file recommendations
		const largeFiles = this.results.bundles.filter(bundle => bundle.size > 200000); // 200KB
		if (largeFiles.length > 0) {
			recommendations.push({
				type: 'large-files',
				priority: 'medium',
				message: `${largeFiles.length} files are larger than 200KB`,
				action: 'Split large files into smaller modules'
			});
		}

		// Dependency recommendations
		if (this.results.analysis.dependencies) {
			const heavyDeps = this.results.analysis.dependencies.heaviest.slice(0, 3);
			if (heavyDeps.length > 0) {
				recommendations.push({
					type: 'heavy-dependencies',
					priority: 'medium',
					message: `Heavy dependencies detected: ${heavyDeps.map(d => d.name).join(', ')}`,
					action: 'Consider lighter alternatives or lazy loading for heavy dependencies'
				});
			}
		}

		// Code splitting recommendations
		if (this.results.analysis.chunks.routeChunks < 3) {
			recommendations.push({
				type: 'code-splitting',
				priority: 'low',
				message: 'Limited route-based code splitting detected',
				action: 'Implement more granular code splitting for better caching'
			});
		}

		// Issue-based recommendations
		const allIssues = this.results.bundles.flatMap(bundle => bundle.issues);
		const issueTypes = [...new Set(allIssues.map(issue => issue.type))];

		issueTypes.forEach(type => {
			const count = allIssues.filter(issue => issue.type === type).length;
			
			switch (type) {
				case 'large-inline-data':
					recommendations.push({
						type: 'inline-data',
						priority: 'medium',
						message: `${count} files contain large inline data`,
						action: 'Move large data to separate files and load dynamically'
					});
					break;
				case 'console-statements':
					recommendations.push({
						type: 'console-cleanup',
						priority: 'low',
						message: `${count} files contain many console statements`,
						action: 'Remove console statements in production builds'
					});
					break;
				case 'unused-imports':
					recommendations.push({
						type: 'unused-imports',
						priority: 'medium',
						message: `${count} files may have unused imports`,
						action: 'Remove unused imports to reduce bundle size'
					});
					break;
			}
		});

		this.results.recommendations = recommendations;
		console.log(`   Generated ${recommendations.length} recommendations`);
	}

	/**
	 * Generate comprehensive report
	 */
	async generateReport() {
		console.log('\n📊 Generating Bundle Analysis Report...');

		// Save detailed report
		const reportPath = join(projectRoot, 'bundle-analysis.json');
		writeFileSync(reportPath, JSON.stringify(this.results, null, 2));

		// Display summary
		console.log('\n' + '='.repeat(60));
		console.log('📦 BUNDLE ANALYSIS SUMMARY');
		console.log('='.repeat(60));
		console.log(`Total Files: ${this.results.analysis.fileCount}`);
		console.log(`Total Size: ${this.formatBytes(this.results.analysis.totalSize)}`);
		console.log(`Estimated Gzipped: ${this.formatBytes(this.results.analysis.totalGzipSize)}`);

		if (this.results.analysis.chunks) {
			console.log(`Code Chunks: ${this.results.analysis.chunks.totalChunks}`);
			console.log(`Route Chunks: ${this.results.analysis.chunks.routeChunks}`);
		}

		// Show largest files
		const largestFiles = this.results.bundles
			.sort((a, b) => b.size - a.size)
			.slice(0, 5);

		if (largestFiles.length > 0) {
			console.log('\n📈 Largest Files:');
			largestFiles.forEach((file, index) => {
				console.log(`  ${index + 1}. ${file.name} - ${this.formatBytes(file.size)}`);
			});
		}

		// Show issues
		const allIssues = this.results.bundles.flatMap(bundle => bundle.issues);
		if (allIssues.length > 0) {
			console.log('\n⚠️  Issues Found:');
			const issueGroups = this.groupBy(allIssues, 'type');
			Object.entries(issueGroups).forEach(([type, issues]) => {
				console.log(`  ${type}: ${issues.length} occurrences`);
			});
		}

		// Show recommendations
		if (this.results.recommendations.length > 0) {
			console.log('\n💡 Recommendations:');
			this.results.recommendations
				.sort((a, b) => this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority))
				.forEach((rec, index) => {
					const priority = rec.priority.toUpperCase();
					const icon = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
					console.log(`  ${index + 1}. ${icon} [${priority}] ${rec.message}`);
					console.log(`     Action: ${rec.action}`);
				});
		}

		console.log(`\n📄 Full report saved to: ${reportPath}`);

		// Generate visualization if possible
		try {
			await this.generateVisualization();
		} catch (error) {
			console.log('⚠️  Could not generate visualization:', error.message);
		}
	}

	/**
	 * Generate simple HTML visualization
	 */
	async generateVisualization() {
		const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bundle Analysis Visualization</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 40px; }
        .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .file-list { margin: 20px 0; }
        .file-item { display: flex; justify-content: space-between; padding: 10px; margin: 5px 0; background: #f8f9fa; border-radius: 4px; }
        .file-size { font-weight: bold; color: #666; }
        .recommendations { margin: 30px 0; }
        .recommendation { margin: 15px 0; padding: 15px; border-left: 4px solid #007bff; background: #f8f9fa; }
        .high-priority { border-left-color: #dc3545; }
        .medium-priority { border-left-color: #ffc107; }
        .low-priority { border-left-color: #28a745; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📦 Bundle Analysis Report</h1>
        <p>Generated on ${new Date(this.results.timestamp).toLocaleString()}</p>
    </div>

    <div class="summary">
        <h2>Summary</h2>
        <p><strong>Total Files:</strong> ${this.results.analysis.fileCount}</p>
        <p><strong>Total Size:</strong> ${this.formatBytes(this.results.analysis.totalSize)}</p>
        <p><strong>Estimated Gzipped:</strong> ${this.formatBytes(this.results.analysis.totalGzipSize)}</p>
    </div>

    <h2>Largest Files</h2>
    <div class="file-list">
        ${this.results.bundles
			.sort((a, b) => b.size - a.size)
			.slice(0, 10)
			.map(file => `
                <div class="file-item">
                    <span>${file.name}</span>
                    <span class="file-size">${this.formatBytes(file.size)}</span>
                </div>
            `).join('')}
    </div>

    <h2>Recommendations</h2>
    <div class="recommendations">
        ${this.results.recommendations.map(rec => `
            <div class="recommendation ${rec.priority}-priority">
                <h3>${rec.message}</h3>
                <p><strong>Action:</strong> ${rec.action}</p>
                <p><strong>Priority:</strong> ${rec.priority.toUpperCase()}</p>
            </div>
        `).join('')}
    </div>
</body>
</html>`;

		const htmlPath = join(projectRoot, 'bundle-analysis.html');
		writeFileSync(htmlPath, html);
		console.log(`📄 Visualization saved to: ${htmlPath}`);
	}

	/**
	 * Helper methods
	 */
	findJavaScriptFiles(dir) {
		const files = [];
		const items = readdirSync(dir);

		items.forEach(item => {
			const fullPath = join(dir, item);
			const stats = statSync(fullPath);

			if (stats.isDirectory()) {
				files.push(...this.findJavaScriptFiles(fullPath));
			} else if (extname(item) === '.js') {
				files.push(fullPath);
			}
		});

		return files;
	}

	determineFileType(filePath, content) {
		const name = basename(filePath);
		
		if (name.includes('app')) return 'app';
		if (name.includes('chunk')) return 'chunk';
		if (name.includes('vendor')) return 'vendor';
		if (content.includes('export') || content.includes('import')) return 'module';
		
		return 'unknown';
	}

	estimateGzipSize(content) {
		// Rough estimation: gzip typically achieves 70-80% compression for JS
		return Math.round(content.length * 0.3);
	}

	findDuplicatePatterns(content) {
		// Simplified duplicate detection
		const lines = content.split('\n');
		const patterns = [];
		const seen = new Set();

		lines.forEach(line => {
			const trimmed = line.trim();
			if (trimmed.length > 20 && seen.has(trimmed)) {
				patterns.push(trimmed);
			}
			seen.add(trimmed);
		});

		return patterns;
	}

	findUnusedImports(content, imports) {
		// Very basic unused import detection
		const unused = [];
		
		imports.forEach(importStatement => {
			const match = importStatement.match(/import\s+(?:\{([^}]+)\}|\*\s+as\s+(\w+)|(\w+))/);
			if (match) {
				const imported = match[1] || match[2] || match[3];
				if (imported && !content.includes(imported.split(',')[0].trim())) {
					unused.push(imported);
				}
			}
		});

		return unused;
	}

	categorizeDependency(name) {
		if (name.includes('ui') || name.includes('component')) return 'ui';
		if (name.includes('util') || name.includes('helper')) return 'utility';
		if (name.includes('auth')) return 'auth';
		if (name.includes('db') || name.includes('mongo')) return 'database';
		return 'other';
	}

	formatBytes(bytes) {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	groupBy(array, key) {
		return array.reduce((groups, item) => {
			const group = item[key];
			groups[group] = groups[group] || [];
			groups[group].push(item);
			return groups;
		}, {});
	}

	getPriorityWeight(priority) {
		switch (priority) {
			case 'high': return 3;
			case 'medium': return 2;
			case 'low': return 1;
			default: return 0;
		}
	}
}

// Run analysis if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
	const analyzer = new BundleAnalyzer();
	analyzer.analyze().catch(console.error);
}

export default BundleAnalyzer;