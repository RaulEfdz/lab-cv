import crypto from 'crypto'

// Configuración de Yappy
const getBaseUrl = () => {
  const env = process.env.YAPPY_ENV || 'uat'
  if (env === 'prod') {
    return process.env.YAPPY_API_BASE_PROD || 'https://apipagosbg.bgeneral.cloud'
  }
  return process.env.YAPPY_API_BASE_UAT || 'https://api-comecom-uat.yappycloud.com'
}

const config = {
  merchantId: process.env.YAPPY_MERCHANT_ID || '',
  secretKey: process.env.YAPPY_SECRET_KEY || '', // Para el paso 1 (si se usara) o paso 2 (si se usara como Bearer, pero usaremos token)
  secretHash: process.env.YAPPY_SECRET_HASH || '', // Para validar IPN
  domainUrl: process.env.YAPPY_DOMAIN || process.env.YAPPY_DOMAIN_URL || '',
  ipnUrl: process.env.YAPPY_IPN_URL || '',
  apiUrl: getBaseUrl(),
  environment: process.env.YAPPY_ENV || 'uat',
}

// Configuración cargada - logs removidos por seguridad

// Tipos
export interface YappyValidateMerchantResponse {
  status: {
    code: string
    description: string
  }
  body: {
    epochTime: number
    token: string
  }
}

export interface YappyCreateOrderRequest {
  orderId: string
  total: string
  subtotal: string
  taxes: string
  discount: string
  paymentDate: number // Ahora requerido desde el caller (obtenido de validateMerchant)
  aliasYappy?: string // Número de teléfono (obligatorio para sandbox, opcional prod pero recomendado)
}

export interface YappyCreateOrderResponse {
  status: {
    code: string
    description: string
  }
  body: {
    transactionId: string
    token: string
    documentName: string
  }
}

export interface YappyIPNParams {
  orderId: string
  status: 'E' | 'R' | 'C' | 'X' // Ejecutado, Rechazado, Cancelado, Expirado
  hash: string
  domain: string
  confirmationNumber?: string
}

// Errores de Yappy
export const YAPPY_ERRORS: Record<string, string> = {
  E002: 'Algo salió mal. Intenta nuevamente.',
  E004: 'Error en el request o algún campo puede estar vacío.',
  E005: 'Este número no está registrado en Yappy.',
  E006: 'Algo salió mal. Intenta nuevamente.',
  E007: 'El pedido ya ha sido registrado.',
  E008: 'Algo salió mal. Intenta nuevamente.',
  E009: 'ID de la orden mayor a 15 dígitos.',
  E010: 'El valor de los montos no es el correcto.',
  E011: 'Error en los campos de URL.',
  E012: 'Algo salió mal. Intenta nuevamente.',
  E100: 'Bad Request.',
  'YAPPY-004': 'Error en el request o algún campo puede estar vacío.',
}

// Estado de pago en español
export const YAPPY_STATUS_LABELS: Record<string, string> = {
  E: 'Ejecutado',
  R: 'Rechazado',
  C: 'Cancelado',
  X: 'Expirado',
}

/**
 * Paso 1: Validar botón de pago del comercio
 * Obtiene el token de autenticación necesario para crear órdenes
 */
