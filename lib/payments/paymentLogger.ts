import { createClient } from '@/lib/supabase/server'

// Tipos para payment events y log status (basados en los enums de la BD)
type PaymentEvent =
  | 'MERCHANT_VALIDATE_REQUEST'
  | 'MERCHANT_VALIDATE_SUCCESS'
  | 'MERCHANT_VALIDATE_ERROR'
  | 'ORDER_CREATE_REQUEST'
  | 'ORDER_CREATE_SUCCESS'
  | 'ORDER_CREATE_ERROR'
  | 'IPN_RECEIVED'
  | 'IPN_VALIDATED'
  | 'IPN_INVALID'
  | 'IPN_PROCESSED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_COMPLETED'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_CANCELLED'
  | 'PAYMENT_EXPIRED'
  | 'DOWNLOAD_ACCESS_GRANTED'
  | 'DOWNLOAD_ACCESS_REVOKED'

type LogStatus = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR'

interface LogPaymentParams {
  event: PaymentEvent
  provider?: string
  status?: LogStatus
  userId?: string
  paymentId?: string
  cvId?: string
  orderId?: string
  transactionId?: string
  amount?: number
  requestData?: Record<string, unknown>
  responseData?: Record<string, unknown>
  errorCode?: string
  errorMessage?: string
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, unknown>
}

/**
 * Guarda un log de evento de pago en la base de datos
 */
export async function logPaymentEvent(params: LogPaymentParams) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('payment_logs')
      .insert({
        event: params.event,
        provider: params.provider || 'YAPPY',
        status: params.status || 'INFO',
        user_id: params.userId,
        payment_id: params.paymentId,
        cv_id: params.cvId,
        order_id: params.orderId,
        transaction_id: params.transactionId,
        amount: params.amount,
        request_data: params.requestData,
        response_data: params.responseData,
        error_code: params.errorCode,
        error_message: params.errorMessage,
        ip_address: params.ipAddress,
        user_agent: params.userAgent,
        metadata: params.metadata,
      })
      .select()
      .single()

    if (error) {
      console.error('Error logging payment event:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Exception logging payment event:', error)
    return null
  }
}

function getStatusEmoji(status: LogStatus): string {
  switch (status) {
    case 'SUCCESS':
      return '✅'
    case 'ERROR':
      return '❌'
    case 'WARNING':
      return '⚠️'
    default:
      return 'ℹ️'
  }
}

/**
 * Log para validación de comercio
 */
export async function logMerchantValidation(params: {
  userId?: string
  requestData: Record<string, unknown>
  responseData: Record<string, unknown>
  success: boolean
  errorCode?: string
  errorMessage?: string
}) {
  return logPaymentEvent({
    event: params.success ? 'MERCHANT_VALIDATE_SUCCESS' : 'MERCHANT_VALIDATE_ERROR',
    status: params.success ? 'SUCCESS' : 'ERROR',
    userId: params.userId,
    requestData: params.requestData,
    responseData: params.responseData,
    errorCode: params.errorCode,
    errorMessage: params.errorMessage,
  })
}

/**
 * Log para creación de orden
 */
export async function logOrderCreation(params: {
  userId?: string
  cvId?: string
  orderId: string
  amount: number
  requestData: Record<string, unknown>
  responseData: Record<string, unknown>
  success: boolean
  transactionId?: string
  errorCode?: string
  errorMessage?: string
}) {
  return logPaymentEvent({
    event: params.success ? 'ORDER_CREATE_SUCCESS' : 'ORDER_CREATE_ERROR',
    status: params.success ? 'SUCCESS' : 'ERROR',
    userId: params.userId,
    cvId: params.cvId,
    orderId: params.orderId,
    transactionId: params.transactionId,
    amount: params.amount,
    requestData: params.requestData,
    responseData: params.responseData,
    errorCode: params.errorCode,
    errorMessage: params.errorMessage,
  })
}

/**
 * Log para IPN (notificación de pago)
 */
export async function logIPNEvent(params: {
  orderId: string
  status: string
  valid: boolean
  responseData: Record<string, unknown>
  errorMessage?: string
}) {
  const event: PaymentEvent = params.valid ? 'IPN_VALIDATED' : 'IPN_INVALID'
  const logStatus: LogStatus = params.valid ? 'SUCCESS' : 'WARNING'

  return logPaymentEvent({
    event,
    status: logStatus,
    orderId: params.orderId,
    responseData: params.responseData,
    errorMessage: params.errorMessage,
    metadata: { yappyStatus: params.status },
  })
}

/**
 * Log para cambio de estado de pago
 */
export async function logPaymentStatus(params: {
  userId?: string
  paymentId?: string
  orderId: string
  transactionId?: string
  status: 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'EXPIRED'
  amount?: number
  metadata?: Record<string, unknown>
}) {
  const eventMap: Record<string, PaymentEvent> = {
    COMPLETED: 'PAYMENT_COMPLETED',
    FAILED: 'PAYMENT_FAILED',
    CANCELLED: 'PAYMENT_CANCELLED',
    EXPIRED: 'PAYMENT_EXPIRED',
  }

  const statusMap: Record<string, LogStatus> = {
    COMPLETED: 'SUCCESS',
    FAILED: 'ERROR',
    CANCELLED: 'WARNING',
    EXPIRED: 'WARNING',
  }

  return logPaymentEvent({
    event: eventMap[params.status],
    status: statusMap[params.status],
    userId: params.userId,
    paymentId: params.paymentId,
    orderId: params.orderId,
    transactionId: params.transactionId,
    amount: params.amount,
    metadata: params.metadata,
  })
}

/**
 * Obtener logs de pago con filtros
 */
export async function getPaymentLogs(params?: {
  userId?: string
  event?: PaymentEvent
  status?: LogStatus
  orderId?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}) {
  const supabase = await createClient()

  let query = supabase
    .from('payment_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (params?.userId) query = query.eq('user_id', params.userId)
  if (params?.event) query = query.eq('event', params.event)
  if (params?.status) query = query.eq('status', params.status)
  if (params?.orderId) query = query.eq('order_id', params.orderId)

  if (params?.startDate) {
    query = query.gte('created_at', params.startDate.toISOString())
  }
  if (params?.endDate) {
    query = query.lte('created_at', params.endDate.toISOString())
  }

  query = query.range(
    params?.offset || 0,
    (params?.offset || 0) + (params?.limit || 50) - 1
  )

  const { data: logs, error, count } = await query

  if (error) {
    console.error('Error getting payment logs:', error)
    return { logs: [], total: 0 }
  }

  return { logs: logs || [], total: count || 0 }
}

/**
 * Obtener resumen de errores recientes
 */
export async function getRecentErrors(hours: number = 24) {
  const supabase = await createClient()
  const since = new Date(Date.now() - hours * 60 * 60 * 1000)

  const { data, error } = await supabase
    .from('payment_logs')
    .select('*')
    .eq('status', 'ERROR')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Error getting recent errors:', error)
    return []
  }

  return data || []
}
