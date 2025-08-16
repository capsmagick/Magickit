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
**CRITICAL:** `{@const}` must be the immediate child of specific block contexts. **NEVER** place `{@const}` inside regular HTML elements or nested within other elements.

**Valid parent contexts for `{@const}`:**
- `{#snippet}`
- `{#if}`, `{:else if}`, `{:else}`
- `{#each}`
- `{:then}`, `{:catch}`
- `<svelte:fragment>`
- `<svelte:boundary>`
- `<Component>`

```svelte
<!-- ✅ CORRECT - {@const} as immediate child of {#each} -->
{#each filteredAlerts as alert}
  {@const CategoryIcon = getCategoryIcon(alert.category)}
  {@const statusInfo = getStatusBadge(alert.status)}
  <Table.Row>
    <Table.Cell>
      <div class="flex items-center gap-2">
        <CategoryIcon class="h-4 w-4" />
        <span>{alert.title}</span>
      </div>
    </Table.Cell>
    <Table.Cell>
      <statusInfo.icon class="h-3 w-3" />
      <Badge variant={statusInfo.variant}>{statusInfo.text}</Badge>
    </Table.Cell>
  </Table.Row>
{/each}

<!-- ✅ CORRECT - {@const} as immediate child of {#if} -->
{#if selectedAlert}
  {@const CategoryIcon = getCategoryIcon(selectedAlert.category)}
  <div class="alert-details">
    <CategoryIcon class="h-6 w-6" />
    <span>{selectedAlert.title}</span>
  </div>
{/if}

<!-- ❌ INCORRECT - {@const} inside Table.Cell (not a valid parent) -->
{#each filteredAlerts as alert}
  <Table.Row>
    <Table.Cell>
      <div class="flex items-center gap-2">
        {@const CategoryIcon = getCategoryIcon(alert.category)}
        <CategoryIcon class="h-4 w-4" />
      </div>
    </Table.Cell>
  </Table.Row>
{/each}

<!-- ❌ INCORRECT - {@const} inside regular div -->
<div class="flex items-center gap-2">
  {@const ItemIcon = getIcon(selectedItem.type)}
  <ItemIcon class="h-4 w-4" />
  <span>{selectedItem.name}</span>
</div>
```

### ✅ REQUIRED: Multiple {@const} Declarations
**ALWAYS** place all `{@const}` declarations at the beginning of their parent block, before any other content.

