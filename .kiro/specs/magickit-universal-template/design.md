# Design Document

## Overview

The Magickit universal template design builds upon the existing SvelteKit foundation with Better Auth, shadcn-svelte components, and established UI patterns. The design focuses on completing the missing essential pages while maintaining consistency with the existing authentication system, sidebar navigation, and component patterns already implemented.

The template serves three distinct user types:
- **Public Users**: Access to informational pages and marketing content
- **Authenticated Users**: Personal dashboard and account management
- **Administrators**: Comprehensive admin panel with user and system management

## Architecture

### Existing Foundation
The current architecture leverages:
- **SvelteKit** with Svelte 5 for the application framework
- **Better Auth** with MongoDB adapter for authentication and role-based access control
- **Tailwind CSS 4** for styling with established design system
- **shadcn-svelte** component library for consistent UI elements
- **Existing routing structure** with proper role-based redirects

### Route Architecture
```
/                           # Enhanced homepage (public)
/about                      # About page (public) - NEW
/services                   # Services page (public) - NEW
/contact                    # Contact page (public) - NEW
/blog                       # Blog listing (public) - NEW
/blog/[slug]               # Blog post (public) - NEW
/portfolio                  # Portfolio (public) - NEW
/pricing                    # Pricing (public) - NEW
/faq                       # FAQ (public) - NEW
/privacy                   # Privacy policy (public) - NEW
/terms                     # Terms of service (public) - NEW
/help                      # Help center (public) - NEW
/search                    # Search results (public) - NEW
/404                       # Error page (public) - NEW
/coming-soon               # Coming soon (public) - NEW
/sitemap                   # Sitemap (public) - NEW

/login                     # Login (existing)
/signup                    # Signup (existing)

/my-account                # Enhanced user dashboard (auth required)
/my-account/profile        # Profile management (auth required) - NEW
/my-account/settings       # Account settings (auth required) - NEW
/my-account/security       # Security settings (auth required) - NEW
/my-account/content        # User content (auth required) - NEW
/my-account/favorites      # Saved items (auth required) - NEW
/my-account/notifications  # User notifications (auth required) - NEW

/admin                     # Admin dashboard (existing structure)
# User Management - Separate pages instead of tabs
/admin/users               # All users listing (admin only) - NEW
/admin/users/profiles      # User profiles management (admin only) - NEW
/admin/users/sessions      # Login sessions monitoring (admin only) - NEW

# Access Control (RBAC) - Separate pages instead of tabs
/admin/access-control/roles        # Roles management (admin only) - NEW
/admin/access-control/permissions  # Permissions management (admin only) - NEW
/admin/access-control/assign       # Assign roles (admin only) - NEW
/admin/access-control/audit        # Audit access (admin only) - NEW

# Notifications - Separate pages instead of tabs
/admin/notifications/user          # User notifications (admin only) - NEW
/admin/notifications/system        # System alerts (admin only) - NEW
/admin/notifications/templates     # Email templates (admin only) - NEW

# Security - Separate pages instead of tabs
/admin/security/ip-access          # IP access control (admin only) - NEW
/admin/security/brute-force        # Brute force protection (admin only) - NEW
/admin/security/audit-trails       # Audit trails (admin only) - NEW

# Support - Separate pages instead of tabs
/admin/support/tickets             # Support tickets (admin only) - NEW
/admin/support/knowledge-base      # Knowledge base (admin only) - NEW
/admin/support/feedback            # Feedback management (admin only) - NEW
```

### Authentication Flow
The existing Better Auth implementation provides:
- Email/password authentication with role-based redirects
- Admin role detection with automatic routing to `/admin`
- User role routing to previous page or `/my-account`
- Session management with proper security

## UI/UX Design Principles

### Fundamental Design Laws
All components and pages must follow these universal design principles:

