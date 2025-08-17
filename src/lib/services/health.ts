import { ObjectId } from 'mongodb';
import { 
  systemMetricsCollection, 
  systemAlertsCollection, 
  systemHealthStatusCollection 
} from '$lib/db/collections';
import type { 
  SystemMetrics, 
  SystemAlert, 
  SystemHealthStatus 
} from '$lib/db/models';
import { 
  calculateHealthScore, 
  getSystemStatus, 
  HEALTH_THRESHOLDS,
  isValidObjectId 
} from '$lib/db/models';
import db from '$lib/db/dbClient';

// ============================================================================
// Health Monitoring Service
// ============================================================================

interface SystemResourceUsage {
  cpu: {
    usage: number;
    loadAverage: number[];
    cores: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
    available: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
    available: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
  };
}

interface DatabaseMetrics {
  connections: number;
  activeConnections: number;
  queryTime: number;
  slowQueries: number;
  operationsPerSecond: number;
}

interface ApplicationMetrics {
  responseTime: number;
  errorRate: number;
  requestsPerMinute: number;
  activeUsers: number;
  uptime: number;
}

export class HealthMonitoringService {
  private static metricsCollectionInterval: NodeJS.Timeout | null = null;
  private static lastMetrics: SystemMetrics | null = null;

  /**
   * Start automatic metrics collection
   */
  static startMetricsCollection(intervalMs: number = 60000): void {
    if (this.metricsCollectionInterval) {
      this.stopMetricsCollection();
    }

    this.metricsCollectionInterval = setInterval(async () => {
      try {
        await this.collectAndStoreMetrics();
      } catch (error) {
        console.error('Error in automatic metrics collection:', error);
      }
    }, intervalMs);

    console.log(`Started automatic metrics collection with ${intervalMs}ms interval`);
  }

  /**
   * Stop automatic metrics collection
   */
  static stopMetricsCollection(): void {
    if (this.metricsCollectionInterval) {
      clearInterval(this.metricsCollectionInterval);
      this.metricsCollectionInterval = null;
      console.log('Stopped automatic metrics collection');
    }
  }

  /**
   * Collect current system metrics
   */
  static async collectSystemMetrics(): Promise<SystemMetrics> {
    try {
      const [
        systemResources,
        databaseMetrics,
        applicationMetrics
      ] = await Promise.all([
        this.getSystemResourceUsage(),
        this.getDatabaseMetrics(),
        this.getApplicationMetrics()
      ]);

      const metrics: Omit<SystemMetrics, '_id'> = {
        timestamp: new Date(),
        cpu: systemResources.cpu,
        memory: systemResources.memory,
        disk: systemResources.disk,
        network: systemResources.network,
        database: databaseMetrics,
        application: applicationMetrics,
        createdAt: new Date()
      };

      return metrics as SystemMetrics;
    } catch (error) {
      console.error('Error collecting system metrics:', error);
      throw error;
    }
  }

  /**
   * Collect and store metrics in database
   */
  static async collectAndStoreMetrics(): Promise<SystemMetrics> {
    try {
      const metrics = await this.collectSystemMetrics();
      
      // Store metrics in database
      const result = await systemMetricsCollection.insertOne(metrics);
      const storedMetrics = { ...metrics, _id: result.insertedId };

      // Update last metrics cache
      this.lastMetrics = storedMetrics;

      // Check for alerts
      await this.checkAndCreateAlerts(storedMetrics);

      // Update system health status
      await this.updateSystemHealthStatus(storedMetrics);

      return storedMetrics;
    } catch (error) {
      console.error('Error collecting and storing metrics:', error);
      throw error;
    }
  }

  /**
   * Get system resource usage (CPU, Memory, Disk, Network)
   */
  private static async getSystemResourceUsage(): Promise<SystemResourceUsage> {
    try {
      // Note: In a real implementation, you would use system monitoring libraries
      // like 'systeminformation', 'node-os-utils', or native Node.js modules
      // This is a simplified mock implementation

      const cpuUsage = Math.random() * 100; // Mock CPU usage
      const memoryUsage = process.memoryUsage();
      const totalMemory = 8 * 1024 * 1024 * 1024; // Mock 8GB total memory

      return {
        cpu: {
          usage: cpuUsage,
          loadAverage: [1.2, 1.5, 1.8], // Mock load average
          cores: 4 // Mock CPU cores
        },
        memory: {
          used: memoryUsage.heapUsed,
          total: totalMemory,
          percentage: (memoryUsage.heapUsed / totalMemory) * 100,
          available: totalMemory - memoryUsage.heapUsed
        },
        disk: {
          used: 50 * 1024 * 1024 * 1024, // Mock 50GB used
          total: 100 * 1024 * 1024 * 1024, // Mock 100GB total
          percentage: 50,
          available: 50 * 1024 * 1024 * 1024
        },
        network: {
          bytesIn: Math.floor(Math.random() * 1000000),
          bytesOut: Math.floor(Math.random() * 1000000),
          packetsIn: Math.floor(Math.random() * 10000),
          packetsOut: Math.floor(Math.random() * 10000)
        }
      };
    } catch (error) {
      console.error('Error getting system resource usage:', error);
      throw error;
    }
  }

