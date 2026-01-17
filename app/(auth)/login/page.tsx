"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowRight, Eye, EyeOff, Loader2, KeyRound, Mail } from "lucide-react"

const localizeErrorMessage = (message: string) => {
  const invalidEmailMatch = message.match(/^Email address "(.+)" is invalid$/)
  if (invalidEmailMatch) {
    return `La dirección de email "${invalidEmailMatch[1]}" no es válida.`
  }

  return message
}

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showResendEmail, setShowResendEmail] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  // Capturar errores del hash de la URL (ej: #error=access_denied&error_code=otp_expired)
  useEffect(() => {
    const hash = window.location.hash
    if (hash) {
      const params = new URLSearchParams(hash.substring(1))
      const errorCode = params.get('error_code')
      const errorDescription = params.get('error_description')

      if (errorCode === 'otp_expired') {
        setError('El enlace de verificación ha expirado. Por favor, solicita un nuevo enlace de recuperación de contraseña.')
      } else if (errorDescription) {
        setError(decodeURIComponent(errorDescription))
      } else if (params.get('error')) {
        setError('Error de autenticación. Por favor, intenta nuevamente.')
      }

      // Limpiar el hash de la URL
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)
    setShowResendEmail(false)

    try {
      const trimmedEmail = email.trim()

      // Primero verificar si el email existe
      const checkEmailResponse = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: trimmedEmail }),
      })

      const emailCheckData = await checkEmailResponse.json()

      if (!emailCheckData.exists) {
        // El email no existe en el sistema
        throw new Error("Esta cuenta no existe. ¿Quieres crear una cuenta nueva?")
      }

      // El email existe, proceder con el login
      const supabase = createClient()

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      })

      if (signInError) {
        // Detectar si el email no está confirmado
        if (signInError.message.includes("Email not confirmed")) {
          setShowResendEmail(true)
          throw new Error("Tu email no ha sido confirmado. Revisa tu bandeja de entrada o reenvía el email de verificación.")
        }

        // Para el error de credenciales inválidas, verificar si es cuenta no verificada
        if (signInError.message.includes("Invalid login credentials")) {
          // Verificar el estado del email
          const checkResponse = await fetch('/api/auth/check-verification', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: trimmedEmail }),
          })

          if (checkResponse.ok) {
            const { exists, verified } = await checkResponse.json()

            // Si el email existe pero no está verificado
            if (exists && !verified) {
              setShowResendEmail(true)
              throw new Error("Tu email no ha sido confirmado. Revisa tu bandeja de entrada o reenvía el email de verificación.")
            }
          }

          // Si el email no existe o ya está verificado (entonces la contraseña es incorrecta)
          setShowResendEmail(false)
          throw new Error("Contraseña incorrecta.")
        }

        // Para otros errores, no mostrar el botón
        setShowResendEmail(false)
        throw signInError
      }

      // Verificar si el email está confirmado
      if (data.user && !data.user.email_confirmed_at) {
        setShowResendEmail(true)
        await supabase.auth.signOut()
        throw new Error("Tu email no ha sido confirmado. Revisa tu bandeja de entrada o reenvía el email de verificación.")
      }

      if (data.user) {
        // Obtener el rol del usuario desde profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()

        // Determinar la ruta destino
        const destination = profile?.role === 'admin' ? '/admin/dashboard' : '/dashboard'

        // Usar window.location para redirección completa
        // Esto asegura que todos los contextos se reinicien correctamente
        setTimeout(() => {
          window.location.href = destination
        }, 300)
      }
    } catch (error: unknown) {
      setError(
        localizeErrorMessage(
          error instanceof Error ? error.message : "Error al iniciar sesión",
        ),
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendVerification = async () => {
    if (!email) {
      setError("Por favor ingresa tu email primero")
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const trimmedEmail = email.trim()

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(trimmedEmail)) {
        throw new Error("El formato del email no es válido")
      }

      // Llamar a nuestra API route personalizada que usa la admin API de Supabase
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: trimmedEmail }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al reenviar email de verificación')
      }

      setSuccess("Email de verificación enviado. Revisa tu bandeja de entrada.")
      setShowResendEmail(false)
    } catch (error: unknown) {
      setError(
        localizeErrorMessage(
          error instanceof Error ? error.message : "Error al reenviar email",
        ),
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!email) {
      setError("Por favor ingresa tu email primero")
      return
    }

    const supabase = createClient()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const trimmedEmail = email.trim()

      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: `${window.location.origin}/auth/callback`,
      })

      if (error) throw error

      setSuccess("Email de recuperación enviado. Revisa tu bandeja de entrada.")
    } catch (error: unknown) {
      setError(
        localizeErrorMessage(
          error instanceof Error ? error.message : "Error al enviar email de recuperación",
        ),
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-[#FAFAFA]">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-neutral-900 relative overflow-hidden">
        {/* Blob gradient */}
        <div className="absolute inset-0">
          <div
            className="absolute w-[140%] h-[140%] -top-[20%] -left-[20%]"
            style={{
              background: `
                radial-gradient(ellipse at 30% 40%, #4A90D9 0%, transparent 50%),
                radial-gradient(ellipse at 70% 60%, #F67300 0%, transparent 50%),
                radial-gradient(ellipse at 50% 50%, #7BB3E0 0%, transparent 60%)
              `,
              filter: 'blur(80px)',
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <Link href="/">
            <span className="text-2xl font-bold tracking-tight cursor-pointer hover:opacity-80 transition-opacity">CV Lab</span>
          </Link>

          <div className="space-y-6">
            <h1 className="text-5xl font-bold tracking-tight leading-tight">
              Crea tu CV<br />con IA
            </h1>
            <p className="text-lg text-neutral-400 max-w-md">
              Plataforma inteligente para crear CVs profesionales optimizados con inteligencia artificial.
            </p>
            <Link href="/">
              <Button
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 hover:border-white/30 backdrop-blur-sm"
              >
                Ver más información
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          <div className="text-sm text-neutral-500">
            © 2026 CV Lab
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <Link href="/" className="lg:hidden mb-12 flex justify-center">
            <div className="w-12 h-12 bg-neutral-900 rounded-xl flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
              <span className="text-white text-sm font-bold">CV</span>
            </div>
          </Link>

          <div className="space-y-2 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-6 bg-neutral-900 rounded-full" />
              <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Iniciar Sesión</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900">
              Bienvenido
            </h2>
            <p className="text-neutral-500">
              Ingresa tus credenciales para continuar
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
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
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 px-4 bg-white border-neutral-200 focus-visible:border-neutral-400 focus-visible:ring-neutral-400/20"
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
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pr-12 px-4 bg-white border-neutral-200 focus-visible:border-neutral-400 focus-visible:ring-neutral-400/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
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
            </div>

            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-sm">
                <div className="w-1 h-1 rounded-full bg-red-500 mt-1.5 shrink-0" />
                {error}
              </div>
            )}

            {success && (
              <div className="flex items-start gap-3 bg-green-50 border border-green-100 text-green-600 px-4 py-3 rounded-lg text-sm">
                <div className="w-1 h-1 rounded-full bg-green-500 mt-1.5 shrink-0" />
                {success}
              </div>
            )}

            {showResendEmail && (
              <Button
                type="button"
                onClick={handleResendVerification}
                disabled={isLoading}
                variant="outline"
                className="w-full h-12 border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-medium rounded-lg transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Reenviando...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    Reenviar email de verificación
                  </>
                )}
              </Button>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-neutral-900 hover:bg-neutral-800 text-white font-medium rounded-lg transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                <>
                  Iniciar Sesión
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>

            <Button
              type="button"
              onClick={handleResetPassword}
              disabled={isLoading}
              variant="ghost"
              className="w-full h-10 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 font-medium rounded-lg transition-colors"
            >
              <KeyRound className="w-4 h-4" />
              ¿Olvidaste tu contraseña?
            </Button>
          </form>

          <div className="mt-6">
            <Link
              href="/signup"
              className="flex items-center justify-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              ¿No tienes cuenta? Regístrate aquí
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2">
            <div className="w-1 h-1 bg-neutral-900 rounded-full" />
            <p className="text-sm text-neutral-400">
              CV Lab - Plataforma SaaS
            </p>
            <div className="w-1 h-1 bg-neutral-900 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
