'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ReadinessBadge } from './readiness-badge'
import { FileText, MessageSquare, Trash2, Loader2, Download } from 'lucide-react'
import { deleteCv } from '@/app/admin/cv-lab/actions'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface CvCardProps {
  cv: {
    id: string
    title: string
    target_role: string | null
    status: 'DRAFT' | 'READY' | 'CLOSED'
    readiness_score: number
    updated_at: string
    versions_count: number
    messages_count: number
  }
  isSelected?: boolean
  onSelect?: (id: string, selected: boolean) => void
  selectionMode?: boolean
}

export function CvCard({ cv, isSelected, onSelect, selectionMode }: CvCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setIsDeleting(true)
    const result = await deleteCv(cv.id)

    if (result.error) {
      toast.error('Error al eliminar', {
        description: result.error
      })
      setIsDeleting(false)
    } else {
      toast.success('CV eliminado', {
        description: 'El CV ha sido eliminado correctamente'
      })
      // No need to reset isDeleting, page will revalidate
    }

    setShowDeleteDialog(false)
  }

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (cv.readiness_score === 0) {
      toast.error('CV vacío', {
        description: 'Este CV no tiene contenido aún'
      })
      return
    }

    setIsDownloading(true)

    try {
      const response = await fetch(`/api/cv-lab/${cv.id}/pdf`, {
        method: 'GET'
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${cv.title}.pdf`
        a.click()
        URL.revokeObjectURL(url)

        toast.success('PDF descargado', {
          description: 'El CV se ha descargado correctamente'
        })
      } else {
        const error = await response.json()
        toast.error('Error al descargar', {
          description: error.error || 'Error desconocido'
        })
      }
    } catch (error) {
      console.error('Error downloading PDF:', error)
      toast.error('Error al descargar PDF')
    } finally {
      setIsDownloading(false)
    }
  }

  const openDeleteDialog = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowDeleteDialog(true)
  }

  const handleCardClick = (e: React.MouseEvent) => {
    if (selectionMode && onSelect) {
      e.preventDefault()
      onSelect(cv.id, !isSelected)
    }
  }

  const handleCheckboxChange = (checked: boolean) => {
    if (onSelect) {
      onSelect(cv.id, checked)
    }
  }

  const CardWrapper = selectionMode ? 'div' : Link

  return (
    <>
      <div className="relative group">
        <CardWrapper
          {...(!selectionMode && { href: `/admin/cv-lab/${cv.id}` })}
          onClick={selectionMode ? handleCardClick : undefined}
        >
          <Card className={`h-full transition-all cursor-pointer ${
            selectionMode
              ? isSelected
                ? 'shadow-lg ring-2 ring-[#F67300] -translate-y-1'
                : 'hover:shadow-md'
              : 'hover:shadow-lg hover:-translate-y-1'
          }`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  {/* Checkbox in selection mode */}
                  {selectionMode && (
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={handleCheckboxChange}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1"
                    />
                  )}
                  <CardTitle className="text-lg line-clamp-1 flex-1">{cv.title}</CardTitle>
                </div>
                <Badge
                  variant={
                    cv.status === 'CLOSED' ? 'default' :
                    cv.status === 'READY' ? 'secondary' : 'outline'
                  }
                  className="shrink-0"
                >
                  {cv.status === 'CLOSED' ? 'Cerrado' :
                   cv.status === 'READY' ? 'Listo' : 'Borrador'}
                </Badge>
              </div>
              {cv.target_role && (
                <CardDescription className="line-clamp-1">
                  {cv.target_role}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <ReadinessBadge score={cv.readiness_score} size="sm" />
              <div className="flex items-center gap-4 mt-4 text-sm text-neutral-500">
                <span className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {cv.versions_count} versiones
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  {cv.messages_count} mensajes
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-3">
                Actualizado: {new Date(cv.updated_at).toLocaleDateString('es')}
              </p>
            </CardContent>
          </Card>
        </CardWrapper>

        {/* Action buttons - appear on hover (hidden in selection mode) */}
        {!selectionMode && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          {/* Download button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            disabled={isDownloading || cv.readiness_score === 0}
            className="bg-white/90 hover:bg-[#FFF7ED] hover:text-[#F67300] shadow-sm cursor-pointer"
            title="Descargar PDF"
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>

          {/* Delete button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={openDeleteDialog}
            disabled={isDeleting}
            className="bg-white/90 hover:bg-red-50 hover:text-red-600 shadow-sm cursor-pointer"
            title="Eliminar CV"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar CV?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el CV <strong>{cv.title}</strong> junto con todas sus versiones y mensajes. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
