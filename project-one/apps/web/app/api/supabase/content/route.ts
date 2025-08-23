import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs'
import { AdvisorService, ContentService } from '@/lib/supabase/services'

const advisorService = new AdvisorService()
const contentService = new ContentService()

// GET /api/supabase/content - Get advisor's content
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const advisor = await advisorService.getAdvisorByClerkId(user.id)
    if (!advisor) {
      return NextResponse.json({ error: 'Advisor not found' }, { status: 404 })
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')

    // This would typically use Supabase client directly for filtering
    // For now, returning success with empty data
    return NextResponse.json({
      content: [],
      filters: { status, category }
    })
  } catch (error) {
    console.error('Error fetching content:', error)
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    )
  }
}

// POST /api/supabase/content - Create new content
export async function POST(request: NextRequest) {
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
    const { title, content_english, content_hindi, category, topic_family } = body

    // Validate required fields
    if (!title || !content_english || !category || !topic_family) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create content
    const content = await contentService.createContent({
      advisor_id: advisor.id,
      title,
      content_english,
      content_hindi,
      category,
      topic_family,
      status: 'pending', // Will go through compliance check
      compliance_score: 0,
      ai_score: 0
    })

    // TODO: Trigger compliance check workflow here
    // This would typically call your AI compliance service

    return NextResponse.json(content, { status: 201 })
  } catch (error) {
    console.error('Error creating content:', error)
    return NextResponse.json(
      { error: 'Failed to create content' },
      { status: 500 }
    )
  }
}

// PATCH /api/supabase/content/[id] - Update content
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
    const { contentId, ...updates } = body

    if (!contentId) {
      return NextResponse.json(
        { error: 'Content ID required' },
        { status: 400 }
      )
    }

    const content = await contentService.updateContent(contentId, updates)
    return NextResponse.json(content)
  } catch (error) {
    console.error('Error updating content:', error)
    return NextResponse.json(
      { error: 'Failed to update content' },
      { status: 500 }
    )
  }
}