import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/utils/rate-limit'

// Crear cliente de Supabase con service key para operaciones admin
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

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email es requerido' },
        { status: 400 }
      )
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'El formato del email no es válido' },
        { status: 400 }
      )
    }

    // Rate limiting basado en IP y email
    const ip = getClientIP(request.headers)
    const identifier = `resend:${ip}:${email.toLowerCase()}`

    const rateLimit = checkRateLimit(
      identifier,
      RATE_LIMITS.RESEND_EMAIL.maxAttempts,
      RATE_LIMITS.RESEND_EMAIL.windowMs
    )

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Demasiados intentos. Intenta de nuevo en ${rateLimit.retryAfter} segundos.`,
          retryAfter: rateLimit.retryAfter
        },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimit.retryAfter?.toString() || '900'
          }
        }
      )
    }

    // Buscar el usuario por email en la tabla profiles (más eficiente que listUsers)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Este email no está registrado. Por favor, regístrate primero en "Crear cuenta".' },
        { status: 404 }
      )
    }

    // Obtener información del usuario en auth.users
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(profile.id)

    if (userError || !user) {
      console.error('Error al buscar usuario:', userError)
      return NextResponse.json(
        { error: 'Error al buscar usuario' },
        { status: 500 }
      )
    }

    // Verificar si el email ya está confirmado
    if (user.email_confirmed_at) {
      return NextResponse.json(
        { error: 'Este email ya está verificado. Intenta iniciar sesión con tu contraseña.' },
        { status: 400 }
      )
    }

    // Usar método resend para reenviar email de confirmación
    // Nota: Este método funciona porque el usuario ya existe en auth.users
    const { error } = await supabaseAdmin.auth.resend({
      type: 'signup',
      email: email,
    })

    if (error) {
      console.error('Error al reenviar email de verificación:', error)
      return NextResponse.json(
        { error: 'Error al reenviar email de verificación' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Email de verificación reenviado exitosamente'
    })

  } catch (error) {
    console.error('Error en resend-verification:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}
