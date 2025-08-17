import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { HealthMonitoringService } from '$lib/services/health';
import { 
  systemMetricsCollection, 
  systemAlertsCollection, 
  systemHealthStatusCollection 
} from '$lib/db/collections';
import type { SystemMetrics, SystemAlert, SystemHealthStatus } from '$lib/db/models';
import db from '$lib/db/dbClient';

// Mock the database client
vi.mock('$lib/db/dbClient', () => ({
  default: {
    admin: vi.fn(() => ({
      serverStatus: vi.fn().mockResolvedValue({
        connections: { current: 10, active: 5 },
        opcounters: { query: 100 }
      }),
      ping: vi.fn().mockResolvedValue({})
    }))
  }
}));

// Mock the database collections
vi.mock('$lib/db/collections', () => ({
  systemMetricsCollection: {
    insertOne: vi.fn(),
    find: vi.fn(() => ({
      sort: vi.fn(() => ({
        limit: vi.fn(() => ({
          toArray: vi.fn()
        }))
      }))
    })),
    countDocuments: vi.fn(),
    deleteMany: vi.fn()
  },
  systemAlertsCollection: {
    insertMany: vi.fn(),
    find: vi.fn(() => ({
      sort: vi.fn(() => ({
        toArray: vi.fn()
      }))
    })),
    countDocuments: vi.fn(),
    updateOne: vi.fn(),
    deleteMany: vi.fn()
  },
  systemHealthStatusCollection: {
    findOne: vi.fn(),
    replaceOne: vi.fn()
  }
}));

// Mock process.uptime and process.memoryUsage
Object.defineProperty(process, 'uptime', {
  value: vi.fn().mockReturnValue(3600) // 1 hour uptime
});

Object.defineProperty(process, 'memoryUsage', {
  value: vi.fn().mockReturnValue({
    rss: 100 * 1024 * 1024,
    heapTotal: 80 * 1024 * 1024,
    heapUsed: 60 * 1024 * 1024,
    external: 10 * 1024 * 1024,
    arrayBuffers: 5 * 1024 * 1024
  })
});

