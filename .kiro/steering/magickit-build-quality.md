---
description: Build quality standards and common error prevention for Magickit project
alwaysApply: true
---

# Magickit Build Quality Standards

## Overview
This document outlines critical build quality standards and common error prevention patterns based on real issues encountered during development. Following these guidelines ensures clean builds and prevents common compilation errors.

## Svelte 5 Reactivity Standards

### ✅ REQUIRED: Use $state() for All Reactive Variables
**NEVER** use legacy `let` declarations for reactive variables. **ALWAYS** use `$state()`.

```svelte
<!-- ✅ CORRECT -->
<script lang="ts">
  let name = $state('');
  let email = $state('');
  let isLoading = $state(false);
  let error = $state('');
  let items = $state<Item[]>([]);
  let formData = $state({
    title: '',
    description: ''
  });
</script>

<!-- ❌ INCORRECT - Will cause build warnings -->
<script lang="ts">
  let name = '';
  let email = '';
  let isLoading = false;
  let error = '';
  let items: Item[] = [];
  let formData = {
    title: '',
    description: ''
  };
</script>
```

### ✅ REQUIRED: Use $derived() for Computed Values
**NEVER** use standalone `$derived` syntax. **ALWAYS** assign to a variable.

```svelte
<!-- ✅ CORRECT -->
<script lang="ts">
  let items = $state<Item[]>([]);
  let currentPage = $state(1);
  let itemsPerPage = $state(10);
  
  // Computed values must be assigned to variables
  let paginatedItems = $derived(items.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  ));
  
  let totalPages = $derived(Math.ceil(items.length / itemsPerPage));
</script>

<!-- ❌ INCORRECT - Will cause build errors -->
<script lang="ts">
  // This syntax is invalid in Svelte 5
  $derived paginatedItems = items.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
</script>
```

## Code Formatting and Syntax Standards

### ✅ REQUIRED: Proper Script Tag Formatting
**ALWAYS** ensure proper line breaks between script tags and other elements.

```svelte
<!-- ✅ CORRECT -->
<script lang="ts">
  // Script content
</script>

<svelte:head>
  <title>Page Title</title>
</svelte:head>

<div class="content">
  <!-- Component content -->
</div>

<!-- ❌ INCORRECT - Will cause build errors -->
<script lang="ts">
  // Script content
</script><svelte:head>
  <title>Page Title</title>
</svelte:head>
```

### ✅ REQUIRED: Proper Comment Formatting
**NEVER** break comments across lines in a way that creates invalid syntax.

```svelte
<!-- ✅ CORRECT -->
<script lang="ts">
  const session = authClient.useSession();
  
  // Load data on mount
  onMount(async () => {
    await loadData();
  });
</script>

<!-- ❌ INCORRECT - Will cause build errors -->
<script lang="ts">
  const session = authClient.useSession(); // Load d
ata on mount
  onMount(async () => {
    await loadData();
  });
</script>
```

### ✅ REQUIRED: Proper Function Declaration Formatting
**NEVER** break function declarations across lines improperly.

```svelte
<!-- ✅ CORRECT -->
<script lang="ts">
  async function handleSubmit() {
    // Function logic
  }
  
  function generateData() {
    // Function logic
  }
</script>

<!-- ❌ INCORRECT - Will cause build errors -->
<script lang="ts">
  async fun
ction handleSubmit() {
    // Function logic
  }
</script>
```

## Array and Object Syntax Standards

### ✅ REQUIRED: Proper Array Closing with $state()
**ALWAYS** ensure proper parentheses and bracket matching when using `$state()` with arrays.

```svelte
<!-- ✅ CORRECT -->
<script lang="ts">
  let items = $state([
    { id: '1', name: 'Item 1' },
    { id: '2', name: 'Item 2' }
  ]);
  
  let config = $state({
    enabled: true,
    settings: {
      theme: 'dark'
    }
  });
</script>

<!-- ❌ INCORRECT - Will cause build errors -->
<script lang="ts">
  let items = $state([
    { id: '1', name: 'Item 1' },
    { id: '2', name: 'Item 2' }
  ];  // Missing closing parenthesis
  
  let config = $state({
    enabled: true,
    settings: {
      theme: 'dark'
    }
  };  // Missing closing parenthesis
</script>
```

## Template Syntax Standards

### ✅ REQUIRED: Proper {@const} Usage
**NEVER** use `{@const}` outside of valid block contexts. **ALWAYS** wrap in conditional blocks when needed.

```svelte
<!-- ✅ CORRECT -->
{#if selectedItem}
  {@const ItemIcon = getIcon(selectedItem.type)}
  <ItemIcon class="h-4 w-4" />
  <span>{selectedItem.name}</span>
{/if}

<!-- ✅ CORRECT - Alternative approach -->
{#each items as item}
  {@const ItemIcon = getIcon(item.type)}
  <div class="flex items-center gap-2">
    <ItemIcon class="h-4 w-4" />
    <span>{item.name}</span>
  </div>
{/each}

<!-- ❌ INCORRECT - Will cause build errors -->
<div class="flex items-center gap-2">
  {@const ItemIcon = getIcon(selectedItem.type)}
  <ItemIcon class="h-4 w-4" />
  <span>{selectedItem.name}</span>
</div>
```

