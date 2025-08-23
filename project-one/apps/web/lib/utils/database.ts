// Mock database for testing
// In production, this would be replaced with actual Prisma client

interface Advisor {
  id: string
  euin: string
  email: string
  firstName: string
  lastName: string
  mobile: string
  password: string
  businessType: string
  business_name?: string
  subscription_tier?: 'basic' | 'standard' | 'pro'
  isVerified: boolean
  emailVerified?: boolean
  emailVerifiedAt?: Date
  isActive?: boolean
  onboardingCompleted?: boolean
  onboardingCompletedAt?: Date | null
  lastActive?: Date | null
  termsAcceptedAt: Date
  dpdpConsentAt: Date
  createdAt: Date
}

interface VerificationToken {
  id: string
  token: string
  userId: string
  email: string
  type: string
  used: boolean
  expiresAt: Date
  createdAt: Date
}

interface EmailLog {
  id: string
  recipientId: string
  recipientEmail: string
  type: string
  status: string
  createdAt: Date
}

interface OnboardingProgress {
  id: string
  advisorId: string
  currentStep: string
  completedSteps: string[]
  completionPercentage: number
  startedAt: Date
  updatedAt: Date
  completedAt?: Date | null
  createdAt: Date
}

interface ContentPreferences {
  id: string
  advisorId: string
  languages: string[]
  contentTypes: string[]
  frequency: string
  topics: string[]
  deliveryTime: string
  createdAt: Date
  updatedAt: Date
}

interface DemoContent {
  id: string
  advisorId: string
  title: string
  content_english: string
  content_hindi?: string | null
  content_gujarati?: string | null
  category: string
  topic_family: string
  complianceScore: number
  aiScore: number
  isCompliant: boolean
  validationDetails: any
  createdAt: Date
}

interface Notification {
  id: string
  advisorId: string
  type: string
  title: string
  message: string
  priority?: string
  read: boolean
  createdAt: Date
}

interface AuditLog {
  id: string
  action: string
  euin?: string
  success: boolean
  error?: string
  metadata?: any
  createdAt: Date
}

interface OTPToken {
  id: string
  userId: string
  mobile: string
  otp: string
  expiresAt: Date
  attempts: number
  verified: boolean
  createdAt: Date
}

interface OTPAttempt {
  id: string
  userId: string
  otpTokenId: string
  success: boolean
  reason?: string
  ipAddress: string
  createdAt: Date
}

class MockDatabase {
  private advisorsData: Map<string, Advisor> = new Map()
  private verificationTokensData: VerificationToken[] = []
  private emailLogsData: EmailLog[] = []
  private onboardingProgressData: Map<string, OnboardingProgress> = new Map()
  private contentPreferencesData: Map<string, ContentPreferences> = new Map()
  private demoContentData: DemoContent[] = []
  private notificationsData: Notification[] = []
  private auditLogs: AuditLog[] = []
  private otpTokensData: OTPToken[] = []
  private otpAttemptsData: OTPAttempt[] = []

  advisors = {
    findUnique: async ({ where }: { where: { id?: string; euin?: string; email?: string } }) => {
      if (where.id) {
        return this.advisorsData.get(where.id) || null
      }
      if (where.euin) {
        for (const advisor of this.advisorsData.values()) {
          if (advisor.euin === where.euin) {
            return advisor
          }
        }
      }
      if (where.email) {
        for (const advisor of this.advisorsData.values()) {
          if (advisor.email === where.email) {
            return advisor
          }
        }
      }
      return null
    },
    create: async ({ data }: { data: any }) => {
      const advisor = {
        id: `advisor-${Date.now()}`,
        ...data,
        isVerified: false,
        emailVerified: false,
        createdAt: new Date(),
      }
      this.advisorsData.set(advisor.id, advisor)
      return advisor
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      const advisor = this.advisorsData.get(where.id)
      if (!advisor) {
        // Don't throw error in tests, just return null
        return null
      }
      const updated = { ...advisor, ...data, mobileVerified: data.mobileVerified || advisor.isVerified }
      this.advisorsData.set(where.id, updated)
      return updated
    },
  }

