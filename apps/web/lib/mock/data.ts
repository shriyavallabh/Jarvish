import type {
  Advisor,
  ContentItem,
  ActivityItem,
  DashboardStats,
  SystemHealth,
  LandingPageStats,
} from './types'

// Mock advisors data
export const mockAdvisors: Advisor[] = [
  {
    id: 'adv-001',
    name: 'Arjun Khanna',
    registrationId: 'ARN-12345',
    registrationType: 'ARN',
    tier: 'elite',
    email: 'arjun.khanna@fintech.com',
    phone: '+91-98765-43210',
    clientCount: 487,
    complianceScore: 98.7,
    lastActive: new Date('2024-08-16T09:30:00Z'),
  },
  {
    id: 'adv-002',
    name: 'Sanjay Malhotra',
    registrationId: 'INA000034567',
    registrationType: 'RIA',
    tier: 'premium',
    email: 'sanjay.malhotra@wealth.in',
    phone: '+91-98765-43211',
    clientCount: 234,
    complianceScore: 94.2,
    lastActive: new Date('2024-08-16T08:45:00Z'),
  },
  {
    id: 'adv-003',
    name: 'Priya Gupta',
    registrationId: 'ARN-67890',
    registrationType: 'ARN',
    tier: 'premium',
    email: 'priya.gupta@invest.co.in',
    phone: '+91-98765-43212',
    clientCount: 156,
    complianceScore: 96.5,
    lastActive: new Date('2024-08-16T10:15:00Z'),
  },
  {
    id: 'adv-004',
    name: 'Rohit Verma',
    registrationId: 'ARN-11111',
    registrationType: 'ARN',
    tier: 'elite',
    email: 'rohit.verma@premium.in',
    phone: '+91-98765-43213',
    clientCount: 378,
    complianceScore: 89.3,
    lastActive: new Date('2024-08-16T07:20:00Z'),
  },
  {
    id: 'adv-005',
    name: 'Neeta Shah',
    registrationId: 'INA000098765',
    registrationType: 'RIA',
    tier: 'premium',
    email: 'neeta.shah@advisory.com',
    phone: '+91-98765-43214',
    clientCount: 189,
    complianceScore: 95.8,
    lastActive: new Date('2024-08-16T11:00:00Z'),
  },
]

// Mock content items
export const mockContentItems: ContentItem[] = [
  {
    id: 'content-001',
    advisorId: 'adv-001',
    title: 'Q3 Portfolio Performance Review',
    type: 'wealth-strategy',
    content: 'Comprehensive analysis of portfolio performance for Q3 2024 with SEBI-compliant recommendations...',
    status: 'pending',
    complianceScore: 97.2,
    riskLevel: 'low',
    createdAt: new Date('2024-08-16T09:00:00Z'),
    platformTargets: ['whatsapp', 'email'],
  },
  {
    id: 'content-002',
    advisorId: 'adv-002',
    title: 'Tax Saving Strategies for FY 2024-25',
    type: 'tax-planning',
    content: 'Updated tax saving recommendations following latest budget announcements...',
    status: 'approved',
    complianceScore: 94.8,
    riskLevel: 'medium',
    createdAt: new Date('2024-08-16T08:30:00Z'),
    reviewedAt: new Date('2024-08-16T09:15:00Z'),
    platformTargets: ['whatsapp'],
  },
  {
    id: 'content-003',
    advisorId: 'adv-003',
    title: 'New Fund Launch: Equity Diversified',
    type: 'fund-launch',
    content: 'Announcing the launch of our new equity diversified fund with SEBI approval...',
    status: 'pending',
    complianceScore: 92.1,
    riskLevel: 'high',
    createdAt: new Date('2024-08-16T10:00:00Z'),
    platformTargets: ['whatsapp', 'linkedin', 'email'],
  },
  {
    id: 'content-004',
    advisorId: 'adv-004',
    title: 'Market Outlook: Monsoon Impact Analysis',
    type: 'market-analysis',
    content: 'Analysis of monsoon impact on agricultural and related sectors...',
    status: 'rejected',
    complianceScore: 78.5,
    riskLevel: 'high',
    createdAt: new Date('2024-08-16T07:45:00Z'),
    reviewedAt: new Date('2024-08-16T08:30:00Z'),
    platformTargets: ['whatsapp'],
  },
  {
    id: 'content-005',
    advisorId: 'adv-005',
    title: 'Quarterly Portfolio Rebalancing Guide',
    type: 'portfolio-update',
    content: 'Step-by-step guide for quarterly portfolio rebalancing with risk assessment...',
    status: 'scheduled',
    complianceScore: 96.3,
    riskLevel: 'low',
    createdAt: new Date('2024-08-16T10:30:00Z'),
    deliverySchedule: new Date('2024-08-17T06:00:00Z'),
    platformTargets: ['whatsapp', 'email'],
  },
]

