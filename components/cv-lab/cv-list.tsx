'use client'

import { useState } from 'react'
import { CvCard } from './cv-card'
import { Button } from '@/components/ui/button'
import { Download, Trash2, X, CheckSquare } from 'lucide-react'
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

interface CvListProps {
  cvs: Array<{
    id: string
    title: string
    target_role: string | null
    status: 'DRAFT' | 'READY' | 'CLOSED'
    readiness_score: number
    updated_at: string
    versions_count: number
    messages_count: number
  }>
}

export function CvList({ cvs }: CvListProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectionMode, setSelectionMode] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [isBulkDownloading, setIsBulkDownloading] = useState(false)
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)

  const handleSelect = (id: string, selected: boolean) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      if (selected) {
        newSet.add(id)
      } else {
        newSet.delete(id)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedIds.size === cvs.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(cvs.map(cv => cv.id)))
    }
  }

  const handleCancelSelection = () => {
    setSelectedIds(new Set())
    setSelectionMode(false)
  }

  const handleBulkDownload = async () => {
    const selectedCvs = cvs.filter(cv => selectedIds.has(cv.id) && cv.readiness_score > 0)

    if (selectedCvs.length === 0) {
      toast.error('Sin CVs válidos', {
        description: 'Los CVs seleccionados están vacíos'
      })
      return
    }

    setIsBulkDownloading(true)

    let successCount = 0
    let failCount = 0

    for (const cv of selectedCvs) {
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
          successCount++

          // Small delay between downloads
          await new Promise(resolve => setTimeout(resolve, 300))
        } else {
          failCount++
        }
      } catch (error) {
        console.error('Error downloading:', error)
        failCount++
      }
    }

    setIsBulkDownloading(false)

    if (successCount > 0) {
      toast.success(`${successCount} CVs descargados`, {
        description: failCount > 0 ? `${failCount} fallaron` : undefined
      })
    } else {
      toast.error('Error descargando CVs')
    }

    handleCancelSelection()
  }

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true)

    let successCount = 0
    let failCount = 0

    for (const id of selectedIds) {
      const result = await deleteCv(id)
      if (result.error) {
        failCount++
      } else {
        successCount++
      }
    }

    setIsBulkDeleting(false)
    setShowBulkDeleteDialog(false)

    if (successCount > 0) {
      toast.success(`${successCount} CVs eliminados`, {
        description: failCount > 0 ? `${failCount} fallaron` : undefined
      })
    } else {
      toast.error('Error eliminando CVs')
    }

    handleCancelSelection()
  }

  return (
    <>
      {/* Bulk actions bar */}
      {selectionMode && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white border border-neutral-200 rounded-2xl shadow-2xl p-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-[#F67300]" />
            <span className="font-medium text-sm">
              {selectedIds.size} seleccionado{selectedIds.size !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="h-6 w-px bg-neutral-200" />

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              className="h-8"
            >
              {selectedIds.size === cvs.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleBulkDownload}
              disabled={selectedIds.size === 0 || isBulkDownloading}
              className="h-8 text-[#F67300] hover:text-[#E56200] hover:bg-[#FFF7ED] cursor-pointer"
            >
              <Download className="h-4 w-4 mr-1.5" />
              Descargar
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBulkDeleteDialog(true)}
              disabled={selectedIds.size === 0 || isBulkDeleting}
              className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Eliminar
            </Button>

            <div className="h-6 w-px bg-neutral-200 ml-2" />

            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancelSelection}
              className="h-8 w-8 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* CVs Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cvs.map((cv) => (
          <CvCard
            key={cv.id}
            cv={cv}
            isSelected={selectedIds.has(cv.id)}
            onSelect={handleSelect}
            selectionMode={selectionMode}
          />
        ))}
      </div>

      {/* Enable selection mode button */}
      {!selectionMode && cvs.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectionMode(true)}
          className="fixed bottom-6 right-6 shadow-lg cursor-pointer"
        >
          <CheckSquare className="h-4 w-4 mr-2" />
          Seleccionar
        </Button>
      )}

      {/* Bulk delete confirmation dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {selectedIds.size} CV{selectedIds.size !== 1 ? 's' : ''}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente los CVs seleccionados junto con todas sus versiones y mensajes. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700 cursor-pointer"
              disabled={isBulkDeleting}
            >
              {isBulkDeleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