  verificationTokens = {
    create: async ({ data }: { data: any }) => {
      const token = {
        id: `token-${Date.now()}`,
        ...data,
        used: false,
        createdAt: new Date(),
      }
      this.verificationTokensData.push(token)
      return token
    },
    findFirst: async ({ where }: { where: any }) => {
      return this.verificationTokensData.find(token => {
        if (where.userId && token.userId !== where.userId) return false
        if (where.type && token.type !== where.type) return false
        if (where.used !== undefined && token.used !== where.used) return false
        return true
      }) || null
    },
    findMany: async ({ where }: { where: any }) => {
      return this.verificationTokensData.filter(token => {
        if (where.type && token.type !== where.type) return false
        if (where.used !== undefined && token.used !== where.used) return false
        return true
      })
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      const index = this.verificationTokensData.findIndex(t => t.id === where.id)
      if (index === -1) throw new Error('Token not found')
      this.verificationTokensData[index] = { ...this.verificationTokensData[index], ...data }
      return this.verificationTokensData[index]
    },
    updateMany: async ({ where, data }: { where: any; data: any }) => {
      let count = 0
      this.verificationTokensData = this.verificationTokensData.map(token => {
        if (where.userId && token.userId === where.userId) {
          if (where.type && token.type === where.type) {
            if (where.used !== undefined && token.used === where.used) {
              count++
              return { ...token, ...data }
            }
          }
        }
        return token
      })
      return { count }
    },
  }

  emailLogs = {
    count: async ({ where }: { where: any }) => {
      return this.emailLogsData.filter(log => {
        if (where.recipientId && log.recipientId !== where.recipientId) return false
        if (where.type && log.type !== where.type) return false
        if (where.createdAt?.gte && log.createdAt < where.createdAt.gte) return false
        return true
      }).length
    },
    create: async ({ data }: { data: any }) => {
      const log = {
        id: `log-${Date.now()}`,
        ...data,
        createdAt: new Date(),
      }
      this.emailLogsData.push(log)
      return log
    },
  }

  onboardingProgress = {
    create: async ({ data }: { data: any }) => {
      const progress = {
        id: `progress-${Date.now()}`,
        ...data,
        createdAt: new Date(),
      }
      this.onboardingProgressData.set(data.advisorId, progress)
      return progress
    },
    findUnique: async ({ where }: { where: { advisorId: string } }) => {
      return this.onboardingProgressData.get(where.advisorId) || null
    },
    update: async ({ where, data }: { where: { advisorId: string }; data: any }) => {
      const existing = this.onboardingProgressData.get(where.advisorId)
      if (!existing) throw new Error('Progress not found')
      const updated = { ...existing, ...data }
      if (data.completedSteps?.push) {
        updated.completedSteps = [...existing.completedSteps, data.completedSteps.push]
      }
      this.onboardingProgressData.set(where.advisorId, updated)
      return updated
    },
    upsert: async ({ where, create, update }: { where: { advisorId: string }; create: any; update: any }) => {
      const existing = this.onboardingProgressData.get(where.advisorId)
      if (existing) {
        const updated = { ...existing, ...update }
        if (update.completedSteps?.push) {
          updated.completedSteps = [...existing.completedSteps, update.completedSteps.push]
        }
        this.onboardingProgressData.set(where.advisorId, updated)
        return updated
      } else {
        const progress = {
          id: `progress-${Date.now()}`,
          ...create,
          createdAt: new Date(),
        }
        this.onboardingProgressData.set(where.advisorId, progress)
        return progress
      }
    },
    delete: async ({ where }: { where: { advisorId: string } }) => {
      this.onboardingProgressData.delete(where.advisorId)
      return { advisorId: where.advisorId }
    },
  }

