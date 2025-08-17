// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Authentication Types
export interface LoginRequest {
  phone: string;
  otp?: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface User {
  id: string;
  phone: string;
  name: string;
  email?: string;
  role: 'advisor' | 'admin';
  subscription: SubscriptionTier;
  profile?: AdvisorProfile;
  createdAt: string;
  updatedAt: string;
}

export interface AdvisorProfile {
  firmName: string;
  licenseNumber?: string;
  specializations: string[];
  clientCount: number;
  location: string;
  bio?: string;
  avatar?: string;
  complianceStatus: 'active' | 'pending' | 'suspended';
}

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

// Content Types
export interface Content {
  id: string;
  advisorId: string;
  type: 'market_update' | 'educational' | 'promotional' | 'news';
  title: string;
  body: string;
  language: 'en' | 'hi' | 'mr';
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'published';
  complianceScore?: number;
  complianceFlags?: ComplianceFlag[];
  metadata?: ContentMetadata;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface ComplianceFlag {
  type: 'warning' | 'error' | 'info';
  message: string;
  suggestion?: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ContentMetadata {
  targetAudience?: string[];
  tags?: string[];
  expiresAt?: string;
  whatsappFormatted?: boolean;
}

// Compliance Check Types
export interface ComplianceCheckRequest {
  text: string;
  type: Content['type'];
  language: Content['language'];
}

export interface ComplianceCheckResponse {
  riskScore: number;
  flags: ComplianceFlag[];
  suggestions: string[];
  approved: boolean;
  estimatedApprovalTime?: string;
}

// Analytics Types
export interface AnalyticsData {
  period: 'day' | 'week' | 'month' | 'year';
  metrics: {
    contentPublished: number;
    clientsReached: number;
    engagementRate: number;
    complianceScore: number;
  };
  trends: {
    contentGrowth: number;
    engagementGrowth: number;
  };
  topContent: Content[];
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}