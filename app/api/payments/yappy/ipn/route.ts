import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateIPNHash } from '@/lib/payments/yappy'
import { logIPNEvent, logPaymentStatus } from '@/lib/payments/paymentLogger'

/**
 * IPs conocidas de los servidores de Yappy (Banco General)
 * IMPORTANTE: Actualizar esta lista si Yappy cambia sus IPs
 * Consultar con soporte de Yappy para obtener la lista oficial
 *
 * Si YAPPY_ALLOWED_IPS está configurada en .env, se usará esa lista
 * Formato en .env: YAPPY_ALLOWED_IPS=1.2.3.4,5.6.7.8
 */
const YAPPY_KNOWN_IPS = [
  // IPs de producción de Yappy (Banco General) - VERIFICAR CON YAPPY
  // Estas son IPs de ejemplo, debes obtener las reales de Yappy
  '0.0.0.0', // Placeholder - permite todo si no se configura
]

function getYappyAllowedIPs(): string[] {
  const envIPs = process.env.YAPPY_ALLOWED_IPS
  if (envIPs) {
    return envIPs.split(',').map(ip => ip.trim()).filter(Boolean)
  }
  return YAPPY_KNOWN_IPS
}

function isYappyIP(request: NextRequest): boolean {
  const allowedIPs = getYappyAllowedIPs()

  // Si no hay IPs configuradas o está el placeholder, permitir todo (modo desarrollo)
  if (allowedIPs.length === 0 || allowedIPs.includes('0.0.0.0')) {
    return true
  }

  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const ip = forwarded ? forwarded.split(',')[0].trim() : realIP || 'unknown'

  return allowedIPs.includes(ip)
}

/**
 * GET /api/payments/yappy/ipn
 * Endpoint para recibir notificaciones instantáneas de pago (IPN) de Yappy
 * Yappy puede enviar GET (redirect) o POST (background)
 */
export async function GET(request: NextRequest) {
  return handleIPN(request)
}

export async function POST(request: NextRequest) {
  return handleIPN(request)
}

