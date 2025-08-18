// ============================================================================
// Core Application Types
// ============================================================================

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'user';
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  tags: string[];
  author: {
    name: string;
    email: string;
  };
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'published' | 'archived';
  views: number;
  featured: boolean;
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  images: string[];
  category: string;
  technologies: string[];
  liveUrl?: string;
  githubUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  featured: boolean;
}

export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string[];
  author: {
    name: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
  views: number;
  helpful: number;
  notHelpful: number;
  status: 'draft' | 'published' | 'archived';
}

export interface SupportTicket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  user: {
    name: string;
    email: string;
    avatar: string;
  };
  assignedTo?: {
    name: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
  replies: TicketReply[];
}

export interface TicketReply {
  id: string;
  content: string;
  author: {
    name: string;
    email: string;
    isStaff: boolean;
  };
  createdAt: Date;
}

export interface UserSession {
  id: string;
  userId: string;
  user: {
    name: string;
    email: string;
  };
  ipAddress: string;
  location: string;
  device: string;
  userAgent: string;
  createdAt: Date;
  lastActivity: Date;
  expiresAt: Date;
  isActive: boolean;
}

export interface LogEntry {
  id: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: Date;
  source: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// Form Data Types
// ============================================================================

export interface UserFormData {
  name: string;
  email: string;
  role: 'admin' | 'user';
}

export interface TicketFormData {
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface ProfileFormData {
  name: string;
  email: string;
  bio?: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    timezone: string;
    dateFormat: string;
    notifications: {
      email: boolean;
      push: boolean;
      marketing: boolean;
    };
  };
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  totalTickets: number;
  openTickets: number;
  avgResponseTime: string;
  avgHelpfulRating: number;
  userGrowth: number;
  ticketResolutionRate: number;
}

export interface LocationCount {
  location: string;
  count: number;
}

export interface SessionAnalytics {
  totalSessions: number;
  activeSessions: number;
  avgSessionDuration: string;
  topLocations: LocationCount[];
  recentActivity: UserSession[];
}

// ============================================================================
// Search Types
// ============================================================================

export interface SearchResults {
  blog: {
    posts: BlogPost[];
    total: number;
  };
  portfolio: {
    items: PortfolioItem[];
    total: number;
  };
  pages: {
    pages: SearchPage[];
    total: number;
  };
}

export interface SearchPage {
  id: string;
  title: string;
  description: string;
  url: string;
  content: string;
}

export interface SearchResultItem extends BlogPost, PortfolioItem, SearchPage {
  resultType: 'blog' | 'portfolio' | 'page';
}

// ============================================================================
// FAQ Types
// ============================================================================

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
}

export interface HelpCategory {
  id: string;
  title: string;
  description: string;
  icon: any; // Component type
  color: string;
  articles: HelpArticle[];
}

export interface HelpArticle {
  id: string;
  title: string;
  description: string;
  content: string;
  tags: string[];
}

// ============================================================================
// Settings Types
// ============================================================================

export interface UserSettings {
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    timezone: string;
    dateFormat: string;
    notifications: {
      email: boolean;
      push: boolean;
      marketing: boolean;
    };
  };
  privacy: {
    profileVisibility: 'public' | 'private';
    showEmail: boolean;
    showActivity: boolean;
  };
  security: {
    twoFactorEnabled: boolean;
    sessionTimeout: number;
  };
}

// ============================================================================
// Bulk Operations Types
// ============================================================================

export interface BulkOperation {
  action: 'delete' | 'update-theme' | 'update-status' | 'export';
  theme?: 'light' | 'dark' | 'system';
  status?: string;
  selectedIds: string[];
}

// ============================================================================
// Filter Types
// ============================================================================

export type FilterValue = string | string[] | null;

// ============================================================================
// Utility Types
// ============================================================================

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: string;
  direction: SortDirection;
}

export interface PaginationConfig {
  page: number;
  limit: number;
  total: number;
}

// ============================================================================
// SEO Types
// ============================================================================

export interface SEOData {
  title: string;
  description: string;
  keywords?: string[];
  ogType?: string;
  twitterCard?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  url?: string;
  structuredData?: StructuredData[];
}

export interface StructuredData {
  '@context': string;
  '@type': string;
  [key: string]: any;
}