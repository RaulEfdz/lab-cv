import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import type { CvJson } from '@/lib/types/cv-lab'

const MAX_VERSIONS = 5

interface RouteContext {
  params: Promise<{ id: string }>
}

// POST /api/cv-lab/[id]/commit - Create a new version
export async function POST(
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

    // Get CV and verify it exists
    const { data: cv, error: cvError } = await supabase
      .from('cv_lab_cvs')
      .select('*')
      .eq('id', id)
      .single()

    if (cvError || !cv) {
      return NextResponse.json({ error: 'CV no encontrado' }, { status: 404 })
    }

    // Check if CV is closed
    if (cv.status === 'CLOSED') {
      return NextResponse.json(
        { error: 'Este CV está cerrado y no puede ser modificado' },
        { status: 400 }
      )
    }

    // Get body (cvJson to commit)
    const body = await request.json()
    const cvJson: CvJson = body.cvJson

    if (!cvJson) {
      return NextResponse.json({ error: 'cvJson es requerido' }, { status: 400 })
    }

    // Get current versions count and find the latest
    const { data: versions, error: versionsError } = await supabase
      .from('cv_lab_versions')
      .select('id, version_number')
      .eq('cv_id', id)
      .order('version_number', { ascending: false })

    if (versionsError) {
      console.error('Error fetching versions:', versionsError)
      return NextResponse.json({ error: versionsError.message }, { status: 500 })
    }

    // Calculate next version number
    const latestVersionNumber = versions?.[0]?.version_number || 0
    const nextVersionNumber = latestVersionNumber + 1

    // If at max versions, delete the oldest one
    if (versions && versions.length >= MAX_VERSIONS) {
      const oldestVersion = versions[versions.length - 1]
      await supabase
        .from('cv_lab_versions')
        .delete()
        .eq('id', oldestVersion.id)
    }

    // Generate render hash
    const renderHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(cvJson))
      .digest('hex')
      .substring(0, 64)

    // Create new version
    const { data: newVersion, error: createError } = await supabase
      .from('cv_lab_versions')
      .insert({
        cv_id: id,
        version_number: nextVersionNumber,
        cv_json: cvJson,
        render_hash: renderHash
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating version:', createError)
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    // Update CV with current_version_id
    await supabase
      .from('cv_lab_cvs')
      .update({ current_version_id: newVersion.id })
      .eq('id', id)

    return NextResponse.json({
      version: newVersion,
      message: `Versión ${nextVersionNumber} guardada correctamente`
    }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/cv-lab/[id]/commit:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// PATCH /api/cv-lab/[id]/commit - Update current version in place (for manual edits)
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

    // Get body
    const body = await request.json()
    const { cvJson, versionId } = body

    if (!cvJson) {
      return NextResponse.json({ error: 'cvJson es requerido' }, { status: 400 })
    }

    // Generate new render hash
    const renderHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(cvJson))
      .digest('hex')
      .substring(0, 64)

    // If versionId provided, update that specific version
    // Otherwise, update the latest version for this CV
    let targetVersionId = versionId

    if (!targetVersionId) {
      const { data: latestVersion } = await supabase
        .from('cv_lab_versions')
        .select('id')
        .eq('cv_id', id)
        .order('version_number', { ascending: false })
        .limit(1)
        .single()

      if (latestVersion) {
        targetVersionId = latestVersion.id
      }
    }

    if (!targetVersionId) {
      return NextResponse.json({ error: 'No hay versión para actualizar' }, { status: 400 })
    }

    // Update the version
    const { data: updatedVersion, error: updateError } = await supabase
      .from('cv_lab_versions')
      .update({
        cv_json: cvJson,
        render_hash: renderHash
      })
      .eq('id', targetVersionId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating version:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      version: updatedVersion,
      message: 'Versión actualizada correctamente'
    })

  } catch (error) {
    console.error('Error in PATCH /api/cv-lab/[id]/commit:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// GET /api/cv-lab/[id]/commit - Get all versions
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

    // Get all versions
    const { data: versions, error } = await supabase
      .from('cv_lab_versions')
      .select('*')
      .eq('cv_id', id)
      .order('version_number', { ascending: false })

    if (error) {
      console.error('Error fetching versions:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ versions })

  } catch (error) {
    console.error('Error in GET /api/cv-lab/[id]/commit:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
