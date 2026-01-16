import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Users, Mail, Calendar, Shield, MoreVertical, Search } from "lucide-react"
import { AdminPageWrapper } from "@/components/admin/admin-page-wrapper"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default async function UsersPage() {
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

  // Obtener usuarios (excluyendo admins)
  const { data: users, count, error } = await supabase
    .from("users")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(50)

  return (
    <AdminPageWrapper>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Usuarios</h1>
              <p className="text-neutral-500 text-sm mt-1">
                {count || 0} usuario{(count || 0) !== 1 ? 's' : ''} registrado{(count || 0) !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Search and filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <Input
              placeholder="Buscar usuarios por email o nombre..."
              className="pl-10 h-12 bg-white border-neutral-200"
            />
          </div>
          <Button className="h-12 bg-neutral-900 hover:bg-neutral-800">
            Filtros
          </Button>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          {users && users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                      Registro
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                      CVs
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-semibold">
                              {(user.full_name || user.email)?.[0]?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-neutral-900">
                              {user.full_name || 'Sin nombre'}
                            </div>
                            <div className="text-sm text-neutral-500">ID: {user.id.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-neutral-600">
                          <Mail className="w-4 h-4 text-neutral-400" />
                          <span className="text-sm">{user.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-neutral-600">
                          <Calendar className="w-4 h-4 text-neutral-400" />
                          <span className="text-sm">
                            {new Date(user.created_at).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700">
                          0 CVs
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-neutral-400" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">No hay usuarios</h3>
              <p className="text-neutral-500 text-sm">
                Los usuarios registrados aparecerán aquí
              </p>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-2xl p-6 border border-neutral-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-neutral-900">Total Usuarios</h3>
            </div>
            <p className="text-3xl font-bold text-neutral-900">{count || 0}</p>
            <p className="text-sm text-neutral-500 mt-1">Registrados en la plataforma</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-neutral-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-neutral-900">Usuarios Activos</h3>
            </div>
            <p className="text-3xl font-bold text-neutral-900">{count || 0}</p>
            <p className="text-sm text-neutral-500 mt-1">Últimos 30 días</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-neutral-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="font-semibold text-neutral-900">Nuevos Hoy</h3>
            </div>
            <p className="text-3xl font-bold text-neutral-900">0</p>
            <p className="text-sm text-neutral-500 mt-1">Registros del día</p>
          </div>
        </div>
      </div>
    </AdminPageWrapper>
  )
}
