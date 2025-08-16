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
  let isLoading = $state(false);
  let items = $state<Item[]>([]);
  let formData = $state({
    title: '',
    description: ''
  });
</script>

<!-- ❌ INCORRECT - Will cause build warnings -->
<script lang="ts">
  let name = '';
  let isLoading = false;
  let items: Item[] = [];
</script>
```

### ✅ REQUIRED: Use $derived() for Computed Values
**ALWAYS** assign to a variable and use `$derived.by()` for complex computations.

```svelte
<!-- ✅ CORRECT -->
<script lang="ts">
  let items = $state<Item[]>([]);
  let searchTerm = $state('');
  
  let paginatedItems = $derived(items.slice(0, 10));
  let filteredItems = $derived.by(() => {
    if (!searchTerm) return items;
    return items.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
  });
</script>
```

## Template Syntax Standards

### ✅ REQUIRED: Proper {@const} Usage
**CRITICAL:** `{@const}` must be the immediate child of specific block contexts.

**Valid parent contexts:** `{#if}`, `{#each}`, `{#snippet}`, `{:then}`, `{:catch}`, `<Component>`

```svelte
<!-- ✅ CORRECT - {@const} as immediate child of {#each} -->
{#each filteredAlerts as alert}
  {@const CategoryIcon = getCategoryIcon(alert.category)}
  {@const statusInfo = getStatusBadge(alert.status)}
  <Table.Row>
    <Table.Cell>
      <div class="flex items-center gap-2">
        <CategoryIcon class="h-4 w-4" />
        <Badge variant={statusInfo.variant}>{statusInfo.text}</Badge>
      </div>
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

<!-- ❌ INCORRECT - {@const} inside HTML elements -->
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
```

### ✅ REQUIRED: Multiple {@const} Declarations
**ALWAYS** place all `{@const}` declarations at the beginning of their parent block.

```svelte
<!-- ✅ CORRECT -->
{#each notifications as notification}
  {@const statusInfo = getStatusBadge(notification.status)}
  {@const priorityInfo = getPriorityBadge(notification.priority)}
  <Table.Row>
    <Table.Cell>
      <Badge variant={statusInfo.variant}>{statusInfo.text}</Badge>
    </Table.Cell>
    <Table.Cell>
      <Badge variant={priorityInfo.variant}>{priorityInfo.text}</Badge>
    </Table.Cell>
  </Table.Row>
{/each}
```

## Component Import Standards

### ✅ REQUIRED: Badge Component Imports
**ALWAYS** use direct imports for Badge components, never namespace imports.

```svelte
<!-- ✅ CORRECT -->
<script lang="ts">
  import { Badge } from '$lib/components/ui/badge/index.js';
</script>

<Badge variant="default">Active</Badge>

<!-- ❌ INCORRECT - Causes "Cannot call a namespace" errors -->
<script lang="ts">
  import * as Badge from '$lib/components/ui/badge/index.js';
</script>

<Badge variant="default">Active</Badge>
```

### ✅ REQUIRED: Select Component Binding
```svelte
<!-- ✅ CORRECT -->
<Select.Root bind:value={selectedValue}>
  <Select.Trigger><Select.Value placeholder="Select option" /></Select.Trigger>
  <Select.Content>
    <Select.Item value="option1">Option 1</Select.Item>
  </Select.Content>
</Select.Root>

<!-- ❌ INCORRECT -->
<Select.Root bind:selected={selectedValue}>
```

### ✅ REQUIRED: Replace <svelte:component> with Conditional Rendering
```svelte
<!-- ✅ CORRECT -->
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

## Build Validation Checklist

### Pre-Commit Checklist
- [ ] All reactive variables use `$state()` syntax
- [ ] All computed values use `let variable = $derived()` syntax
- [ ] `{@const}` only used within valid block contexts
- [ ] All `{@const}` declarations placed at the beginning of their parent block
- [ ] Badge components use direct imports (`import { Badge }`)
- [ ] Build runs without warnings: `bun run build`

### Build Command Verification
```bash
# Check for build errors and warnings
bun run build

# Run type checking
bun run check
```

## Common Error Patterns and Solutions

### Error: "{@const} must be the immediate child"
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

### Error: "Cannot call a namespace" with Badge component
**Solution:** Use direct import instead of namespace import:

```svelte
<!-- Before - CAUSES ERRORS -->
<script lang="ts">
  import * as Badge from '$lib/components/ui/badge/index.js';
</script>

<!-- After - FIXED -->
<script lang="ts">
  import { Badge } from '$lib/components/ui/badge/index.js';
</script>
```

### Error: "Cannot use `{@render children(...)}` if the parent component uses `let:` directives"
**Solution:** Move DialogContent inside the Dialog component when using `let:` directives:

```svelte
<!-- Before - CAUSES ERROR -->
<Dialog bind:open={showDialog}>
  <DialogTrigger asChild let:builder>
    <Button builders={[builder]}>Open</Button>
  </DialogTrigger>
</Dialog>

<DialogContent>
  <!-- Dialog content -->
</DialogContent>

<!-- After - FIXED -->
<Dialog bind:open={showDialog}>
  <DialogTrigger asChild let:builder>
    <Button builders={[builder]}>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <!-- Dialog content -->
  </DialogContent>
</Dialog>
```

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

## Quick Fix Commands

```bash
# Check for {@const} placement issues
grep -n "{@const" src/**/*.svelte

# Check for incorrect Badge namespace imports
grep -n "import \* as Badge" src/**/*.svelte

# Check for Dialog components with let: directives that need DialogContent inside
grep -A 5 -B 5 "let:builder" src/**/*.svelte

# Run build to verify fixes
bun run build
```

## Support System Implementation Lessons

### ✅ REQUIRED: Admin Support System Build Error Prevention
Based on the support system implementation, these specific patterns must be followed:

#### {@const} Placement in Support Pages
**CRITICAL:** When implementing admin support pages with dynamic status badges and icons:

```svelte
<!-- ✅ CORRECT - Knowledge Base Page Pattern -->
{#each filteredArticles as article}
  {@const statusInfo = getStatusBadge(article.status)}
  <Card.Root class="transition-shadow duration-200 hover:shadow-md">
    <Card.Header class="space-y-2">
      <div class="flex items-start justify-between">
        <div class="space-y-1 flex-1">
          <Card.Title class="text-lg line-clamp-2">{article.title}</Card.Title>
          <div class="flex items-center gap-2">
            <Badge variant={statusInfo.variant}>
              {statusInfo.text}
            </Badge>
          </div>
        </div>
      </div>
    </Card.Header>
  </Card.Root>
{/each}

<!-- ✅ CORRECT - Support Tickets Dialog Pattern -->
{#if selectedTicket}
  {@const statusInfo = getStatusBadge(selectedTicket.status)}
  {@const priorityInfo = getPriorityBadge(selectedTicket.priority)}
  <div class="space-y-6">
    <div class="rounded-lg border bg-muted/50 p-4">
      <div class="flex items-start justify-between mb-3">
        <h4 class="font-medium">{selectedTicket.title}</h4>
        <div class="flex items-center gap-2">
          <Badge variant={statusInfo.variant} class="flex items-center gap-1">
            <statusInfo.icon class="h-3 w-3" />
            {statusInfo.text}
          </Badge>
          <Badge variant={priorityInfo.variant}>
            {priorityInfo.text}
          </Badge>
        </div>
      </div>
    </div>
  </div>
{/if}
```

#### Support System Sidebar Integration
**ALWAYS** ensure support system pages are properly connected to sidebar navigation:

```typescript
// ✅ CORRECT - Sidebar Configuration
{
  title: 'Support',
  url: '/admin/support',
  icon: LifeBuoyIcon,
  items: [
    { title: 'Support Tickets', url: '/admin/support/tickets' },
    { title: 'Knowledge Base', url: '/admin/support/knowledge-base' },
    { title: 'Feedback', url: '/admin/support/feedback' }
  ]
}
```

### Build Error Resolution Workflow for Support Systems

When implementing admin support systems, follow this exact sequence:

1. **Create Route Structure First**
   ```bash
   src/routes/admin/support/
   ├── +page.svelte (overview)
   ├── tickets/+page.svelte
   ├── knowledge-base/+page.svelte
   └── feedback/+page.svelte
   ```

2. **Update Sidebar Configuration**
   - Use direct URLs for each support function
   - Avoid placeholder URLs that point to the same page

3. **Implement Badge Helper Functions**
   ```svelte
   function getStatusBadge(status: string) {
     switch (status) {
       case 'open':
         return { variant: 'destructive' as const, text: 'Open', icon: AlertCircle };
       case 'in_progress':
         return { variant: 'secondary' as const, text: 'In Progress', icon: Clock };
       case 'resolved':
         return { variant: 'default' as const, text: 'Resolved', icon: CheckCircle };
       default:
         return { variant: 'outline' as const, text: status, icon: AlertCircle };
     }
   }
   ```

4. **Place {@const} Declarations Correctly**
   - Always at the beginning of `{#each}` or `{#if}` blocks
   - Never inside HTML elements like `<div>`, `<Card.Header>`, etc.

5. **Use Direct Component Imports**
   - `import { Badge } from '$lib/components/ui/badge/index.js';`
   - Never `import * as Badge from '$lib/components/ui/badge/index.js';`

6. **Test Build After Each Page**
   ```bash
   bun run build
   ```

### Support System Quality Checklist

Before committing support system changes:

- [ ] All support pages have separate routes (`/tickets`, `/knowledge-base`, `/feedback`)
- [ ] Sidebar navigation points to correct URLs for each support function
- [ ] Badge components use direct imports (`import { Badge }`)
- [ ] All `{@const}` declarations are immediate children of valid blocks
- [ ] Status badge helper functions return proper TypeScript types (`as const`)
- [ ] Build completes without errors: `bun run build`
- [ ] All support pages are accessible from admin sidebar
- [ ] Dialog components with `{@const}` follow the correct pattern

### Support System Testing Commands

```bash
# Verify support system build
bun run build

# Check for {@const} placement issues in support pages
grep -n "{@const" src/routes/admin/support/**/*.svelte

# Check for Badge namespace imports in admin pages
grep -n "import \* as Badge" src/routes/admin/**/*.svelte

# Verify sidebar navigation structure
grep -A 10 "Support" src/lib/components/app-sidebar.svelte
```

This support system implementation serves as a reference for future admin panel development, ensuring consistent patterns and preventing the specific build errors encountered during this implementation.