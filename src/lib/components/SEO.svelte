<script lang="ts">
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import type { SEOData, StructuredData } from '$lib/utils/seo';
	import { 
		generateSEOTags, 
		structuredDataToScript, 
		generateOrganizationSchema, 
		generateWebSiteSchema,
		mergeSEO 
	} from '$lib/utils/seo';

	interface Props {
		title?: string;
		description?: string;
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
		structuredData?: StructuredData | StructuredData[];
		includeOrganization?: boolean;
		includeWebSite?: boolean;
	}

	let {
		title,
		description,
		keywords = [],
		canonical,
		ogImage,
		ogType = 'website',
		twitterCard = 'summary_large_image',
		author,
		publishedTime,
		modifiedTime,
		section,
		tags = [],
		noIndex = false,
		noFollow = false,
		structuredData,
		includeOrganization = false,
		includeWebSite = false
	}: Props = $props();

	// Get base URL from environment or page
	const baseUrl = browser ? window.location.origin : 'https://magickit.dev';
	
	// Generate canonical URL if not provided
	const canonicalUrl = canonical || (browser ? window.location.href : `${baseUrl}${$page.url.pathname}`);

	// Merge with default SEO data
	const seoData = mergeSEO({
		title,
		description,
		keywords,
		canonical: canonicalUrl,
		ogImage,
		ogType,
		twitterCard,
		author,
		publishedTime,
		modifiedTime,
		section,
		tags,
		noIndex,
		noFollow
	});

	// Generate meta tags
	const metaTags = generateSEOTags(seoData, baseUrl);

	// Generate structured data
	const allStructuredData: StructuredData[] = [];
	
	if (includeOrganization) {
		allStructuredData.push(generateOrganizationSchema(baseUrl));
	}
	
	if (includeWebSite) {
		allStructuredData.push(generateWebSiteSchema(baseUrl));
	}
	
	if (structuredData) {
		if (Array.isArray(structuredData)) {
			allStructuredData.push(...structuredData);
		} else {
			allStructuredData.push(structuredData);
		}
	}

	const structuredDataScript = allStructuredData.length > 0 
		? structuredDataToScript(allStructuredData) 
		: '';
</script>

<svelte:head>
	{@html metaTags}
	{#if structuredDataScript}
		{@html structuredDataScript}
	{/if}
</svelte:head>