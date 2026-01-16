/**
 * Auth Helpers
 * Utilidades reutilizables para verificación de autenticación y roles
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface AuthUser {
  id: string
  email: string | undefined
  role?: 'user' | 'admin'
}

export interface AuthResult {
  user: AuthUser | null
  error: NextResponse | null
  supabase: Awaited<ReturnType<typeof createClient>>
}

/**
 * Verifica que el usuario esté autenticado
 * Retorna el usuario y el cliente de Supabase, o un error
 *
 * @example
 * ```typescript
 * const { user, error, supabase } = await requireAuth()
 * if (error) return error
 * // Continuar con usuario autenticado
 * ```
 */
export async function requireAuth(): Promise<AuthResult> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'No autorizado. Debes iniciar sesión.' },
        { status: 401 }
      ),
      supabase
    }
  }

  return {
    user: {
      id: user.id,
      email: user.email
    },
    error: null,
    supabase
  }
}

/**
 * Verifica que el usuario esté autenticado Y sea admin
 * Retorna el usuario con rol admin y el cliente, o un error
 *
 * @example
 * ```typescript
 * const { user, error, supabase } = await requireAdmin()
 * if (error) return error
 * // Continuar con admin autenticado
 * ```
 */
export async function requireAdmin(): Promise<AuthResult> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'No autorizado. Debes iniciar sesión.' },
        { status: 401 }
      ),
      supabase
    }
  }

  // Verificar rol de admin en profiles
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile || profile.role !== 'admin') {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de administrador.' },
        { status: 403 }
      ),
      supabase
    }
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      role: 'admin'
    },
    error: null,
    supabase
  }
}

/**
 * Obtiene el usuario autenticado con su rol
 * Similar a requireAuth pero también obtiene el rol del usuario
 */
export async function getAuthUser(): Promise<AuthResult> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      ),
      supabase
    }
  }

  // Obtener rol del usuario
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return {
    user: {
      id: user.id,
      email: user.email,
      role: profile?.role || 'user'
    },
    error: null,
    supabase
  }
}

/**
 * Verifica si un usuario específico es admin
 * Útil para verificaciones condicionales sin retornar error
 */
export async function isUserAdmin(userId: string, supabase: SupabaseClient): Promise<boolean> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  return profile?.role === 'admin'
}
