import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { componentService } from '$lib/services/component';
import { ObjectId } from 'mongodb';

export const GET: RequestHandler = async ({ params }) => {
    try {
        const { id } = params;

        if (!ObjectId.isValid(id)) {
            return json(
                {
                    success: false,
                    error: 'Invalid component ID'
                },
                { status: 400 }
            );
        }

        const component = await componentService.getComponentById(id);

        if (!component) {
            return json(
                {
                    success: false,
                    error: 'Component not found'
                },
                { status: 404 }
            );
        }

        return json({
            success: true,
            data: component
        });
    } catch (error) {
        console.error('Error fetching component:', error);
        return json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch component'
            },
            { status: 500 }
        );
    }
};

export const PUT: RequestHandler = async ({ params, request }) => {
    try {
        const { id } = params;
        const data = await request.json();

        if (!ObjectId.isValid(id)) {
            return json(
                {
                    success: false,
                    error: 'Invalid component ID'
                },
                { status: 400 }
            );
        }

        // Extract change information
        const changeNote = data.changeNote || 'Component updated';
        const changeType = data.changeType || 'minor';
        const isBreakingChange = data.isBreakingChange || false;

        // Prepare update data
        const updateData = {
            title: data.title,
            slug: data.slug,
            data: {
                ...data.data,
                isComponent: true,
                category: data.category || 'content',
                description: data.description || ''
            },
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

        const success = await componentService.updateComponent(
            id,
            updateData,
            data.updatedBy, // Should come from session
            changeNote,
            changeType,
            isBreakingChange
        );

        if (!success) {
            return json(
                {
                    success: false,
                    error: 'Failed to update component'
                },
                { status: 500 }
            );
        }

        const updatedComponent = await componentService.getComponentById(id);

        return json({
            success: true,
            data: updatedComponent
        });
    } catch (error) {
        console.error('Error updating component:', error);
        return json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update component'
            },
            { status: 500 }
        );
    }
};

export const DELETE: RequestHandler = async ({ params, request }) => {
    try {
        const { id } = params;
        const data = await request.json();

        if (!ObjectId.isValid(id)) {
            return json(
                {
                    success: false,
                    error: 'Invalid component ID'
                },
                { status: 400 }
            );
        }

        const success = await componentService.deleteComponent(id, data.deletedBy);

        if (!success) {
            return json(
                {
                    success: false,
                    error: 'Failed to delete component'
                },
                { status: 500 }
            );
        }

        return json({
            success: true,
            message: 'Component deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting component:', error);
        return json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to delete component'
            },
            { status: 500 }
        );
    }
};