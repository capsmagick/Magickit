#!/usr/bin/env bun

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

// Get all collection files
const collectionsDir = './src/lib/db/collections';
const files = readdirSync(collectionsDir).filter(f => f.endsWith('.ts'));

console.log(`Found ${files.length} collection files to fix`);

for (const file of files) {
  const filePath = join(collectionsDir, file);
  let content = readFileSync(filePath, 'utf-8');
  let modified = false;

  // Skip if already has Document interface
  if (content.includes('Document extends')) {
    console.log(`Skipping ${file} - already has Document interface`);
    continue;
  }

  // Add Document interface after imports
  const modelImportMatch = content.match(/import type \{ ([^}]+) \} from ['"]\.\.\/models\.js['"];/);
  if (modelImportMatch) {
    const modelName = modelImportMatch[1].split(',')[0].trim();
    const documentInterface = `
// Internal type that uses ObjectId for database operations
interface ${modelName}Document extends Omit<${modelName}, '_id'> {
    _id: ObjectId;
}`;
    
    content = content.replace(
      /const COLLECTION_NAME = ['"][^'"]+['"];/,
      `const COLLECTION_NAME = '${file.replace('.ts', '')}';

${documentInterface}`
    );
    modified = true;
  }

  // Replace collection type declarations
  content = content.replace(
    /dbClient\.collection<([^>]+)>\(COLLECTION_NAME\)/g,
    (match, typeName) => {
      if (typeName.includes('Document')) return match;
      return `dbClient.collection<${typeName}Document>(COLLECTION_NAME)`;
    }
  );

  // Fix ObjectId parameter types to string
  content = content.replace(
    /(id: string \| ObjectId|userId: ObjectId|author: ObjectId)/g,
    (match) => {
      if (match.includes('userId') || match.includes('author')) {
        return match.replace('ObjectId', 'string');
      }
      return match;
    }
  );

  // Add ObjectId to string conversion in return statements
  if (content.includes('await cursor.toArray()') && !content.includes('_id: doc._id.toString()')) {
    content = content.replace(
      /(const \w+ = await cursor\.toArray\(\);)/g,
      `const documents = await cursor.toArray();
            
            // Convert ObjectId to string for client compatibility
            const results = documents.map(doc => ({
                ...doc,
                _id: doc._id.toString()
            }));`
    );
    
    content = content.replace(
      /return \{ (\w+), total \};/g,
      'return { results, total };'
    );
    modified = true;
  }

  if (modified) {
    writeFileSync(filePath, content, 'utf-8');
    console.log(`Fixed ${file}`);
  }
}

console.log('Database type fixes completed');