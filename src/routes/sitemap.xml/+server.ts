import type { RequestHandler } from './$types';
import { generateDynamicSitemap, getStaticSitemapEntries, generateSitemapXML } from '$lib/utils/sitemap.js';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const baseUrl = url.origin;
		
		// Get static sitemap entries
		const staticEntries = getStaticSitemapEntries(baseUrl);
		
		// Get dynamic content entries
		const dynamicEntries = await generateDynamicSitemap(baseUrl);
		
		// Combine all entries
		const allEntries = [...staticEntries, ...dynamicEntries];
		
		// Generate XML sitemap
		const sitemapXML = generateSitemapXML(allEntries);

		return new Response(sitemapXML, {
			headers: {
				'Content-Type': 'application/xml',
				'Cache-Control': 'public, max-age=3600, s-maxage=7200' // Cache for 1 hour in browser, 2 hours in CDN
			}
		});
	} catch (error) {
		console.error('Error generating sitemap:', error);
		
		// Fallback to basic sitemap if dynamic generation fails
		const baseUrl = url.origin;
		const basicSitemap = generateSitemapXML(getStaticSitemapEntries(baseUrl));
		
		return new Response(basicSitemap, {
			headers: {
				'Content-Type': 'application/xml',
				'Cache-Control': 'public, max-age=300' // Shorter cache for fallback
			}
		});
	}
};