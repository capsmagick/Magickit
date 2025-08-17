import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { componentService } from '$lib/services/component';
import { ObjectId } from 'mongodb';

export const GET: RequestHandler = async ({ params, url }) => {
    try {
        const { id } = params;
        const limit = parseInt(url.searchParams.get('limit') || '10');

        if (!ObjectId.isValid(id)) {
            return json(
                {
                    success: false,
                    error: 'Invalid component ID'
                },
                { status: 400 }
            );
        }

        const versions = await componentService.getComponentVersions(id, limit);

        return json({
            success: true,
            data: versions,
            total: versions.length
        });
    } catch (error) {
        console.error('Error fetching component versions:', error);
        return json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch component versions'
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
        if (!data.version || !data.restoredBy) {
            return json(
                {
                    success: false,
                    error: 'Version number and restoredBy are required'
                },
                { status: 400 }
            );
        }

        const success = await componentService.restoreComponentVersion(
            id,
            data.version,
            data.restoredBy
        );

        if (!success) {
            return json(
                {
                    success: false,
                    error: 'Failed to restore component version'
                },
                { status: 500 }
            );
        }

        return json({
            success: true,
            message: `Component restored to version ${data.version} successfully`
        });
    } catch (error) {
        console.error('Error restoring component version:', error);
        return json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to restore component version'
            },
            { status: 500 }
        );
    }
};