"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowRight, Loader2, KeyRound } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
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
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const trimmedEmail = email.trim()

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
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
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Error al iniciar sesión")
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

    try {
      const trimmedEmail = email.trim()

      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: `${window.location.origin}/auth/callback`,
      })

      if (error) throw error

      setError(null)
      alert("Email de recuperación enviado. Revisa tu bandeja de entrada.")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Error al enviar email de recuperación")
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
          <div>
            <span className="text-2xl font-bold tracking-tight">CV Lab</span>
          </div>

          <div className="space-y-6">
            <h1 className="text-5xl font-bold tracking-tight leading-tight">
              Crea tu CV<br />con IA
            </h1>
            <p className="text-lg text-neutral-400 max-w-md">
              Plataforma inteligente para crear CVs profesionales optimizados con inteligencia artificial.
            </p>
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
          <div className="lg:hidden mb-12 flex justify-center">
            <div className="w-12 h-12 bg-neutral-900 rounded-xl flex items-center justify-center">
              <span className="text-white text-sm font-bold">CV</span>
            </div>
          </div>

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
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 px-4 bg-white border-neutral-200 focus-visible:border-neutral-400 focus-visible:ring-neutral-400/20"
              />
            </div>

            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-sm">
                <div className="w-1 h-1 rounded-full bg-red-500 mt-1.5 shrink-0" />
                {error}
              </div>
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
