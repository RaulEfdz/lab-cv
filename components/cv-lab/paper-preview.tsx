'use client'

import { useEffect, useState } from 'react'
import { PagePaper } from '@/components/PagePaper'
import { CvRenderer } from './cv-renderer'
import { CvEditor } from './cv-editor'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Pencil, Check, X } from 'lucide-react'
import type { CvJson } from '@/lib/types/cv-lab'

interface PaperPreviewProps {
  cvJson: CvJson | null
  isLoading?: boolean
  isEditing?: boolean
  onEditChange?: (cvJson: CvJson) => void
  onEditStart?: () => void
  onEditSave?: () => void
  onEditCancel?: () => void
}

export function PaperPreview({
  cvJson,
  isLoading,
  isEditing = false,
  onEditChange,
  onEditStart,
  onEditSave,
  onEditCancel,
}: PaperPreviewProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  // Trigger animation when CV updates
  useEffect(() => {
    if (cvJson && !isEditing) {
      setIsUpdating(true)
      const timer = setTimeout(() => setIsUpdating(false), 600)
      return () => clearTimeout(timer)
    }
  }, [cvJson, isEditing])

  if (isLoading) {
    return (
      <div className="max-w-[210mm] mx-auto">
        <PagePaper variant="default" className="min-h-[297mm]">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Skeleton className="h-8 w-48 mx-auto" />
              <Skeleton className="h-4 w-64 mx-auto" />
              <Skeleton className="h-3 w-80 mx-auto" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-20 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-5 w-40" />
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          </div>
        </PagePaper>
      </div>
    )
  }

  if (!cvJson) {
    return (
      <div className="max-w-[210mm] mx-auto">
        <PagePaper variant="default" className="min-h-[297mm]">
          <div className="flex flex-col items-center justify-center h-full text-neutral-400 py-20">
            <svg
              className="w-16 h-16 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-lg font-medium">Tu CV aparecerá aquí</p>
            <p className="text-sm mt-1">
              Comienza a chatear para generar contenido
            </p>
          </div>
        </PagePaper>
      </div>
    )
  }

  return (
    <div className="max-w-[210mm] mx-auto relative">
      {/* Edit controls - floating above paper */}
      <div className="absolute -top-12 right-0 flex items-center gap-2 z-10">
        {isEditing ? (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={onEditCancel}
              className="h-8 bg-white shadow-sm cursor-pointer"
            >
              <X className="h-3.5 w-3.5 mr-1.5" />
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={onEditSave}
              className="h-8 bg-green-500 hover:bg-green-600 shadow-sm cursor-pointer hover:scale-105 transition-all"
            >
              <Check className="h-3.5 w-3.5 mr-1.5" />
              Guardar edición
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={onEditStart}
            className="h-8 bg-white shadow-sm hover:bg-blue-50 hover:border-blue-300 cursor-pointer"
          >
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Editar manualmente
          </Button>
        )}
      </div>

      <PagePaper
        variant="default"
        className={`min-h-[297mm] transition-all duration-300 relative overflow-hidden ${isEditing
          ? 'ring-2 ring-blue-500 ring-offset-2'
          : isUpdating
            ? 'ring-2 ring-green-500 ring-offset-2 scale-[1.01]'
            : ''
          }`}
      >
        {/* Watermark - Only visible in browser preview, NOT in downloaded PDF */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
          style={{ mixBlendMode: 'multiply' }}
        >
          <div
            className="text-gray-300 font-bold select-none"
            style={{
              fontSize: '140px',
              transform: 'rotate(-45deg)',
              whiteSpace: 'nowrap',
              letterSpacing: '30px',
              textTransform: 'uppercase',
              opacity: 0.5,
            }}
          >
            PREVIEW
          </div>
        </div>

        {/* CV Content */}
        <div className="relative z-0">
          {isEditing && onEditChange ? (
            <CvEditor cvJson={cvJson} onChange={onEditChange} />
          ) : (
            <CvRenderer cvJson={cvJson} />
          )}
        </div>
      </PagePaper>

      {/* Edit mode indicator */}
      {isEditing && (
        <div className="absolute -bottom-8 left-0 right-0 text-center">
          <span className="text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            Modo edición activo - Haz clic en cualquier texto para editarlo
          </span>
        </div>
      )}
    </div>
  )
}
