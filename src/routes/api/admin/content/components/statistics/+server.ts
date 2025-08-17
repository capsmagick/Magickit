import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { componentService } from '$lib/services/component';

export const GET: RequestHandler = async () => {
    try {
        const statistics = await componentService.getComponentStatistics();

        return json({
            success: true,
            data: statistics
        });
    } catch (error) {
        console.error('Error fetching component statistics:', error);
        return json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch component statistics'
            },
            { status: 500 }
        );
    }
};