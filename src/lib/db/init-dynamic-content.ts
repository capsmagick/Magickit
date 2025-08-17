import db from './dbClient.js';
import { ObjectId } from 'mongodb';
import type { 
  ContentType, 
  ContentField, 
  SystemHealthStatus,
  SystemAlert,
  SystemMetrics 
} from './models.js';
import { initializeComponentCollections } from './collections/components.js';
import { DEFAULT_COMPONENT_CATEGORIES } from './models/component.js';

/**
 * Initialize dynamic content management system
 * This extends the existing database initialization with new collections and indexes
 */
export async function initializeDynamicContentSystem() {
  try {
    console.log('Initializing dynamic content management system...');
    
    // Create additional indexes for new collections
    await createDynamicContentIndexes();
    console.log('✓ Dynamic content indexes created');
    
    // Initialize default content types
    await initializeDefaultContentTypes();
    console.log('✓ Default content types initialized');
    
    // Initialize system health monitoring
    await initializeSystemHealthMonitoring();
    console.log('✓ System health monitoring initialized');
    
    // Initialize component collections and categories
    await initializeComponentCollections();
    console.log('✓ Component collections initialized');
    
    await initializeDefaultComponentCategories();
    console.log('✓ Default component categories initialized');
    
    console.log('Dynamic content management system initialization completed successfully');
  } catch (error) {
    console.error('Dynamic content management system initialization failed:', error);
    throw error;
  }
}

/**
 * Create additional database indexes for dynamic content management
 */
async function createDynamicContentIndexes() {
  try {
    // Content Versions Collection Indexes (not in main collections.ts)
    const contentVersionsCollection = db.collection('contentVersions');
    await contentVersionsCollection.createIndexes([
      { key: { contentInstanceId: 1 } },
      { key: { version: 1 } },
      { key: { author: 1 } },
      { key: { createdAt: -1 } },
      { key: { contentInstanceId: 1, version: 1 }, unique: true }
    ]);

    // Additional compound indexes for better query performance
    const contentInstancesCollection = db.collection('contentInstances');
    await contentInstancesCollection.createIndexes([
      { key: { contentTypeId: 1, status: 1 } },
      { key: { status: 1, publishedAt: -1 } },
      { key: { author: 1, status: 1 } }
    ]);

    const mediaFilesCollection = db.collection('mediaFiles');
    await mediaFilesCollection.createIndexes([
      { key: { folderId: 1, mimeType: 1 } },
      { key: { uploadedBy: 1, createdAt: -1 } },
      { key: { tags: 1, mimeType: 1 } }
    ]);

    const systemMetricsCollection = db.collection('systemMetrics');
    await systemMetricsCollection.createIndexes([
      { key: { timestamp: -1, 'cpu.usage': 1 } },
      { key: { timestamp: -1, 'memory.percentage': 1 } },
      { key: { timestamp: -1, 'application.errorRate': 1 } }
    ]);

    const systemAlertsCollection = db.collection('systemAlerts');
    await systemAlertsCollection.createIndexes([
      { key: { type: 1, acknowledged: 1 } },
      { key: { category: 1, resolvedAt: 1 } },
      { key: { severity: 1, createdAt: -1 } }
    ]);

    console.log('Additional dynamic content indexes created successfully');
  } catch (error) {
    console.error('Error creating dynamic content indexes:', error);
    throw error;
  }
}

/**
 * Initialize default content types for the system
 */
