import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs'
import { AdvisorService } from '@/lib/supabase/services'

const advisorService = new AdvisorService()

// GET /api/supabase/advisor - Get advisor profile
export async function GET() {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const advisor = await advisorService.getAdvisorByClerkId(user.id)
    if (!advisor) {
      return NextResponse.json({ error: 'Advisor not found' }, { status: 404 })
    }

    // Update last active
    await advisorService.updateLastActive(advisor.id)

    return NextResponse.json(advisor)
  } catch (error) {
    console.error('Error fetching advisor:', error)
    return NextResponse.json(
      { error: 'Failed to fetch advisor profile' },
      { status: 500 }
    )
  }
}

// POST /api/supabase/advisor - Create advisor profile
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { euin, businessName, mobile } = body

    // Validate required fields
    if (!euin || !businessName || !mobile) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if EUIN is available
    const euinAvailable = await advisorService.validateEUIN(euin)
    if (!euinAvailable) {
      return NextResponse.json(
        { error: 'EUIN already registered' },
        { status: 409 }
      )
    }

    // Check if advisor already exists
    const existingAdvisor = await advisorService.getAdvisorByClerkId(user.id)
    if (existingAdvisor) {
      return NextResponse.json(
        { error: 'Advisor profile already exists' },
        { status: 409 }
      )
    }

    // Create advisor
    const advisor = await advisorService.createAdvisor({
      clerk_user_id: user.id,
      email: user.emailAddresses[0].emailAddress,
      euin,
      business_name: businessName,
      mobile,
      subscription_tier: 'basic'
    })

    return NextResponse.json(advisor, { status: 201 })
  } catch (error) {
    console.error('Error creating advisor:', error)
    return NextResponse.json(
      { error: 'Failed to create advisor profile' },
      { status: 500 }
    )
  }
}

// PATCH /api/supabase/advisor - Update advisor profile
export async function PATCH(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const advisor = await advisorService.getAdvisorByClerkId(user.id)
    if (!advisor) {
      return NextResponse.json({ error: 'Advisor not found' }, { status: 404 })
    }

    const body = await request.json()
    const updatedAdvisor = await advisorService.updateAdvisor(advisor.id, body)

    return NextResponse.json(updatedAdvisor)
  } catch (error) {
    console.error('Error updating advisor:', error)
    return NextResponse.json(
      { error: 'Failed to update advisor profile' },
      { status: 500 }
    )
  }
}