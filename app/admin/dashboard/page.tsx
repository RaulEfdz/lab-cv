import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import {
  Users,
  FileText,
  Sparkles,
  Settings,
  User,
  ArrowRight,
  TrendingUp,
  Zap,
} from "lucide-react"
import { AdminPageWrapper } from "@/components/admin/admin-page-wrapper"

export default async function AdminDashboard() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/admin/login")
  }

  // Verificar si es admin usando profiles.role
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect("/admin/login")
  }

  // Obtener estadísticas de CV Lab
  const [
    { count: usersCount },
    { count: cvsCount },
    { count: templatesCount },
  ] = await Promise.all([
    // Contar usuarios totales (excluyendo admins)
    supabase.from("users").select("*", { count: "exact", head: true }),
    // Contar CVs generados
    supabase.from("cvs").select("*", { count: "exact", head: true }),
    // Contar templates disponibles
    supabase.from("cv_templates").select("*", { count: "exact", head: true }),
  ]).catch(() => [
    { count: 0 },
    { count: 0 },
    { count: 0 },
  ])

  // Mock data para métricas (mientras no tengamos tabla de analytics)
  const totalUsers = usersCount || 0
  const totalCVs = cvsCount || 0
  const aiGenerations = Math.floor((cvsCount || 0) * 0.7) // 70% de CVs usan IA

  const maxValue = Math.max(totalUsers, totalCVs, aiGenerations, 1)

  const stats = [
    { label: "Usuarios activos", value: totalUsers, color: "orange", percentage: (totalUsers / maxValue) * 100 },
    { label: "CVs generados", value: totalCVs, color: "blue", percentage: (totalCVs / maxValue) * 100 },
    { label: "Generados con IA", value: aiGenerations, color: "teal", percentage: (aiGenerations / maxValue) * 100 },
  ]

  const contentStats = [
    { label: "Usuarios", value: usersCount || 0, href: "/admin/users", icon: Users },
    { label: "CVs", value: cvsCount || 0, href: "/admin/cvs", icon: FileText },
    { label: "Templates", value: templatesCount || 0, href: "/admin/templates", icon: Sparkles },
  ]

  const quickLinks = [
    { label: "Usuarios", href: "/admin/users", icon: Users, description: "Gestionar usuarios de la plataforma" },
    { label: "CVs", href: "/admin/cvs", icon: FileText, description: "Ver todos los CVs generados" },
    { label: "Templates", href: "/admin/templates", icon: Sparkles, description: "Plantillas de CV disponibles" },
    { label: "Analíticas", href: "/admin/analytics", icon: TrendingUp, description: "Métricas y estadísticas" },
    { label: "IA & Tokens", href: "/admin/ai-settings", icon: Zap, description: "Configuración de IA" },
    { label: "Configuración", href: "/admin/settings", icon: Settings, description: "Ajustes de la plataforma" },
  ]

  return (
    <AdminPageWrapper>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Dashboard - CV Lab</h1>
          <p className="text-neutral-500 mt-1">Bienvenido, {profile.full_name || profile.email.split("@")[0]}</p>
        </div>

        {/* Analytics Chart Section */}
        <section className="mb-12">
          <div className="bg-white rounded-3xl p-8 border border-neutral-200 shadow-sm">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-neutral-900">Métricas de la Plataforma</h2>
                  <p className="text-sm text-neutral-500">Estadísticas generales</p>
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="inline-flex items-center">
                    <span className={`w-2.5 h-2.5 rounded-sm mr-2 ${
                      stat.color === 'orange' ? 'bg-orange-500' :
                      stat.color === 'blue' ? 'bg-blue-500' : 'bg-teal-500'
                    }`} />
                    <span className="text-sm text-neutral-500">{stat.label.split(' ')[0]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Vertical Bar Chart */}
            <div className="relative h-72">
              {/* Y-axis grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pl-12">
                {[100, 75, 50, 25, 0].map((val) => (
                  <div key={val} className="flex items-center w-full">
                    <span className="text-xs text-neutral-400 w-10 text-right mr-2 tabular-nums">
                      {Math.round(maxValue * val / 100)}
                    </span>
                    <div className="flex-1 border-t border-neutral-100" />
                  </div>
                ))}
              </div>

              {/* Bars Container */}
              <div className="absolute inset-0 flex items-end justify-around pl-14 pr-4 pb-8">
                {stats.map((stat) => (
                  <div key={stat.label} className="flex flex-col items-center group">
                    {/* Value on hover */}
                    <span className="text-sm font-semibold text-neutral-900 mb-2 opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
                      {stat.value.toLocaleString()}
                    </span>

                    {/* Bar */}
                    <div className="relative w-14 sm:w-20 h-52 bg-neutral-50 rounded-lg overflow-hidden">
                      <div
                        className={`absolute bottom-0 left-0 right-0 rounded-lg transition-all duration-700 ease-out ${
                          stat.color === 'orange' ? 'bg-orange-500' :
                          stat.color === 'blue' ? 'bg-blue-500' : 'bg-teal-500'
                        }`}
                        style={{ height: `${Math.max(stat.percentage, 3)}%` }}
                      />
                    </div>

                    {/* Label */}
                    <span className="text-xs font-medium text-neutral-600 mt-3 text-center">
                      {stat.label.split(' ')[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Content Stats - Left Column */}
          <section className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1.5 h-6 bg-neutral-900 rounded-full" />
              <h2 className="text-lg font-semibold text-neutral-900">Tu contenido</h2>
            </div>
            <div className="space-y-3">
              {contentStats.map((stat) => (
                <Link
                  key={stat.label}
                  href={stat.href}
                  className="group flex items-center gap-4 bg-white rounded-2xl p-5 border border-neutral-200 hover:border-orange-200 hover:shadow-md transition-all duration-300"
                >
                  <div className="p-2.5 bg-neutral-100 rounded-xl group-hover:bg-orange-500 transition-colors">
                    <stat.icon className="w-5 h-5 text-neutral-600 group-hover:text-white transition-colors" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-neutral-900">{stat.label}</div>
                  </div>
                  <div className="text-2xl font-bold text-neutral-900">{stat.value}</div>
                  <ArrowRight className="w-5 h-5 text-neutral-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          </section>

          {/* Quick Links - Right Column */}
          <section className="lg:col-span-3">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1.5 h-6 bg-neutral-900 rounded-full" />
              <h2 className="text-lg font-semibold text-neutral-900">Accesos rápidos</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {quickLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="group relative bg-white rounded-2xl p-6 border border-neutral-200 hover:border-orange-200 hover:shadow-md overflow-hidden transition-all duration-300"
                >
                  {/* Hover gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="relative flex items-start gap-4">
                    <div className="p-3 bg-neutral-100 rounded-xl group-hover:bg-orange-500/10 transition-colors">
                      <link.icon className="w-5 h-5 text-neutral-600 group-hover:text-orange-500 transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-neutral-900 mb-1 group-hover:text-orange-600 transition-colors">
                        {link.label}
                      </div>
                      <div className="text-sm text-neutral-500 line-clamp-2">
                        {link.description}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-16">
          <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-bold">CV</span>
                </div>
                <div>
                  <span className="text-sm font-semibold text-white">CV Lab</span>
                  <span className="text-xs text-neutral-400 block">Plataforma SaaS</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-neutral-400">
                <span>v1.0.0</span>
                <span>•</span>
                <span>{totalUsers} usuarios</span>
                <span>•</span>
                <span>{totalCVs} CVs</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </AdminPageWrapper>
  )
}
