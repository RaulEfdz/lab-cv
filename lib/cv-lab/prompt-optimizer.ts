import { createClient } from '@/lib/supabase/server'
import type { CvLabLearnedPattern, CvLabPromptVersion } from '@/lib/types/cv-lab'
import type { SupabaseClient } from '@supabase/supabase-js'

// =============================================================================
// PROMPT OPTIMIZER
// Dynamically improves prompts based on user feedback
// =============================================================================

/**
 * Get the active system prompt enhanced with learned patterns
 * Throws error if no active prompt exists in database
 * @param supabaseClient - Optional Supabase client (for service role access in training API)
 */
export async function getOptimizedPrompt(supabaseClient?: SupabaseClient): Promise<string> {
  const supabase = supabaseClient || await createClient()

  // Get active prompt version
  const { data: activePrompt, error } = await supabase
    .from('cv_lab_prompt_versions')
    .select('*')
    .eq('is_active', true)
    .single()

  if (error || !activePrompt) {
    throw new Error('No active prompt found in database. Please activate a prompt version in /admin/cv-lab/prompt')
  }

  const basePrompt = activePrompt.system_prompt

  // Get active learned patterns
  const { data: patterns } = await supabase
    .from('cv_lab_learned_patterns')
    .select('*')
    .eq('is_active', true)
    .gte('confidence', 0.5)
    .order('confidence', { ascending: false })
    .limit(20)

  if (!patterns || patterns.length === 0) {
    return basePrompt
  }

  // Build dynamic rules from patterns
  const dynamicRules = buildDynamicRules(patterns as CvLabLearnedPattern[])

  // Append learned rules to base prompt
  return `${basePrompt}

## REGLAS APRENDIDAS (basadas en feedback del usuario):
${dynamicRules}
`
}

/**
 * Build dynamic rules string from learned patterns
 */
function buildDynamicRules(patterns: CvLabLearnedPattern[]): string {
  const rules: string[] = []

  // Group patterns by type
  const avoidPhrases = patterns.filter(p => p.pattern_type === 'avoid_phrase')
  const preferredPhrases = patterns.filter(p => p.pattern_type === 'preferred_phrase')
  const formatRules = patterns.filter(p => p.pattern_type === 'format_rule')
  const tonePreferences = patterns.filter(p => p.pattern_type === 'tone_preference')

  // Add avoid phrases
  if (avoidPhrases.length > 0) {
    rules.push('### EVITAR (comportamientos negativos detectados):')
    avoidPhrases.forEach(p => {
      const confidence = Math.round(p.confidence * 100)
      rules.push(`- ${patternToRule(p)} [${confidence}% confianza, reforzado ${p.reinforcement_count}x]`)
    })
  }

  // Add preferred phrases
  if (preferredPhrases.length > 0) {
    rules.push('\n### PREFERIR (comportamientos positivos):')
    preferredPhrases.forEach(p => {
      const confidence = Math.round(p.confidence * 100)
      rules.push(`- ${patternToRule(p)} [${confidence}% confianza, reforzado ${p.reinforcement_count}x]`)
    })
  }

  // Add format rules
  if (formatRules.length > 0) {
    rules.push('\n### FORMATO (reglas de estructura):')
    formatRules.forEach(p => {
      const confidence = Math.round(p.confidence * 100)
      rules.push(`- ${patternToRule(p)} [${confidence}% confianza]`)
    })
  }

  // Add tone preferences
  if (tonePreferences.length > 0) {
    rules.push('\n### TONO (preferencias de comunicación):')
    tonePreferences.forEach(p => {
      const confidence = Math.round(p.confidence * 100)
      rules.push(`- ${patternToRule(p)} [${confidence}% confianza]`)
    })
  }

  return rules.join('\n')
}

/**
 * Convert a pattern to a detailed rule with examples
 * Uses learned_instruction from database if available, otherwise falls back to defaults
 */
function patternToRule(pattern: CvLabLearnedPattern): string {
  // If pattern has learned instruction from feedback, use it
  if (pattern.learned_instruction) {
    return pattern.learned_instruction
  }

  // Enhanced default rules with examples
  const ruleMap: Record<string, string> = {
    'too_verbose': 'Ser más conciso. Hacer UNA pregunta a la vez. Máximo 3-4 párrafos por respuesta. Ejemplo: En vez de listar 10 preguntas, preguntar solo la más importante primero.',
    'too_brief': 'Proporcionar respuestas más detalladas. Incluir ejemplos concretos. Explicar el "por qué" además del "qué".',
    'good_metrics': 'SIEMPRE pedir métricas cuantificables para logros: porcentajes (%), dinero ($), números (#), tiempo. Ejemplo: "¿En qué porcentaje mejoraron las ventas? ¿Cuánto dinero adicional generó? ¿En cuánto tiempo?"',
    'invented_data': 'PROHIBIDO inventar información. Si el usuario dice "trabajé en una empresa", NO asumir el nombre. SIEMPRE preguntar: "¿Cuál es el nombre de la empresa? ¿En qué fechas trabajaste?"',
    'good_format': 'Usar formato estructurado: bullets para listas, ```cv_update para JSON del CV. Incluir Readiness Score después de cada actualización.',
    'bad_format': 'Mejorar estructura: usar bullets claros, separar secciones, incluir JSON de actualización al final.',
    'wrong_tone': 'Tono profesional pero cálido. Evitar ser demasiado formal o casual. Celebrar logros brevemente ("¡Excelente!") sin excesos.',
    'good_tone': 'Mantener tono actual: profesional, directo, empático. Una pregunta a la vez.',
    'helpful': 'Proporcionar sugerencias específicas y accionables. Dar ejemplos concretos de cómo redactar bullets. Ofrecer alternativas.',
    'not_helpful': 'Mejorar utilidad: en vez de consejos genéricos, dar ejemplos específicos. Preguntar qué necesita el usuario.',
    'accurate': 'Usar solo información proporcionada por el usuario. Verificar datos antes de incluirlos.',
    'inaccurate': 'Confirmar información con el usuario antes de agregarla al CV. No asumir.',
    'ask_one_question': 'Hacer UNA sola pregunta por mensaje para no abrumar al usuario.',
    'confirm_before_add': 'Siempre confirmar con el usuario antes de agregar información al CV.',
    'celebrate_progress': 'Celebrar avances del usuario brevemente: "✓ Agregado" o "¡Buen logro!"'
  }

  return ruleMap[pattern.pattern] || pattern.pattern
}


