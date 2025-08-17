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

        const usage = await componentService.getComponentUsage(id);

        return json({
            success: true,
            data: usage,
            total: usage.length
        });
    } catch (error) {
        console.error('Error fetching component usage:', error);
        return json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch component usage'
            },
            { status: 500 }
        );
    }
};

export const POST: RequestHandler = async ({ params, request }) => {
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

        // Validate required fields
        if (!data.usedInId || !data.usedInType || !data.usedInTitle || !data.usedInSlug) {
            return json(
                {
                    success: false,
                    error: 'usedInId, usedInType, usedInTitle, and usedInSlug are required'
                },
                { status: 400 }
            );
        }

        const success = await componentService.trackComponentUsage(
            id,
            data.usedInId,
            data.usedInType,
            data.usedInTitle,
            data.usedInSlug,
            data.fieldName,
            data.position
        );

        if (!success) {
            return json(
                {
                    success: false,
                    error: 'Failed to track component usage'
                },
                { status: 500 }
            );
        }

        return json({
            success: true,
            message: 'Component usage tracked successfully'
        });
    } catch (error) {
        console.error('Error tracking component usage:', error);
        return json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to track component usage'
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

        if (!data.usedInId) {
            return json(
                {
                    success: false,
                    error: 'usedInId is required'
                },
                { status: 400 }
            );
        }

        const success = await componentService.removeComponentUsage(
            id,
            data.usedInId,
            data.fieldName,
            data.position
        );

        if (!success) {
            return json(
                {
                    success: false,
                    error: 'Failed to remove component usage'
                },
                { status: 500 }
            );
        }

        return json({
            success: true,
            message: 'Component usage removed successfully'
        });
    } catch (error) {
        console.error('Error removing component usage:', error);
        return json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to remove component usage'
            },
            { status: 500 }
        );
    }
};