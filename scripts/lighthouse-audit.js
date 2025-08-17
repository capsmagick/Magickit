#!/usr/bin/env node

/**
 * Lighthouse Performance Audit Script
 * Runs Lighthouse audits and generates performance reports
 */

import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

class LighthouseAuditor {
	constructor() {
		this.chrome = null;
		this.results = [];
	}

	/**
	 * Run Lighthouse audits for multiple pages
	 */
	async runAudits() {
		console.log('🚀 Starting Lighthouse Performance Audits...\n');

		try {
			// Launch Chrome
			this.chrome = await chromeLauncher.launch({
				chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage']
			});

			const options = {
				logLevel: 'info',
				output: 'json',
				onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
				port: this.chrome.port,
			};

			// Pages to audit
			const pages = [
				{ url: 'http://localhost:4173/', name: 'Homepage' },
				{ url: 'http://localhost:4173/about', name: 'About' },
				{ url: 'http://localhost:4173/contact', name: 'Contact' },
				{ url: 'http://localhost:4173/login', name: 'Login' },
				{ url: 'http://localhost:4173/signup', name: 'Signup' }
			];

			// Run audits for each page
			for (const page of pages) {
				console.log(`🔍 Auditing ${page.name} (${page.url})...`);
				
				try {
					const runnerResult = await lighthouse(page.url, options);
					const result = this.processLighthouseResult(runnerResult, page);
					this.results.push(result);
					
					console.log(`   Performance: ${result.scores.performance}/100`);
					console.log(`   Accessibility: ${result.scores.accessibility}/100`);
					console.log(`   Best Practices: ${result.scores.bestPractices}/100`);
					console.log(`   SEO: ${result.scores.seo}/100\n`);
				} catch (error) {
					console.error(`   ❌ Failed to audit ${page.name}: ${error.message}\n`);
					this.results.push({
						page: page.name,
						url: page.url,
						error: error.message,
						timestamp: new Date().toISOString()
					});
				}
			}

			await this.generateReport();
		} catch (error) {
			console.error('❌ Lighthouse audit failed:', error.message);
			process.exit(1);
		} finally {
			if (this.chrome) {
				await this.chrome.kill();
			}
		}
	}

	/**
	 * Process Lighthouse result and extract key metrics
	 */
	processLighthouseResult(runnerResult, page) {
		const lhr = runnerResult.lhr;
		
		return {
			page: page.name,
			url: page.url,
			timestamp: new Date().toISOString(),
			scores: {
				performance: Math.round(lhr.categories.performance.score * 100),
				accessibility: Math.round(lhr.categories.accessibility.score * 100),
				bestPractices: Math.round(lhr.categories['best-practices'].score * 100),
				seo: Math.round(lhr.categories.seo.score * 100)
			},
			metrics: {
				firstContentfulPaint: lhr.audits['first-contentful-paint'].numericValue,
				largestContentfulPaint: lhr.audits['largest-contentful-paint'].numericValue,
				firstInputDelay: lhr.audits['max-potential-fid'].numericValue,
				cumulativeLayoutShift: lhr.audits['cumulative-layout-shift'].numericValue,
				speedIndex: lhr.audits['speed-index'].numericValue,
				totalBlockingTime: lhr.audits['total-blocking-time'].numericValue
			},
			opportunities: this.extractOpportunities(lhr),
			diagnostics: this.extractDiagnostics(lhr),
			passedAudits: this.extractPassedAudits(lhr),
			failedAudits: this.extractFailedAudits(lhr)
		};
	}

	/**
	 * Extract performance opportunities from Lighthouse result
	 */
	extractOpportunities(lhr) {
		const opportunities = [];
		
		Object.keys(lhr.audits).forEach(auditId => {
			const audit = lhr.audits[auditId];
			if (audit.details && audit.details.type === 'opportunity' && audit.numericValue > 0) {
				opportunities.push({
					id: auditId,
					title: audit.title,
					description: audit.description,
					savings: audit.numericValue,
					score: audit.score
				});
			}
		});

		return opportunities.sort((a, b) => b.savings - a.savings);
	}

	/**
	 * Extract diagnostics from Lighthouse result
	 */
	extractDiagnostics(lhr) {
		const diagnostics = [];
		
		Object.keys(lhr.audits).forEach(auditId => {
			const audit = lhr.audits[auditId];
			if (audit.details && audit.details.type === 'diagnostic' && audit.score !== null && audit.score < 1) {
				diagnostics.push({
					id: auditId,
					title: audit.title,
					description: audit.description,
					score: audit.score
				});
			}
		});

		return diagnostics;
	}

	/**
	 * Extract passed audits
	 */
	extractPassedAudits(lhr) {
		const passed = [];
		
		Object.keys(lhr.audits).forEach(auditId => {
			const audit = lhr.audits[auditId];
			if (audit.score === 1) {
				passed.push({
					id: auditId,
					title: audit.title
				});
			}
		});

		return passed;
	}

