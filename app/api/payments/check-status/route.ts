import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/payments/check-status?paymentId=xxx
 *
 * Verifica el estado actual de un pago sin usar cron jobs
 * Compatible con Vercel free tier
 *
 * El frontend puede hacer polling cada 5-10 segundos mientras espera la confirmación
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get('paymentId')

    if (!paymentId) {
      return NextResponse.json(
        { error: 'paymentId es requerido' },
        { status: 400 }
      )
    }

    // Cliente con service key para leer todos los datos
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Obtener el pago con toda su información
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .select(`
        *,
        cv_download_access (
          id,
          status,
          download_count
        )
      `)
      .eq('id', paymentId)
      .single()

    if (paymentError || !payment) {
      return NextResponse.json(
        { error: 'Pago no encontrado' },
        { status: 404 }
      )
    }

    // Verificar si pasó el deadline (24h de gracia)
    const now = new Date()
    const verificationDeadline = payment.verification_deadline
      ? new Date(payment.verification_deadline)
      : null

    let shouldExpire = false

    if (
      verificationDeadline &&
      now > verificationDeadline &&
      payment.status === 'PENDING' &&
      !payment.granted_access
    ) {
      shouldExpire = true

      // Actualizar a EXPIRED
      await supabaseAdmin
        .from('payments')
        .update({
          status: 'EXPIRED',
          expired_at: now.toISOString(),
          previous_status: payment.status,
          status_changed_at: now.toISOString(),
          status_change_note: 'Expirado automáticamente: No se confirmó en 24h'
        })
        .eq('id', paymentId)

      // Log del evento
      await supabaseAdmin.from('payment_logs').insert({
        event: 'PAYMENT_EXPIRED',
        provider: 'YAPPY',
        status: 'WARNING',
        payment_id: paymentId,
        user_id: payment.user_id,
        cv_id: payment.cv_id,
        order_id: payment.external_id,
        metadata: {
          reason: 'No se recibió confirmación en 24h',
          verification_deadline: verificationDeadline.toISOString()
        }
      })

      payment.status = 'EXPIRED'
      payment.expired_at = now.toISOString()
    }

    // Responder con el estado actual
    return NextResponse.json({
      payment: {
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        external_id: payment.external_id,
        transaction_id: payment.transaction_id,
        yappy_status_code: payment.yappy_status_code,
        granted_access: payment.granted_access,
        verification_deadline: payment.verification_deadline,
        created_at: payment.created_at,
        paid_at: payment.paid_at,
        failed_at: payment.failed_at,
        cancelled_at: payment.cancelled_at,
        expired_at: payment.expired_at,
        has_download_access: payment.cv_download_access && payment.cv_download_access.length > 0
      },
      polling: {
        should_continue: payment.status === 'PENDING',
        recommended_interval: 5000, // 5 segundos
        max_wait_time: 300000 // 5 minutos
      }
    })

  } catch (error) {
    console.error('Error checking payment status:', error)

    return NextResponse.json(
      {
        error: 'Error al verificar estado del pago',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

/**
 * POST - No permitido
 */
export async function POST() {
  return NextResponse.json(
    { error: 'Método no permitido. Usa GET.' },
    { status: 405 }
  )
}
