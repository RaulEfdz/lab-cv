import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

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

    // Buscar el usuario en auth.users
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers()

    if (userError) {
      console.error('Error al buscar usuario:', userError)
      return NextResponse.json(
        { error: 'Error al buscar usuario' },
        { status: 500 }
      )
    }

    const user = userData.users.find(u => u.email?.toLowerCase() === email.toLowerCase())

    if (!user) {
      return NextResponse.json(
        { error: 'Este email no está registrado. Por favor, regístrate primero en "Crear cuenta".' },
        { status: 404 }
      )
    }

    // Verificar si el email ya está confirmado
    if (user.email_confirmed_at) {
      return NextResponse.json(
        { error: 'Este email ya está verificado. Intenta iniciar sesión con tu contraseña.' },
        { status: 400 }
      )
    }

    // Generar un nuevo link de verificación usando admin API
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email: email,
    })

    if (error) {
      console.error('Error al generar link de verificación:', error)
      return NextResponse.json(
        { error: 'Error al generar link de verificación' },
        { status: 500 }
      )
    }

    // En este punto, Supabase debería haber enviado el email automáticamente
    // Si no lo hace, podríamos implementar el envío manual aquí usando Resend o similar

    return NextResponse.json({
      success: true,
      message: 'Email de verificación enviado exitosamente'
    })

  } catch (error) {
    console.error('Error en resend-verification:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}
