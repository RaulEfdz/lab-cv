// =============================================================================
// OCTAVIA - CV Lab Agent Tools
// Herramientas que el agente Octavia puede usar para crear y mejorar CVs
// =============================================================================

import { z } from 'zod'
import type { CvJson } from '@/lib/types/cv-lab'
import { calculateReadiness } from './readiness'

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export interface AgentTool {
  name: string
  description: string
  parameters: z.ZodSchema
  execute: (params: any, context: ToolContext) => Promise<ToolResult>
}

export interface ToolContext {
  currentCv: CvJson
  sessionId: string
  language: 'es' | 'en'
}

export interface ToolResult {
  success: boolean
  data?: any
  error?: string
  cvUpdate?: Partial<CvJson>
}

// =============================================================================
// TOOL 1: update_cv_section
// Actualiza una sección específica del CV
// =============================================================================
export const updateCvSectionTool: AgentTool = {
  name: 'update_cv_section',
  description: 'Actualiza una sección específica del CV con nueva información proporcionada por el usuario',
  parameters: z.object({
    section: z.enum(['header', 'summary', 'experience', 'education', 'skills', 'certifications']),
    data: z.record(z.any())
  }),
  execute: async (params, context) => {
    const { section, data } = params
    const cvUpdate: Partial<CvJson> = {}

    switch (section) {
      case 'header':
        cvUpdate.header = { ...context.currentCv.header, ...data }
        break
      case 'summary':
        cvUpdate.summary = data.summary || data
        break
      case 'experience':
        cvUpdate.experience = data.experience || data
        break
      case 'education':
        cvUpdate.education = data.education || data
        break
      case 'skills':
        cvUpdate.skills = data.skills || data
        break
      case 'certifications':
        cvUpdate.certifications = data.certifications || data
        break
    }

    return {
      success: true,
      data: { section, updated: true },
      cvUpdate
    }
  }
}

// =============================================================================
// TOOL 2: calculate_cv_score
// Calcula el score de preparación del CV
// =============================================================================
export const calculateCvScoreTool: AgentTool = {
  name: 'calculate_cv_score',
  description: 'Calcula el score de preparación (readiness) del CV actual y devuelve sugerencias de mejora',
  parameters: z.object({}),
  execute: async (params, context) => {
    const readiness = calculateReadiness(context.currentCv)

    return {
      success: true,
      data: {
        score: readiness.score,
        suggestions: readiness.suggestions,
        breakdown: readiness.breakdown
      }
    }
  }
}

// =============================================================================
// TOOL 3: format_achievement_bullet
// Formatea un logro en formato STAR con verbos de acción
// =============================================================================
export const formatAchievementBulletTool: AgentTool = {
  name: 'format_achievement_bullet',
  description: 'Convierte un logro del usuario en un bullet point profesional formato STAR con métricas',
  parameters: z.object({
    situation: z.string().describe('El contexto o problema inicial'),
    task: z.string().describe('La tarea asignada'),
    action: z.string().describe('Las acciones específicas realizadas'),
    result: z.string().describe('El resultado cuantificable (%, $, tiempo, etc.)'),
    verb: z.string().optional().describe('Verbo de acción preferido (opcional)')
  }),
  execute: async (params, context) => {
    const { situation, task, action, result, verb } = params

    // Lista de verbos de acción fuertes
    const actionVerbs = {
      es: ['Lideré', 'Implementé', 'Desarrollé', 'Optimicé', 'Reduje', 'Aumenté', 'Diseñé', 'Automaticé', 'Gestioné', 'Coordiné'],
      en: ['Led', 'Implemented', 'Developed', 'Optimized', 'Reduced', 'Increased', 'Designed', 'Automated', 'Managed', 'Coordinated']
    }

    const selectedVerb = verb || actionVerbs[context.language][Math.floor(Math.random() * actionVerbs[context.language].length)]

    // Formato STAR compacto para CV
    const bullet = `${selectedVerb} ${action.toLowerCase()}, ${result.includes('%') || result.includes('$') ? result : `logrando ${result}`}`

    return {
      success: true,
      data: {
        bullet,
        format: 'STAR',
        components: { situation, task, action, result }
      }
    }
  }
}

