import { ObjectId } from 'mongodb';
import dbClient from '../dbClient.js';
import type { SystemHealthStatus } from '../models.js';

const COLLECTION_NAME = 'systemHealthStatus';

/**
 * System Health Status Collection Handler
 * Provides CRUD operations for system health status with proper error handling
 */
export class SystemHealthStatusCollection {
    /**
     * Get all system health status records with optional filtering and pagination
     */
    static async findAll(options: {
        status?: SystemHealthStatus['status'];
        startDate?: Date;
        endDate?: Date;
        limit?: number;
        skip?: number;
        sortBy?: 'lastCheck' | 'createdAt' | 'score';
        sortOrder?: 'asc' | 'desc';
    } = {}) {
        try {
            const collection = dbClient.collection<SystemHealthStatus>(COLLECTION_NAME);

            // Build filter
            const filter: any = {};
            if (options.status) filter.status = options.status;
            if (options.startDate || options.endDate) {
                filter.lastCheck = {};
                if (options.startDate) filter.lastCheck.$gte = options.startDate;
                if (options.endDate) filter.lastCheck.$lte = options.endDate;
            }

            // Build sort
            const sort: any = {};
            const sortField = options.sortBy || 'lastCheck';
            const sortDirection = options.sortOrder === 'asc' ? 1 : -1;
            sort[sortField] = sortDirection;

            const cursor = collection
                .find(filter)
                .sort(sort);

            if (options.skip) cursor.skip(options.skip);
            if (options.limit) cursor.limit(options.limit);

            const statusRecords = await cursor.toArray();
            const total = await collection.countDocuments(filter);

            return { statusRecords, total };
        } catch (error) {
            console.error('Error fetching system health status:', error);
            throw new Error('Failed to fetch system health status');
        }
    }

    /**
     * Get a single system health status by ID
     */
    static async findById(id: string | ObjectId) {
        try {
            const collection = dbClient.collection<SystemHealthStatus>(COLLECTION_NAME);

            const objectId = typeof id === 'string' ? new ObjectId(id) : id;
            const status = await collection.findOne({ _id: objectId });

            return status;
        } catch (error) {
            console.error('Error fetching system health status:', error);
            throw new Error('Failed to fetch system health status');
        }
    }

    /**
     * Create a new system health status record
     */
    static async create(statusData: Omit<SystemHealthStatus, '_id' | 'createdAt' | 'updatedAt'>) {
        try {
            const collection = dbClient.collection<SystemHealthStatus>(COLLECTION_NAME);

            const now = new Date();
            const newStatus: SystemHealthStatus = {
                _id: new ObjectId(),
                ...statusData,
                createdAt: now,
                updatedAt: now
            };

            const result = await collection.insertOne(newStatus);
            
            if (!result.acknowledged) {
                throw new Error('Failed to create system health status');
            }

            return newStatus;
        } catch (error) {
            console.error('Error creating system health status:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to create system health status');
        }
    }

    /**
     * Update an existing system health status
     */
    static async update(id: string | ObjectId, updateData: Partial<Omit<SystemHealthStatus, '_id' | 'createdAt'>>) {
        try {
            const collection = dbClient.collection<SystemHealthStatus>(COLLECTION_NAME);

            const objectId = typeof id === 'string' ? new ObjectId(id) : id;

            const result = await collection.updateOne(
                { _id: objectId },
                { 
                    $set: { 
                        ...updateData, 
                        updatedAt: new Date() 
                    } 
                }
            );

            if (result.matchedCount === 0) {
                throw new Error('System health status not found');
            }

            return await this.findById(objectId);
        } catch (error) {
            console.error('Error updating system health status:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to update system health status');
        }
    }

    /**
     * Delete a system health status record
     */
    static async delete(id: string | ObjectId) {
        try {
            const collection = dbClient.collection<SystemHealthStatus>(COLLECTION_NAME);

            const objectId = typeof id === 'string' ? new ObjectId(id) : id;
            const result = await collection.deleteOne({ _id: objectId });

            if (result.deletedCount === 0) {
                throw new Error('System health status not found');
            }

            return true;
        } catch (error) {
            console.error('Error deleting system health status:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to delete system health status');
        }
    }

    /**
     * Get the latest system health status
     */
    static async getLatest() {
        try {
            const collection = dbClient.collection<SystemHealthStatus>(COLLECTION_NAME);

            const status = await collection
                .findOne({}, { sort: { lastCheck: -1 } });

            return status;
        } catch (error) {
            console.error('Error fetching latest system health status:', error);
            throw new Error('Failed to fetch latest system health status');
        }
    }

