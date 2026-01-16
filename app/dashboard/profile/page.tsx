import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileForm } from '@/components/dashboard/profile-form'
import { User, Shield, AlertTriangle } from 'lucide-react'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">
            Mi Perfil
          </h1>
          <p className="text-neutral-500 mt-1">
            Gestiona tu información personal y configuración de cuenta
          </p>
        </div>

        {/* Personal Information Section */}
        <section className="bg-white rounded-2xl border border-neutral-200 p-6 md:p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-100 rounded-xl">
              <User className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">
                Información Personal
              </h2>
              <p className="text-sm text-neutral-500">
                Actualiza tus datos personales
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Full Name - Editable */}
            <ProfileForm
              userId={user.id}
              initialFullName={profile.full_name || ''}
              email={profile.email || user.email || ''}
              role={profile.role}
              createdAt={profile.created_at}
            />
          </div>
        </section>

        {/* Security Section */}
        <section className="bg-white rounded-2xl border border-neutral-200 p-6 md:p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">
                Seguridad
              </h2>
              <p className="text-sm text-neutral-500">
                Gestiona la seguridad de tu cuenta
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Contraseña
              </label>
              <p className="text-sm text-neutral-500 mb-3">
                Última actualización: No disponible
              </p>
              {/* Change Password button handled in ProfileForm component */}
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="bg-white rounded-2xl border border-red-200 p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-100 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">
                Zona de Peligro
              </h2>
              <p className="text-sm text-neutral-500">
                Acciones irreversibles
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <h3 className="text-sm font-semibold text-red-900 mb-2">
                Eliminar cuenta
              </h3>
              <p className="text-sm text-red-700 mb-4">
                Una vez eliminada, no podrás recuperar tu cuenta ni tus CVs.
                Esta acción es permanente.
              </p>
              {/* Delete Account button handled in ProfileForm component */}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