describe('HealthMonitoringService', () => {
  const mockUserId = new ObjectId().toString();

  beforeEach(() => {
    vi.clearAllMocks();
    // Clear any existing intervals
    HealthMonitoringService.stopMetricsCollection();
  });

  afterEach(() => {
    HealthMonitoringService.stopMetricsCollection();
  });

  describe('Metrics Collection', () => {
    it('should collect system metrics', async () => {
      const metrics = await HealthMonitoringService.collectSystemMetrics();

      expect(metrics).toHaveProperty('timestamp');
      expect(metrics).toHaveProperty('cpu');
      expect(metrics).toHaveProperty('memory');
      expect(metrics).toHaveProperty('disk');
      expect(metrics).toHaveProperty('network');
      expect(metrics).toHaveProperty('database');
      expect(metrics).toHaveProperty('application');
      expect(metrics).toHaveProperty('createdAt');

      // Check CPU metrics structure
      expect(metrics.cpu).toHaveProperty('usage');
      expect(metrics.cpu).toHaveProperty('loadAverage');
      expect(metrics.cpu).toHaveProperty('cores');
      expect(typeof metrics.cpu.usage).toBe('number');
      expect(Array.isArray(metrics.cpu.loadAverage)).toBe(true);

      // Check memory metrics structure
      expect(metrics.memory).toHaveProperty('used');
      expect(metrics.memory).toHaveProperty('total');
      expect(metrics.memory).toHaveProperty('percentage');
      expect(metrics.memory).toHaveProperty('available');

      // Check database metrics structure
      expect(metrics.database).toHaveProperty('connections');
      expect(metrics.database).toHaveProperty('activeConnections');
      expect(metrics.database).toHaveProperty('queryTime');
      expect(metrics.database).toHaveProperty('operationsPerSecond');

      // Check application metrics structure
      expect(metrics.application).toHaveProperty('responseTime');
      expect(metrics.application).toHaveProperty('errorRate');
      expect(metrics.application).toHaveProperty('requestsPerMinute');
      expect(metrics.application).toHaveProperty('uptime');
    });

    it('should collect and store metrics in database', async () => {
      const insertedId = new ObjectId();
      
      vi.mocked(systemMetricsCollection.insertOne).mockResolvedValue({
        insertedId,
        acknowledged: true
      });
      vi.mocked(systemAlertsCollection.insertMany).mockResolvedValue({
        insertedIds: {},
        insertedCount: 0,
        acknowledged: true
      });
      vi.mocked(systemHealthStatusCollection.replaceOne).mockResolvedValue({
        modifiedCount: 1,
        matchedCount: 1,
        acknowledged: true,
        upsertedCount: 0,
        upsertedId: null
      });

      const metrics = await HealthMonitoringService.collectAndStoreMetrics();

      expect(metrics).toHaveProperty('_id', insertedId);
      expect(systemMetricsCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: expect.any(Date),
          cpu: expect.any(Object),
          memory: expect.any(Object),
          disk: expect.any(Object),
          network: expect.any(Object),
          database: expect.any(Object),
          application: expect.any(Object),
          createdAt: expect.any(Date)
        })
      );
    });

    it('should handle database connection errors gracefully', async () => {
      vi.mocked(db.admin).mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const metrics = await HealthMonitoringService.collectSystemMetrics();

      // Should still return metrics with default database values
      expect(metrics.database.connections).toBe(0);
      expect(metrics.database.activeConnections).toBe(0);
      expect(metrics.database.queryTime).toBe(0);
      expect(metrics.database.operationsPerSecond).toBe(0);
    });
  });

  describe('Alert Management', () => {
    it('should get active alerts', async () => {
      const mockAlerts = [
        {
          _id: new ObjectId(),
          type: 'critical',
          category: 'cpu',
          title: 'High CPU Usage',
          message: 'CPU usage is at 95%',
          metric: 'cpu.usage',
          threshold: 90,
          currentValue: 95,
          severity: 5,
          acknowledged: false,
          createdAt: new Date()
        }
      ] as SystemAlert[];

      const mockFind = {
        sort: vi.fn(() => ({
          toArray: vi.fn().mockResolvedValue(mockAlerts)
        }))
      };
      vi.mocked(systemAlertsCollection.find).mockReturnValue(mockFind as any);

      const result = await HealthMonitoringService.getActiveAlerts();

      expect(result).toEqual(mockAlerts);
      expect(systemAlertsCollection.find).toHaveBeenCalledWith({
        resolvedAt: { $exists: false }
      });
    });

    it('should acknowledge an alert', async () => {
      const alertId = new ObjectId().toString();
      
      vi.mocked(systemAlertsCollection.updateOne).mockResolvedValue({
        modifiedCount: 1,
        matchedCount: 1,
        acknowledged: true,
        upsertedCount: 0,
        upsertedId: null
      });

      const result = await HealthMonitoringService.acknowledgeAlert(alertId, mockUserId);

      expect(result).toBe(true);
      expect(systemAlertsCollection.updateOne).toHaveBeenCalledWith(
        { _id: new ObjectId(alertId) },
        {
          $set: {
            acknowledged: true,
            acknowledgedBy: new ObjectId(mockUserId),
            acknowledgedAt: expect.any(Date)
          }
        }
      );
    });
  });

  describe('System Health Status', () => {
    it('should get system health status', async () => {
      const mockHealthStatus: SystemHealthStatus = {
        _id: new ObjectId(),
        status: 'healthy',
        score: 85,
        uptime: 3600,
        lastCheck: new Date(),
        services: {
          database: 'healthy',
          storage: 'healthy',
          cache: 'healthy',
          email: 'healthy'
        },
        activeAlerts: 0,
        criticalAlerts: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.mocked(systemHealthStatusCollection.findOne).mockResolvedValue(mockHealthStatus);

      const result = await HealthMonitoringService.getSystemHealthStatus();

      expect(result).toEqual(mockHealthStatus);
      expect(systemHealthStatusCollection.findOne).toHaveBeenCalledWith({});
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully in statistics', async () => {
      vi.mocked(systemMetricsCollection.countDocuments).mockRejectedValue(
        new Error('Database error')
      );

      const result = await HealthMonitoringService.getSystemStatistics();

      expect(result).toEqual({
        totalMetrics: 0,
        totalAlerts: 0,
        activeAlerts: 0,
        criticalAlerts: 0,
        averageHealthScore: 0
      });
    });

    it('should handle invalid ObjectId in alert operations', async () => {
      const result = await HealthMonitoringService.acknowledgeAlert('invalid-id', mockUserId);

      expect(result).toBe(false);
      expect(systemAlertsCollection.updateOne).not.toHaveBeenCalled();
    });
  });
});