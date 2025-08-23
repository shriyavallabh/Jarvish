import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { adminService } from '@/lib/services/admin-service'

export async function GET() {
  try {
    const { userId, sessionClaims } = await auth()
    
    // Check if user is admin
    if (!userId || sessionClaims?.metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const health = await adminService.getSystemHealth()
    
    return NextResponse.json(health)
  } catch (error) {
    console.error('Error checking system health:', error)
    return NextResponse.json(
      { error: 'Failed to check system health' },
      { status: 500 }
    )
  }
}