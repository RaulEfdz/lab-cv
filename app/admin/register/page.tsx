"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { validateSignupForm } from "@/lib/utils/auth-validation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowRight, Loader2, ArrowLeft } from "lucide-react"

export default function AdminRegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Validar todos los campos
      const validation = validateSignupForm(email, password, confirmPassword, fullName)
      if (!validation.isValid) {
        throw new Error(validation.error)
      }

      const supabase = createClient()

      // 1. Crear usuario en auth.users
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/admin/dashboard`,
        },
      })

      if (signUpError) throw signUpError
      if (!authData.user) throw new Error("No se pudo crear el usuario")

      // 2. El registro en profiles se hace automáticamente via trigger
      // Por defecto, se crea con rol 'user'
      // Un admin existente debe promover manualmente el rol a 'admin'

      // 3. Si requiere confirmación de email, mostrar mensaje
      if (!authData.session) {
        router.push("/admin/login?message=Cuenta creada. Por favor confirma tu email antes de iniciar sesión.")
        return
      }

      // 4. Si no requiere confirmación (autoconfirm está activado), redirigir
      router.push("/admin/dashboard")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Error al crear la cuenta")
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
              Bienvenido a<br />CV Lab
            </h1>
            <p className="text-lg text-neutral-400 max-w-md">
              Crea tu cuenta para comenzar a construir CVs profesionales con inteligencia artificial.
            </p>
          </div>

          <div className="text-sm text-neutral-500">
            © 2026 CV Lab
          </div>
        </div>
      </div>

      {/* Right side - Register form */}
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
              <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Registro</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900">
              Crear cuenta
            </h2>
            <p className="text-neutral-500">
              Completa los datos para comenzar
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="fullName"
                className="text-sm font-medium text-neutral-700"
              >
                Nombre completo
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Juan Pérez"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-12 px-4 bg-white border-neutral-200 focus-visible:border-neutral-400 focus-visible:ring-neutral-400/20"
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
                placeholder="tu-email@ejemplo.com"
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
                placeholder="Mínimo 8 caracteres"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 px-4 bg-white border-neutral-200 focus-visible:border-neutral-400 focus-visible:ring-neutral-400/20"
                minLength={8}
              />
              <p className="text-xs text-neutral-500">
                Debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número
              </p>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-neutral-700"
              >
                Confirmar contraseña
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repite tu contraseña"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                  Creando cuenta...
                </>
              ) : (
                <>
                  Crear cuenta
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6">
            <Link
              href="/admin/login"
              className="flex items-center justify-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              ¿Ya tienes cuenta? Inicia sesión
            </Link>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2">
            <div className="w-1 h-1 bg-neutral-900 rounded-full" />
            <p className="text-sm text-neutral-400">
              Plataforma SaaS de CV Lab
            </p>
            <div className="w-1 h-1 bg-neutral-900 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
