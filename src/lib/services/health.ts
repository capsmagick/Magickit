import { ObjectId } from 'mongodb';
import { 
  systemMetricsCollection, 
  systemAlertsCollection, 
  systemHealthStatusCollection 
} from '$lib/db/collections';
import { SystemMetricsCollection } from '$lib/db/collections/systemMetrics';
import { SystemAlertsCollection } from '$lib/db/collections/systemAlerts';
import { SystemHealthStatusCollection } from '$lib/db/collections/systemHealthStatus';
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
import os from 'os';
import fs from 'fs/promises';
import { promisify } from 'util';

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
      
      // Store metrics in database using collection class
      const storedMetrics = await SystemMetricsCollection.create(metrics);

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
      // Get CPU metrics
      const cpuMetrics = await this.getCPUMetrics();
      
      // Get memory metrics
      const memoryMetrics = await this.getMemoryMetrics();
      
      // Get disk metrics
      const diskMetrics = await this.getDiskMetrics();
      
      // Get network metrics
      const networkMetrics = await this.getNetworkMetrics();

      return {
        cpu: cpuMetrics,
        memory: memoryMetrics,
        disk: diskMetrics,
        network: networkMetrics
      };
    } catch (error) {
      console.error('Error getting system resource usage:', error);
      throw error;
    }
  }

  /**
   * Get CPU usage and load average
   */
  private static async getCPUMetrics(): Promise<SystemResourceUsage['cpu']> {
    try {
      const cpus = os.cpus();
      const loadAverage = os.loadavg();
      
      // Calculate CPU usage by measuring idle time
      let totalIdle = 0;
      let totalTick = 0;
      
      cpus.forEach(cpu => {
        for (const type in cpu.times) {
          totalTick += cpu.times[type as keyof typeof cpu.times];
        }
        totalIdle += cpu.times.idle;
      });
      
      const idle = totalIdle / cpus.length;
      const total = totalTick / cpus.length;
      const usage = 100 - ~~(100 * idle / total);

      return {
        usage: Math.max(0, Math.min(100, usage)),
        loadAverage,
        cores: cpus.length
      };
    } catch (error) {
      console.error('Error getting CPU metrics:', error);
      // Return fallback values
      return {
        usage: 0,
        loadAverage: [0, 0, 0],
        cores: os.cpus().length || 1
      };
    }
  }

  /**
   * Get memory usage statistics
   */
  private static async getMemoryMetrics(): Promise<SystemResourceUsage['memory']> {
    try {
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;
      const percentage = (usedMemory / totalMemory) * 100;

      return {
        used: usedMemory,
        total: totalMemory,
        percentage: Math.max(0, Math.min(100, percentage)),
        available: freeMemory
      };
    } catch (error) {
      console.error('Error getting memory metrics:', error);
      // Return fallback values
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      return {
        used: totalMemory - freeMemory,
        total: totalMemory,
        percentage: 0,
        available: freeMemory
      };
    }
  }

  /**
   * Get disk usage statistics
   */
  private static async getDiskMetrics(): Promise<SystemResourceUsage['disk']> {
    try {
      // For cross-platform compatibility, we'll use a simplified approach
      // In production, you might want to use a library like 'node-disk-info'
      
      let diskStats;
      
      if (process.platform === 'win32') {
        // Windows implementation would require additional libraries
        diskStats = await this.getWindowsDiskStats();
      } else {
        // Unix-like systems (Linux, macOS)
        diskStats = await this.getUnixDiskStats();
      }

      return diskStats;
    } catch (error) {
      console.error('Error getting disk metrics:', error);
      // Return fallback values
      return {
        used: 0,
        total: 100 * 1024 * 1024 * 1024, // 100GB fallback
        percentage: 0,
        available: 100 * 1024 * 1024 * 1024
      };
    }
  }

  /**
   * Get disk stats for Unix-like systems
   */
  private static async getUnixDiskStats(): Promise<SystemResourceUsage['disk']> {
    try {
      const { exec } = await import('child_process');
      const execAsync = promisify(exec);
      
      // Use df command to get disk usage for root filesystem
      const { stdout } = await execAsync('df -k / | tail -1');
      const parts = stdout.trim().split(/\s+/);
      
      if (parts.length >= 4) {
        const total = parseInt(parts[1]) * 1024; // Convert from KB to bytes
        const used = parseInt(parts[2]) * 1024;
        const available = parseInt(parts[3]) * 1024;
        const percentage = (used / total) * 100;

        return {
          used,
          total,
          percentage: Math.max(0, Math.min(100, percentage)),
          available
        };
      }
      
      throw new Error('Unable to parse df output');
    } catch (error) {
      console.error('Error getting Unix disk stats:', error);
      throw error;
    }
  }

  /**
   * Get disk stats for Windows systems
   */
  private static async getWindowsDiskStats(): Promise<SystemResourceUsage['disk']> {
    try {
      const { exec } = await import('child_process');
      const execAsync = promisify(exec);
      
      // Use wmic command to get disk usage for C: drive
      const { stdout } = await execAsync('wmic logicaldisk where caption="C:" get size,freespace /value');
      
      let total = 0;
      let available = 0;
      
      const lines = stdout.split('\n');
      for (const line of lines) {
        if (line.includes('FreeSpace=')) {
          available = parseInt(line.split('=')[1]);
        } else if (line.includes('Size=')) {
          total = parseInt(line.split('=')[1]);
        }
      }
      
      if (total > 0) {
        const used = total - available;
        const percentage = (used / total) * 100;

        return {
          used,
          total,
          percentage: Math.max(0, Math.min(100, percentage)),
          available
        };
      }
      
      throw new Error('Unable to get Windows disk stats');
    } catch (error) {
      console.error('Error getting Windows disk stats:', error);
      throw error;
    }
  }

  /**
   * Get network usage statistics
   */
  private static async getNetworkMetrics(): Promise<SystemResourceUsage['network']> {
    try {
      const networkInterfaces = os.networkInterfaces();
      let bytesIn = 0;
      let bytesOut = 0;
      let packetsIn = 0;
      let packetsOut = 0;

      // Note: Node.js doesn't provide network traffic statistics directly
      // In production, you would need to use system-specific commands or libraries
      // For now, we'll provide basic interface information and mock traffic data
      
      // Count active network interfaces
      let activeInterfaces = 0;
      for (const [name, interfaces] of Object.entries(networkInterfaces)) {
        if (interfaces && name !== 'lo' && name !== 'Loopback') {
          activeInterfaces += interfaces.length;
        }
      }

      // Mock network traffic based on active interfaces
      // In production, you would read from /proc/net/dev on Linux or use system commands
      if (activeInterfaces > 0) {
        bytesIn = Math.floor(Math.random() * 1000000 * activeInterfaces);
        bytesOut = Math.floor(Math.random() * 1000000 * activeInterfaces);
        packetsIn = Math.floor(Math.random() * 10000 * activeInterfaces);
        packetsOut = Math.floor(Math.random() * 10000 * activeInterfaces);
      }

      return {
        bytesIn,
        bytesOut,
        packetsIn,
        packetsOut
      };
    } catch (error) {
      console.error('Error getting network metrics:', error);
      // Return fallback values
      return {
        bytesIn: 0,
        bytesOut: 0,
        packetsIn: 0,
        packetsOut: 0
      };
    }
  }

  /**
   * Get database performance metrics
   */
  private static async getDatabaseMetrics(): Promise<DatabaseMetrics> {
    try {
      // Get MongoDB server status
      const serverStatus = await db.admin().serverStatus();
      
      // Get database stats
      const dbStats = await db.stats();
      
      // Calculate query performance metrics
      const opcounters = serverStatus.opcounters || {};
      const totalOps = (opcounters.query || 0) + (opcounters.insert || 0) + 
                      (opcounters.update || 0) + (opcounters.delete || 0);
      
      // Get current operations to check for slow queries
      const currentOps = await db.admin().command({ currentOp: true });
      const slowQueries = currentOps.inprog ? 
        currentOps.inprog.filter((op: any) => op.secs_running && op.secs_running > 1).length : 0;

      // Calculate average query time (simplified estimation)
      const avgQueryTime = serverStatus.globalLock?.totalTime && serverStatus.globalLock?.lockTime ?
        (serverStatus.globalLock.lockTime / serverStatus.globalLock.totalTime) * 1000 : 0;

      return {
        connections: serverStatus.connections?.current || 0,
        activeConnections: serverStatus.connections?.active || 0,
        queryTime: Math.max(0, avgQueryTime),
        slowQueries,
        operationsPerSecond: totalOps
      };
    } catch (error) {
      console.error('Error getting database metrics:', error);
      // Return fallback data if database is unavailable
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
      // Get process uptime
      const uptime = process.uptime();
      
      // Get memory usage for the application
      const memUsage = process.memoryUsage();
      
      // Calculate basic application metrics
      // In production, you would integrate with your application's metrics collection
      const responseTime = this.calculateAverageResponseTime();
      const errorRate = this.calculateErrorRate();
      const requestsPerMinute = this.calculateRequestsPerMinute();
      const activeUsers = await this.getActiveUsersCount();

      return {
        responseTime,
        errorRate,
        requestsPerMinute,
        activeUsers,
        uptime
      };
    } catch (error) {
      console.error('Error getting application metrics:', error);
      return {
        responseTime: 0,
        errorRate: 0,
        requestsPerMinute: 0,
        activeUsers: 0,
        uptime: process.uptime()
      };
    }
  }

  /**
   * Calculate average response time
   * In production, this would integrate with your request tracking system
   */
  private static calculateAverageResponseTime(): number {
    // Mock implementation - in production, you would track actual response times
    // This could integrate with APM tools like New Relic, DataDog, or custom metrics
    const baseResponseTime = 50; // Base response time in ms
    const variation = Math.random() * 200; // Random variation up to 200ms
    return Math.round(baseResponseTime + variation);
  }

  /**
   * Calculate error rate percentage
   * In production, this would track actual error rates
   */
  private static calculateErrorRate(): number {
    // Mock implementation - in production, you would track actual errors
    // This could integrate with error tracking tools like Sentry or custom logging
    const baseErrorRate = 0.1; // Base error rate of 0.1%
    const variation = Math.random() * 2; // Random variation up to 2%
    return Math.round((baseErrorRate + variation) * 100) / 100;
  }

  /**
   * Calculate requests per minute
   * In production, this would track actual request counts
   */
  private static calculateRequestsPerMinute(): number {
    // Mock implementation - in production, you would track actual requests
    // This could integrate with web server logs or application metrics
    const baseRequests = 10; // Base requests per minute
    const variation = Math.floor(Math.random() * 100); // Random variation
    return baseRequests + variation;
  }

  /**
   * Get active users count
   * In production, this would query your session store or user tracking system
   */
  private static async getActiveUsersCount(): Promise<number> {
    try {
      // Mock implementation - in production, you would:
      // 1. Query active sessions from your session store
      // 2. Count unique users from recent activity logs
      // 3. Use real-time analytics data
      
      // For now, return a mock value based on time of day
      const hour = new Date().getHours();
      let baseUsers = 5;
      
      // Simulate higher activity during business hours
      if (hour >= 9 && hour <= 17) {
        baseUsers = 20;
      } else if (hour >= 18 && hour <= 22) {
        baseUsers = 15;
      }
      
      const variation = Math.floor(Math.random() * 10);
      return baseUsers + variation;
    } catch (error) {
      console.error('Error getting active users count:', error);
      return 0;
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
        for (const alert of alerts) {
          await SystemAlertsCollection.create(alert);
        }
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

      const healthStatus: Omit<SystemHealthStatus, '_id' | 'createdAt' | 'updatedAt'> = {
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
        criticalAlerts
      };

      await SystemHealthStatusCollection.updateCurrent(healthStatus);
    } catch (error) {
      console.error('Error updating system health status:', error);
    }
  }

  /**
   * Get current system health status
   */
  static async getSystemHealthStatus(): Promise<SystemHealthStatus | null> {
    try {
      return await SystemHealthStatusCollection.getLatest();
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
      const result = await SystemMetricsCollection.findAll({
        startDate,
        endDate,
        limit,
        sortBy: 'timestamp',
        sortOrder: 'desc'
      });
      
      return result.metrics;
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
      const result = await SystemAlertsCollection.getActiveAlerts();
      return result.alerts;
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
      const result = await SystemAlertsCollection.getActiveAlerts();
      return result.total;
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
      const result = await SystemAlertsCollection.getCriticalAlerts();
      return result.total;
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

      const result = await SystemAlertsCollection.acknowledge(
        alertId, 
        new ObjectId(acknowledgedBy)
      );

      return result !== null;
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

      const result = await SystemAlertsCollection.resolve(alertId);
      return result !== null;
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
        metricsResult,
        alertsResult,
        activeAlertsResult,
        criticalAlertsResult,
        recentMetricsResult
      ] = await Promise.all([
        SystemMetricsCollection.findAll({ limit: 1 }), // Just to get total count
        SystemAlertsCollection.findAll({ limit: 1 }), // Just to get total count
        SystemAlertsCollection.getActiveAlerts({ limit: 1 }), // Just to get total count
        SystemAlertsCollection.getCriticalAlerts(1), // Just to get total count
        SystemMetricsCollection.getLatest(10)
      ]);

      const averageHealthScore = recentMetricsResult.length > 0
        ? recentMetricsResult.reduce((sum, metric) => sum + calculateHealthScore(metric), 0) / recentMetricsResult.length
        : 0;

      return {
        totalMetrics: metricsResult.total,
        totalAlerts: alertsResult.total,
        activeAlerts: activeAlertsResult.total,
        criticalAlerts: criticalAlertsResult.total,
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
   * Get aggregated metrics for a time period
   */
  static async getAggregatedMetrics(
    startDate: Date,
    endDate: Date,
    interval: '1m' | '5m' | '15m' | '1h' | '1d' = '5m'
  ) {
    try {
      return await SystemMetricsCollection.getAggregatedMetrics(startDate, endDate, interval);
    } catch (error) {
      console.error('Error getting aggregated metrics:', error);
      return [];
    }
  }

  /**
   * Get system health summary
   */
  static async getHealthSummary() {
    try {
      return await SystemMetricsCollection.getHealthSummary();
    } catch (error) {
      console.error('Error getting health summary:', error);
      return null;
    }
  }

  /**
   * Get alert statistics
   */
  static async getAlertStatistics(startDate?: Date, endDate?: Date) {
    try {
      return await SystemAlertsCollection.getAlertStatistics(startDate, endDate);
    } catch (error) {
      console.error('Error getting alert statistics:', error);
      return {
        overall: {
          total: 0,
          critical: 0,
          error: 0,
          warning: 0,
          info: 0,
          acknowledged: 0,
          resolved: 0,
          active: 0
        },
        byCategory: []
      };
    }
  }

  /**
   * Get system status overview
   */
  static async getSystemStatus(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    alerts: SystemAlert[];
    uptime: number;
    lastCheck: Date;
  }> {
    try {
      const [healthStatus, activeAlerts] = await Promise.all([
        this.getSystemHealthStatus(),
        this.getActiveAlerts()
      ]);

      return {
        status: healthStatus?.status || 'critical',
        alerts: activeAlerts,
        uptime: healthStatus?.uptime || 0,
        lastCheck: healthStatus?.lastCheck || new Date()
      };
    } catch (error) {
      console.error('Error getting system status:', error);
      return {
        status: 'critical',
        alerts: [],
        uptime: 0,
        lastCheck: new Date()
      };
    }
  }

  /**
   * Force a metrics collection cycle
   */
  static async forceMetricsCollection(): Promise<SystemMetrics> {
    try {
      console.log('Forcing metrics collection...');
      return await this.collectAndStoreMetrics();
    } catch (error) {
      console.error('Error forcing metrics collection:', error);
      throw error;
    }
  }

  /**
   * Get system resource summary
   */
  static async getResourceSummary(): Promise<{
    cpu: { usage: number; status: 'healthy' | 'warning' | 'critical' };
    memory: { percentage: number; status: 'healthy' | 'warning' | 'critical' };
    disk: { percentage: number; status: 'healthy' | 'warning' | 'critical' };
    database: { connections: number; status: 'healthy' | 'warning' | 'critical' };
  }> {
    try {
      const latest = await SystemMetricsCollection.getLatest(1);
      
      if (latest.length === 0) {
        return {
          cpu: { usage: 0, status: 'critical' },
          memory: { percentage: 0, status: 'critical' },
          disk: { percentage: 0, status: 'critical' },
          database: { connections: 0, status: 'critical' }
        };
      }

      const metrics = latest[0];
      
      return {
        cpu: {
          usage: metrics.cpu.usage,
          status: metrics.cpu.usage > 80 ? 'critical' : metrics.cpu.usage > 60 ? 'warning' : 'healthy'
        },
        memory: {
          percentage: metrics.memory.percentage,
          status: metrics.memory.percentage > 85 ? 'critical' : metrics.memory.percentage > 70 ? 'warning' : 'healthy'
        },
        disk: {
          percentage: metrics.disk.percentage,
          status: metrics.disk.percentage > 90 ? 'critical' : metrics.disk.percentage > 80 ? 'warning' : 'healthy'
        },
        database: {
          connections: metrics.database.connections,
          status: metrics.database.connections === 0 ? 'critical' : metrics.database.queryTime > 1000 ? 'warning' : 'healthy'
        }
      };
    } catch (error) {
      console.error('Error getting resource summary:', error);
      return {
        cpu: { usage: 0, status: 'critical' },
        memory: { percentage: 0, status: 'critical' },
        disk: { percentage: 0, status: 'critical' },
        database: { connections: 0, status: 'critical' }
      };
    }
  }

  /**
   * Clean up old metrics (keep only last 30 days)
   */
  static async cleanupOldMetrics(daysToKeep: number = 30): Promise<number> {
    try {
      const result = await SystemMetricsCollection.cleanupOldMetrics(daysToKeep);
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
      const result = await SystemAlertsCollection.cleanupResolvedAlerts(daysToKeep);
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