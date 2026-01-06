import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { FeedbackSubmission, CvLabLearnedPattern } from '@/lib/types/cv-lab'

// POST /api/cv-lab/feedback - Submit feedback for a message
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body: FeedbackSubmission = await request.json()
    const { message_id, cv_id, feedback_type, rating, tags, comment, correction_text, preferred_over_message_id } = body

    if (!message_id || !cv_id) {
      return NextResponse.json({ error: 'message_id y cv_id son requeridos' }, { status: 400 })
    }

    // Safety check: Don't try to insert if message_id is a temporary client-side ID
    if (message_id.startsWith('temp-') || message_id.startsWith('assistant-')) {
      console.warn('Received feedback for temporary message ID. Ignoring to avoid UUID error:', message_id)
      return NextResponse.json({
        message: 'Feedback ignorado para ID temporal. Intenta de nuevo cuando el mensaje se haya sincronizado.',
        ignored: true
      })
    }

    // Insert feedback
    const { data: feedback, error: feedbackError } = await supabase
      .from('cv_lab_feedback')
      .insert({
        message_id,
        cv_id,
        feedback_type: feedback_type || 'rating',
        rating: rating || null,
        tags: tags || [],
        comment: comment || null,
        correction_text: correction_text || null,
        preferred_over_message_id: preferred_over_message_id || null
      })
      .select()
      .single()

    if (feedbackError) {
      console.error('Error inserting feedback:', feedbackError)
      return NextResponse.json({ error: feedbackError.message }, { status: 500 })
    }

    // Update prompt version metrics if rating provided
    if (rating) {
      await updatePromptMetrics(supabase, rating)
    }

    // Analyze and learn patterns from feedback
    if (tags && tags.length > 0) {
      await learnFromFeedback(supabase, message_id, tags, rating || 3)
    }

    return NextResponse.json({ feedback, message: 'Feedback guardado exitosamente' })
  } catch (error) {
    console.error('Error in POST /api/cv-lab/feedback:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// GET /api/cv-lab/feedback - Get feedback stats
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Get overall stats
    const { data: allFeedback } = await supabase
      .from('cv_lab_feedback')
      .select('rating, tags')

    const totalFeedback = allFeedback?.length || 0
    const ratingsSum = allFeedback?.reduce((sum, f) => sum + (f.rating || 0), 0) || 0
    const ratedCount = allFeedback?.filter(f => f.rating !== null).length || 0
    const avgRating = ratedCount > 0 ? ratingsSum / ratedCount : 0
    const positiveCount = allFeedback?.filter(f => f.rating && f.rating >= 4).length || 0
    const positivePercentage = ratedCount > 0 ? (positiveCount / ratedCount) * 100 : 0

    // Count tags
    const tagCounts: Record<string, number> = {}
    allFeedback?.forEach(f => {
      (f.tags as string[])?.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    })
    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }))

    // Get recent patterns
    const { data: recentPatterns } = await supabase
      .from('cv_lab_learned_patterns')
      .select('*')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(10)

    // Get active prompt version
    const { data: activePrompt } = await supabase
      .from('cv_lab_prompt_versions')
      .select('*')
      .eq('is_active', true)
      .single()

    return NextResponse.json({
      stats: {
        total_feedback: totalFeedback,
        avg_rating: avgRating,
        positive_percentage: positivePercentage,
        top_tags: topTags,
        recent_patterns: recentPatterns || []
      },
      active_prompt: activePrompt
    })
  } catch (error) {
    console.error('Error in GET /api/cv-lab/feedback:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// Helper: Update prompt version metrics
async function updatePromptMetrics(supabase: any, rating: number) {
  const { data: activePrompt } = await supabase
    .from('cv_lab_prompt_versions')
    .select('id, total_ratings, positive_ratings, negative_ratings, avg_rating')
    .eq('is_active', true)
    .single()

  if (activePrompt) {
    const newTotalRatings = activePrompt.total_ratings + 1
    const newPositiveRatings = activePrompt.positive_ratings + (rating >= 4 ? 1 : 0)
    const newNegativeRatings = activePrompt.negative_ratings + (rating <= 2 ? 1 : 0)
    const newAvgRating = ((activePrompt.avg_rating * activePrompt.total_ratings) + rating) / newTotalRatings

    await supabase
      .from('cv_lab_prompt_versions')
      .update({
        total_ratings: newTotalRatings,
        positive_ratings: newPositiveRatings,
        negative_ratings: newNegativeRatings,
        avg_rating: newAvgRating
      })
      .eq('id', activePrompt.id)
  }
}

// Helper: Learn patterns from feedback (Enhanced)
async function learnFromFeedback(supabase: any, messageId: string, tags: string[], rating: number) {
  // Get the message content to analyze
  const { data: message } = await supabase
    .from('cv_lab_messages')
    .select('content, role')
    .eq('id', messageId)
    .single()

  if (!message || message.role !== 'assistant') return

  const isPositive = rating >= 4
  const content = message.content as string

  // Enhanced pattern mappings with more context
  const patternMappings: Record<string, { type: string; category: string; description: string }> = {
    'too_verbose': {
      type: 'avoid_phrase',
      category: 'general',
      description: 'Evitar respuestas muy largas y detalladas innecesariamente'
    },
    'too_brief': {
      type: 'format_rule',
      category: 'general',
      description: 'Dar respuestas más completas y detalladas'
    },
    'good_metrics': {
      type: 'preferred_phrase',
      category: 'experience',
      description: 'Siempre pedir métricas cuantificables (%, $, números)'
    },
    'invented_data': {
      type: 'avoid_phrase',
      category: 'general',
      description: 'NUNCA inventar información que el usuario no proporcionó'
    },
    'good_format': {
      type: 'format_rule',
      category: 'general',
      description: 'Mantener formato limpio con cv_update blocks'
    },
    'bad_format': {
      type: 'format_rule',
      category: 'general',
      description: 'Mejorar estructura de respuestas y JSON'
    },
    'wrong_tone': {
      type: 'tone_preference',
      category: 'general',
      description: 'Usar tono más profesional y conciso'
    },
    'good_tone': {
      type: 'tone_preference',
      category: 'general',
      description: 'Mantener tono profesional pero amigable'
    },
    'helpful': {
      type: 'preferred_phrase',
      category: 'general',
      description: 'Proporcionar sugerencias prácticas y accionables'
    },
    'not_helpful': {
      type: 'avoid_phrase',
      category: 'general',
      description: 'Mejorar la utilidad de las respuestas'
    },
    'accurate': {
      type: 'preferred_phrase',
      category: 'general',
      description: 'Mantener precisión en recomendaciones'
    },
    'inaccurate': {
      type: 'avoid_phrase',
      category: 'general',
      description: 'Verificar y mejorar la precisión del contenido'
    },
    'pdf_download': {
      type: 'preferred_phrase',
      category: 'general',
      description: 'Usuario satisfecho con el CV generado (descargó PDF)'
    }
  }

  for (const tag of tags) {
    const mapping = patternMappings[tag]
    if (!mapping) continue

    // Check if pattern already exists
    const { data: existingPattern } = await supabase
      .from('cv_lab_learned_patterns')
      .select('id, reinforcement_count, confidence, examples')
      .eq('pattern_type', mapping.type)
      .eq('pattern', tag)
      .single()

    if (existingPattern) {
      // Reinforce existing pattern with smarter confidence adjustment
      const confidenceDelta = isPositive ? 0.08 : -0.06 // Positive feedback stronger
      const newConfidence = Math.max(0.1, Math.min(0.99, existingPattern.confidence + confidenceDelta))
      const examples = existingPattern.examples || []

      // Keep only best examples (up to 10)
      if (examples.length < 10) {
        examples.push({
          text: content.substring(0, 300), // More context
          isGood: isPositive,
          timestamp: new Date().toISOString()
        })
      } else {
        // Replace oldest example
        examples.shift()
        examples.push({
          text: content.substring(0, 300),
          isGood: isPositive,
          timestamp: new Date().toISOString()
        })
      }

      await supabase
        .from('cv_lab_learned_patterns')
        .update({
          reinforcement_count: existingPattern.reinforcement_count + 1,
          confidence: newConfidence,
          examples,
          is_active: newConfidence > 0.4, // Lower threshold
          updated_at: new Date().toISOString()
        })
        .eq('id', existingPattern.id)
    } else {
      // Create new pattern with description
      await supabase
        .from('cv_lab_learned_patterns')
        .insert({
          pattern_type: mapping.type,
          pattern: tag,
          category: mapping.category,
          confidence: isPositive ? 0.65 : 0.45, // Start higher for positive
          reinforcement_count: 1,
          is_active: true,
          examples: [{
            text: content.substring(0, 300),
            isGood: isPositive,
            timestamp: new Date().toISOString(),
            description: mapping.description
          }]
        })
    }
  }

  // Auto-update prompt metrics
  await updatePromptMetrics(supabase, rating)
}
