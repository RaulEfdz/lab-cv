import { createOpenAI } from '@ai-sdk/openai'
import { streamText, generateText, generateObject } from 'ai'
import { z } from 'zod'
import type { CvJson, CvLabMessage, CvUpdateResult } from '@/lib/types/cv-lab'
import { calculateReadiness } from './readiness'
import { getOptimizedPrompt } from './prompt-optimizer'
import type { SupabaseClient } from '@supabase/supabase-js'

// =============================================================================
// AI ENGINE FOR CV LAB
// Integrates with OpenAI GPT-5 for CV creation and editing
// Optimized for Structured Outputs and improved tool calling
// =============================================================================

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

// Model to use (configurable via env) - GPT-5 mini recommended
const MODEL = process.env.OPENAI_MODEL || 'gpt-5-mini'

// =============================================================================
// STRUCTURED OUTPUT SCHEMAS (for guaranteed JSON responses)
// =============================================================================

// Schema for CV updates - guarantees valid JSON structure
const CvUpdateSchema = z.object({
  action: z.enum(['update_section', 'full_update']),
  section: z.enum(['header', 'summary', 'experience', 'education', 'skills', 'certifications']).optional(),
  header: z.object({
    fullName: z.string().optional(),
    headline: z.string().optional(),
    location: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    links: z.array(z.object({
      label: z.string(),
      url: z.string()
    })).optional()
  }).optional(),
  summary: z.string().optional(),
  experience: z.array(z.object({
    id: z.string(),
    company: z.string(),
    role: z.string(),
    startDate: z.string(),
    endDate: z.string().nullable(),
    location: z.string(),
    bullets: z.array(z.string())
  })).optional(),
  education: z.array(z.object({
    id: z.string(),
    institution: z.string(),
    degree: z.string(),
    field: z.string().optional(),
    dates: z.string(),
    gpa: z.string().optional()
  })).optional(),
  skills: z.object({
    hard: z.array(z.string()),
    soft: z.array(z.string())
  }).optional(),
  certifications: z.array(z.object({
    id: z.string(),
    name: z.string(),
    issuer: z.string(),
    date: z.string().optional(),
    url: z.string().optional()
  })).optional(),
  keywords: z.array(z.string()).optional(),
  readinessScore: z.number().min(0).max(100),
  feedback: z.string()
})

// =============================================================================
// SYSTEM PROMPT - Now loaded from database via getOptimizedPrompt()
// No hardcoded fallback - ensures all prompts are managed through admin panel
// =============================================================================

/**
 * Stream a chat response from GPT-5
 * Uses optimized prompt from database with learned patterns
 * @param supabaseClient - Optional Supabase client (for service role access in training API)
 */
export async function streamCvChat(
  messages: CvLabMessage[],
  currentCv: CvJson | null,
  supabaseClient?: SupabaseClient
) {
  // Get optimized prompt from database (with learned patterns from feedback)
  const systemPrompt = await getOptimizedPrompt(supabaseClient)
  console.log('CV Lab AI Engine - Using optimized prompt from database with learned patterns')

  // Build context message with current CV state
  let contextMessage = ''
  if (currentCv) {
    const readiness = calculateReadiness(currentCv)
    contextMessage = `
## ESTADO ACTUAL DEL CV:
Readiness Score: ${readiness.score}/100
${readiness.suggestions.length > 0 ? `Sugerencias pendientes: ${readiness.suggestions.join(', ')}` : 'Sin sugerencias pendientes.'}

\`\`\`json
${JSON.stringify(currentCv, null, 2)}
\`\`\`

IMPORTANTE: Si haces cambios al CV, responde SOLO con un JSON válido que siga el schema de actualización. Si solo conversas o haces preguntas, responde en texto normal.
`
  } else {
    contextMessage = '\n## CV VACÍO - Inicia preguntando al usuario sobre el puesto objetivo y su experiencia.'
  }

  // Convert messages to AI SDK format
  const aiMessages = messages.map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content
  }))

  console.log('CV Lab AI Engine - Using model:', MODEL)
  console.log('CV Lab AI Engine - API Key exists:', !!process.env.OPENAI_API_KEY)

  const result = streamText({
    model: openai(MODEL),
    system: systemPrompt + contextMessage,
    messages: aiMessages,
    maxTokens: 4096,
    temperature: 0.7
  })

  return result
}

/**
 * Generate a structured CV update using GPT-5's Structured Outputs
 * Guarantees valid JSON that matches our schema
 */
