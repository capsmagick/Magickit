import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const baseUrl = 'https://magickit.dev';
	
	// Static pages with their priorities and change frequencies
	const staticPages = [
		{ url: '', priority: '1.0', changefreq: 'weekly' }, // Homepage
		{ url: '/about', priority: '0.8', changefreq: 'monthly' },
		{ url: '/services', priority: '0.8', changefreq: 'monthly' },
		{ url: '/contact', priority: '0.7', changefreq: 'monthly' },
		{ url: '/blog', priority: '0.9', changefreq: 'weekly' },
		{ url: '/portfolio', priority: '0.8', changefreq: 'weekly' },
		{ url: '/pricing', priority: '0.8', changefreq: 'monthly' },
		{ url: '/faq', priority: '0.7', changefreq: 'monthly' },
		{ url: '/help', priority: '0.6', changefreq: 'monthly' },
		{ url: '/privacy', priority: '0.5', changefreq: 'yearly' },
		{ url: '/terms', priority: '0.5', changefreq: 'yearly' },
		{ url: '/sitemap', priority: '0.4', changefreq: 'monthly' }
	];

	// TODO: In a real application, you would fetch dynamic content from your database
	// For now, we'll include some example blog posts and portfolio items
	const dynamicPages = [
		// Example blog posts - replace with actual database queries
		{ url: '/blog/getting-started-with-magickit', priority: '0.7', changefreq: 'monthly', lastmod: '2024-01-15' },
		{ url: '/blog/building-saas-with-sveltekit', priority: '0.7', changefreq: 'monthly', lastmod: '2024-01-10' },
		{ url: '/blog/authentication-best-practices', priority: '0.7', changefreq: 'monthly', lastmod: '2024-01-05' }
	];

	const currentDate = new Date().toISOString().split('T')[0];

	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
${dynamicPages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${page.lastmod || currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

	return new Response(sitemap, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'max-age=3600' // Cache for 1 hour
		}
	});
};