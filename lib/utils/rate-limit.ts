/**
 * Rate Limiting Utility
 * Previene abuso de endpoints críticos (login, registro, reenvío de emails)
 */

interface RateLimitRecord {
  count: number
  resetTime: number
}

// Map en memoria para almacenar intentos
// En producción, considerar usar Redis o Upstash
const rateLimitMap = new Map<string, RateLimitRecord>()

// Limpiar registros expirados cada 5 minutos
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}, 5 * 60 * 1000)

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  retryAfter?: number // Segundos hasta que pueda intentar de nuevo
}

/**
 * Verifica si una operación está dentro del límite de tasa
 *
 * @param identifier - Identificador único (ej: IP, email, userId)
 * @param maxAttempts - Número máximo de intentos permitidos
 * @param windowMs - Ventana de tiempo en milisegundos
 * @returns Resultado indicando si está permitido
 *
 * @example
 * ```typescript
 * const { allowed, remaining } = await checkRateLimit('login:192.168.1.1', 5, 15 * 60 * 1000)
 * if (!allowed) {
 *   return Response.json({ error: 'Too many attempts' }, { status: 429 })
 * }
 * ```
 */
export function checkRateLimit(
  identifier: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutos por defecto
): RateLimitResult {
  const now = Date.now()
  const record = rateLimitMap.get(identifier)

  // Si no existe registro o ya expiró, crear nuevo
  if (!record || now > record.resetTime) {
    const resetTime = now + windowMs
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime
    })

    return {
      allowed: true,
      remaining: maxAttempts - 1,
      resetTime
    }
  }

  // Si ya alcanzó el límite
  if (record.count >= maxAttempts) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000)

    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
      retryAfter
    }
  }

  // Incrementar contador
  record.count++

  return {
    allowed: true,
    remaining: maxAttempts - record.count,
    resetTime: record.resetTime
  }
}

/**
 * Resetea el rate limit para un identificador específico
 * Útil después de un login exitoso
 */
export function resetRateLimit(identifier: string): void {
  rateLimitMap.delete(identifier)
}

/**
 * Obtiene la IP del cliente de los headers de la request
 */
export function getClientIP(headers: Headers): string {
  // Intentar obtener IP real detrás de proxy/CDN
  const forwardedFor = headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIP = headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  // Fallback
  return 'unknown'
}

/**
 * Constantes de rate limit por tipo de operación
 */
export const RATE_LIMITS = {
  LOGIN: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutos
  },
  SIGNUP: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hora
  },
  RESEND_EMAIL: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hora
  },
  PASSWORD_RESET: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hora
  },
} as const
