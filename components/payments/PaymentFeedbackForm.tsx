'use client'

import { useState } from 'react'
import { AlertCircle, MessageSquare, Send, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PaymentFeedbackFormProps {
  cvId: string
  paymentId?: string
  onClose?: () => void
  onSubmit?: () => void
}

const FEEDBACK_OPTIONS = [
  { value: 'PAYMENT_PROBLEM', label: 'Tuve problemas al pagar', icon: '⚠️' },
  { value: 'CANCELLED_BY_USER', label: 'Decidí no continuar', icon: '🚫' },
  { value: 'TOO_EXPENSIVE', label: 'Me parece caro', icon: '💰' },
  { value: 'NO_YAPPY', label: 'No tengo Yappy', icon: '📱' },
  { value: 'OTHER', label: 'Otro motivo', icon: '💬' },
]

export function PaymentFeedbackForm({
  cvId,
  paymentId,
  onClose,
  onSubmit,
}: PaymentFeedbackFormProps) {
  const [selectedType, setSelectedType] = useState<string>('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedType) return

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/payments/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cvId,
          paymentId,
          feedbackType: selectedType,
          message: message.trim() || null,
        }),
      })

      if (response.ok) {
        setSubmitted(true)
        onSubmit?.()

        // Auto cerrar después de 2 segundos
        setTimeout(() => {
          onClose?.()
        }, 2000)
      }
    } catch (error) {
      console.error('Error al enviar feedback:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-lg border-2 border-green-200 p-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <MessageSquare className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-green-900 mb-1">
            ¡Gracias por tu feedback!
          </h3>
          <p className="text-sm text-green-700">
            Nos ayudará a mejorar la experiencia de pago
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border-2 border-orange-200 shadow-lg">
      {/* Header */}
      <div className="bg-orange-50 px-6 py-4 border-b border-orange-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-orange-600" />
          <h3 className="font-semibold text-orange-900">
            ¿Tienes problemas para pagar?
          </h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-orange-600 hover:text-orange-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <p className="text-sm text-gray-700 mb-3">
            Cuéntanos qué pasó para poder ayudarte:
          </p>

          <div className="space-y-2">
            {FEEDBACK_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedType === option.value
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="feedbackType"
                  value={option.value}
                  checked={selectedType === option.value}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-4 h-4 text-orange-600"
                />
                <span className="text-xl">{option.icon}</span>
                <span className="text-sm font-medium text-gray-900">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Optional message */}
        {selectedType && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ¿Quieres agregar algo más? (opcional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Cuéntanos más detalles..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {message.length}/500 caracteres
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            disabled={!selectedType || isSubmitting}
            className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Enviar Feedback
              </>
            )}
          </Button>
          {onClose && (
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              disabled={isSubmitting}
            >
              Cerrar
            </Button>
          )}
        </div>

        {/* Help text */}
        <p className="text-xs text-gray-600 text-center pt-2 border-t">
          Tu opinión nos ayuda a mejorar. Responderemos a tu email si dejaste un mensaje.
        </p>
      </form>
    </div>
  )
}