export async function generateStructuredCvUpdate(
  userMessage: string,
  currentCv: CvJson,
  conversationContext: string = ''
): Promise<CvUpdateResult> {
  const readiness = calculateReadiness(currentCv)

  const prompt = `
Contexto de la conversación:
${conversationContext}

Estado actual del CV (readiness: ${readiness.score}/100):
${JSON.stringify(currentCv, null, 2)}

Mensaje del usuario:
${userMessage}

Genera una actualización estructurada del CV basada en la información proporcionada.
- Si el usuario proporciona nueva información, inclúyela en la sección correspondiente
- Calcula el nuevo readinessScore
- Proporciona feedback sobre los cambios realizados
- NO inventes información que el usuario no haya proporcionado
`

  // Get optimized prompt from database
  const systemPrompt = await getOptimizedPrompt()

  const result = await generateObject({
    model: openai(MODEL),
    schema: CvUpdateSchema,
    prompt,
    system: systemPrompt
  })

  // Convert to CvUpdateResult format
  const update = result.object
  return {
    action: update.action,
    section: update.section,
    data: {
      header: update.header ? {
        fullName: update.header.fullName || '',
        headline: update.header.headline || '',
        location: update.header.location || '',
        email: update.header.email || '',
        phone: update.header.phone || '',
        links: update.header.links || []
      } : undefined,
      summary: update.summary,
      experience: update.experience,
      education: update.education,
      skills: update.skills,
      certifications: update.certifications,
      keywords: update.keywords
    },
    readinessScore: update.readinessScore,
    feedback: update.feedback
  }
}

/**
 * Extract CV update from AI response (fallback for streaming)
 * Tries multiple JSON extraction patterns
 */
export function extractCvUpdate(response: string): CvUpdateResult | null {
  // Try cv_update block first
  let match = response.match(/```cv_update\n([\s\S]*?)\n```/)

  // Try json block
  if (!match) {
    match = response.match(/```json\n([\s\S]*?)\n```/)
  }

  // Try raw JSON (if response is just JSON)
  if (!match && response.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(response.trim())

      // Format 1: Standard cv_update format with action/readinessScore
      if (parsed.action && parsed.readinessScore !== undefined) {
        return {
          action: parsed.action || 'update_section',
          section: parsed.section,
          data: {
            header: parsed.header,
            summary: parsed.summary,
            experience: parsed.experience,
            education: parsed.education,
            skills: parsed.skills,
            certifications: parsed.certifications,
            keywords: parsed.keywords
          },
          readinessScore: parsed.readinessScore || 0,
          feedback: parsed.feedback || ''
        }
      }

      // Format 2: Direct CvJson format (header, summary, experience, etc.)
      if (parsed.header || parsed.summary || parsed.experience || parsed.skills) {
        // Calculate readiness based on what's present
        let score = 0
        if (parsed.header?.fullName) score += 10
        if (parsed.header?.email) score += 5
        if (parsed.summary && parsed.summary.length > 50) score += 10
        if (parsed.experience && parsed.experience.length > 0) score += 20
        if (parsed.skills?.hard && parsed.skills.hard.length >= 5) score += 10

        return {
          action: 'update_section',
          section: undefined,
          data: {
            header: parsed.header,
            summary: parsed.summary,
            experience: parsed.experience,
            education: parsed.education,
            skills: parsed.skills,
            certifications: parsed.certifications,
            keywords: parsed.keywords
          },
          readinessScore: score,
          feedback: 'CV actualizado con nueva información'
        }
      }
    } catch {
      // Not valid JSON
    }
  }

  if (!match) return null

  try {
    const parsed = JSON.parse(match[1])
    return {
      action: parsed.action || 'update_section',
      section: parsed.section,
      data: {
        header: parsed.header,
        summary: parsed.summary,
        experience: parsed.experience,
        education: parsed.education,
        skills: parsed.skills,
        certifications: parsed.certifications,
        keywords: parsed.keywords
      },
      readinessScore: parsed.readinessScore || 0,
      feedback: parsed.feedback || ''
    }
  } catch {
    console.error('Failed to parse cv_update block')
    return null
  }
}

/**
 * Apply an update to the CV JSON
 * Merges updates intelligently
 */
/**
 * Helper: Remove empty/null/undefined values from an object
 * Prevents accidental deletion of existing data
 */
function cleanObject<T extends Record<string, any>>(obj: T): Partial<T> {
  const cleaned: any = {}
  for (const [key, value] of Object.entries(obj)) {
    // Keep the value if it's:
    // - A non-empty string
    // - A number (including 0)
    // - A boolean
    // - A non-empty array
    // - A non-null object
    if (
      (typeof value === 'string' && value.trim() !== '') ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      (Array.isArray(value) && value.length > 0) ||
      (value && typeof value === 'object' && !Array.isArray(value))
    ) {
      cleaned[key] = value
    }
  }
  return cleaned
}

