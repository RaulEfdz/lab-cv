'use client'

import { MessageSquare, AlertCircle, Ban, DollarSign, Smartphone, MessageCircle } from 'lucide-react'

interface FeedbackItem {
  feedback_type: string
  message: string | null
  created_at: string
  profiles: { email: string; full_name: string | null } | null
  cv_lab_cvs: { title: string } | null
}

interface PaymentFeedbackListProps {
  feedbackStats: {
    total: number
    byType: {
      PAYMENT_PROBLEM: number
      CANCELLED_BY_USER: number
      TOO_EXPENSIVE: number
      NO_YAPPY: number
      OTHER: number
    }
    recent: FeedbackItem[]
  }
}

const FEEDBACK_CONFIG = {
  PAYMENT_PROBLEM: {
    label: 'Problemas al pagar',
    icon: AlertCircle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    emoji: '⚠️',
  },
  CANCELLED_BY_USER: {
    label: 'Decidió no continuar',
    icon: Ban,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    emoji: '🚫',
  },
  TOO_EXPENSIVE: {
    label: 'Considera que es caro',
    icon: DollarSign,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    emoji: '💰',
  },
  NO_YAPPY: {
    label: 'No tiene Yappy',
    icon: Smartphone,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    emoji: '📱',
  },
  OTHER: {
    label: 'Otro motivo',
    icon: MessageCircle,
    color: 'text-gray-600',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    emoji: '💬',
  },
}

export function PaymentFeedbackList({ feedbackStats }: PaymentFeedbackListProps) {
  if (feedbackStats.total === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
        <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-600">No hay feedback de usuarios aún</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas por tipo */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(feedbackStats.byType).map(([type, count]) => {
          const config = FEEDBACK_CONFIG[type as keyof typeof FEEDBACK_CONFIG]
          const Icon = config.icon

          return (
            <div
              key={type}
              className={`${config.bg} ${config.border} border rounded-lg p-4`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{config.emoji}</span>
                <Icon className={`w-5 h-5 ${config.color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <p className={`text-xs ${config.color} font-medium mt-1`}>
                {config.label}
              </p>
            </div>
          )
        })}
      </div>

      {/* Lista de feedback reciente */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Feedback Reciente
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Últimos {feedbackStats.recent.length} comentarios de usuarios
          </p>
        </div>

        <div className="divide-y divide-gray-100">
          {feedbackStats.recent.map((feedback, index) => {
            const config = FEEDBACK_CONFIG[feedback.feedback_type as keyof typeof FEEDBACK_CONFIG]
            const Icon = config.icon

            return (
              <div
                key={index}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`${config.bg} ${config.border} border rounded-lg p-3 shrink-0`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-sm font-medium ${config.color}`}>
                            {config.label}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-600">
                            {new Date(feedback.created_at).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900">
                          {feedback.profiles?.full_name || feedback.profiles?.email || 'Usuario'}
                        </p>
                        <p className="text-xs text-gray-500">
                          CV: {feedback.cv_lab_cvs?.title || 'Desconocido'}
                        </p>
                      </div>
                    </div>

                    {/* Message */}
                    {feedback.message && (
                      <div className="mt-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="text-sm text-gray-700 italic">
                          &quot;{feedback.message}&quot;
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
