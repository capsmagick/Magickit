import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { componentService } from '$lib/services/component';
import { ObjectId } from 'mongodb';

export const GET: RequestHandler = async ({ url }) => {
    try {
        const searchParams = url.searchParams;
        
        // Parse filters
        const filters = {
            category: searchParams.get('category') || undefined,
            subcategory: searchParams.get('subcategory') || undefined,
            tags: searchParams.get('tags')?.split(',').filter(Boolean) || undefined,
            difficulty: searchParams.get('difficulty') as 'beginner' | 'intermediate' | 'advanced' | undefined,
            reviewStatus: searchParams.get('reviewStatus') as 'pending' | 'approved' | 'needs_work' | undefined,
            search: searchParams.get('search') || undefined,
            maintainer: searchParams.get('maintainer') || undefined
        };

        // Parse options
        const options = {
            limit: parseInt(searchParams.get('limit') || '20'),
            skip: parseInt(searchParams.get('skip') || '0'),
            sortBy: searchParams.get('sortBy') as 'name' | 'created' | 'updated' | 'usage' | 'rating' | 'popularity' || 'updated',
            sortOrder: searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc'
        };

        const result = await componentService.getComponents(filters, options);

        return json({
            success: true,
            data: result.components,
            total: result.total,
            pagination: {
                limit: options.limit,
                skip: options.skip,
                total: result.total,
                pages: Math.ceil(result.total / options.limit)
            }
        });
    } catch (error) {
        console.error('Error fetching components:', error);
        return json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch components'
            },
            { status: 500 }
        );
    }
};

export const POST: RequestHandler = async ({ request }) => {
    try {
        const data = await request.json();
        
        // Validate required fields
        if (!data.contentTypeId || !data.title || !data.slug) {
            return json(
                {
                    success: false,
                    error: 'Content type ID, title, and slug are required'
                },
                { status: 400 }
            );
        }

        // Validate ObjectId format
        if (!ObjectId.isValid(data.contentTypeId)) {
            return json(
                {
                    success: false,
                    error: 'Invalid content type ID'
                },
                { status: 400 }
            );
        }

        // Set component-specific defaults
        const componentData = {
            contentTypeId: new ObjectId(data.contentTypeId),
            title: data.title,
            slug: data.slug,
            data: {
                ...data.data,
                isComponent: true,
                category: data.category || 'content',
                description: data.description || ''
            },
            status: 'published' as const,
            author: new ObjectId(data.author), // Should come from session
            lastModifiedBy: new ObjectId(data.author),
            seo: data.seo || {},
            componentMetadata: {
                category: data.category || 'content',
                subcategory: data.subcategory,
                tags: data.tags || [],
                difficulty: data.difficulty || 'beginner',
                compatibility: data.compatibility || [],
                dependencies: data.dependencies || [],
                documentation: data.documentation,
                examples: data.examples || [],
                ...data.componentMetadata
            }
        };

        const componentId = await componentService.createComponent(componentData, data.author);

        if (!componentId) {
            return json(
                {
                    success: false,
                    error: 'Failed to create component'
                },
                { status: 500 }
            );
        }

        const createdComponent = await componentService.getComponentById(componentId.toString());

        return json({
            success: true,
            data: createdComponent
        });
    } catch (error) {
        console.error('Error creating component:', error);
        return json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create component'
            },
            { status: 500 }
        );
    }
};