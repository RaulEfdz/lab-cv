import { createClient as createServerClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/cv-lab/training/feedback - Submit feedback for a message
// Body: { messageId: string, rating: 1-5, tags?: string[], comment?: string }
// Public endpoint for training purposes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messageId, rating, tags, comment } = body

    if (!messageId || !rating) {
      return NextResponse.json(
        { error: 'messageId and rating are required' },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'rating must be between 1 and 5' },
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

    // Get the message to get session_id
    const { data: message } = await supabase
      .from('cv_lab_training_messages')
      .select('session_id')
      .eq('id', messageId)
      .single()

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      )
    }

    // Insert feedback
    const { data: feedback, error } = await supabase
      .from('cv_lab_training_feedback')
      .insert({
        message_id: messageId,
        session_id: message.session_id,
        rating,
        tags: tags || [],
        comment: comment || null
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting feedback:', error)
      return NextResponse.json(
        { error: 'Failed to save feedback' },
        { status: 500 }
      )
    }

    // Update learned patterns based on feedback (pass comment as learned instruction)
    await updateLearnedPatterns(rating, tags || [], comment || '')

    return NextResponse.json({
      feedbackId: feedback.id,
      message: 'Feedback saved successfully',
      patternsUpdated: tags && tags.length > 0,
      learnedInstruction: comment ? true : false
    })
  } catch (error) {
    console.error('Error in POST /api/cv-lab/training/feedback:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function updateLearnedPatterns(rating: number, tags: string[], comment: string) {
  if (tags.length === 0) return

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
  const isPositive = rating >= 4

  for (const tag of tags) {
    // Get existing pattern
    const { data: existing } = await supabase
      .from('cv_lab_learned_patterns')
      .select('*')
      .eq('pattern', tag)
      .maybeSingle()

    if (existing) {
      // Update existing pattern
      const newCount = existing.reinforcement_count + 1
      const newConfidence = Math.min(
        0.99,
        existing.confidence + (isPositive ? 0.08 : -0.06) // Stronger learning rate
      )

      // Build update object - include learned_instruction if comment is provided
      const updateData: Record<string, any> = {
        reinforcement_count: newCount,
        confidence: Math.max(0.1, newConfidence)
      }

      // If there's a detailed comment, save it as learned instruction
      if (comment && comment.length > 20) {
        updateData.learned_instruction = comment
      }

      await supabase
        .from('cv_lab_learned_patterns')
        .update(updateData)
        .eq('id', existing.id)
    } else {
      // Create new pattern with learned instruction from comment
      const patternType = getPatternType(tag)
      const insertData: Record<string, any> = {
        pattern_type: patternType,
        pattern: tag,
        confidence: isPositive ? 0.65 : 0.45,
        reinforcement_count: 1,
        category: 'general',
        is_active: true
      }

      // If there's a detailed comment, save it as learned instruction
      if (comment && comment.length > 20) {
        insertData.learned_instruction = comment
      }

      await supabase.from('cv_lab_learned_patterns').insert(insertData)
    }
  }
}

function getPatternType(tag: string): string {
  const negativePatterns = ['too_verbose', 'invented_data', 'bad_format', 'wrong_tone', 'not_helpful', 'inaccurate']
  const positivePatterns = ['good_metrics', 'good_format', 'good_tone', 'helpful', 'accurate']
  const formatPatterns = ['good_format', 'bad_format']
  const tonePatterns = ['good_tone', 'wrong_tone']

  if (tonePatterns.includes(tag)) return 'tone_preference'
  if (formatPatterns.includes(tag)) return 'format_rule'
  if (negativePatterns.includes(tag)) return 'avoid_phrase'
  if (positivePatterns.includes(tag)) return 'preferred_phrase'

  return 'preferred_phrase'
}
