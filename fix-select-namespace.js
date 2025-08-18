#!/usr/bin/env bun

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// Function to recursively find all .svelte files
function findSvelteFiles(dir, files = []) {
  const items = readdirSync(dir);
  
  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      findSvelteFiles(fullPath, files);
    } else if (item.endsWith('.svelte')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Function to fix Select namespace usage
function fixSelectNamespace(filePath) {
  let content = readFileSync(filePath, 'utf-8');
  let modified = false;
  
  // Check if file uses Select components
  if (content.includes('Select.Root') || content.includes('SelectTrigger') || content.includes('SelectValue')) {
    // Update import to use namespace
    if (content.includes('import { Select,')) {
      content = content.replace(
        /import \{ Select, SelectContent, SelectItem, SelectTrigger, SelectValue \} from ['"]\$lib\/components\/ui\/select['"];?/g,
        "import * as Select from '$lib/components/ui/select';"
      );
      modified = true;
    }
    
    // Update component usage to use namespace
    content = content.replace(/SelectTrigger/g, 'Select.Trigger');
    content = content.replace(/SelectValue/g, 'Select.Value');
    content = content.replace(/SelectContent/g, 'Select.Content');
    content = content.replace(/SelectItem/g, 'Select.Item');
    
    if (content.includes('Select.Trigger') || content.includes('Select.Value')) {
      modified = true;
    }
  }
  
  if (modified) {
    writeFileSync(filePath, content, 'utf-8');
    console.log(`Fixed Select namespace in: ${filePath}`);
  }
  
  return modified;
}

// Main execution
const srcDir = './src';
const svelteFiles = findSvelteFiles(srcDir);

console.log(`Found ${svelteFiles.length} Svelte files`);

let totalFixed = 0;
for (const file of svelteFiles) {
  if (fixSelectNamespace(file)) {
    totalFixed++;
  }
}

console.log(`Fixed Select namespace in ${totalFixed} files`);