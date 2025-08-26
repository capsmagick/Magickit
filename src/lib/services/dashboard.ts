import { ObjectId } from 'mongodb';
import db from '$lib/db/dbClient';
import { HealthMonitoringService } from './health';
import { getCollectionStats, checkDatabaseHealth } from '$lib/db/collections';
import type { SystemMetrics, SystemAlert } from '$lib/db/models';

// ============================================================================
// Dashboard Service - Real Data Integration
// ============================================================================

export interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  systemHealth: string;
  securityAlerts: number;
  totalSessions: number;
  newUsersToday: number;
  systemUptime: number;
  databaseStatus: string;
  responseTime: number;
  errorRate: number;
}

export interface UserStatistics {
  total: number;
  active: number;
  newToday: number;
  newThisWeek: number;
  newThisMonth: number;
  byRole: Array<{ role: string; count: number }>;
  recentActivity: Array<{
    userId: string;
    action: string;
    timestamp: Date;
  }>;
}

export interface SystemStatus {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  lastCheck: Date;
  services: {
    database: 'healthy' | 'warning' | 'critical';
    storage: 'healthy' | 'warning' | 'critical';
    cache: 'healthy' | 'warning' | 'critical';
    email: 'healthy' | 'warning' | 'critical';
  };
  alerts: SystemAlert[];
}

export class DashboardService {
  
  /**
   * Get comprehensive dashboard metrics
   */
  static async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      const [
        userStats,
        systemStatus,
        latestMetrics,
        databaseHealth
      ] = await Promise.all([
        this.getUserStatistics(),
        HealthMonitoringService.getSystemStatus(),
        HealthMonitoringService.getLatestMetrics(),
        checkDatabaseHealth()
      ]);