  contentPreferences = {
    create: async ({ data }: { data: any }) => {
      const preferences = {
        id: `pref-${Date.now()}`,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      this.contentPreferencesData.set(data.advisorId, preferences)
      return preferences
    },
    findUnique: async ({ where }: { where: { advisorId: string } }) => {
      return this.contentPreferencesData.get(where.advisorId) || null
    },
    update: async ({ where, data }: { where: { advisorId: string }; data: any }) => {
      const existing = this.contentPreferencesData.get(where.advisorId)
      if (!existing) throw new Error('Preferences not found')
      const updated = { ...existing, ...data }
      this.contentPreferencesData.set(where.advisorId, updated)
      return updated
    },
    upsert: async ({ where, create, update }: { where: { advisorId: string }; create: any; update: any }) => {
      const existing = this.contentPreferencesData.get(where.advisorId)
      if (existing) {
        const updated = { ...existing, ...update }
        this.contentPreferencesData.set(where.advisorId, updated)
        return updated
      } else {
        const preferences = {
          id: `pref-${Date.now()}`,
          ...create,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        this.contentPreferencesData.set(where.advisorId, preferences)
        return preferences
      }
    },
  }

  demoContent = {
    create: async ({ data }: { data: any }) => {
      const demo = {
        id: `demo-${Date.now()}`,
        ...data,
        createdAt: new Date(),
      }
      this.demoContentData.push(demo)
      return demo
    },
    findMany: async ({ where, orderBy, take }: { where?: any; orderBy?: any; take?: number }) => {
      let results = [...this.demoContentData]
      
      if (where?.advisorId) {
        results = results.filter(d => d.advisorId === where.advisorId)
      }
      
      if (orderBy?.createdAt === 'desc') {
        results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      }
      
      if (take) {
        results = results.slice(0, take)
      }
      
      return results
    },
  }

  notifications = {
    create: async ({ data }: { data: any }) => {
      const notification = {
        id: `notif-${Date.now()}`,
        ...data,
        read: data.read || false,
        createdAt: new Date(),
      }
      this.notificationsData.push(notification)
      return notification
    },
    findMany: async ({ where }: { where?: any }) => {
      if (!where) return this.notificationsData
      
      return this.notificationsData.filter(n => {
        if (where.advisorId && n.advisorId !== where.advisorId) return false
        if (where.read !== undefined && n.read !== where.read) return false
        return true
      })
    },
  }

  $transaction = async (fn: Function) => {
    // Simple transaction mock - just execute the function
    return fn(this)
  }

  otpTokens = {
    create: async ({ data }: { data: any }) => {
      const token: OTPToken = {
        id: `otp-${Date.now()}`,
        ...data,
        createdAt: new Date(),
      }
      this.otpTokensData.push(token)
      return token
    },
    findFirst: async ({ where, orderBy }: { where: any; orderBy?: any }) => {
      let results = this.otpTokensData.filter(token => {
        if (where.userId && token.userId !== where.userId) return false
        if (where.verified !== undefined && token.verified !== where.verified) return false
        return true
      })
      
      if (orderBy?.createdAt === 'desc') {
        results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      }
      
      return results[0] || null
    },
    findMany: async ({ where }: { where: any }) => {
      return this.otpTokensData.filter(token => {
        if (where.userId && token.userId !== where.userId) return false
        if (where.verified !== undefined && token.verified !== where.verified) return false
        if (where.createdAt?.gte && token.createdAt < where.createdAt.gte) return false
        return true
      })
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      const index = this.otpTokensData.findIndex(t => t.id === where.id)
      if (index === -1) throw new Error('OTP Token not found')
      this.otpTokensData[index] = { ...this.otpTokensData[index], ...data }
      return this.otpTokensData[index]
    },
    deleteMany: async ({ where }: { where: any }) => {
      const initialLength = this.otpTokensData.length
      this.otpTokensData = this.otpTokensData.filter(token => {
        if (where.userId && token.userId !== where.userId) return true
        if (where.verified !== undefined && token.verified !== where.verified) return true
        return false
      })
      return { count: initialLength - this.otpTokensData.length }
    },
  }

  otpAttempts = {
    create: async ({ data }: { data: any }) => {
      const attempt: OTPAttempt = {
        id: `attempt-${Date.now()}`,
        ...data,
        createdAt: new Date(),
      }
      this.otpAttemptsData.push(attempt)
      return attempt
    },
    count: async ({ where }: { where: any }) => {
      return this.otpAttemptsData.filter(attempt => {
        if (where.userId && attempt.userId !== where.userId) return false
        if (where.otpTokenId && attempt.otpTokenId !== where.otpTokenId) return false
        return true
      }).length
    },
    deleteMany: async ({ where }: { where: any }) => {
      const initialLength = this.otpAttemptsData.length
      this.otpAttemptsData = this.otpAttemptsData.filter(attempt => {
        if (where.userId && attempt.userId !== where.userId) return true
        return false
      })
      return { count: initialLength - this.otpAttemptsData.length }
    },
  }

  auditLog = {
    create: async ({ data }: { data: Omit<AuditLog, 'id' | 'createdAt'> }) => {
      const log: AuditLog = {
        ...data,
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
      }
      this.auditLogs.push(log)
      return log
    },

    findMany: async () => {
      return this.auditLogs
    },
  }

  // Test utility methods
  _reset() {
    this.advisorsData.clear()
    this.verificationTokensData = []
    this.emailLogsData = []
    this.onboardingProgressData.clear()
    this.contentPreferencesData.clear()
    this.demoContentData = []
    this.notificationsData = []
    this.auditLogs = []
    this.otpTokensData = []
    this.otpAttemptsData = []
  }

  _getAdvisors() {
    return Array.from(this.advisorsData.values())
  }

  _getAuditLogs() {
    return this.auditLogs
  }
}

// Export a singleton instance
export const prisma = new MockDatabase()
export const database = prisma // Alias for compatibility

// Export types
export type { Advisor, AuditLog, VerificationToken, EmailLog, OnboardingProgress }