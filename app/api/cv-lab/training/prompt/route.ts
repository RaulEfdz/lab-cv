import { createClient as createServerClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// GET /api/cv-lab/training/prompt - Get current active prompt with learned patterns
// Public endpoint for training purposes
export async function GET() {
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

    // Get active prompt
    const { data: activePrompt, error } = await supabase
      .from('cv_lab_prompt_versions')
      .select('*')
      .eq('is_active', true)
      .single()

    if (error || !activePrompt) {
      console.error('Error fetching active prompt:', error)
      return NextResponse.json(
        { error: 'No active prompt found', details: error?.message },
        { status: 404 }
      )
    }

    // Get learned patterns
    const { data: patterns } = await supabase
      .from('cv_lab_learned_patterns')
      .select('*')
      .eq('is_active', true)
      .gte('confidence', 0.5)
      .order('confidence', { ascending: false })

    // Get optimized prompt (base + learned rules)
    let optimizedPrompt: string
    try {
      optimizedPrompt = await getOptimizedPrompt()
    } catch (err) {
      optimizedPrompt = activePrompt.system_prompt
    }

    return NextResponse.json({
      version: activePrompt.version,
      basePrompt: activePrompt.system_prompt,
      optimizedPrompt, // Includes learned patterns
      learnedPatterns: patterns || [],
      stats: {
        avgRating: activePrompt.avg_rating,
        totalRatings: activePrompt.total_ratings,
        positiveRatings: activePrompt.positive_ratings,
        negativeRatings: activePrompt.negative_ratings
      },
      createdAt: activePrompt.created_at,
      changelog: activePrompt.changelog
    })
  } catch (error) {
    console.error('Error in GET /api/cv-lab/training/prompt:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
