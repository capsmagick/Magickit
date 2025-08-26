import { ContentInstancesCollection } from '$lib/db/collections/contentInstances.js';
import { ContentTypesCollection } from '$lib/db/collections/contentTypes.js';

export interface SitemapEntry {
	url: string;
	lastmod?: string;
	changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
	priority?: number;
}

/**
 * Generate sitemap entries for all published content
 */
export async function generateDynamicSitemap(baseUrl: string = 'https://magickit.dev'): Promise<SitemapEntry[]> {
	try {
		const entries: SitemapEntry[] = [];

		// Get all published content instances
		const { instances } = await ContentInstancesCollection.getPublishedInstances({
			limit: 1000 // Adjust as needed
		});

		// Get all content types for priority mapping
		const { contentTypes } = await ContentTypesCollection.findAll();
		const contentTypeMap = new Map(contentTypes.map(ct => [ct._id, ct]));

		for (const instance of instances) {
			const contentType = contentTypeMap.get(instance.contentTypeId);
			
			if (!contentType) continue;

			// Determine change frequency based on content type
			let changefreq: SitemapEntry['changefreq'] = 'monthly';
			let priority = 0.5;

			switch (contentType.slug) {
				case 'blog-post':
				case 'article':
				case 'news':
					changefreq = 'weekly';
					priority = 0.7;
					break;
				case 'page':
					changefreq = 'monthly';
					priority = 0.8;
					break;
				case 'home':
					changefreq = 'daily';
					priority = 1.0;
					break;
				case 'portfolio-item':
					changefreq = 'monthly';
					priority = 0.6;
					break;
				case 'service':
					changefreq = 'monthly';
					priority = 0.7;
					break;
				default:
					changefreq = 'monthly';
					priority = 0.5;
			}

			entries.push({
				url: `${baseUrl}/${instance.slug}`,
				lastmod: instance.updatedAt.toISOString(),
				changefreq,
				priority
			});
		}

		return entries;
	} catch (error) {
		console.error('Error generating dynamic sitemap:', error);
		return [];
	}
}

/**
 * Generate XML sitemap from entries
 */
export function generateSitemapXML(entries: SitemapEntry[]): string {
	const xmlEntries = entries.map(entry => {
		let xml = `  <url>\n    <loc>${entry.url}</loc>`;
		
		if (entry.lastmod) {
			xml += `\n    <lastmod>${entry.lastmod}</lastmod>`;
		}
		
		if (entry.changefreq) {
			xml += `\n    <changefreq>${entry.changefreq}</changefreq>`;
		}
		
		if (entry.priority !== undefined) {
			xml += `\n    <priority>${entry.priority}</priority>`;
		}
		
		xml += '\n  </url>';
		return xml;
	}).join('\n');

	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>`;
}

/**
 * Get static sitemap entries (non-dynamic pages)
 */
export function getStaticSitemapEntries(baseUrl: string = 'https://magickit.dev'): SitemapEntry[] {
	return [
		{
			url: baseUrl,
			changefreq: 'daily',
			priority: 1.0
		},
		{
			url: `${baseUrl}/about`,
			changefreq: 'monthly',
			priority: 0.8
		},
		{
			url: `${baseUrl}/blog`,
			changefreq: 'daily',
			priority: 0.9
		},
		{
			url: `${baseUrl}/portfolio`,
			changefreq: 'weekly',
			priority: 0.8
		},
		{
			url: `${baseUrl}/services`,
			changefreq: 'monthly',
			priority: 0.8
		},
		{
			url: `${baseUrl}/contact`,
			changefreq: 'monthly',
			priority: 0.7
		},
		{
			url: `${baseUrl}/pricing`,
			changefreq: 'monthly',
			priority: 0.7
		},
		{
			url: `${baseUrl}/faq`,
			changefreq: 'monthly',
			priority: 0.6
		},
		{
			url: `${baseUrl}/privacy`,
			changefreq: 'yearly',
			priority: 0.3
		},
		{
			url: `${baseUrl}/terms`,
			changefreq: 'yearly',
			priority: 0.3
		}
	];
}