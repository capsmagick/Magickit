<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import DynamicContentRenderer from '$lib/components/DynamicContentRenderer.svelte';
	import type { ContentInstance, ContentType } from '$lib/db/models.js';

	interface Props {
		data: {
			content: ContentInstance;
			contentType: ContentType;
			seo: {
				title: string;
				description: string;
				keywords: string[];
				canonical: string;
				ogImage?: string;
				ogType: 'website' | 'article';
				publishedTime?: string;
				modifiedTime?: string;
			};
			structuredData: any[];
		};
	}

	let { data }: Props = $props();

	// Extract content and metadata
	let content = $derived(data.content);
	let contentType = $derived(data.contentType);
	let seoData = $derived(data.seo);
	let structuredData = $derived(data.structuredData);
</script>

<!-- SEO Meta Tags and Structured Data -->
<SEO 
	title={seoData.title}
	description={seoData.description}
	keywords={seoData.keywords}
	canonical={seoData.canonical}
	ogImage={seoData.ogImage}
	ogType={seoData.ogType}
	publishedTime={seoData.publishedTime}
	modifiedTime={seoData.modifiedTime}
	structuredData={structuredData}
	includeOrganization={true}
	includeWebSite={true}
/>

<!-- Dynamic Content Rendering -->
<main class="min-h-screen">
	<DynamicContentRenderer {content} {contentType} />
</main>