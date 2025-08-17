import { ObjectId } from 'mongodb';
import dbClient from '../dbClient.js';
import type { SystemAlert } from '../models.js';

const COLLECTION_NAME = 'systemAlerts';

/**
 * System Alerts Collection Handler
 * Provides CRUD operations for system alerts with proper error handling
 */
export class SystemAlertsCollection {
    /**
     * Get all system alerts with optional filtering and pagination
     */
    static async findAll(options: {
        type?: SystemAlert['type'];
        category?: SystemAlert['category'];
        severity?: SystemAlert['severity'];
        acknowledged?: boolean;
        resolved?: boolean;
        limit?: number;
        skip?: number;
        sortBy?: 'createdAt' | 'severity' | 'type';
        sortOrder?: 'asc' | 'desc';
    } = {}) {
        try {
            const collection = dbClient.collection<SystemAlert>(COLLECTION_NAME);

            // Build filter
            const filter: any = {};
            if (options.type) filter.type = options.type;
            if (options.category) filter.category = options.category;
            if (options.severity) filter.severity = options.severity;
            if (options.acknowledged !== undefined) filter.acknowledged = options.acknowledged;
            if (options.resolved !== undefined) {
                if (options.resolved) {
                    filter.resolvedAt = { $exists: true, $ne: null };
                } else {
                    filter.resolvedAt = { $exists: false };
                }
            }

            // Build sort
            const sort: any = {};
            const sortField = options.sortBy || 'createdAt';
            const sortDirection = options.sortOrder === 'asc' ? 1 : -1;
            sort[sortField] = sortDirection;

            const cursor = collection
                .find(filter)
                .sort(sort);

            if (options.skip) cursor.skip(options.skip);
            if (options.limit) cursor.limit(options.limit);

            const alerts = await cursor.toArray();
            const total = await collection.countDocuments(filter);

            return { alerts, total };
        } catch (error) {
            console.error('Error fetching system alerts:', error);
            throw new Error('Failed to fetch system alerts');
        }
    }

    /**
     * Get a single system alert by ID
     */
    static async findById(id: string | ObjectId) {
        try {
            const collection = dbClient.collection<SystemAlert>(COLLECTION_NAME);

            const objectId = typeof id === 'string' ? new ObjectId(id) : id;
            const alert = await collection.findOne({ _id: objectId });

            return alert;
        } catch (error) {
            console.error('Error fetching system alert:', error);
            throw new Error('Failed to fetch system alert');
        }
    }

    /**
     * Create a new system alert
     */
    static async create(alertData: Omit<SystemAlert, '_id' | 'createdAt'>) {
        try {
            const collection = dbClient.collection<SystemAlert>(COLLECTION_NAME);

            const now = new Date();
            const newAlert: SystemAlert = {
                _id: new ObjectId(),
                ...alertData,
                createdAt: now
            };

            const result = await collection.insertOne(newAlert);
            
            if (!result.acknowledged) {
                throw new Error('Failed to create system alert');
            }

            return newAlert;
        } catch (error) {
            console.error('Error creating system alert:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to create system alert');
        }
    }

    /**
     * Update an existing system alert
     */
    static async update(id: string | ObjectId, updateData: Partial<Omit<SystemAlert, '_id' | 'createdAt'>>) {
        try {
            const collection = dbClient.collection<SystemAlert>(COLLECTION_NAME);

            const objectId = typeof id === 'string' ? new ObjectId(id) : id;

            const result = await collection.updateOne(
                { _id: objectId },
                { $set: updateData }
            );

            if (result.matchedCount === 0) {
                throw new Error('System alert not found');
            }

            return await this.findById(objectId);
        } catch (error) {
            console.error('Error updating system alert:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to update system alert');
        }
    }

    /**
     * Delete a system alert
     */
    static async delete(id: string | ObjectId) {
        try {
            const collection = dbClient.collection<SystemAlert>(COLLECTION_NAME);

            const objectId = typeof id === 'string' ? new ObjectId(id) : id;
            const result = await collection.deleteOne({ _id: objectId });

            if (result.deletedCount === 0) {
                throw new Error('System alert not found');
            }

            return true;
        } catch (error) {
            console.error('Error deleting system alert:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to delete system alert');
        }
    }

    /**
     * Acknowledge an alert
     */
    static async acknowledge(id: string | ObjectId, acknowledgedBy: ObjectId) {
        try {
            const collection = dbClient.collection<SystemAlert>(COLLECTION_NAME);

            const objectId = typeof id === 'string' ? new ObjectId(id) : id;

            const result = await collection.updateOne(
                { _id: objectId },
                { 
                    $set: { 
                        acknowledged: true,
                        acknowledgedBy,
                        acknowledgedAt: new Date()
                    } 
                }
            );

            if (result.matchedCount === 0) {
                throw new Error('System alert not found');
            }

            return await this.findById(objectId);
        } catch (error) {
            console.error('Error acknowledging alert:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to acknowledge alert');
        }
    }

    /**
     * Resolve an alert
     */
    static async resolve(id: string | ObjectId) {
        try {
            const collection = dbClient.collection<SystemAlert>(COLLECTION_NAME);

            const objectId = typeof id === 'string' ? new ObjectId(id) : id;

            const result = await collection.updateOne(
                { _id: objectId },
                { 
                    $set: { 
                        resolvedAt: new Date()
                    } 
                }
            );

            if (result.matchedCount === 0) {
                throw new Error('System alert not found');
            }

            return await this.findById(objectId);
        } catch (error) {
            console.error('Error resolving alert:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to resolve alert');
        }
    }

