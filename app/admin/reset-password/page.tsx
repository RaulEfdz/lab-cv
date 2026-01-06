"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowRight, Loader2, ArrowLeft } from "lucide-react"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Verificar si hay un token de recuperación en la URL
    const supabase = createClient()
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        // El usuario hizo clic en el enlace de recuperación
        setSuccess("Ahora puedes establecer tu nueva contraseña.")
      }
    })
  }, [])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    // Validaciones
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      setIsLoading(false)
      return
    }

    const supabase = createClient()

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) throw updateError

      setSuccess("Contraseña actualizada correctamente. Redirigiendo al login...")

      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        router.push("/admin/login")
      }, 2000)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Error al actualizar la contraseña")
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
              Recupera tu<br />cuenta
            </h1>
            <p className="text-lg text-neutral-400 max-w-md">
              Establece una nueva contraseña para volver a acceder a tu cuenta.
            </p>
          </div>

          <div className="text-sm text-neutral-500">
            © 2026 CV Lab
          </div>
        </div>
      </div>

      {/* Right side - Reset password form */}
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
              <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Recuperar Contraseña</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900">
              Nueva contraseña
            </h2>
            <p className="text-neutral-500">
              Ingresa tu nueva contraseña
            </p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-neutral-700"
              >
                Nueva contraseña
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 px-4 bg-white border-neutral-200 focus-visible:border-neutral-400 focus-visible:ring-neutral-400/20"
              />
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

            {success && (
              <div className="flex items-start gap-3 bg-green-50 border border-green-100 text-green-600 px-4 py-3 rounded-lg text-sm">
                <div className="w-1 h-1 rounded-full bg-green-500 mt-1.5 shrink-0" />
                {success}
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
                  Actualizando...
                </>
              ) : (
                <>
                  Actualizar contraseña
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
              Volver al inicio de sesión
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
