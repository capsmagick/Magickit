import { ObjectId } from 'mongodb';
import type { ContentInstance } from '../models';

// ============================================================================
// Component-Specific Models
// ============================================================================

/**
 * Component Usage Tracking - Track where components are used
 */
export interface ComponentUsage {
    _id: ObjectId;
    componentId: ObjectId; // Reference to ContentInstance (component)
    usedInId: ObjectId; // Reference to ContentInstance (page/content using the component)
    usedInType: 'page' | 'component' | 'template'; // What type of content uses this component
    usedInTitle: string; // Title of the content using this component
    usedInSlug: string; // Slug of the content using this component
    fieldName?: string; // Which field contains the component reference
    position?: number; // Position within a list/array field
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Component Version - Enhanced versioning for components
 */
export interface ComponentVersion {
    _id: ObjectId;
    componentId: ObjectId; // Reference to ContentInstance (component)
    version: number;
    data: Record<string, any>; // Snapshot of component data
    author: ObjectId; // Who made this version
    changeNote?: string;
    changeType: 'major' | 'minor' | 'patch'; // Semantic versioning
    isBreakingChange: boolean; // Whether this version breaks compatibility
    migrationNotes?: string; // Notes for migrating from previous version
    createdAt: Date;
}

/**
 * Component Category - Categorization system for components
 */
export interface ComponentCategory {
    _id: ObjectId;
    name: string;
    slug: string;
    description?: string;
    icon?: string; // Icon name or URL
    color?: string; // Hex color for UI
    parentId?: ObjectId; // Reference to parent category for hierarchy
    order: number; // Display order
    isSystemCategory: boolean; // Built-in categories
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Component Preview - Store preview data for components
 */
export interface ComponentPreview {
    _id: ObjectId;
    componentId: ObjectId; // Reference to ContentInstance (component)
    previewType: 'screenshot' | 'html' | 'json'; // Type of preview
    previewData: string; // Base64 image, HTML string, or JSON string
    viewport: {
        width: number;
        height: number;
        device?: string; // 'desktop', 'tablet', 'mobile'
    };
    generatedAt: Date;
    isActive: boolean; // Whether this preview is current
}

/**
 * Enhanced Component Interface - Extends ContentInstance with component-specific fields
 */
export interface Component extends ContentInstance {
    // Component-specific metadata
    componentMetadata: {
        category: string; // Component category slug
        subcategory?: string; // Optional subcategory
        tags: string[]; // Component tags for filtering
        difficulty: 'beginner' | 'intermediate' | 'advanced'; // Implementation difficulty
        compatibility: string[]; // Compatible frameworks/versions
        dependencies: string[]; // Required dependencies
        
        // Usage information
        usageCount: number; // How many times this component is used
        lastUsed?: Date; // When was this component last used
        
        // Preview information
        hasPreview: boolean; // Whether preview is available
        previewUrl?: string; // URL to preview image
        
        // Documentation
        documentation?: string; // Markdown documentation
        examples?: ComponentExample[]; // Usage examples
        
        // Versioning
        isBreakingChange: boolean; // Whether latest version is breaking
        migrationGuide?: string; // Migration guide for breaking changes
        
        // Quality metrics
        rating?: number; // Average user rating (1-5)
        downloads: number; // Number of times downloaded/used
        
        // Maintenance
        maintainer: ObjectId; // Primary maintainer
        lastReviewed?: Date; // Last code review date
        reviewStatus: 'pending' | 'approved' | 'needs_work'; // Review status
    };
}

/**
 * Component Example - Usage examples for components
 */
export interface ComponentExample {
    _id: ObjectId;
    title: string;
    description: string;
    code: string; // Example code/configuration
    language: 'html' | 'svelte' | 'json' | 'markdown'; // Code language
    isDefault: boolean; // Whether this is the default example
    order: number; // Display order
}

/**
 * Component Template - Reusable templates for creating components
 */
export interface ComponentTemplate {
    _id: ObjectId;
    name: string;
    description: string;
    category: string;
    contentTypeId: ObjectId; // Base content type for this template
    defaultData: Record<string, any>; // Default field values
    requiredFields: string[]; // Fields that must be customized
    instructions: string; // Setup instructions
    isSystemTemplate: boolean; // Built-in template
    createdBy: ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

// ============================================================================
// Component Constants
// ============================================================================

/**
 * Default component categories
 */
export const DEFAULT_COMPONENT_CATEGORIES = [
    {
        name: 'Layout',
        slug: 'layout',
        description: 'Structural components for page layout',
        icon: 'layout',
        color: '#3b82f6',
        order: 1,
        isSystemCategory: true
    },
    {
        name: 'Navigation',
        slug: 'navigation',
        description: 'Navigation menus and breadcrumbs',
        icon: 'navigation',
        color: '#10b981',
        order: 2,
        isSystemCategory: true
    },
    {
        name: 'Content',
        slug: 'content',
        description: 'Content display components',
        icon: 'file-text',
        color: '#f59e0b',
        order: 3,
        isSystemCategory: true
    },
    {
        name: 'Forms',
        slug: 'forms',
        description: 'Form elements and input components',
        icon: 'form-input',
        color: '#8b5cf6',
        order: 4,
        isSystemCategory: true
    },
    {
        name: 'Media',
        slug: 'media',
        description: 'Image, video, and media components',
        icon: 'image',
        color: '#ef4444',
        order: 5,
        isSystemCategory: true
    },
    {
        name: 'Interactive',
        slug: 'interactive',
        description: 'Interactive elements and widgets',
        icon: 'mouse-pointer',
        color: '#06b6d4',
        order: 6,
        isSystemCategory: true
    },
    {
        name: 'Marketing',
        slug: 'marketing',
        description: 'CTA, testimonials, and marketing components',
        icon: 'megaphone',
        color: '#ec4899',
        order: 7,
        isSystemCategory: true
    }
] as const;

/**
 * Component difficulty levels
 */
export const COMPONENT_DIFFICULTY = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced'
} as const;

/**
 * Component review statuses
 */
export const COMPONENT_REVIEW_STATUS = {
    pending: 'Pending Review',
    approved: 'Approved',
    needs_work: 'Needs Work'
} as const;

/**
 * Component change types for versioning
 */
export const COMPONENT_CHANGE_TYPES = {
    major: 'Major',
    minor: 'Minor',
    patch: 'Patch'
} as const;

// ============================================================================
// Component Utility Functions
// ============================================================================

/**
 * Check if a content instance is a component
 */
export function isComponent(content: ContentInstance): content is Component {
    return content.data?.isComponent === true;
}

/**
 * Get component category display name
 */
export function getComponentCategoryName(categorySlug: string): string {
    const category = DEFAULT_COMPONENT_CATEGORIES.find(cat => cat.slug === categorySlug);
    return category?.name || categorySlug;
}

/**
 * Generate component version number
 */
export function generateVersionNumber(
    currentVersion: string,
    changeType: 'major' | 'minor' | 'patch'
): string {
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    
    switch (changeType) {
        case 'major':
            return `${major + 1}.0.0`;
        case 'minor':
            return `${major}.${minor + 1}.0`;
        case 'patch':
            return `${major}.${minor}.${patch + 1}`;
        default:
            return currentVersion;
    }
}

/**
 * Calculate component popularity score
 */
export function calculatePopularityScore(component: Component): number {
    const weights = {
        usageCount: 0.4,
        rating: 0.3,
        downloads: 0.2,
        recency: 0.1
    };
    
    const usageScore = Math.min(100, component.componentMetadata.usageCount * 2);
    const ratingScore = (component.componentMetadata.rating || 0) * 20;
    const downloadScore = Math.min(100, component.componentMetadata.downloads / 10);
    
    // Recency score based on last usage
    const daysSinceLastUsed = component.componentMetadata.lastUsed 
        ? Math.floor((Date.now() - component.componentMetadata.lastUsed.getTime()) / (1000 * 60 * 60 * 24))
        : 365;
    const recencyScore = Math.max(0, 100 - daysSinceLastUsed);
    
    return Math.round(
        usageScore * weights.usageCount +
        ratingScore * weights.rating +
        downloadScore * weights.downloads +
        recencyScore * weights.recency
    );
}

/**
 * Validate component data structure
 */
export function validateComponentData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!data.isComponent) {
        errors.push('Content must be marked as a component');
    }
    
    if (!data.category) {
        errors.push('Component category is required');
    }
    
    if (data.componentMetadata) {
        const metadata = data.componentMetadata;
        
        if (metadata.difficulty && !['beginner', 'intermediate', 'advanced'].includes(metadata.difficulty)) {
            errors.push('Invalid difficulty level');
        }
        
        if (metadata.rating && (metadata.rating < 1 || metadata.rating > 5)) {
            errors.push('Rating must be between 1 and 5');
        }
        
        if (metadata.reviewStatus && !['pending', 'approved', 'needs_work'].includes(metadata.reviewStatus)) {
            errors.push('Invalid review status');
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}