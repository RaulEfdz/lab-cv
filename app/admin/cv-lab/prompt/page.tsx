import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AdminPageWrapper } from '@/components/admin/admin-page-wrapper'
import { Button } from '@/components/ui/button'
import PromptEditor from './prompt-editor'

export default async function CvLabPromptPage() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/admin/login')
  }

  // Verificar admin usando profiles.role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/admin/login')
  }

  const { data: activePrompt } = await supabase
    .from('cv_lab_prompt_versions')
    .select('*')
    .eq('is_active', true)
    .single()

  const { data: versions } = await supabase
    .from('cv_lab_prompt_versions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)

  // Get learned patterns
  const { data: learnedPatterns } = await supabase
    .from('cv_lab_learned_patterns')
    .select('*')
    .eq('is_active', true)
    .gte('confidence', 0.5)
    .order('confidence', { ascending: false })
    .limit(30)

  // Get feedback stats
  const { data: feedbackStats } = await supabase
    .from('cv_lab_feedback')
    .select('rating, tags')
    .order('created_at', { ascending: false })
    .limit(100)

  // Get recent feedback with comments
  const { data: recentFeedback } = await supabase
    .from('cv_lab_feedback')
    .select('id, rating, tags, comment, created_at')
    .order('created_at', { ascending: false })
    .limit(20)

  // Calculate performance metrics
  const tagCounts: Record<string, { positive: number; negative: number }> = {}
  feedbackStats?.forEach(f => {
    const isPositive = (f.rating || 3) >= 4
    ;(f.tags as string[])?.forEach(tag => {
      if (!tagCounts[tag]) tagCounts[tag] = { positive: 0, negative: 0 }
      if (isPositive) tagCounts[tag].positive++
      else tagCounts[tag].negative++
    })
  })

  const topIssues = Object.entries(tagCounts)
    .filter(([_, counts]) => counts.negative > counts.positive)
    .sort((a, b) => b[1].negative - a[1].negative)
    .slice(0, 5)
    .map(([tag, counts]) => ({ tag, count: counts.negative }))

  const topStrengths = Object.entries(tagCounts)
    .filter(([_, counts]) => counts.positive > counts.negative)
    .sort((a, b) => b[1].positive - a[1].positive)
    .slice(0, 5)
    .map(([tag, counts]) => ({ tag, count: counts.positive }))

  // Get training progress
  const { data: trainingProgress } = await supabase
    .from('cv_lab_training_progress')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Get training test stats
  const { data: trainingTests } = await supabase
    .from('cv_lab_training_tests')
    .select('level, passed')
    .order('created_at', { ascending: false })
    .limit(100)

  const passedTests = trainingTests?.filter(t => t.passed).length || 0
  const totalTests = trainingTests?.length || 0

  return (
    <AdminPageWrapper>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Prompt de CV Lab</h1>
            <p className="text-neutral-500 mt-1">
              Edita el prompt activo y administra versiones.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/cv-lab">Volver a CV Lab</Link>
          </Button>
        </div>

        {/* Training Level Progress */}
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                {trainingProgress?.current_level || 1}
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">Nivel de Entrenamiento</h3>
                <p className="text-sm text-gray-600">
                  {trainingProgress?.completed_levels?.length || 0} de 12 niveles completados
                </p>
              </div>
            </div>
            <a
              href="/admin/cv-lab/training"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
            >
              Ver Detalles →
            </a>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progreso Total</span>
              <span>{Math.round(((trainingProgress?.completed_levels?.length || 0) / 12) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all"
                style={{ width: `${((trainingProgress?.completed_levels?.length || 0) / 12) * 100}%` }}
              />
            </div>
          </div>

          {/* Level Indicators */}
          <div className="flex gap-1">
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(level => {
              const isCompleted = trainingProgress?.completed_levels?.includes(level)
              const isCurrent = trainingProgress?.current_level === level
              return (
                <div
                  key={level}
                  className={`flex-1 h-8 rounded flex items-center justify-center text-xs font-medium transition-all ${
                    isCompleted ? 'bg-green-500 text-white' :
                    isCurrent ? 'bg-blue-500 text-white ring-2 ring-blue-300' :
                    'bg-gray-200 text-gray-500'
                  }`}
                  title={`Nivel ${level}${isCompleted ? ' ✓' : isCurrent ? ' (Actual)' : ''}`}
                >
                  {isCompleted ? '✓' : level}
                </div>
              )
            })}
          </div>

          {/* Skills Learned */}
          {trainingProgress?.skills_learned?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-blue-200">
              <p className="text-xs font-medium text-gray-700 mb-2">Habilidades Aprendidas:</p>
              <div className="flex flex-wrap gap-1">
                {trainingProgress.skills_learned.slice(0, 8).map((skill: string) => (
                  <span key={skill} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                    ✓ {skill.replace(/_/g, ' ')}
                  </span>
                ))}
                {trainingProgress.skills_learned.length > 8 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    +{trainingProgress.skills_learned.length - 8} más
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Test Stats */}
          <div className="mt-4 pt-4 border-t border-blue-200 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{passedTests}</div>
              <div className="text-xs text-gray-500">Tests Pasados</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{totalTests}</div>
              <div className="text-xs text-gray-500">Tests Totales</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0}%
              </div>
              <div className="text-xs text-gray-500">Tasa de Éxito</div>
            </div>
          </div>
        </div>

        <PromptEditor
          activePrompt={activePrompt || null}
          versions={versions || []}
          learnedPatterns={learnedPatterns || []}
          performance={{
            topIssues,
            topStrengths,
            totalFeedback: feedbackStats?.length || 0
          }}
          recentFeedback={recentFeedback || []}
        />
      </div>
    </AdminPageWrapper>
  )
}
