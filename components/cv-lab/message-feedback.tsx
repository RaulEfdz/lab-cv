'use client'

import { useState, useEffect } from 'react'
import { ThumbsUp, ThumbsDown, MessageSquare, X, Check, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { FeedbackTag, FeedbackSubmission } from '@/lib/types/cv-lab'

interface MessageFeedbackProps {
  messageId: string
  cvId: string
  onFeedbackSubmit?: (feedback: FeedbackSubmission) => void
}

const FEEDBACK_TAGS: { value: FeedbackTag; label: string; isPositive: boolean }[] = [
  { value: 'helpful', label: 'Útil', isPositive: true },
  { value: 'good_metrics', label: 'Pidió métricas', isPositive: true },
  { value: 'good_format', label: 'Buen formato', isPositive: true },
  { value: 'accurate', label: 'Preciso', isPositive: true },
  { value: 'not_helpful', label: 'No útil', isPositive: false },
  { value: 'too_verbose', label: 'Muy largo', isPositive: false },
  { value: 'invented_data', label: 'Inventó datos', isPositive: false },
  { value: 'inaccurate', label: 'Impreciso', isPositive: false },
]

export function MessageFeedback({ messageId, cvId, onFeedbackSubmit }: MessageFeedbackProps) {
  const [mounted, setMounted] = useState(false)
  const [rating, setRating] = useState<number | null>(null)
  const [selectedTags, setSelectedTags] = useState<FeedbackTag[]>([])
  const [comment, setComment] = useState('')
  const [showDetails, setShowDetails] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const handleRating = async (value: number) => {
    setRating(value)
    if (!showDetails) {
      await submitFeedback(value, [], '')
    }
  }

  const toggleTag = (tag: FeedbackTag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const submitFeedback = async (ratingValue: number, tags: FeedbackTag[], commentText: string) => {
    setIsSubmitting(true)

    const feedback: FeedbackSubmission = {
      message_id: messageId,
      cv_id: cvId,
      feedback_type: 'rating',
      rating: ratingValue,
      tags: tags,
      comment: commentText || undefined,
      user_intent: 'Entrenamiento del modelo'
    }

    try {
      const response = await fetch('/api/cv-lab/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedback)
      })

      if (response.ok) {
        setSubmitted(true)
        onFeedbackSubmit?.(feedback)
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitWithDetails = async () => {
    if (rating !== null) {
      await submitFeedback(rating, selectedTags, comment)
    }
  }

  if (submitted) {
    return (
      <div className="flex items-center gap-1.5 mt-2 text-xs text-green-600">
        <Check className="h-3 w-3" />
        <span>Gracias</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-0.5 mt-2">
      <Button
        variant="ghost"
        size="sm"
        className={`h-6 w-6 p-0 rounded-full ${
          rating === 5
            ? 'text-green-600 bg-green-100'
            : 'text-neutral-300 hover:text-green-500 hover:bg-green-50'
        }`}
        onClick={() => handleRating(5)}
        disabled={isSubmitting}
        title="Buena respuesta"
      >
        <ThumbsUp className="h-3 w-3" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className={`h-6 w-6 p-0 rounded-full ${
          rating === 1
            ? 'text-red-600 bg-red-100'
            : 'text-neutral-300 hover:text-red-500 hover:bg-red-50'
        }`}
        onClick={() => handleRating(1)}
        disabled={isSubmitting}
        title="Mala respuesta"
      >
        <ThumbsDown className="h-3 w-3" />
      </Button>

      <Popover open={showDetails} onOpenChange={setShowDetails}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 rounded-full text-neutral-300 hover:text-neutral-500 hover:bg-neutral-100"
            disabled={isSubmitting}
            title="Feedback detallado"
          >
            <MessageSquare className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" align="start" sideOffset={5}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Feedback</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0"
                onClick={() => setShowDetails(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            {/* Quick rating */}
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <Button
                  key={value}
                  variant={rating === value ? 'default' : 'outline'}
                  size="sm"
                  className={`h-7 w-7 p-0 text-xs ${
                    rating === value
                      ? value >= 4
                        ? 'bg-green-600 hover:bg-green-700'
                        : value <= 2
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-amber-500 hover:bg-amber-600'
                      : ''
                  }`}
                  onClick={() => setRating(value)}
                >
                  {value}
                </Button>
              ))}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1">
              {FEEDBACK_TAGS.map((tag) => (
                <Badge
                  key={tag.value}
                  variant={selectedTags.includes(tag.value) ? 'default' : 'outline'}
                  className={`cursor-pointer text-xs px-1.5 py-0 ${
                    selectedTags.includes(tag.value)
                      ? tag.isPositive
                        ? 'bg-green-100 text-green-700 border-green-200'
                        : 'bg-red-100 text-red-700 border-red-200'
                      : 'text-neutral-500 hover:bg-neutral-50'
                  }`}
                  onClick={() => toggleTag(tag.value)}
                >
                  {tag.label}
                </Badge>
              ))}
            </div>

            {/* Comment */}
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Comentario..."
              className="h-14 text-xs resize-none"
            />

            {/* Submit */}
            <Button
              className="w-full h-7 text-xs"
              size="sm"
              onClick={handleSubmitWithDetails}
              disabled={rating === null || isSubmitting}
            >
              {isSubmitting ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
