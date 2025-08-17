import { error } from '@sveltejs/kit';
import { BlogPostsCollection } from '$lib/db/collections/blogPosts.js';
import { PortfolioItemsCollection } from '$lib/db/collections/portfolioItems.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ url }) => {
	try {
		const query = url.searchParams.get('q') || '';
		const type = url.searchParams.get('type') || 'all'; // all, blog, portfolio, pages
		const page = parseInt(url.searchParams.get('page') || '1');
		const limit = parseInt(url.searchParams.get('limit') || '12');
		const sortBy = url.searchParams.get('sort') || 'relevance'; // relevance, date, title

		const skip = (page - 1) * limit;

		// If no query, return empty results
		if (!query.trim()) {
			return {
				query: '',
				results: {
					blog: { posts: [], total: 0 },
					portfolio: { items: [], total: 0 },
					pages: { pages: [], total: 0 },
					total: 0
				},
				pagination: {
					page: 1,
					limit,
					totalPages: 0
				},
				filters: {
					type,
					sortBy
				},
				suggestions: []
			};
		}

		// Search across different content types
		const searchPromises: Promise<any>[] = [];

		// Search blog posts if type is 'all' or 'blog'
		if (type === 'all' || type === 'blog') {
			searchPromises.push(
				BlogPostsCollection.search(query, {
					status: 'published',
					limit: type === 'blog' ? limit : Math.ceil(limit / 3),
					skip: type === 'blog' ? skip : 0
				}).then(result => ({ type: 'blog', ...result }))
			);
		}

		// Search portfolio items if type is 'all' or 'portfolio'
		if (type === 'all' || type === 'portfolio') {
			searchPromises.push(
				PortfolioItemsCollection.search(query, {
					limit: type === 'portfolio' ? limit : Math.ceil(limit / 3),
					skip: type === 'portfolio' ? skip : 0
				}).then(result => ({ type: 'portfolio', items: result.items, total: result.total }))
			);
		}

		// Search static pages if type is 'all' or 'pages'
		if (type === 'all' || type === 'pages') {
			// For now, we'll create a simple static pages search
			// In a real implementation, you might want to index page content
			const staticPages = [
				{
					title: 'About Us',
					description: 'Learn more about our company, mission, and team.',
					url: '/about',
					type: 'page'
				},
				{
					title: 'Services',
					description: 'Discover our comprehensive range of services and solutions.',
					url: '/services',
					type: 'page'
				},
				{
					title: 'Contact',
					description: 'Get in touch with us for inquiries and support.',
					url: '/contact',
					type: 'page'
				},
				{
					title: 'Help Center',
					description: 'Find answers to frequently asked questions and get support.',
					url: '/help',
					type: 'page'
				},
				{
					title: 'Privacy Policy',
					description: 'Read our privacy policy and data protection practices.',
					url: '/privacy',
					type: 'page'
				},
				{
					title: 'Terms of Service',
					description: 'Review our terms of service and user agreement.',
					url: '/terms',
					type: 'page'
				}
			];

			const filteredPages = staticPages.filter(page =>
				page.title.toLowerCase().includes(query.toLowerCase()) ||
				page.description.toLowerCase().includes(query.toLowerCase())
			);

			searchPromises.push(
				Promise.resolve({
					type: 'pages',
					pages: type === 'pages' ? filteredPages.slice(skip, skip + limit) : filteredPages.slice(0, Math.ceil(limit / 3)),
					total: filteredPages.length
				})
			);
		}

		const searchResults = await Promise.all(searchPromises);

		// Combine results
		const results = {
			blog: { posts: [], total: 0 },
			portfolio: { items: [], total: 0 },
			pages: { pages: [], total: 0 },
			total: 0
		};

		searchResults.forEach(result => {
			if (result.type === 'blog') {
				results.blog = {
					posts: result.posts.map((post: any) => ({
						...post,
						_id: post._id.toString(),
						author: post.author.toString(),
						createdAt: post.createdAt.toISOString(),
						updatedAt: post.updatedAt.toISOString(),
						publishedAt: post.publishedAt?.toISOString() || null
					})),
					total: result.total
				};
			} else if (result.type === 'portfolio') {
				results.portfolio = {
					items: result.items.map((item: any) => ({
						...item,
						_id: item._id.toString(),
						createdAt: item.createdAt.toISOString(),
						updatedAt: item.updatedAt.toISOString()
					})),
					total: result.total
				};
			} else if (result.type === 'pages') {
				results.pages = {
					pages: result.pages,
					total: result.total
				};
			}
		});

		results.total = results.blog.total + results.portfolio.total + results.pages.total;

		// Generate search suggestions (simple implementation)
		const suggestions = await generateSearchSuggestions(query);

		// Calculate pagination based on selected type
		let totalForPagination = results.total;
		if (type === 'blog') totalForPagination = results.blog.total;
		else if (type === 'portfolio') totalForPagination = results.portfolio.total;
		else if (type === 'pages') totalForPagination = results.pages.total;

		return {
			query,
			results,
			pagination: {
				page,
				limit,
				totalPages: Math.ceil(totalForPagination / limit)
			},
			filters: {
				type,
				sortBy
			},
			suggestions
		};
	} catch (err) {
		console.error('Error performing search:', err);
		throw error(500, 'Failed to perform search');
	}
};

async function generateSearchSuggestions(query: string): Promise<string[]> {
	// Simple suggestion generation - in a real app you might use a more sophisticated approach
	const suggestions: string[] = [];
	
	try {
		// Get some popular terms from blog tags and portfolio technologies
		const [blogResult, portfolioCategories, portfolioTechnologies] = await Promise.all([
			BlogPostsCollection.getPublishedPosts({ limit: 50 }),
			PortfolioItemsCollection.getCategories(),
			PortfolioItemsCollection.getTechnologies()
		]);

		// Extract tags from blog posts
		const allTags = blogResult.posts.flatMap(post => post.tags || []);
		const uniqueTags = [...new Set(allTags)];

		// Combine all potential suggestions
		const allSuggestions = [
			...uniqueTags,
			...portfolioCategories,
			...portfolioTechnologies,
			'web development',
			'design',
			'tutorial',
			'guide',
			'tips',
			'best practices'
		];

		// Filter suggestions that are similar to the query
		const queryLower = query.toLowerCase();
		const filteredSuggestions = allSuggestions
			.filter(suggestion => 
				suggestion.toLowerCase().includes(queryLower) || 
				queryLower.includes(suggestion.toLowerCase())
			)
			.filter(suggestion => suggestion.toLowerCase() !== queryLower)
			.slice(0, 5);

		suggestions.push(...filteredSuggestions);
	} catch (error) {
		console.error('Error generating suggestions:', error);
	}

	return suggestions;
}