  /**
   * Get database performance metrics
   */
  private static async getDatabaseMetrics(): Promise<DatabaseMetrics> {
    try {
      // Get MongoDB server status
      const serverStatus = await db.admin().serverStatus();
      
      return {
        connections: serverStatus.connections?.current || 0,
        activeConnections: serverStatus.connections?.active || 0,
        queryTime: Math.random() * 100, // Mock average query time
        slowQueries: 0, // Mock slow queries count
        operationsPerSecond: serverStatus.opcounters?.query || 0
      };
    } catch (error) {
      console.error('Error getting database metrics:', error);
      // Return mock data if database is unavailable
      return {
        connections: 0,
        activeConnections: 0,
        queryTime: 0,
        slowQueries: 0,
        operationsPerSecond: 0
      };
    }
  }

  /**
   * Get application performance metrics
   */
  private static async getApplicationMetrics(): Promise<ApplicationMetrics> {
    try {
      return {
        responseTime: Math.random() * 500, // Mock response time
        errorRate: Math.random() * 5, // Mock error rate percentage
        requestsPerMinute: Math.floor(Math.random() * 1000),
        activeUsers: Math.floor(Math.random() * 100),
        uptime: process.uptime()
      };
    } catch (error) {
      console.error('Error getting application metrics:', error);
      return {
        responseTime: 0,
        errorRate: 0,
        requestsPerMinute: 0,
        activeUsers: 0,
        uptime: 0
      };
    }
  }

  /**
   * Check metrics against thresholds and create alerts
   */
  private static async checkAndCreateAlerts(metrics: SystemMetrics): Promise<void> {
    try {
      const alerts: Array<Omit<SystemAlert, '_id'>> = [];

      // Check CPU usage
      if (metrics.cpu.usage >= HEALTH_THRESHOLDS.cpu.critical) {
        alerts.push(this.createAlert(
          'critical',
          'cpu',
          'Critical CPU Usage',
          `CPU usage is at ${metrics.cpu.usage.toFixed(1)}%`,
          'cpu.usage',
          HEALTH_THRESHOLDS.cpu.critical,
          metrics.cpu.usage
        ));
      } else if (metrics.cpu.usage >= HEALTH_THRESHOLDS.cpu.warning) {
        alerts.push(this.createAlert(
          'warning',
          'cpu',
          'High CPU Usage',
          `CPU usage is at ${metrics.cpu.usage.toFixed(1)}%`,
          'cpu.usage',
          HEALTH_THRESHOLDS.cpu.warning,
          metrics.cpu.usage
        ));
      }

      // Check memory usage
      if (metrics.memory.percentage >= HEALTH_THRESHOLDS.memory.critical) {
        alerts.push(this.createAlert(
          'critical',
          'memory',
          'Critical Memory Usage',
          `Memory usage is at ${metrics.memory.percentage.toFixed(1)}%`,
          'memory.percentage',
          HEALTH_THRESHOLDS.memory.critical,
          metrics.memory.percentage
        ));
      } else if (metrics.memory.percentage >= HEALTH_THRESHOLDS.memory.warning) {
        alerts.push(this.createAlert(
          'warning',
          'memory',
          'High Memory Usage',
          `Memory usage is at ${metrics.memory.percentage.toFixed(1)}%`,
          'memory.percentage',
          HEALTH_THRESHOLDS.memory.warning,
          metrics.memory.percentage
        ));
      }

      // Check disk usage
      if (metrics.disk.percentage >= HEALTH_THRESHOLDS.disk.critical) {
        alerts.push(this.createAlert(
          'critical',
          'disk',
          'Critical Disk Usage',
          `Disk usage is at ${metrics.disk.percentage.toFixed(1)}%`,
          'disk.percentage',
          HEALTH_THRESHOLDS.disk.critical,
          metrics.disk.percentage
        ));
      } else if (metrics.disk.percentage >= HEALTH_THRESHOLDS.disk.warning) {
        alerts.push(this.createAlert(
          'warning',
          'disk',
          'High Disk Usage',
          `Disk usage is at ${metrics.disk.percentage.toFixed(1)}%`,
          'disk.percentage',
          HEALTH_THRESHOLDS.disk.warning,
          metrics.disk.percentage
        ));
      }

      // Check response time
      if (metrics.application.responseTime >= HEALTH_THRESHOLDS.responseTime.critical) {
        alerts.push(this.createAlert(
          'critical',
          'application',
          'Critical Response Time',
          `Average response time is ${metrics.application.responseTime.toFixed(0)}ms`,
          'application.responseTime',
          HEALTH_THRESHOLDS.responseTime.critical,
          metrics.application.responseTime
        ));
      } else if (metrics.application.responseTime >= HEALTH_THRESHOLDS.responseTime.warning) {
        alerts.push(this.createAlert(
          'warning',
          'application',
          'High Response Time',
          `Average response time is ${metrics.application.responseTime.toFixed(0)}ms`,
          'application.responseTime',
          HEALTH_THRESHOLDS.responseTime.warning,
          metrics.application.responseTime
        ));
      }

      // Check error rate
      if (metrics.application.errorRate >= HEALTH_THRESHOLDS.errorRate.critical) {
        alerts.push(this.createAlert(
          'critical',
          'application',
          'Critical Error Rate',
          `Error rate is ${metrics.application.errorRate.toFixed(1)}%`,
          'application.errorRate',
          HEALTH_THRESHOLDS.errorRate.critical,
          metrics.application.errorRate
        ));
      } else if (metrics.application.errorRate >= HEALTH_THRESHOLDS.errorRate.warning) {
        alerts.push(this.createAlert(
          'warning',
          'application',
          'High Error Rate',
          `Error rate is ${metrics.application.errorRate.toFixed(1)}%`,
          'application.errorRate',
          HEALTH_THRESHOLDS.errorRate.warning,
          metrics.application.errorRate
        ));
      }

      // Store alerts if any
      if (alerts.length > 0) {
        await systemAlertsCollection.insertMany(alerts as SystemAlert[]);
      }
    } catch (error) {
      console.error('Error checking and creating alerts:', error);
    }
  }

