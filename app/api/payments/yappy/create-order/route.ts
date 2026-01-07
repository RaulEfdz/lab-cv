import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  validateMerchant,
  createPaymentOrder,
  generateOrderId,
  formatAmount,
  YAPPY_ERRORS,
} from '@/lib/payments/yappy'
import {
  logMerchantValidation,
  logOrderCreation,
  logPaymentEvent,
} from '@/lib/payments/paymentLogger'

/**
 * POST /api/payments/yappy/create-order
 * Crea una orden de pago para descargar un CV
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  try {
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const userId = user.id

    // Parsear body
    const body = await request.json()
    const { cvId, phone } = body

    if (!cvId) {
      return NextResponse.json(
        { error: 'cvId es requerido' },
        { status: 400 }
      )
    }

    // Validar teléfono panameño (8 dígitos, numérico)
    if (!phone || !/^[0-9]{8}$/.test(phone)) {
      return NextResponse.json(
        { error: 'Teléfono inválido. Debe ser un número de 8 dígitos.' },
        { status: 400 }
      )
    }

    // Verificar que el CV existe y pertenece al usuario
    const { data: cv, error: cvError } = await supabase
      .from('cv_lab_cvs')
      .select('id, user_id, title')
      .eq('id', cvId)
      .single()

    if (cvError || !cv) {
      return NextResponse.json(
        { error: 'CV no encontrado' },
        { status: 404 }
      )
    }

    if (cv.user_id !== userId) {
      return NextResponse.json(
        { error: 'No tienes permiso para descargar este CV' },
        { status: 403 }
      )
    }

    // Verificar si ya tiene acceso de descarga activo
    const { data: existingAccess } = await supabase
      .from('cv_download_access')
      .select('id, status')
      .eq('cv_id', cvId)
      .eq('user_id', userId)
      .eq('status', 'ACTIVE')
      .single()

    if (existingAccess) {
      return NextResponse.json(
        { error: 'Ya tienes acceso para descargar este CV' },
        { status: 400 }
      )
    }

    // Verificar si ya hay un pago pendiente
    const { data: pendingPayment } = await supabase
      .from('payments')
      .select('id, status')
      .eq('cv_id', cvId)
      .eq('user_id', userId)
      .eq('status', 'PENDING')
      .single()

    if (pendingPayment) {
      return NextResponse.json(
        { error: 'Ya tienes un pago pendiente para este CV. Completa el pago anterior primero.' },
        { status: 400 }
      )
    }

    // Generar ID de orden único (máximo 15 caracteres)
    const orderId = generateOrderId('CV')

    // Obtener precio de descarga desde .env
    const downloadPrice = parseFloat(process.env.CV_DOWNLOAD_PRICE || '2.00')
    const currency = process.env.CV_DOWNLOAD_CURRENCY || 'USD'

    const subtotal = downloadPrice
    const taxes = 0
    const discount = 0
    const total = subtotal + taxes - discount

    // Paso 1: Validar comercio y obtener token
    const merchantValidation = await validateMerchant()

    // Yappy puede devolver diferentes códigos de éxito
    const isValidMerchant =
      merchantValidation.status.code === '0000' ||
      merchantValidation.status.code === '200' ||
      merchantValidation.status.code === '0' ||
      merchantValidation.status.code === '100' ||
      merchantValidation.status.description === 'Correct execution' ||
      merchantValidation.status.description?.toLowerCase().includes('correct')

    // Log de validación de comercio
    await logMerchantValidation({
      userId,
      requestData: { step: 'validateMerchant', cvId },
      responseData: merchantValidation as unknown as Record<string, unknown>,
      success: isValidMerchant,
      errorCode: isValidMerchant ? undefined : merchantValidation.status.code,
      errorMessage: isValidMerchant ? undefined : merchantValidation.status.description,
    })

    if (!isValidMerchant) {
      const errorMsg = YAPPY_ERRORS[merchantValidation.status.code] || merchantValidation.status.description || 'Error al validar comercio'

      return NextResponse.json(
        {
          error: `Yappy: ${errorMsg}`,
          code: merchantValidation.status.code,
          details: 'Error en validación de comercio. Por favor intenta de nuevo.',
        },
        { status: 500 }
      )
    }

    const authToken = merchantValidation.body.token
    const epochTime = merchantValidation.body.epochTime

    // Paso 2: Crear orden de pago
    const orderRequestData = {
      orderId,
      total: formatAmount(total),
      subtotal: formatAmount(subtotal),
      taxes: formatAmount(taxes),
      discount: formatAmount(discount),
      paymentDate: epochTime || Math.floor(Date.now() / 1000),
      aliasYappy: phone,
    }

    const orderResponse = await createPaymentOrder(authToken, orderRequestData)

    // Yappy puede devolver diferentes códigos de éxito
    const isValidOrder =
      orderResponse.status.code === '0000' ||
      orderResponse.status.code === '200' ||
      orderResponse.status.code === '0' ||
      orderResponse.status.code === '100' ||
      orderResponse.status.description === 'Correct execution' ||
      orderResponse.status.description?.toLowerCase().includes('correct')

    // Log de creación de orden
    await logOrderCreation({
      userId,
      cvId,
      orderId,
      amount: total,
      requestData: orderRequestData as unknown as Record<string, unknown>,
      responseData: orderResponse as unknown as Record<string, unknown>,
      success: isValidOrder,
      transactionId: isValidOrder ? orderResponse.body?.transactionId : undefined,
      errorCode: isValidOrder ? undefined : orderResponse.status.code,
      errorMessage: isValidOrder ? undefined : orderResponse.status.description,
    })

    if (!isValidOrder) {
      const errorMessage = YAPPY_ERRORS[orderResponse.status.code] || orderResponse.status.description
      return NextResponse.json(
        {
          error: `Yappy: ${errorMessage}`,
          code: orderResponse.status.code,
          details: 'Error al crear la orden de pago.',
        },
        { status: 400 }
      )
    }

    // Calcular deadline de verificación (24 horas de gracia)
    const verificationDeadline = new Date()
    verificationDeadline.setHours(verificationDeadline.getHours() + 24)

    // Crear el registro de pago pendiente
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        cv_id: cvId,
        amount: total,
        currency,
        status: 'PENDING',
        payment_method: 'YAPPY',
        external_id: orderId,
        transaction_id: orderResponse.body.transactionId,
        yappy_phone: phone,
        verification_deadline: verificationDeadline.toISOString(),
        granted_access: false, // No otorgamos acceso hasta confirmar pago
      })
      .select()
      .single()

    if (paymentError || !payment) {
      console.error('Error creating payment:', paymentError)
      return NextResponse.json(
        { error: 'Error al crear registro de pago' },
        { status: 500 }
      )
    }

    // Log de pago pendiente
    await logPaymentEvent({
      event: 'PAYMENT_PENDING',
      status: 'INFO',
      userId,
      paymentId: payment.id,
      cvId,
      orderId,
      transactionId: orderResponse.body.transactionId,
      amount: total,
      metadata: {
        cvTitle: cv.title,
        phone,
        verificationDeadline: verificationDeadline.toISOString(),
      },
    })

    // Devolver datos exactos para el frontend
    return NextResponse.json({
      status: {
        code: '00',
        description: 'Transacción creada'
      },
      body: {
        transactionId: orderResponse.body.transactionId,
        token: orderResponse.body.token,
        documentName: orderResponse.body.documentName,
      },
      paymentId: payment.id,
    })
  } catch (error) {
    console.error('Error in create-order:', error)

    // Log del error
    await logPaymentEvent({
      event: 'ORDER_CREATE_ERROR',
      status: 'ERROR',
      errorMessage: error instanceof Error ? error.message : 'Error desconocido',
      metadata: { stack: error instanceof Error ? error.stack : undefined },
    })

    return NextResponse.json(
      {
        error: 'Error al crear orden de pago',
        details: error instanceof Error ? error.message : 'Error interno del servidor',
      },
      { status: 500 }
    )
  }
}
