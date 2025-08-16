---
description: Development standards and practices specific to the Magickit universal template project
alwaysApply: true
---

# Magickit Development Standards

## Project Overview
Magickit is a universal web application template built with SvelteKit, Svelte 5, TypeScript, Tailwind CSS 4, shadcn-svelte, and Better Auth. This document establishes development standards specific to this project.

## Technology Stack Standards

### SvelteKit & Svelte 5
- **ALWAYS** use Svelte 5 syntax with `$state()`, `$derived()`, and `$effect()`
- **ALWAYS** use `$props()` for component props instead of `export let`
- **NEVER** use legacy Svelte reactive statements (`$:`) - use `$derived()` instead
- **ALWAYS** use `$bindable()` for two-way binding props
- **CRITICAL:** Follow build quality standards in `magickit-build-quality.md` to prevent compilation errors
- Use proper TypeScript interfaces for all component props

```svelte
<!-- ✅ CORRECT - Svelte 5 syntax -->
<script lang="ts">
  interface Props {
    title: string;
    isVisible?: boolean;
  }
  
  let { title, isVisible = true }: Props = $props();
  let count = $state(0);
  let doubled = $derived(count * 2);
</script>

<!-- ❌ INCORRECT - Legacy syntax -->
<script lang="ts">
  export let title: string;
  export let isVisible = true;
  let count = 0;
  $: doubled = count * 2;
</script>
```

### Database & Authentication
- **ALWAYS** use MongoDB with native TypeScript driver
- **ALWAYS** use ObjectId for document IDs, not strings
- **ALWAYS** leverage existing Better Auth configuration
- **NEVER** create custom authentication - extend Better Auth
- Use existing `dbClient` pattern for database connections

```typescript
// ✅ CORRECT - MongoDB with ObjectId
import { ObjectId } from 'mongodb';

interface User {
  _id: ObjectId;
  email: string;
  role: 'user' | 'admin';
}

// ❌ INCORRECT - String IDs
interface User {
  id: string;
  email: string;
}
```

### Component Library Usage
- **ALWAYS** use shadcn-svelte components as building blocks
- **NEVER** create custom components if shadcn-svelte equivalent exists
- **ALWAYS** check shadcn-svelte-extras before creating new functionality
- Use existing component patterns from the codebase

### Form Handling
- **ALWAYS** use existing form patterns from login/signup components
- **ALWAYS** implement proper loading states with `Loader2` icon
- **ALWAYS** use semantic color tokens for validation states
- **ALWAYS** provide proper error handling and user feedback

## File Organization Standards

### Route Structure
```
src/routes/
├── (public)/          # Public pages
├── (auth)/            # Authentication pages  
├── my-account/        # User dashboard pages
└── admin/             # Admin pages
```

### Component Organization
```
src/lib/components/
├── ui/               # shadcn-svelte components (don't modify)
├── forms/            # Custom form components
├── layout/           # Layout components (header, footer, etc.)
└── admin/            # Admin-specific components
```

### Database Models
```
src/lib/db/
├── models/           # TypeScript interfaces
├── collections/      # Collection utilities
└── dbClient.ts       # Existing database client
```

## Coding Standards

### TypeScript
- **ALWAYS** use strict TypeScript with proper interfaces
- **ALWAYS** define interfaces for all data models
- **NEVER** use `any` type - use proper typing
- Use MongoDB ObjectId types for document references

### Error Handling
- **ALWAYS** implement proper error boundaries
- **ALWAYS** provide user-friendly error messages
- **ALWAYS** use Alert components for error display
- **NEVER** expose technical error details to users

### Performance
- **ALWAYS** implement loading states for async operations
- **ALWAYS** use lazy loading for non-critical content
- **ALWAYS** optimize images with WebP format
- **ALWAYS** implement proper caching strategies

## Security Standards

### Authentication & Authorization
- **ALWAYS** use existing Better Auth role-based routing
- **ALWAYS** implement proper RBAC checks on server-side
- **NEVER** rely solely on client-side authorization
- **ALWAYS** validate user permissions for admin actions

### Data Validation
- **ALWAYS** validate all user inputs on both client and server
- **ALWAYS** sanitize data before database operations
- **ALWAYS** use proper TypeScript validation schemas
- **NEVER** trust client-side validation alone

## Testing Standards

### Component Testing
- **ALWAYS** write tests for complex components
- **ALWAYS** test form validation and error states
- **ALWAYS** verify accessibility compliance
- Use Vitest for unit testing

### Integration Testing
- **ALWAYS** test authentication flows
- **ALWAYS** test admin functionality and permissions
- **ALWAYS** verify responsive design
- Use Playwright for end-to-end testing

## Documentation Standards

### Code Documentation
- **ALWAYS** document complex business logic
- **ALWAYS** use JSDoc for public functions
- **ALWAYS** document API endpoints and data models
- Keep comments concise and relevant

### Component Documentation
- **ALWAYS** document component props and usage
- **ALWAYS** provide examples for complex components
- **ALWAYS** document accessibility features
- Use TypeScript interfaces for self-documenting code

## Deployment & Environment

### Environment Variables
- **ALWAYS** use proper environment variable naming
- **ALWAYS** document required environment variables
- **NEVER** commit sensitive data to version control
- Use `.env.example` for environment templates

### Build Process
- **ALWAYS** use Bun as package manager and runtime
- **ALWAYS** optimize build output for production
- **ALWAYS** verify build works before deployment
- Use proper CI/CD practices

## Common Patterns

### Page Layout Pattern
```svelte
<!-- Standard page structure -->
<script lang="ts">
  // Page logic here
</script>

<svelte:head>
  <title>Page Title | Magickit</title>
  <meta name="description" content="Page description" />
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="space-y-6">
    <!-- Page content with proper spacing -->
  </div>
</div>
```

### Form Component Pattern
```svelte
<Card>
  <CardHeader class="space-y-2">
    <CardTitle class="text-2xl">Form Title</CardTitle>
    <CardDescription>Form description</CardDescription>
  </CardHeader>
  <CardContent class="space-y-6">
    <form class="space-y-6" on:submit={handleSubmit}>
      <!-- Form fields with proper spacing -->
    </form>
  </CardContent>
</Card>
```

### Admin Table Pattern
```svelte
<div class="space-y-6">
  <!-- Header with actions -->
  <div class="flex justify-between items-center">
    <div class="space-y-2">
      <h1 class="text-2xl font-bold">Page Title</h1>
      <p class="text-muted-foreground">Description</p>
    </div>
    <Button>Primary Action</Button>
  </div>

  <!-- Search and filters -->
  <Card>
    <CardContent class="p-4">
      <!-- Search/filter controls -->
    </CardContent>
  </Card>

  <!-- Data table -->
  <Card>
    <CardContent class="p-0">
      <Table>
        <!-- Table content -->
      </Table>
    </CardContent>
  </Card>
</div>
```

## Quality Checklist

Before submitting any code, ensure:
- [ ] **CRITICAL:** Runs `bun run build` without errors or warnings
- [ ] Follows Svelte 5 syntax patterns (see `magickit-build-quality.md`)
- [ ] All reactive variables use `$state()` syntax
- [ ] All computed values use `let variable = $derived()` syntax
- [ ] Uses proper UI/UX design principles
- [ ] Implements loading and error states
- [ ] Includes proper TypeScript typing
- [ ] Follows accessibility guidelines
- [ ] Uses semantic color tokens
- [ ] Implements responsive design
- [ ] Includes proper error handling
- [ ] Uses existing component patterns
- [ ] Passes all tests and linting