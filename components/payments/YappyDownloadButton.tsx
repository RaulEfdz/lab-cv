'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Loader2, AlertTriangle, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PaymentFeedbackForm } from './PaymentFeedbackForm'

interface YappyErrorDetails {
  error: string
  code?: string
  details?: string
}

interface YappyDownloadButtonProps {
  cvId: string
  cvTitle: string
  hasAccess: boolean
  onSuccess?: () => void
  onError?: (error: string, details?: YappyErrorDetails) => void
  onCancel?: () => void
  theme?: 'blue' | 'darkBlue' | 'orange' | 'dark' | 'sky' | 'light'
  rounded?: boolean
  disabled?: boolean
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'btn-yappy': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          theme?: string
          rounded?: string
        },
        HTMLElement
      >
    }
  }
}

export function YappyDownloadButton({
  cvId,
  cvTitle,
  hasAccess,
  onSuccess,
  onError,
  onCancel,
  theme = 'orange',
  rounded = true,
  disabled = false,
}: YappyDownloadButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingOrder, setIsCreatingOrder] = useState(false)
  const [isYappyOnline, setIsYappyOnline] = useState<boolean | null>(null)
  const [cdnLoaded, setCdnLoaded] = useState(false)
  const [yappyCheckTimeout, setYappyCheckTimeout] = useState(false)
  const [phone, setPhone] = useState('')
  const [showPhoneInput, setShowPhoneInput] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [lastPaymentId, setLastPaymentId] = useState<string | undefined>()

  // Si ya tiene acceso, descargar directamente
  const handleDirectDownload = () => {
    window.open(`/api/cv-lab/${cvId}/download`, '_blank')
    onSuccess?.()
  }

  // Cargar el CDN del botón de Yappy
  useEffect(() => {
    if (hasAccess) {
      setIsLoading(false)
      return
    }

    const loadYappyCDN = async () => {
      try {
        const configRes = await fetch('/api/payments/yappy/config')
        const config = await configRes.json()

        const existingScript = document.querySelector(
          `script[src="${config.cdnUrl}"]`
        )

        if (existingScript) {
          setCdnLoaded(true)
          setIsLoading(false)
          return
        }

        const script = document.createElement('script')
        script.type = 'module'
        script.src = config.cdnUrl
        script.onload = () => {
          setCdnLoaded(true)
          setIsLoading(false)
        }
        script.onerror = () => {
          setIsLoading(false)
          onError?.('Error al cargar el botón de Yappy')
        }
        document.head.appendChild(script)
      } catch {
        setIsLoading(false)
        onError?.('Error al configurar Yappy')
      }
    }

    loadYappyCDN()
  }, [hasAccess, onError])

  // Configurar eventos del botón una vez cargado
  const handleEventClick = useCallback(async () => {
    console.log('[YappyDownloadButton] Click detected')

    // Validar teléfono
    if (!phone || phone.length !== 8) {
      onError?.('Ingresa tu número de Yappy (8 dígitos)')
      setShowPhoneInput(true)
      return
    }

    const btnYappy = containerRef.current?.querySelector('btn-yappy') as HTMLElement & {
      eventPayment: (params: { transactionId: string; documentName: string; token: string }) => void
      isButtonLoading: boolean
    }

    if (!btnYappy) {
      console.error('[YappyDownloadButton] Button element not found')
      return
    }

    try {
      btnYappy.isButtonLoading = true
      setIsCreatingOrder(true)

      console.log('[YappyDownloadButton] Creating order for CV:', cvId)

      const response = await fetch('/api/payments/yappy/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cvId,
          phone,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        const errorDetails: YappyErrorDetails = {
          error: result.error || 'Error al crear orden',
          code: result.code,
          details: result.details,
        }
        btnYappy.isButtonLoading = false
        setIsCreatingOrder(false)
        onError?.(errorDetails.error, errorDetails)
        return
      }

      if (result.body?.token && result.body?.documentName && result.body?.transactionId) {
        setIsCreatingOrder(false)

        // Guardar payment_id si existe en la respuesta
        if (result.paymentId) {
          setLastPaymentId(result.paymentId)
        }

        btnYappy.eventPayment({
          transactionId: result.body.transactionId,
          documentName: result.body.documentName,
          token: result.body.token,
        })
      } else {
        btnYappy.isButtonLoading = false
        setIsCreatingOrder(false)
        onError?.('Respuesta inválida del servidor', {
          error: 'Respuesta inválida del servidor',
          details: 'La respuesta de Yappy no contiene los datos necesarios',
        })
      }
    } catch (error) {
      const btnYappyEl = containerRef.current?.querySelector('btn-yappy') as HTMLElement & { isButtonLoading: boolean }
      if (btnYappyEl) btnYappyEl.isButtonLoading = false
      setIsCreatingOrder(false)
      onError?.(
        error instanceof Error ? error.message : 'Error al procesar pago',
        { error: 'Error de conexión', details: 'No se pudo conectar con el servidor' }
      )
    }
  }, [cvId, phone, onError])

  useEffect(() => {
    if (!cdnLoaded || !containerRef.current) return

    let setupTimeoutId: NodeJS.Timeout | null = null
    let isSetup = false

    const handlers = {
      isYappyOnline: ((event: CustomEvent) => {
        const isOnline = event.detail === true || event.detail === 'true'
        setIsYappyOnline(isOnline)
      }) as EventListener,
      eventClick: (() => {
        handleEventClick()
      }) as EventListener,
      eventSuccess: ((event: CustomEvent) => {
        console.log('[YappyDownloadButton] Payment success:', event.detail)
        onSuccess?.()
      }) as EventListener,
      eventError: ((event: CustomEvent) => {
        onError?.(event.detail?.message || 'Error en la transacción')
      }) as EventListener,
      eventCancel: (() => {
        console.log('[YappyDownloadButton] Payment cancelled')
        setShowFeedback(true)
        onCancel?.()
      }) as EventListener,
    }

    const setupButton = () => {
      if (isSetup) return

      const btnYappy = containerRef.current?.querySelector('btn-yappy') as HTMLElement & {
        addEventListener: (event: string, handler: EventListener) => void
        removeEventListener: (event: string, handler: EventListener) => void
      }

      if (!btnYappy) {
        setupTimeoutId = setTimeout(setupButton, 100)
        return
      }

      if ((btnYappy as HTMLElement & { _yappyListenersSetup?: boolean })._yappyListenersSetup) {
        return
      }

      btnYappy.addEventListener('isYappyOnline', handlers.isYappyOnline)
      btnYappy.addEventListener('eventClick', handlers.eventClick)
      btnYappy.addEventListener('eventSuccess', handlers.eventSuccess)
      btnYappy.addEventListener('eventError', handlers.eventError)
      btnYappy.addEventListener('eventCancel', handlers.eventCancel)

      ; (btnYappy as HTMLElement & { _yappyListenersSetup?: boolean })._yappyListenersSetup = true
      isSetup = true
    }

    setupButton()

    const timeoutId = setTimeout(() => {
      setYappyCheckTimeout(prev => {
        if (isYappyOnline === null) {
          return true
        }
        return prev
      })
    }, 5000)

    return () => {
      if (setupTimeoutId) clearTimeout(setupTimeoutId)
      clearTimeout(timeoutId)

      const btnYappy = containerRef.current?.querySelector('btn-yappy') as HTMLElement & {
        removeEventListener: (event: string, handler: EventListener) => void
        _yappyListenersSetup?: boolean
      }
      if (btnYappy && btnYappy._yappyListenersSetup) {
        btnYappy.removeEventListener('isYappyOnline', handlers.isYappyOnline)
        btnYappy.removeEventListener('eventClick', handlers.eventClick)
        btnYappy.removeEventListener('eventSuccess', handlers.eventSuccess)
        btnYappy.removeEventListener('eventError', handlers.eventError)
        btnYappy.removeEventListener('eventCancel', handlers.eventCancel)
        btnYappy._yappyListenersSetup = false
      }
    }
  }, [cdnLoaded, handleEventClick, onSuccess, onError, onCancel, isYappyOnline])

  // Si ya tiene acceso, mostrar botón de descarga directa
  if (hasAccess) {
    return (
      <Button
        onClick={handleDirectDownload}
        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
        disabled={disabled}
      >
        <Download className="w-4 h-4 mr-2" />
        Descargar CV
      </Button>
    )
  }

  const showLoading = isLoading
  const showVerifying = cdnLoaded && isYappyOnline === null && !yappyCheckTimeout
  const showOffline = cdnLoaded && (isYappyOnline === false || (isYappyOnline === null && yappyCheckTimeout))
  const showButton = cdnLoaded && isYappyOnline === true

  return (
    <div className="space-y-4">
      {/* Input de teléfono */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Número de Yappy (8 dígitos)
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, '').slice(0, 8)
            setPhone(value)
            if (value.length === 8) {
              setShowPhoneInput(false)
            }
          }}
          placeholder="6000-0000"
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
            showPhoneInput && phone.length !== 8 ? 'border-red-500' : 'border-gray-300'
          }`}
          maxLength={8}
        />
        {phone.length > 0 && phone.length < 8 && (
          <p className="text-xs text-gray-500">
            {8 - phone.length} dígitos restantes
          </p>
        )}
        {phone.length === 8 && (
          <p className="text-xs text-green-600">✓ Número válido</p>
        )}
      </div>

      {/* Botón de Yappy */}
      <div ref={containerRef} className="yappy-button-container relative">
        {showLoading && (
          <div className="flex items-center justify-center p-4 border border-gray-200 rounded-lg">
            <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
            <span className="ml-2 text-sm text-gray-600">
              Cargando Yappy...
            </span>
          </div>
        )}

        {showVerifying && (
          <div className="flex items-center justify-center p-4 border border-gray-200 rounded-lg">
            <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
            <span className="ml-2 text-sm text-gray-600">
              Verificando disponibilidad de Yappy...
            </span>
          </div>
        )}

        {showOffline && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-yellow-900">
                  Yappy no disponible
                </p>
                <p className="text-sm text-yellow-700">
                  El servicio de Yappy no está disponible en este momento. Intenta más tarde.
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  {isYappyOnline === false ? 'Estado: Servicio offline' : 'Estado: Sin respuesta del servicio'}
                </p>
              </div>
            </div>
          </div>
        )}

        {isCreatingOrder && (
          <div className="absolute inset-0 bg-white/80 rounded-lg flex items-center justify-center z-10">
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
              <span className="text-sm text-gray-700">Creando orden...</span>
            </div>
          </div>
        )}

        <div style={{
          visibility: showButton ? 'visible' : 'hidden',
          position: showButton ? 'relative' : 'absolute',
          height: showButton ? 'auto' : 0,
          overflow: showButton ? 'visible' : 'hidden',
          opacity: (disabled || phone.length !== 8) ? 0.5 : 1,
          pointerEvents: (disabled || !showButton || phone.length !== 8) ? 'none' : 'auto',
        }}>
          {/* @ts-ignore - Yappy Web Component */}
          <btn-yappy
            theme={theme}
            rounded={rounded ? 'true' : 'false'}
          />
        </div>
      </div>

      {/* Información del precio */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-900">
              Descarga tu CV: {cvTitle}
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Pago único • Descargas ilimitadas
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-blue-900">$2.00</p>
            <p className="text-xs text-blue-700">USD</p>
          </div>
        </div>
      </div>

      {/* Formulario de feedback */}
      {showFeedback && (
        <div className="mt-4">
          <PaymentFeedbackForm
            cvId={cvId}
            paymentId={lastPaymentId}
            onClose={() => setShowFeedback(false)}
            onSubmit={() => {
              console.log('Feedback enviado')
            }}
          />
        </div>
      )}
    </div>
  )
}
