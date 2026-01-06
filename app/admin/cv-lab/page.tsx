import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AdminPageWrapper } from '@/components/admin/admin-page-wrapper'
import { Button } from '@/components/ui/button'
import { CvList } from '@/components/cv-lab/cv-list'
import { Plus, FileText, Sparkles } from 'lucide-react'

export default async function CvLabPage() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/admin/login')
  }

  // Verify admin
  const { data: admin } = await supabase
    .from('admins')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!admin) {
    redirect('/admin/login')
  }

  // Get all CVs (simplified - counts are done client-side)
  const { data: cvs, error: cvsError } = await supabase
    .from('cv_lab_cvs')
    .select('*')
    .order('updated_at', { ascending: false })

  if (cvsError) {
    console.error('Error fetching CVs:', cvsError)
  }

  // Get counts for each CV
  const cvsWithCounts = await Promise.all((cvs || []).map(async (cv) => {
    const [versionsResult, messagesResult] = await Promise.all([
      supabase.from('cv_lab_versions').select('id', { count: 'exact', head: true }).eq('cv_id', cv.id),
      supabase.from('cv_lab_messages').select('id', { count: 'exact', head: true }).eq('cv_id', cv.id)
    ])

    return {
      ...cv,
      versions_count: versionsResult.count || 0,
      messages_count: messagesResult.count || 0
    }
  }))

  return (
    <AdminPageWrapper>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-xl">
                <Sparkles className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-neutral-900">CV Lab</h1>
                <p className="text-neutral-500 mt-1">
                  Crea y perfecciona tu CV con asistencia de IA
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/admin/cv-lab/prompt">
                Editar prompt
              </Link>
            </Button>
            <Button asChild className="bg-orange-500 hover:bg-orange-600">
              <Link href="/admin/cv-lab/new">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo CV
              </Link>
            </Button>
          </div>
        </div>

        {/* CVs List with bulk actions */}
        {cvsWithCounts && cvsWithCounts.length > 0 ? (
          <CvList cvs={cvsWithCounts} />
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">
              No hay CVs aún
            </h3>
            <p className="text-neutral-500 mb-6 max-w-sm mx-auto">
              Comienza creando tu primer CV asistido por IA.
              El asistente te guiará paso a paso.
            </p>
            <Button asChild className="bg-orange-500 hover:bg-orange-600">
              <Link href="/admin/cv-lab/new">
                <Plus className="mr-2 h-4 w-4" />
                Crear mi primer CV
              </Link>
            </Button>
          </div>
        )}
      </div>
    </AdminPageWrapper>
  )
}
