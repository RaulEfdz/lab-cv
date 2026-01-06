"use client"

import Link from "next/link"
import { ArrowLeft, LogOut, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { logout } from "@/app/admin/actions"
import { useState } from "react"

interface AdminHeaderProps {
  title: string
  description?: string
  backHref?: string
  backLabel?: string
  showLogout?: boolean
}

export function AdminHeader({
  title,
  description,
  backHref = "/admin/dashboard",
  backLabel = "Volver",
  showLogout = true,
}: AdminHeaderProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
    } catch (error) {
      setIsLoggingOut(false)
    }
  }

  return (
    <header className="flex items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3 min-w-0">
        {/* Logo mark */}
        <Link href="/admin/dashboard" className="shrink-0">
          <div className="w-9 h-9 bg-neutral-900 rounded-lg flex items-center justify-center hover:bg-neutral-800 transition-colors">
            <span className="text-white text-xs font-bold">RF</span>
          </div>
        </Link>

        <Link href={backHref} className="shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 h-9 px-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>

        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-neutral-900 tracking-tight truncate">{title}</h1>
          {description && (
            <p className="text-xs text-neutral-500 truncate">{description}</p>
          )}
        </div>
      </div>

      {showLogout && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="shrink-0 text-neutral-400 hover:text-red-600 hover:bg-red-50 h-9"
        >
          {isLoggingOut ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <LogOut className="w-4 h-4" />
          )}
        </Button>
      )}
    </header>
  )
}
