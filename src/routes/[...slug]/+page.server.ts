import { error } from '@sveltejs/kit';
import { ContentInstancesCollection } from '$lib/db/collections/contentInstances.js';
import { ContentTypesCollection } from '$lib/db/collections/contentTypes.js';
import { cacheService, CacheKeys } from '$lib/services/cache.js';
import { performanceService } from '$lib/services/performance.js';
import { contentService } from '$lib/services/content.js';
import type { PageServerLoad } from './$types.js';
import type { ContentInstance, ContentType } from '$lib/db/models.js';

export const load: PageServerLoad = async ({ params, setHeaders, url, request }) => {
	const requestId = `ssr-${params.slug || 'home'}-${Date.now()}`;
	const slug = params.slug || 'home';
	
	// Start performance monitoring
	performanceService.startTiming(requestId);

	try {
		// Use the enhanced performance monitoring with caching
		const result = await performanceService.monitorSSRPage(
			slug,
			async () => {
				// Fetch content using the enhanced content service with caching
				const contentInstance = await contentService.getContentInstanceBySlug(slug);

				if (!contentInstance) {
					throw error(404, `Page not found: ${slug}`);
				}

				// Fetch the content type to understand the structure
				const contentType = await ContentTypesCollection.findById(contentInstance.contentTypeId);

				if (!contentType) {
					console.error(`Content type not found for instance: ${contentInstance._id}`);
					throw error(500, 'Content configuration error');
				}

				// Generate SEO meta data from content
				const seoData = generateSEOFromContent(contentInstance, contentType, url);

				// Generate structured data
				const structuredData = generateStructuredDataFromContent(contentInstance, contentType, url);

				// Prepare response data
				return {
					content: {
						...contentInstance,
						_id: contentInstance._id.toString(),
						contentTypeId: contentInstance.contentTypeId.toString(),
						createdAt: contentInstance.createdAt.toISOString(),
						updatedAt: contentInstance.updatedAt.toISOString(),
						publishedAt: contentInstance.publishedAt?.toISOString() || null
					},
					contentType: {
						...contentType,
						_id: contentType._id.toString(),
						fields: contentType.fields.map(field => ({
							...field,
							_id: field._id.toString()
						})),
						createdAt: contentType.createdAt.toISOString(),
						updatedAt: contentType.updatedAt.toISOString()
					},
					seo: seoData,
					structuredData
				};
			},
			{
				cacheKey: CacheKeys.pageRender(slug),
				cacheTTL: 15 * 60 * 1000 // 15 minutes
			}
		);
		// Set optimized caching headers
		setHeaders({
			'cache-control': 'public, max-age=300, s-maxage=3600', // 5 min browser, 1 hour CDN
			'vary': 'Accept-Encoding',
			'x-content-type-options': 'nosniff',
			'x-frame-options': 'DENY',
			'x-xss-protection': '1; mode=block'
		});

		// End performance monitoring
		await performanceService.endTiming(
			requestId,
			`/[slug]/${slug}`,
			'GET',
			200,
			{
				userAgent: request.headers.get('user-agent') || undefined,
				ip: request.headers.get('x-forwarded-for') || 
					request.headers.get('x-real-ip') || 
					undefined
			}
		);

		return result;
	} catch (err) {
		// End performance monitoring on error
		const statusCode = err instanceof Error && 'status' in err ? (err as any).status : 500;
		
		await performanceService.endTiming(
			requestId,
			`/[slug]/${slug}`,
			'GET',
			statusCode,
			{
				userAgent: request.headers.get('user-agent') || undefined,
				ip: request.headers.get('x-forwarded-for') || 
					request.headers.get('x-real-ip') || 
					undefined
			}
		);

		console.error('Error loading dynamic content:', err);
		
		// If it's already a SvelteKit error, re-throw it
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		
		// Otherwise, throw a generic 500 error
		throw error(500, 'Failed to load page content');
	}
};

/**
 * Generate SEO metadata from content instance
 */
function generateSEOFromContent(
	content: ContentInstance, 
	contentType: ContentType, 
	url: URL
): {
	title: string;
	description: string;
	keywords: string[];
	canonical: string;
	ogImage?: string;
	ogType: 'website' | 'article';
	publishedTime?: string;
	modifiedTime?: string;
} {
	// Extract title from content data
	const title = content.data.title || 
		content.data.name || 
		content.data.heading || 
		`${contentType.name} - ${content.slug}`;

	// Extract description from content data
	const description = content.data.description || 
		content.data.excerpt || 
		content.data.summary || 
		`${contentType.description || contentType.name} page`;

	// Extract keywords from content data and tags
	const keywords: string[] = [];
	if (content.data.keywords && Array.isArray(content.data.keywords)) {
		keywords.push(...content.data.keywords);
	}
	if (content.data.tags && Array.isArray(content.data.tags)) {
		keywords.push(...content.data.tags);
	}
	// Add content type as a keyword
	keywords.push(contentType.name.toLowerCase());

	// Extract featured image for OG image
	const ogImage = content.data.featuredImage || 
		content.data.image || 
		content.data.thumbnail;

	// Determine OG type based on content type
	const ogType = contentType.slug === 'blog-post' || 
		contentType.slug === 'article' || 
		contentType.slug === 'news' ? 'article' : 'website';

	return {
		title: `${title} | MagicKit`,
		description,
		keywords: [...new Set(keywords)], // Remove duplicates
		canonical: url.toString(),
		ogImage,
		ogType,
		publishedTime: content.publishedAt?.toISOString(),
		modifiedTime: content.updatedAt.toISOString()
	};
}

