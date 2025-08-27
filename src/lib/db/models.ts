// Using string IDs for client-server compatibility
// Server-side code can convert these to ObjectId as needed

// ============================================================================
// RBAC Models - Extending Better Auth Admin Plugin
// ============================================================================

/**
 * Enhanced Role model that extends Better Auth's basic role system
 * This works alongside Better Auth's admin plugin for more granular permissions
 */
export interface Role {
    _id: string;
    name: string;
    description: string;
    permissions: string[]; // References to Permission documents
    isSystemRole: boolean; // true for 'admin' and 'user' roles from Better Auth
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Permission model for granular access control
 * Defines specific actions that can be performed on resources
 */
export interface Permission {
    _id: string;
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
    _id: string;
    userId: string; // Reference to Better Auth user
    roleId: string; // Reference to Role document
    assignedBy: string; // Reference to admin who assigned the role
    assignedAt: Date;
    expiresAt?: Date; // Optional role expiration
}

/**
 * Audit Log for tracking RBAC changes and access attempts
 * Essential for security and compliance
 */
export interface AuditLog {
    _id: string;
    userId: string; // Reference to Better Auth user
    action: string; // e.g., 'role_assigned', 'permission_granted', 'access_denied'
    resource: string; // What was accessed/modified
    resourceId?: string; // Specific resource ID if applicable
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
    _id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    author: string; // Reference to Better Auth user
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
    _id: string;
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
    _id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    status: 'new' | 'read' | 'replied' | 'closed';
    submittedAt: Date;
    respondedAt?: Date;
    respondedBy?: string; // Reference to admin who responded
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
    _id: string;
    userId: string; // Reference to Better Auth user
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
    _id: string;
    key: string;
    value: any;
    description: string;
    category: 'general' | 'security' | 'email' | 'seo' | 'features';
    updatedBy: string; // Reference to admin who updated
    updatedAt: Date;
}

/**
 * Email Template for system notifications
 */
export interface EmailTemplate {
    _id: string;
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
// Dynamic Content Management Models
// ============================================================================

/**
 * Content Type Definition - Defines the structure of dynamic content
 */
export interface ContentType {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    fields: ContentField[];
    template?: string;
    isSystemType: boolean; // true for built-in types like 'page', 'post'
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Content Field Definition - Defines individual fields within a content type
 */
export interface ContentField {
    _id: string;
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'richtext' | 'image' | 'video' | 'select' | 'multiselect' | 'boolean' | 'date' | 'number' | 'url' | 'email';
    required: boolean;
    defaultValue?: any;
    validation?: ValidationRule[];
    options?: string[]; // for select/multiselect fields
    helpText?: string;
    placeholder?: string;
    order: number; // for field ordering in forms
}

/**
 * Validation Rule for content fields
 */
export interface ValidationRule {
    type: 'minLength' | 'maxLength' | 'pattern' | 'min' | 'max' | 'required' | 'email' | 'url';
    value: any;
    message: string;
}

/**
 * Content Instance - Actual content data based on a content type
 */
export interface ContentInstance {
    _id: string;
    contentTypeId: string; // Reference to ContentType
    slug: string;
    title: string; // Every content instance has a title
    data: Record<string, any>; // Dynamic field data
    status: 'draft' | 'published' | 'archived' | 'scheduled';
    publishedAt?: Date;
    scheduledAt?: Date;
    author: string; // Reference to Better Auth user
    lastModifiedBy: string; // Reference to Better Auth user
    version: number; // For content versioning
    seo: {
        title?: string;
        description?: string;
        keywords?: string[];
        ogImage?: string;
        noIndex?: boolean;
    };
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Content Version - For tracking content changes
 */
export interface ContentVersion {
    _id: string;
    contentInstanceId: string; // Reference to ContentInstance
    version: number;
    data: Record<string, any>; // Snapshot of content data
    author: string; // Who made this version
    changeNote?: string;
    createdAt: Date;
}

// ============================================================================
// Media Management Models
// ============================================================================

/**
 * Media Folder - Hierarchical organization of media files
 */
export interface MediaFolder {
    _id: string;
    name: string;
    parentId?: string; // Reference to parent MediaFolder
    path: string; // Full path for easy querying
    description?: string;
    createdBy: string; // Reference to Better Auth user
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Media File - Represents uploaded media with variants
 */
export interface MediaFile {
    _id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    width?: number;
    height?: number;
    duration?: number; // for video/audio files
    folderId?: string; // Reference to MediaFolder
    s3Key: string;
    s3Url: string;
    cdnUrl?: string;
    variants: MediaVariant[];
    metadata: MediaMetadata;
    tags: string[];
    altText?: string;
    caption?: string;
    uploadedBy: string; // Reference to Better Auth user
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Media Variant - Different sizes/formats of the same media file
 */
export interface MediaVariant {
    _id: string;
    name: string; // 'thumbnail', 'medium', 'large', 'webp', etc.
    width: number;
    height: number;
    format: string;
    quality?: number;
    s3Key: string;
    s3Url: string;
    cdnUrl?: string;
    size: number;
}

/**
 * Media Metadata - Extended information about media files
 */
export interface MediaMetadata {
    exif?: Record<string, any>; // EXIF data for images
    colorProfile?: string;
    hasTransparency?: boolean;
    averageColor?: string;
    dominantColors?: string[];
    faces?: number; // Number of faces detected
    objects?: string[]; // Detected objects/labels
    text?: string; // OCR extracted text
}

// ============================================================================
// System Health Monitoring Models
// ============================================================================

/**
 * System Metrics - Real-time system performance data
 */
export interface SystemMetrics {
    _id: string;
    timestamp: Date;
    cpu: {
        usage: number; // percentage
        loadAverage: number[];
        cores: number;
    };
    memory: {
        used: number; // bytes
        total: number; // bytes
        percentage: number;
        available: number; // bytes
    };
    disk: {
        used: number; // bytes
        total: number; // bytes
        percentage: number;
        available: number; // bytes
    };
    network: {
        bytesIn: number;
        bytesOut: number;
        packetsIn: number;
        packetsOut: number;
    };
    database: {
        connections: number;
        activeConnections: number;
        queryTime: number; // average ms
        slowQueries: number;
        operationsPerSecond: number;
    };
    application: {
        responseTime: number; // average ms
        errorRate: number; // percentage
        requestsPerMinute: number;
        activeUsers: number;
        uptime: number; // seconds
    };
    createdAt: Date;
}

/**
 * System Alert - Automated alerts based on thresholds
 */
export interface SystemAlert {
    _id: string;
    type: 'info' | 'warning' | 'error' | 'critical';
    category: 'cpu' | 'memory' | 'disk' | 'network' | 'database' | 'application' | 'security';
    title: string;
    message: string;
    metric: string;
    threshold: number;
    currentValue: number;
    severity: 1 | 2 | 3 | 4 | 5; // 1 = low, 5 = critical
    acknowledged: boolean;
    acknowledgedBy?: string; // Reference to Better Auth user
    acknowledgedAt?: Date;
    resolvedAt?: Date;
    createdAt: Date;
}

/**
 * System Health Status - Overall system health summary
 */
export interface SystemHealthStatus {
    _id: string;
    status: 'healthy' | 'warning' | 'critical' | 'maintenance';
    score: number; // 0-100 health score
    uptime: number; // seconds
    lastCheck: Date;
    services: {
        database: 'healthy' | 'warning' | 'critical';
        storage: 'healthy' | 'warning' | 'critical';
        cache: 'healthy' | 'warning' | 'critical';
        email: 'healthy' | 'warning' | 'critical';
    };
    activeAlerts: number;
    criticalAlerts: number;
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
 * Type guard to check if an object is a valid ObjectId string
 */
export function isValidObjectId(id: any): id is string {
    return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Type guard to check if a content instance is published
 */
export function isPublishedContent(content: ContentInstance): boolean {
    return content.status === 'published' && 
           content.publishedAt !== undefined && 
           content.publishedAt <= new Date();
}

/**
 * Type guard to check if a content instance is scheduled
 */
export function isScheduledContent(content: ContentInstance): boolean {
    return content.status === 'scheduled' && 
           content.scheduledAt !== undefined && 
           content.scheduledAt > new Date();
}

/**
 * Type guard to check if a media file is an image
 */
export function isImageFile(mediaFile: MediaFile): boolean {
    return mediaFile.mimeType.startsWith('image/');
}

/**
 * Type guard to check if a media file is a video
 */
export function isVideoFile(mediaFile: MediaFile): boolean {
    return mediaFile.mimeType.startsWith('video/');
}

/**
 * Type guard to check if a media file is an audio file
 */
export function isAudioFile(mediaFile: MediaFile): boolean {
    return mediaFile.mimeType.startsWith('audio/');
}

/**
 * Type guard to check if a system alert is critical
 */
export function isCriticalAlert(alert: SystemAlert): boolean {
    return alert.type === 'critical' || alert.severity >= 4;
}

/**
 * Type guard to check if a system alert is active (not resolved)
 */
export function isActiveAlert(alert: SystemAlert): boolean {
    return alert.resolvedAt === undefined;
}

/**
 * Utility function to get content field by name
 */
export function getContentField(contentType: ContentType, fieldName: string): ContentField | undefined {
    return contentType.fields.find(field => field.name === fieldName);
}

/**
 * Utility function to validate content data against content type
 */
export function validateContentData(contentType: ContentType, data: Record<string, any>): {
    isValid: boolean;
    errors: string[];
} {
    const errors: string[] = [];
    
    // Check required fields
    const requiredFields = contentType.fields.filter(field => field.required);
    for (const field of requiredFields) {
        if (data[field.name] === undefined || data[field.name] === null || data[field.name] === '') {
            errors.push(`Field '${field.label}' is required`);
        }
    }
    
    // Validate field types and constraints
    for (const field of contentType.fields) {
        const value = data[field.name];
        if (value !== undefined && value !== null) {
            const fieldErrors = validateFieldValue(field, value);
            errors.push(...fieldErrors);
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Utility function to validate a single field value
 */
export function validateFieldValue(field: ContentField, value: any): string[] {
    const errors: string[] = [];
    
    // Type-specific validation
    switch (field.type) {
        case 'text':
        case 'textarea':
            if (typeof value !== 'string') {
                errors.push(`Field '${field.label}' must be a string`);
            }
            break;
        case 'number':
            if (typeof value !== 'number' || isNaN(value)) {
                errors.push(`Field '${field.label}' must be a valid number`);
            }
            break;
        case 'boolean':
            if (typeof value !== 'boolean') {
                errors.push(`Field '${field.label}' must be a boolean`);
            }
            break;
        case 'date':
            if (!(value instanceof Date) && !Date.parse(value)) {
                errors.push(`Field '${field.label}' must be a valid date`);
            }
            break;
        case 'email':
            if (typeof value !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                errors.push(`Field '${field.label}' must be a valid email address`);
            }
            break;
        case 'url':
            if (typeof value !== 'string') {
                errors.push(`Field '${field.label}' must be a string`);
            } else {
                try {
                    new URL(value);
                } catch {
                    errors.push(`Field '${field.label}' must be a valid URL`);
                }
            }
            break;
        case 'select':
            if (field.options && !field.options.includes(value)) {
                errors.push(`Field '${field.label}' must be one of: ${field.options.join(', ')}`);
            }
            break;
        case 'multiselect':
            if (!Array.isArray(value)) {
                errors.push(`Field '${field.label}' must be an array`);
            } else if (field.options) {
                const invalidOptions = value.filter(v => !field.options!.includes(v));
                if (invalidOptions.length > 0) {
                    errors.push(`Field '${field.label}' contains invalid options: ${invalidOptions.join(', ')}`);
                }
            }
            break;
    }
    
    // Custom validation rules
    if (field.validation) {
        for (const rule of field.validation) {
            const ruleError = validateRule(field, value, rule);
            if (ruleError) {
                errors.push(ruleError);
            }
        }
    }
    
    return errors;
}

/**
 * Utility function to validate a single validation rule
 */
export function validateRule(field: ContentField, value: any, rule: ValidationRule): string | null {
    switch (rule.type) {
        case 'minLength':
            if (typeof value === 'string' && value.length < rule.value) {
                return rule.message || `Field '${field.label}' must be at least ${rule.value} characters`;
            }
            break;
        case 'maxLength':
            if (typeof value === 'string' && value.length > rule.value) {
                return rule.message || `Field '${field.label}' must be no more than ${rule.value} characters`;
            }
            break;
        case 'min':
            if (typeof value === 'number' && value < rule.value) {
                return rule.message || `Field '${field.label}' must be at least ${rule.value}`;
            }
            break;
        case 'max':
            if (typeof value === 'number' && value > rule.value) {
                return rule.message || `Field '${field.label}' must be no more than ${rule.value}`;
            }
            break;
        case 'pattern':
            if (typeof value === 'string' && !new RegExp(rule.value).test(value)) {
                return rule.message || `Field '${field.label}' format is invalid`;
            }
            break;
        case 'required':
            if (value === undefined || value === null || value === '') {
                return rule.message || `Field '${field.label}' is required`;
            }
            break;
        case 'email':
            if (typeof value === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                return rule.message || `Field '${field.label}' must be a valid email address`;
            }
            break;
        case 'url':
            if (typeof value === 'string') {
                try {
                    new URL(value);
                } catch {
                    return rule.message || `Field '${field.label}' must be a valid URL`;
                }
            }
            break;
    }
    return null;
}

/**
 * Utility function to get media file URL with fallback
 */
export function getMediaUrl(mediaFile: MediaFile, variant?: string): string {
    if (variant) {
        const mediaVariant = mediaFile.variants.find(v => v.name === variant);
        if (mediaVariant) {
            return mediaVariant.cdnUrl || mediaVariant.s3Url;
        }
    }
    return mediaFile.cdnUrl || mediaFile.s3Url;
}

/**
 * Utility function to format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    
    return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

/**
 * Utility function to calculate system health score
 */
export function calculateHealthScore(metrics: SystemMetrics): number {
    const weights = {
        cpu: 0.2,
        memory: 0.25,
        disk: 0.2,
        database: 0.2,
        application: 0.15
    };
    
    // Calculate individual scores (higher is better)
    const cpuScore = Math.max(0, 100 - metrics.cpu.usage);
    const memoryScore = Math.max(0, 100 - metrics.memory.percentage);
    const diskScore = Math.max(0, 100 - metrics.disk.percentage);
    const databaseScore = Math.max(0, 100 - Math.min(100, metrics.database.queryTime / 10)); // Assume 1000ms is 0 score
    const applicationScore = Math.max(0, 100 - metrics.application.errorRate);
    
    const totalScore = 
        cpuScore * weights.cpu +
        memoryScore * weights.memory +
        diskScore * weights.disk +
        databaseScore * weights.database +
        applicationScore * weights.application;
    
    return Math.round(totalScore);
}

/**
 * Utility function to determine system status based on health score
 */
export function getSystemStatus(healthScore: number, criticalAlerts: number): SystemHealthStatus['status'] {
    if (criticalAlerts > 0) {
        return 'critical';
    }
    
    if (healthScore >= 80) {
        return 'healthy';
    } else if (healthScore >= 60) {
        return 'warning';
    } else {
        return 'critical';
    }
}

/**
 * Utility function to generate content slug from title
 */
export function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Utility function to build folder path
 */
export function buildFolderPath(folder: MediaFolder, allFolders: MediaFolder[]): string {
    const pathParts: string[] = [folder.name];
    let currentFolder = folder;
    
    while (currentFolder.parentId) {
        const parentFolder = allFolders.find(f => f._id.toString() === currentFolder.parentId?.toString());
        if (!parentFolder) break;
        
        pathParts.unshift(parentFolder.name);
        currentFolder = parentFolder;
    }
    
    return '/' + pathParts.join('/');
}

/**
 * Default system roles that integrate with Better Auth admin plugin
 */
export const SYSTEM_ROLES = {
    ADMIN: 'admin', // Maps to Better Auth admin role
    USER: 'user',   // Maps to Better Auth user role
    MODERATOR: 'moderator',
    EDITOR: 'editor',
    CONTENT_MANAGER: 'content_manager',
    SYSTEM_MONITOR: 'system_monitor'
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

    // Content management - Enhanced with granular permissions
    CONTENT_CREATE: { resource: 'content', action: 'create' as const },
    CONTENT_READ: { resource: 'content', action: 'read' as const },
    CONTENT_UPDATE: { resource: 'content', action: 'update' as const },
    CONTENT_DELETE: { resource: 'content', action: 'delete' as const },
    CONTENT_MANAGE: { resource: 'content', action: 'manage' as const },
    
    // Content Types management
    CONTENT_TYPE_CREATE: { resource: 'content_type', action: 'create' as const },
    CONTENT_TYPE_READ: { resource: 'content_type', action: 'read' as const },
    CONTENT_TYPE_UPDATE: { resource: 'content_type', action: 'update' as const },
    CONTENT_TYPE_DELETE: { resource: 'content_type', action: 'delete' as const },
    CONTENT_TYPE_MANAGE: { resource: 'content_type', action: 'manage' as const },

    // Content Publishing permissions
    CONTENT_PUBLISH: { resource: 'content', action: 'publish' as const },
    CONTENT_UNPUBLISH: { resource: 'content', action: 'unpublish' as const },
    CONTENT_SCHEDULE: { resource: 'content', action: 'schedule' as const },

    // Media management - Enhanced with granular permissions
    MEDIA_CREATE: { resource: 'media', action: 'create' as const },
    MEDIA_READ: { resource: 'media', action: 'read' as const },
    MEDIA_UPDATE: { resource: 'media', action: 'update' as const },
    MEDIA_DELETE: { resource: 'media', action: 'delete' as const },
    MEDIA_MANAGE: { resource: 'media', action: 'manage' as const },
    
    // Media Upload permissions
    MEDIA_UPLOAD: { resource: 'media', action: 'upload' as const },
    MEDIA_ORGANIZE: { resource: 'media', action: 'organize' as const },
    
    // Media Folder management
    MEDIA_FOLDER_CREATE: { resource: 'media_folder', action: 'create' as const },
    MEDIA_FOLDER_READ: { resource: 'media_folder', action: 'read' as const },
    MEDIA_FOLDER_UPDATE: { resource: 'media_folder', action: 'update' as const },
    MEDIA_FOLDER_DELETE: { resource: 'media_folder', action: 'delete' as const },
    MEDIA_FOLDER_MANAGE: { resource: 'media_folder', action: 'manage' as const },

    // System management - Enhanced with monitoring permissions
    SYSTEM_READ: { resource: 'system', action: 'read' as const },
    SYSTEM_UPDATE: { resource: 'system', action: 'update' as const },
    SYSTEM_MANAGE: { resource: 'system', action: 'manage' as const },
    
    // System Health Monitoring
    SYSTEM_MONITOR: { resource: 'system', action: 'monitor' as const },
    SYSTEM_ALERTS: { resource: 'system', action: 'alerts' as const },
    SYSTEM_LOGS: { resource: 'system', action: 'logs' as const },
    
    // Audit Log access
    AUDIT_READ: { resource: 'audit', action: 'read' as const },
    AUDIT_MANAGE: { resource: 'audit', action: 'manage' as const }
} as const;

/**
 * Content field types with their display names
 */
export const CONTENT_FIELD_TYPES = {
    text: 'Text',
    textarea: 'Textarea',
    richtext: 'Rich Text',
    image: 'Image',
    video: 'Video',
    select: 'Select',
    multiselect: 'Multi-select',
    boolean: 'Boolean',
    date: 'Date',
    number: 'Number',
    url: 'URL',
    email: 'Email'
} as const;

/**
 * Content statuses with their display names
 */
export const CONTENT_STATUSES = {
    draft: 'Draft',
    published: 'Published',
    archived: 'Archived',
    scheduled: 'Scheduled'
} as const;

/**
 * Media file types and their allowed extensions
 */
export const MEDIA_TYPES = {
    image: {
        mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
        extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
        maxSize: 10 * 1024 * 1024 // 10MB
    },
    video: {
        mimeTypes: ['video/mp4', 'video/webm', 'video/ogg'],
        extensions: ['.mp4', '.webm', '.ogg'],
        maxSize: 100 * 1024 * 1024 // 100MB
    },
    audio: {
        mimeTypes: ['audio/mp3', 'audio/wav', 'audio/ogg'],
        extensions: ['.mp3', '.wav', '.ogg'],
        maxSize: 50 * 1024 * 1024 // 50MB
    },
    document: {
        mimeTypes: ['application/pdf'],
        extensions: ['.pdf'],
        maxSize: 25 * 1024 * 1024 // 25MB
    }
} as const;

/**
 * System alert types with their display names and colors
 */
export const ALERT_TYPES = {
    info: { label: 'Info', color: 'blue' },
    warning: { label: 'Warning', color: 'yellow' },
    error: { label: 'Error', color: 'orange' },
    critical: { label: 'Critical', color: 'red' }
} as const;

/**
 * System alert categories with their display names
 */
export const ALERT_CATEGORIES = {
    cpu: 'CPU',
    memory: 'Memory',
    disk: 'Disk',
    network: 'Network',
    database: 'Database',
    application: 'Application',
    security: 'Security'
} as const;

/**
 * System health thresholds
 */
export const HEALTH_THRESHOLDS = {
    cpu: {
        warning: 70,
        critical: 90
    },
    memory: {
        warning: 80,
        critical: 95
    },
    disk: {
        warning: 85,
        critical: 95
    },
    responseTime: {
        warning: 1000, // ms
        critical: 3000 // ms
    },
    errorRate: {
        warning: 5, // %
        critical: 10 // %
    }
} as const;

/**
 * Default image variants to generate
 */
export const DEFAULT_IMAGE_VARIANTS = [
    { name: 'thumbnail', width: 150, height: 150, quality: 80 },
    { name: 'small', width: 400, height: 300, quality: 85 },
    { name: 'medium', width: 800, height: 600, quality: 90 },
    { name: 'large', width: 1200, height: 900, quality: 90 },
    { name: 'xlarge', width: 1920, height: 1080, quality: 95 }
] as const;