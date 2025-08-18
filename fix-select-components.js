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

// Function to fix Select components in a file
function fixSelectComponents(filePath) {
  let content = readFileSync(filePath, 'utf-8');
  let modified = false;
  
  // Fix Select bind:value to Select.Root bind:value
  const selectBindRegex = /<Select\s+bind:value=/g;
  if (selectBindRegex.test(content)) {
    content = content.replace(selectBindRegex, '<Select.Root bind:value=');
    modified = true;
  }
  
  // Fix closing Select tags to Select.Root
  const selectCloseRegex = /<\/Select>/g;
  if (selectCloseRegex.test(content)) {
    content = content.replace(selectCloseRegex, '</Select.Root>');
    modified = true;
  }
  
  // Fix Select with value prop (not bind:value) to Select.Root
  const selectValueRegex = /<Select\s+value=/g;
  if (selectValueRegex.test(content)) {
    content = content.replace(selectValueRegex, '<Select.Root value=');
    modified = true;
  }
  
  // Fix onValueChange parameter types
  const onValueChangeRegex = /onValueChange=\{\(value\)\s*=>/g;
  if (onValueChangeRegex.test(content)) {
    content = content.replace(onValueChangeRegex, 'onValueChange={(value: string) =>');
    modified = true;
  }
  
  if (modified) {
    writeFileSync(filePath, content, 'utf-8');
    console.log(`Fixed Select components in: ${filePath}`);
  }
  
  return modified;
}

// Main execution
const srcDir = './src';
const svelteFiles = findSvelteFiles(srcDir);

console.log(`Found ${svelteFiles.length} Svelte files`);

let totalFixed = 0;
for (const file of svelteFiles) {
  if (fixSelectComponents(file)) {
    totalFixed++;
  }
}

console.log(`Fixed Select components in ${totalFixed} files`);