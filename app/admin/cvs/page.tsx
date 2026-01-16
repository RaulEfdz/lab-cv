import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { FileText, Download, Eye, MoreVertical, Search, Sparkles, Calendar, User, Plus } from "lucide-react"
import { AdminPageWrapper } from "@/components/admin/admin-page-wrapper"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default async function CVsPage() {
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
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect("/admin/login")
  }

  // Obtener CVs
  const { data: cvs, count, error } = await supabase
    .from("cvs")
    .select(`
      *,
      users (
        id,
        email,
        full_name
      )
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(50)

  // Calcular estadísticas
  const totalCVs = count || 0
  const aiGeneratedCount = cvs?.filter(cv => cv.ai_generated)?.length || 0
  const todayCVs = cvs?.filter(cv => {
    const cvDate = new Date(cv.created_at)
    const today = new Date()
    return cvDate.toDateString() === today.toDateString()
  })?.length || 0

  return (
    <AdminPageWrapper>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">CVs Generados</h1>
                <p className="text-neutral-500 text-sm mt-1">
                  {totalCVs} CV{totalCVs !== 1 ? 's' : ''} en total
                </p>
              </div>
            </div>
            <Link href="/admin/cv-lab/new">
              <Button className="h-11 px-6 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/30">
                <Plus className="w-5 h-5 mr-2" />
                Crear CV
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-neutral-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="font-semibold text-neutral-900">Total CVs</h3>
            </div>
            <p className="text-3xl font-bold text-neutral-900">{totalCVs}</p>
            <p className="text-sm text-neutral-500 mt-1">Generados en la plataforma</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-neutral-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-neutral-900">Con IA</h3>
            </div>
            <p className="text-3xl font-bold text-neutral-900">{aiGeneratedCount}</p>
            <p className="text-sm text-neutral-500 mt-1">
              {totalCVs > 0 ? Math.round((aiGeneratedCount / totalCVs) * 100) : 0}% del total
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-neutral-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-neutral-900">Hoy</h3>
            </div>
            <p className="text-3xl font-bold text-neutral-900">{todayCVs}</p>
            <p className="text-sm text-neutral-500 mt-1">Generados hoy</p>
          </div>
        </div>

        {/* Search and filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <Input
              placeholder="Buscar CVs por usuario o título..."
              className="pl-10 h-12 bg-white border-neutral-200"
            />
          </div>
          <Button className="h-12 bg-neutral-900 hover:bg-neutral-800">
            Filtros
          </Button>
        </div>

        {/* CVs Table */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          {cvs && cvs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                      CV
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                      Template
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                      Creado
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                      IA
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {cvs.map((cv) => (
                    <tr key={cv.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="font-medium text-neutral-900">
                              {cv.title || 'Sin título'}
                            </div>
                            <div className="text-sm text-neutral-500">ID: {cv.id.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-neutral-600">
                          <User className="w-4 h-4 text-neutral-400" />
                          <span className="text-sm">
                            {cv.users?.full_name || cv.users?.email || 'Usuario desconocido'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-neutral-600">
                          {cv.template_id ? `Template #${cv.template_id.slice(0, 8)}` : 'Default'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-neutral-600">
                          <Calendar className="w-4 h-4 text-neutral-400" />
                          <span className="text-sm">
                            {new Date(cv.created_at).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {cv.ai_generated ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-purple-50 text-purple-700">
                            <Sparkles className="w-3 h-3" />
                            IA
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-neutral-100 text-neutral-600">
                            Manual
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-neutral-400" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">No hay CVs generados</h3>
              <p className="text-neutral-500 text-sm mb-6">
                Los CVs creados por los usuarios aparecerán aquí
              </p>
              <Link href="/admin/cv-lab/new">
                <Button className="h-11 px-6 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/30">
                  <Plus className="w-5 h-5 mr-2" />
                  Crear primer CV
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </AdminPageWrapper>
  )
}
