import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { generateCvPdf } from '@/lib/cv-lab/pdf-generator'
import type { CvJson } from '@/lib/types/cv-lab'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/cv-lab/[id]/pdf - Generate and download PDF
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

    // Get version ID from query params (optional)
    const versionId = request.nextUrl.searchParams.get('versionId')

    // Get CV with versions
    const { data: cv, error: cvError } = await supabase
      .from('cv_lab_cvs')
      .select('*, cv_lab_versions(*)')
      .eq('id', id)
      .single()

    if (cvError || !cv) {
      return NextResponse.json({ error: 'CV no encontrado' }, { status: 404 })
    }

    // Get the specific version or latest
    let version
    if (versionId) {
      version = cv.cv_lab_versions?.find((v: { id: string }) => v.id === versionId)
    } else {
      version = cv.cv_lab_versions?.sort(
        (a: { version_number: number }, b: { version_number: number }) => b.version_number - a.version_number
      )[0]
    }

    if (!version) {
      return NextResponse.json({ error: 'No hay versiones del CV' }, { status: 404 })
    }

    const cvJson = version.cv_json as CvJson

    // Generate PDF
    const { pdfBytes } = await generateCvPdf(cvJson)

    // Create filename
    const fileName = `${cv.title.replace(/[^a-zA-Z0-9]/g, '_')}_v${version.version_number}.pdf`

    // Track PDF download as positive feedback (user satisfied with CV quality)
    try {
      // Get most recent assistant message
      const { data: lastMessage } = await supabase
        .from('cv_lab_messages')
        .select('id')
        .eq('cv_id', id)
        .eq('role', 'assistant')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (lastMessage) {
        // Submit implicit positive feedback
        await supabase.from('cv_lab_feedback').insert({
          message_id: lastMessage.id,
          cv_id: id,
          feedback_type: 'rating',
          rating: 5,
          tags: ['pdf_download', 'helpful'],
          comment: 'Usuario descargó el PDF (feedback positivo implícito)',
          user_intent: 'Descargar CV final'
        })

        console.log('PDF download tracked as positive feedback')
      }
    } catch (error) {
      console.error('Error tracking PDF download:', error)
      // Don't fail the request if feedback tracking fails
    }

    // Return PDF
    return new Response(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': pdfBytes.length.toString()
      }
    })

  } catch (error) {
    console.error('Error in GET /api/cv-lab/[id]/pdf:', error)
    return NextResponse.json({ error: 'Error generando PDF' }, { status: 500 })
  }
}

// POST /api/cv-lab/[id]/pdf - Generate preview PDF from provided cvJson
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

    // Verify CV exists
    const { data: cv } = await supabase
      .from('cv_lab_cvs')
      .select('id')
      .eq('id', id)
      .single()

    if (!cv) {
      return NextResponse.json({ error: 'CV no encontrado' }, { status: 404 })
    }

    const body = await request.json()
    const cvJson: CvJson = body.cvJson

    if (!cvJson) {
      return NextResponse.json({ error: 'cvJson es requerido' }, { status: 400 })
    }

    // Generate preview PDF
    const { pdfBytes, renderHash } = await generateCvPdf(cvJson)

    // Return PDF with render hash header
    return new Response(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'X-Render-Hash': renderHash
      }
    })

  } catch (error) {
    console.error('Error in POST /api/cv-lab/[id]/pdf:', error)
    return NextResponse.json({ error: 'Error generando PDF' }, { status: 500 })
  }
}