async function initializeDefaultContentTypes() {
  try {
    const contentTypesCollection = db.collection<ContentType>('contentTypes');

    // Check if default content types already exist
    const existingTypes = await contentTypesCollection.countDocuments({ isSystemType: true });
    if (existingTypes > 0) {
      console.log('Default content types already exist, skipping initialization');
      return;
    }

    const defaultContentTypes: Omit<ContentType, '_id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'Page',
        slug: 'page',
        description: 'Standard web page with customizable content',
        fields: [
          {
            _id: new ObjectId(),
            name: 'title',
            label: 'Page Title',
            type: 'text',
            required: true,
            order: 1,
            placeholder: 'Enter page title',
            helpText: 'The main title of the page'
          },
          {
            _id: new ObjectId(),
            name: 'content',
            label: 'Page Content',
            type: 'richtext',
            required: true,
            order: 2,
            helpText: 'The main content of the page'
          },
          {
            _id: new ObjectId(),
            name: 'featuredImage',
            label: 'Featured Image',
            type: 'image',
            required: false,
            order: 3,
            helpText: 'Optional featured image for the page'
          },
          {
            _id: new ObjectId(),
            name: 'excerpt',
            label: 'Page Excerpt',
            type: 'textarea',
            required: false,
            order: 4,
            placeholder: 'Brief description of the page',
            helpText: 'Short description used for SEO and previews'
          }
        ],
        template: 'page',
        isSystemType: true
      },
      {
        name: 'Blog Post',
        slug: 'blog-post',
        description: 'Blog post with rich content and metadata',
        fields: [
          {
            _id: new ObjectId(),
            name: 'title',
            label: 'Post Title',
            type: 'text',
            required: true,
            order: 1,
            placeholder: 'Enter post title'
          },
          {
            _id: new ObjectId(),
            name: 'content',
            label: 'Post Content',
            type: 'richtext',
            required: true,
            order: 2
          },
          {
            _id: new ObjectId(),
            name: 'excerpt',
            label: 'Post Excerpt',
            type: 'textarea',
            required: true,
            order: 3,
            placeholder: 'Brief summary of the post'
          },
          {
            _id: new ObjectId(),
            name: 'featuredImage',
            label: 'Featured Image',
            type: 'image',
            required: false,
            order: 4
          },
          {
            _id: new ObjectId(),
            name: 'tags',
            label: 'Tags',
            type: 'multiselect',
            required: false,
            order: 5,
            options: ['Technology', 'Design', 'Development', 'Business', 'Tutorial'],
            helpText: 'Select relevant tags for this post'
          },
          {
            _id: new ObjectId(),
            name: 'featured',
            label: 'Featured Post',
            type: 'boolean',
            required: false,
            order: 6,
            defaultValue: false,
            helpText: 'Mark as featured to highlight this post'
          }
        ],
        template: 'blog-post',
        isSystemType: true
      },
      {
        name: 'Landing Page',
        slug: 'landing-page',
        description: 'Marketing landing page with call-to-action sections',
        fields: [
          {
            _id: new ObjectId(),
            name: 'title',
            label: 'Page Title',
            type: 'text',
            required: true,
            order: 1
          },
          {
            _id: new ObjectId(),
            name: 'heroTitle',
            label: 'Hero Title',
            type: 'text',
            required: true,
            order: 2,
            placeholder: 'Compelling headline'
          },
          {
            _id: new ObjectId(),
            name: 'heroSubtitle',
            label: 'Hero Subtitle',
            type: 'textarea',
            required: false,
            order: 3,
            placeholder: 'Supporting text for the hero section'
          },
          {
            _id: new ObjectId(),
            name: 'heroImage',
            label: 'Hero Image',
            type: 'image',
            required: false,
            order: 4
          },
          {
            _id: new ObjectId(),
            name: 'ctaText',
            label: 'Call to Action Text',
            type: 'text',
            required: false,
            order: 5,
            placeholder: 'Get Started',
            defaultValue: 'Get Started'
          },
          {
            _id: new ObjectId(),
            name: 'ctaUrl',
            label: 'Call to Action URL',
            type: 'url',
            required: false,
            order: 6,
            placeholder: 'https://example.com/signup'
          },
          {
            _id: new ObjectId(),
            name: 'features',
            label: 'Features Section',
            type: 'richtext',
            required: false,
            order: 7,
            helpText: 'Content for the features section'
          }
        ],
        template: 'landing-page',
        isSystemType: true
      },
      {
        name: 'Component',
        slug: 'component',
        description: 'Reusable UI component with metadata and versioning',
        fields: [
          {
            _id: new ObjectId(),
            name: 'title',
            label: 'Component Name',
            type: 'text',
            required: true,
            order: 1,
            placeholder: 'Enter component name'
          },
          {
            _id: new ObjectId(),
            name: 'description',
            label: 'Description',
            type: 'textarea',
            required: true,
            order: 2,
            placeholder: 'Describe what this component does'
          },
          {
            _id: new ObjectId(),
            name: 'content',
            label: 'Component Content',
            type: 'richtext',
            required: true,
            order: 3,
            helpText: 'The main content/markup of the component'
          },
          {
            _id: new ObjectId(),
            name: 'props',
            label: 'Component Props',
            type: 'richtext',
            required: false,
            order: 4,
            helpText: 'Documentation of component properties/parameters'
          },
          {
            _id: new ObjectId(),
            name: 'examples',
            label: 'Usage Examples',
            type: 'richtext',
            required: false,
            order: 5,
            helpText: 'Code examples showing how to use this component'
          },
          {
            _id: new ObjectId(),
            name: 'previewImage',
            label: 'Preview Image',
            type: 'image',
            required: false,
            order: 6,
            helpText: 'Screenshot or preview of the component'
          }
        ],
        template: 'component',
        isSystemType: true
      }
    ];

    // Insert default content types
    const now = new Date();
    const contentTypesToInsert: ContentType[] = defaultContentTypes.map(type => ({
      _id: new ObjectId(),
      ...type,
      createdAt: now,
      updatedAt: now
    }));

    await contentTypesCollection.insertMany(contentTypesToInsert);
    console.log(`Inserted ${contentTypesToInsert.length} default content types`);

  } catch (error) {
    console.error('Error initializing default content types:', error);
    throw error;
  }
}

/**
 * Initialize system health monitoring
 */
