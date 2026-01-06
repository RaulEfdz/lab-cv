import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Sparkles, Eye, Edit, Trash2, Plus, Search, Star, Calendar } from "lucide-react"
import { AdminPageWrapper } from "@/components/admin/admin-page-wrapper"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default async function TemplatesPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/admin/login")
  }

  // Verificar si es admin
  const { data: adminData } = await supabase.from("admins").select("*").eq("id", user.id).single()

  if (!adminData) {
    redirect("/admin/login")
  }

  // Obtener templates
  const { data: templates, count, error } = await supabase
    .from("cv_templates")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(50)

  // Contar templates premium y gratuitos
  const premiumCount = templates?.filter(t => t.is_premium)?.length || 0
  const freeCount = (count || 0) - premiumCount

  return (
    <AdminPageWrapper>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Templates</h1>
                <p className="text-neutral-500 text-sm mt-1">
                  {count || 0} plantilla{(count || 0) !== 1 ? 's' : ''} disponible{(count || 0) !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <Button className="h-12 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Template
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-neutral-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-neutral-900">Total Templates</h3>
            </div>
            <p className="text-3xl font-bold text-neutral-900">{count || 0}</p>
            <p className="text-sm text-neutral-500 mt-1">En la biblioteca</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-neutral-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
              <h3 className="font-semibold text-neutral-900">Premium</h3>
            </div>
            <p className="text-3xl font-bold text-neutral-900">{premiumCount}</p>
            <p className="text-sm text-neutral-500 mt-1">Templates de pago</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-neutral-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-neutral-900">Gratuitos</h3>
            </div>
            <p className="text-3xl font-bold text-neutral-900">{freeCount}</p>
            <p className="text-sm text-neutral-500 mt-1">Templates gratis</p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <Input
              placeholder="Buscar templates..."
              className="pl-10 h-12 bg-white border-neutral-200"
            />
          </div>
        </div>

        {/* Templates Grid */}
        {templates && templates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div
                key={template.id}
                className="group bg-white rounded-2xl border border-neutral-200 overflow-hidden hover:shadow-xl hover:border-purple-200 transition-all duration-300"
              >
                {/* Preview */}
                <div className="relative aspect-[3/4] bg-gradient-to-br from-neutral-100 to-neutral-50 overflow-hidden">
                  {/* Template preview placeholder */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Sparkles className="w-12 h-12 text-neutral-300 mx-auto mb-2" />
                      <p className="text-sm text-neutral-400">Vista previa</p>
                    </div>
                  </div>

                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="bg-white/90 hover:bg-white text-neutral-900"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="bg-white/90 hover:bg-white text-neutral-900"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                    </div>
                  </div>

                  {/* Premium badge */}
                  {template.is_premium && (
                    <div className="absolute top-3 right-3 px-3 py-1 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full text-white text-xs font-semibold flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      Premium
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-5">
                  <h3 className="font-semibold text-neutral-900 mb-1 group-hover:text-purple-600 transition-colors">
                    {template.name || 'Sin nombre'}
                  </h3>
                  <p className="text-sm text-neutral-500 mb-3 line-clamp-2">
                    {template.description || 'Sin descripción'}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <Calendar className="w-3 h-3" />
                      {new Date(template.created_at).toLocaleDateString('es-ES', {
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-neutral-200 py-16">
            <div className="text-center">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-neutral-400" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">No hay templates</h3>
              <p className="text-neutral-500 text-sm mb-6">
                Comienza creando tu primer template de CV
              </p>
              <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Crear Template
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminPageWrapper>
  )
}
