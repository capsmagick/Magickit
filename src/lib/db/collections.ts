import db from './dbClient';
import type {
  Role,
  Permission,
  UserRole,
  AuditLog,
  BlogPost,
  PortfolioItem,
  ContactSubmission,
  UserProfile,
  SystemSettings,
  EmailTemplate
} from './models';

// ============================================================================
// MongoDB Collections
// ============================================================================

/**
 * RBAC Collections - Extending Better Auth's user management
 */
export const rolesCollection = db.collection<Role>('roles');
export const permissionsCollection = db.collection<Permission>('permissions');
export const userRolesCollection = db.collection<UserRole>('userRoles');
export const auditLogsCollection = db.collection<AuditLog>('auditLogs');

/**
 * Content Collections
 */
export const blogPostsCollection = db.collection<BlogPost>('blogPosts');
export const portfolioItemsCollection = db.collection<PortfolioItem>('portfolioItems');
export const contactSubmissionsCollection = db.collection<ContactSubmission>('contactSubmissions');

/**
 * User Profile Collections (extends Better Auth users)
 */
export const userProfilesCollection = db.collection<UserProfile>('userProfiles');

/**
 * System Collections
 */
export const systemSettingsCollection = db.collection<SystemSettings>('systemSettings');
export const emailTemplatesCollection = db.collection<EmailTemplate>('emailTemplates');

// ============================================================================
// Collection Indexes for Performance
// ============================================================================

/**
 * Create database indexes for optimal performance
 * This should be run during application initialization
 */
export async function createIndexes() {
  try {
    // RBAC Indexes
    await rolesCollection.createIndex({ name: 1 }, { unique: true });
    await rolesCollection.createIndex({ isSystemRole: 1 });
    
    await permissionsCollection.createIndex({ resource: 1, action: 1 }, { unique: true });
    await permissionsCollection.createIndex({ resource: 1 });
    
    await userRolesCollection.createIndex({ userId: 1 });
    await userRolesCollection.createIndex({ roleId: 1 });
    await userRolesCollection.createIndex({ userId: 1, roleId: 1 }, { unique: true });
    await userRolesCollection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    
    await auditLogsCollection.createIndex({ userId: 1 });
    await auditLogsCollection.createIndex({ timestamp: -1 });
    await auditLogsCollection.createIndex({ action: 1 });
    await auditLogsCollection.createIndex({ resource: 1 });
    
    // Content Indexes
    await blogPostsCollection.createIndex({ slug: 1 }, { unique: true });
    await blogPostsCollection.createIndex({ status: 1 });
    await blogPostsCollection.createIndex({ publishedAt: -1 });
    await blogPostsCollection.createIndex({ author: 1 });
    await blogPostsCollection.createIndex({ tags: 1 });
    
    await portfolioItemsCollection.createIndex({ featured: 1 });
    await portfolioItemsCollection.createIndex({ category: 1 });
    await portfolioItemsCollection.createIndex({ createdAt: -1 });
    
    await contactSubmissionsCollection.createIndex({ status: 1 });
    await contactSubmissionsCollection.createIndex({ submittedAt: -1 });
    await contactSubmissionsCollection.createIndex({ email: 1 });
    
    // User Profile Indexes
    await userProfilesCollection.createIndex({ userId: 1 }, { unique: true });
    
    // System Indexes
    await systemSettingsCollection.createIndex({ key: 1 }, { unique: true });
    await systemSettingsCollection.createIndex({ category: 1 });
    
    await emailTemplatesCollection.createIndex({ name: 1 }, { unique: true });
    await emailTemplatesCollection.createIndex({ category: 1 });
    await emailTemplatesCollection.createIndex({ isActive: 1 });

    // Security collections indexes
    await db.collection('ipAccessRules').createIndexes([
      { key: { ip: 1 }, unique: true },
      { key: { type: 1 } },
      { key: { status: 1 } },
      { key: { createdAt: -1 } }
    ]);

    await db.collection('accessAttempts').createIndexes([
      { key: { ip: 1 } },
      { key: { timestamp: -1 } },
      { key: { action: 1 } }
    ]);

    await db.collection('whitelistIPs').createIndexes([
      { key: { ip: 1 }, unique: true },
      { key: { createdAt: -1 } }
    ]);

    await db.collection('blockedIPs').createIndexes([
      { key: { ip: 1 } },
      { key: { status: 1 } },
      { key: { blockedAt: -1 } },
      { key: { expiresAt: 1 } }
    ]);

    await db.collection('loginAttempts').createIndexes([
      { key: { ip: 1 } },
      { key: { timestamp: -1 } },
      { key: { success: 1 } }
    ]);

    await db.collection('bruteForceSettings').createIndex({ _id: 1 });
    
    console.log('Database indexes created successfully');
  } catch (error) {
    console.error('Error creating database indexes:', error);
    throw error;
  }
}

// ============================================================================
// Collection Utilities
// ============================================================================

/**
 * Get collection statistics for monitoring
 */
export async function getCollectionStats() {
  const collections = [
    { name: 'roles', collection: rolesCollection },
    { name: 'permissions', collection: permissionsCollection },
    { name: 'userRoles', collection: userRolesCollection },
    { name: 'auditLogs', collection: auditLogsCollection },
    { name: 'blogPosts', collection: blogPostsCollection },
    { name: 'portfolioItems', collection: portfolioItemsCollection },
    { name: 'contactSubmissions', collection: contactSubmissionsCollection },
    { name: 'userProfiles', collection: userProfilesCollection },
    { name: 'systemSettings', collection: systemSettingsCollection },
    { name: 'emailTemplates', collection: emailTemplatesCollection }
  ];

  const stats = await Promise.all(
    collections.map(async ({ name, collection }) => {
      const count = await collection.countDocuments();
      return { name, count };
    })
  );

  return stats;
}

/**
 * Health check for database connection
 */
export async function checkDatabaseHealth() {
  try {
    await db.admin().ping();
    return { status: 'healthy', timestamp: new Date() };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date() 
    };
  }
}