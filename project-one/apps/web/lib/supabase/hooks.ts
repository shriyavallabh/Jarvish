import { useEffect, useState } from 'react'
import { supabase } from './client'
import { Database } from './database.types'
import { useUser } from '@clerk/nextjs'

type Tables = Database['public']['Tables']
type Advisor = Tables['advisors']['Row']
type Content = Tables['content']['Row']
type Subscription = Tables['subscriptions']['Row']
type ContentDelivery = Tables['content_delivery']['Row']

// Hook to get current advisor profile
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
        const { data, error } = await supabase
          .from('advisors')
          .select('*')
          .eq('clerk_user_id', user.id)
          .single()

        if (error) throw error
        setAdvisor(data)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchAdvisor()

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('advisor-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'advisors',
          filter: `clerk_user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.new) {
            setAdvisor(payload.new as Advisor)
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  return { advisor, loading, error }
}

// Hook to manage content
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
        const { data, error } = await supabase
          .from('content')
          .select('*')
          .eq('advisor_id', advisor.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setContent(data || [])
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchContent()

    // Subscribe to real-time content updates
    const subscription = supabase
      .channel('content-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'content',
          filter: `advisor_id=eq.${advisor.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setContent(prev => [payload.new as Content, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setContent(prev => 
              prev.map(item => 
                item.id === (payload.new as Content).id 
                  ? payload.new as Content 
                  : item
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setContent(prev => 
              prev.filter(item => item.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [advisor])

  const createContent = async (contentData: Omit<Tables['content']['Insert'], 'advisor_id'>) => {
    if (!advisor) throw new Error('No advisor found')

    const { data, error } = await supabase
      .from('content')
      .insert({ ...contentData, advisor_id: advisor.id })
      .select()
      .single()

    if (error) throw error
    return data
  }

  const updateContent = async (id: string, updates: Tables['content']['Update']) => {
    const { data, error } = await supabase
      .from('content')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  const deleteContent = async (id: string) => {
    const { error } = await supabase
      .from('content')
      .delete()
      .eq('id', id)

    if (error) throw error
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

// Hook for subscription management
export function useSubscription() {
  const { advisor } = useAdvisor()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!advisor) {
      setLoading(false)
      return
    }

    const fetchSubscription = async () => {
      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('advisor_id', advisor.id)
          .eq('status', 'active')
          .single()

        if (error && error.code !== 'PGRST116') throw error
        setSubscription(data)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [advisor])

  return { subscription, loading, error }
}

// Hook for content delivery tracking
export function useContentDelivery(contentId?: string) {
  const { advisor } = useAdvisor()
  const [deliveries, setDeliveries] = useState<ContentDelivery[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!advisor) {
      setLoading(false)
      return
    }

    const fetchDeliveries = async () => {
      try {
        let query = supabase
          .from('content_delivery')
          .select('*')
          .eq('advisor_id', advisor.id)

        if (contentId) {
          query = query.eq('content_id', contentId)
        }

        const { data, error } = await query.order('scheduled_time', { ascending: false })

        if (error) throw error
        setDeliveries(data || [])
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchDeliveries()

    // Subscribe to real-time delivery updates
    const subscription = supabase
      .channel('delivery-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'content_delivery',
          filter: contentId 
            ? `content_id=eq.${contentId}` 
            : `advisor_id=eq.${advisor.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setDeliveries(prev => [payload.new as ContentDelivery, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setDeliveries(prev => 
              prev.map(item => 
                item.id === (payload.new as ContentDelivery).id 
                  ? payload.new as ContentDelivery 
                  : item
              )
            )
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [advisor, contentId])

  return { deliveries, loading, error }
}

// Hook for advisor analytics
export function useAdvisorAnalytics() {
  const { advisor } = useAdvisor()
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!advisor) {
      setLoading(false)
      return
    }

    const fetchAnalytics = async () => {
      try {
        const { data, error } = await supabase
          .from('advisor_analytics')
          .select('*')
          .eq('advisor_id', advisor.id)
          .single()

        if (error && error.code !== 'PGRST116') throw error
        
        // Also fetch metrics using function
        const { data: metrics, error: metricsError } = await supabase
          .rpc('get_advisor_metrics', { advisor_uuid: advisor.id })

        if (metricsError) throw metricsError

        setAnalytics({
          ...data,
          ...metrics?.[0]
        })
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [advisor])

  return { analytics, loading, error }
}