// Mock activity items
export const mockActivityItems: ActivityItem[] = [
  {
    id: 'activity-001',
    type: 'content_approved',
    title: 'Premium Content Pack Approved',
    description: 'All 5 pieces ready with perfect compliance score',
    timestamp: new Date('2024-08-16T11:30:00Z'),
    severity: 'success',
    advisorId: 'adv-001',
    metadata: { contentCount: 5, complianceScore: 98.7 },
  },
  {
    id: 'activity-002',
    type: 'milestone_reached',
    title: 'Client Milestone Achieved',
    description: 'Reached 500 premium clients - congratulations!',
    timestamp: new Date('2024-08-16T09:00:00Z'),
    severity: 'success',
    advisorId: 'adv-001',
    metadata: { milestone: 500, type: 'premium_clients' },
  },
  {
    id: 'activity-003',
    type: 'system_update',
    title: 'Branding Assets Updated',
    description: 'New templates applied to all content',
    timestamp: new Date('2024-08-16T07:00:00Z'),
    severity: 'info',
    advisorId: 'adv-001',
    metadata: { templatesUpdated: 15 },
  },
  {
    id: 'activity-004',
    type: 'delivery_complete',
    title: "Yesterday's Delivery Complete",
    description: 'Successfully delivered to 487 premium clients',
    timestamp: new Date('2024-08-15T06:00:00Z'),
    severity: 'success',
    advisorId: 'adv-001',
    metadata: { deliveredCount: 487, deliveryRate: 99.8 },
  },
]

// Mock system health
export const mockSystemHealth: SystemHealth = {
  whatsappApi: 'operational',
  aiService: 'operational',
  complianceEngine: 'operational',
  deliveryQueue: 8,
  rateLimit: 68,
  responseTime: 89,
}

// Mock dashboard stats
export const mockDashboardStats: DashboardStats = {
  advisors: {
    total: 500,
    active: 487,
    premium: 234,
    elite: 89,
  },
  content: {
    pending: 127,
    approved: 342,
    delivered: 1876,
    complianceRate: 96.8,
  },
  delivery: {
    total: 2000,
    delivered: 1984,
    pending: 8,
    failed: 8,
    rate: 99.2,
  },
  engagement: {
    rate: 82.0,
    opens: 1634,
    clicks: 423,
    responses: 156,
    trend: 'up',
  },
  compliance: {
    score: 98.7,
    totalChecks: 2000,
    passedChecks: 1974,
    violations: 26,
    lastAudit: new Date('2024-08-16T00:00:00Z'),
  },
}

// Mock landing page stats
export const mockLandingPageStats: LandingPageStats = {
  advisors: 500,
  messagesDelivered: 2500000,
  uptime: 99.9,
  complianceRate: 98.7,
  clientSatisfaction: 4.9,
}

// Helper functions to get filtered data
export function getAdvisorById(id: string): Advisor | undefined {
  return mockAdvisors.find(advisor => advisor.id === id)
}

export function getContentByAdvisorId(advisorId: string): ContentItem[] {
  return mockContentItems.filter(item => item.advisorId === advisorId)
}

export function getContentByStatus(status: ContentItem['status']): ContentItem[] {
  return mockContentItems.filter(item => item.status === status)
}

export function getPendingContentItems(): ContentItem[] {
  return getContentByStatus('pending')
}

export function getRecentActivity(limit: number = 10): ActivityItem[] {
  return mockActivityItems
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit)
}

// Generate dynamic data
export function generateTimeUntilDelivery(): string {
  const now = new Date()
  const target = new Date()
  target.setHours(6, 0, 0, 0)
  
  if (now > target) {
    target.setDate(target.getDate() + 1)
  }
  
  const diff = target.getTime() - now.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function getRecentContentItems(limit: number = 10): ContentItem[] {
  return mockContentItems
    .filter(item => item.status === 'approved' || item.status === 'scheduled')
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit)
}

export function getAdvisorActivities(advisorId: string, limit: number = 10): ActivityItem[] {
  return mockActivityItems
    .filter(activity => activity.advisorId === advisorId)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit)
}

// Alias for backward compatibility
export const mockActivities = mockActivityItems