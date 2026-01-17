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

    // Buscar el usuario por email en la tabla profiles
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    // Si no existe el perfil, el email no está registrado
    if (profileError || !profile) {
      return NextResponse.json({
        exists: false,
        verified: false
      })
    }

    // Obtener información del usuario en auth.users
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(profile.id)

    if (userError || !user) {
      console.error('Error al buscar usuario:', userError)
      return NextResponse.json(
        { error: 'Error al verificar estado del usuario' },
        { status: 500 }
      )
    }

    // Retornar si el email existe y si está verificado
    return NextResponse.json({
      exists: true,
      verified: !!user.email_confirmed_at
    })

  } catch (error) {
    console.error('Error en check-verification:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}
