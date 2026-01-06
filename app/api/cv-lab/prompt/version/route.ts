import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/cv-lab/prompt/version
 * Returns the active prompt version
 */
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: activePrompt, error } = await supabase
      .from('cv_lab_prompt_versions')
      .select('version')
      .eq('is_active', true)
      .single()

    if (error || !activePrompt) {
      return NextResponse.json({ version: 'v1.0' })
    }

    return NextResponse.json({ version: activePrompt.version })
  } catch (error) {
    console.error('Error fetching prompt version:', error)
    return NextResponse.json({ version: 'v1.0' })
  }
}
