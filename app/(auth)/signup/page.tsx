'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { validateSignupForm } from '@/lib/utils/auth-validation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileText, CheckCircle2, Eye, EyeOff } from 'lucide-react'

export default function SignUpPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validar todos los campos
      const validation = validateSignupForm(email, password, confirmPassword, fullName)
      if (!validation.isValid) {
        throw new Error(validation.error)
      }

      const supabase = createClient()

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
          emailRedirectTo: `${window.location.origin}/api/auth/send-verification-email?email=${email.trim()}`,
        },
      })

      if (signUpError) throw signUpError

      if (data.user) {
        setSuccess(true)
        // Si no requiere confirmación de email, redirigir
        if (data.session) {
          router.push('/dashboard')
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error al crear la cuenta')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-12" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="max-w-md w-full animate-slide-up">
          <div className="bg-white rounded-2xl border border-neutral-100 p-8 md:p-10 text-center shadow-sm">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900 tracking-tight mb-3">
              Cuenta Creada
            </h1>
            <p className="text-base text-neutral-600 mb-8 leading-relaxed">
              Revisa tu email para confirmar tu cuenta y comenzar a crear CVs profesionales.
            </p>
            <Link href="/login">
              <Button
                className="w-full h-12 text-sm font-medium transition-all duration-200"
                style={{
                  backgroundColor: 'var(--accent-orange)',
                  color: 'white'
                }}
              >
                Ir a Iniciar Sesión
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-md w-full animate-fade-in">
        <div className="bg-white rounded-2xl border border-neutral-100 p-8 md:p-10 shadow-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-6 transition-transform hover:scale-105"
              style={{ backgroundColor: 'var(--accent-orange)' }}
            >
              <FileText className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold text-neutral-900 tracking-tight mb-3">
              Crear Cuenta
            </h1>
            <p className="text-base text-neutral-600 leading-relaxed">
              Crea tu cuenta para comenzar a generar CVs profesionales con IA
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSignUp} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label
                htmlFor="fullName"
                className="text-sm font-medium text-neutral-700"
              >
                Nombre Completo
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Juan Pérez"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-12 border-neutral-200 focus:border-neutral-900 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-neutral-700"
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 border-neutral-200 focus:border-neutral-900 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-neutral-700"
              >
                Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="h-12 pr-12 border-neutral-200 focus:border-neutral-900 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-2 flex items-center justify-center rounded-md px-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número
              </p>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-neutral-700"
              >
                Confirmar Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Repite tu contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="h-12 pr-12 border-neutral-200 focus:border-neutral-900 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-2 flex items-center justify-center rounded-md px-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                  aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-sm font-medium transition-all duration-200 hover:shadow-md"
              style={{
                backgroundColor: loading ? 'var(--text-muted)' : 'var(--accent-orange)',
                color: 'white'
              }}
            >
              {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-neutral-600">
              ¿Ya tienes cuenta?{' '}
              <Link
                href="/login"
                className="font-medium transition-colors"
                style={{ color: 'var(--accent-orange)' }}
              >
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
