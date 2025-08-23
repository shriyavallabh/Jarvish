// Mock data types for the financial advisor platform

export interface Advisor {
  id: string
  name: string
  registrationId: string
  registrationType: 'ARN' | 'RIA'
  tier: 'basic' | 'premium' | 'elite'
  email: string
  phone: string
  clientCount: number
  complianceScore: number
  lastActive: Date
  avatar?: string
}

export interface ContentItem {
  id: string
  advisorId: string
  title: string
  type: 'wealth-strategy' | 'portfolio-update' | 'tax-planning' | 'fund-launch' | 'market-analysis'
  content: string
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'scheduled' | 'delivered'
  complianceScore: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  createdAt: Date
  reviewedAt?: Date
  deliverySchedule?: Date
  platformTargets: ('whatsapp' | 'linkedin' | 'email')[]
}

export interface DeliveryStats {
  total: number
  delivered: number
  pending: number
  failed: number
  rate: number
}

export interface ComplianceStats {
  score: number
  totalChecks: number
  passedChecks: number
  violations: number
  lastAudit: Date
}

export interface EngagementStats {
  rate: number
  opens: number
  clicks: number
  responses: number
  trend: 'up' | 'down' | 'stable'
}

export interface SystemHealth {
  whatsappApi: 'operational' | 'degraded' | 'outage'
  aiService: 'operational' | 'degraded' | 'outage'
  complianceEngine: 'operational' | 'degraded' | 'outage'
  deliveryQueue: number
  rateLimit: number
  responseTime: number
}

export interface ActivityItem {
  id: string
  type: 'content_approved' | 'content_rejected' | 'milestone_reached' | 'system_update' | 'delivery_complete'
  title: string
  description: string
  timestamp: Date
  severity: 'info' | 'success' | 'warning' | 'error'
  advisorId?: string
  metadata?: Record<string, any>
}

export interface DashboardStats {
  advisors: {
    total: number
    active: number
    premium: number
    elite: number
  }
  content: {
    pending: number
    approved: number
    delivered: number
    complianceRate: number
  }
  delivery: DeliveryStats
  engagement: EngagementStats
  compliance: ComplianceStats
}

export interface LandingPageStats {
  advisors: number
  messagesDelivered: number
  uptime: number
  complianceRate: number
  clientSatisfaction: number
}