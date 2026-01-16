import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { EMPTY_CV_JSON } from '@/lib/types/cv-lab'

// GET /api/cv-lab - List all CVs
// RLS automáticamente filtra por user_id (usuarios regulares)
// o permite acceso completo (admins)
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Las políticas RLS automáticamente:
    // - Permiten a usuarios ver solo sus CVs (WHERE user_id = auth.uid())
    // - Permiten a admins ver todos los CVs (WHERE is_admin())
    const { data: cvs, error } = await supabase
      .from('cv_lab_cvs')
      .select(`
        *,
        cv_lab_versions(count),
        cv_lab_messages(count)
      `)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching CVs:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ cvs })
  } catch (error) {
    console.error('Error in GET /api/cv-lab:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// POST /api/cv-lab - Create new CV
// RLS automáticamente valida que user_id = auth.uid() en INSERT
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { title, target_role, industry, language = 'es' } = body

    if (!title) {
      return NextResponse.json({ error: 'El título es requerido' }, { status: 400 })
    }

    // Create the CV - RLS policy valida que user_id = auth.uid()
    const { data: cv, error: cvError } = await supabase
      .from('cv_lab_cvs')
      .insert({
        user_id: user.id, // Asignar CV al usuario autenticado
        title,
        target_role,
        industry,
        language,
        status: 'DRAFT',
        readiness_score: 0
      })
      .select()
      .single()

    if (cvError) {
      console.error('Error creating CV:', cvError)
      return NextResponse.json({ error: cvError.message }, { status: 500 })
    }

    // Create initial version with empty CV JSON
    const initialCvJson = {
      ...EMPTY_CV_JSON,
      constraints: {
        ...EMPTY_CV_JSON.constraints,
        language: language as 'es' | 'en',
        targetRole: target_role || ''
      }
    }

    const { data: version, error: versionError } = await supabase
      .from('cv_lab_versions')
      .insert({
        cv_id: cv.id,
        version_number: 1,
        cv_json: initialCvJson
      })
      .select()
      .single()

    if (versionError) {
      console.error('Error creating initial version:', versionError)
      // Still return the CV, version creation is not critical
    }

    // Update CV with current_version_id
    if (version) {
      await supabase
        .from('cv_lab_cvs')
        .update({ current_version_id: version.id })
        .eq('id', cv.id)
    }

    // Create initial system message
    await supabase
      .from('cv_lab_messages')
      .insert({
        cv_id: cv.id,
        role: 'system',
        content: `CV Lab iniciado. Objetivo: ${target_role || 'No especificado'}. Idioma: ${language === 'es' ? 'Español' : 'English'}.`,
        tokens_in: 0,
        tokens_out: 0
      })

    return NextResponse.json({ cv, version }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/cv-lab:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
