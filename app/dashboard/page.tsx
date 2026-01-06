import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { FileText, Plus, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function UserDashboard() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/login")
  }

  // Verificar que sea usuario regular (no admin)
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!profile) {
    redirect("/login")
  }

  // Si es admin, redirigir al dashboard de admin
  if (profile.role === 'admin') {
    redirect("/admin/dashboard")
  }

  // Obtener CVs del usuario
  const { data: cvs } = await supabase
    .from("cv_lab_cvs")
    .select(`
      *,
      cv_lab_versions(count)
    `)
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })

  const handleSignOut = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-neutral-900">Lab CV</h1>
              <p className="text-xs text-neutral-500">{profile.email}</p>
            </div>
          </div>
          <form action={handleSignOut}>
            <Button variant="ghost" size="sm" className="text-neutral-600 hover:text-neutral-900">
              <LogOut className="w-4 h-4 mr-2" />
              Salir
            </Button>
          </form>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-neutral-900 mb-2">
            Bienvenido, {profile.full_name || profile.email}
          </h2>
          <p className="text-neutral-600">
            Crea y gestiona tus CVs profesionales con la ayuda de IA
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-neutral-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="font-semibold text-neutral-900">Mis CVs</h3>
            </div>
            <p className="text-3xl font-bold text-neutral-900">{cvs?.length || 0}</p>
            <p className="text-sm text-neutral-500 mt-1">CVs creados</p>
          </div>
        </div>

        {/* CVs List */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-neutral-900">Tus CVs</h3>
            <Link href="/admin/cv-lab/new">
              <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Crear CV
              </Button>
            </Link>
          </div>

          {cvs && cvs.length > 0 ? (
            <div className="divide-y divide-neutral-100">
              {cvs.map((cv: any) => (
                <Link
                  key={cv.id}
                  href={`/admin/cv-lab/${cv.id}`}
                  className="block p-6 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-neutral-900">{cv.title}</h4>
                        <p className="text-sm text-neutral-500 mt-1">
                          {cv.target_role || 'Sin puesto objetivo'}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-neutral-400">
                            Actualizado: {new Date(cv.updated_at).toLocaleDateString('es-ES')}
                          </span>
                          <span className="text-xs text-neutral-400">
                            Versiones: {cv.cv_lab_versions[0]?.count || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        cv.status === 'READY' ? 'bg-green-100 text-green-700' :
                        cv.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-neutral-100 text-neutral-700'
                      }`}>
                        {cv.status}
                      </span>
                      <span className="text-sm text-neutral-500 mt-2">
                        {cv.readiness_score}% completo
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-neutral-400" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">No tienes CVs aún</h3>
              <p className="text-neutral-500 text-sm mb-6">
                Crea tu primer CV con la ayuda de Octavia, nuestra asistente de IA
              </p>
              <Link href="/admin/cv-lab/new">
                <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear mi primer CV
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