// =============================================================================
// TOOL 4: suggest_ats_keywords
// Sugiere keywords para optimización ATS basado en el puesto objetivo
// =============================================================================
export const suggestAtsKeywordsTool: AgentTool = {
  name: 'suggest_ats_keywords',
  description: 'Analiza el puesto objetivo y sugiere keywords para optimizar el CV para sistemas ATS',
  parameters: z.object({
    targetRole: z.string().describe('El puesto objetivo (ej: "Frontend Developer")'),
    jobDescription: z.string().optional().describe('Descripción del puesto si está disponible')
  }),
  execute: async (params, context) => {
    const { targetRole, jobDescription } = params

    // Keywords comunes por tipo de rol
    const keywordsByRole: Record<string, string[]> = {
      'frontend': ['React', 'TypeScript', 'JavaScript', 'CSS', 'HTML', 'Redux', 'Next.js', 'Tailwind', 'responsive design', 'UI/UX'],
      'backend': ['Node.js', 'Python', 'Java', 'SQL', 'PostgreSQL', 'MongoDB', 'REST API', 'microservices', 'Docker', 'AWS'],
      'fullstack': ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'MongoDB', 'REST API', 'Docker', 'AWS', 'CI/CD', 'Git'],
      'data': ['Python', 'SQL', 'Tableau', 'Power BI', 'Machine Learning', 'Data Analysis', 'Excel', 'Statistics', 'ETL', 'Big Data'],
      'product': ['Agile', 'Scrum', 'Roadmap', 'User Research', 'A/B Testing', 'Metrics', 'Stakeholder Management', 'Jira', 'PRD'],
      'devops': ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Terraform', 'Jenkins', 'Linux', 'Monitoring', 'Infrastructure', 'Security'],
      'default': ['Leadership', 'Communication', 'Problem-solving', 'Team collaboration', 'Project management']
    }

    // Detectar tipo de rol
    const roleLower = targetRole.toLowerCase()
    let keywords: string[] = []

    for (const [roleType, kws] of Object.entries(keywordsByRole)) {
      if (roleLower.includes(roleType)) {
        keywords = [...keywords, ...kws]
      }
    }

    if (keywords.length === 0) {
      keywords = keywordsByRole['default']
    }

    // Extraer keywords del job description si está disponible
    if (jobDescription) {
      const techWords = jobDescription.match(/\b[A-Z][a-zA-Z.]+\b/g) || []
      const uniqueTech = [...new Set(techWords)].filter(w => w.length > 2)
      keywords = [...keywords, ...uniqueTech.slice(0, 10)]
    }

    // Eliminar duplicados
    keywords = [...new Set(keywords)]

    return {
      success: true,
      data: {
        targetRole,
        suggestedKeywords: keywords.slice(0, 15),
        priority: 'Include these keywords naturally in your experience bullets and skills section'
      }
    }
  }
}