async function initializeSystemHealthMonitoring() {
  try {
    const systemHealthStatusCollection = db.collection<SystemHealthStatus>('systemHealthStatus');

    // Check if system health status already exists
    const existingStatus = await systemHealthStatusCollection.findOne({});
    if (existingStatus) {
      console.log('System health status already exists, skipping initialization');
      return;
    }

    // Create initial system health status
    const initialHealthStatus: SystemHealthStatus = {
      _id: new ObjectId(),
      status: 'healthy',
      score: 100,
      uptime: process.uptime(),
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

    await systemHealthStatusCollection.insertOne(initialHealthStatus);
    console.log('Initial system health status created');

    // Create initial system metrics entry
    const systemMetricsCollection = db.collection<SystemMetrics>('systemMetrics');
    const initialMetrics: SystemMetrics = {
      _id: new ObjectId(),
      timestamp: new Date(),
      cpu: {
        usage: 0,
        loadAverage: [0, 0, 0],
        cores: 1
      },
      memory: {
        used: 0,
        total: 1024 * 1024 * 1024, // 1GB default
        percentage: 0,
        available: 1024 * 1024 * 1024
      },
      disk: {
        used: 0,
        total: 10 * 1024 * 1024 * 1024, // 10GB default
        percentage: 0,
        available: 10 * 1024 * 1024 * 1024
      },
      network: {
        bytesIn: 0,
        bytesOut: 0,
        packetsIn: 0,
        packetsOut: 0
      },
      database: {
        connections: 1,
        activeConnections: 1,
        queryTime: 0,
        slowQueries: 0,
        operationsPerSecond: 0
      },
      application: {
        responseTime: 0,
        errorRate: 0,
        requestsPerMinute: 0,
        activeUsers: 0,
        uptime: process.uptime()
      },
      createdAt: new Date()
    };

    await systemMetricsCollection.insertOne(initialMetrics);
    console.log('Initial system metrics created');

  } catch (error) {
    console.error('Error initializing system health monitoring:', error);
    throw error;
  }
}

/**
 * Create default media folders structure
 */
export async function initializeDefaultMediaFolders() {
  try {
    const mediaFoldersCollection = db.collection('mediaFolders');

    // Check if default folders already exist
    const existingFolders = await mediaFoldersCollection.countDocuments({});
    if (existingFolders > 0) {
      console.log('Media folders already exist, skipping initialization');
      return;
    }

    const defaultFolders = [
      {
        _id: new ObjectId(),
        name: 'Images',
        path: '/images',
        description: 'General image files',
        createdBy: new ObjectId(), // Will need to be updated with actual admin user ID
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        name: 'Documents',
        path: '/documents',
        description: 'PDF and document files',
        createdBy: new ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        name: 'Videos',
        path: '/videos',
        description: 'Video files',
        createdBy: new ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await mediaFoldersCollection.insertMany(defaultFolders);
    console.log(`Created ${defaultFolders.length} default media folders`);

  } catch (error) {
    console.error('Error initializing default media folders:', error);
    throw error;
  }
}

/**
 * Verify all collections and indexes are properly created
 */
export async function verifyDynamicContentSetup() {
  try {
    console.log('Verifying dynamic content management setup...');

    const collections = [
      'contentTypes',
      'contentInstances', 
      'contentVersions',
      'mediaFolders',
      'mediaFiles',
      'systemMetrics',
      'systemAlerts',
      'systemHealthStatus',
      'componentUsage',
      'componentVersions',
      'componentCategories',
      'componentPreviews',
      'componentTemplates'
    ];

    const verificationResults = [];

    for (const collectionName of collections) {
      try {
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();
        const indexes = await collection.listIndexes().toArray();
        
        verificationResults.push({
          collection: collectionName,
          status: 'healthy',
          documentCount: count,
          indexCount: indexes.length,
          indexes: indexes.map(idx => idx.name)
        });
      } catch (error) {
        verificationResults.push({
          collection: collectionName,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log('Dynamic content management setup verification completed');
    return verificationResults;

  } catch (error) {
    console.error('Error verifying dynamic content setup:', error);
    throw error;
  }
}

/**
 * Initialize default component categories
 */
async function initializeDefaultComponentCategories() {
  try {
    const componentCategoriesCollection = db.collection('componentCategories');

    // Check if default categories already exist
    const existingCategories = await componentCategoriesCollection.countDocuments({ isSystemCategory: true });
    if (existingCategories > 0) {
      console.log('Default component categories already exist, skipping initialization');
      return;
    }

    const now = new Date();
    const categoriesToInsert = DEFAULT_COMPONENT_CATEGORIES.map(category => ({
      _id: new ObjectId(),
      ...category,
      createdAt: now,
      updatedAt: now
    }));

    await componentCategoriesCollection.insertMany(categoriesToInsert);
    console.log(`Inserted ${categoriesToInsert.length} default component categories`);

  } catch (error) {
    console.error('Error initializing default component categories:', error);
    throw error;
  }
}