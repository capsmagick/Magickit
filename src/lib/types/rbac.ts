import type { ObjectId } from 'mongodb';

// ============================================================================
// RBAC Type Definitions
// ============================================================================

/**
 * Permission action types
 */
export type PermissionAction = 
  | 'create' 
  | 'read' 
  | 'update' 
  | 'delete' 
  | 'manage'
  | 'publish'
  | 'unpublish'
  | 'schedule'
  | 'upload'
  | 'organize'
  | 'monitor'
  | 'alerts'
  | 'logs';

/**
 * System resource types
 */
export type SystemResource = 
  | 'user' 
  | 'role' 
  | 'permission' 
  | 'content' 
  | 'content_type'
  | 'media'
  | 'media_folder'
  | 'system' 
  | 'audit'
  | 'blog'
  | 'portfolio'
  | 'contact';

/**
 * Permission definition
 */
export interface PermissionDefinition {
  resource: SystemResource;
  action: PermissionAction;
  description?: string;
}

/**
 * Role definition with permissions
 */
export interface RoleDefinition {
  name: string;
  description: string;
  permissions: PermissionDefinition[];
  isSystemRole?: boolean;
}

/**
 * User permission check result
 */
export interface PermissionCheckResult {
  hasPermission: boolean;
  reason?: string;
  grantedBy?: string; // Role name that granted the permission
}

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  id: string;
  userId: string;
  userName?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  success: boolean;
}

/**
 * Role assignment with metadata
 */
export interface RoleAssignment {
  id: string;
  userId: string;
  roleId: string;
  roleName: string;
  assignedBy: string;
  assignedByName?: string;
  assignedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}

/**
 * User with roles and permissions
 */
export interface UserWithRoles {
  id: string;
  name: string;
  email: string;
  role: string; // Better Auth role (admin/user)
  roles: RoleAssignment[]; // Additional RBAC roles
  permissions: PermissionDefinition[];
  isAdmin: boolean;
  isBanned: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
}

/**
 * Role with permissions populated
 */
export interface RoleWithPermissions {
  id: string;
  name: string;
  description: string;
  permissions: PermissionDefinition[];
  isSystemRole: boolean;
  userCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Permission with usage statistics
 */
export interface PermissionWithStats {
  id: string;
  name: string;
  resource: SystemResource;
  action: PermissionAction;
  description: string;
  roleCount: number; // Number of roles that have this permission
  userCount: number; // Number of users that have this permission (through roles)
  createdAt: Date;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Permission check request
 */
export interface PermissionCheckRequest {
  userId: string;
  resource: SystemResource;
  action: PermissionAction;
}

/**
 * Permission check response
 */
export interface PermissionCheckResponse {
  hasPermission: boolean;
  reason?: string;
}

/**
 * Role assignment request
 */
export interface RoleAssignmentRequest {
  userId: string;
  roleId: string;
  assignedBy: string;
  expiresAt?: string; // ISO date string
}

/**
 * Role assignment response
 */
export interface RoleAssignmentResponse {
  success: boolean;
  message?: string;
}

/**
 * Audit log request
 */
export interface AuditLogRequest {
  filters?: {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: string; // ISO date string
    endDate?: string; // ISO date string
    success?: boolean;
  };
  limit?: number;
  skip?: number;
  requesterId: string;
}

/**
 * Audit log response
 */
export interface AuditLogResponse {
  auditLogs: AuditLogEntry[];
  total: number;
  hasMore: boolean;
}

/**
 * Role creation request
 */
export interface RoleCreationRequest {
  name: string;
  description: string;
  permissionIds: string[];
  createdBy: string;
}

/**
 * Role creation response
 */
export interface RoleCreationResponse {
  success: boolean;
  roleId?: string;
  message?: string;
}

/**
 * Role update request
 */
export interface RoleUpdateRequest {
  roleId: string;
  updates: {
    name?: string;
    description?: string;
    permissions?: string[];
  };
  updatedBy: string;
}

/**
 * Role update response
 */
export interface RoleUpdateResponse {
  success: boolean;
  message?: string;
}

// ============================================================================
// Frontend Component Props
// ============================================================================

/**
 * Permission Guard component props
 */
export interface PermissionGuardProps {
  resource: SystemResource;
  action: PermissionAction;
  fallback?: any;
  loading?: any;
  children: any;
}

/**
 * Role Badge component props
 */
export interface RoleBadgeProps {
  role: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  size?: 'sm' | 'default' | 'lg';
}

/**
 * Permission Badge component props
 */
export interface PermissionBadgeProps {
  permission: PermissionDefinition;
  showResource?: boolean;
  variant?: 'default' | 'secondary' | 'outline';
}

// ============================================================================
// Store Types
// ============================================================================

/**
 * RBAC store state
 */
export interface RBACStoreState {
  permissions: PermissionDefinition[];
  roles: RoleWithPermissions[];
  userRoles: RoleAssignment[];
  loading: boolean;
  error: string | null;
}

/**
 * User permissions store state
 */
export interface UserPermissionsState {
  permissions: PermissionDefinition[];
  roles: string[];
  isAdmin: boolean;
  loading: boolean;
  lastUpdated: Date | null;
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * RBAC configuration options
 */
export interface RBACConfig {
  enableAuditLogging: boolean;
  auditLogRetentionDays: number;
  defaultUserRole: string;
  adminRoles: string[];
  permissionCacheTimeout: number; // in milliseconds
  enablePermissionCaching: boolean;
}

/**
 * Default RBAC configuration
 */
export const DEFAULT_RBAC_CONFIG: RBACConfig = {
  enableAuditLogging: true,
  auditLogRetentionDays: 90,
  defaultUserRole: 'user',
  adminRoles: ['admin'],
  permissionCacheTimeout: 5 * 60 * 1000, // 5 minutes
  enablePermissionCaching: true
};

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Extract permission names from a role
 */
export type ExtractPermissions<T extends RoleDefinition> = T['permissions'][number]['resource'];

/**
 * Create a permission string type
 */
export type PermissionString = `${SystemResource}:${PermissionAction}`;

/**
 * Permission matrix type for role definitions
 */
export type PermissionMatrix = Record<SystemResource, PermissionAction[]>;

/**
 * Type guard for checking if a value is a valid permission action
 */
export function isValidPermissionAction(action: string): action is PermissionAction {
  return [
    'create', 'read', 'update', 'delete', 'manage',
    'publish', 'unpublish', 'schedule', 'upload', 'organize',
    'monitor', 'alerts', 'logs'
  ].includes(action);
}

/**
 * Type guard for checking if a value is a valid system resource
 */
export function isValidSystemResource(resource: string): resource is SystemResource {
  return [
    'user', 'role', 'permission', 'content', 'content_type',
    'media', 'media_folder', 'system', 'audit', 'blog', 
    'portfolio', 'contact'
  ].includes(resource);
}