export function applyCvUpdate(currentCv: CvJson, update: CvUpdateResult): CvJson {
  const newCv = { ...currentCv }
  const data = update.data

  // Apply header fields (only non-empty values)
  if (data.header) {
    const cleanedHeader = cleanObject(data.header)
    newCv.header = { ...newCv.header, ...cleanedHeader }

    // Special handling for links array - only replace if explicitly provided
    if (data.header.links && data.header.links.length > 0) {
      newCv.header.links = data.header.links
    }
  }

  // Apply summary (only if non-empty)
  if (data.summary !== undefined && data.summary.trim() !== '') {
    newCv.summary = data.summary
  }

  if (data.experience) {
    // Merge or replace experiences by ID
    const existingIds = new Set(newCv.experience.map(e => e.id))
    for (const exp of data.experience) {
      // Ensure exp has an ID
      if (!exp.id) {
        exp.id = `exp-${Math.random().toString(36).substring(2, 9)}`
      }

      if (existingIds.has(exp.id)) {
        const idx = newCv.experience.findIndex(e => e.id === exp.id)
        newCv.experience[idx] = exp
      } else {
        newCv.experience.push(exp)
        existingIds.add(exp.id)
      }
    }
  }

  if (data.education) {
    const existingIds = new Set(newCv.education.map(e => e.id))
    for (const edu of data.education) {
      // Ensure edu has an ID
      if (!edu.id) {
        edu.id = `edu-${Math.random().toString(36).substring(2, 9)}`
      }

      if (existingIds.has(edu.id)) {
        const idx = newCv.education.findIndex(e => e.id === edu.id)
        newCv.education[idx] = edu
      } else {
        newCv.education.push(edu)
        existingIds.add(edu.id)
      }
    }
  }

  if (data.skills) {
    newCv.skills = {
      hard: data.skills.hard || newCv.skills.hard,
      soft: data.skills.soft || newCv.skills.soft
    }
  }

  if (data.certifications) {
    // Ensure certifications have IDs and are unique
    newCv.certifications = data.certifications.map(cert => {
      if (!cert.id) {
        return {
          ...cert,
          id: `cert-${Math.random().toString(36).substring(2, 9)}`
        }
      }
      return cert
    })
  }

  if (data.keywords) {
    newCv.keywords = data.keywords
  }

  return newCv
}

/**
 * Generate initial questions for a new CV
 */
export async function generateInitialQuestions(targetRole?: string, language: 'es' | 'en' = 'es') {
  const prompt = language === 'es'
    ? `El usuario quiere crear un CV${targetRole ? ` para el puesto de ${targetRole}` : ''}.
       Genera 3-4 preguntas iniciales para comenzar a recopilar información.
       Sé amigable y profesional. Enfócate en obtener:
       1. Información de contacto básica
       2. Experiencia más relevante
       3. Habilidades principales
       4. Logros destacados con métricas`
    : `The user wants to create a CV${targetRole ? ` for the position of ${targetRole}` : ''}.
       Generate 3-4 initial questions to start gathering information.
       Be friendly and professional. Focus on obtaining:
       1. Basic contact information
       2. Most relevant experience
       3. Key skills
       4. Notable achievements with metrics`

  const systemPrompt = await getOptimizedPrompt()

  const result = await generateText({
    model: openai(MODEL),
    system: systemPrompt,
    prompt,
    maxTokens: 500
  })

  return result.text
}

/**
 * Extract structured data from raw text (e.g., from uploaded document)
 * Uses Structured Outputs for reliable extraction
 */
export async function extractCvFromText(rawText: string, language: 'es' | 'en' = 'es'): Promise<{
  extractedData: Partial<CvJson>
  questions: string[]
}> {
  const prompt = language === 'es'
    ? `Analiza el siguiente texto extraído de un documento (probablemente un CV existente) y extrae la información estructurada.

TEXTO:
${rawText.substring(0, 15000)}

Extrae SOLO la información que puedas identificar con certeza.
NO inventes datos. Si algo no está claro, déjalo vacío.
Genera también una lista de preguntas sobre datos que faltan o no están claros.`
    : `Analyze the following text extracted from a document (probably an existing CV) and extract structured information.

TEXT:
${rawText.substring(0, 15000)}

Extract ONLY information you can identify with certainty.
DO NOT invent data. If something is unclear, leave it empty.
Also generate a list of questions about missing or unclear data.`

  // Use structured output for reliable extraction
  const ExtractionSchema = z.object({
    header: z.object({
      fullName: z.string(),
      headline: z.string(),
      location: z.string(),
      email: z.string(),
      phone: z.string(),
      links: z.array(z.object({ label: z.string(), url: z.string() }))
    }),
    summary: z.string(),
    experience: z.array(z.object({
      id: z.string(),
      company: z.string(),
      role: z.string(),
      startDate: z.string(),
      endDate: z.string().nullable(),
      location: z.string(),
      bullets: z.array(z.string())
    })),
    education: z.array(z.object({
      id: z.string(),
      institution: z.string(),
      degree: z.string(),
      dates: z.string()
    })),
    skills: z.object({
      hard: z.array(z.string()),
      soft: z.array(z.string())
    }),
    questions: z.array(z.string()).describe('Questions about missing or unclear information')
  })

  const systemPrompt = await getOptimizedPrompt()

  try {
    const result = await generateObject({
      model: openai(MODEL),
      schema: ExtractionSchema,
      prompt,
      system: systemPrompt
    })

    const extracted = result.object

    return {
      extractedData: {
        header: extracted.header,
        summary: extracted.summary,
        experience: extracted.experience,
        education: extracted.education,
        skills: extracted.skills
      },
      questions: extracted.questions
    }
  } catch (error) {
    console.error('Error extracting CV from text:', error)
    return {
      extractedData: {},
      questions: ['No se pudo extraer información del documento. ¿Podrías proporcionar los datos manualmente?']
    }
  }
}
