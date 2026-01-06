'use client'

import { useState, useRef, KeyboardEvent, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Paperclip, X, FileText, Loader2 } from 'lucide-react'
import { useUploadThing } from '@/lib/uploadthing'
import { toast } from 'sonner'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  cvId: string
}

export function ChatInput({ onSend, disabled, cvId }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [promptVersion, setPromptVersion] = useState('v4.3')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch active prompt version
  useEffect(() => {
    fetch('/api/cv-lab/prompt/version')
      .then(res => res.json())
      .then(data => setPromptVersion(data.version))
      .catch(() => setPromptVersion('v4.3'))
  }, [])

  const { startUpload } = useUploadThing('cvDocument', {
    onClientUploadComplete: async (res) => {
      if (res && res.length > 0) {
        const file = res[0]

        try {
          // Process the uploaded document
          const response = await fetch(`/api/cv-lab/${cvId}/assets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: file.name,
              fileUrl: file.ufsUrl,
              fileKey: file.key,
              mimeType: selectedFile?.type || 'application/pdf'
            })
          })

          if (response.ok) {
            toast.success('Documento procesado', {
              description: 'El contenido ha sido extraído correctamente.'
            })

            // Auto-send a message about the upload
            const uploadMessage = `He subido mi CV: "${file.name}". Por favor analízalo y ayúdame a mejorarlo.`
            onSend(uploadMessage)
          } else {
            toast.error('Error procesando documento')
          }
        } catch (error) {
          console.error('Error processing upload:', error)
          toast.error('Error al procesar el documento')
        }

        setSelectedFile(null)
        setIsUploading(false)
      }
    },
    onUploadError: (error) => {
      console.error('Upload error:', error)
      toast.error('Error de subida', {
        description: error.message
      })
      setSelectedFile(null)
      setIsUploading(false)
    }
  })

  const handleSend = () => {
    if (!message.trim() || disabled || isUploading) return
    onSend(message.trim())
    setMessage('')
    textareaRef.current?.focus()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const validTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'text/plain'
      ]

      if (!validTypes.includes(file.type)) {
        toast.error('Tipo de archivo no soportado', {
          description: 'Solo se permiten PDF, Word (.docx, .doc) o texto (.txt)'
        })
        return
      }

      if (file.size > 4 * 1024 * 1024) {
        toast.error('Archivo muy grande', {
          description: 'El archivo debe ser menor a 4MB'
        })
        return
      }

      setSelectedFile(file)
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    setIsUploading(true)
    await startUpload([selectedFile])
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
  }

  const isDisabled = disabled || isUploading

  return (
    <div className="space-y-2">
      {/* Selected file preview */}
      {selectedFile && (
        <div className="flex items-center gap-2 px-3 py-2 bg-[#F5F5F5] rounded-xl">
          <FileText className="w-4 h-4 text-[#F67300]" />
          <span className="text-sm text-[#525252] flex-1 truncate">
            {selectedFile.name}
          </span>
          <span className="text-xs text-[#737373]">
            {(selectedFile.size / 1024).toFixed(0)} KB
          </span>
          {!isUploading && (
            <button
              onClick={handleRemoveFile}
              className="p-1 hover:bg-neutral-200 rounded-full transition-colors"
            >
              <X className="w-3 h-3 text-[#737373]" />
            </button>
          )}
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.doc,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Attach file button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={isDisabled || !!selectedFile}
          className="shrink-0 h-10 w-10 rounded-xl text-[#737373] hover:text-[#525252] hover:bg-[#F5F5F5]"
          title="Adjuntar CV (PDF, Word, texto)"
        >
          <Paperclip className="w-4 h-4" />
        </Button>

        {/* Text input */}
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={selectedFile ? "Presiona enviar para subir el archivo..." : "Escribe un mensaje..."}
          disabled={isDisabled}
          className="min-h-[44px] max-h-[200px] resize-none rounded-xl border-[#E5E5E5] focus:border-[#F67300] focus:ring-[#F67300]/20"
          rows={1}
        />

        {/* Send/Upload button */}
        <Button
          onClick={selectedFile ? handleUpload : handleSend}
          disabled={selectedFile ? isUploading : (!message.trim() || isDisabled)}
          size="icon"
          className="shrink-0 h-10 w-10 rounded-xl bg-[#F67300] hover:bg-[#E56200] cursor-pointer"
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>

      <p className="text-xs text-[#A3A3A3] text-center">
        Enter para enviar · Shift+Enter nueva línea · PDF, Word o texto · Octavia {promptVersion}
      </p>
    </div>
  )
}