      return {
        totalUsers: userStats.total,
        activeUsers: userStats.active,
        systemHealth: systemStatus.status,
        securityAlerts: systemStatus.alerts.length,
        totalSessions: await this.getActiveSessions(),
        newUsersToday: userStats.newToday,
        systemUptime: systemStatus.uptime,
        databaseStatus: databaseHealth.status,
        responseTime: latestMetrics?.application.responseTime || 0,
        errorRate: latestMetrics?.application.errorRate || 0
      };
    } catch (error) {
      console.error('Error getting dashboard metrics:', error);
      // Return fallback data
      return {
        totalUsers: 0,
        activeUsers: 0,
        systemHealth: 'critical',
        securityAlerts: 0,
        totalSessions: 0,
        newUsersToday: 0,
        systemUptime: 0,
        databaseStatus: 'unhealthy',
        responseTime: 0,
        errorRate: 0
      };
    }
  }

  /**
   * Get detailed user statistics
   */
  static async getUserStatistics(): Promise<UserStatistics> {
    try {
      const usersCollection = db.collection('user');
      const sessionsCollection = db.collection('session');
      
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get total users
      const totalUsers = await usersCollection.countDocuments();

      // Get users created today
      const newToday = await usersCollection.countDocuments({
        createdAt: { $gte: todayStart }
      });

      // Get users created this week
      const newThisWeek = await usersCollection.countDocuments({
        createdAt: { $gte: weekStart }
      });

      // Get users created this month
      const newThisMonth = await usersCollection.countDocuments({
        createdAt: { $gte: monthStart }
      });

      // Get active users (users with sessions in last 24 hours)
      const activeUserIds = await sessionsCollection.distinct('userId', {
        expiresAt: { $gt: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
      });
      const activeUsers = activeUserIds.length;

      // Get users by role
      const roleAggregation = await usersCollection.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            role: '$_id',
            count: 1,
            _id: 0
          }
        }
      ]).toArray();

      const byRole = roleAggregation.map(item => ({
        role: item.role || 'user',
        count: item.count
      }));

      // Get recent activity (simplified - in production you'd have an activity log)
      const recentUsers = await usersCollection.find({}, {
        sort: { createdAt: -1 },
        limit: 10,
        projection: { _id: 1, name: 1, createdAt: 1 }
      }).toArray();

      const recentActivity = recentUsers.map(user => ({
        userId: user._id.toString(),
        action: 'User registered',
        timestamp: user.createdAt
      }));

      return {
        total: totalUsers,
        active: activeUsers,
        newToday,
        newThisWeek,
        newThisMonth,
        byRole,
        recentActivity
      };
    } catch (error) {
      console.error('Error getting user statistics:', error);
      return {
        total: 0,
        active: 0,
        newToday: 0,
        newThisWeek: 0,
        newThisMonth: 0,
        byRole: [],
        recentActivity: []
      };
    }
  }

  /**
   * Get active sessions count
   */
  static async getActiveSessions(): Promise<number> {
    try {
      const sessionsCollection = db.collection('session');
      const now = new Date();
      
      return await sessionsCollection.countDocuments({
        expiresAt: { $gt: now }
      });
    } catch (error) {
      console.error('Error getting active sessions:', error);
      return 0;
    }
  }

  /**
   * Get system status overview
   */
  static async getSystemStatus(): Promise<SystemStatus> {
    try {
      const [healthStatus, activeAlerts] = await Promise.all([
        HealthMonitoringService.getSystemHealthStatus(),
        HealthMonitoringService.getActiveAlerts()
      ]);

      return {
        status: healthStatus?.status || 'critical',
        uptime: healthStatus?.uptime || 0,
        lastCheck: healthStatus?.lastCheck || new Date(),
        services: healthStatus?.services || {
          database: 'critical',
          storage: 'critical',
          cache: 'critical',
          email: 'critical'
        },
        alerts: activeAlerts
      };
    } catch (error) {
      console.error('Error getting system status:', error);
      return {
        status: 'critical',
        uptime: 0,
        lastCheck: new Date(),
        services: {
          database: 'critical',
          storage: 'critical',
          cache: 'critical',
          email: 'critical'
        },
        alerts: []
      };
    }
  }

  /**
   * Get collection statistics for database monitoring
   */
  static async getDatabaseStatistics() {
    try {
      return await getCollectionStats();
    } catch (error) {
      console.error('Error getting database statistics:', error);
      return [];
    }
  }

  /**
   * Get real-time metrics for dashboard updates
   */
  static async getRealTimeMetrics(): Promise<{
    timestamp: Date;
    activeUsers: number;
    systemLoad: number;
    responseTime: number;
    errorRate: number;
  }> {
    try {
      const [
        activeUsers,
        latestMetrics
      ] = await Promise.all([
        this.getActiveSessions(),
        HealthMonitoringService.getLatestMetrics()
      ]);

      return {
        timestamp: new Date(),
        activeUsers,
        systemLoad: latestMetrics?.cpu.usage || 0,
        responseTime: latestMetrics?.application.responseTime || 0,
        errorRate: latestMetrics?.application.errorRate || 0
      };
    } catch (error) {
      console.error('Error getting real-time metrics:', error);
      return {
        timestamp: new Date(),
        activeUsers: 0,
        systemLoad: 0,
        responseTime: 0,
        errorRate: 0
      };
    }
  }

  /**
   * Get dashboard quick stats for cards
   */
  static async getQuickStats(): Promise<Array<{
    label: string;
    value: string;
    change: string;
    trend: 'up' | 'down' | 'stable';
    icon: string;
  }>> {
    try {
      const metrics = await this.getDashboardMetrics();
      const systemStatus = await this.getSystemStatus();

      // Calculate trends (simplified - in production you'd compare with historical data)
      const userTrend = metrics.newUsersToday > 0 ? 'up' : 'stable';
      const sessionTrend = metrics.totalSessions > metrics.activeUsers ? 'up' : 'stable';
      const healthTrend = systemStatus.status === 'healthy' ? 'stable' : 'down';
      const alertTrend = metrics.securityAlerts > 0 ? 'up' : 'down';

      return [
        {
          label: 'Total Users',
          value: metrics.totalUsers.toLocaleString(),
          change: `+${metrics.newUsersToday}`,
          trend: userTrend,
          icon: 'Users'
        },
        {
          label: 'Active Sessions',
          value: metrics.totalSessions.toString(),
          change: `${metrics.activeUsers} active`,
          trend: sessionTrend,
          icon: 'Activity'
        },
        {
          label: 'System Health',
          value: systemStatus.status === 'healthy' ? '99.9%' : 
                 systemStatus.status === 'warning' ? '95.0%' : '85.0%',
          change: systemStatus.status,
          trend: healthTrend,
          icon: 'CheckCircle'
        },
        {
          label: 'Security Alerts',
          value: metrics.securityAlerts.toString(),
          change: metrics.securityAlerts > 0 ? `${metrics.securityAlerts} active` : 'None',
          trend: alertTrend,
          icon: 'Shield'
        }
      ];
    } catch (error) {
      console.error('Error getting quick stats:', error);
      return [
        { label: 'Total Users', value: '0', change: '+0', trend: 'stable', icon: 'Users' },
        { label: 'Active Sessions', value: '0', change: '0 active', trend: 'stable', icon: 'Activity' },
        { label: 'System Health', value: '0%', change: 'critical', trend: 'down', icon: 'CheckCircle' },
        { label: 'Security Alerts', value: '0', change: 'None', trend: 'stable', icon: 'Shield' }
      ];
    }
  }

  /**
   * Get system status indicators
   */
  static async getSystemStatusIndicators(): Promise<Array<{
    label: string;
    value: string;
    status: 'success' | 'warning' | 'error';
    icon: string;
  }>> {
    try {
      const [systemStatus, databaseHealth] = await Promise.all([
        this.getSystemStatus(),
        checkDatabaseHealth()
      ]);

      return [
        {
          label: 'System Status',
          value: systemStatus.status === 'healthy' ? 'Active' : 
                 systemStatus.status === 'warning' ? 'Warning' : 'Critical',
          status: systemStatus.status === 'healthy' ? 'success' : 
                  systemStatus.status === 'warning' ? 'warning' : 'error',
          icon: 'CheckCircle'
        },
        {
          label: 'Database',
          value: databaseHealth.status === 'healthy' ? 'Online' : 'Offline',
          status: databaseHealth.status === 'healthy' ? 'success' : 'error',
          icon: 'Database'
        },
        {
          label: 'Authentication',
          value: 'Secure',
          status: 'success',
          icon: 'Shield'
        }
      ];
    } catch (error) {
      console.error('Error getting system status indicators:', error);
      return [
        { label: 'System Status', value: 'Critical', status: 'error', icon: 'CheckCircle' },
        { label: 'Database', value: 'Offline', status: 'error', icon: 'Database' },
        { label: 'Authentication', value: 'Error', status: 'error', icon: 'Shield' }
      ];
    }
  }
}