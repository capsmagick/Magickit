import { createIndexes } from './collections';
import { RBACService } from './rbac';
import { initializeDynamicContentSystem, verifyDynamicContentSetup } from './init-dynamic-content';
import { userProfilesCollection } from './collections/userProfiles';
import { auditLogsCollection } from './collections/auditLogs';

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
    
    // Initialize dynamic content management system
    await initializeDynamicContentSystem();
    console.log('✓ Dynamic content management system initialized');
    
    // Initialize user management collections
    await Promise.all([
      userProfilesCollection,
      auditLogsCollection
    ]);
    console.log('✓ User management collections initialized');
    
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
    const { verifyDynamicContentSetup } = await import('./init-dynamic-content');
    
    // Check database connection
    const healthStatus = await checkDatabaseHealth();
    
    // Get collection statistics
    const stats = await getCollectionStats();
    
    // Verify dynamic content setup
    const dynamicContentStatus = await verifyDynamicContentSetup();
    
    return {
      database: healthStatus,
      collections: stats,
      dynamicContent: dynamicContentStatus,
      timestamp: new Date()
    };
  } catch (error) {
    return {
      database: { status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error' },
      collections: [],
      dynamicContent: [],
      timestamp: new Date()
    };
  }
}