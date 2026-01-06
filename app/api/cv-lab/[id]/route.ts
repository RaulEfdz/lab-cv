import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/cv-lab/[id] - Get single CV with all relations
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verify admin access
    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Get CV with versions and messages
    const { data: cv, error } = await supabase
      .from('cv_lab_cvs')
      .select(`
        *,
        cv_lab_versions(*, order: version_number.desc),
        cv_lab_messages(*, order: created_at.asc),
        cv_lab_assets(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching CV:', error)
      return NextResponse.json({ error: 'CV no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ cv })
  } catch (error) {
    console.error('Error in GET /api/cv-lab/[id]:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// PATCH /api/cv-lab/[id] - Update CV metadata
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verify admin access
    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const allowedFields = ['title', 'target_role', 'industry', 'language', 'status', 'readiness_score']

    // Filter to only allowed fields
    const updateData: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 })
    }

    const { data: cv, error } = await supabase
      .from('cv_lab_cvs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating CV:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ cv })
  } catch (error) {
    console.error('Error in PATCH /api/cv-lab/[id]:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// DELETE /api/cv-lab/[id] - Delete CV and all related data
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verify admin access
    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Get assets to delete from storage (if using UploadThing)
    const { data: assets } = await supabase
      .from('cv_lab_assets')
      .select('file_key')
      .eq('cv_id', id)

    // Delete assets from UploadThing if there are any
    if (assets && assets.length > 0) {
      try {
        const { UTApi } = await import('uploadthing/server')
        const utapi = new UTApi()
        const fileKeys = assets.map(a => a.file_key).filter(Boolean)
        if (fileKeys.length > 0) {
          await utapi.deleteFiles(fileKeys)
        }
      } catch (utError) {
        console.error('Error deleting files from UploadThing:', utError)
        // Continue with deletion even if UT fails
      }
    }

    // Delete the CV (cascades to versions, messages, assets)
    const { error } = await supabase
      .from('cv_lab_cvs')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting CV:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/cv-lab/[id]:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
