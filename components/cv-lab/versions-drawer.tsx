'use client'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Check, Clock, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CvLabVersion } from '@/lib/types/cv-lab'

interface VersionsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  versions: CvLabVersion[]
  currentVersionId: string | null
  onSelectVersion: (versionId: string) => void
}

export function VersionsDrawer({
  open,
  onOpenChange,
  versions,
  currentVersionId,
  onSelectVersion
}: VersionsDrawerProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('es', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date)
  }

  const getVersionSummary = (version: CvLabVersion) => {
    const cv = version.cv_json
    const parts = []

    if (cv.header?.fullName) {
      parts.push(cv.header.fullName)
    }
    if (cv.experience?.length > 0) {
      parts.push(`${cv.experience.length} experiencias`)
    }
    if (cv.skills?.hard?.length > 0) {
      parts.push(`${cv.skills.hard.length} habilidades`)
    }

    return parts.length > 0 ? parts.join(' - ') : 'CV vacío'
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Historial de Versiones
          </SheetTitle>
          <SheetDescription>
            Puedes tener hasta 5 versiones guardadas. Las versiones más antiguas se eliminan automáticamente.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-180px)] mt-6">
          <div className="space-y-3 pr-4">
            {versions.length === 0 ? (
              <div className="text-center py-12 text-neutral-500">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No hay versiones guardadas aún</p>
                <p className="text-sm mt-1">
                  Haz clic en &quot;Guardar&quot; para crear la primera versión
                </p>
              </div>
            ) : (
              versions.map((version) => {
                const isCurrent = version.id === currentVersionId
                return (
                  <div
                    key={version.id}
                    className={cn(
                      'p-4 rounded-lg border transition-all cursor-pointer',
                      isCurrent
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                    )}
                    onClick={() => {
                      onSelectVersion(version.id)
                      onOpenChange(false)
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-neutral-900">
                            Versión {version.version_number}
                          </h4>
                          {isCurrent && (
                            <Badge variant="outline" className="text-orange-600 border-orange-300">
                              <Check className="h-3 w-3 mr-1" />
                              Actual
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-neutral-500 mt-1">
                          {formatDate(version.created_at)}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-neutral-600 mt-2 line-clamp-2">
                      {getVersionSummary(version)}
                    </p>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
