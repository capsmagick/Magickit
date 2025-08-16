---
description: Database patterns and MongoDB integration guidelines for Magickit
inclusion: fileMatch
fileMatchPattern: "src/lib/db/**/*.ts"
---

# Magickit Database Patterns

## MongoDB Integration Guidelines

### Database Client Usage
Always use the existing `dbClient` pattern established in the project:

```typescript
import db from '$lib/db/dbClient';
import { ObjectId } from 'mongodb';

// ✅ CORRECT - Use existing db client
const collection = db.collection('users');

// ❌ INCORRECT - Don't create new connections
import { MongoClient } from 'mongodb';
const client = new MongoClient(connectionString);
```

### Document ID Patterns
Always use MongoDB ObjectId for document identifiers:

```typescript
import { ObjectId } from 'mongodb';

// ✅ CORRECT - ObjectId usage
interface User {
  _id: ObjectId;
  email: string;
  name: string;
  createdAt: Date;
}

// Create new document
const newUser = {
  _id: new ObjectId(),
  email: 'user@example.com',
  name: 'John Doe',
  createdAt: new Date()
};

// Query by ID
const user = await db.collection('users').findOne({ 
  _id: new ObjectId(userId) 
});

// ❌ INCORRECT - String IDs
interface User {
  id: string; // Don't use string IDs
  email: string;
}
```

## Collection Patterns

### Collection Utilities
Create utility functions for each collection:

```typescript
// src/lib/db/collections/users.ts
import db from '$lib/db/dbClient';
import { ObjectId } from 'mongodb';
import type { User, CreateUserData, UpdateUserData } from '$lib/db/models/user';

export class UsersCollection {
  private collection = db.collection<User>('users');

  async findById(id: string | ObjectId): Promise<User | null> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    return await this.collection.findOne({ _id: objectId });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.collection.findOne({ email });
  }

  async create(userData: CreateUserData): Promise<User> {
    const user: User = {
      _id: new ObjectId(),
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await this.collection.insertOne(user);
    return user;
  }

  async update(id: string | ObjectId, updates: UpdateUserData): Promise<User | null> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    
    const result = await this.collection.findOneAndUpdate(
      { _id: objectId },
      { 
        $set: { 
          ...updates, 
          updatedAt: new Date() 
        } 
      },
      { returnDocument: 'after' }
    );
    
    return result;
  }

  async delete(id: string | ObjectId): Promise<boolean> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const result = await this.collection.deleteOne({ _id: objectId });
    return result.deletedCount > 0;
  }

  async findMany(filter: any = {}, options: any = {}): Promise<User[]> {
    return await this.collection.find(filter, options).toArray();
  }

  async count(filter: any = {}): Promise<number> {
    return await this.collection.countDocuments(filter);
  }
}

// Export singleton instance
export const usersCollection = new UsersCollection();
```

### Model Interfaces
Define TypeScript interfaces for all data models:

```typescript
// src/lib/db/models/user.ts
import type { ObjectId } from 'mongodb';

export interface User {
  _id: ObjectId;
  email: string;
  name: string;
  role: 'user' | 'admin';
  avatar?: string;
  bio?: string;
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
  lastLoginAt?: Date;
}

export interface CreateUserData {
  email: string;
  name: string;
  role?: 'user' | 'admin';
  avatar?: string;
  bio?: string;
  preferences?: Partial<User['preferences']>;
}

export interface UpdateUserData {
  name?: string;
  avatar?: string;
  bio?: string;
  preferences?: Partial<User['preferences']>;
  lastLoginAt?: Date;
}

// Query result types
export interface UserListItem {
  _id: ObjectId;
  email: string;
  name: string;
  role: 'user' | 'admin';
  avatar?: string;
  createdAt: Date;
  lastLoginAt?: Date;
}
```

## Query Patterns

### Basic CRUD Operations
```typescript
// Create
const newUser = await usersCollection.create({
  email: 'user@example.com',
  name: 'John Doe',
  role: 'user'
});

// Read
const user = await usersCollection.findById(userId);
const userByEmail = await usersCollection.findByEmail('user@example.com');

// Update
const updatedUser = await usersCollection.update(userId, {
  name: 'Jane Doe',
  bio: 'Updated bio'
});

// Delete
const deleted = await usersCollection.delete(userId);
```

