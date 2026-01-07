import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ArrowLeft, Calendar, Target, FileText, Download } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { YappyDownloadButton } from '@/components/payments/YappyDownloadButton'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function UserCvDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Verificar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Obtener CV del usuario
  const { data: cv, error: cvError } = await supabase
    .from('cv_lab_cvs')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id) // Asegurar que solo el propietario puede ver
    .single()

  if (cvError || !cv) {
    notFound()
  }

  // Verificar si tiene acceso de descarga
  const { data: downloadAccess } = await supabase
    .from('cv_download_access')
    .select('id, status, download_count, last_downloaded_at')
    .eq('cv_id', id)
    .eq('user_id', user.id)
    .eq('status', 'ACTIVE')
    .maybeSingle()

  const hasAccess = !!downloadAccess

  // Obtener última versión
  const { data: latestVersion } = await supabase
    .from('cv_lab_versions')
    .select('*')
    .eq('cv_id', id)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  const statusConfig = {
    DRAFT: { label: 'Borrador', color: 'bg-gray-100 text-gray-800' },
    IN_PROGRESS: { label: 'En Progreso', color: 'bg-blue-100 text-blue-800' },
    READY: { label: 'Listo', color: 'bg-green-100 text-green-800' },
    ARCHIVED: { label: 'Archivado', color: 'bg-orange-100 text-orange-800' },
  }

  const status = statusConfig[cv.status as keyof typeof statusConfig] || statusConfig.DRAFT

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver al Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* CV Details - Left Column */}
          <div className="lg:col-span-2 space-y-6">

            {/* CV Info Card */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {cv.title}
                  </h1>
                  <div className="flex items-center gap-3">
                    <Badge className={status.color}>
                      {status.label}
                    </Badge>
                    {cv.readiness_score !== null && (
                      <span className="text-sm text-gray-600">
                        Completitud: <span className="font-semibold">{cv.readiness_score}%</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="flex items-start gap-3">
                  <Target className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Puesto Objetivo</p>
                    <p className="text-base text-gray-900">{cv.target_role || 'No especificado'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Creado</p>
                    <p className="text-base text-gray-900">
                      {new Date(cv.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Última Versión</p>
                    <p className="text-base text-gray-900">
                      {latestVersion ? `v${latestVersion.version_number}` : 'Sin versiones'}
                    </p>
                  </div>
                </div>

                {hasAccess && (
                  <div className="flex items-start gap-3">
                    <Download className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Descargas</p>
                      <p className="text-base text-gray-900">
                        {downloadAccess.download_count} veces
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* CV Content Preview */}
            {cv.content && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Vista Previa del Contenido
                </h2>
                <div className="prose max-w-none">
                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                      {typeof cv.content === 'string'
                        ? cv.content
                        : JSON.stringify(cv.content, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Download Section - Right Column */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">

              {/* Download Card */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Descarga tu CV
                </h2>

                {hasAccess && (
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800">
                      <Download className="w-5 h-5" />
                      <p className="text-sm font-medium">
                        Tienes acceso a este CV
                      </p>
                    </div>
                    <p className="text-xs text-green-700 mt-1">
                      Descargado {downloadAccess.download_count} {downloadAccess.download_count === 1 ? 'vez' : 'veces'}
                    </p>
                    {downloadAccess.last_downloaded_at && (
                      <p className="text-xs text-green-700 mt-1">
                        Última descarga: {new Date(downloadAccess.last_downloaded_at).toLocaleDateString('es-ES')}
                      </p>
                    )}
                  </div>
                )}

                <YappyDownloadButton
                  cvId={cv.id}
                  cvTitle={cv.title}
                  hasAccess={hasAccess}
                  onSuccess={() => {
                    // Recargar la página para actualizar el estado de acceso
                    window.location.reload()
                  }}
                  onError={(error, details) => {
                    console.error('Error en pago:', error, details)
                  }}
                  onCancel={() => {
                    console.log('Pago cancelado')
                  }}
                />
              </div>

              {/* Help Card */}
              <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">
                  ¿Necesitas ayuda?
                </h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>El pago es único por CV ($2.00 USD)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Una vez pagado, podrás descargar ilimitadamente</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Necesitas tener la app de Yappy instalada</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>El número de Yappy debe tener 8 dígitos</span>
                  </li>
                </ul>
              </div>

              {/* Edit CV Link */}
              {cv.status !== 'ARCHIVED' && (
                <Link href={`/admin/cv-lab/${cv.id}`}>
                  <Button className="w-full" variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    Editar CV
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
