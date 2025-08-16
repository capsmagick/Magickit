import { ObjectId } from 'mongodb';

// ============================================================================
// RBAC Models - Extending Better Auth Admin Plugin
// ============================================================================

/**
 * Enhanced Role model that extends Better Auth's basic role system
 * This works alongside Better Auth's admin plugin for more granular permissions
 */
export interface Role {
    _id: ObjectId;
    name: string;
    description: string;
    permissions: ObjectId[]; // References to Permission documents
    isSystemRole: boolean; // true for 'admin' and 'user' roles from Better Auth
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Permission model for granular access control
 * Defines specific actions that can be performed on resources
 */
export interface Permission {
    _id: ObjectId;
    name: string;
    resource: string; // e.g., 'user', 'role', 'content', 'system'
    action: 'create' | 'read' | 'update' | 'delete' | 'manage'; // CRUD + manage
    description: string;
    createdAt: Date;
}

/**
 * User Role Assignment - Links users to multiple roles
 * Extends Better Auth's single role system to support multiple roles
 */
export interface UserRole {
    _id: ObjectId;
    userId: ObjectId; // Reference to Better Auth user
    roleId: ObjectId; // Reference to Role document
    assignedBy: ObjectId; // Reference to admin who assigned the role
    assignedAt: Date;
    expiresAt?: Date; // Optional role expiration
}

/**
 * Audit Log for tracking RBAC changes and access attempts
 * Essential for security and compliance
 */
export interface AuditLog {
    _id: ObjectId;
    userId: ObjectId; // Reference to Better Auth user
    action: string; // e.g., 'role_assigned', 'permission_granted', 'access_denied'
    resource: string; // What was accessed/modified
    resourceId?: ObjectId; // Specific resource ID if applicable
    details: Record<string, any>; // Additional context
    ipAddress: string;
    userAgent: string;
    timestamp: Date;
    success: boolean; // Whether the action was successful
}

// ============================================================================
// Content Models
// ============================================================================

/**
 * Blog Post model for content management
 */
export interface BlogPost {
    _id: ObjectId;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    author: ObjectId; // Reference to Better Auth user
    publishedAt?: Date;
    updatedAt: Date;
    createdAt: Date;
    tags: string[];
    featured: boolean;
    status: 'draft' | 'published' | 'archived';
    seoTitle?: string;
    seoDescription?: string;
}

/**
 * Portfolio Item model for showcasing work
 */
export interface PortfolioItem {
    _id: ObjectId;
    title: string;
    description: string;
    images: string[];
    technologies: string[];
    liveUrl?: string;
    githubUrl?: string;
    featured: boolean;
    category: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Contact Submission model for handling contact form submissions
 */
export interface ContactSubmission {
    _id: ObjectId;
    name: string;
    email: string;
    subject: string;
    message: string;
    status: 'new' | 'read' | 'replied' | 'closed';
    submittedAt: Date;
    respondedAt?: Date;
    respondedBy?: ObjectId; // Reference to admin who responded
    ipAddress: string;
    userAgent: string;
}

// ============================================================================
// User Profile Extensions
// ============================================================================

/**
 * Extended User Profile that complements Better Auth's user model
 * Better Auth handles authentication, this handles additional profile data
 */
export interface UserProfile {
    _id: ObjectId;
    userId: ObjectId; // Reference to Better Auth user
    bio?: string;
    location?: string;
    website?: string;
    socialLinks?: {
        twitter?: string;
        linkedin?: string;
        github?: string;
    };
    preferences: {
        theme: 'light' | 'dark' | 'system';
        notifications: {
            email: boolean;
            push: boolean;
            marketing: boolean;
        };
    };
    createdAt: Date;
    updatedAt: Date;
}

// ============================================================================
// System Models
// ============================================================================

/**
 * System Settings for application configuration
 */
export interface SystemSettings {
    _id: ObjectId;
    key: string;
    value: any;
    description: string;
    category: 'general' | 'security' | 'email' | 'seo' | 'features';
    updatedBy: ObjectId; // Reference to admin who updated
    updatedAt: Date;
}

/**
 * Email Template for system notifications
 */
export interface EmailTemplate {
    _id: ObjectId;
    name: string;
    subject: string;
    htmlContent: string;
    textContent: string;
    variables: string[]; // Available template variables
    category: 'auth' | 'notification' | 'marketing' | 'system';
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// ============================================================================
// Type Guards and Utilities
// ============================================================================

/**
 * Type guard to check if a user has a specific role
 */
export function hasRole(userRoles: UserRole[], roleName: string): boolean {
    return userRoles.some(ur => ur.roleId.toString() === roleName);
}

/**
 * Type guard to check if a role has a specific permission
 */
export function hasPermission(
    role: Role,
    permissions: Permission[],
    resource: string,
    action: string
): boolean {
    const rolePermissions = permissions.filter(p =>
        role.permissions.some(rp => rp.toString() === p._id.toString())
    );

    return rolePermissions.some(p =>
        p.resource === resource && (p.action === action || p.action === 'manage')
    );
}

/**
 * Default system roles that integrate with Better Auth admin plugin
 */
export const SYSTEM_ROLES = {
    ADMIN: 'admin', // Maps to Better Auth admin role
    USER: 'user',   // Maps to Better Auth user role
    MODERATOR: 'moderator',
    EDITOR: 'editor'
} as const;

/**
 * Default system permissions
 */
export const SYSTEM_PERMISSIONS = {
    // User management
    USER_CREATE: { resource: 'user', action: 'create' as const },
    USER_READ: { resource: 'user', action: 'read' as const },
    USER_UPDATE: { resource: 'user', action: 'update' as const },
    USER_DELETE: { resource: 'user', action: 'delete' as const },
    USER_MANAGE: { resource: 'user', action: 'manage' as const },

    // Role management
    ROLE_CREATE: { resource: 'role', action: 'create' as const },
    ROLE_READ: { resource: 'role', action: 'read' as const },
    ROLE_UPDATE: { resource: 'role', action: 'update' as const },
    ROLE_DELETE: { resource: 'role', action: 'delete' as const },
    ROLE_MANAGE: { resource: 'role', action: 'manage' as const },

    // Content management
    CONTENT_CREATE: { resource: 'content', action: 'create' as const },
    CONTENT_READ: { resource: 'content', action: 'read' as const },
    CONTENT_UPDATE: { resource: 'content', action: 'update' as const },
    CONTENT_DELETE: { resource: 'content', action: 'delete' as const },
    CONTENT_MANAGE: { resource: 'content', action: 'manage' as const },

    // System management
    SYSTEM_READ: { resource: 'system', action: 'read' as const },
    SYSTEM_UPDATE: { resource: 'system', action: 'update' as const },
    SYSTEM_MANAGE: { resource: 'system', action: 'manage' as const }
} as const;