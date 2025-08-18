# Select Component Usage Guide

This guide explains how to properly use the Select component in the Magickit project to ensure selected values are displayed correctly in the trigger.

## Overview

The Select component in this project is based on Bits UI and requires specific patterns to work correctly. The most common issue is that selected values don't appear in the trigger - this guide shows how to fix that.

## Basic Usage Pattern

### ❌ Incorrect Usage (Common Mistake)

```svelte
<script lang="ts">
  import * as Select from '$lib/components/ui/select';
  
  let selectedValue = $state('option1');
</script>

<!-- This WON'T show the selected value in the trigger -->
<Select.Root type="single" bind:value={selectedValue}>
  <Select.Trigger>
    <Select.Value placeholder="Choose option" />
  </Select.Trigger>
  <Select.Content>
    <Select.Item value="option1">Option 1</Select.Item>
    <Select.Item value="option2">Option 2</Select.Item>
  </Select.Content>
</Select.Root>
```

### ✅ Correct Usage

```svelte
<script lang="ts">
  import * as Select from '$lib/components/ui/select';
  
  let selectedValue = $state('option1');
  
  // Define options with labels
  const options = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' }
  ];
  
  // Create derived value for display
  const selectedLabel = $derived(
    options.find(option => option.value === selectedValue)?.label ?? 'Choose option'
  );
</script>

<!-- This WILL show the selected value in the trigger -->
<Select.Root type="single" bind:value={selectedValue}>
  <Select.Trigger>
    {selectedLabel}
  </Select.Trigger>
  <Select.Content>
    {#each options as option}
      <Select.Item value={option.value}>{option.label}</Select.Item>
    {/each}
  </Select.Content>
</Select.Root>
```

## Key Requirements

### 1. Always Include `type` Prop

The `type` prop is **required** and must be either `"single"` or `"multiple"`:

```svelte
<!-- Single selection -->
<Select.Root type="single" bind:value={singleValue}>

<!-- Multiple selection -->
<Select.Root type="multiple" bind:value={multipleValues}>
```

### 2. Display Selected Value in Trigger

Instead of using `<Select.Value />`, directly render the selected value:

```svelte
<Select.Trigger>
  {selectedLabel}  <!-- Direct text rendering -->
</Select.Trigger>
```

### 3. Use Derived Values for Labels

Create a derived value that finds the correct label for the selected value:

```svelte
const selectedLabel = $derived(
  options.find(option => option.value === selectedValue)?.label ?? 'Placeholder text'
);
```

## Complete Examples

### Example 1: Simple Select with String Values

```svelte
<script lang="ts">
  import * as Select from '$lib/components/ui/select';
  
  let theme = $state('light');
  
  const themeOptions = [
    { value: 'light', label: 'Light Mode' },
    { value: 'dark', label: 'Dark Mode' },
    { value: 'system', label: 'System Default' }
  ];
  
  const selectedThemeLabel = $derived(
    themeOptions.find(option => option.value === theme)?.label ?? 'Select theme'
  );
</script>

<div class="space-y-2">
  <label class="text-sm font-medium">Theme Preference</label>
  <Select.Root type="single" bind:value={theme}>
    <Select.Trigger class="w-48">
      {selectedThemeLabel}
    </Select.Trigger>
    <Select.Content>
      {#each themeOptions as option}
        <Select.Item value={option.value}>{option.label}</Select.Item>
      {/each}
    </Select.Content>
  </Select.Root>
</div>
```

### Example 2: Select with Complex Objects

```svelte
<script lang="ts">
  import * as Select from '$lib/components/ui/select';
  
  interface User {
    id: string;
    name: string;
    email: string;
  }
  
  let selectedUserId = $state('user1');
  
  const users: User[] = [
    { id: 'user1', name: 'John Doe', email: 'john@example.com' },
    { id: 'user2', name: 'Jane Smith', email: 'jane@example.com' },
    { id: 'user3', name: 'Bob Johnson', email: 'bob@example.com' }
  ];
  
  const selectedUserLabel = $derived(
    users.find(user => user.id === selectedUserId)?.name ?? 'Select user'
  );
</script>

<div class="space-y-2">
  <label class="text-sm font-medium">Assign to User</label>
  <Select.Root type="single" bind:value={selectedUserId}>
    <Select.Trigger class="w-64">
      {selectedUserLabel}
    </Select.Trigger>
    <Select.Content>
      {#each users as user}
        <Select.Item value={user.id}>
          <div class="flex flex-col">
            <span class="font-medium">{user.name}</span>
            <span class="text-xs text-muted-foreground">{user.email}</span>
          </div>
        </Select.Item>
      {/each}
    </Select.Content>
  </Select.Root>
</div>
```

### Example 3: Multiple Selection

```svelte
<script lang="ts">
  import * as Select from '$lib/components/ui/select';
  
  let selectedTags = $state<string[]>(['tag1']);
  
  const tagOptions = [
    { value: 'tag1', label: 'Important' },
    { value: 'tag2', label: 'Urgent' },
    { value: 'tag3', label: 'Review' },
    { value: 'tag4', label: 'Archive' }
  ];
  
  const selectedTagsLabel = $derived(() => {
    if (selectedTags.length === 0) return 'Select tags';
    if (selectedTags.length === 1) {
      return tagOptions.find(tag => tag.value === selectedTags[0])?.label ?? 'Select tags';
    }
    return `${selectedTags.length} tags selected`;
  });
</script>

<div class="space-y-2">
  <label class="text-sm font-medium">Tags</label>
  <Select.Root type="multiple" bind:value={selectedTags}>
    <Select.Trigger class="w-48">
      {selectedTagsLabel()}
    </Select.Trigger>
    <Select.Content>
      {#each tagOptions as tag}
        <Select.Item value={tag.value}>{tag.label}</Select.Item>
      {/each}
    </Select.Content>
  </Select.Root>
</div>
```

