#!/usr/bin/env node

/**
 * Admin Route Connectivity Audit Script
 * 
 * This script audits all admin routes defined in the navigation
 * and checks if they have corresponding page files.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Navigation structure from app-sidebar.svelte
const navigationItems = [
	{
		title: 'Dashboard',
		url: '/admin',
		items: [
			{ title: 'Overview', url: '/admin' },
			{ title: 'Analytics', url: '/admin' },
			{ title: 'Recent Activity', url: '/admin' }
		]
	},
	{
		title: 'User Management',
		url: '/admin/users',
		items: [
			{ title: 'All Users', url: '/admin/users' },
			{ title: 'User Profiles', url: '/admin/users/profiles' },
			{ title: 'Login Sessions', url: '/admin/users/sessions' }
		]
	},
	{
		title: 'Access Control (RBAC)',
		url: '/admin/access-control',
		items: [
			{ title: 'Roles', url: '/admin/access-control/roles' },
			{ title: 'Permissions', url: '/admin/access-control/permissions' },
			{ title: 'Assign Roles', url: '/admin/access-control/assign' },
			{ title: 'Audit Access', url: '/admin/access-control/audit' }
		]
	},
	{
		title: 'Content Management',
		url: '/admin/content',
		items: [
			{ title: 'Pages', url: '/admin/content/pages' },
			{ title: 'Components', url: '/admin/content/components' },
			{ title: 'Menus', url: '/admin/content/menus' },
			{ title: 'Content Types', url: '/admin/content/types' }
		]
	},
	{
		title: 'Media Management',
		url: '/admin/media',
		items: [
			{ title: 'Media Library', url: '/admin/media' },
			{ title: 'Upload Files', url: '/admin/media/upload' },
			{ title: 'Organize Folders', url: '/admin/media/folders' }
		]
	},
	{
		title: 'System Health',
		url: '/admin/system',
		items: [
			{ title: 'System Status', url: '/admin/system/status' },
			{ title: 'Real-time Monitoring', url: '/admin/system/monitoring' },
			{ title: 'System Logs', url: '/admin/system/logs' },
			{ title: 'Performance Metrics', url: '/admin/system/performance' }
		]
	},
	{
		title: 'Documentation',
		url: '#',
		items: [
			{ title: 'Introduction', url: '#' },
			{ title: 'Get Started', url: '#' },
			{ title: 'Tutorials', url: '#' },
			{ title: 'Changelog', url: '#' }
		]
	},
	{
		title: 'Notifications',
		url: '/admin/notifications',
		items: [
			{ title: 'User Notifications', url: '/admin/notifications/user' },
			{ title: 'System Alerts', url: '/admin/notifications/system' },
			{ title: 'Email Templates', url: '/admin/notifications/templates' }
		]
	},
	{
		title: 'Security',
		url: '/admin/security',
		items: [
			{ title: 'Overview', url: '/admin/security' },
			{ title: 'IP Access Control', url: '/admin/security/ip-access' },
			{ title: 'Brute Force Protection', url: '/admin/security/brute-force' },
			{ title: 'Audit Trails', url: '/admin/security/audit-trails' }
		]
	},
	{
		title: 'Support',
		url: '/admin/support',
		items: [
			{ title: 'Support Tickets', url: '/admin/support/tickets' },
			{ title: 'Contact Submissions', url: '/admin/support/contact' },
			{ title: 'Knowledge Base', url: '/admin/support/knowledge-base' },
			{ title: 'Feedback', url: '/admin/support/feedback' }
		]
	}
];

function urlToFilePath(url) {
	if (url === '#' || url.startsWith('#')) {
		return null; // Skip placeholder URLs
	}
	
	// Convert URL to file path
	const path = url.replace(/^\//, ''); // Remove leading slash
	return join('src/routes', path, '+page.svelte');
}

function checkRouteExists(url) {
	const filePath = urlToFilePath(url);
	if (!filePath) return { exists: false, reason: 'Placeholder URL' };
	
	const exists = existsSync(filePath);
	return { 
		exists, 
		filePath,
		reason: exists ? 'OK' : 'File not found'
	};
}

function auditRoutes() {
	console.log('🔍 Admin Route Connectivity Audit\n');
	console.log('=' .repeat(50));
	
	let totalRoutes = 0;
	let missingRoutes = 0;
	let placeholderRoutes = 0;
	const issues = [];
	
	navigationItems.forEach(section => {
		console.log(`\n📁 ${section.title}`);
		console.log('-'.repeat(30));
		
		// Check main section URL
		const mainCheck = checkRouteExists(section.url);
		totalRoutes++;
		
		if (section.url === '#') {
			placeholderRoutes++;
			console.log(`   ${section.url} → ⚠️  Placeholder URL`);
		} else if (mainCheck.exists) {
			console.log(`   ${section.url} → ✅ ${mainCheck.filePath}`);
		} else {
			missingRoutes++;
			console.log(`   ${section.url} → ❌ ${mainCheck.filePath}`);
			issues.push({
				section: section.title,
				url: section.url,
				filePath: mainCheck.filePath,
				type: 'main'
			});
		}
		
		// Check sub-items
		if (section.items) {
			section.items.forEach(item => {
				const subCheck = checkRouteExists(item.url);
				totalRoutes++;
				
				if (item.url === '#' || item.url.startsWith('#')) {
					placeholderRoutes++;
					console.log(`     ${item.url} → ⚠️  Placeholder URL`);
				} else if (subCheck.exists) {
					console.log(`     ${item.url} → ✅ ${subCheck.filePath}`);
				} else {
					missingRoutes++;
					console.log(`     ${item.url} → ❌ ${subCheck.filePath}`);
					issues.push({
						section: section.title,
						url: item.url,
						filePath: subCheck.filePath,
						type: 'sub-item',
						title: item.title
					});
				}
			});
		}
	});
	
	// Summary
	console.log('\n' + '='.repeat(50));
	console.log('📊 AUDIT SUMMARY');
	console.log('='.repeat(50));
	console.log(`Total routes checked: ${totalRoutes}`);
	console.log(`✅ Existing routes: ${totalRoutes - missingRoutes - placeholderRoutes}`);
	console.log(`❌ Missing routes: ${missingRoutes}`);
	console.log(`⚠️  Placeholder routes: ${placeholderRoutes}`);
	
	if (issues.length > 0) {
		console.log('\n🚨 MISSING ROUTES TO CREATE:');
		console.log('-'.repeat(30));
		issues.forEach(issue => {
			console.log(`• ${issue.url}`);
			console.log(`  File: ${issue.filePath}`);
			console.log(`  Section: ${issue.section}${issue.title ? ` → ${issue.title}` : ''}`);
			console.log('');
		});
		
		console.log('💡 RECOMMENDED ACTIONS:');
		console.log('-'.repeat(30));
		console.log('1. Create missing page files for the routes listed above');
		console.log('2. Add proper navigation highlighting for active routes');
		console.log('3. Implement keyboard navigation support');
		console.log('4. Add ARIA labels and accessibility features');
		console.log('5. Test all navigation links manually');
	} else {
		console.log('\n🎉 All routes are properly connected!');
	}
	
	return {
		totalRoutes,
		missingRoutes,
		placeholderRoutes,
		issues
	};
}

// Run the audit
if (import.meta.url === `file://${process.argv[1]}`) {
	auditRoutes();
}

export { auditRoutes };