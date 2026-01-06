'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileText } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      if (data.user) {
        // Obtener el rol del usuario desde profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()

        // Redirigir según el rol
        if (profile?.role === 'admin') {
          router.push('/admin/dashboard')
        } else {
          router.push('/dashboard')
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-white px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Iniciar Sesión</h1>
          <p className="text-neutral-600">
            Accede a tu cuenta de Lab CV
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="Tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-11"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <div></div>
            <Link href="/reset-password" className="text-orange-600 hover:text-orange-700">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-neutral-600">
          ¿No tienes cuenta?{' '}
          <Link href="/signup" className="text-orange-600 hover:text-orange-700 font-medium">
            Crear cuenta
          </Link>
        </div>

        {/* Admin Link */}
        <div className="mt-4 pt-4 border-t border-neutral-200 text-center text-xs text-neutral-500">
          ¿Eres administrador?{' '}
          <Link href="/admin/login" className="text-neutral-700 hover:text-neutral-900 font-medium">
            Acceso Admin
          </Link>
        </div>
      </div>
    </div>
  )
}
