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

// Common option patterns for different types of selects
const commonOptions = {
  status: [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'pending', label: 'Pending' },
    { value: 'open', label: 'Open' },
    { value: 'closed', label: 'Closed' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
    { value: 'archived', label: 'Archived' },
    { value: 'reviewed', label: 'Reviewed' }
  ],
  priority: [
    { value: 'all', label: 'All Priority' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ],
  category: [
    { value: 'all', label: 'All Categories' },
    { value: 'general', label: 'General' },
    { value: 'technical', label: 'Technical' },
    { value: 'billing', label: 'Billing' },
    { value: 'support', label: 'Support' },
    { value: 'authentication', label: 'Authentication' },
    { value: 'administration', label: 'Administration' },
    { value: 'api', label: 'API' },
    { value: 'troubleshooting', label: 'Troubleshooting' },
    { value: 'faq', label: 'FAQ' }
  ],
  theme: [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' }
  ],
  rating: [
    { value: 'all', label: 'All Ratings' },
    { value: '5', label: '5 Stars' },
    { value: '4', label: '4 Stars' },
    { value: '3', label: '3 Stars' },
    { value: '2', label: '2 Stars' },
    { value: '1', label: '1 Star' }
  ]
};

// Function to detect what type of select this is based on variable name and options
function detectSelectType(variableName, content) {
  const lowerName = variableName.toLowerCase();
  
  if (lowerName.includes('status')) return 'status';
  if (lowerName.includes('priority')) return 'priority';
  if (lowerName.includes('category')) return 'category';
  if (lowerName.includes('theme')) return 'theme';
  if (lowerName.includes('rating')) return 'rating';
  
  // Check content for clues
  if (content.includes('draft') && content.includes('published')) return 'status';
  if (content.includes('low') && content.includes('high')) return 'priority';
  if (content.includes('light') && content.includes('dark')) return 'theme';
  
  return 'custom';
}

// Function to extract options from existing Select.Item elements
function extractOptionsFromContent(content, selectMatch) {
  const options = [];
  const itemRegex = /<Select\.Item\s+value=["']([^"']+)["'][^>]*>([^<]+)<\/Select\.Item>/g;
  let match;
  
  while ((match = itemRegex.exec(selectMatch)) !== null) {
    const value = match[1];
    const label = match[2].trim();
    options.push({ value, label });
  }
  
  return options;
}

// Function to generate options array code
function generateOptionsArray(variableName, options, type) {
  const arrayName = `${variableName}Options`;
  
  if (type !== 'custom' && commonOptions[type]) {
    // Filter common options to only include ones that exist in the current options
    const existingValues = options.map(opt => opt.value);
    const filteredCommonOptions = commonOptions[type].filter(opt => 
      existingValues.includes(opt.value) || opt.value === 'all'
    );
    
    // Add any custom options that aren't in common options
    const customOptions = options.filter(opt => 
      !commonOptions[type].some(common => common.value === opt.value)
    );
    
    const finalOptions = [...filteredCommonOptions, ...customOptions];
    
    return `\tconst ${arrayName} = [\n${finalOptions.map(opt => 
      `\t\t{ value: '${opt.value}', label: '${opt.label}' }`
    ).join(',\n')}\n\t];`;
  }
  
  return `\tconst ${arrayName} = [\n${options.map(opt => 
    `\t\t{ value: '${opt.value}', label: '${opt.label}' }`
  ).join(',\n')}\n\t];`;
}

// Function to generate derived value code
function generateDerivedValue(variableName, arrayName, placeholder) {
  const derivedName = `selected${variableName.charAt(0).toUpperCase() + variableName.slice(1)}Label`;
  
  return `\tconst ${derivedName} = $derived(\n\t\t${arrayName}.find(option => option.value === ${variableName})?.label ?? '${placeholder}'\n\t);`;
}

// Function to fix a single Select component
function fixSelectComponent(content, filePath) {
  let modified = false;
  let newContent = content;
  
  // Find all Select.Root components
  const selectRootRegex = /<Select\.Root\s+([^>]*?)>([\s\S]*?)<\/Select\.Root>/g;
  let match;
  const selectMatches = [];
  
  while ((match = selectRootRegex.exec(content)) !== null) {
    selectMatches.push({
      fullMatch: match[0],
      attributes: match[1],
      innerContent: match[2],
      index: match.index
    });
  }
  
  if (selectMatches.length === 0) return { content, modified };
  
  // Process each Select component
  const addedArrays = new Set();
  const addedDerived = new Set();
  let scriptsToAdd = [];
  
  for (const selectMatch of selectMatches) {
    // Extract bind:value or bind:selected
    const bindMatch = selectMatch.attributes.match(/bind:(value|selected)=\{?([^}\s]+)\}?/);
    if (!bindMatch) continue;
    
    const variableName = bindMatch[2];
    
    // Skip if already processed
    if (addedArrays.has(variableName)) continue;
    
    // Extract existing options
    const options = extractOptionsFromContent(content, selectMatch.innerContent);
    if (options.length === 0) continue;
    
    // Detect select type
    const selectType = detectSelectType(variableName, selectMatch.innerContent);
    
    // Generate options array
    const arrayName = `${variableName}Options`;
    const optionsCode = generateOptionsArray(variableName, options, selectType);
    
    // Generate derived value
    const placeholder = selectMatch.innerContent.includes('placeholder=') 
      ? selectMatch.innerContent.match(/placeholder=["']([^"']+)["']/)?.[1] || 'Select option'
      : 'Select option';
    
    const derivedCode = generateDerivedValue(variableName, arrayName, placeholder);
    
    scriptsToAdd.push(optionsCode);
    scriptsToAdd.push(derivedCode);
    addedArrays.add(variableName);
    
    // Replace the Select component
    const derivedName = `selected${variableName.charAt(0).toUpperCase() + variableName.slice(1)}Label`;
    
    // Fix attributes - ensure type="single" is present and use bind:value
    let newAttributes = selectMatch.attributes;
    if (!newAttributes.includes('type=')) {
      newAttributes = `type="single" ${newAttributes}`;
    }
    newAttributes = newAttributes.replace(/bind:selected=/g, 'bind:value=');
    
    // Create new Select component
    const newSelectContent = `<Select.Root ${newAttributes}>
\t\t\t\t<Select.Trigger class="w-32">
\t\t\t\t\t{${derivedName}}
\t\t\t\t</Select.Trigger>
\t\t\t\t<Select.Content>
\t\t\t\t\t{#each ${arrayName} as option}
\t\t\t\t\t\t<Select.Item value={option.value}>{option.label}</Select.Item>
\t\t\t\t\t{/each}
\t\t\t\t</Select.Content>
\t\t\t</Select.Root>`;
    
    newContent = newContent.replace(selectMatch.fullMatch, newSelectContent);
    modified = true;
  }
  
  // Add scripts to the beginning of the script section
  if (scriptsToAdd.length > 0) {
    const scriptMatch = newContent.match(/(<script[^>]*>)([\s\S]*?)(<\/script>)/);
    if (scriptMatch) {
      const beforeScript = scriptMatch[1];
      const scriptContent = scriptMatch[2];
      const afterScript = scriptMatch[3];
      
      const newScriptContent = beforeScript + scriptContent + '\n\n' + scriptsToAdd.join('\n\n') + '\n' + afterScript;
      newContent = newContent.replace(scriptMatch[0], newScriptContent);
    }
  }
  
  return { content: newContent, modified };
}

// Main execution
const srcDir = './src';
const svelteFiles = findSvelteFiles(srcDir);

console.log(`Found ${svelteFiles.length} Svelte files to check`);

let totalFixed = 0;
const fixedFiles = [];

for (const file of svelteFiles) {
  try {
    const content = readFileSync(file, 'utf-8');
    
    // Skip if no Select components
    if (!content.includes('Select.Root')) continue;
    
    const result = fixSelectComponent(content, file);
    
    if (result.modified) {
      writeFileSync(file, result.content, 'utf-8');
      fixedFiles.push(file);
      totalFixed++;
      console.log(`Fixed Select components in: ${file}`);
    }
  } catch (error) {
    console.error(`Error processing ${file}:`, error.message);
  }
}

console.log(`\nFixed Select components in ${totalFixed} files:`);
fixedFiles.forEach(file => console.log(`  - ${file}`));

if (totalFixed === 0) {
  console.log('No Select components needed fixing.');
}