### ✅ REQUIRED: Proper HTML Tag Formatting
**NEVER** break HTML tags across lines improperly.

```svelte
<!-- ✅ CORRECT -->
</div>

<!-- Edit Dialog -->
<Dialog bind:open={showEditDialog}>
  <DialogContent>
    <!-- Dialog content -->
  </DialogContent>
</Dialog>

<!-- ❌ INCORRECT - Will cause build errors -->
</div><
!-- Edit Dialog -->
<Dialog bind:open={showEditDialog}>
```

## Build Validation Checklist

Before committing code, **ALWAYS** verify:

### Pre-Commit Checklist
- [ ] All reactive variables use `$state()` syntax
- [ ] All computed values use `let variable = $derived()` syntax
- [ ] No broken comments or function declarations
- [ ] Proper parentheses/bracket matching in `$state()` declarations
- [ ] `{@const}` only used within valid block contexts
- [ ] No broken HTML tag formatting
- [ ] Script tags properly separated from other elements
- [ ] Build runs without warnings: `bun run build`

### Build Command Verification
**ALWAYS** run these commands before committing:

```bash
# Check for build errors and warnings
bun run build

# Run type checking
bun run check

# Run linting
bun run lint

# Run tests
bun run test
```

## Common Error Patterns and Solutions

### Error: "is updated, but is not declared with $state(...)"
**Solution:** Convert all reactive variables to use `$state()`:

```svelte
<!-- Before -->
let isLoading = false;
let items = [];

<!-- After -->
let isLoading = $state(false);
let items = $state([]);
```

### Error: "Unexpected token" with $derived
**Solution:** Use proper variable assignment syntax:

```svelte
<!-- Before -->
$derived paginatedItems = items.slice(0, 10);

<!-- After -->
let paginatedItems = $derived(items.slice(0, 10));
```

### Error: "Expected a valid element or component name"
**Solution:** Fix broken HTML tag formatting:

```svelte
<!-- Before -->
</div><
!-- Comment -->

<!-- After -->
</div>

<!-- Comment -->
```

### Error: "Unexpected token" in object/array
**Solution:** Check parentheses matching in `$state()`:

```svelte
<!-- Before -->
let config = $state({
  enabled: true
};

<!-- After -->
let config = $state({
  enabled: true
});
```

## Automated Quality Checks

### Pre-commit Hooks
Consider setting up pre-commit hooks to automatically check:

```json
{
  "scripts": {
    "pre-commit": "bun run lint && bun run check && bun run build"
  }
}
```

### IDE Configuration
Configure your IDE to:
- Show TypeScript errors in real-time
- Highlight Svelte syntax errors
- Auto-format on save
- Show build warnings immediately

## Emergency Build Fix Process

If build is broken:

1. **Identify the error type** from build output
2. **Check recent changes** for common patterns above
3. **Fix syntax issues** following the correct patterns
4. **Verify fix** with `bun run build`
5. **Run full test suite** to ensure no regressions

## Continuous Improvement

### Regular Maintenance
- Review build warnings weekly
- Update this document with new error patterns
- Share common fixes with the team
- Monitor build performance and optimization opportunities

### Team Standards
- All team members must follow these standards
- Code reviews must check for these patterns
- New team members must be trained on these standards
- Regular team discussions about build quality improvements

## Svelte 5 Migration Patterns

### ✅ REQUIRED: Use $derived.by() for Complex Computed Values
**NEVER** use `$derived(() => {...})` for functions that return values. **ALWAYS** use `$derived.by()`.

```svelte
<!-- ✅ CORRECT -->
<script lang="ts">
  let items = $state([]);
  let searchTerm = $state('');
  
  // Use $derived.by() for complex computations
  let filteredItems = $derived.by(() => {
    if (!searchTerm) return items;
    return items.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });
</script>

<!-- ❌ INCORRECT - Will cause type errors -->
<script lang="ts">
  let filteredItems = $derived(() => {
    if (!searchTerm) return items;
    return items.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });
</script>
```

### ✅ REQUIRED: Proper Select Component Binding
**NEVER** use `bind:selected` with Select components. **ALWAYS** use `bind:value`.

```svelte
<!-- ✅ CORRECT -->
<script lang="ts">
  let selectedValue = $state('');
</script>

<Select.Root bind:value={selectedValue}>
  <Select.Trigger>
    <Select.Value placeholder="Select option" />
  </Select.Trigger>
  <Select.Content>
    <Select.Item value="option1">Option 1</Select.Item>
    <Select.Item value="option2">Option 2</Select.Item>
  </Select.Content>
</Select.Root>

<!-- ❌ INCORRECT - Will cause binding errors -->
<Select.Root bind:selected={selectedValue}>
  <Select.Trigger>
    <Select.Value placeholder="Select option" />
  </Select.Trigger>
  <Select.Content>
    <Select.Item value="option1">Option 1</Select.Item>
  </Select.Content>
</Select.Root>
```