### Advanced Queries
```typescript
// Pagination
async findPaginated(page: number = 1, limit: number = 10, filter: any = {}) {
  const skip = (page - 1) * limit;
  
  const [items, total] = await Promise.all([
    this.collection
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    this.collection.countDocuments(filter)
  ]);
  
  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}

// Search
async search(query: string, options: any = {}) {
  const searchFilter = {
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } },
      { bio: { $regex: query, $options: 'i' } }
    ]
  };
  
  return await this.collection
    .find(searchFilter)
    .sort({ createdAt: -1 })
    .limit(options.limit || 50)
    .toArray();
}

// Aggregation
async getUserStats() {
  return await this.collection.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
        lastLogin: { $max: '$lastLoginAt' }
      }
    }
  ]).toArray();
}
```

## Error Handling Patterns

### Database Error Handling
```typescript
import { MongoError } from 'mongodb';

export async function safeDbOperation<T>(
  operation: () => Promise<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    console.error('Database operation failed:', error);
    
    if (error instanceof MongoError) {
      // Handle specific MongoDB errors
      if (error.code === 11000) {
        return { success: false, error: 'Duplicate entry found' };
      }
      return { success: false, error: 'Database operation failed' };
    }
    
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// Usage
const result = await safeDbOperation(() => 
  usersCollection.create(userData)
);

if (result.success) {
  // Handle success
  const user = result.data;
} else {
  // Handle error
  console.error(result.error);
}
```

## Validation Patterns

### Input Validation
```typescript
import { z } from 'zod';

// Define validation schemas
export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['user', 'admin']).optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional()
});

export const UpdateUserSchema = CreateUserSchema.partial();

// Validation function
export function validateUserData(data: unknown): CreateUserData {
  return CreateUserSchema.parse(data);
}

// Usage in API routes
export async function POST({ request }) {
  try {
    const body = await request.json();
    const validatedData = validateUserData(body);
    
    const user = await usersCollection.create(validatedData);
    return json({ success: true, user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return json({ 
        success: false, 
        errors: error.errors 
      }, { status: 400 });
    }
    
    return json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
```

## Index Patterns

### Database Indexes
Create appropriate indexes for performance:

```typescript
// src/lib/db/indexes.ts
import db from '$lib/db/dbClient';

export async function createIndexes() {
  // Users collection indexes
  await db.collection('users').createIndexes([
    { key: { email: 1 }, unique: true },
    { key: { role: 1 } },
    { key: { createdAt: -1 } },
    { key: { lastLoginAt: -1 } }
  ]);

  // Blog posts indexes
  await db.collection('blogPosts').createIndexes([
    { key: { slug: 1 }, unique: true },
    { key: { status: 1 } },
    { key: { publishedAt: -1 } },
    { key: { tags: 1 } },
    { key: { author: 1 } }
  ]);

  // Audit logs indexes
  await db.collection('auditLogs').createIndexes([
    { key: { userId: 1 } },
    { key: { action: 1 } },
    { key: { timestamp: -1 } },
    { key: { resource: 1 } }
  ]);
}
```

## Migration Patterns

### Data Migration
```typescript
// src/lib/db/migrations/001_add_user_preferences.ts
import db from '$lib/db/dbClient';

export async function up() {
  // Add preferences field to existing users
  await db.collection('users').updateMany(
    { preferences: { $exists: false } },
    {
      $set: {
        preferences: {
          theme: 'system',
          notifications: {
            email: true,
            push: true,
            marketing: false
          }
        }
      }
    }
  );
}

export async function down() {
  // Remove preferences field
  await db.collection('users').updateMany(
    {},
    { $unset: { preferences: 1 } }
  );
}
```

## Performance Patterns

### Connection Pooling
```typescript
// Use existing dbClient - it handles connection pooling
import db from '$lib/db/dbClient';

// ✅ CORRECT - Reuse existing connection
const users = await db.collection('users').find({}).toArray();

// ❌ INCORRECT - Don't create new connections
import { MongoClient } from 'mongodb';
const client = new MongoClient(uri);
await client.connect();
```

### Query Optimization
```typescript
// Use projection to limit returned fields
const users = await db.collection('users').find(
  { role: 'user' },
  { 
    projection: { 
      name: 1, 
      email: 1, 
      createdAt: 1 
    } 
  }
).toArray();

// Use indexes for sorting
const recentUsers = await db.collection('users')
  .find({})
  .sort({ createdAt: -1 }) // Uses index
  .limit(10)
  .toArray();

// Batch operations
const bulkOps = users.map(user => ({
  updateOne: {
    filter: { _id: user._id },
    update: { $set: { lastLoginAt: new Date() } }
  }
}));

await db.collection('users').bulkWrite(bulkOps);
```

These patterns ensure consistent, performant, and maintainable database operations throughout the Magickit application.