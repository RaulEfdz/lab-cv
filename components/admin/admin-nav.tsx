"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Menu, LogOut, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet"
import { logout } from "@/app/admin/actions"

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Usuarios", href: "/admin/users" },
  { label: "CVs", href: "/admin/cvs" },
  { label: "Templates", href: "/admin/templates" },
  { label: "Configuración", href: "/admin/settings" },
]

export function AdminNav() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("mousemove", handleMouseMove, { passive: true })
    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
    } catch (error) {
      setIsLoggingOut(false)
    }
  }

  const isActiveRoute = (href: string) => {
    if (href === "/admin/dashboard") {
      return pathname === href
    }
    return pathname?.startsWith(href)
  }

  return (
    <nav className={`
      fixed top-0 w-full z-50 transition-all duration-500 group/nav
      ${isScrolled
        ? "bg-white/95 backdrop-blur-md border-b border-neutral-200 shadow-lg shadow-neutral-900/5"
        : "bg-white/80 backdrop-blur-sm border-b border-neutral-100"
      }
    `}>
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-[500px] h-[500px] -top-[250px] opacity-0 group-hover/nav:opacity-20 transition-opacity duration-700"
          style={{
            left: `${mousePosition.x - 250}px`,
            background: 'radial-gradient(circle, rgba(246, 115, 0, 0.3) 0%, transparent 70%)',
            filter: 'blur(40px)',
            transition: 'left 0.3s ease-out',
          }}
        />
      </div>

      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-orange-500/30 rounded-full"
            style={{
              left: `${20 + i * 20}%`,
              top: '50%',
              animation: `float ${3 + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>

      {/* Skip to main content - Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-neutral-900 focus:text-white focus:rounded-lg"
      >
        Ir al contenido principal
      </a>

      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link
            href="/admin/dashboard"
            className="relative text-xl font-bold tracking-tight group overflow-visible cursor-pointer"
          >
            {/* Rotating glow ring */}
            <span className="absolute inset-0 w-12 h-12 -left-2 -top-2 rounded-full bg-gradient-to-r from-orange-500 via-orange-300 to-orange-500 opacity-0 group-hover:opacity-20 blur-lg group-hover:animate-spin transition-opacity duration-500" />

            {/* Pulsing outer glow */}
            <span className="absolute inset-0 -inset-2 bg-orange-500/20 rounded-lg opacity-0 group-hover:opacity-100 blur-xl animate-pulse transition-opacity duration-300" />

            {/* Main text with gradient */}
            <span className="relative z-10 inline-block transition-all duration-500 group-hover:scale-110 bg-gradient-to-r from-neutral-900 via-orange-600 to-neutral-900 bg-clip-text text-transparent bg-[length:200%_100%] group-hover:bg-[length:100%_100%] animate-gradient">
              CV Lab
            </span>

            {/* Sparkle effects */}
            <span className="absolute top-0 right-0 w-1 h-1 bg-orange-500 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity duration-300" />
            <span className="absolute bottom-0 left-0 w-1 h-1 bg-orange-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity duration-300" style={{ animationDelay: '0.2s' }} />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = isActiveRoute(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    relative text-sm font-medium transition-all duration-300 px-4 py-2 rounded-lg group overflow-hidden
                    ${isActive
                      ? "text-neutral-900"
                      : "text-neutral-500 hover:text-neutral-900"
                    }
                  `}
                >
                  {/* Shimmer background on hover */}
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                  {/* Glow background on hover */}
                  <span className="absolute inset-0 bg-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />

                  <span className="relative z-10">{item.label}</span>

                  {/* Active indicator - Futuristic glow */}
                  {isActive && (
                    <>
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-[2px] bg-gradient-to-r from-transparent via-orange-500 to-transparent animate-pulse" />
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[2px] bg-orange-500 blur-[4px]" />
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-orange-500 rounded-full blur-sm animate-ping" />
                    </>
                  )}
                  {/* Hover effect */}
                  {!isActive && (
                    <>
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-gradient-to-r from-orange-500/50 via-orange-500 to-orange-500/50 transition-all duration-300 group-hover:w-full" />
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-orange-500 blur-sm transition-all duration-300 group-hover:w-8" />
                    </>
                  )}
                </Link>
              )
            })}

            {/* Logout Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="relative ml-2 text-neutral-500 hover:text-red-600 hover:bg-red-50 transition-all duration-300 group overflow-hidden"
            >
              {/* Shimmer on hover */}
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

              <span className="relative z-10 flex items-center gap-2">
                {isLoggingOut ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4" />
                )}
                <span className="hidden lg:inline">Salir</span>
              </span>
            </Button>
          </div>

          {/* Mobile Navigation */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden hover:bg-neutral-100"
                aria-label="Abrir menú de navegación"
              >
                <Menu className="w-5 h-5 text-neutral-900" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[280px] bg-white border-l border-neutral-100"
            >
              <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
              <div className="flex flex-col h-full pt-8">
                {/* Mobile menu header */}
                <div className="mb-8 px-2">
                  <span className="text-xl font-bold text-neutral-900">
                    CV Lab Admin
                  </span>
                </div>

                {/* Mobile nav links */}
                <nav className="flex flex-col gap-1">
                  {NAV_ITEMS.map((item) => {
                    const isActive = isActiveRoute(item.href)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`
                          relative flex items-center px-4 py-3 rounded-xl transition-all duration-300 font-medium group overflow-hidden
                          ${isActive
                            ? "text-neutral-900 bg-gradient-to-r from-orange-50 via-orange-50/50 to-transparent border-l-4 border-orange-500 shadow-lg shadow-orange-500/10"
                            : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                          }
                        `}
                      >
                        {/* Animated sweep effect */}
                        {!isActive && (
                          <>
                            <span className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/10 to-orange-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                            <span className="absolute left-0 top-0 bottom-0 w-0 bg-orange-500 group-hover:w-1 transition-all duration-300" />
                          </>
                        )}

                        {/* Active pulse effect */}
                        {isActive && (
                          <>
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-orange-500 blur-sm animate-pulse" />
                            <span className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent animate-pulse" />
                          </>
                        )}

                        <span className="relative z-10 group-hover:translate-x-1 transition-transform duration-300">{item.label}</span>

                        {/* Hover arrow indicator */}
                        <span className="absolute right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1 text-orange-500">→</span>
                      </Link>
                    )
                  })}
                </nav>

                {/* Logout Button Mobile */}
                <div className="mt-auto mb-8 px-2">
                  <div className="h-px bg-neutral-100 mb-4" />
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full justify-start text-neutral-500 hover:text-red-600 hover:bg-red-50"
                  >
                    {isLoggingOut ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <LogOut className="w-4 h-4 mr-2" />
                    )}
                    Cerrar sesión
                  </Button>
                  <p className="text-sm text-neutral-400 mt-4">
                    CV Lab - Plataforma SaaS
                  </p>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
}
