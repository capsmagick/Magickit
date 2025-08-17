/**
 * SEO utilities for meta tags, structured data, and Open Graph
 */

export interface SEOData {
	title: string;
	description: string;
	keywords?: string[];
	canonical?: string;
	ogImage?: string;
	ogType?: 'website' | 'article' | 'product' | 'profile';
	twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
	author?: string;
	publishedTime?: string;
	modifiedTime?: string;
	section?: string;
	tags?: string[];
	noIndex?: boolean;
	noFollow?: boolean;
}

export interface StructuredData {
	'@context': string;
	'@type': string;
	[key: string]: any;
}

/**
 * Generate complete SEO meta tags for a page
 */
export function generateSEOTags(data: SEOData, baseUrl: string = 'https://magickit.dev'): string {
	const {
		title,
		description,
		keywords = [],
		canonical,
		ogImage = `${baseUrl}/og-default.jpg`,
		ogType = 'website',
		twitterCard = 'summary_large_image',
		author,
		publishedTime,
		modifiedTime,
		section,
		tags = [],
		noIndex = false,
		noFollow = false
	} = data;

	const robotsContent = [];
	if (noIndex) robotsContent.push('noindex');
	if (noFollow) robotsContent.push('nofollow');
	if (robotsContent.length === 0) robotsContent.push('index', 'follow');

	const metaTags = [
		// Basic meta tags
		`<title>${title}</title>`,
		`<meta name="description" content="${description}" />`,
		keywords.length > 0 ? `<meta name="keywords" content="${keywords.join(', ')}" />` : '',
		`<meta name="robots" content="${robotsContent.join(', ')}" />`,
		author ? `<meta name="author" content="${author}" />` : '',
		
		// Open Graph tags
		`<meta property="og:title" content="${title}" />`,
		`<meta property="og:description" content="${description}" />`,
		`<meta property="og:type" content="${ogType}" />`,
		`<meta property="og:image" content="${ogImage}" />`,
		`<meta property="og:url" content="${canonical || baseUrl}" />`,
		`<meta property="og:site_name" content="MagicKit" />`,
		publishedTime ? `<meta property="article:published_time" content="${publishedTime}" />` : '',
		modifiedTime ? `<meta property="article:modified_time" content="${modifiedTime}" />` : '',
		author ? `<meta property="article:author" content="${author}" />` : '',
		section ? `<meta property="article:section" content="${section}" />` : '',
		...tags.map(tag => `<meta property="article:tag" content="${tag}" />`),
		
		// Twitter Card tags
		`<meta name="twitter:card" content="${twitterCard}" />`,
		`<meta name="twitter:title" content="${title}" />`,
		`<meta name="twitter:description" content="${description}" />`,
		`<meta name="twitter:image" content="${ogImage}" />`,
		`<meta name="twitter:site" content="@magickit" />`,
		
		// Canonical URL
		canonical ? `<link rel="canonical" href="${canonical}" />` : ''
	];

	return metaTags.filter(tag => tag.length > 0).join('\n\t');
}

/**
 * Generate Organization structured data
 */
export function generateOrganizationSchema(baseUrl: string = 'https://magickit.dev'): StructuredData {
	return {
		'@context': 'https://schema.org',
		'@type': 'Organization',
		name: 'MagicKit',
		description: 'Universal web application template built with SvelteKit, Better Auth, and modern UI components',
		url: baseUrl,
		logo: `${baseUrl}/logo.png`,
		sameAs: [
			'https://github.com/magickit',
			'https://twitter.com/magickit'
		],
		contactPoint: {
			'@type': 'ContactPoint',
			telephone: '+1-555-0123',
			contactType: 'customer service',
			availableLanguage: 'English'
		}
	};
}

/**
 * Generate WebSite structured data with search action
 */
