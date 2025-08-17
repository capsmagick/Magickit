import { BlogPostsCollection } from '$lib/db/collections/blogPosts.js';
import { PortfolioItemsCollection } from '$lib/db/collections/portfolioItems.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async () => {
	try {
		// Get all published blog posts
		const blogResult = await BlogPostsCollection.getPublishedPosts({ limit: 1000 });
		
		// Get all portfolio items
		const portfolioResult = await PortfolioItemsCollection.findAll({ limit: 1000 });

		// Static pages with their information
		const staticPages = [
			{
				title: 'Home',
				url: '/',
				description: 'Welcome to Magickit - Universal web application template',
				lastModified: new Date().toISOString(),
				priority: 'high',
				category: 'Main'
			},
			{
				title: 'About Us',
				url: '/about',
				description: 'Learn more about our company, mission, and team',
				lastModified: new Date().toISOString(),
				priority: 'high',
				category: 'Company'
			},
			{
				title: 'Services',
				url: '/services',
				description: 'Discover our comprehensive range of services and solutions',
				lastModified: new Date().toISOString(),
				priority: 'high',
				category: 'Company'
			},
			{
				title: 'Contact',
				url: '/contact',
				description: 'Get in touch with us for inquiries and support',
				lastModified: new Date().toISOString(),
				priority: 'high',
				category: 'Company'
			},
			{
				title: 'Blog',
				url: '/blog',
				description: 'Read our latest blog posts and insights',
				lastModified: new Date().toISOString(),
				priority: 'high',
				category: 'Content'
			},
			{
				title: 'Portfolio',
				url: '/portfolio',
				description: 'Explore our portfolio of projects and work',
				lastModified: new Date().toISOString(),
				priority: 'high',
				category: 'Content'
			},
			{
				title: 'Search',
				url: '/search',
				description: 'Search across all content and pages',
				lastModified: new Date().toISOString(),
				priority: 'medium',
				category: 'Tools'
			},
			{
				title: 'Help Center',
				url: '/help',
				description: 'Find answers to frequently asked questions and get support',
				lastModified: new Date().toISOString(),
				priority: 'medium',
				category: 'Support'
			},
			{
				title: 'Privacy Policy',
				url: '/privacy',
				description: 'Read our privacy policy and data protection practices',
				lastModified: new Date().toISOString(),
				priority: 'low',
				category: 'Legal'
			},
			{
				title: 'Terms of Service',
				url: '/terms',
				description: 'Review our terms of service and user agreement',
				lastModified: new Date().toISOString(),
				priority: 'low',
				category: 'Legal'
			},
			{
				title: 'Coming Soon',
				url: '/coming-soon',
				description: 'Preview of upcoming features and announcements',
				lastModified: new Date().toISOString(),
				priority: 'low',
				category: 'Tools'
			}
		];

		// Authentication pages (public access)
		const authPages = [
			{
				title: 'Login',
				url: '/login',
				description: 'Sign in to your account',
				lastModified: new Date().toISOString(),
				priority: 'medium',
				category: 'Authentication'
			},
			{
				title: 'Sign Up',
				url: '/signup',
				description: 'Create a new account',
				lastModified: new Date().toISOString(),
				priority: 'medium',
				category: 'Authentication'
			}
		];

		// Convert blog posts to sitemap format
		const blogPages = blogResult.posts.map(post => ({
			title: post.title,
			url: `/blog/${post.slug}`,
			description: post.excerpt,
			lastModified: (post.updatedAt || post.createdAt).toISOString(),
			priority: post.featured ? 'high' : 'medium',
			category: 'Blog Posts'
		}));

		// Note: Portfolio items don't have individual pages in the current implementation
		// If they did, you would add them here similar to blog posts

		// Organize pages by category
		const pagesByCategory = {
			'Main': staticPages.filter(p => p.category === 'Main'),
			'Company': staticPages.filter(p => p.category === 'Company'),
			'Content': staticPages.filter(p => p.category === 'Content'),
			'Blog Posts': blogPages,
			'Authentication': authPages,
			'Support': staticPages.filter(p => p.category === 'Support'),
			'Tools': staticPages.filter(p => p.category === 'Tools'),
			'Legal': staticPages.filter(p => p.category === 'Legal')
		};

		// Calculate totals
		const totalPages = Object.values(pagesByCategory).reduce((total, pages) => total + pages.length, 0);

		// Get last update date (most recent content update)
		const lastUpdate = new Date(Math.max(
			...blogResult.posts.map(post => new Date(post.updatedAt || post.createdAt).getTime()),
			...portfolioResult.items.map(item => new Date(item.updatedAt || item.createdAt).getTime()),
			new Date().getTime()
		)).toISOString();

		return {
			pagesByCategory,
			totalPages,
			lastUpdate,
			stats: {
				blogPosts: blogResult.total,
				portfolioItems: portfolioResult.total,
				staticPages: staticPages.length + authPages.length
			}
		};
	} catch (error) {
		console.error('Error generating sitemap data:', error);
		
		// Return minimal sitemap on error
		const fallbackPages = {
			'Main': [
				{
					title: 'Home',
					url: '/',
					description: 'Welcome to Magickit',
					lastModified: new Date().toISOString(),
					priority: 'high',
					category: 'Main'
				}
			]
		};

		return {
			pagesByCategory: fallbackPages,
			totalPages: 1,
			lastUpdate: new Date().toISOString(),
			stats: {
				blogPosts: 0,
				portfolioItems: 0,
				staticPages: 1
			}
		};
	}
};