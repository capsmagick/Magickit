import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const baseUrl = url.origin;
	
	const robotsTxt = `User-agent: *
Allow: /

# Disallow admin pages from search engines
Disallow: /admin/
Disallow: /my-account/

# Disallow authentication pages
Disallow: /login
Disallow: /signup

# Allow important pages
Allow: /
Allow: /about
Allow: /services
Allow: /contact
Allow: /blog
Allow: /portfolio
Allow: /pricing
Allow: /faq
Allow: /help
Allow: /privacy
Allow: /terms

# Sitemap location
Sitemap: ${baseUrl}/sitemap.xml

# Crawl delay (optional - be respectful to search engines)
Crawl-delay: 1`;

	return new Response(robotsTxt, {
		headers: {
			'Content-Type': 'text/plain',
			'Cache-Control': 'max-age=86400' // Cache for 24 hours
		}
	});
};