```svelte
<!-- ✅ CORRECT - All {@const} declarations at the start -->
{#each notifications as notification}
  {@const statusInfo = getStatusBadge(notification.status)}
  {@const priorityInfo = getPriorityBadge(notification.priority)}
  {@const typeInfo = getTypeBadge(notification.type)}
  <Table.Row>
    <Table.Cell>
      <statusInfo.icon class="h-3 w-3" />
      <Badge variant={statusInfo.variant}>{statusInfo.text}</Badge>
    </Table.Cell>
    <Table.Cell>
      <Badge variant={priorityInfo.variant}>{priorityInfo.text}</Badge>
    </Table.Cell>
  </Table.Row>
{/each}

<!-- ❌ INCORRECT - {@const} scattered throughout -->
{#each notifications as notification}
  <Table.Row>
    <Table.Cell>
      {@const statusInfo = getStatusBadge(notification.status)}
      <statusInfo.icon class="h-3 w-3" />
    </Table.Cell>
    <Table.Cell>
      {@const priorityInfo = getPriorityBadge(notification.priority)}
      <Badge variant={priorityInfo.variant}>{priorityInfo.text}</Badge>
    </Table.Cell>
  </Table.Row>
{/each}
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
- [ ] `{@const}` only used within valid block contexts (immediate children of `{#if}`, `{#each}`, etc.)
- [ ] All `{@const}` declarations placed at the beginning of their parent block
- [ ] No broken HTML tag formatting
- [ ] Script tags properly separated from other elements
- [ ] Component imports use correct syntax (no `.Root` for components that don't export it)
- [ ] Badge components use `<Badge>` not `<Badge.Root>`
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

### Error: "{@const} must be the immediate child of {#snippet}, {#if}, {:else if}, {:else}, {#each}, {:then}, {:catch}, <svelte:fragment>, <svelte:boundary> or <Component>"
**Solution:** Move `{@const}` declarations to be immediate children of valid parent blocks:

```svelte
<!-- Before - CAUSES BUILD ERROR -->
{#each items as item}
  <Table.Row>
    <Table.Cell>
      <div class="flex items-center gap-2">
        {@const ItemIcon = getIcon(item.type)}
        <ItemIcon class="h-4 w-4" />
      </div>
    </Table.Cell>
  </Table.Row>
{/each}

<!-- After - FIXED -->
{#each items as item}
  {@const ItemIcon = getIcon(item.type)}
  <Table.Row>
    <Table.Cell>
      <div class="flex items-center gap-2">
        <ItemIcon class="h-4 w-4" />
      </div>
    </Table.Cell>
  </Table.Row>
{/each}
```

### Error: "Root" is not exported by component
**Solution:** Use correct component import syntax - avoid `.Root` suffix for components that don't export it:

```svelte
<!-- Before - CAUSES WARNINGS -->
<script lang="ts">
  import { Badge } from '$lib/components/ui/badge';
</script>

<Badge.Root variant="default">
  Active
</Badge.Root>

<!-- After - FIXED -->
<script lang="ts">
  import { Badge } from '$lib/components/ui/badge';
</script>

<Badge variant="default">
  Active
</Badge>
```

### Error: "Cannot call a namespace" with Badge component
**Solution:** Check component exports and use correct syntax:

```svelte
<!-- Before - CAUSES ERRORS -->
<Badge.Root variant="secondary">
  {user.role}
</Badge.Root>

<!-- After - FIXED -->
<Badge variant="secondary">
  {user.role}
</Badge>
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
3. **Fix syntax issues** following the correct patterns:
   - For `{@const}` errors: Move declarations to be immediate children of valid blocks
   - For component import errors: Check component exports and remove incorrect `.Root` usage
   - For namespace errors: Verify correct component syntax
4. **Verify fix** with `bun run build`
5. **Run full test suite** to ensure no regressions

### Quick Fix Commands for Common Issues

```bash
# Check for {@const} placement issues
grep -n "{@const" src/**/*.svelte

# Check for incorrect Badge.Root usage
grep -n "Badge\.Root" src/**/*.svelte

# Check for broken component imports
grep -n "\.Root" src/**/*.svelte

# Run build to verify fixes
bun run build
```

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

## Notification System Specific Patterns

### ✅ REQUIRED: Table Component {@const} Usage
**ALWAYS** place `{@const}` declarations at the beginning of `{#each}` blocks when working with table rows that need computed values.

```svelte
<!-- ✅ CORRECT - Notification system pattern -->
<Table.Body>
  {#each filteredNotifications as notification}
    {@const statusInfo = getStatusBadge(notification.status)}
    {@const priorityInfo = getPriorityBadge(notification.priority)}
    {@const typeInfo = getTypeBadge(notification.type)}
    <Table.Row class="transition-colors duration-200 hover:bg-muted/50">
      <Table.Cell>
        <div class="flex items-center gap-2">
          <statusInfo.icon class="h-3 w-3" />
          <Badge variant={statusInfo.variant} class="text-xs">
            {statusInfo.text}
          </Badge>
        </div>
      </Table.Cell>
      <Table.Cell>
        <Badge variant={priorityInfo.variant} class="text-xs">
          {priorityInfo.text}
        </Badge>
      </Table.Cell>
    </Table.Row>
  {/each}
</Table.Body>

<!-- ❌ INCORRECT - Will cause build errors -->
<Table.Body>
  {#each filteredNotifications as notification}
    <Table.Row class="transition-colors duration-200 hover:bg-muted/50">
      <Table.Cell>
        <div class="flex items-center gap-2">
          {@const statusInfo = getStatusBadge(notification.status)}
          <statusInfo.icon class="h-3 w-3" />
        </div>
      </Table.Cell>
    </Table.Row>
  {/each}
</Table.Body>
```

### ✅ REQUIRED: Dialog Component {@const} Usage
**ALWAYS** place `{@const}` declarations immediately after conditional blocks in dialogs.

```svelte
<!-- ✅ CORRECT - Dialog pattern -->
<Dialog.Root bind:open={showDetailsDialog}>
  <Dialog.Content>
    {#if selectedAlert}
      {@const CategoryIcon = getCategoryIcon(selectedAlert.category)}
      <div class="space-y-6">
        <div class="flex items-start gap-4">
          <div class="rounded-lg p-3 bg-muted">
            <CategoryIcon class="h-6 w-6" />
          </div>
          <div class="flex-1 space-y-2">
            <h3 class="text-lg font-semibold">{selectedAlert.title}</h3>
          </div>
        </div>
      </div>
    {/if}
  </Dialog.Content>
</Dialog.Root>

<!-- ❌ INCORRECT - Will cause build errors -->
<Dialog.Root bind:open={showDetailsDialog}>
  <Dialog.Content>
    {#if selectedAlert}
      <div class="space-y-6">
        <div class="flex items-start gap-4">
          {@const CategoryIcon = getCategoryIcon(selectedAlert.category)}
          <div class="rounded-lg p-3 bg-muted">
            <CategoryIcon class="h-6 w-6" />
          </div>
        </div>
      </div>
    {/if}
  </Dialog.Content>
</Dialog.Root>
```

### ✅ REQUIRED: Component Icon Pattern
**ALWAYS** use conditional rendering or proper `{@const}` placement when working with dynamic icon components.

```svelte
<!-- ✅ CORRECT - Dynamic icon with {@const} -->
{#each alerts as alert}
  {@const CategoryIcon = getCategoryIcon(alert.category)}
  <div class="flex items-center gap-3">
    <div class="rounded-lg p-2 bg-muted">
      <CategoryIcon class="h-4 w-4" />
    </div>
    <span>{alert.title}</span>
  </div>
{/each}

<!-- ✅ CORRECT - Alternative with conditional rendering -->
{#each alerts as alert}
  <div class="flex items-center gap-3">
    <div class="rounded-lg p-2 bg-muted">
      {#if alert.category === 'performance'}
        <Activity class="h-4 w-4" />
      {:else if alert.category === 'database'}
        <Database class="h-4 w-4" />
      {:else if alert.category === 'security'}
        <Shield class="h-4 w-4" />
      {:else}
        <AlertTriangle class="h-4 w-4" />
      {/if}
    </div>
    <span>{alert.title}</span>
  </div>
{/each}
```

## Admin Panel Component Patterns

### ✅ REQUIRED: Consistent Badge Usage
**ALWAYS** use the correct Badge component syntax throughout admin panels.

```svelte
<!-- ✅ CORRECT - Standard badge usage -->
<script lang="ts">
  import { Badge } from '$lib/components/ui/badge';
</script>

<Badge variant="default">Active</Badge>
<Badge variant="secondary">Inactive</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Draft</Badge>

<!-- ❌ INCORRECT - Will cause import errors -->
<Badge.Root variant="default">Active</Badge.Root>
```

### ✅ REQUIRED: Status Badge Helper Functions
**ALWAYS** create helper functions that return consistent badge configurations.

```svelte
<!-- ✅ CORRECT - Status badge helper pattern -->
<script lang="ts">
  function getStatusBadge(status: string) {
    switch (status) {
      case 'active':
        return { variant: 'default' as const, text: 'Active', icon: CheckCircle };
      case 'inactive':
        return { variant: 'secondary' as const, text: 'Inactive', icon: XCircle };
      case 'error':
        return { variant: 'destructive' as const, text: 'Error', icon: AlertTriangle };
      default:
        return { variant: 'outline' as const, text: status, icon: Clock };
    }
  }
</script>

{#each items as item}
  {@const statusInfo = getStatusBadge(item.status)}
  <div class="flex items-center gap-2">
    <statusInfo.icon class="h-3 w-3" />
    <Badge variant={statusInfo.variant} class="text-xs">
      {statusInfo.text}
    </Badge>
  </div>
{/each}
```

## Build Error Prevention Checklist

### Before Creating New Components
- [ ] Check if component exports `.Root` or uses direct export
- [ ] Plan `{@const}` usage and identify valid parent blocks
- [ ] Verify all reactive variables will use `$state()`
- [ ] Confirm proper TypeScript types for complex state

### During Development
- [ ] Run `bun run build` frequently to catch errors early
- [ ] Test `{@const}` placement before adding complex logic
- [ ] Verify component imports work correctly
- [ ] Check that all dynamic icons have proper conditional rendering

### Before Committing
- [ ] Run full build: `bun run build`
- [ ] Check for any component import warnings
- [ ] Verify all `{@const}` declarations are properly placed
- [ ] Confirm no broken HTML tag formatting
- [ ] Test that all interactive elements work correctly

By following these updated patterns, especially the `{@const}` placement rules and component import patterns, we can prevent the build errors encountered during the notification system implementation and maintain consistent, error-free code throughout the Magickit project.