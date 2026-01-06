import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

function normalizeVersion(version: string) {
  const trimmed = version.trim()
  if (!trimmed) return ''
  return trimmed.startsWith('v') ? trimmed : `v${trimmed}`
}

function getNextVersion(latestVersion?: string | null) {
  if (!latestVersion) return 'v1.0'
  const match = latestVersion.match(/v?(\d+)(?:\.(\d+))?/i)
  if (!match) return 'v1.0'

  const major = parseInt(match[1], 10)
  const minor = parseInt(match[2] || '0', 10)
  return `v${major}.${minor + 1}`
}

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'No autorizado', supabase }
  }

  const { data: admin } = await supabase
    .from('admins')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!admin) {
    return { error: 'No autorizado', supabase }
  }

  return { error: null, supabase }
}

// GET /api/cv-lab/prompt - Get active prompt, versions, learned patterns and performance
export async function GET() {
  try {
    const { error, supabase } = await requireAdmin()
    if (error) return NextResponse.json({ error }, { status: 401 })

    const { data: activePrompt } = await supabase
      .from('cv_lab_prompt_versions')
      .select('*')
      .eq('is_active', true)
      .single()

    const { data: versions } = await supabase
      .from('cv_lab_prompt_versions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    // Get learned patterns
    const { data: learnedPatterns } = await supabase
      .from('cv_lab_learned_patterns')
      .select('*')
      .eq('is_active', true)
      .gte('confidence', 0.5)
      .order('confidence', { ascending: false })
      .limit(30)

    // Get feedback stats
    const { data: feedbackStats } = await supabase
      .from('cv_lab_feedback')
      .select('rating, tags')
      .order('created_at', { ascending: false })
      .limit(100)

    // Calculate top issues and strengths
    const tagCounts: Record<string, { positive: number; negative: number }> = {}
    feedbackStats?.forEach(f => {
      const isPositive = (f.rating || 3) >= 4
      ;(f.tags as string[])?.forEach(tag => {
        if (!tagCounts[tag]) tagCounts[tag] = { positive: 0, negative: 0 }
        if (isPositive) tagCounts[tag].positive++
        else tagCounts[tag].negative++
      })
    })

    const topIssues = Object.entries(tagCounts)
      .filter(([_, counts]) => counts.negative > counts.positive)
      .sort((a, b) => b[1].negative - a[1].negative)
      .slice(0, 5)
      .map(([tag, counts]) => ({ tag, count: counts.negative }))

    const topStrengths = Object.entries(tagCounts)
      .filter(([_, counts]) => counts.positive > counts.negative)
      .sort((a, b) => b[1].positive - a[1].positive)
      .slice(0, 5)
      .map(([tag, counts]) => ({ tag, count: counts.positive }))

    return NextResponse.json({
      activePrompt,
      versions: versions || [],
      learnedPatterns: learnedPatterns || [],
      performance: {
        topIssues,
        topStrengths,
        totalFeedback: feedbackStats?.length || 0
      }
    })
  } catch (error) {
    console.error('Error in GET /api/cv-lab/prompt:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// POST /api/cv-lab/prompt - Create and activate a new prompt version
export async function POST(request: NextRequest) {
  try {
    const { error, supabase } = await requireAdmin()
    if (error) return NextResponse.json({ error }, { status: 401 })

    const body = await request.json()
    const systemPrompt = String(body.systemPrompt || '').trim()
    const changelog = body.changelog ? String(body.changelog).trim() : null
    const requestedVersion = body.version ? normalizeVersion(String(body.version)) : ''

    if (!systemPrompt) {
      return NextResponse.json({ error: 'systemPrompt es requerido' }, { status: 400 })
    }

    let version = requestedVersion
    if (!version) {
      const { data: latest } = await supabase
        .from('cv_lab_prompt_versions')
        .select('version')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      version = getNextVersion(latest?.version)
    }

    const { data: newPrompt, error: insertError } = await supabase
      .from('cv_lab_prompt_versions')
      .insert({
        version,
        system_prompt: systemPrompt,
        is_active: true,
        changelog: changelog || null
      })
      .select('*')
      .single()

    if (insertError || !newPrompt) {
      console.error('Error inserting prompt:', insertError)
      return NextResponse.json({ error: insertError?.message || 'No se pudo guardar' }, { status: 500 })
    }

    await supabase
      .from('cv_lab_prompt_versions')
      .update({ is_active: false })
      .neq('id', newPrompt.id)

    return NextResponse.json({ prompt: newPrompt })
  } catch (error) {
    console.error('Error in POST /api/cv-lab/prompt:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// PATCH /api/cv-lab/prompt - Activate an existing version
export async function PATCH(request: NextRequest) {
  try {
    const { error, supabase } = await requireAdmin()
    if (error) return NextResponse.json({ error }, { status: 401 })

    const body = await request.json()
    const id = String(body.id || '').trim()

    if (!id) {
      return NextResponse.json({ error: 'id es requerido' }, { status: 400 })
    }

    const { data: updatedPrompt, error: updateError } = await supabase
      .from('cv_lab_prompt_versions')
      .update({ is_active: true })
      .eq('id', id)
      .select('*')
      .single()

    if (updateError || !updatedPrompt) {
      return NextResponse.json({ error: updateError?.message || 'No se pudo activar' }, { status: 500 })
    }

    await supabase
      .from('cv_lab_prompt_versions')
      .update({ is_active: false })
      .neq('id', id)

    return NextResponse.json({ prompt: updatedPrompt })
  } catch (error) {
    console.error('Error in PATCH /api/cv-lab/prompt:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
