import { createIndexes } from './collections';
import { RBACService } from './rbac';

/**
 * Initialize the database with indexes and default data
 * This should be run when the application starts
 */
export async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    
    // Create database indexes for performance
    await createIndexes();
    console.log('✓ Database indexes created');
    
    // Initialize RBAC system with default roles and permissions
    await RBACService.initializeRBAC();
    console.log('✓ RBAC system initialized');
    
    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

/**
 * Health check for the entire database system
 */
export async function performHealthCheck() {
  try {
    const { checkDatabaseHealth, getCollectionStats } = await import('./collections');
    
    // Check database connection
    const healthStatus = await checkDatabaseHealth();
    
    // Get collection statistics
    const stats = await getCollectionStats();
    
    return {
      database: healthStatus,
      collections: stats,
      timestamp: new Date()
    };
  } catch (error) {
    return {
      database: { status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error' },
      collections: [],
      timestamp: new Date()
    };
  }
}