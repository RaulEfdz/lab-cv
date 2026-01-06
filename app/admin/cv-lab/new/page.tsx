'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminPageWrapper } from '@/components/admin/admin-page-wrapper'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { ArrowLeft, Sparkles, Loader2, MessageSquare, FileText, Zap } from 'lucide-react'
import Link from 'next/link'

export default function NewCvPage() {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [language, setLanguage] = useState('es')

  // Auto-generar nombre del CV
  const generateTitle = () => {
    const now = new Date()
    const dateStr = now.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
    return `Mi CV - ${dateStr}`
  }

  const handleCreate = async () => {
    setIsCreating(true)
    try {
      const response = await fetch('/api/cv-lab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: generateTitle(),
          target_role: null, // OCTAVIA preguntará
          industry: null,    // OCTAVIA preguntará
          language
        })
      })

      if (response.ok) {
        const { cv } = await response.json()
        router.push(`/admin/cv-lab/${cv.id}`)
      } else {
        const error = await response.json()
        console.error('Error creating CV:', error)
        alert('Error al crear el CV')
      }
    } catch (error) {
      console.error('Error creating CV:', error)
      alert('Error al crear el CV')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <AdminPageWrapper>
      <div className="max-w-2xl mx-auto px-6 lg:px-8 py-8">
        {/* Back link */}
        <Link
          href="/admin/cv-lab"
          className="inline-flex items-center text-sm text-neutral-500 hover:text-neutral-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver a CV Lab
        </Link>

        <Card>
          <CardHeader className="text-center pb-2">
            <div className="mx-auto p-3 bg-orange-100 rounded-2xl w-fit mb-4">
              <Sparkles className="h-8 w-8 text-orange-600" />
            </div>
            <CardTitle className="text-2xl">Crear nuevo CV</CardTitle>
            <CardDescription className="text-base">
              OCTAVIA te guiará paso a paso en la conversación
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pt-4">
            {/* Cómo funciona */}
            <div className="grid gap-3">
              <div className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg">
                <MessageSquare className="h-5 w-5 text-orange-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-sm">Conversación guiada</p>
                  <p className="text-xs text-neutral-500">
                    La IA te preguntará tu nombre, experiencia y puesto objetivo
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg">
                <FileText className="h-5 w-5 text-orange-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-sm">Sube tu CV actual (opcional)</p>
                  <p className="text-xs text-neutral-500">
                    Puedes pegar texto de LinkedIn o subir un PDF para empezar más rápido
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg">
                <Zap className="h-5 w-5 text-orange-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-sm">Optimización automática</p>
                  <p className="text-xs text-neutral-500">
                    La IA mejora el lenguaje, pide métricas y optimiza para ATS
                  </p>
                </div>
              </div>
            </div>

            {/* Solo idioma */}
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Idioma del CV</p>
                  <p className="text-xs text-neutral-500">La conversación será en este idioma</p>
                </div>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 bg-neutral-50 border-t pt-6">
            <Button
              onClick={handleCreate}
              disabled={isCreating}
              className="w-full bg-orange-500 hover:bg-orange-600 h-12 text-base"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Iniciando...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Comenzar con OCTAVIA
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.back()}
              disabled={isCreating}
              className="w-full text-neutral-500"
            >
              Cancelar
            </Button>
          </CardFooter>
        </Card>
      </div>
    </AdminPageWrapper>
  )
}
