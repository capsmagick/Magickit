import { ObjectId } from 'mongodb';
import dbClient from '../dbClient.js';
import type { SystemMetrics } from '../models.js';

const COLLECTION_NAME = 'systemMetrics';

/**
 * System Metrics Collection Handler
 * Provides CRUD operations for system metrics with proper error handling
 */
export class SystemMetricsCollection {
    /**
     * Get all system metrics with optional filtering and pagination
     */
    static async findAll(options: {
        startDate?: Date;
        endDate?: Date;
        limit?: number;
        skip?: number;
        sortBy?: 'timestamp' | 'createdAt';
        sortOrder?: 'asc' | 'desc';
    } = {}) {
        try {
            const collection = dbClient.collection<SystemMetrics>(COLLECTION_NAME);

            // Build filter
            const filter: any = {};
            if (options.startDate || options.endDate) {
                filter.timestamp = {};
                if (options.startDate) filter.timestamp.$gte = options.startDate;
                if (options.endDate) filter.timestamp.$lte = options.endDate;
            }

            // Build sort
            const sort: any = {};
            const sortField = options.sortBy || 'timestamp';
            const sortDirection = options.sortOrder === 'asc' ? 1 : -1;
            sort[sortField] = sortDirection;

            const cursor = collection
                .find(filter)
                .sort(sort);

            if (options.skip) cursor.skip(options.skip);
            if (options.limit) cursor.limit(options.limit);

            const metrics = await cursor.toArray();
            const total = await collection.countDocuments(filter);

            return { metrics, total };
        } catch (error) {
            console.error('Error fetching system metrics:', error);
            throw new Error('Failed to fetch system metrics');
        }
    }

    /**
     * Get a single system metric by ID
     */
    static async findById(id: string | ObjectId) {
        try {
            const collection = dbClient.collection<SystemMetrics>(COLLECTION_NAME);

            const objectId = typeof id === 'string' ? new ObjectId(id) : id;
            const metric = await collection.findOne({ _id: objectId });

            return metric;
        } catch (error) {
            console.error('Error fetching system metric:', error);
            throw new Error('Failed to fetch system metric');
        }
    }

    /**
     * Create a new system metric entry
     */
    static async create(metricData: Omit<SystemMetrics, '_id' | 'createdAt'>) {
        try {
            const collection = dbClient.collection<SystemMetrics>(COLLECTION_NAME);

            const now = new Date();
            const newMetric: SystemMetrics = {
                _id: new ObjectId(),
                ...metricData,
                createdAt: now
            };

            const result = await collection.insertOne(newMetric);
            
            if (!result.acknowledged) {
                throw new Error('Failed to create system metric');
            }

            return newMetric;
        } catch (error) {
            console.error('Error creating system metric:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to create system metric');
        }
    }

    /**
     * Get latest system metrics
     */
    static async getLatest(limit: number = 1) {
        try {
            const collection = dbClient.collection<SystemMetrics>(COLLECTION_NAME);

            const metrics = await collection
                .find({})
                .sort({ timestamp: -1 })
                .limit(limit)
                .toArray();

            return metrics;
        } catch (error) {
            console.error('Error fetching latest metrics:', error);
            throw new Error('Failed to fetch latest metrics');
        }
    }

