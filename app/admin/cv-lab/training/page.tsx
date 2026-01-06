import { createClient } from '@/lib/supabase/server'
import { TRAINING_LEVELS } from '@/lib/cv-lab/training-levels'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft, Trophy, Target, Brain, CheckCircle2, Lock, PlayCircle, Star } from 'lucide-react'

export default async function TrainingPage() {
  const supabase = await createClient()

  // Get training progress
  const { data: progress } = await supabase
    .from('cv_lab_training_progress')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Get learned patterns
  const { data: patterns } = await supabase
    .from('cv_lab_learned_patterns')
    .select('*')
    .eq('is_active', true)
    .gte('confidence', 0.5)
    .order('confidence', { ascending: false })

  // Get test results
  const { data: tests } = await supabase
    .from('cv_lab_training_tests')
    .select('level, passed, score')
    .order('created_at', { ascending: false })
    .limit(50)

  const currentLevel = progress?.current_level || 1
  const completedLevels = progress?.completed_levels || []
  const skillsLearned = progress?.skills_learned || []
  const totalScore = progress?.total_score || 0

  // Calculate stats
  const passedTests = tests?.filter(t => t.passed).length || 0
  const totalTests = tests?.length || 0
  const overallProgress = Math.round((completedLevels.length / TRAINING_LEVELS.length) * 100)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin/cv-lab" className="flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a CV Lab
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">🎓 Entrenamiento del AI</h1>
          <p className="text-gray-600 mt-2">Sistema de 10 niveles para entrenar y mejorar el asistente de CV</p>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-900 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Nivel Actual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-blue-600">{currentLevel}</div>
              <p className="text-xs text-blue-700 mt-1">de 10 niveles</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-900 flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Progreso Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-600">{overallProgress}%</div>
              <p className="text-xs text-green-700 mt-1">{completedLevels.length} niveles completados</p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-900 flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Patrones Aprendidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-purple-600">{patterns?.length || 0}</div>
              <p className="text-xs text-purple-700 mt-1">reglas activas</p>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-900 flex items-center gap-2">
                <Star className="h-4 w-4" />
                Tests Pasados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-orange-600">{passedTests}/{totalTests}</div>
              <p className="text-xs text-orange-700 mt-1">escenarios completados</p>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progreso de Entrenamiento</span>
              <span className="text-sm text-gray-500">{overallProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-gradient-to-r from-blue-500 to-green-500 h-4 rounded-full transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>Nivel 1</span>
              <span>Nivel 5</span>
              <span>Nivel 10</span>
            </div>
          </CardContent>
        </Card>

        {/* Levels Grid */}
        <h2 className="text-xl font-bold mb-4">Niveles de Entrenamiento</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {TRAINING_LEVELS.map((level) => {
            const isCompleted = completedLevels.includes(level.level)
            const isCurrent = currentLevel === level.level
            const isLocked = level.level > currentLevel && !isCompleted

            return (
              <Card
                key={level.level}
                className={`relative overflow-hidden transition-all ${
                  isCompleted ? 'border-green-300 bg-green-50/30' :
                  isCurrent ? 'border-blue-300 bg-blue-50/30 ring-2 ring-blue-400' :
                  isLocked ? 'border-gray-200 bg-gray-50/50 opacity-60' :
                  'border-gray-200'
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                        isCompleted ? 'bg-green-500 text-white' :
                        isCurrent ? 'bg-blue-500 text-white' :
                        'bg-gray-200 text-gray-500'
                      }`}>
                        {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : level.level}
                      </div>
                      <div>
                        <CardTitle className="text-base">{level.name}</CardTitle>
                        <p className="text-xs text-gray-500">Score requerido: {level.requiredScore}%</p>
                      </div>
                    </div>
                    {isLocked && <Lock className="h-5 w-5 text-gray-400" />}
                    {isCurrent && <PlayCircle className="h-5 w-5 text-blue-500" />}
                    {isCompleted && (
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                        ✓ Completado
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">{level.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {level.skills.map((skill) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className={`text-xs ${
                          skillsLearned.includes(skill) ? 'bg-green-100 text-green-700' : ''
                        }`}
                      >
                        {skillsLearned.includes(skill) && '✓ '}
                        {skill.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-3 text-xs text-gray-500">
                    {level.scenarios.length} escenarios de prueba
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Skills Learned */}
        {skillsLearned.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-500" />
                Habilidades Aprendidas ({skillsLearned.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {skillsLearned.map((skill) => (
                  <Badge key={skill} className="bg-purple-100 text-purple-700 border-purple-300">
                    ✓ {skill.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Learned Patterns */}
        {patterns && patterns.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-500" />
                Patrones Aprendidos del Entrenamiento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {patterns.slice(0, 10).map((pattern: any) => (
                  <div key={pattern.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className={pattern.pattern_type === 'avoid_phrase' ? 'border-red-300 text-red-700' : 'border-green-300 text-green-700'}
                      >
                        {pattern.pattern_type === 'avoid_phrase' ? 'Evitar' : 'Preferir'}
                      </Badge>
                      <span className="font-medium">{pattern.pattern.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">x{pattern.reinforcement_count}</span>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            pattern.confidence >= 0.8 ? 'bg-green-500' :
                            pattern.confidence >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${pattern.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12">{Math.round(pattern.confidence * 100)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Training Instructions */}
        <Card className="mt-8 border-blue-200 bg-blue-50/30">
          <CardHeader>
            <CardTitle>🎯 Cómo Funciona el Entrenamiento</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-700 space-y-2">
            <p>1. <strong>Cada nivel</strong> tiene escenarios específicos que el AI debe pasar</p>
            <p>2. <strong>Al entrenar</strong>, se envían mensajes al AI y se evalúan sus respuestas</p>
            <p>3. <strong>El feedback</strong> actualiza los patrones aprendidos automáticamente</p>
            <p>4. <strong>Para avanzar</strong>, el AI debe alcanzar el score requerido en cada nivel</p>
            <p>5. <strong>Las habilidades</strong> se desbloquean al completar cada nivel</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
