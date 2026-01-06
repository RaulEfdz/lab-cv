'use client'

import { cn } from '@/lib/utils'
import { MessageFeedback } from './message-feedback'
import type { CvLabMessage } from '@/lib/types/cv-lab'

interface ChatMessageProps {
  message: CvLabMessage
  cvId: string
  isStreaming?: boolean
  isLastMessage?: boolean
}

export function ChatMessage({ message, cvId, isStreaming, isLastMessage }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'

  // Format the message content
  const formatContent = (content: string) => {
    // Remove cv_update blocks from display
    let cleanContent = content.replace(/```cv_update[\s\S]*?```/g, '').trim()
    cleanContent = cleanContent.replace(/```json\s*\{[\s\S]*?"section"[\s\S]*?\}```/g, '').trim()
    cleanContent = cleanContent.replace(/\{\s*"section"\s*:[\s\S]*?"action"\s*:[\s\S]*?\}/g, '').trim()

    if (!cleanContent || cleanContent.length < 3) {
      return 'CV actualizado.'
    }

    // Simple markdown-like formatting - colors inherit from parent
    return cleanContent
      .split('\n')
      .map((line, i) => {
        if (line.startsWith('## ')) {
          return <p key={i} className="font-semibold mt-2 mb-1">{line.slice(3)}</p>
        }
        if (line.startsWith('### ')) {
          return <p key={i} className="font-medium mt-1.5 mb-0.5">{line.slice(4)}</p>
        }
        if (line.includes('**')) {
          const parts = line.split(/\*\*(.*?)\*\*/g)
          return (
            <p key={i} className="mb-1">
              {parts.map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)}
            </p>
          )
        }
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return <p key={i} className="mb-0.5 pl-3">• {line.slice(2)}</p>
        }
        if (line.match(/^\d+\. /)) {
          return <p key={i} className="mb-0.5 pl-3">{line}</p>
        }
        if (!line.trim()) {
          return <div key={i} className="h-1.5" />
        }
        return <p key={i} className="mb-1">{line}</p>
      })
  }

  return (
    <div
      className={cn(
        'px-3 py-2 rounded-2xl max-w-[85%]',
        isUser
          ? 'bg-[#F67300] text-white ml-auto rounded-br-md'
          : 'bg-[#F5F5F5] text-[#0A0A0A] mr-auto rounded-bl-md',
        isStreaming && 'opacity-80'
      )}
    >
      <div className="text-sm leading-relaxed">
        {formatContent(message.content)}
        {isStreaming && (
          <span className="inline-block w-1 h-3.5 bg-current opacity-60 animate-pulse ml-0.5 rounded-sm" />
        )}
      </div>

      {/* Feedback UI only for the last assistant message (not while streaming) */}
      {isAssistant && isLastMessage && !isStreaming && !message.id.includes('temp-') && !message.id.includes('assistant-') && (
        <div className="mt-1.5">
          <MessageFeedback
            messageId={message.id}
            cvId={cvId}
          />
        </div>
      )}
    </div>
  )
}
