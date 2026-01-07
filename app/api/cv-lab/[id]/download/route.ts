import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/cv-lab/[id]/download
 * Descarga el CV en PDF (requiere acceso de pago o ser el propietario admin)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const cvId = params.id

    // Verificar que el CV existe
    const { data: cv, error: cvError } = await supabase
      .from('cv_lab_cvs')
      .select('id, user_id, title, target_role, status, content')
      .eq('id', cvId)
      .single()

    if (cvError || !cv) {
      return NextResponse.json(
        { error: 'CV no encontrado' },
        { status: 404 }
      )
    }

    // Verificar si el usuario es el propietario del CV
    const isOwner = cv.user_id === user.id

    // Verificar si es admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin'

    // Si no es propietario ni admin, verificar acceso de descarga pagado
    if (!isOwner && !isAdmin) {
      const { data: access, error: accessError } = await supabase
        .from('cv_download_access')
        .select('id, status')
        .eq('cv_id', cvId)
        .eq('user_id', user.id)
        .eq('status', 'ACTIVE')
        .single()

      if (accessError || !access) {
        return NextResponse.json(
          { error: 'No tienes acceso para descargar este CV. Debes realizar el pago primero.' },
          { status: 403 }
        )
      }

      // Incrementar contador de descargas
      await supabase
        .from('cv_download_access')
        .update({
          download_count: supabase.rpc('increment', { row_id: access.id }),
          last_downloaded_at: new Date().toISOString()
        })
        .eq('id', access.id)
    }

    // TODO: Generar PDF del CV
    // Por ahora retornamos un JSON con los datos del CV
    // En producción, aquí iría la lógica de generación de PDF

    // Simular respuesta de descarga (placeholder)
    const cvData = {
      title: cv.title,
      targetRole: cv.target_role,
      status: cv.status,
      content: cv.content,
      message: 'PDF generation not yet implemented. This would download the CV as PDF.'
    }

    return NextResponse.json({
      success: true,
      cv: cvData,
      downloadUrl: `/cv-lab/${cvId}/preview`, // Temporary redirect to preview
    })

    // TODO: Implementar generación de PDF real
    // const pdfBuffer = await generateCVPDF(cv)
    // return new NextResponse(pdfBuffer, {
    //   headers: {
    //     'Content-Type': 'application/pdf',
    //     'Content-Disposition': `attachment; filename="${cv.title.replace(/[^a-z0-9]/gi, '_')}.pdf"`
    //   }
    // })

  } catch (error) {
    console.error('Error in download endpoint:', error)
    return NextResponse.json(
      { error: 'Error al procesar la descarga' },
      { status: 500 }
    )
  }
}