export async function validateMerchant(): Promise<YappyValidateMerchantResponse> {
  const requestBody = {
    merchantId: config.merchantId,
    urlDomain: config.domainUrl,
  }

  const response = await fetch(`${config.apiUrl}/payments/validate/merchant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  const rawText = await response.text()

  let data
  try {
    data = JSON.parse(rawText)
  } catch {
    throw new Error(`Yappy validate/merchant: respuesta no JSON`)
  }

  return data
}

/**
 * Validar formato de teléfono panameño (8 dígitos, sin prefijo)
 */
export function validatePanamanianPhone(phone: string | undefined): { valid: boolean; cleaned: string | undefined } {
  if (!phone) return { valid: true, cleaned: undefined } // Es opcional en producción

  // Limpiar el número: remover espacios, guiones, prefijo +507
  let cleaned = phone.replace(/[\s\-\(\)]/g, '')
  if (cleaned.startsWith('+507')) cleaned = cleaned.substring(4)
  if (cleaned.startsWith('507')) cleaned = cleaned.substring(3)

  // Debe ser exactamente 8 dígitos
  const isValid = /^\d{8}$/.test(cleaned)

  return { valid: isValid, cleaned: isValid ? cleaned : undefined }
}

/**
 * Paso 2: Crear orden de pago
 * Requiere el token obtenido de validateMerchant
 */
export async function createPaymentOrder(
  token: string,
  orderData: YappyCreateOrderRequest
): Promise<YappyCreateOrderResponse> {
  // Validar que orderId no exceda 15 caracteres
  if (orderData.orderId.length > 15) {
    throw new Error('E009: ID de la orden mayor a 15 dígitos.')
  }

  // Validar teléfono si se proporciona
  if (orderData.aliasYappy) {
    const phoneValidation = validatePanamanianPhone(orderData.aliasYappy)
    if (!phoneValidation.valid) {
      throw new Error('E005: Número de teléfono inválido. Debe ser 8 dígitos sin prefijo.')
    }
    orderData.aliasYappy = phoneValidation.cleaned
  }

  // Construir body según documentación Yappy
  const requestBody: {
    merchantId: string
    orderId: string
    domain: string
    paymentDate: number
    ipnUrl: string
    discount: string
    taxes: string
    subtotal: string
    total: string
    aliasYappy?: string
  } = {
    merchantId: config.merchantId,
    orderId: orderData.orderId,
    domain: config.domainUrl,
    paymentDate: orderData.paymentDate, // Usar el que viene del caller (epochTime de validateMerchant o Date.now())
    ipnUrl: config.ipnUrl,
    discount: orderData.discount,
    taxes: orderData.taxes,
    subtotal: orderData.subtotal,
    total: orderData.total,
  }

  // Agregar aliasYappy si existe
  if (orderData.aliasYappy) {
    requestBody.aliasYappy = orderData.aliasYappy
  }

  // Validar campos requeridos
  const requiredFields: (keyof typeof requestBody)[] = ['merchantId', 'orderId', 'domain', 'paymentDate', 'ipnUrl', 'total', 'subtotal']
  const emptyFields = requiredFields.filter(field => {
    const value = requestBody[field]
    if (field === 'paymentDate') {
      return value === undefined || value === null || value === 0
    }
    return value === undefined || value === null || value === '' || (typeof value === 'string' && value.trim() === '')
  })

  if (emptyFields.length > 0) {
    throw new Error(`Campos requeridos vacíos: ${emptyFields.join(', ')}`)
  }

  const response = await fetch(`${config.apiUrl}/payments/payment-wc`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token, // Usamos el token obtenido de validateMerchant
    },
    body: JSON.stringify(requestBody),
  })

  const data = await response.json()
  return data
}

/**
 * Validar hash de IPN (Instant Payment Notification)
 * Verifica que la notificación viene de Yappy usando YAPPY_SECRET_HASH
 */
export function validateIPNHash(params: YappyIPNParams): boolean {
  try {
    const secretKey = config.secretHash

    if (!secretKey) {
      return false
    }

    // Decodificar la clave secreta de base64
    const decodedSecret = Buffer.from(secretKey, 'base64').toString('utf-8')
    const secretParts = decodedSecret.split('.')
    const hmacKey = secretParts[0]

    // Crear el hash con HMAC SHA256
    const dataToSign = params.orderId + params.status + params.domain
    const signature = crypto
      .createHmac('sha256', hmacKey)
      .update(dataToSign)
      .digest('hex')

    return params.hash === signature
  } catch {
    return false
  }
}

/**
 * Generar un ID de orden único
 * Máximo 15 caracteres alfanuméricos
 */
export function generateOrderId(prefix: string = 'CV'): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  const orderId = `${prefix}${timestamp}${random}`
  return orderId.substring(0, 15) // Asegurar máximo 15 caracteres
}

/**
 * Formatear monto a string con 2 decimales
 */
export function formatAmount(amount: number): string {
  return amount.toFixed(2)
}

/**
 * Obtener configuración del cliente para el frontend
 */
export function getYappyClientConfig() {
  const env = config.environment
  const cdnUrl = env === 'prod'
    ? 'https://bt-cdn.yappy.cloud/v1/cdn/web-component-btn-yappy.js'
    : 'https://bt-cdn-uat.yappycloud.com/v1/cdn/web-component-btn-yappy.js'

  return {
    cdnUrl,
    environment: env,
  }
}