export function generateWebSiteSchema(baseUrl: string = 'https://magickit.dev'): StructuredData {
	return {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: 'MagicKit',
		description: 'Universal web application template for rapid development',
		url: baseUrl,
		potentialAction: {
			'@type': 'SearchAction',
			target: {
				'@type': 'EntryPoint',
				urlTemplate: `${baseUrl}/search?q={search_term_string}`
			},
			'query-input': 'required name=search_term_string'
		}
	};
}

/**
 * Generate Article structured data for blog posts
 */
export function generateArticleSchema(
	article: {
		title: string;
		description: string;
		author: string;
		publishedTime: string;
		modifiedTime?: string;
		image?: string;
		url: string;
		tags?: string[];
	},
	baseUrl: string = 'https://magickit.dev'
): StructuredData {
	return {
		'@context': 'https://schema.org',
		'@type': 'Article',
		headline: article.title,
		description: article.description,
		image: article.image || `${baseUrl}/og-default.jpg`,
		author: {
			'@type': 'Person',
			name: article.author
		},
		publisher: {
			'@type': 'Organization',
			name: 'MagicKit',
			logo: {
				'@type': 'ImageObject',
				url: `${baseUrl}/logo.png`
			}
		},
		datePublished: article.publishedTime,
		dateModified: article.modifiedTime || article.publishedTime,
		mainEntityOfPage: {
			'@type': 'WebPage',
			'@id': article.url
		},
		keywords: article.tags?.join(', ') || ''
	};
}

/**
 * Generate Product structured data for portfolio items
 */
export function generateProductSchema(
	product: {
		name: string;
		description: string;
		image?: string;
		url: string;
		category: string;
		technologies: string[];
	},
	baseUrl: string = 'https://magickit.dev'
): StructuredData {
	return {
		'@context': 'https://schema.org',
		'@type': 'SoftwareApplication',
		name: product.name,
		description: product.description,
		image: product.image || `${baseUrl}/og-default.jpg`,
		url: product.url,
		applicationCategory: product.category,
		operatingSystem: 'Web Browser',
		programmingLanguage: product.technologies,
		author: {
			'@type': 'Organization',
			name: 'MagicKit'
		}
	};
}

/**
 * Generate FAQ structured data
 */
export function generateFAQSchema(
	faqs: Array<{ question: string; answer: string }>
): StructuredData {
	return {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: faqs.map(faq => ({
			'@type': 'Question',
			name: faq.question,
			acceptedAnswer: {
				'@type': 'Answer',
				text: faq.answer
			}
		}))
	};
}

/**
 * Generate BreadcrumbList structured data
 */
export function generateBreadcrumbSchema(
	breadcrumbs: Array<{ name: string; url: string }>,
	baseUrl: string = 'https://magickit.dev'
): StructuredData {
	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: breadcrumbs.map((crumb, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: crumb.name,
			item: crumb.url.startsWith('http') ? crumb.url : `${baseUrl}${crumb.url}`
		}))
	};
}

/**
 * Convert structured data to JSON-LD script tag
 */
export function structuredDataToScript(data: StructuredData | StructuredData[]): string {
	const jsonData = Array.isArray(data) ? data : [data];
	return `<script type="application/ld+json">${JSON.stringify(jsonData, null, 2)}</script>`;
}

/**
 * Default SEO configuration for the site
 */
export const defaultSEO: Partial<SEOData> = {
	title: 'MagicKit - Universal Web Application Template',
	description: 'Build amazing web applications with our universal template featuring SvelteKit, Better Auth, TypeScript, and modern UI components.',
	keywords: ['SvelteKit', 'TypeScript', 'Web Template', 'Authentication', 'UI Components', 'Better Auth'],
	ogImage: 'https://magickit.dev/og-default.jpg',
	ogType: 'website',
	twitterCard: 'summary_large_image'
};

/**
 * Merge default SEO with page-specific SEO data
 */
export function mergeSEO(pageSEO: Partial<SEOData>): SEOData {
	return {
		...defaultSEO,
		...pageSEO,
		title: pageSEO.title || defaultSEO.title!,
		description: pageSEO.description || defaultSEO.description!
	};
}