'use client'

import { useMemo, useState } from 'react'
import { toast, Toaster } from 'sonner'
import type { CvLabPromptVersion, CvLabLearnedPattern } from '@/lib/types/cv-lab'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Brain, Target, AlertCircle, Star, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react'

interface FeedbackItem {
  id: string
  rating: number | null
  tags: string[] | null
  comment: string | null
  created_at: string
}

interface PromptEditorProps {
  activePrompt: CvLabPromptVersion | null
  versions: CvLabPromptVersion[]
  learnedPatterns: CvLabLearnedPattern[]
  performance: {
    topIssues: { tag: string; count: number }[]
    topStrengths: { tag: string; count: number }[]
    totalFeedback: number
  }
  recentFeedback: FeedbackItem[]
}

const patternTypeLabels: Record<string, string> = {
  avoid_phrase: 'Evitar',
  preferred_phrase: 'Preferir',
  format_rule: 'Formato',
  tone_preference: 'Tono'
}

const patternTypeColors: Record<string, string> = {
  avoid_phrase: 'bg-red-100 text-red-700 border-red-200',
  preferred_phrase: 'bg-green-100 text-green-700 border-green-200',
  format_rule: 'bg-blue-100 text-blue-700 border-blue-200',
  tone_preference: 'bg-purple-100 text-purple-700 border-purple-200'
}

const tagLabels: Record<string, string> = {
  too_verbose: 'Demasiado verboso',
  too_brief: 'Muy breve',
  good_metrics: 'Buenas métricas',
  invented_data: 'Datos inventados',
  good_format: 'Buen formato',
  bad_format: 'Mal formato',
  wrong_tone: 'Tono incorrecto',
  good_tone: 'Buen tono',
  helpful: 'Útil',
  not_helpful: 'Poco útil',
  accurate: 'Preciso',
  inaccurate: 'Impreciso'
}

