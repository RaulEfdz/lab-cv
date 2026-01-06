import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/admin/dashboard'

  if (code) {
    const supabase = await createClient()

    // Intercambiar el código por una sesión
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Obtener la sesión actual para verificar el tipo de evento
      const { data: { session } } = await supabase.auth.getSession()

      // Si es una recuperación de contraseña, redirigir a reset-password
      if (session) {
        return NextResponse.redirect(new URL('/admin/reset-password', requestUrl.origin))
      }

      // Redirigir a la página especificada
      return NextResponse.redirect(new URL(next, requestUrl.origin))
    }
  }

  // Si hay un error o no hay código, redirigir al login con mensaje de error
  return NextResponse.redirect(
    new URL('/admin/login?error=Unable to process authentication', requestUrl.origin)
  )
}