    /**
     * Get metrics for a specific time range with aggregation
     */
    static async getAggregatedMetrics(
        startDate: Date,
        endDate: Date,
        interval: '1m' | '5m' | '15m' | '1h' | '1d' = '5m'
    ) {
        try {
            const collection = dbClient.collection<SystemMetrics>(COLLECTION_NAME);

            // Convert interval to milliseconds for grouping
            const intervalMs = {
                '1m': 60 * 1000,
                '5m': 5 * 60 * 1000,
                '15m': 15 * 60 * 1000,
                '1h': 60 * 60 * 1000,
                '1d': 24 * 60 * 60 * 1000
            }[interval];

            const pipeline = [
                {
                    $match: {
                        timestamp: {
                            $gte: startDate,
                            $lte: endDate
                        }
                    }
                },
                {
                    $group: {
                        _id: {
                            $subtract: [
                                { $toLong: '$timestamp' },
                                { $mod: [{ $toLong: '$timestamp' }, intervalMs] }
                            ]
                        },
                        timestamp: { $first: '$timestamp' },
                        avgCpuUsage: { $avg: '$cpu.usage' },
                        avgMemoryPercentage: { $avg: '$memory.percentage' },
                        avgDiskPercentage: { $avg: '$disk.percentage' },
                        avgResponseTime: { $avg: '$application.responseTime' },
                        avgErrorRate: { $avg: '$application.errorRate' },
                        avgRequestsPerMinute: { $avg: '$application.requestsPerMinute' },
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
            console.error('Error getting aggregated metrics:', error);
            throw new Error('Failed to get aggregated metrics');
        }
    }

    /**
     * Get system health summary
     */
    static async getHealthSummary() {
        try {
            const collection = dbClient.collection<SystemMetrics>(COLLECTION_NAME);

            const latest = await this.getLatest(1);
            if (latest.length === 0) {
                return null;
            }

            const metric = latest[0];
            
            // Calculate health score based on various metrics
            let healthScore = 100;
            
            // CPU health (reduce score if usage > 80%)
            if (metric.cpu.usage > 80) healthScore -= 20;
            else if (metric.cpu.usage > 60) healthScore -= 10;
            
            // Memory health (reduce score if usage > 85%)
            if (metric.memory.percentage > 85) healthScore -= 25;
            else if (metric.memory.percentage > 70) healthScore -= 15;
            
            // Disk health (reduce score if usage > 90%)
            if (metric.disk.percentage > 90) healthScore -= 30;
            else if (metric.disk.percentage > 80) healthScore -= 15;
            
            // Application health (reduce score if error rate > 5%)
            if (metric.application.errorRate > 5) healthScore -= 20;
            else if (metric.application.errorRate > 2) healthScore -= 10;
            
            // Response time health (reduce score if > 1000ms)
            if (metric.application.responseTime > 1000) healthScore -= 15;
            else if (metric.application.responseTime > 500) healthScore -= 5;

            healthScore = Math.max(0, healthScore);

            let status: 'healthy' | 'warning' | 'critical';
            if (healthScore >= 80) status = 'healthy';
            else if (healthScore >= 60) status = 'warning';
            else status = 'critical';

            return {
                status,
                score: healthScore,
                timestamp: metric.timestamp,
                metrics: {
                    cpu: metric.cpu.usage,
                    memory: metric.memory.percentage,
                    disk: metric.disk.percentage,
                    responseTime: metric.application.responseTime,
                    errorRate: metric.application.errorRate
                }
            };
        } catch (error) {
            console.error('Error getting health summary:', error);
            throw new Error('Failed to get health summary');
        }
    }

    /**
     * Clean up old metrics (keep only last N days)
     */
    static async cleanupOldMetrics(daysToKeep: number = 30) {
        try {
            const collection = dbClient.collection<SystemMetrics>(COLLECTION_NAME);

            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

            const result = await collection.deleteMany({
                timestamp: { $lt: cutoffDate }
            });

            return {
                deletedCount: result.deletedCount,
                cutoffDate
            };
        } catch (error) {
            console.error('Error cleaning up old metrics:', error);
            throw new Error('Failed to cleanup old metrics');
        }
    }

    /**
     * Get metrics statistics for a time period
     */
    static async getStatistics(startDate: Date, endDate: Date) {
        try {
            const collection = dbClient.collection<SystemMetrics>(COLLECTION_NAME);

            const pipeline = [
                {
                    $match: {
                        timestamp: {
                            $gte: startDate,
                            $lte: endDate
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        count: { $sum: 1 },
                        avgCpuUsage: { $avg: '$cpu.usage' },
                        maxCpuUsage: { $max: '$cpu.usage' },
                        minCpuUsage: { $min: '$cpu.usage' },
                        avgMemoryPercentage: { $avg: '$memory.percentage' },
                        maxMemoryPercentage: { $max: '$memory.percentage' },
                        minMemoryPercentage: { $min: '$memory.percentage' },
                        avgDiskPercentage: { $avg: '$disk.percentage' },
                        maxDiskPercentage: { $max: '$disk.percentage' },
                        minDiskPercentage: { $min: '$disk.percentage' },
                        avgResponseTime: { $avg: '$application.responseTime' },
                        maxResponseTime: { $max: '$application.responseTime' },
                        minResponseTime: { $min: '$application.responseTime' },
                        avgErrorRate: { $avg: '$application.errorRate' },
                        maxErrorRate: { $max: '$application.errorRate' },
                        totalRequests: { $sum: '$application.requestsPerMinute' }
                    }
                }
            ];

            const results = await collection.aggregate(pipeline).toArray();
            return results[0] || null;
        } catch (error) {
            console.error('Error getting metrics statistics:', error);
            throw new Error('Failed to get metrics statistics');
        }
    }
}