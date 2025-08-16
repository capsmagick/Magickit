---
description: Specific component patterns and implementations for Magickit project
inclusion: fileMatch
fileMatchPattern: "src/lib/components/**/*.svelte"
---

# Magickit Component Patterns

## Component Development Guidelines

### Svelte 5 Component Structure
All components must follow this structure:

```svelte
<script lang="ts" module>
  // Module-level imports and types
  import type { ComponentProps } from 'svelte';
</script>

<script lang="ts">
  // Component imports
  import { Button } from '$lib/components/ui/button';
  
  // Props interface
  interface Props {
    title: string;
    description?: string;
    isLoading?: boolean;
  }
  
  // Props destructuring with defaults
  let { title, description, isLoading = false }: Props = $props();
  
  // State variables
  let isVisible = $state(true);
  let count = $state(0);
  
  // Derived state
  let displayTitle = $derived(title.toUpperCase());
  
  // Effects
  $effect(() => {
    // Side effects here
  });
  
  // Event handlers
  function handleClick() {
    count++;
  }
</script>

<!-- Component template -->
<div class="space-y-4">
  <!-- Component content -->
</div>
```

## Form Component Patterns

### Standard Form Component
```svelte
<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Loader2 } from '@lucide/svelte';
  
  interface Props {
    title: string;
    description: string;
    onSubmit: (data: FormData) => Promise<void>;
  }
  
  let { title, description, onSubmit }: Props = $props();
  
  let formData = $state({
    name: '',
    email: ''
  });
  
  let errors = $state<Record<string, string>>({});
  let isSubmitting = $state(false);
  
  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    isSubmitting = true;
    errors = {};
    
    try {
      await onSubmit(formData);
    } catch (error) {
      // Handle errors
    } finally {
      isSubmitting = false;
    }
  }
</script>

<Card>
  <CardHeader class="space-y-2">
    <CardTitle class="text-2xl">{title}</CardTitle>
    <CardDescription class="text-muted-foreground">{description}</CardDescription>
  </CardHeader>
  <CardContent class="space-y-6">
    <form class="space-y-6" on:submit={handleSubmit}>
      <div class="space-y-2">
        <Label for="name" class="text-sm font-medium">Name *</Label>
        <Input 
          id="name" 
          bind:value={formData.name}
          required 
          disabled={isSubmitting}
          aria-describedby="name-error"
          class="transition-colors duration-200"
        />
        {#if errors.name}
          <p id="name-error" class="text-sm text-destructive">{errors.name}</p>
        {/if}
      </div>
      
      <Button type="submit" class="w-full transition-colors duration-200" disabled={isSubmitting}>
        {#if isSubmitting}
          <Loader2 class="mr-2 h-4 w-4 animate-spin" />
          Processing...
        {:else}
          Submit
        {/if}
      </Button>
    </form>
  </CardContent>
</Card>
```

## Data Display Patterns

### Admin Table Component
```svelte
<script lang="ts">
  import { Card, CardContent } from '$lib/components/ui/card';
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { Loader2, Pencil, Trash2, Plus } from '@lucide/svelte';
  
  interface Item {
    _id: string;
    name: string;
    status: 'active' | 'inactive';
    createdAt: Date;
  }
  
  interface Props {
    items: Item[];
    isLoading?: boolean;
    onEdit: (item: Item) => void;
    onDelete: (item: Item) => void;
    onCreate: () => void;
  }
  
  let { items, isLoading = false, onEdit, onDelete, onCreate }: Props = $props();
</script>

<div class="space-y-6">
  <!-- Header with Actions -->
  <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    <div class="space-y-2">
      <h1 class="text-2xl font-bold">Items</h1>
      <p class="text-muted-foreground">Manage your items</p>
    </div>
    <Button onclick={onCreate} class="transition-colors duration-200">
      <Plus class="mr-2 h-4 w-4" />
      Add Item
    </Button>
  </div>

  <!-- Data Table -->
  <Card>
    <CardContent class="p-0">
      {#if isLoading}
        <div class="flex justify-center py-12">
          <Loader2 class="h-8 w-8 animate-spin text-primary" />
        </div>
      {:else if items.length === 0}
        <div class="text-center py-12 space-y-4">
          <div class="space-y-2">
            <h3 class="text-lg font-semibold">No items found</h3>
            <p class="text-muted-foreground">Get started by creating your first item.</p>
          </div>
          <Button onclick={onCreate} class="transition-colors duration-200">
            <Plus class="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>
      {:else}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead class="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {#each items as item}
              <TableRow class="transition-colors duration-200 hover:bg-muted/50">
                <TableCell class="font-medium">{item.name}</TableCell>
                <TableCell>
                  <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell class="text-sm text-muted-foreground">
                  {item.createdAt.toLocaleDateString()}
                </TableCell>
                <TableCell class="text-right">
                  <div class="flex items-center justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onclick={() => onEdit(item)}
                      aria-label="Edit item"
                      class="transition-colors duration-200"
                    >
                      <Pencil class="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onclick={() => onDelete(item)}
                      aria-label="Delete item"
                      class="transition-colors duration-200 hover:text-destructive"
                    >
                      <Trash2 class="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            {/each}
          </TableBody>
        </Table>
      {/if}
    </CardContent>
  </Card>
</div>
```

## Layout Patterns