/**
 * Generate structured data from content instance
 */
function generateStructuredDataFromContent(
	content: ContentInstance,
	contentType: ContentType,
	url: URL
): any[] {
	const structuredData: any[] = [];

	// Always include WebPage structured data
	structuredData.push({
		'@context': 'https://schema.org',
		'@type': 'WebPage',
		'@id': url.toString(),
		url: url.toString(),
		name: content.data.title || content.slug,
		description: content.data.description || contentType.description,
		datePublished: content.publishedAt?.toISOString() || content.createdAt.toISOString(),
		dateModified: content.updatedAt.toISOString(),
		isPartOf: {
			'@type': 'WebSite',
			'@id': `${url.origin}/#website`,
			url: url.origin,
			name: 'MagicKit'
		}
	});

	// Add specific structured data based on content type
	if (contentType.slug === 'blog-post' || contentType.slug === 'article') {
		structuredData.push({
			'@context': 'https://schema.org',
			'@type': 'Article',
			'@id': url.toString(),
			headline: content.data.title,
			description: content.data.description || content.data.excerpt,
			image: content.data.featuredImage,
			author: {
				'@type': 'Person',
				name: content.data.author || 'MagicKit Team'
			},
			publisher: {
				'@type': 'Organization',
				name: 'MagicKit',
				logo: {
					'@type': 'ImageObject',
					url: `${url.origin}/logo.png`
				}
			},
			datePublished: content.publishedAt?.toISOString() || content.createdAt.toISOString(),
			dateModified: content.updatedAt.toISOString(),
			mainEntityOfPage: {
				'@type': 'WebPage',
				'@id': url.toString()
			},
			keywords: content.data.tags?.join(', ') || ''
		});
	}

	// Add FAQ structured data if content has FAQ fields
	if (content.data.faqs && Array.isArray(content.data.faqs)) {
		structuredData.push({
			'@context': 'https://schema.org',
			'@type': 'FAQPage',
			mainEntity: content.data.faqs.map((faq: any) => ({
				'@type': 'Question',
				name: faq.question,
				acceptedAnswer: {
					'@type': 'Answer',
					text: faq.answer
				}
			}))
		});
	}

	// Add Product/Service structured data for portfolio items
	if (contentType.slug === 'portfolio-item' || contentType.slug === 'service') {
		structuredData.push({
			'@context': 'https://schema.org',
			'@type': contentType.slug === 'service' ? 'Service' : 'CreativeWork',
			name: content.data.title || content.data.name,
			description: content.data.description,
			image: content.data.featuredImage || content.data.image,
			url: url.toString(),
			provider: {
				'@type': 'Organization',
				name: 'MagicKit'
			}
		});
	}

	// Add breadcrumb structured data
	const breadcrumbs = generateBreadcrumbsFromContent(content, contentType, url);
	if (breadcrumbs.length > 1) {
		structuredData.push({
			'@context': 'https://schema.org',
			'@type': 'BreadcrumbList',
			itemListElement: breadcrumbs.map((crumb, index) => ({
				'@type': 'ListItem',
				position: index + 1,
				name: crumb.name,
				item: crumb.url
			}))
		});
	}

	return structuredData;
}

/**
 * Generate breadcrumbs from content
 */
function generateBreadcrumbsFromContent(
	content: ContentInstance,
	contentType: ContentType,
	url: URL
): Array<{ name: string; url: string }> {
	const breadcrumbs = [
		{ name: 'Home', url: url.origin }
	];

	// Add content type as a breadcrumb if it has a listing page
	if (contentType.slug === 'blog-post') {
		breadcrumbs.push({ name: 'Blog', url: `${url.origin}/blog` });
	} else if (contentType.slug === 'portfolio-item') {
		breadcrumbs.push({ name: 'Portfolio', url: `${url.origin}/portfolio` });
	} else if (contentType.slug === 'service') {
		breadcrumbs.push({ name: 'Services', url: `${url.origin}/services` });
	}

	// Add current page
	breadcrumbs.push({ 
		name: content.data.title || content.slug, 
		url: url.toString() 
	});

	return breadcrumbs;
}