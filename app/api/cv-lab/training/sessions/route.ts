import { createClient as createServerClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/cv-lab/training/sessions - Get all training sessions
// Public endpoint for training purposes
export async function GET(request: NextRequest) {
  try {
    // Use service role for public access (training purposes)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const sessionId = searchParams.get('sessionId')

    if (sessionId) {
      // Get specific session with messages
      const { data: session } = await supabase
        .from('cv_lab_training_sessions')
        .select(`
          *,
          messages:cv_lab_training_messages(
            id,
            role,
            content,
            created_at
          ),
          feedback:cv_lab_training_feedback(
            id,
            rating,
            tags,
            comment,
            created_at
          )
        `)
        .eq('id', sessionId)
        .single()

      if (!session) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({ session })
    }

    // Get all sessions
    const { data: sessions } = await supabase
      .from('cv_lab_training_sessions')
      .select(`
        *,
        messages:cv_lab_training_messages(count),
        feedback:cv_lab_training_feedback(count)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    return NextResponse.json({ sessions: sessions || [] })
  } catch (error) {
    console.error('Error in GET /api/cv-lab/training/sessions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/cv-lab/training/sessions - Create new training session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, metadata } = body

    // Use service role for public access (training purposes)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { data: session, error } = await supabase
      .from('cv_lab_training_sessions')
      .insert({
        name: name || `Training ${new Date().toISOString()}`,
        metadata: metadata || {}
      })
      .select()
      .single()

    if (error || !session) {
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      )
    }

    return NextResponse.json({ session })
  } catch (error) {
    console.error('Error in POST /api/cv-lab/training/sessions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/cv-lab/training/sessions?sessionId=xxx - Delete training session
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      )
    }

    // Use service role for public access (training purposes)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { error } = await supabase
      .from('cv_lab_training_sessions')
      .delete()
      .eq('id', sessionId)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete session' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Session deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/cv-lab/training/sessions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