### ✅ REQUIRED: Proper Type Annotations for State Variables
**ALWAYS** provide proper TypeScript types for complex state variables.

```svelte
<!-- ✅ CORRECT -->
<script lang="ts">
  interface User {
    id: string;
    name: string;
    email: string;
  }
  
  let users = $state<User[]>([]);
  let selectedUser = $state<User | null>(null);
  let isLoading = $state(false);
</script>

<!-- ❌ INCORRECT - Can cause type inference issues -->
<script lang="ts">
  let users = $state([]);
  let selectedUser = $state(null);
</script>
```

### ✅ REQUIRED: Replace <svelte:component> with Conditional Rendering
**NEVER** use `<svelte:component>` in Svelte 5 runes mode. **ALWAYS** use conditional rendering.

```svelte
<!-- ✅ CORRECT -->
<script lang="ts">
  import { CheckCircle, XCircle, AlertTriangle } from '@lucide/svelte';
  
  let status = $state('success');
</script>

{#if status === 'success'}
  <CheckCircle class="h-4 w-4 text-green-500" />
{:else if status === 'error'}
  <XCircle class="h-4 w-4 text-red-500" />
{:else}
  <AlertTriangle class="h-4 w-4 text-yellow-500" />
{/if}

<!-- ❌ INCORRECT - Deprecated in runes mode -->
<svelte:component this={getStatusIcon(status)} class="h-4 w-4" />
```

## Data Integration Patterns

### ✅ REQUIRED: Proper API Integration with Loading States
**ALWAYS** implement proper loading states and error handling when integrating with APIs.

```svelte
<!-- ✅ CORRECT -->
<script lang="ts">
  let data = $state([]);
  let isLoading = $state(false);
  let error = $state('');
  
  async function loadData() {
    isLoading = true;
    error = '';
    
    try {
      const response = await fetch('/api/data');
      if (response.ok) {
        const result = await response.json();
        data = result.map(item => ({
          ...item,
          id: item._id,
          createdAt: new Date(item.createdAt)
        }));
      } else {
        const errorData = await response.json();
        error = errorData.error || 'Failed to load data';
      }
    } catch (err) {
      console.error('Error loading data:', err);
      error = 'Network error occurred';
    } finally {
      isLoading = false;
    }
  }
  
  // Load data on authentication
  $effect(() => {
    if (session.data?.user) {
      loadData();
    }
  });
</script>

<!-- ❌ INCORRECT - No error handling or loading states -->
<script lang="ts">
  let data = $state([]);
  
  async function loadData() {
    const response = await fetch('/api/data');
    data = await response.json();
  }
</script>
```

### ✅ REQUIRED: Proper Date Handling in API Responses
**ALWAYS** convert date strings from API responses to Date objects.

```svelte
<!-- ✅ CORRECT -->
<script lang="ts">
  async function loadData() {
    const response = await fetch('/api/data');
    const result = await response.json();
    
    data = result.map(item => ({
      ...item,
      id: item._id,
      createdAt: new Date(item.createdAt),
      updatedAt: item.updatedAt ? new Date(item.updatedAt) : null
    }));
  }
</script>

<!-- ❌ INCORRECT - Dates remain as strings -->
<script lang="ts">
  async function loadData() {
    const response = await fetch('/api/data');
    data = await response.json();
  }
</script>
```

## Common Migration Issues and Solutions

### Error: "is not assignable to parameter of type 'Iterable<unknown>'"
**Solution:** Use `$derived.by()` instead of `$derived()` for array computations:

```svelte
<!-- Before -->
let filteredItems = $derived(() => items.filter(item => item.active));

<!-- After -->
let filteredItems = $derived.by(() => items.filter(item => item.active));
```

### Error: "Cannot use 'bind:' with this property"
**Solution:** Use correct binding property for Select components:

```svelte
<!-- Before -->
<Select.Root bind:selected={value}>

<!-- After -->
<Select.Root bind:value={value}>
```

### Error: "<svelte:component> is deprecated in runes mode"
**Solution:** Replace with conditional rendering:

```svelte
<!-- Before -->
<svelte:component this={getIcon(type)} class="h-4 w-4" />

<!-- After -->
{#if type === 'success'}
  <CheckCircle class="h-4 w-4" />
{:else if type === 'error'}
  <XCircle class="h-4 w-4" />
{/if}
```

### Error: "Property does not exist on type 'never'"
**Solution:** Add proper type annotations:

```svelte
<!-- Before -->
let selectedItem = $state(null);

<!-- After -->
let selectedItem = $state<Item | null>(null);
```

By following these standards, we ensure consistent, error-free builds and maintain high code quality throughout the Magickit project.