    /**
     * Update or create the current system health status
     */
    static async updateCurrent(statusData: Omit<SystemHealthStatus, '_id' | 'createdAt' | 'updatedAt'>) {
        try {
            const collection = dbClient.collection<SystemHealthStatus>(COLLECTION_NAME);

            // Try to update the most recent record (within last 5 minutes)
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            
            const result = await collection.updateOne(
                { lastCheck: { $gte: fiveMinutesAgo } },
                { 
                    $set: { 
                        ...statusData, 
                        updatedAt: new Date() 
                    } 
                },
                { sort: { lastCheck: -1 } }
            );

            if (result.matchedCount > 0) {
                // Updated existing record
                return await collection.findOne({}, { sort: { lastCheck: -1 } });
            } else {
                // Create new record
                return await this.create(statusData);
            }
        } catch (error) {
            console.error('Error updating current system health status:', error);
            throw new Error('Failed to update current system health status');
        }
    }

    /**
     * Get system health history
     */
    static async getHealthHistory(
        startDate: Date,
        endDate: Date,
        interval: '1h' | '6h' | '1d' = '1h'
    ) {
        try {
            const collection = dbClient.collection<SystemHealthStatus>(COLLECTION_NAME);

            // Convert interval to milliseconds for grouping
            const intervalMs = {
                '1h': 60 * 60 * 1000,
                '6h': 6 * 60 * 60 * 1000,
                '1d': 24 * 60 * 60 * 1000
            }[interval];

            const pipeline = [
                {
                    $match: {
                        lastCheck: {
                            $gte: startDate,
                            $lte: endDate
                        }
                    }
                },
                {
                    $group: {
                        _id: {
                            $subtract: [
                                { $toLong: '$lastCheck' },
                                { $mod: [{ $toLong: '$lastCheck' }, intervalMs] }
                            ]
                        },
                        timestamp: { $first: '$lastCheck' },
                        avgScore: { $avg: '$score' },
                        minScore: { $min: '$score' },
                        maxScore: { $max: '$score' },
                        healthyCount: { $sum: { $cond: [{ $eq: ['$status', 'healthy'] }, 1, 0] } },
                        warningCount: { $sum: { $cond: [{ $eq: ['$status', 'warning'] }, 1, 0] } },
                        criticalCount: { $sum: { $cond: [{ $eq: ['$status', 'critical'] }, 1, 0] } },
                        maintenanceCount: { $sum: { $cond: [{ $eq: ['$status', 'maintenance'] }, 1, 0] } },
                        avgActiveAlerts: { $avg: '$activeAlerts' },
                        avgCriticalAlerts: { $avg: '$criticalAlerts' },
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { _id: 1 }
                }
            ];

            const results = await collection.aggregate(pipeline).toArray();
            return results;
        } catch (error) {
            console.error('Error getting health history:', error);
            throw new Error('Failed to get health history');
        }
    }

    /**
     * Get uptime statistics
     */
    static async getUptimeStats(startDate: Date, endDate: Date) {
        try {
            const collection = dbClient.collection<SystemHealthStatus>(COLLECTION_NAME);

            const pipeline = [
                {
                    $match: {
                        lastCheck: {
                            $gte: startDate,
                            $lte: endDate
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalChecks: { $sum: 1 },
                        healthyChecks: { $sum: { $cond: [{ $eq: ['$status', 'healthy'] }, 1, 0] } },
                        warningChecks: { $sum: { $cond: [{ $eq: ['$status', 'warning'] }, 1, 0] } },
                        criticalChecks: { $sum: { $cond: [{ $eq: ['$status', 'critical'] }, 1, 0] } },
                        maintenanceChecks: { $sum: { $cond: [{ $eq: ['$status', 'maintenance'] }, 1, 0] } },
                        avgScore: { $avg: '$score' },
                        minScore: { $min: '$score' },
                        maxScore: { $max: '$score' },
                        totalUptime: { $sum: '$uptime' },
                        avgUptime: { $avg: '$uptime' }
                    }
                }
            ];

            const results = await collection.aggregate(pipeline).toArray();
            const stats = results[0];

            if (!stats) {
                return {
                    uptimePercentage: 0,
                    totalChecks: 0,
                    healthyChecks: 0,
                    avgScore: 0,
                    avgUptime: 0
                };
            }

            const uptimePercentage = stats.totalChecks > 0 
                ? ((stats.healthyChecks + stats.warningChecks) / stats.totalChecks) * 100 
                : 0;

            return {
                uptimePercentage: Math.round(uptimePercentage * 100) / 100,
                totalChecks: stats.totalChecks,
                healthyChecks: stats.healthyChecks,
                warningChecks: stats.warningChecks,
                criticalChecks: stats.criticalChecks,
                maintenanceChecks: stats.maintenanceChecks,
                avgScore: Math.round(stats.avgScore * 100) / 100,
                minScore: stats.minScore,
                maxScore: stats.maxScore,
                avgUptime: Math.round(stats.avgUptime)
            };
        } catch (error) {
            console.error('Error getting uptime stats:', error);
            throw new Error('Failed to get uptime stats');
        }
    }

    /**
     * Clean up old health status records
     */
    static async cleanupOldRecords(daysToKeep: number = 30) {
        try {
            const collection = dbClient.collection<SystemHealthStatus>(COLLECTION_NAME);

            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

            const result = await collection.deleteMany({
                lastCheck: { $lt: cutoffDate }
            });

            return {
                deletedCount: result.deletedCount,
                cutoffDate
            };
        } catch (error) {
            console.error('Error cleaning up old health status records:', error);
            throw new Error('Failed to cleanup old health status records');
        }
    }

    /**
     * Get service status breakdown
     */
    static async getServiceStatusBreakdown(startDate?: Date, endDate?: Date) {
        try {
            const collection = dbClient.collection<SystemHealthStatus>(COLLECTION_NAME);

            const matchFilter: any = {};
            if (startDate || endDate) {
                matchFilter.lastCheck = {};
                if (startDate) matchFilter.lastCheck.$gte = startDate;
                if (endDate) matchFilter.lastCheck.$lte = endDate;
            }

            const pipeline = [
                ...(Object.keys(matchFilter).length > 0 ? [{ $match: matchFilter }] : []),
                {
                    $group: {
                        _id: null,
                        totalChecks: { $sum: 1 },
                        databaseHealthy: { $sum: { $cond: [{ $eq: ['$services.database', 'healthy'] }, 1, 0] } },
                        databaseWarning: { $sum: { $cond: [{ $eq: ['$services.database', 'warning'] }, 1, 0] } },
                        databaseCritical: { $sum: { $cond: [{ $eq: ['$services.database', 'critical'] }, 1, 0] } },
                        storageHealthy: { $sum: { $cond: [{ $eq: ['$services.storage', 'healthy'] }, 1, 0] } },
                        storageWarning: { $sum: { $cond: [{ $eq: ['$services.storage', 'warning'] }, 1, 0] } },
                        storageCritical: { $sum: { $cond: [{ $eq: ['$services.storage', 'critical'] }, 1, 0] } },
                        cacheHealthy: { $sum: { $cond: [{ $eq: ['$services.cache', 'healthy'] }, 1, 0] } },
                        cacheWarning: { $sum: { $cond: [{ $eq: ['$services.cache', 'warning'] }, 1, 0] } },
                        cacheCritical: { $sum: { $cond: [{ $eq: ['$services.cache', 'critical'] }, 1, 0] } },
                        emailHealthy: { $sum: { $cond: [{ $eq: ['$services.email', 'healthy'] }, 1, 0] } },
                        emailWarning: { $sum: { $cond: [{ $eq: ['$services.email', 'warning'] }, 1, 0] } },
                        emailCritical: { $sum: { $cond: [{ $eq: ['$services.email', 'critical'] }, 1, 0] } }
                    }
                }
            ];

            const results = await collection.aggregate(pipeline).toArray();
            const stats = results[0];

            if (!stats) {
                return {
                    database: { healthy: 0, warning: 0, critical: 0 },
                    storage: { healthy: 0, warning: 0, critical: 0 },
                    cache: { healthy: 0, warning: 0, critical: 0 },
                    email: { healthy: 0, warning: 0, critical: 0 }
                };
            }

            return {
                database: {
                    healthy: stats.databaseHealthy,
                    warning: stats.databaseWarning,
                    critical: stats.databaseCritical
                },
                storage: {
                    healthy: stats.storageHealthy,
                    warning: stats.storageWarning,
                    critical: stats.storageCritical
                },
                cache: {
                    healthy: stats.cacheHealthy,
                    warning: stats.cacheWarning,
                    critical: stats.cacheCritical
                },
                email: {
                    healthy: stats.emailHealthy,
                    warning: stats.emailWarning,
                    critical: stats.emailCritical
                }
            };
        } catch (error) {
            console.error('Error getting service status breakdown:', error);
            throw new Error('Failed to get service status breakdown');
        }
    }
}