import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminPageWrapper } from '@/components/admin/admin-page-wrapper'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  FileText,
  MessageSquare,
  DollarSign,
  TrendingUp,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react'

export default async function AdminAnalyticsPage() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/admin/login')
  }

  // Verificar admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/admin/login')
  }

  // ========================================
  // OBTENER TODOS LOS DATOS
  // ========================================

  // 1. USUARIOS
  const { data: allProfiles, count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  const usersThisMonth = allProfiles?.filter(p => {
    const created = new Date(p.created_at)
    const now = new Date()
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
  }).length || 0

  // 2. CVs
  const { data: allCVs, count: totalCVs } = await supabase
    .from('cv_lab_cvs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  const cvsThisMonth = allCVs?.filter(cv => {
    const created = new Date(cv.created_at)
    const now = new Date()
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
  }).length || 0

  const avgReadiness = allCVs?.reduce((sum, cv) => sum + (cv.readiness_score || 0), 0) / (totalCVs || 1)

  // 3. MENSAJES (Interacciones con OCTAVIA) Y COSTOS
  const { data: allMessages } = await supabase
    .from('cv_lab_messages')
    .select('*, cv_lab_cvs!inner(user_id)')

  const totalMessages = allMessages?.length || 0
  const userMessages = allMessages?.filter(m => m.role === 'user').length || 0
  const assistantMessages = allMessages?.filter(m => m.role === 'assistant').length || 0

  // Calcular costos de IA (GPT-5-mini pricing aproximado)
  // Input: $0.15 per 1M tokens
  // Output: $0.60 per 1M tokens
  const totalTokensIn = allMessages?.reduce((sum, m) => sum + (m.tokens_in || 0), 0) || 0
  const totalTokensOut = allMessages?.reduce((sum, m) => sum + (m.tokens_out || 0), 0) || 0

  const costPerMillionInput = 0.15
  const costPerMillionOutput = 0.60

  const totalInputCost = (totalTokensIn / 1_000_000) * costPerMillionInput
  const totalOutputCost = (totalTokensOut / 1_000_000) * costPerMillionOutput
  const totalAICost = totalInputCost + totalOutputCost

  // Costo promedio por CV
  const avgCostPerCV = totalCVs > 0 ? totalAICost / totalCVs : 0

  // Costo promedio por usuario
  const avgCostPerUser = totalUsers > 0 ? totalAICost / totalUsers : 0

  // Calcular costo por usuario (agrupado)
  const costPerUser = allMessages?.reduce((acc, m) => {
    const userId = m.cv_lab_cvs?.user_id
    if (!userId) return acc

    if (!acc[userId]) {
      acc[userId] = { tokensIn: 0, tokensOut: 0, cost: 0 }
    }

    acc[userId].tokensIn += m.tokens_in || 0
    acc[userId].tokensOut += m.tokens_out || 0

    const inputCost = ((m.tokens_in || 0) / 1_000_000) * costPerMillionInput
    const outputCost = ((m.tokens_out || 0) / 1_000_000) * costPerMillionOutput
    acc[userId].cost += inputCost + outputCost

    return acc
  }, {} as Record<string, { tokensIn: number; tokensOut: number; cost: number }>) || {}

  // 4. PAGOS
  const { data: allPayments, count: totalPayments } = await supabase
    .from('payments')
    .select('*, profiles!payments_user_id_fkey(email, full_name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(100)

  const completedPayments = allPayments?.filter(p => p.status === 'COMPLETED').length || 0
  const pendingPayments = allPayments?.filter(p => p.status === 'PENDING').length || 0
  const failedPayments = allPayments?.filter(p => p.status === 'FAILED').length || 0

  const totalRevenue = allPayments
    ?.filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0) || 0

  // 5. TOP USUARIOS (más CVs creados y más costosos)
  const userCVCounts = allCVs?.reduce((acc, cv) => {
    acc[cv.user_id] = (acc[cv.user_id] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  const topUsers = allProfiles
    ?.map(p => ({
      ...p,
      cv_count: userCVCounts[p.id] || 0,
      ai_cost: costPerUser[p.id]?.cost || 0,
      tokens_used: (costPerUser[p.id]?.tokensIn || 0) + (costPerUser[p.id]?.tokensOut || 0)
    }))
    .sort((a, b) => b.cv_count - a.cv_count)
    .slice(0, 10)

  // Top 10 usuarios por costo
  const topUsersByCost = allProfiles
    ?.map(p => ({
      ...p,
      cv_count: userCVCounts[p.id] || 0,
      ai_cost: costPerUser[p.id]?.cost || 0,
      tokens_used: (costPerUser[p.id]?.tokensIn || 0) + (costPerUser[p.id]?.tokensOut || 0)
    }))
    .filter(u => u.ai_cost > 0)
    .sort((a, b) => b.ai_cost - a.ai_cost)
    .slice(0, 10)

  return (
    <AdminPageWrapper>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">Analytics & Datos</h1>
          <p className="text-neutral-500 mt-1">Vista completa del sistema</p>
        </div>

        {/* KPIs Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {/* Total Usuarios */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-blue-600" />
              <Badge variant="secondary">+{usersThisMonth} este mes</Badge>
            </div>
            <div className="text-3xl font-bold text-neutral-900">{totalUsers || 0}</div>
            <div className="text-sm text-neutral-500 mt-1">Usuarios Totales</div>
          </div>

          {/* Total CVs */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <FileText className="w-8 h-8 text-orange-600" />
              <Badge variant="secondary">+{cvsThisMonth} este mes</Badge>
            </div>
            <div className="text-3xl font-bold text-neutral-900">{totalCVs || 0}</div>
            <div className="text-sm text-neutral-500 mt-1">CVs Creados</div>
          </div>

          {/* Interacciones */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <MessageSquare className="w-8 h-8 text-purple-600" />
              <Badge variant="secondary">{userMessages} de usuarios</Badge>
            </div>
            <div className="text-3xl font-bold text-neutral-900">{totalMessages || 0}</div>
            <div className="text-sm text-neutral-500 mt-1">Mensajes Totales</div>
          </div>

          {/* Ingresos */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-8 h-8 text-green-600" />
              <Badge className="bg-green-500">{completedPayments} completados</Badge>
            </div>
            <div className="text-3xl font-bold text-neutral-900">${totalRevenue.toFixed(2)}</div>
            <div className="text-sm text-neutral-500 mt-1">Ingresos Totales</div>
          </div>

          {/* Costo de IA */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <Sparkles className="w-8 h-8 text-purple-600" />
              <Badge variant="secondary">${avgCostPerCV.toFixed(4)}/CV</Badge>
            </div>
            <div className="text-3xl font-bold text-neutral-900">${totalAICost.toFixed(2)}</div>
            <div className="text-sm text-neutral-500 mt-1">Costo Total IA</div>
          </div>
        </div>

        {/* Readiness Score Promedio */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-5xl font-bold">{avgReadiness?.toFixed(1) || 0}</div>
              <div className="text-orange-100 mt-2">Readiness Score Promedio</div>
            </div>
            <TrendingUp className="w-16 h-16 text-orange-200" />
          </div>
        </div>

        {/* Dos Columnas */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Estado de Pagos */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Estado de Pagos
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-900">Completados</span>
                </div>
                <span className="text-2xl font-bold text-green-600">{completedPayments}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  <span className="font-medium text-yellow-900">Pendientes</span>
                </div>
                <span className="text-2xl font-bold text-yellow-600">{pendingPayments}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="font-medium text-red-900">Fallidos</span>
                </div>
                <span className="text-2xl font-bold text-red-600">{failedPayments}</span>
              </div>
            </div>
          </div>

          {/* Top 10 Usuarios */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Top 10 Usuarios (por CVs)
            </h2>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {topUsers?.map((user, idx) => (
                <div key={user.id} className="flex items-center justify-between p-2 hover:bg-neutral-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-neutral-200 rounded-full flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{user.full_name || 'Sin nombre'}</div>
                      <div className="text-xs text-neutral-500">{user.email}</div>
                      {user.ai_cost > 0 && (
                        <div className="text-xs text-purple-600 font-mono">
                          ${user.ai_cost.toFixed(4)} IA
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="outline">{user.cv_count} CVs</Badge>
                    {user.tokens_used > 0 && (
                      <span className="text-xs text-neutral-500 font-mono">
                        {(user.tokens_used / 1000).toFixed(1)}K tokens
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Métricas de IA */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Desglose de Costos de IA */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Costos de IA (OpenAI)
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-purple-900">Tokens de Entrada</span>
                  <span className="text-xl font-bold text-purple-600">
                    {(totalTokensIn / 1000).toFixed(1)}K
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-purple-700">$0.15 por 1M tokens</span>
                  <span className="text-sm font-mono text-purple-900">
                    ${totalInputCost.toFixed(4)}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-indigo-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-indigo-900">Tokens de Salida</span>
                  <span className="text-xl font-bold text-indigo-600">
                    {(totalTokensOut / 1000).toFixed(1)}K
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-indigo-700">$0.60 por 1M tokens</span>
                  <span className="text-sm font-mono text-indigo-900">
                    ${totalOutputCost.toFixed(4)}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm opacity-90">Costo Total</div>
                    <div className="text-3xl font-bold">${totalAICost.toFixed(2)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs opacity-90">Promedio/Usuario</div>
                    <div className="text-lg font-bold">${avgCostPerUser.toFixed(4)}</div>
                    <div className="text-xs opacity-90 mt-1">Promedio/CV</div>
                    <div className="text-lg font-bold">${avgCostPerCV.toFixed(4)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top 10 Usuarios por Costo de IA */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-purple-600" />
              Top 10 Usuarios (por costo IA)
            </h2>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {topUsersByCost?.map((user, idx) => (
                <div key={user.id} className="flex items-center justify-between p-2 hover:bg-neutral-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-xs font-bold text-purple-600">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{user.full_name || 'Sin nombre'}</div>
                      <div className="text-xs text-neutral-500">{user.email}</div>
                      <div className="text-xs text-purple-600 font-mono mt-0.5">
                        {(user.tokens_used / 1000).toFixed(1)}K tokens
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge className="bg-purple-500">${user.ai_cost.toFixed(4)}</Badge>
                    <span className="text-xs text-neutral-500">
                      {user.cv_count} CVs
                    </span>
                  </div>
                </div>
              ))}
              {(!topUsersByCost || topUsersByCost.length === 0) && (
                <div className="text-center py-8 text-neutral-500">
                  No hay datos de costos aún
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Últimos Pagos */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Últimos Pagos (100 recientes)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-3 px-4 font-medium text-neutral-700">Usuario</th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-700">Monto</th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-700">Estado</th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-700">Order ID</th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-700">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {allPayments?.slice(0, 20).map((payment) => (
                  <tr key={payment.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="py-3 px-4">
                      <div className="text-sm font-medium">{payment.profiles?.full_name || 'Sin nombre'}</div>
                      <div className="text-xs text-neutral-500">{payment.profiles?.email}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-sm">${payment.amount}</td>
                    <td className="py-3 px-4">
                      <Badge
                        className={
                          payment.status === 'COMPLETED' ? 'bg-green-500' :
                          payment.status === 'PENDING' ? 'bg-yellow-500' :
                          payment.status === 'FAILED' ? 'bg-red-500' :
                          'bg-neutral-500'
                        }
                      >
                        {payment.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">{payment.external_id || 'N/A'}</td>
                    <td className="py-3 px-4 text-sm text-neutral-600">
                      {new Date(payment.created_at).toLocaleDateString('es-ES')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminPageWrapper>
  )
}
