import type { CvJson, ReadinessBreakdown } from '@/lib/types/cv-lab'

// =============================================================================
// CV READINESS CALCULATOR
// Calculates how complete and ready a CV is for job applications
// =============================================================================

// Generic phrases that indicate weak content
const GENERIC_PHRASES = [
  'responsable de',
  'responsible for',
  'encargado de',
  'in charge of',
  'trabajé en',
  'worked on',
  'ayudé a',
  'helped with',
  'participé en',
  'participated in',
  'tareas incluyen',
  'tasks include',
  'duties include',
  'deberes incluyen'
]

// Strong action verbs that indicate impact-focused writing
const STRONG_VERBS = [
  'logré', 'achieved', 'alcancé',
  'aumenté', 'increased', 'incrementé',
  'reduje', 'reduced', 'disminuí',
  'implementé', 'implemented',
  'desarrollé', 'developed',
  'lideré', 'led', 'dirigí',
  'optimicé', 'optimized',
  'automaticé', 'automated',
  'diseñé', 'designed',
  'creé', 'created',
  'mejoré', 'improved',
  'lancé', 'launched',
  'negocié', 'negotiated',
  'gestioné', 'managed',
  'coordiné', 'coordinated'
]

// Metric patterns (numbers, percentages, currency)
const METRIC_PATTERNS = [
  /\d+%/,           // Percentages
  /\$[\d,]+/,       // Currency
  /\d+[kKmM]/,      // Abbreviated numbers
  /\d+\s*(usuarios|users|clientes|clients)/i,
  /\d+\s*(proyectos|projects)/i,
  /\d+\s*(meses|months|años|years)/i,
  /\d+x/i,          // Multipliers
]

/**
 * Calculate the readiness score for a CV
 * Returns a score from 0-100 and detailed breakdown
 */
export function calculateReadiness(cv: CvJson): ReadinessBreakdown {
  let score = 0
  const suggestions: string[] = []

  // Ensure cv has all required properties with defaults
  const header = cv.header || { fullName: '', headline: '', location: '', email: '', phone: '', links: [] }
  const summary = cv.summary || ''
  const experience = cv.experience || []
  const education = cv.education || []
  const skills = cv.skills || { hard: [], soft: [] }
  const keywords = cv.keywords || []

  // Check for summary (10 points)
  const hasSummary = summary.trim().length >= 50
  if (hasSummary) {
    score += 10
  } else {
    suggestions.push('Añade un resumen profesional de al menos 2-3 oraciones')
  }

  // Check for experience with bullets (20 points)
  const rolesWithBullets = experience.filter(exp => (exp.bullets || []).length >= 3)
  const hasExperience = rolesWithBullets.length >= 2
  if (hasExperience) {
    score += 20
  } else if (experience.length > 0) {
    score += 10
    suggestions.push('Añade al menos 3 logros por cada rol de experiencia')
  } else {
    suggestions.push('Añade experiencia laboral con logros específicos')
  }

  // Check for metrics in bullets (20 points)
  const allBullets = experience.flatMap(exp => exp.bullets || [])
  const bulletsWithMetrics = allBullets.filter(bullet =>
    METRIC_PATTERNS.some(pattern => pattern.test(bullet))
  )
  const hasMetrics = bulletsWithMetrics.length >= Math.min(allBullets.length * 0.5, 5)
  if (hasMetrics) {
    score += 20
  } else if (bulletsWithMetrics.length > 0) {
    score += 10
    suggestions.push('Añade más métricas cuantificables (%, $, números) a tus logros')
  } else {
    suggestions.push('Incluye métricas en tus logros (ej: "Aumenté ventas en 25%")')
  }

  // Check for skills aligned with target role (10 points)
  const hardSkills = skills.hard || []
  const softSkills = skills.soft || []
  const hasSkills = hardSkills.length >= 5 || softSkills.length >= 3
  if (hasSkills) {
    score += 10
  } else {
    suggestions.push('Añade más habilidades técnicas y blandas relevantes')
  }

  // Check for header completeness (10 points base + 2 bonus for phone)
  const headerComplete =
    (header.fullName || '').length > 0 &&
    (header.headline || '').length > 0 &&
    (header.email || '').length > 0 &&
    (header.location || '').length > 0
  if (headerComplete) {
    score += 10
  } else {
    suggestions.push('Completa tu información de contacto (nombre, título, email, ubicación)')
  }

  // Bonus for phone number (2 points)
  if (header.phone && header.phone.length > 0) {
    score += 2
  }

  // Check for education (5 points)
  const hasEducation = education.length >= 1
  if (hasEducation) {
    score += 5
  } else {
    suggestions.push('Añade tu formación académica')
  }

  // Check for keywords (5 points)
  const hasKeywords = keywords.length >= 5
  if (hasKeywords) {
    score += 5
  } else {
    suggestions.push('Añade palabras clave relevantes para ATS')
  }

  // Check for strong action verbs (10 points)
  const bulletsWithStrongVerbs = allBullets.filter(bullet =>
    STRONG_VERBS.some(verb => bullet.toLowerCase().includes(verb.toLowerCase()))
  )
  const hasStrongVerbs = bulletsWithStrongVerbs.length >= allBullets.length * 0.5
  if (hasStrongVerbs) {
    score += 10
  } else {
    suggestions.push('Usa verbos de acción más fuertes (logré, aumenté, implementé, lideré)')
  }

  // Penalty for generic text (-20 points max)
  const bulletsWithGenericText = allBullets.filter(bullet =>
    GENERIC_PHRASES.some(phrase => bullet.toLowerCase().includes(phrase.toLowerCase()))
  )
  const hasGenericText = bulletsWithGenericText.length >= 2
  if (hasGenericText) {
    score -= Math.min(20, bulletsWithGenericText.length * 5)
    suggestions.push('Evita frases genéricas como "responsable de" - enfócate en resultados')
  }

  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, score))

  return {
    score,
    details: {
      hasSummary,
      hasExperience,
      hasMetrics,
      hasSkills,
      hasGenericText
    },
    suggestions: suggestions.slice(0, 5) // Limit to top 5 suggestions
  }
}

/**
 * Get a label for the readiness score
 */
export function getReadinessLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Listo', color: 'green' }
  if (score >= 60) return { label: 'Casi listo', color: 'yellow' }
  if (score >= 40) return { label: 'En progreso', color: 'orange' }
  return { label: 'Incompleto', color: 'red' }
}

/**
 * Quick check if CV meets minimum requirements
 */
export function meetsMinimumRequirements(cv: CvJson): boolean {
  const header = cv.header || { fullName: '', email: '' }
  const experience = cv.experience || []

  return (
    (header.fullName || '').length > 0 &&
    (header.email || '').length > 0 &&
    experience.length >= 1 &&
    experience.some(exp => (exp.bullets || []).length >= 1)
  )
}
