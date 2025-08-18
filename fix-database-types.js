#!/usr/bin/env bun

import { readFileSync, writeFileSync } from 'fs';

// Fix contentInstances.ts
function fixContentInstances() {
  const filePath = './src/lib/db/collections/contentInstances.ts';
  let content = readFileSync(filePath, 'utf-8');
  
  // Fix all collection type declarations
  content = content.replace(
    /collection\.findOne<ContentInstance>/g,
    'collection.findOne<ContentInstanceDocument>'
  );
  
  content = content.replace(
    /dbClient\.collection<ContentInstance>/g,
    'dbClient.collection<ContentInstanceDocument>'
  );
  
  // Fix findById method
  content = content.replace(
    /static async findById\(id: string \| ObjectId\) \{[\s\S]*?const instance = await collection\.findOne\(\{ _id: objectId \}\);[\s\S]*?return instance;/,
    `static async findById(id: string | ObjectId): Promise<ContentInstance | null> {
        try {
            const collection = dbClient.collection<ContentInstanceDocument>(COLLECTION_NAME);

            const objectId = typeof id === 'string' ? new ObjectId(id) : id;
            const document = await collection.findOne({ _id: objectId });

            if (!document) return null;

            // Convert ObjectId to string for client compatibility
            const instance: ContentInstance = {
                ...document,
                _id: document._id.toString()
            };

            return instance;`
  );
  
  // Fix create method
  content = content.replace(
    /const newInstance: ContentInstance = \{[\s\S]*?_id: new ObjectId\(\),/,
    `const newInstanceDocument: ContentInstanceDocument = {
                _id: new ObjectId(),`
  );
  
  content = content.replace(
    /const result = await collection\.insertOne\(newInstance\);[\s\S]*?return newInstance;/,
    `const result = await collection.insertOne(newInstanceDocument);
            
            if (!result.acknowledged) {
                throw new Error('Failed to create content instance');
            }

            // Convert back to client format
            const newInstance: ContentInstance = {
                ...newInstanceDocument,
                _id: newInstanceDocument._id.toString()
            };

            // Create initial version
            await this.createVersion(newInstance._id, newInstance.data, instanceData.author, 'Initial version');

            return newInstance;`
  );
  
  writeFileSync(filePath, content, 'utf-8');
  console.log('Fixed contentInstances.ts');
}

// Fix any remaining issues in other files
function fixOtherDbFiles() {
  // Add more fixes as needed
}

// Run fixes
fixContentInstances();
fixOtherDbFiles();

console.log('Database type fixes completed');