async function handleIPN(request: NextRequest) {
  console.log('🔔 [IPN] Recibido IPN de Yappy')
  console.log('🔔 [IPN] Método:', request.method)
  console.log('🔔 [IPN] URL:', request.url)

  // Verificar si la IP está en la whitelist de Yappy
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const ip = forwarded ? forwarded.split(',')[0].trim() : realIP || 'unknown'
  console.log('🔔 [IPN] IP origen:', ip)

  if (!isYappyIP(request)) {
    console.log('❌ [IPN] IP no autorizada:', ip)
    return NextResponse.json(
      { success: false, error: 'Acceso no autorizado' },
      { status: 403 }
    )
  }

  try {
    let params: URLSearchParams

    if (request.method === 'GET') {
      const { searchParams } = new URL(request.url)
      params = searchParams
    } else {
      // Para POST, Yappy suele enviar los datos en el body o como form-data
      try {
        const body = await request.json()
        console.log('🔔 [IPN] Body JSON recibido:', body)
        params = new URLSearchParams()
        Object.entries(body).forEach(([key, value]) => {
          params.append(key, String(value))
        })
      } catch {
        // Si falla JSON, intentar form-data o text
        const text = await request.text()
        console.log('🔔 [IPN] Body TEXT recibido:', text)
        params = new URLSearchParams(text)
      }

      // Si el body estaba vacío, quizás están en la URL del POST
      if (Array.from(params.keys()).length === 0) {
        const { searchParams } = new URL(request.url)
        params = searchParams
      }
    }

    const orderId = params.get('orderId')
    const status = params.get('status') as 'E' | 'R' | 'C' | 'X'
    const hash = params.get('hash')
    const domain = params.get('domain')
    const confirmationNumber = params.get('confirmationNumber')

    console.log('🔔 [IPN] Parámetros extraídos:')
    console.log('  - orderId:', orderId)
    console.log('  - status:', status)
    console.log('  - hash:', hash)
    console.log('  - domain:', domain)
    console.log('  - confirmationNumber:', confirmationNumber)

    // Validar parámetros requeridos
    if (!orderId || !status || !hash || !domain) {
      console.log('❌ [IPN] Parámetros faltantes')
      await logIPNEvent({
        orderId: orderId || 'unknown',
        status: status || 'unknown',
        valid: false,
        responseData: { error: 'Parámetros faltantes' },
        errorMessage: 'Faltan parámetros requeridos en IPN',
      })
      return NextResponse.json(
        { success: false, error: 'Parámetros faltantes' },
        { status: 400 }
      )
    }

    // Validar el hash para asegurar que viene de Yappy
    console.log('🔐 [IPN] Validando hash HMAC...')
    const isValidHash = validateIPNHash({ orderId, status, hash, domain })

    if (!isValidHash) {
      console.log('❌ [IPN] Hash HMAC inválido - IPN rechazado')
      await logIPNEvent({
        orderId,
        status,
        valid: false,
        responseData: { hash, domain },
        errorMessage: 'Hash HMAC inválido',
      })
      return NextResponse.json(
        { success: false, error: 'Hash inválido' },
        { status: 403 }
      )
    }

    console.log('✅ [IPN] Hash HMAC válido')
    await logIPNEvent({
      orderId,
      status,
      valid: true,
      responseData: { confirmationNumber, domain },
    })

    // Usar service role para operaciones de BD
    const supabase = createClient()

    // Buscar el pago por el externalId (orderId)
    console.log('🔍 [IPN] Buscando pago con orderId:', orderId)
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*, cv_lab_cvs(id, title, user_id)')
      .eq('external_id', orderId)
      .single()

    if (paymentError || !payment) {
      console.log('❌ [IPN] Pago no encontrado con orderId:', orderId)
      return NextResponse.json(
        { success: false, error: 'Pago no encontrado' },
        { status: 404 }
      )
    }

    console.log('✅ [IPN] Pago encontrado:', {
      paymentId: payment.id,
      cvId: payment.cv_id,
      userId: payment.user_id,
      amount: payment.amount,
      currentStatus: payment.status,
    })

    // Mapear status de Yappy a nuestro sistema
    const statusMap: Record<string, 'COMPLETED' | 'FAILED'> = {
      E: 'COMPLETED', // Ejecutado
      R: 'FAILED',    // Rechazado
      C: 'FAILED',    // Cancelado
      X: 'FAILED',    // Expirado
    }

    const newPaymentStatus = statusMap[status]
    console.log('📝 [IPN] Actualizando estado del pago:', payment.status, '→', newPaymentStatus)

    // Actualizar el estado del pago
    await supabase
      .from('payments')
      .update({
        status: newPaymentStatus,
        paid_at: status === 'E' ? new Date().toISOString() : null,
        failed_at: status !== 'E' ? new Date().toISOString() : null,
        yappy_confirmation_number: confirmationNumber,
        yappy_status_code: status,
        previous_status: payment.status,
        status_changed_at: new Date().toISOString(),
        status_change_note: `IPN de Yappy: ${status === 'E' ? 'Ejecutado' : status === 'R' ? 'Rechazado' : status === 'C' ? 'Cancelado' : 'Expirado'}`,
      })
      .eq('id', payment.id)

    console.log('✅ [IPN] Pago actualizado exitosamente')

    // Log de cambio de estado
    await logPaymentStatus({
      userId: payment.user_id,
      paymentId: payment.id,
      orderId,
      transactionId: payment.transaction_id || undefined,
      status: newPaymentStatus,
      amount: parseFloat(payment.amount),
      metadata: {
        yappyStatus: status,
        confirmationNumber,
        cvId: payment.cv_id,
      },
    })

    // Si el pago fue exitoso (Ejecutado), otorgar acceso de descarga
    if (status === 'E') {
      console.log('🎉 [IPN] Pago EJECUTADO - Otorgando acceso de descarga...')

      // Verificar si ya existe acceso (para evitar duplicados)
      const { data: existingAccess } = await supabase
        .from('cv_download_access')
        .select('id')
        .eq('cv_id', payment.cv_id)
        .eq('user_id', payment.user_id)
        .single()

      if (!existingAccess) {
        // Crear acceso de descarga
        const { error: accessError } = await supabase
          .from('cv_download_access')
          .insert({
            cv_id: payment.cv_id,
            user_id: payment.user_id,
            payment_id: payment.id,
            status: 'ACTIVE',
          })

        if (accessError) {
          console.error('❌ [IPN] Error creando acceso de descarga:', accessError)
        } else {
          console.log('✅ [IPN] Acceso de descarga otorgado')

          // Actualizar pago para marcar que el acceso fue otorgado
          await supabase
            .from('payments')
            .update({ granted_access: true })
            .eq('id', payment.id)

          await logPaymentEvent({
            event: 'DOWNLOAD_ACCESS_GRANTED',
            status: 'SUCCESS',
            userId: payment.user_id,
            paymentId: payment.id,
            cvId: payment.cv_id,
            orderId,
            amount: parseFloat(payment.amount),
          })
        }
      } else {
        console.log('ℹ️ [IPN] El usuario ya tiene acceso de descarga para este CV')
      }

      // TODO: Enviar email de pago completado
      // await sendPaymentNotification(payment.id, 'COMPLETED')
    }

    // Si el pago falló (R/C/X), revocar acceso si existe
    if (status !== 'E') {
      const statusLabels = { R: 'Rechazado', C: 'Cancelado', X: 'Expirado' }
      console.log(`❌ [IPN] Pago ${statusLabels[status] || 'fallido'} - Revocando acceso si existe...`)

      // Revocar acceso de descarga
      const { error: revokeError } = await supabase
        .from('cv_download_access')
        .update({ status: 'REVOKED' })
        .eq('payment_id', payment.id)

      if (revokeError) {
        console.error('❌ [IPN] Error revocando acceso:', revokeError)
      } else {
        console.log('✅ [IPN] Acceso revocado (si existía)')

        // Actualizar pago para marcar que el acceso fue revocado
        await supabase
          .from('payments')
          .update({ granted_access: false })
          .eq('id', payment.id)

        await logPaymentEvent({
          event: 'DOWNLOAD_ACCESS_REVOKED',
          status: 'WARNING',
          userId: payment.user_id,
          paymentId: payment.id,
          cvId: payment.cv_id,
          orderId,
          metadata: {
            reason: statusLabels[status],
          },
        })
      }

      // TODO: Enviar email de pago fallido
      // await sendPaymentNotification(payment.id, 'FAILED')
    }

    // Responder exitosamente a Yappy
    console.log('✅ [IPN] IPN procesado exitosamente - Respondiendo a Yappy')
    return NextResponse.json({
      success: true,
      confirmation: confirmationNumber,
    })
  } catch (error) {
    console.error('❌ [IPN] Error crítico procesando IPN:', error)
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    )
  }
}