1. **Simplicity (Occam's Razor)** - Eliminate unnecessary complexity in all interfaces
2. **Visual Hierarchy** - Important elements stand out through size, color, and position
3. **Consistency (Jakob's Law)** - Use familiar design patterns users expect
4. **Accessibility** - Ensure usability for everyone, including those with disabilities
5. **Proximity** - Group related elements visually to indicate relationships
6. **Feedback** - Provide immediate visual feedback on interactions (< 400ms)
7. **White Space** - Use proper spacing for visual breathing room and readability

### Design System Standards

#### Typography Hierarchy
- **ALWAYS** use consistent typography scale: `text-2xl`, `text-lg`, `text-sm`
- Optimize line length (45-75 characters) and line height (around 1.5x)
- Prefer left alignment for longer text blocks
- Use semantic heading structure (h1, h2, h3)

#### Color System
- **Primary**: Main action buttons, links, focus states
- **Secondary**: Less prominent actions, supporting UI elements  
- **Muted**: Background elements, disabled states
- **Accent**: Highlights, notifications, badges (use sparingly)
- **Destructive**: Delete actions, warnings, errors

#### Spacing Hierarchy
- `gap-6` for major sections
- `gap-4` for related elements
- `gap-2` for tight spacing
- `p-6` for page containers
- `p-4` for card content
- `p-0` for table content

#### Component Patterns
- **Tables**: Always wrap in Card components with `p-0`
- **Forms**: Use consistent field structure with proper labels and validation
- **Buttons**: Use semantic variants (primary, secondary, destructive)
- **Icons**: Lucide icons only, `h-4 w-4` for buttons, `h-12 w-12` for empty states
- **Loading States**: Consistent loading indicators for all async operations
- **Empty States**: Meaningful messages with call-to-action buttons
- **Error States**: User-friendly messages with recovery options

## Components and Interfaces

### Page Layout Components

#### Public Page Layout
```svelte
<!-- Standard public page structure -->
<Header /> <!-- Existing component with breadcrumbs -->
<main class="container mx-auto px-4 py-8">
  <slot />
</main>
<Footer /> <!-- NEW: Consistent footer component -->
```

#### User Dashboard Layout
```svelte
<!-- User area layout -->
<Header /> <!-- Existing component -->
<div class="container mx-auto px-4 py-8">
  <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
    <UserSidebar /> <!-- NEW: User navigation sidebar -->
    <main class="lg:col-span-3">
      <slot />
    </main>
  </div>
</div>
```

#### Admin Layout
```svelte
<!-- Existing admin layout with sidebar -->
<SidebarProvider>
  <AppSidebar /> <!-- Existing component -->
  <SidebarInset>
    <Header /> <!-- Existing component -->
    <main class="p-6">
      <slot />
    </main>
  </SidebarInset>
</SidebarProvider>
```

### Content Components

#### Hero Section Component
```svelte
<!-- Reusable hero section following UI/UX principles -->
<section class="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
  <div class="container mx-auto px-4 py-24">
    <div class="max-w-4xl mx-auto text-center space-y-6">
      <h1 class="text-2xl md:text-4xl lg:text-6xl font-bold">{title}</h1>
      <p class="text-lg md:text-xl opacity-90 max-w-2xl mx-auto leading-relaxed">{subtitle}</p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center pt-4">
        <Button size="lg" variant="secondary" class="transition-colors duration-200">
          {primaryCTA}
        </Button>
        <Button size="lg" variant="outline" class="transition-colors duration-200">
          {secondaryCTA}
        </Button>
      </div>
    </div>
  </div>
</section>
```

#### Features Grid Component
```svelte
<!-- Feature showcase following spacing hierarchy and visual principles -->
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

#### Testimonials Component
```svelte
<!-- Social proof section using existing components -->
<section class="py-16 bg-muted/50">
  <div class="container mx-auto px-4">
    <div class="text-center mb-12">
      <h2 class="text-3xl font-bold mb-4">What Our Users Say</h2>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each testimonials as testimonial}
        <Card>
          <CardContent class="p-6">
            <div class="flex items-center mb-4">
              <Avatar>
                <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                <AvatarFallback>{testimonial.initials}</AvatarFallback>
              </Avatar>
              <div class="ml-3">
                <p class="font-semibold">{testimonial.name}</p>
                <p class="text-sm text-muted-foreground">{testimonial.role}</p>
              </div>
            </div>
            <p class="text-muted-foreground italic">"{testimonial.quote}"</p>
          </CardContent>
        </Card>
      {/each}
    </div>
  </div>
</section>
```

### Form Components

#### Contact Form Component
```svelte
<!-- Contact form following form patterns and accessibility guidelines -->
<Card>
  <CardHeader class="space-y-2">
    <CardTitle class="text-2xl">Get in Touch</CardTitle>
    <CardDescription class="text-muted-foreground">
      Send us a message and we'll get back to you within 24 hours.
    </CardDescription>
  </CardHeader>
  <CardContent class="space-y-6">
    <form class="space-y-6" on:submit={handleSubmit}>
      <!-- Name and Email Row -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="space-y-2">
          <Label for="name" class="text-sm font-medium">Name *</Label>
          <Input 
            id="name" 
            placeholder="Your full name" 
            bind:value={formData.name}
            required 
            aria-describedby="name-error"
            class="transition-colors duration-200"
          />
          {#if errors.name}
            <p id="name-error" class="text-sm text-destructive">{errors.name}</p>
          {/if}
        </div>
        <div class="space-y-2">
          <Label for="email" class="text-sm font-medium">Email *</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="your@email.com" 
            bind:value={formData.email}
            required 
            aria-describedby="email-error"
            class="transition-colors duration-200"
          />
          {#if errors.email}
            <p id="email-error" class="text-sm text-destructive">{errors.email}</p>
          {/if}
        </div>
      </div>
      
      <!-- Subject -->
      <div class="space-y-2">
        <Label for="subject" class="text-sm font-medium">Subject *</Label>
        <Input 
          id="subject" 
          placeholder="How can we help?" 
          bind:value={formData.subject}
          required 
          aria-describedby="subject-error"
          class="transition-colors duration-200"
        />
        {#if errors.subject}
          <p id="subject-error" class="text-sm text-destructive">{errors.subject}</p>
        {/if}
      </div>
      
      <!-- Message -->
      <div class="space-y-2">
        <Label for="message" class="text-sm font-medium">Message *</Label>
        <Textarea 
          id="message" 
          placeholder="Tell us more about your inquiry..." 
          rows={5} 
          bind:value={formData.message}
          required 
          aria-describedby="message-error"
          class="transition-colors duration-200 resize-none"
        />
        {#if errors.message}
          <p id="message-error" class="text-sm text-destructive">{errors.message}</p>
        {/if}
      </div>
      
      <!-- Submit Button -->
      <Button 
        type="submit" 
        class="w-full transition-colors duration-200" 
        disabled={isSubmitting}
      >
        {#if isSubmitting}
          <Loader2 class="mr-2 h-4 w-4 animate-spin" />
          Sending...
        {:else}
          <Send class="mr-2 h-4 w-4" />
          Send Message
        {/if}
      </Button>
    </form>
  </CardContent>
</Card>
```

### Data Display Components

#### User Management Table
```svelte
<!-- Admin user management following table patterns and accessibility -->
<div class="space-y-6">
  <!-- Header with Actions -->
  <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    <div class="space-y-2">
      <h1 class="text-2xl font-bold">User Management</h1>
      <p class="text-muted-foreground">Manage user accounts and permissions</p>
    </div>
    <Button class="transition-colors duration-200">
      <Plus class="mr-2 h-4 w-4" />
      Add User
    </Button>
  </div>

  <!-- Search and Filters -->
  <Card>
    <CardContent class="p-4">
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex-1">
          <div class="relative">
            <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Search users..." 
              class="pl-8 transition-colors duration-200" 
              bind:value={searchTerm} 
            />
          </div>
        </div>
        <div class="flex gap-2">
          <Button variant="outline" onclick={resetFilters} class="transition-colors duration-200">
            Reset
          </Button>
          <Button variant="secondary" onclick={applyFilters} class="transition-colors duration-200">
            <Filter class="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>

  <!-- Users Table -->
  <Card>
    <CardContent class="p-0">
      {#if isLoading}
        <div class="flex justify-center py-12">
          <Loader2 class="h-8 w-8 animate-spin text-primary" />
        </div>
      {:else if users.length === 0}
        <div class="text-center py-12 space-y-4">
          <Users class="h-12 w-12 mx-auto text-muted-foreground" />
          <div class="space-y-2">
            <h3 class="text-lg font-semibold">No users found</h3>
            <p class="text-muted-foreground">Get started by adding your first user.</p>
          </div>
          <Button onclick={createUser} class="transition-colors duration-200">
            <Plus class="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      {:else}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead class="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {#each users as user}
              <TableRow class="transition-colors duration-200 hover:bg-muted/50">
                <TableCell>
                  <div class="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{user.initials}</AvatarFallback>
                    </Avatar>
                    <div class="space-y-1">
                      <p class="font-medium text-sm">{user.name}</p>
                      <p class="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell class="text-sm text-muted-foreground">
                  {user.lastLogin || 'Never'}
                </TableCell>
                <TableCell class="text-right">
                  <div class="flex items-center justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onclick={() => editUser(user)}
                      aria-label="Edit user"
                      class="transition-colors duration-200"
                    >
                      <Pencil class="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onclick={() => deleteUser(user)}
                      aria-label="Delete user"
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

## Data Models

### Database Architecture
The application uses MongoDB with the native TypeScript driver, following the existing Better Auth integration pattern.

### User Profile Model
```typescript
import { ObjectId } from 'mongodb';

interface UserProfile {
  _id: ObjectId;
  name: string;
  email: string;
  avatar?: string;
  role: 'user' | 'admin';
  bio?: string;
  location?: string;
  website?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notifications: {
      email: boolean;
      push: boolean;
      marketing: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}
```

### Content Models
```typescript
interface BlogPost {
  _id: ObjectId;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: ObjectId; // Reference to User
  publishedAt: Date;
  updatedAt: Date;
  tags: string[];
  featured: boolean;
  status: 'draft' | 'published' | 'archived';
}

interface PortfolioItem {
  _id: ObjectId;
  title: string;
  description: string;
  images: string[];
  technologies: string[];
  liveUrl?: string;
  githubUrl?: string;
  featured: boolean;
  category: string;
  createdAt: Date;
}

interface ContactSubmission {
  _id: ObjectId;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'closed';
  submittedAt: Date;
}
```

### Admin Models
```typescript
interface Role {
  _id: ObjectId;
  name: string;
  description: string;
  permissions: ObjectId[]; // References to Permission documents
  createdAt: Date;
  updatedAt: Date;
}

interface Permission {
  _id: ObjectId;
  name: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete';
  description: string;
}

interface AuditLog {
  _id: ObjectId;
  userId: ObjectId; // Reference to User
  action: string;
  resource: string;
  resourceId?: ObjectId;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}
```

## Error Handling

### Error Boundary Component
```svelte
<!-- Global error boundary for graceful error handling -->
<script>
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import { Button } from '$lib/components/ui/button';
  import { RefreshCw } from '@lucide/svelte';
  
  let { error, retry } = $props();
</script>

{#if error}
  <div class="container mx-auto px-4 py-16 text-center">
    <Alert variant="destructive" class="max-w-md mx-auto">
      <AlertDescription>
        Something went wrong. Please try again or contact support if the problem persists.
      </AlertDescription>
    </Alert>
    <Button onclick={retry} class="mt-4">
      <RefreshCw class="mr-2 h-4 w-4" />
      Try Again
    </Button>
  </div>
{/if}
```

### Form Validation
```typescript
// Form validation using existing patterns
import { z } from 'zod';

const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters')
});

// Error display using existing Alert components
{#if errors.name}
  <p class="text-sm text-destructive mt-1">{errors.name}</p>
{/if}
```

## Testing Strategy

### Component Testing
```typescript
// Example test for Hero component
import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import Hero from '$lib/components/Hero.svelte';

describe('Hero Component', () => {
  it('renders title and subtitle correctly', () => {
    render(Hero, {
      title: 'Welcome to Magickit',
      subtitle: 'Build amazing web applications'
    });
    
    expect(screen.getByText('Welcome to Magickit')).toBeInTheDocument();
    expect(screen.getByText('Build amazing web applications')).toBeInTheDocument();
  });
});
```

### Integration Testing
```typescript
// Example test for authentication flow
import { test, expect } from '@playwright/test';

test('user can login and access dashboard', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[data-testid="email"]', 'user@example.com');
  await page.fill('[data-testid="password"]', 'password123');
  await page.click('[data-testid="login-button"]');
  
  await expect(page).toHaveURL('/my-account');
  await expect(page.locator('h1')).toContainText('Dashboard');
});
```

### Performance Testing
- Page load times under 3 seconds
- Core Web Vitals optimization
- Image optimization with WebP format
- Lazy loading for non-critical content
- Bundle size monitoring

## Security Considerations

### Authentication Security
- Leverage existing Better Auth security features
- Session timeout warnings
- CSRF protection
- Rate limiting for login attempts
- Secure password requirements

### Data Protection
- Input sanitization for all forms
- XSS prevention
- SQL injection protection through ORM
- Secure file upload handling
- GDPR compliance features

### Admin Security
- Role-based access control (RBAC)
- Audit logging for admin actions
- IP whitelisting options
- Two-factor authentication for admin accounts
- Secure admin session management

## Accessibility Features

### WCAG 2.1 Compliance
- Semantic HTML structure
- Proper heading hierarchy
- Alt text for images
- Keyboard navigation support
- Screen reader compatibility
- Color contrast compliance
- Focus indicators

### Implementation
```svelte
<!-- Example accessible form -->
<div class="space-y-2">
  <Label for="email" class="sr-only">Email Address</Label>
  <Input 
    id="email" 
    type="email" 
    placeholder="Enter your email"
    aria-describedby="email-help"
    required
  />
  <p id="email-help" class="text-sm text-muted-foreground">
    We'll never share your email with anyone else.
  </p>
</div>
```

## Performance Optimization

### Core Web Vitals
- Largest Contentful Paint (LCP) < 2.5s
- First Input Delay (FID) < 100ms
- Cumulative Layout Shift (CLS) < 0.1

### Implementation Strategies
- Image optimization with responsive images
- Code splitting for route-based chunks
- Preloading critical resources
- Service worker for caching
- Database query optimization
- CDN integration for static assets

## SEO Strategy

### Technical SEO
```svelte
<!-- Example SEO meta tags -->
<svelte:head>
  <title>{pageTitle} | Magickit</title>
  <meta name="description" content={pageDescription} />
  <meta property="og:title" content={pageTitle} />
  <meta property="og:description" content={pageDescription} />
  <meta property="og:image" content={ogImage} />
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="canonical" href={canonicalUrl} />
</svelte:head>
```

### Structured Data
```typescript
// JSON-LD structured data for better search results
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Magickit",
  "description": "Universal web application template",
  "url": "https://magickit.dev"
};
```

This design document provides a comprehensive blueprint for completing the Magickit universal template while building upon the existing solid foundation of authentication, navigation, and component systems already in place.