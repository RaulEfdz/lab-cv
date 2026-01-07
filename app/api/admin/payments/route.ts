import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/admin/payments
 * Obtiene el historial de pagos (solo admins)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar autenticación y rol de admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Verificar que el usuario es admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'No tienes permisos de administrador' },
        { status: 403 }
      )
    }

    // Obtener parámetros de query
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')
    const cvId = searchParams.get('cvId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Construir query
    let query = supabase
      .from('payments')
      .select(`
        *,
        profiles:user_id(id, email, full_name),
        cv_lab_cvs:cv_id(id, title, target_role)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    // Aplicar filtros
    if (status) query = query.eq('status', status)
    if (userId) query = query.eq('user_id', userId)
    if (cvId) query = query.eq('cv_id', cvId)

    // Aplicar paginación
    query = query.range(offset, offset + limit - 1)

    const { data: payments, error, count } = await query

    if (error) {
      console.error('Error fetching payments:', error)
      return NextResponse.json(
        { error: 'Error obteniendo pagos' },
        { status: 500 }
      )
    }

    // Calcular estadísticas de pagos
    const { data: stats } = await supabase
      .from('payments')
      .select('status, amount')

    const statistics = {
      total: count || 0,
      completed: stats?.filter(p => p.status === 'COMPLETED').length || 0,
      pending: stats?.filter(p => p.status === 'PENDING').length || 0,
      failed: stats?.filter(p => p.status === 'FAILED').length || 0,
      cancelled: stats?.filter(p => p.status === 'CANCELLED').length || 0,
      expired: stats?.filter(p => p.status === 'EXPIRED').length || 0,
      totalRevenue: stats
        ?.filter(p => p.status === 'COMPLETED')
        .reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0) || 0,
    }

    // Calcular tasa de conversión
    const initiated = (statistics.completed + statistics.failed + statistics.cancelled + statistics.pending) || 1
    const conversionRate = ((statistics.completed / initiated) * 100).toFixed(2)
    const abandonmentRate = (((statistics.cancelled + statistics.failed) / initiated) * 100).toFixed(2)

    // Obtener feedback de pagos
    const { data: feedbackData } = await supabase
      .from('payment_feedback')
      .select('feedback_type, message, created_at, profiles:user_id(email, full_name), cv_lab_cvs:cv_id(title)')
      .order('created_at', { ascending: false })
      .limit(20)

    // Agrupar feedback por tipo
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

    return NextResponse.json({
      payments: payments || [],
      total: count || 0,
      statistics: {
        ...statistics,
        conversionRate: parseFloat(conversionRate),
        abandonmentRate: parseFloat(abandonmentRate),
      },
      feedback: feedbackStats,
      pagination: {
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/admin/payments:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
