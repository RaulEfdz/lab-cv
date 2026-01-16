'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { ChatPanel, ChatPanelRef } from './chat-panel'
import { PaperPreview } from './paper-preview'
import { VersionsDrawer } from './versions-drawer'
import { ReadinessBadge } from './readiness-badge'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { History, Save, Download, ArrowLeft, FileText, GitBranch, MessageSquare, Menu, MoreVertical } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { LinkedInConnectButton } from './linkedin-connect-button'
import { YappyDownloadButton } from '@/components/payments/YappyDownloadButton'
import { cn } from '@/lib/utils'
import type {
  CvLabCv,
  CvLabVersion,
  CvLabMessage,
  CvJson
} from '@/lib/types/cv-lab'

interface CvLabLayoutProps {
  cv: CvLabCv
  versions: CvLabVersion[]
  messages: CvLabMessage[]
}

export function CvLabLayout({ cv, versions: initialVersions, messages: initialMessages }: CvLabLayoutProps) {
  const [versions, setVersions] = useState(initialVersions)
  const [messages, setMessages] = useState(initialMessages)
  const [currentVersionId, setCurrentVersionId] = useState(
    versions[0]?.id || null
  )
  const [activeTab, setActiveTab] = useState<'chat' | 'preview'>('chat')
  const [isVersionsOpen, setIsVersionsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [readinessScore, setReadinessScore] = useState(cv.readiness_score)
  const [showYappyTest, setShowYappyTest] = useState(false)

  // Manual editing state
  const [isEditing, setIsEditing] = useState(false)
  const [editedCvJson, setEditedCvJson] = useState<CvJson | null>(null)
  const [originalCvJson, setOriginalCvJson] = useState<CvJson | null>(null)

  // Ref to ChatPanel for triggering messages
  const chatPanelRef = useRef<ChatPanelRef>(null)

  // Get current version
  const currentVersion = versions.find(v => v.id === currentVersionId) || versions[0]
  const currentCvJson = currentVersion?.cv_json || null

  // Handle CV JSON update from chat
  const handleCvUpdate = useCallback((updatedCvJson: CvJson, newScore: number) => {
    if (currentVersion) {
      setVersions(prev =>
        prev.map(v =>
          v.id === currentVersion.id
            ? { ...v, cv_json: updatedCvJson }
            : v
        )
      )
      setReadinessScore(newScore)
    }
  }, [currentVersion])

  // Handle new message
  const handleNewMessage = useCallback((message: CvLabMessage) => {
    setMessages(prev => [...prev, message])
  }, [])

  // Handle readiness badge click - ask OCTAVIA what's missing
  const handleReadinessClick = useCallback(() => {
    if (chatPanelRef.current && readinessScore < 100) {
      chatPanelRef.current.sendMessage(
        `¿Qué me falta para llegar al 100%?`
      )
    }
  }, [readinessScore])

  // Manual editing handlers
  const handleEditStart = useCallback(() => {
    if (currentCvJson) {
      setOriginalCvJson(currentCvJson)
      setEditedCvJson(currentCvJson)
      setIsEditing(true)
    }
  }, [currentCvJson])

  const handleEditChange = useCallback((updated: CvJson) => {
    setEditedCvJson(updated)
  }, [])

  const handleEditCancel = useCallback(() => {
    setEditedCvJson(null)
    setOriginalCvJson(null)
    setIsEditing(false)
  }, [])

  const handleEditSave = useCallback(async () => {
    if (!editedCvJson || !currentVersion) return

    // First, persist to database
    try {
      const saveResponse = await fetch(`/api/cv-lab/${cv.id}/commit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cvJson: editedCvJson,
          versionId: currentVersion.id
        })
      })

      if (!saveResponse.ok) {
        const error = await saveResponse.json()
        console.error('Error saving manual edit:', error)
        toast.error('Error guardando', {
          description: error.error || 'Error desconocido'
        })
        return
      }

      // Update local state
      setVersions(prev =>
        prev.map(v =>
          v.id === currentVersion.id
            ? { ...v, cv_json: editedCvJson }
            : v
        )
      )

      toast.success('Cambios guardados', {
        description: 'Tu edición manual ha sido guardada'
      })
    } catch (error) {
      console.error('Error saving manual edit:', error)
      toast.error('Error guardando los cambios')
      return
    }

    // Now notify OCTAVIA
    try {
      const response = await fetch(`/api/cv-lab/${cv.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: '[SISTEMA] El usuario ha editado manualmente el CV. Por favor, toma nota de los cambios realizados y asimílalos sin sobrescribirlos. Continúa asistiendo al usuario desde este punto.',
          currentCvJson: editedCvJson,
          isSystemMessage: true
        })
      })

      if (response.ok) {
        const reader = response.body?.getReader()
        if (reader) {
          const decoder = new TextDecoder()
          let assistantMessage = ''
          let newScore = readinessScore

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value)
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6))
                  if (data.type === 'text') {
                    assistantMessage += data.content
                  } else if (data.type === 'cv_update') {
                    newScore = data.newScore || readinessScore
                  }
                } catch { }
              }
            }
          }

          // Add system acknowledgment message
          if (assistantMessage) {
            const ackMessage: CvLabMessage = {
              id: `msg-${Date.now()}`,
              cv_id: cv.id,
              role: 'assistant',
              content: assistantMessage,
              tokens_in: 0,
              tokens_out: 0,
              created_at: new Date().toISOString()
            }
            setMessages(prev => [...prev, ackMessage])
          }
          setReadinessScore(newScore)
        }
      }
    } catch (error) {
      console.error('Error notifying agent:', error)
    }

    // Clear editing state
    setEditedCvJson(null)
    setOriginalCvJson(null)
    setIsEditing(false)
  }, [editedCvJson, currentVersion, cv.id, readinessScore])

  // Save current version as new commit
  const handleSaveVersion = async () => {
    if (!currentCvJson) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/cv-lab/${cv.id}/commit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvJson: currentCvJson })
      })

      if (response.ok) {
        const { version } = await response.json()
        setVersions(prev => [version, ...prev].slice(0, 5))
        setCurrentVersionId(version.id)
      }
    } catch (error) {
      console.error('Error saving version:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Download PDF
  const handleDownloadPdf = async () => {
    if (!currentCvJson) {
      alert('No hay contenido para descargar. Primero agrega información a tu CV.')
      return
    }

    try {
      // Use POST to generate PDF from current state (not saved version)
      const response = await fetch(`/api/cv-lab/${cv.id}/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvJson: currentCvJson })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${cv.title}.pdf`
        a.click()
        URL.revokeObjectURL(url)
      } else {
        const error = await response.json()
        alert(error.error || 'Error generando PDF')
      }
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('Error descargando PDF')
    }
  }

  // Select version
  const handleSelectVersion = (versionId: string) => {
    setCurrentVersionId(versionId)
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      {/* Header bar - Responsive */}
      <header className="flex-none border-b bg-white z-20">
        <div className="flex items-center justify-between h-14 px-4 relative">
          {/* Left section: Navigation + Title */}
          <div className="flex items-center gap-3 overflow-hidden">
            <Link href="/admin/cv-lab" className="flex-none">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>

            <div className="h-6 w-px bg-neutral-200 flex-none hidden md:block" />

            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex items-center gap-2 overflow-hidden">
                <FileText className="h-4 w-4 text-neutral-400 flex-none hidden md:block" />
                <h1 className="font-medium text-neutral-900 truncate max-w-[150px] md:max-w-[200px]">
                  {cv.title}
                </h1>
              </div>

              <div className="hidden md:flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={
                    cv.status === 'CLOSED' ? 'border-green-200 bg-green-50 text-green-700' :
                      cv.status === 'READY' ? 'border-blue-200 bg-blue-50 text-blue-700' :
                        'border-neutral-200 bg-neutral-50 text-neutral-600'
                  }
                >
                  {cv.status === 'CLOSED' ? 'Cerrado' :
                    cv.status === 'READY' ? 'Listo' : 'Borrador'}
                </Badge>

                {cv.target_role && (
                  <>
                    <span className="text-neutral-300">•</span>
                    <span className="text-sm text-neutral-500 truncate max-w-[150px]">
                      {cv.target_role}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Center section: Readiness Score (Desktop only) */}
          <div className="absolute left-1/2 -translate-x-1/2 hidden md:block">
            <ReadinessBadge
              score={readinessScore}
              onClick={readinessScore < 100 ? handleReadinessClick : undefined}
            />
          </div>

          {/* Right section: Actions (Desktop) */}
          <div className="hidden md:flex items-center gap-2">
            {/* LinkedIn */}
            <LinkedInConnectButton
              cvId={cv.id}
              isConnected={cv.cv_data?.linkedinConnected || false}
              userName={cv.cv_data?.linkedinData?.name}
            />

            <div className="h-6 w-px bg-neutral-200 mx-1" />

            {/* Version control group */}
            <div className="flex items-center gap-1 bg-neutral-50 rounded-lg p-1">
              <Select
                value={currentVersionId || ''}
                onValueChange={handleSelectVersion}
              >
                <SelectTrigger className="h-7 w-[100px] border-0 bg-transparent text-xs font-medium">
                  <GitBranch className="h-3 w-3 mr-1.5 text-neutral-400" />
                  <SelectValue placeholder="v1" />
                </SelectTrigger>
                <SelectContent>
                  {versions.map(v => (
                    <SelectItem key={v.id} value={v.id}>
                      v{v.version_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVersionsOpen(true)}
                className="h-7 px-2 text-xs"
              >
                <History className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="h-6 w-px bg-neutral-200 mx-1" />

            {/* Save & Export */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveVersion}
              disabled={isSaving || !currentCvJson}
              className="h-8"
            >
              <Save className="h-3.5 w-3.5 mr-1.5" />
              {isSaving ? 'Guardando...' : 'Guardar'}
            </Button>

            <Button
              size="sm"
              onClick={handleDownloadPdf}
              disabled={!currentCvJson}
              className="h-8 bg-orange-500 hover:bg-orange-600 hover:scale-105 shadow-sm cursor-pointer transition-all duration-200"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Exportar
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowYappyTest(true)}
              disabled={!currentCvJson}
              className="h-8 border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Pagar
            </Button>
          </div>

          {/* Mobile Actions Menu */}
          <div className="flex md:hidden items-center gap-2">
            <div
              className="scale-90 origin-right transition-transform active:scale-95"
              onClick={readinessScore < 100 ? handleReadinessClick : undefined}
            >
              <ReadinessBadge score={readinessScore} size="sm" />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={handleSaveVersion} disabled={isSaving || !currentCvJson}>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Versión
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownloadPdf} disabled={!currentCvJson}>
                  <Download className="h-4 w-4 mr-2" />
                  Descargar PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsVersionsOpen(true)}>
                  <History className="h-4 w-4 mr-2" />
                  Historial de Versiones
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowYappyTest(true)}>
                  <Download className="h-4 w-4 mr-2 text-purple-600" />
                  <span className="text-purple-600">Pagar y Descargar</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main content - split view on desktop, tabbed on mobile */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {/* Chat panel */}
        <div className={cn(
          "flex flex-col bg-neutral-50 overflow-hidden transition-all duration-300",
          "w-full md:w-[45%] md:min-w-[400px] md:border-r z-10",
          activeTab === 'chat' ? 'flex absolute inset-0 md:relative' : 'hidden md:flex'
        )}>
          <ChatPanel
            ref={chatPanelRef}
            cvId={cv.id}
            messages={messages}
            currentCvJson={currentCvJson}
            onNewMessage={handleNewMessage}
            onCvUpdate={handleCvUpdate}
          />
        </div>

        {/* Paper preview */}
        <div className={cn(
          "flex-1 overflow-auto bg-neutral-100 transition-all duration-300",
          "p-4 md:p-6 md:pt-16",
          activeTab === 'preview' ? 'block absolute inset-0 md:relative' : 'hidden md:block'
        )}>
          <PaperPreview
            cvJson={isEditing ? editedCvJson : currentCvJson}
            isEditing={isEditing}
            onEditChange={handleEditChange}
            onEditStart={handleEditStart}
            onEditSave={handleEditSave}
            onEditCancel={handleEditCancel}
          />
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden flex-none bg-white border-t px-6 py-2 pb-safe">
        <div className="flex items-center justify-around">
          <button
            onClick={() => setActiveTab('chat')}
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors w-20",
              activeTab === 'chat' ? "text-blue-600 bg-blue-50" : "text-neutral-500 hover:bg-neutral-50"
            )}
          >
            <MessageSquare className="h-5 w-5" />
            <span className="text-[10px] font-medium">Chat</span>
          </button>

          <div className="w-px h-8 bg-neutral-100" />

          <button
            onClick={() => setActiveTab('preview')}
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors w-20",
              activeTab === 'preview' ? "text-blue-600 bg-blue-50" : "text-neutral-500 hover:bg-neutral-50"
            )}
          >
            <FileText className="h-5 w-5" />
            <span className="text-[10px] font-medium">Vista Previa</span>
          </button>
        </div>
      </div>

      {/* Versions drawer */}
      <VersionsDrawer
        open={isVersionsOpen}
        onOpenChange={setIsVersionsOpen}
        versions={versions}
        currentVersionId={currentVersionId}
        onSelectVersion={handleSelectVersion}
      />

      {/* Yappy Test Modal */}
      {showYappyTest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Pagar y descargar con Yappy</h3>
              <button
                onClick={() => setShowYappyTest(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Completa el pago con Yappy para descargar tu CV. Los admins pueden probar el flujo completo aquí.
            </p>
            <YappyDownloadButton
              cvId={cv.id}
              cvTitle={cv.title}
              hasAccess={false}
              onSuccess={() => {
                toast.success('Pago completado exitosamente')
                setShowYappyTest(false)
              }}
              onError={(error) => {
                toast.error(error)
              }}
              onCancel={() => {
                toast.info('Pago cancelado')
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