/**
 * Create a new prompt version based on accumulated feedback
 */
export async function createOptimizedPromptVersion(): Promise<CvLabPromptVersion | null> {
  const supabase = await createClient()

  // Get current active version
  const { data: currentVersion } = await supabase
    .from('cv_lab_prompt_versions')
    .select('*')
    .eq('is_active', true)
    .single()

  if (!currentVersion) return null

  // Get high-confidence patterns
  const { data: patterns } = await supabase
    .from('cv_lab_learned_patterns')
    .select('*')
    .eq('is_active', true)
    .gte('confidence', 0.7)
    .order('confidence', { ascending: false })

  if (!patterns || patterns.length === 0) {
    return null // No changes to make
  }

  // Build new prompt
  const newPrompt = await getOptimizedPrompt()

  // Calculate new version number
  const versionParts = currentVersion.version.split('.')
  const minor = parseInt(versionParts[1] || '0') + 1
  const newVersion = `v${versionParts[0]?.replace('v', '') || '1'}.${minor}`

  // Deactivate current version
  await supabase
    .from('cv_lab_prompt_versions')
    .update({ is_active: false })
    .eq('id', currentVersion.id)

  // Create new version
  const { data: newVersionData, error } = await supabase
    .from('cv_lab_prompt_versions')
    .insert({
      version: newVersion,
      system_prompt: newPrompt,
      is_active: true,
      changelog: `Incorporadas ${patterns.length} reglas aprendidas del feedback del usuario`
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating new prompt version:', error)
    // Reactivate old version
    await supabase
      .from('cv_lab_prompt_versions')
      .update({ is_active: true })
      .eq('id', currentVersion.id)
    return null
  }

  return newVersionData as CvLabPromptVersion
}

/**
 * Get feedback summary for the active prompt
 */
export async function getPromptPerformance(): Promise<{
  version: string
  avgRating: number
  totalRatings: number
  positivePercentage: number
  topIssues: string[]
  topStrengths: string[]
}> {
  const supabase = await createClient()

  const { data: activePrompt } = await supabase
    .from('cv_lab_prompt_versions')
    .select('*')
    .eq('is_active', true)
    .single()

  if (!activePrompt) {
    return {
      version: 'v1.0',
      avgRating: 0,
      totalRatings: 0,
      positivePercentage: 0,
      topIssues: [],
      topStrengths: []
    }
  }

  // Get recent feedback
  const { data: recentFeedback } = await supabase
    .from('cv_lab_feedback')
    .select('tags, rating')
    .order('created_at', { ascending: false })
    .limit(100)

  // Count positive vs negative tags
  const tagCounts: Record<string, { positive: number; negative: number }> = {}

  recentFeedback?.forEach(f => {
    const isPositive = (f.rating || 3) >= 4
    ;(f.tags as string[])?.forEach(tag => {
      if (!tagCounts[tag]) {
        tagCounts[tag] = { positive: 0, negative: 0 }
      }
      if (isPositive) {
        tagCounts[tag].positive++
      } else {
        tagCounts[tag].negative++
      }
    })
  })

  const topIssues = Object.entries(tagCounts)
    .filter(([_, counts]) => counts.negative > counts.positive)
    .sort((a, b) => b[1].negative - a[1].negative)
    .slice(0, 5)
    .map(([tag]) => tag)

  const topStrengths = Object.entries(tagCounts)
    .filter(([_, counts]) => counts.positive > counts.negative)
    .sort((a, b) => b[1].positive - a[1].positive)
    .slice(0, 5)
    .map(([tag]) => tag)

  return {
    version: activePrompt.version,
    avgRating: activePrompt.avg_rating,
    totalRatings: activePrompt.total_ratings,
    positivePercentage: activePrompt.total_ratings > 0
      ? (activePrompt.positive_ratings / activePrompt.total_ratings) * 100
      : 0,
    topIssues,
    topStrengths
  }
}