  /**
   * Create an alert object
   */
  private static createAlert(
    type: SystemAlert['type'],
    category: SystemAlert['category'],
    title: string,
    message: string,
    metric: string,
    threshold: number,
    currentValue: number
  ): Omit<SystemAlert, '_id'> {
    return {
      type,
      category,
      title,
      message,
      metric,
      threshold,
      currentValue,
      severity: type === 'critical' ? 5 : type === 'error' ? 4 : type === 'warning' ? 3 : 2,
      acknowledged: false,
      createdAt: new Date()
    };
  }

  /**
   * Update system health status
   */
  private static async updateSystemHealthStatus(metrics: SystemMetrics): Promise<void> {
    try {
      const healthScore = calculateHealthScore(metrics);
      const activeAlerts = await this.getActiveAlertsCount();
      const criticalAlerts = await this.getCriticalAlertsCount();
      const status = getSystemStatus(healthScore, criticalAlerts);

      const healthStatus: Omit<SystemHealthStatus, '_id'> = {
        status,
        score: healthScore,
        uptime: metrics.application.uptime,
        lastCheck: new Date(),
        services: {
          database: metrics.database.connections > 0 ? 'healthy' : 'critical',
          storage: metrics.disk.percentage < 90 ? 'healthy' : 'critical',
          cache: 'healthy', // Mock cache status
          email: 'healthy'  // Mock email service status
        },
        activeAlerts,
        criticalAlerts,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await systemHealthStatusCollection.replaceOne(
        {},
        healthStatus as SystemHealthStatus,
        { upsert: true }
      );
    } catch (error) {
      console.error('Error updating system health status:', error);
    }
  }

  /**
   * Get current system health status
   */
  static async getSystemHealthStatus(): Promise<SystemHealthStatus | null> {
    try {
      return await systemHealthStatusCollection.findOne({});
    } catch (error) {
      console.error('Error getting system health status:', error);
      return null;
    }
  }

  /**
   * Get metrics history
   */
  static async getMetricsHistory(
    startDate: Date,
    endDate: Date,
    interval: '1m' | '5m' | '1h' | '1d' = '5m',
    limit: number = 100
  ): Promise<SystemMetrics[]> {
    try {
      const query = {
        timestamp: {
          $gte: startDate,
          $lte: endDate
        }
      };

      return await systemMetricsCollection
        .find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();
    } catch (error) {
      console.error('Error getting metrics history:', error);
      return [];
    }
  }

  /**
   * Get active alerts
   */
  static async getActiveAlerts(): Promise<SystemAlert[]> {
    try {
      return await systemAlertsCollection
        .find({ resolvedAt: { $exists: false } })
        .sort({ createdAt: -1 })
        .toArray();
    } catch (error) {
      console.error('Error getting active alerts:', error);
      return [];
    }
  }

  /**
   * Get active alerts count
   */
  private static async getActiveAlertsCount(): Promise<number> {
    try {
      return await systemAlertsCollection.countDocuments({ 
        resolvedAt: { $exists: false } 
      });
    } catch (error) {
      console.error('Error getting active alerts count:', error);
      return 0;
    }
  }

  /**
   * Get critical alerts count
   */
  private static async getCriticalAlertsCount(): Promise<number> {
    try {
      return await systemAlertsCollection.countDocuments({ 
        type: 'critical',
        resolvedAt: { $exists: false } 
      });
    } catch (error) {
      console.error('Error getting critical alerts count:', error);
      return 0;
    }
  }

  /**
   * Acknowledge an alert
   */
  static async acknowledgeAlert(
    alertId: string,
    acknowledgedBy: string
  ): Promise<boolean> {
    try {
      if (!isValidObjectId(alertId) || !isValidObjectId(acknowledgedBy)) {
        throw new Error('Invalid ID provided');
      }

      const result = await systemAlertsCollection.updateOne(
        { _id: new ObjectId(alertId) },
        {
          $set: {
            acknowledged: true,
            acknowledgedBy: new ObjectId(acknowledgedBy),
            acknowledgedAt: new Date()
          }
        }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      return false;
    }
  }

  /**
   * Resolve an alert
   */
  static async resolveAlert(alertId: string): Promise<boolean> {
    try {
      if (!isValidObjectId(alertId)) {
        throw new Error('Invalid alert ID');
      }

      const result = await systemAlertsCollection.updateOne(
        { _id: new ObjectId(alertId) },
        {
          $set: {
            resolvedAt: new Date()
          }
        }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error resolving alert:', error);
      return false;
    }
  }

  /**
   * Get system statistics
   */
  static async getSystemStatistics(): Promise<{
    totalMetrics: number;
    totalAlerts: number;
    activeAlerts: number;
    criticalAlerts: number;
    averageHealthScore: number;
  }> {
    try {
      const [
        totalMetrics,
        totalAlerts,
        activeAlerts,
        criticalAlerts,
        recentMetrics
      ] = await Promise.all([
        systemMetricsCollection.countDocuments(),
        systemAlertsCollection.countDocuments(),
        systemAlertsCollection.countDocuments({ resolvedAt: { $exists: false } }),
        systemAlertsCollection.countDocuments({ 
          type: 'critical', 
          resolvedAt: { $exists: false } 
        }),
        systemMetricsCollection
          .find({})
          .sort({ timestamp: -1 })
          .limit(10)
          .toArray()
      ]);

      const averageHealthScore = recentMetrics.length > 0
        ? recentMetrics.reduce((sum, metric) => sum + calculateHealthScore(metric), 0) / recentMetrics.length
        : 0;

      return {
        totalMetrics,
        totalAlerts,
        activeAlerts,
        criticalAlerts,
        averageHealthScore: Math.round(averageHealthScore)
      };
    } catch (error) {
      console.error('Error getting system statistics:', error);
      return {
        totalMetrics: 0,
        totalAlerts: 0,
        activeAlerts: 0,
        criticalAlerts: 0,
        averageHealthScore: 0
      };
    }
  }

  /**
   * Get latest metrics
   */
  static getLatestMetrics(): SystemMetrics | null {
    return this.lastMetrics;
  }

  /**
   * Clean up old metrics (keep only last 30 days)
   */
  static async cleanupOldMetrics(daysToKeep: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await systemMetricsCollection.deleteMany({
        createdAt: { $lt: cutoffDate }
      });

      console.log(`Cleaned up ${result.deletedCount} old metrics records`);
      return result.deletedCount;
    } catch (error) {
      console.error('Error cleaning up old metrics:', error);
      return 0;
    }
  }

  /**
   * Clean up resolved alerts (keep only last 7 days)
   */
  static async cleanupResolvedAlerts(daysToKeep: number = 7): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await systemAlertsCollection.deleteMany({
        resolvedAt: { $exists: true, $lt: cutoffDate }
      });

      console.log(`Cleaned up ${result.deletedCount} resolved alerts`);
      return result.deletedCount;
    } catch (error) {
      console.error('Error cleaning up resolved alerts:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const healthService = HealthMonitoringService;