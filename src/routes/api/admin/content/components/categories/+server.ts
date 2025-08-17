import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { componentService } from '$lib/services/component';
import { DEFAULT_COMPONENT_CATEGORIES } from '$lib/db/models/component';

export const GET: RequestHandler = async () => {
    try {
        const categories = await componentService.getComponentCategories();

        // If no categories exist, return default categories
        if (categories.length === 0) {
            return json({
                success: true,
                data: DEFAULT_COMPONENT_CATEGORIES.map(cat => ({
                    ...cat,
                    _id: null, // Will be created when first used
                    createdAt: new Date(),
                    updatedAt: new Date()
                }))
            });
        }

        return json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Error fetching component categories:', error);
        return json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch component categories'
            },
            { status: 500 }
        );
    }
};

export const POST: RequestHandler = async ({ request }) => {
    try {
        const data = await request.json();

        // Validate required fields
        if (!data.name || !data.slug) {
            return json(
                {
                    success: false,
                    error: 'Name and slug are required'
                },
                { status: 400 }
            );
        }

        const categoryData = {
            name: data.name,
            slug: data.slug,
            description: data.description || '',
            icon: data.icon,
            color: data.color,
            parentId: data.parentId,
            order: data.order || 999,
            isSystemCategory: false
        };

        const categoryId = await componentService.createComponentCategory(categoryData);

        if (!categoryId) {
            return json(
                {
                    success: false,
                    error: 'Failed to create component category'
                },
                { status: 500 }
            );
        }

        return json({
            success: true,
            data: { _id: categoryId, ...categoryData }
        });
    } catch (error) {
        console.error('Error creating component category:', error);
        return json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create component category'
            },
            { status: 500 }
        );
    }
};