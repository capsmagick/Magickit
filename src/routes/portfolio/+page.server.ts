import { error } from '@sveltejs/kit';
import { PortfolioItemsCollection } from '$lib/db/collections/portfolioItems.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ url }) => {
	try {
		// Get query parameters
		const page = parseInt(url.searchParams.get('page') || '1');
		const limit = parseInt(url.searchParams.get('limit') || '12');
		const category = url.searchParams.get('category');
		const technology = url.searchParams.get('technology');

		const skip = (page - 1) * limit;

		// Build filter options
		const filterOptions: any = {
			limit,
			skip,
			sortBy: 'createdAt' as const,
			sortOrder: 'desc' as const
		};

		if (category) {
			filterOptions.category = category;
		}

		if (technology) {
			filterOptions.technologies = [technology];
		}

		// Fetch portfolio items
		const result = await PortfolioItemsCollection.findAll(filterOptions);

		// Fetch featured items separately
		const featuredResult = await PortfolioItemsCollection.findAll({
			featured: true,
			limit: 6,
			sortBy: 'createdAt',
			sortOrder: 'desc'
		});

		// Get all categories and technologies for filtering
		const [categories, technologies] = await Promise.all([
			PortfolioItemsCollection.getCategories(),
			PortfolioItemsCollection.getTechnologies()
		]);

		return {
			items: result.items.map(item => ({
				...item,
				_id: item._id.toString(),
				createdAt: item.createdAt.toISOString(),
				updatedAt: item.updatedAt.toISOString()
			})),
			featuredItems: featuredResult.items.map(item => ({
				...item,
				_id: item._id.toString(),
				createdAt: item.createdAt.toISOString(),
				updatedAt: item.updatedAt.toISOString()
			})),
			total: result.total,
			categories,
			technologies,
			pagination: {
				page,
				limit,
				totalPages: Math.ceil(result.total / limit)
			},
			filters: {
				category,
				technology
			}
		};
	} catch (err) {
		console.error('Error loading portfolio items:', err);
		throw error(500, 'Failed to load portfolio items');
	}
};