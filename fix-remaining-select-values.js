#!/usr/bin/env bun

import { readFileSync, writeFileSync } from 'fs';

// List of files that still have Select.Value issues
const filesToFix = [
  'src/routes/admin/access-control/audit/+page.svelte',
  'src/routes/admin/access-control/assign/+page.svelte',
  'src/routes/admin/notifications/templates/+page.svelte',
  'src/routes/admin/access-control/permissions/+page.svelte',
  'src/routes/admin/content/components/+page.svelte',
  'src/routes/admin/content/pages/ContentInstanceForm.svelte',
  'src/routes/admin/support/tickets/+page.svelte',
  'src/routes/admin/content/pages/+page.svelte',
  'src/routes/admin/content/types/ContentTypeForm.svelte',
  'src/routes/admin/users/sessions/+page.svelte',
  'src/routes/admin/content/components/ContentComponentForm.svelte'
];

// Function to fix Select.Value components by replacing them with placeholder text
function fixSelectValues(content) {
  let modified = false;
  let newContent = content;

  // Add type="single" to Select.Root components that don't have it
  newContent = newContent.replace(
    /<Select\.Root(\s+(?!type=)[^>]*?)>/g,
    '<Select.Root type="single"$1>'
  );

  // Replace Select.Value with placeholder text
  const selectValueRegex = /<Select\.Value\s+placeholder=["']([^"']+)["']\s*\/>/g;
  newContent = newContent.replace(selectValueRegex, (match, placeholder) => {
    modified = true;
    return `{selectedValue ?? '${placeholder}'}`;
  });

  // Replace Select.Value without placeholder
  const selectValueNoPlaceholderRegex = /<Select\.Value\s*\/>/g;
  newContent = newContent.replace(selectValueNoPlaceholderRegex, () => {
    modified = true;
    return '{selectedValue ?? "Select option"}';
  });

  // Fix bind:selected to bind:value
  newContent = newContent.replace(/bind:selected=/g, 'bind:value=');
  if (newContent !== content && !modified) modified = true;

  return { content: newContent, modified };
}

// Process each file
let totalFixed = 0;

for (const filePath of filesToFix) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const result = fixSelectValues(content);
    
    if (result.modified) {
      writeFileSync(filePath, result.content, 'utf-8');
      console.log(`Fixed Select.Value components in: ${filePath}`);
      totalFixed++;
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

console.log(`\nFixed Select.Value components in ${totalFixed} files.`);
console.log('\nNote: You may need to manually add proper derived values for better UX.');
console.log('The placeholders have been added as temporary fixes.');