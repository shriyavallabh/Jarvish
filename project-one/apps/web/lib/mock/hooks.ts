/**
 * Mock hooks for development/testing
 * These replace Supabase hooks with mock data
 */

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { database } from '@/lib/utils/database'

interface Advisor {
  id: string
  business_name: string
  subscription_tier: string
  euin: string
  [key: string]: any
}

interface Content {
  id: string
  title: string
  content_english: string
  content_hindi?: string | null
  category: string
  topic_family: string
  compliance_score: number
  ai_score: number
  status: string
  scheduled_for: string | null
  created_at: string
  is_approved: boolean
}

// Mock hook for advisor data
export function useAdvisor() {
  const { user } = useUser()
  const [advisor, setAdvisor] = useState<Advisor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const fetchAdvisor = async () => {
      try {
        // Check if advisor exists in mock database
        const mockAdvisor = await database.advisors.findUnique({
          where: { id: user.id }
        })

        if (mockAdvisor) {
          // Get profile data
          const profile = await database.advisorProfiles.findUnique({
            where: { advisorId: user.id }
          })

          setAdvisor({
            id: mockAdvisor.id,
            business_name: profile?.firmName || mockAdvisor.name,
            subscription_tier: mockAdvisor.tier,
            euin: profile?.firmRegistrationNumber || 'E123456',
            email: mockAdvisor.email,
            mobile: mockAdvisor.mobile,
            ...mockAdvisor,
            ...profile
          })
        }
      } catch (err) {
        console.error('Error fetching advisor:', err)
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchAdvisor()
  }, [user])

  return { advisor, loading, error }
}

// Mock hook for content
export function useContent() {
  const { advisor } = useAdvisor()
  const [content, setContent] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!advisor) {
      setLoading(false)
      return
    }

    const fetchContent = async () => {
      try {
        // Get mock content
        const mockContent = await database.contentHistory.findMany({
          where: { advisorId: advisor.id }
        })

        // Transform to expected format
        const formattedContent: Content[] = mockContent.map(item => ({
          id: item.id,
          title: `${item.type.replace('_', ' ').toUpperCase()} - ${new Date(item.createdAt).toLocaleDateString()}`,
          content_english: item.content,
          content_hindi: item.language === 'Hindi' ? item.content : null,
          category: item.type,
          topic_family: 'Financial Advisory',
          compliance_score: item.complianceScore,
          ai_score: item.complianceScore,
          status: item.status,
          scheduled_for: item.scheduledFor?.toISOString() || null,
          created_at: item.createdAt.toISOString(),
          is_approved: item.status === 'approved'
        }))

        setContent(formattedContent)
      } catch (err) {
        console.error('Error fetching content:', err)
        // Use fallback mock data if database fails
        setContent(getMockContent())
      } finally {
        setLoading(false)
      }
    }

    fetchContent()
  }, [advisor])

  const createContent = async (contentData: any) => {
    // Mock content creation
    const newContent: Content = {
      id: `content-${Date.now()}`,
      title: contentData.title || 'New Content',
      content_english: contentData.content,
      content_hindi: contentData.content_hindi,
      category: contentData.category || 'market_update',
      topic_family: 'Financial Advisory',
      compliance_score: 95,
      ai_score: 92,
      status: 'approved',
      scheduled_for: new Date().toISOString(),
      created_at: new Date().toISOString(),
      is_approved: true
    }
    
    setContent(prev => [newContent, ...prev])
    return newContent
  }

  const updateContent = async (id: string, updates: any) => {
    setContent(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, ...updates }
          : item
      )
    )
    return content.find(c => c.id === id)
  }

  const deleteContent = async (id: string) => {
    setContent(prev => prev.filter(item => item.id !== id))
  }

  return {
    content,
    loading,
    error,
    createContent,
    updateContent,
    deleteContent
  }
}

// Mock hook for content delivery
export function useContentDelivery() {
  const [deliveries, setDeliveries] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Mock delivery data
    setDeliveries([
      {
        id: '1',
        content_id: 'content-1',
        delivery_status: 'delivered',
        delivered_at: new Date().toISOString(),
        channel: 'whatsapp'
      },
      {
        id: '2',
        content_id: 'content-2',
        delivery_status: 'delivered',
        delivered_at: new Date().toISOString(),
        channel: 'whatsapp'
      }
    ])
  }, [])

  return { deliveries, loading, error }
}

// Mock hook for analytics
export function useAdvisorAnalytics() {
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Mock analytics data
    setAnalytics({
      engagement_rate: 78.5,
      total_content: 45,
      total_delivered: 42,
      total_clients: 150,
      active_clients: 142
    })
  }, [])

  return { analytics, loading, error }
}

// Mock hook for subscription
export function useSubscription() {
  const { advisor } = useAdvisor()
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (advisor) {
      setSubscription({
        id: 'sub-1',
        advisor_id: advisor.id,
        tier: advisor.subscription_tier,
        status: 'active',
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
    }
  }, [advisor])

  return { subscription, loading, error }
}

// Helper function for fallback mock content
function getMockContent(): Content[] {
  return [
    {
      id: 'mock-1',
      title: 'Market Update - Today',
      content_english: 'Markets witnessed strong recovery today with Nifty closing above 19,500. Banking and IT sectors led the rally. Stay invested for long-term wealth creation.',
      content_hindi: 'आज बाजारों में मजबूत रिकवरी देखी गई, निफ्टी 19,500 के ऊपर बंद हुआ। बैंकिंग और आईटी सेक्टर ने रैली का नेतृत्व किया। लंबी अवधि के धन सृजन के लिए निवेशित रहें।',
      category: 'market_update',
      topic_family: 'Market Analysis',
      compliance_score: 95,
      ai_score: 92,
      status: 'approved',
      scheduled_for: new Date().toISOString(),
      created_at: new Date().toISOString(),
      is_approved: true
    },
    {
      id: 'mock-2',
      title: 'SIP Benefits - Educational',
      content_english: 'Systematic Investment Plans (SIP) offer: 1) Rupee cost averaging 2) Disciplined investing 3) Start with small amounts. Begin your SIP journey today!',
      content_hindi: 'म्यूचुअल फंड में SIP के फायदे: 1) रुपये की औसत लागत 2) अनुशासित निवेश 3) छोटी राशि से शुरुआत। आज ही अपना SIP शुरू करें!',
      category: 'educational',
      topic_family: 'Investment Education',
      compliance_score: 88,
      ai_score: 90,
      status: 'approved',
      scheduled_for: new Date().toISOString(),
      created_at: new Date().toISOString(),
      is_approved: true
    },
    {
      id: 'mock-3',
      title: 'Tax Saving Tips',
      content_english: 'Last date for tax-saving investments approaching! Invest in ELSS funds to save tax under Section 80C and create wealth. Maximum deduction: ₹1.5 lakhs.',
      content_hindi: null,
      category: 'tax_tip',
      topic_family: 'Tax Planning',
      compliance_score: 90,
      ai_score: 88,
      status: 'approved',
      scheduled_for: new Date().toISOString(),
      created_at: new Date().toISOString(),
      is_approved: true
    }
  ]
}