	/**
	 * Extract failed audits
	 */
	extractFailedAudits(lhr) {
		const failed = [];
		
		Object.keys(lhr.audits).forEach(auditId => {
			const audit = lhr.audits[auditId];
			if (audit.score !== null && audit.score < 0.9 && audit.score !== 1) {
				failed.push({
					id: auditId,
					title: audit.title,
					description: audit.description,
					score: audit.score
				});
			}
		});

		return failed.sort((a, b) => a.score - b.score);
	}

	/**
	 * Generate comprehensive report
	 */
	async generateReport() {
		console.log('📊 Generating Lighthouse Report...\n');

		// Calculate averages
		const validResults = this.results.filter(r => !r.error);
		const averages = this.calculateAverages(validResults);

		const report = {
			timestamp: new Date().toISOString(),
			summary: {
				totalPages: this.results.length,
				successfulAudits: validResults.length,
				failedAudits: this.results.length - validResults.length,
				averageScores: averages
			},
			results: this.results,
			recommendations: this.generateRecommendations(validResults)
		};

		// Save detailed report
		const reportPath = join(projectRoot, 'lighthouse-report.json');
		writeFileSync(reportPath, JSON.stringify(report, null, 2));

		// Display summary
		console.log('='.repeat(60));
		console.log('🚨 LIGHTHOUSE AUDIT SUMMARY');
		console.log('='.repeat(60));
		console.log(`Pages Audited: ${report.summary.totalPages}`);
		console.log(`Successful Audits: ${report.summary.successfulAudits}`);
		console.log(`Failed Audits: ${report.summary.failedAudits}`);
		console.log('');
		console.log('Average Scores:');
		console.log(`  Performance: ${averages.performance}/100 ${this.getScoreEmoji(averages.performance)}`);
		console.log(`  Accessibility: ${averages.accessibility}/100 ${this.getScoreEmoji(averages.accessibility)}`);
		console.log(`  Best Practices: ${averages.bestPractices}/100 ${this.getScoreEmoji(averages.bestPractices)}`);
		console.log(`  SEO: ${averages.seo}/100 ${this.getScoreEmoji(averages.seo)}`);

		// Show top opportunities
		const allOpportunities = validResults.flatMap(r => r.opportunities);
		const topOpportunities = allOpportunities
			.sort((a, b) => b.savings - a.savings)
			.slice(0, 5);

		if (topOpportunities.length > 0) {
			console.log('\n🎯 Top Performance Opportunities:');
			topOpportunities.forEach((opp, index) => {
				console.log(`  ${index + 1}. ${opp.title} (${Math.round(opp.savings)}ms savings)`);
			});
		}

		// Show recommendations
		if (report.recommendations.length > 0) {
			console.log('\n💡 Key Recommendations:');
			report.recommendations.slice(0, 5).forEach((rec, index) => {
				console.log(`  ${index + 1}. ${rec}`);
			});
		}

		console.log(`\n📄 Full report saved to: ${reportPath}`);

		// Generate HTML report if possible
		try {
			await this.generateHTMLReport(report);
		} catch (error) {
			console.log('⚠️  Could not generate HTML report:', error.message);
		}
	}

	/**
	 * Calculate average scores across all pages
	 */
	calculateAverages(results) {
		if (results.length === 0) {
			return { performance: 0, accessibility: 0, bestPractices: 0, seo: 0 };
		}

		const totals = results.reduce((acc, result) => {
			acc.performance += result.scores.performance;
			acc.accessibility += result.scores.accessibility;
			acc.bestPractices += result.scores.bestPractices;
			acc.seo += result.scores.seo;
			return acc;
		}, { performance: 0, accessibility: 0, bestPractices: 0, seo: 0 });

		return {
			performance: Math.round(totals.performance / results.length),
			accessibility: Math.round(totals.accessibility / results.length),
			bestPractices: Math.round(totals.bestPractices / results.length),
			seo: Math.round(totals.seo / results.length)
		};
	}