export default function PromptEditor({
  activePrompt,
  versions,
  learnedPatterns,
  performance,
  recentFeedback
}: PromptEditorProps) {
  const [promptText, setPromptText] = useState(activePrompt?.system_prompt || '')
  const [changelog, setChangelog] = useState('')
  const [version, setVersion] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [currentActive, setCurrentActive] = useState(activePrompt)
  const [versionList, setVersionList] = useState(versions)

  const promptLength = promptText.length
  const positivePercentage = currentActive?.total_ratings
    ? Math.round((currentActive.positive_ratings / currentActive.total_ratings) * 100)
    : 0

  const formattedActiveDate = useMemo(() => {
    if (!currentActive?.created_at) return 'Sin fecha'
    return new Date(currentActive.created_at).toLocaleDateString('es', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }, [currentActive?.created_at])

  const handleSave = async () => {
    if (!promptText.trim()) {
      toast.error('El prompt no puede estar vacío.')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/cv-lab/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: promptText,
          changelog: changelog || null,
          version: version || null
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText)
      }

      const { prompt } = await response.json()
      setCurrentActive(prompt)
      setVersionList(prev => [prompt, ...prev.filter(p => p.id !== prompt.id)])
      setChangelog('')
      setVersion('')
      toast.success('Prompt actualizado y activado.')
    } catch (error) {
      console.error('Error saving prompt:', error)
      toast.error('No se pudo guardar el prompt.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleActivate = async (id: string) => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/cv-lab/prompt', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText)
      }

      const { prompt } = await response.json()
      setCurrentActive(prompt)
      setVersionList(prev => prev.map(p => ({ ...p, is_active: p.id === prompt.id })))
      toast.success('Prompt activado.')
    } catch (error) {
      console.error('Error activating prompt:', error)
      toast.error('No se pudo activar el prompt.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleLoad = (versionToLoad: CvLabPromptVersion) => {
    setPromptText(versionToLoad.system_prompt)
    toast.success(`Prompt ${versionToLoad.version} cargado en el editor.`)
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      {/* Learning Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-sm font-medium text-blue-900">Reglas Aprendidas</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{learnedPatterns.length}</div>
            <p className="text-xs text-blue-700 mt-1">Patrones activos con confianza &gt;50%</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <CardTitle className="text-sm font-medium text-green-900">Fortalezas</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{performance.topStrengths.length}</div>
            <p className="text-xs text-green-700 mt-1">Aspectos valorados positivamente</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-sm font-medium text-orange-900">Áreas de Mejora</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{performance.topIssues.length}</div>
            <p className="text-xs text-orange-700 mt-1">Feedback negativo identificado</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Main Editor */}
        <div className="space-y-6">
          <Card className="border-neutral-200">
            <CardHeader>
              <CardTitle className="text-lg">Editor de prompt</CardTitle>
              <CardDescription>
                Edita el prompt y guarda una nueva versión activa.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-neutral-500">{promptLength} caracteres</div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPromptText(currentActive?.system_prompt || '')}
                  disabled={!currentActive}
                >
                  Restaurar prompt activo
                </Button>
              </div>

              <Textarea
                value={promptText}
                onChange={(event) => setPromptText(event.target.value)}
                className="min-h-[420px] font-mono text-xs"
                placeholder="Escribe aquí el prompt del asistente..."
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-neutral-600">Versión (opcional)</label>
                  <Input
                    value={version}
                    onChange={(event) => setVersion(event.target.value)}
                    placeholder="v1.2"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-600">Changelog</label>
                  <Input
                    value={changelog}
                    onChange={(event) => setChangelog(event.target.value)}
                    placeholder="Describe el cambio principal"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-neutral-500">
                  Si la versión queda vacía, se autoincrementa.
                </p>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  {isSaving ? 'Guardando...' : 'Guardar y activar'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Learned Patterns */}
          <Card className="border-neutral-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">Reglas Aprendidas del Feedback</CardTitle>
              </div>
              <CardDescription>
                Estos patrones se agregan dinámicamente al prompt activo según el feedback de usuarios.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {learnedPatterns.length === 0 ? (
                <p className="text-sm text-neutral-500">
                  No hay patrones aprendidos aún. Los patrones se generan automáticamente del feedback.
                </p>
              ) : (
                <div className="space-y-2">
                  {learnedPatterns.map((pattern) => (
                    <div
                      key={pattern.id}
                      className={`rounded-lg border px-3 py-2 ${patternTypeColors[pattern.pattern_type] || 'bg-neutral-100 border-neutral-200'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {patternTypeLabels[pattern.pattern_type] || pattern.pattern_type}
                            </Badge>
                            <span className="text-xs font-medium">
                              Confianza: {Math.round(parseFloat(String(pattern.confidence)) * 100)}%
                            </span>
                          </div>
                          <p className="text-sm font-medium">{pattern.pattern}</p>
                          {pattern.category && pattern.category !== 'general' && (
                            <p className="text-xs mt-1 opacity-75">Categoría: {pattern.category}</p>
                          )}
                        </div>
                        <div className="text-xs text-neutral-500 shrink-0">
                          x{pattern.reinforcement_count}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Active Prompt Info */}
          <Card className="border-neutral-200">
            <CardHeader>
              <CardTitle className="text-lg">Prompt activo</CardTitle>
              <CardDescription>Versión actual y rendimiento.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentActive ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-neutral-900">{currentActive.version}</span>
                    <Badge variant="secondary">Activo</Badge>
                  </div>
                  <div className="text-xs text-neutral-500">{formattedActiveDate}</div>

                  {/* Rating Stats */}
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-600">Rating promedio</span>
                      <span className="font-semibold text-neutral-900 flex items-center gap-1">
                        {currentActive.avg_rating.toFixed(2)}
                        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-600">Total de votos</span>
                      <span className="font-semibold text-neutral-900">
                        {currentActive.total_ratings}
                      </span>
                    </div>
                    {currentActive.total_ratings > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-600">Feedback positivo</span>
                        <span className="font-semibold text-green-600">
                          {positivePercentage}%
                        </span>
                      </div>
                    )}
                  </div>

                  {currentActive.changelog && (
                    <div className="text-xs text-neutral-600 border rounded-md bg-neutral-50 px-2 py-1 mt-3">
                      {currentActive.changelog}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-neutral-500">No hay prompt activo.</p>
              )}
            </CardContent>
          </Card>

          {/* Performance Insights */}
          <Card className="border-green-200 bg-green-50/30">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <CardTitle className="text-sm">Fortalezas</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {performance.topStrengths.length === 0 ? (
                <p className="text-xs text-green-700">Sin datos aún</p>
              ) : (
                <div className="space-y-1">
                  {performance.topStrengths.map((item) => (
                    <div key={item.tag} className="flex items-center justify-between text-xs">
                      <span className="text-green-800">{tagLabels[item.tag] || item.tag}</span>
                      <Badge variant="secondary" className="text-xs bg-green-100">
                        {item.count}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50/30">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <CardTitle className="text-sm">Áreas de mejora</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {performance.topIssues.length === 0 ? (
                <p className="text-xs text-orange-700">Sin problemas reportados</p>
              ) : (
                <div className="space-y-1">
                  {performance.topIssues.map((item) => (
                    <div key={item.tag} className="flex items-center justify-between text-xs">
                      <span className="text-orange-800">{tagLabels[item.tag] || item.tag}</span>
                      <Badge variant="secondary" className="text-xs bg-orange-100">
                        {item.count}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Feedback */}
          <Card className="border-neutral-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">Feedback de Usuarios</CardTitle>
              </div>
              <CardDescription>Comentarios recientes de usuarios reales</CardDescription>
            </CardHeader>
            <CardContent>
              {recentFeedback.length === 0 ? (
                <p className="text-sm text-neutral-500">No hay feedback aún</p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {recentFeedback.map((fb) => (
                    <div
                      key={fb.id}
                      className={`p-3 rounded-lg border ${
                        (fb.rating || 3) >= 4
                          ? 'bg-green-50 border-green-200'
                          : (fb.rating || 3) <= 2
                          ? 'bg-red-50 border-red-200'
                          : 'bg-neutral-50 border-neutral-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {(fb.rating || 3) >= 4 ? (
                            <ThumbsUp className="h-4 w-4 text-green-600" />
                          ) : (fb.rating || 3) <= 2 ? (
                            <ThumbsDown className="h-4 w-4 text-red-600" />
                          ) : (
                            <Star className="h-4 w-4 text-amber-500" />
                          )}
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-3 w-3 ${
                                  star <= (fb.rating || 0)
                                    ? 'text-amber-500 fill-amber-500'
                                    : 'text-neutral-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-neutral-500">
                          {new Date(fb.created_at).toLocaleDateString('es', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      {fb.comment && (
                        <p className="text-sm text-neutral-700 mb-2">{fb.comment}</p>
                      )}
                      {fb.tags && fb.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {fb.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-xs"
                            >
                              {tagLabels[tag] || tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Version History */}
          <Card className="border-neutral-200">
            <CardHeader>
              <CardTitle className="text-lg">Versiones recientes</CardTitle>
              <CardDescription>Activa o carga una versión anterior.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {versionList.length === 0 && (
                <p className="text-sm text-neutral-500">No hay versiones disponibles.</p>
              )}
              {versionList.slice(0, 10).map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-neutral-200 p-3 bg-white"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-neutral-900">{item.version}</span>
                        {item.is_active && <Badge variant="secondary">Activo</Badge>}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {new Date(item.created_at).toLocaleDateString('es', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleLoad(item)}
                      >
                        Cargar
                      </Button>
                      {!item.is_active && (
                        <Button
                          size="sm"
                          onClick={() => handleActivate(item.id)}
                          disabled={isSaving}
                        >
                          Activar
                        </Button>
                      )}
                    </div>
                  </div>
                  {item.changelog && (
                    <p className="text-xs text-neutral-600 mt-2">{item.changelog}</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