    /**
     * Get active alerts (not resolved)
     */
    static async getActiveAlerts(options: {
        type?: SystemAlert['type'];
        category?: SystemAlert['category'];
        severity?: SystemAlert['severity'];
        limit?: number;
    } = {}) {
        return this.findAll({
            ...options,
            resolved: false,
            sortBy: 'severity',
            sortOrder: 'desc'
        });
    }

    /**
     * Get critical alerts
     */
    static async getCriticalAlerts(limit?: number) {
        return this.findAll({
            type: 'critical',
            resolved: false,
            limit,
            sortBy: 'createdAt',
            sortOrder: 'desc'
        });
    }

    /**
     * Get alerts by category
     */
    static async getAlertsByCategory(category: SystemAlert['category'], options: {
        resolved?: boolean;
        limit?: number;
        skip?: number;
    } = {}) {
        return this.findAll({
            category,
            ...options,
            sortBy: 'createdAt',
            sortOrder: 'desc'
        });
    }

    /**
     * Get alert statistics
     */
    static async getAlertStatistics(startDate?: Date, endDate?: Date) {
        try {
            const collection = dbClient.collection<SystemAlert>(COLLECTION_NAME);

            const matchFilter: any = {};
            if (startDate || endDate) {
                matchFilter.createdAt = {};
                if (startDate) matchFilter.createdAt.$gte = startDate;
                if (endDate) matchFilter.createdAt.$lte = endDate;
            }

            const pipeline = [
                ...(Object.keys(matchFilter).length > 0 ? [{ $match: matchFilter }] : []),
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        critical: { $sum: { $cond: [{ $eq: ['$type', 'critical'] }, 1, 0] } },
                        error: { $sum: { $cond: [{ $eq: ['$type', 'error'] }, 1, 0] } },
                        warning: { $sum: { $cond: [{ $eq: ['$type', 'warning'] }, 1, 0] } },
                        info: { $sum: { $cond: [{ $eq: ['$type', 'info'] }, 1, 0] } },
                        acknowledged: { $sum: { $cond: ['$acknowledged', 1, 0] } },
                        resolved: { $sum: { $cond: [{ $ne: ['$resolvedAt', null] }, 1, 0] } },
                        active: { $sum: { $cond: [{ $eq: ['$resolvedAt', null] }, 1, 0] } }
                    }
                }
            ];

            const categoryStats = await collection.aggregate([
                ...(Object.keys(matchFilter).length > 0 ? [{ $match: matchFilter }] : []),
                {
                    $group: {
                        _id: '$category',
                        count: { $sum: 1 },
                        critical: { $sum: { $cond: [{ $eq: ['$type', 'critical'] }, 1, 0] } },
                        active: { $sum: { $cond: [{ $eq: ['$resolvedAt', null] }, 1, 0] } }
                    }
                },
                { $sort: { count: -1 } }
            ]).toArray();

            const results = await collection.aggregate(pipeline).toArray();
            const overall = results[0] || {
                total: 0,
                critical: 0,
                error: 0,
                warning: 0,
                info: 0,
                acknowledged: 0,
                resolved: 0,
                active: 0
            };

            return {
                overall,
                byCategory: categoryStats
            };
        } catch (error) {
            console.error('Error getting alert statistics:', error);
            throw new Error('Failed to get alert statistics');
        }
    }

    /**
     * Bulk acknowledge alerts
     */
    static async bulkAcknowledge(alertIds: ObjectId[], acknowledgedBy: ObjectId) {
        try {
            const collection = dbClient.collection<SystemAlert>(COLLECTION_NAME);

            const result = await collection.updateMany(
                { _id: { $in: alertIds } },
                { 
                    $set: { 
                        acknowledged: true,
                        acknowledgedBy,
                        acknowledgedAt: new Date()
                    } 
                }
            );

            return {
                matchedCount: result.matchedCount,
                modifiedCount: result.modifiedCount
            };
        } catch (error) {
            console.error('Error bulk acknowledging alerts:', error);
            throw new Error('Failed to bulk acknowledge alerts');
        }
    }

    /**
     * Bulk resolve alerts
     */
    static async bulkResolve(alertIds: ObjectId[]) {
        try {
            const collection = dbClient.collection<SystemAlert>(COLLECTION_NAME);

            const result = await collection.updateMany(
                { _id: { $in: alertIds } },
                { 
                    $set: { 
                        resolvedAt: new Date()
                    } 
                }
            );

            return {
                matchedCount: result.matchedCount,
                modifiedCount: result.modifiedCount
            };
        } catch (error) {
            console.error('Error bulk resolving alerts:', error);
            throw new Error('Failed to bulk resolve alerts');
        }
    }

    /**
     * Clean up old resolved alerts
     */
    static async cleanupResolvedAlerts(daysToKeep: number = 90) {
        try {
            const collection = dbClient.collection<SystemAlert>(COLLECTION_NAME);

            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

            const result = await collection.deleteMany({
                resolvedAt: { $lt: cutoffDate, $ne: null }
            });

            return {
                deletedCount: result.deletedCount,
                cutoffDate
            };
        } catch (error) {
            console.error('Error cleaning up resolved alerts:', error);
            throw new Error('Failed to cleanup resolved alerts');
        }
    }
}