// =============================================================================
// TOOL 5: validate_cv_section
// Valida que una sección del CV esté completa y bien formateada
// =============================================================================
export const validateCvSectionTool: AgentTool = {
  name: 'validate_cv_section',
  description: 'Valida que una sección del CV esté completa y cumpla con estándares profesionales',
  parameters: z.object({
    section: z.enum(['header', 'summary', 'experience', 'education', 'skills'])
  }),
  execute: async (params, context) => {
    const { section } = params
    const cv = context.currentCv
    const issues: string[] = []
    const suggestions: string[] = []

    switch (section) {
      case 'header':
        if (!cv.header.fullName) issues.push('Falta nombre completo')
        if (!cv.header.email) issues.push('Falta email')
        if (!cv.header.headline) suggestions.push('Añade un título profesional')
        if (!cv.header.location) suggestions.push('Añade ubicación')
        if (!cv.header.phone) suggestions.push('Añade teléfono')
        break

      case 'summary':
        if (!cv.summary) {
          issues.push('Falta resumen profesional')
        } else if (cv.summary.length < 100) {
          suggestions.push('El resumen es muy corto (mínimo 100 caracteres)')
        } else if (cv.summary.length > 500) {
          suggestions.push('El resumen es muy largo (máximo 500 caracteres)')
        }
        break

      case 'experience':
        if (cv.experience.length === 0) {
          issues.push('No hay experiencia laboral')
        } else {
          cv.experience.forEach((exp, i) => {
            if (exp.bullets.length < 3) {
              suggestions.push(`Experiencia ${i + 1}: añade más logros (mínimo 3)`)
            }
            const hasMetrics = exp.bullets.some(b => /\d+%|\$\d+|\d+\s*(años|meses|horas|proyectos|personas)/i.test(b))
            if (!hasMetrics) {
              suggestions.push(`Experiencia ${i + 1}: añade métricas cuantificables`)
            }
          })
        }
        break

      case 'education':
        if (cv.education.length === 0) {
          suggestions.push('Considera añadir educación')
        }
        break

      case 'skills':
        if (cv.skills.hard.length < 5) {
          suggestions.push('Añade más habilidades técnicas (mínimo 5)')
        }
        if (cv.skills.soft.length === 0) {
          suggestions.push('Añade habilidades blandas')
        }
        break
    }

    return {
      success: true,
      data: {
        section,
        isValid: issues.length === 0,
        issues,
        suggestions,
        completeness: issues.length === 0 ? 100 : Math.max(0, 100 - issues.length * 25)
      }
    }
  }
}

// =============================================================================
// TOOL 6: generate_summary
// Genera un resumen profesional basado en la experiencia del CV
// =============================================================================
export const generateSummaryTool: AgentTool = {
  name: 'generate_summary',
  description: 'Genera un resumen profesional optimizado basado en la experiencia y skills del CV',
  parameters: z.object({
    targetRole: z.string().describe('El puesto objetivo'),
    yearsExperience: z.number().describe('Años de experiencia'),
    keyStrengths: z.array(z.string()).describe('Fortalezas principales a destacar')
  }),
  execute: async (params, context) => {
    const { targetRole, yearsExperience, keyStrengths } = params
    const { currentCv, language } = context

    // Extraer skills y experiencia del CV actual
    const topSkills = currentCv.skills.hard.slice(0, 5)
    const topCompanies = currentCv.experience.slice(0, 2).map(e => e.company)

    const templates = {
      es: `${targetRole} con ${yearsExperience}+ años de experiencia${topCompanies.length ? ` en empresas como ${topCompanies.join(' y ')}` : ''}. Especializado en ${topSkills.join(', ')}. ${keyStrengths.slice(0, 2).join('. ')}.`,
      en: `${targetRole} with ${yearsExperience}+ years of experience${topCompanies.length ? ` at companies like ${topCompanies.join(' and ')}` : ''}. Specialized in ${topSkills.join(', ')}. ${keyStrengths.slice(0, 2).join('. ')}.`
    }

    return {
      success: true,
      data: {
        summary: templates[language],
        wordCount: templates[language].split(' ').length
      },
      cvUpdate: {
        summary: templates[language]
      }
    }
  }
}

// =============================================================================
// REGISTRY: Todas las herramientas disponibles
// =============================================================================
export const OCTAVIA_TOOLS: AgentTool[] = [
  updateCvSectionTool,
  calculateCvScoreTool,
  formatAchievementBulletTool,
  suggestAtsKeywordsTool,
  validateCvSectionTool,
  generateSummaryTool
]

export function getToolByName(name: string): AgentTool | undefined {
  return OCTAVIA_TOOLS.find(t => t.name === name)
}

export function getToolsForOpenAI() {
  return OCTAVIA_TOOLS.map(tool => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: 'object',
        properties: Object.fromEntries(
          Object.entries((tool.parameters as z.ZodObject<any>).shape || {}).map(([key, schema]) => [
            key,
            { type: 'string', description: (schema as any)._def?.description || key }
          ])
        )
      }
    }
  }))
}
