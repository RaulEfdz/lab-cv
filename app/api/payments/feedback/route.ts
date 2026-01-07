import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/payments/feedback
 * Guarda feedback de usuarios que tuvieron problemas con el pago
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { cvId, paymentId, feedbackType, message } = body

    // Validar datos requeridos
    if (!cvId || !feedbackType) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    // Validar tipo de feedback
    const validTypes = [
      'PAYMENT_PROBLEM',
      'CANCELLED_BY_USER',
      'TOO_EXPENSIVE',
      'NO_YAPPY',
      'OTHER'
    ]

    if (!validTypes.includes(feedbackType)) {
      return NextResponse.json(
        { error: 'Tipo de feedback inválido' },
        { status: 400 }
      )
    }

    // Verificar que el CV existe y pertenece al usuario
    const { data: cv, error: cvError } = await supabase
      .from('cv_lab_cvs')
      .select('id, user_id')
      .eq('id', cvId)
      .single()

    if (cvError || !cv) {
      return NextResponse.json(
        { error: 'CV no encontrado' },
        { status: 404 }
      )
    }

    if (cv.user_id !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para dar feedback sobre este CV' },
        { status: 403 }
      )
    }

    // Obtener metadata de la request
    const userAgent = request.headers.get('user-agent') || null
    const forwardedFor = request.headers.get('x-forwarded-for')
    const ipAddress = forwardedFor
      ? forwardedFor.split(',')[0].trim()
      : request.headers.get('x-real-ip') || null

    // Guardar feedback
    const { data: feedback, error: feedbackError } = await supabase
      .from('payment_feedback')
      .insert({
        user_id: user.id,
        cv_id: cvId,
        payment_id: paymentId || null,
        feedback_type: feedbackType,
        message: message || null,
        user_agent: userAgent,
        ip_address: ipAddress,
      })
      .select()
      .single()

    if (feedbackError) {
      console.error('Error al guardar feedback:', feedbackError)
      return NextResponse.json(
        { error: 'Error al guardar feedback' },
        { status: 500 }
      )
    }

    // Log en payment_logs para tracking
    await supabase.from('payment_logs').insert({
      event: 'PAYMENT_CANCELLED',
      provider: 'YAPPY',
      status: 'WARNING',
      user_id: user.id,
      payment_id: paymentId || null,
      cv_id: cvId,
      metadata: {
        feedback_type: feedbackType,
        has_message: !!message,
      },
      ip_address: ipAddress,
      user_agent: userAgent,
    })

    return NextResponse.json({
      success: true,
      feedback,
    })

  } catch (error) {
    console.error('Error en feedback endpoint:', error)
    return NextResponse.json(
      { error: 'Error al procesar feedback' },
      { status: 500 }
    )
  }
}