### Example 4: With Form Integration

```svelte
<script lang="ts">
  import * as Select from '$lib/components/ui/select';
  import { Label } from '$lib/components/ui/label';
  
  interface FormData {
    category: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
  }
  
  let formData = $state<FormData>({
    category: 'general',
    priority: 'medium'
  });
  
  const categoryOptions = [
    { value: 'general', label: 'General' },
    { value: 'technical', label: 'Technical' },
    { value: 'billing', label: 'Billing' },
    { value: 'support', label: 'Support' }
  ];
  
  const priorityOptions = [
    { value: 'low', label: 'Low Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'high', label: 'High Priority' },
    { value: 'urgent', label: 'Urgent' }
  ];
  
  const selectedCategoryLabel = $derived(
    categoryOptions.find(cat => cat.value === formData.category)?.label ?? 'Select category'
  );
  
  const selectedPriorityLabel = $derived(
    priorityOptions.find(pri => pri.value === formData.priority)?.label ?? 'Select priority'
  );
</script>

<form class="space-y-4">
  <div class="space-y-2">
    <Label for="category">Category *</Label>
    <Select.Root type="single" bind:value={formData.category}>
      <Select.Trigger class="w-full">
        {selectedCategoryLabel}
      </Select.Trigger>
      <Select.Content>
        {#each categoryOptions as category}
          <Select.Item value={category.value}>{category.label}</Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
  </div>
  
  <div class="space-y-2">
    <Label for="priority">Priority *</Label>
    <Select.Root type="single" bind:value={formData.priority}>
      <Select.Trigger class="w-full">
        {selectedPriorityLabel}
      </Select.Trigger>
      <Select.Content>
        {#each priorityOptions as priority}
          <Select.Item value={priority.value}>{priority.label}</Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
  </div>
</form>
```

## Common Patterns and Best Practices

### 1. Always Define Options Array

```svelte
// ✅ Good - centralized options
const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'pending', label: 'Pending' }
];

// ❌ Avoid - hardcoded options in template
<Select.Item value="active">Active</Select.Item>
<Select.Item value="inactive">Inactive</Select.Item>
```

### 2. Use Meaningful Default Values

```svelte
// ✅ Good - default to a valid option
let status = $state('active');

// ❌ Avoid - empty or invalid defaults
let status = $state('');
let status = $state('invalid-value');
```

### 3. Handle Edge Cases in Derived Values

```svelte
// ✅ Good - handles missing values gracefully
const selectedLabel = $derived(
  options.find(option => option.value === selectedValue)?.label ?? 'Select option'
);

// ❌ Avoid - can cause errors
const selectedLabel = $derived(
  options.find(option => option.value === selectedValue).label
);
```

### 4. Type Your State Variables

```svelte
// ✅ Good - explicit typing
let priority = $state<'low' | 'medium' | 'high'>('medium');
let selectedIds = $state<string[]>([]);

// ❌ Avoid - implicit any type
let priority = $state('medium');
let selectedIds = $state([]);
```

## Troubleshooting

### Issue: Selected value not showing in trigger

**Cause**: Using `<Select.Value />` instead of rendering the actual value.

**Solution**: Replace `<Select.Value />` with a derived value that shows the selected option's label.

### Issue: TypeScript errors about missing `type` prop

**Cause**: The `type` prop is required by Bits UI.

**Solution**: Always add `type="single"` or `type="multiple"` to `Select.Root`.

### Issue: Select shows "undefined" or empty

**Cause**: The selected value doesn't match any option values, or the derived value calculation is incorrect.

**Solution**: 
1. Ensure default value matches an option value
2. Check that the derived value has a fallback (`?? 'Placeholder'`)
3. Verify option values are strings, not objects

### Issue: Multiple selection not working

**Cause**: Using `type="single"` with an array value, or vice versa.

**Solution**: 
- Use `type="multiple"` with array state: `let values = $state<string[]>([])`
- Use `type="single"` with string state: `let value = $state<string>('')`

## Migration from Old Pattern

If you have existing Select components that aren't working, here's how to migrate:

### Before (Broken)
```svelte
<Select.Root bind:value={myValue}>
  <Select.Trigger>
    <Select.Value placeholder="Choose" />
  </Select.Trigger>
  <Select.Content>
    <Select.Item value="a">Option A</Select.Item>
    <Select.Item value="b">Option B</Select.Item>
  </Select.Content>
</Select.Root>
```

### After (Working)
```svelte
<script>
  const options = [
    { value: 'a', label: 'Option A' },
    { value: 'b', label: 'Option B' }
  ];
  
  const selectedLabel = $derived(
    options.find(opt => opt.value === myValue)?.label ?? 'Choose'
  );
</script>

<Select.Root type="single" bind:value={myValue}>
  <Select.Trigger>
    {selectedLabel}
  </Select.Trigger>
  <Select.Content>
    {#each options as option}
      <Select.Item value={option.value}>{option.label}</Select.Item>
    {/each}
  </Select.Content>
</Select.Root>
```

## Summary

The key to making Select components work properly in this project:

1. **Always add `type="single"` or `type="multiple"`**
2. **Replace `<Select.Value />` with derived values**
3. **Define options arrays with value/label pairs**
4. **Use `$derived()` to calculate display labels**
5. **Provide fallback values for edge cases**

Following these patterns will ensure your Select components always display the selected value correctly and provide a good user experience.