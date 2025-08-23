import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase/client'

export async function GET() {
  try {
    const { userId, sessionClaims } = await auth()
    
    // Check if user is admin
    if (!userId || sessionClaims?.metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get count of pending content
    const { count, error } = await supabase
      .from('content_templates')
      .select('*', { count: 'exact', head: true })
      .eq('compliance_status', 'PENDING')

    if (error) {
      throw error
    }
    
    return NextResponse.json({ count: count || 0 })
  } catch (error) {
    console.error('Error fetching pending count:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pending count' },
      { status: 500 }
    )
  }
}