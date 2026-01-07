import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PaymentsTable } from '@/components/admin/PaymentsTable'
import { PaymentFeedbackList } from '@/components/admin/PaymentFeedbackList'
import { TrendingDown, TrendingUp } from 'lucide-react'

export default async function AdminPaymentsPage() {
  const supabase = await createClient()

  // Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Verificar que es admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard')
  }

  // Obtener estadísticas de pagos
  const { data: payments } = await supabase
    .from('payments')
    .select('status, amount, created_at')

  const stats = {
    total: payments?.length || 0,
    completed: payments?.filter(p => p.status === 'COMPLETED').length || 0,
    pending: payments?.filter(p => p.status === 'PENDING').length || 0,
    failed: payments?.filter(p => p.status === 'FAILED').length || 0,
    cancelled: payments?.filter(p => p.status === 'CANCELLED').length || 0,
    expired: payments?.filter(p => p.status === 'EXPIRED').length || 0,
    totalRevenue: payments
      ?.filter(p => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0) || 0,
  }

  // Calcular métricas de conversión
  const initiated = (stats.completed + stats.failed + stats.cancelled + stats.pending) || 1
  const conversionRate = ((stats.completed / initiated) * 100).toFixed(1)
  const abandonmentRate = (((stats.cancelled + stats.failed) / initiated) * 100).toFixed(1)

  // Obtener feedback de usuarios
  const { data: feedbackData } = await supabase
    .from('payment_feedback')
    .select('feedback_type, message, created_at, profiles:user_id(email, full_name), cv_lab_cvs:cv_id(title)')
    .order('created_at', { ascending: false })
    .limit(20)

  const feedbackStats = {
    total: feedbackData?.length || 0,
    byType: {
      PAYMENT_PROBLEM: feedbackData?.filter(f => f.feedback_type === 'PAYMENT_PROBLEM').length || 0,
      CANCELLED_BY_USER: feedbackData?.filter(f => f.feedback_type === 'CANCELLED_BY_USER').length || 0,
      TOO_EXPENSIVE: feedbackData?.filter(f => f.feedback_type === 'TOO_EXPENSIVE').length || 0,
      NO_YAPPY: feedbackData?.filter(f => f.feedback_type === 'NO_YAPPY').length || 0,
      OTHER: feedbackData?.filter(f => f.feedback_type === 'OTHER').length || 0,
    },
    recent: feedbackData || [],
  }

  // Obtener pagos recientes con detalles
  const { data: recentPayments } = await supabase
    .from('payments')
    .select(`
      *,
      profiles:user_id(id, email, full_name),
      cv_lab_cvs:cv_id(id, title, target_role)
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Historial de Pagos</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona y visualiza todos los pagos de la plataforma
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <StatCard
          title="Total Pagos"
          value={stats.total}
          variant="default"
        />
        <StatCard
          title="Completados"
          value={stats.completed}
          variant="success"
        />
        <StatCard
          title="Pendientes"
          value={stats.pending}
          variant="warning"
        />
        <StatCard
          title="Fallidos/Cancelados"
          value={stats.failed + stats.cancelled}
          variant="error"
        />
        <StatCard
          title="Ingresos Totales"
          value={`$${stats.totalRevenue.toFixed(2)}`}
          variant="primary"
        />
      </div>

      {/* Métricas de Conversión */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-green-900">Tasa de Conversión</h3>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-4xl font-bold text-green-900">{conversionRate}%</p>
          <p className="text-sm text-green-700 mt-2">
            {stats.completed} de {initiated} intentos de pago completados
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-orange-900">Tasa de Abandono</h3>
            <TrendingDown className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-4xl font-bold text-orange-900">{abandonmentRate}%</p>
          <p className="text-sm text-orange-700 mt-2">
            {stats.failed + stats.cancelled} usuarios abandonaron o fallaron
          </p>
        </div>
      </div>

      {/* Feedback de Usuarios */}
      {feedbackStats.total > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Feedback de Usuarios</h2>
          <PaymentFeedbackList feedbackStats={feedbackStats} />
        </div>
      )}

      {/* Tabla de pagos */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Historial de Transacciones</h2>
        <div className="bg-white rounded-lg border">
          <PaymentsTable initialPayments={recentPayments || []} />
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  variant = 'default',
}: {
  title: string
  value: string | number
  variant?: 'default' | 'success' | 'warning' | 'error' | 'primary'
}) {
  const variantStyles = {
    default: 'bg-gray-50 border-gray-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    error: 'bg-red-50 border-red-200',
    primary: 'bg-blue-50 border-blue-200',
  }

  const textStyles = {
    default: 'text-gray-900',
    success: 'text-green-900',
    warning: 'text-yellow-900',
    error: 'text-red-900',
    primary: 'text-blue-900',
  }

  return (
    <div className={`p-6 rounded-lg border ${variantStyles[variant]}`}>
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className={`text-3xl font-bold mt-2 ${textStyles[variant]}`}>
        {value}
      </p>
    </div>
  )
}
