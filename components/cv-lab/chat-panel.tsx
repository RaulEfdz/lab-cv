'use client'

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { ChatMessage } from './chat-message'
import { ChatInput } from './chat-input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'

// Play notification sound using Web Audio API
const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 800
    oscillator.type = 'sine'
    gainNode.gain.value = 0.1

    oscillator.start()
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15)
    oscillator.stop(audioContext.currentTime + 0.15)
  } catch { }
}
import type { CvLabMessage, CvJson } from '@/lib/types/cv-lab'

interface ChatPanelProps {
  cvId: string
  messages: CvLabMessage[]
  currentCvJson: CvJson | null
  onNewMessage: (message: CvLabMessage) => void
  onCvUpdate: (cvJson: CvJson, readinessScore: number) => void
}

export interface ChatPanelRef {
  sendMessage: (content: string) => void
}

export const ChatPanel = forwardRef<ChatPanelRef, ChatPanelProps>(function ChatPanel({
  cvId,
  messages,
  currentCvJson,
  onNewMessage,
  onCvUpdate
}, ref) {
  const [isSending, setIsSending] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  // Send message and handle streaming response
  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isSending) return

    // Add user message optimistically
    const userMessage: CvLabMessage = {
      id: `temp-${Date.now()}`,
      cv_id: cvId,
      role: 'user',
      content: content.trim(),
      tokens_in: 0,
      tokens_out: 0,
      created_at: new Date().toISOString()
    }
    onNewMessage(userMessage)

    setIsSending(true)
    setStreamingContent('')

    try {
      const response = await fetch(`/api/cv-lab/${cvId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content.trim() })
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error('API Error Response:', response.status, errorData)
        throw new Error(`Error ${response.status}: ${errorData}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No se pudo leer la respuesta')
      }

      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)

              if (parsed.type === 'text') {
                fullContent += parsed.content
                setStreamingContent(fullContent)
              } else if (parsed.type === 'cv_update') {
                // CV was updated
                if (parsed.updatedCvJson) {
                  onCvUpdate(parsed.updatedCvJson, parsed.cvUpdate?.readinessScore || 0)

                  // Show success toast with animation
                  const section = parsed.cvUpdate?.section
                  const feedback = parsed.cvUpdate?.feedback || 'CV actualizado'
                  const score = parsed.cvUpdate?.readinessScore || 0

                  // Play sound
                  playNotificationSound()

                  // Show compact toast
                  toast.success('CV Actualizado', {
                    description: `Score: ${score}/100`,
                    duration: 4000,
                    dismissible: true,
                  })
                }
              } else if (parsed.type === 'done') {
                // Add assistant message
                const assistantMessage: CvLabMessage = {
                  id: parsed.messageId || `assistant-${Date.now()}`,
                  cv_id: cvId,
                  role: 'assistant',
                  content: fullContent,
                  tokens_in: parsed.tokensIn || 0,
                  tokens_out: parsed.tokensOut || 0,
                  created_at: new Date().toISOString()
                }
                onNewMessage(assistantMessage)
                setStreamingContent('')
              } else if (parsed.type === 'error') {
                console.error('Chat error:', parsed.error)
              }
            } catch {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
      // Add error message
      const errorMessage: CvLabMessage = {
        id: `error-${Date.now()}`,
        cv_id: cvId,
        role: 'assistant',
        content: 'Lo siento, hubo un error procesando tu mensaje. Por favor intenta de nuevo.',
        tokens_in: 0,
        tokens_out: 0,
        created_at: new Date().toISOString()
      }
      onNewMessage(errorMessage)
      setStreamingContent('')
    } finally {
      setIsSending(false)
    }
  }

  // Expose sendMessage to parent via ref
  useImperativeHandle(ref, () => ({
    sendMessage: handleSendMessage
  }), [handleSendMessage])

  // Filter out system messages for display
  const displayMessages = messages.filter(m => m.role !== 'system')

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Messages area with scroll */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {displayMessages.length === 0 && !streamingContent && (
              <div className="text-center py-8 text-neutral-500">
                <p className="text-lg mb-2">Bienvenido al CV Lab</p>
                <p className="text-sm">
                  Escribe un mensaje para comenzar a crear tu CV con ayuda de IA.
                </p>
              </div>
            )}

            {displayMessages.map((message, index) => {
              // Find the last assistant message
              const lastAssistantIndex = displayMessages.map((m, i) => m.role === 'assistant' ? i : -1).filter(i => i !== -1).pop()
              const isLastAssistantMessage = message.role === 'assistant' && index === lastAssistantIndex

              return (
                <ChatMessage
                  key={message.id}
                  message={message}
                  cvId={cvId}
                  isLastMessage={isLastAssistantMessage}
                />
              )
            })}

            {/* Streaming message */}
            {streamingContent && (
              <ChatMessage
                message={{
                  id: 'streaming',
                  cv_id: cvId,
                  role: 'assistant',
                  content: streamingContent,
                  tokens_in: 0,
                  tokens_out: 0,
                  created_at: new Date().toISOString()
                }}
                cvId={cvId}
                isStreaming
              />
            )}

            {/* Loading indicator */}
            {isSending && !streamingContent && (
              <div className="px-3 py-2 rounded-2xl rounded-bl-md bg-[#F5F5F5] max-w-[85%] mr-auto">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Input area */}
      <div className="flex-none border-t bg-white p-4">
        <ChatInput
          onSend={handleSendMessage}
          disabled={isSending}
          cvId={cvId}
        />
      </div>
    </div>
  )
})