	/**
	 * Generate actionable recommendations
	 */
	generateRecommendations(results) {
		const recommendations = new Set();

		results.forEach(result => {
			// Performance recommendations
			if (result.scores.performance < 90) {
				result.opportunities.slice(0, 3).forEach(opp => {
					if (opp.id === 'unused-javascript') {
						recommendations.add('Remove unused JavaScript to reduce bundle size');
					} else if (opp.id === 'render-blocking-resources') {
						recommendations.add('Eliminate render-blocking resources');
					} else if (opp.id === 'unminified-css') {
						recommendations.add('Minify CSS files');
					} else if (opp.id === 'unminified-javascript') {
						recommendations.add('Minify JavaScript files');
					} else if (opp.id === 'unused-css-rules') {
						recommendations.add('Remove unused CSS rules');
					} else if (opp.id === 'modern-image-formats') {
						recommendations.add('Use modern image formats (WebP, AVIF)');
					} else if (opp.id === 'offscreen-images') {
						recommendations.add('Defer loading of offscreen images');
					}
				});
			}

			// Accessibility recommendations
			if (result.scores.accessibility < 90) {
				result.failedAudits.forEach(audit => {
					if (audit.id === 'color-contrast') {
						recommendations.add('Ensure sufficient color contrast ratios');
					} else if (audit.id === 'image-alt') {
						recommendations.add('Add alt text to all images');
					} else if (audit.id === 'heading-order') {
						recommendations.add('Fix heading hierarchy and order');
					} else if (audit.id === 'label') {
						recommendations.add('Add proper labels to form elements');
					}
				});
			}

			// SEO recommendations
			if (result.scores.seo < 90) {
				result.failedAudits.forEach(audit => {
					if (audit.id === 'meta-description') {
						recommendations.add('Add meta descriptions to all pages');
					} else if (audit.id === 'document-title') {
						recommendations.add('Ensure all pages have unique, descriptive titles');
					}
				});
			}
		});

		return Array.from(recommendations);
	}

	/**
	 * Generate HTML report (simplified version)
	 */
	async generateHTMLReport(report) {
		const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lighthouse Performance Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 40px; }
        .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .score { display: inline-block; margin: 10px; padding: 15px; border-radius: 8px; text-align: center; min-width: 120px; }
        .score-good { background: #d4edda; color: #155724; }
        .score-average { background: #fff3cd; color: #856404; }
        .score-poor { background: #f8d7da; color: #721c24; }
        .page-result { margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        .opportunities { margin-top: 20px; }
        .opportunity { margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚨 Lighthouse Performance Report</h1>
        <p>Generated on ${new Date(report.timestamp).toLocaleString()}</p>
    </div>

    <div class="summary">
        <h2>Summary</h2>
        <p><strong>Pages Audited:</strong> ${report.summary.totalPages}</p>
        <p><strong>Successful Audits:</strong> ${report.summary.successfulAudits}</p>
        
        <h3>Average Scores</h3>
        <div class="score ${this.getScoreClass(report.summary.averageScores.performance)}">
            <div><strong>Performance</strong></div>
            <div>${report.summary.averageScores.performance}/100</div>
        </div>
        <div class="score ${this.getScoreClass(report.summary.averageScores.accessibility)}">
            <div><strong>Accessibility</strong></div>
            <div>${report.summary.averageScores.accessibility}/100</div>
        </div>
        <div class="score ${this.getScoreClass(report.summary.averageScores.bestPractices)}">
            <div><strong>Best Practices</strong></div>
            <div>${report.summary.averageScores.bestPractices}/100</div>
        </div>
        <div class="score ${this.getScoreClass(report.summary.averageScores.seo)}">
            <div><strong>SEO</strong></div>
            <div>${report.summary.averageScores.seo}/100</div>
        </div>
    </div>

    <h2>Recommendations</h2>
    <ul>
        ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
    </ul>

    <h2>Page Results</h2>
    ${report.results.filter(r => !r.error).map(result => `
        <div class="page-result">
            <h3>${result.page}</h3>
            <p><strong>URL:</strong> ${result.url}</p>
            
            <div class="scores">
                <span class="score ${this.getScoreClass(result.scores.performance)}">Performance: ${result.scores.performance}/100</span>
                <span class="score ${this.getScoreClass(result.scores.accessibility)}">Accessibility: ${result.scores.accessibility}/100</span>
                <span class="score ${this.getScoreClass(result.scores.bestPractices)}">Best Practices: ${result.scores.bestPractices}/100</span>
                <span class="score ${this.getScoreClass(result.scores.seo)}">SEO: ${result.scores.seo}/100</span>
            </div>

            ${result.opportunities.length > 0 ? `
                <div class="opportunities">
                    <h4>Top Opportunities</h4>
                    ${result.opportunities.slice(0, 3).map(opp => `
                        <div class="opportunity">
                            <strong>${opp.title}</strong> - ${Math.round(opp.savings)}ms potential savings
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `).join('')}
</body>
</html>`;

		const htmlPath = join(projectRoot, 'lighthouse-report.html');
		writeFileSync(htmlPath, html);
		console.log(`📄 HTML report saved to: ${htmlPath}`);
	}

	/**
	 * Helper methods
	 */
	getScoreEmoji(score) {
		if (score >= 90) return '🟢';
		if (score >= 50) return '🟡';
		return '🔴';
	}

	getScoreClass(score) {
		if (score >= 90) return 'score-good';
		if (score >= 50) return 'score-average';
		return 'score-poor';
	}
}

// Run audit if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
	const auditor = new LighthouseAuditor();
	auditor.runAudits().catch(console.error);
}

export default LighthouseAuditor;