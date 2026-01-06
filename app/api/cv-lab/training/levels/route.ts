import { createClient as createServerClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { TRAINING_LEVELS, getTrainingLevel, calculateLevelScore, isLevelPassed } from '@/lib/cv-lab/training-levels'

// GET /api/cv-lab/training/levels - Get all levels and current progress
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Get training progress from database
    const { data: progress } = await supabase
      .from('cv_lab_training_progress')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Get learned patterns count
    const { data: patterns } = await supabase
      .from('cv_lab_learned_patterns')
      .select('pattern, confidence, reinforcement_count')
      .eq('is_active', true)
      .gte('confidence', 0.5)

    const levelsWithStatus = TRAINING_LEVELS.map(level => ({
      ...level,
      status: progress?.completed_levels?.includes(level.level) ? 'completed' :
              progress?.current_level === level.level ? 'in_progress' : 'locked',
      score: progress?.level_scores?.[level.level] || 0
    }))

    return NextResponse.json({
      levels: levelsWithStatus,
      progress: {
        currentLevel: progress?.current_level || 1,
        completedLevels: progress?.completed_levels || [],
        totalScore: progress?.total_score || 0,
        skillsLearned: progress?.skills_learned || [],
        patternsStrengthened: patterns?.length || 0
      },
      summary: {
        totalLevels: TRAINING_LEVELS.length,
        completedCount: progress?.completed_levels?.length || 0,
        overallProgress: Math.round(((progress?.completed_levels?.length || 0) / TRAINING_LEVELS.length) * 100)
      }
    })
  } catch (error) {
    console.error('Error getting training levels:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/cv-lab/training/levels - Run a specific level test
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { level, scenarioId, aiResponse, evaluation } = body

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const levelData = getTrainingLevel(level)
    if (!levelData) {
      return NextResponse.json({ error: 'Invalid level' }, { status: 400 })
    }

    const scenario = levelData.scenarios.find(s => s.id === scenarioId)
    if (!scenario) {
      return NextResponse.json({ error: 'Invalid scenario' }, { status: 400 })
    }

    // Save test result
    const { data: testResult, error: testError } = await supabase
      .from('cv_lab_training_tests')
      .insert({
        level,
        scenario_id: scenarioId,
        user_message: scenario.userMessage,
        ai_response: aiResponse,
        passed: evaluation.passed,
        score: evaluation.score,
        feedback: evaluation.feedback,
        tags: evaluation.tags
      })
      .select()
      .single()

    if (testError) {
      console.error('Error saving test:', testError)
    }

    // Update learned patterns based on evaluation
    for (const tag of evaluation.tags || []) {
      const { data: existing } = await supabase
        .from('cv_lab_learned_patterns')
        .select('*')
        .eq('pattern', tag)
        .maybeSingle()

      if (existing) {
        const newConfidence = Math.min(0.99, existing.confidence + (evaluation.passed ? 0.08 : -0.06))
        await supabase
          .from('cv_lab_learned_patterns')
          .update({
            confidence: Math.max(0.1, newConfidence),
            reinforcement_count: existing.reinforcement_count + 1,
            learned_instruction: evaluation.instruction || existing.learned_instruction
          })
          .eq('id', existing.id)
      } else {
        await supabase.from('cv_lab_learned_patterns').insert({
          pattern_type: evaluation.passed ? 'preferred_phrase' : 'avoid_phrase',
          pattern: tag,
          confidence: evaluation.passed ? 0.65 : 0.45,
          reinforcement_count: 1,
          category: 'general',
          is_active: true,
          learned_instruction: evaluation.instruction
        })
      }
    }

    // Update progress
    const { data: currentProgress } = await supabase
      .from('cv_lab_training_progress')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const levelScores = currentProgress?.level_scores || {}
    levelScores[level] = Math.max(levelScores[level] || 0, evaluation.score)

    const completedLevels = currentProgress?.completed_levels || []
    if (evaluation.passed && !completedLevels.includes(level)) {
      // Check if all scenarios in level passed
      const { data: levelTests } = await supabase
        .from('cv_lab_training_tests')
        .select('scenario_id, passed')
        .eq('level', level)
        .eq('passed', true)

      const passedScenarios = new Set(levelTests?.map(t => t.scenario_id) || [])
      if (passedScenarios.size >= levelData.scenarios.length) {
        completedLevels.push(level)
      }
    }

    const skillsLearned = [...new Set([
      ...(currentProgress?.skills_learned || []),
      ...(evaluation.passed ? levelData.skills : [])
    ])]

    await supabase.from('cv_lab_training_progress').upsert({
      id: currentProgress?.id || undefined,
      current_level: Math.max(...completedLevels, 0) + 1,
      completed_levels: completedLevels,
      level_scores: levelScores,
      total_score: Object.values(levelScores).reduce((a: number, b: any) => a + (b as number), 0) as number,
      skills_learned: skillsLearned,
      updated_at: new Date().toISOString()
    })

    return NextResponse.json({
      testId: testResult?.id,
      passed: evaluation.passed,
      score: evaluation.score,
      feedback: evaluation.feedback,
      levelCompleted: completedLevels.includes(level),
      nextLevel: completedLevels.includes(level) ? level + 1 : level,
      skillsLearned: evaluation.passed ? levelData.skills : []
    })
  } catch (error) {
    console.error('Error in training level:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