### Page Layout Component
```svelte
<script lang="ts">
  interface Props {
    title: string;
    description?: string;
    children: import('svelte').Snippet;
  }
  
  let { title, description, children }: Props = $props();
</script>

<svelte:head>
  <title>{title} | Magickit</title>
  {#if description}
    <meta name="description" content={description} />
  {/if}
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="space-y-6">
    <div class="space-y-2">
      <h1 class="text-2xl lg:text-3xl font-bold">{title}</h1>
      {#if description}
        <p class="text-muted-foreground">{description}</p>
      {/if}
    </div>
    
    {@render children()}
  </div>
</div>
```

## Content Display Patterns

### Hero Section Component
```svelte
<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  
  interface Props {
    title: string;
    subtitle: string;
    primaryCTA: string;
    secondaryCTA?: string;
    onPrimaryClick: () => void;
    onSecondaryClick?: () => void;
  }
  
  let { title, subtitle, primaryCTA, secondaryCTA, onPrimaryClick, onSecondaryClick }: Props = $props();
</script>

<section class="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
  <div class="container mx-auto px-4 py-24">
    <div class="max-w-4xl mx-auto text-center space-y-6">
      <h1 class="text-2xl md:text-4xl lg:text-6xl font-bold">{title}</h1>
      <p class="text-lg md:text-xl opacity-90 max-w-2xl mx-auto leading-relaxed">{subtitle}</p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center pt-4">
        <Button 
          size="lg" 
          variant="secondary" 
          onclick={onPrimaryClick}
          class="transition-colors duration-200"
        >
          {primaryCTA}
        </Button>
        {#if secondaryCTA && onSecondaryClick}
          <Button 
            size="lg" 
            variant="outline" 
            onclick={onSecondaryClick}
            class="transition-colors duration-200"
          >
            {secondaryCTA}
          </Button>
        {/if}
      </div>
    </div>
  </div>
</section>
```

### Feature Grid Component
```svelte
<script lang="ts">
  import { Card, CardContent } from '$lib/components/ui/card';
  import type { ComponentType } from 'svelte';
  
  interface Feature {
    title: string;
    description: string;
    icon: ComponentType;
  }
  
  interface Props {
    title: string;
    description: string;
    features: Feature[];
  }
  
  let { title, description, features }: Props = $props();
</script>

<section class="py-16">
  <div class="container mx-auto px-4">
    <div class="text-center space-y-4 mb-12">
      <h2 class="text-2xl lg:text-3xl font-bold">{title}</h2>
      <p class="text-muted-foreground max-w-2xl mx-auto leading-relaxed">{description}</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each features as feature}
        <Card class="transition-shadow duration-200 hover:shadow-md">
          <CardContent class="p-6 text-center space-y-4">
            <div class="flex justify-center">
              <svelte:component this={feature.icon} class="h-12 w-12 text-primary" />
            </div>
            <div class="space-y-2">
              <h3 class="text-lg font-semibold">{feature.title}</h3>
              <p class="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </div>
          </CardContent>
        </Card>
      {/each}
    </div>
  </div>
</section>
```

## State Management Patterns

### Loading States
```svelte
<!-- Loading indicator -->
{#if isLoading}
  <div class="flex justify-center py-12">
    <Loader2 class="h-8 w-8 animate-spin text-primary" />
  </div>
{:else}
  <!-- Content -->
{/if}
```

### Empty States
```svelte
<!-- Empty state -->
{#if items.length === 0}
  <div class="text-center py-12 space-y-4">
    <Package class="h-12 w-12 mx-auto text-muted-foreground" />
    <div class="space-y-2">
      <h3 class="text-lg font-semibold">No items found</h3>
      <p class="text-muted-foreground">Get started by creating your first item.</p>
    </div>
    <Button onclick={createNew} class="transition-colors duration-200">
      <Plus class="mr-2 h-4 w-4" />
      Create Item
    </Button>
  </div>
{/if}
```

### Error States
```svelte
<!-- Error display -->
{#if error}
  <Alert variant="destructive">
    <AlertDescription>{error}</AlertDescription>
  </Alert>
{/if}
```

## Accessibility Patterns

### Form Accessibility
```svelte
<div class="space-y-2">
  <Label for="field-id" class="text-sm font-medium">Field Label *</Label>
  <Input 
    id="field-id" 
    bind:value={fieldValue}
    required 
    aria-describedby="field-help field-error"
    class="transition-colors duration-200"
  />
  <p id="field-help" class="text-xs text-muted-foreground">
    Helper text for the field
  </p>
  {#if fieldError}
    <p id="field-error" class="text-sm text-destructive">{fieldError}</p>
  {/if}
</div>
```

### Button Accessibility
```svelte
<Button 
  variant="ghost" 
  size="icon" 
  onclick={handleAction}
  aria-label="Descriptive action label"
  class="transition-colors duration-200"
>
  <Icon class="h-4 w-4" />
</Button>
```

## Performance Patterns

### Lazy Loading
```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  
  let isVisible = $state(false);
  let element: HTMLElement;
  
  onMount(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        isVisible = true;
        observer.disconnect();
      }
    });
    
    if (element) observer.observe(element);
    
    return () => observer.disconnect();
  });
</script>

<div bind:this={element}>
  {#if isVisible}
    <!-- Lazy loaded content -->
  {:else}
    <!-- Placeholder -->
  {/if}
</div>
```

These patterns ensure consistency across all Magickit components while following the established UI/UX principles and Svelte 5 best practices.