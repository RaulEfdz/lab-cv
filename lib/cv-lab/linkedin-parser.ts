// =============================================================================
// CV DATA PARSER - Extractor inteligente de datos para CV
// Parsea texto de CUALQUIER fuente (LinkedIn, CV existente, texto libre, etc.)
// y extrae información estructurada para el CV
// =============================================================================

import type { CvJson } from '@/lib/types/cv-lab'

export interface CvParseResult {
  header: Partial<CvJson['header']>
  summary: string
  experience: CvJson['experience']
  education: CvJson['education']
  skills: CvJson['skills']
  certifications: CvJson['certifications']
  isBulkData: boolean
  source: 'linkedin' | 'cv_document' | 'free_text' | 'unknown'
  confidence: number // 0-100
}

// Alias para compatibilidad
export type LinkedInParseResult = CvParseResult

/**
 * Detecta si el texto contiene datos bulk de CV (de cualquier fuente)
 */
export function isBulkCvData(message: string): boolean {
  const indicators = [
    // LinkedIn patterns
    message.includes('Jornada completa'),
    message.includes('Contrato temporal'),
    message.includes('Logotipo de'),
    message.includes('Aptitudes:'),

    // General CV patterns
    message.includes('Experiencia') || message.includes('Experience'),
    message.includes('Educación') || message.includes('Education'),
    message.includes('Habilidades') || message.includes('Skills'),

    // Contact info patterns
    message.match(/@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i) !== null, // email
    message.match(/linkedin\.com|github\.com/i) !== null, // links

    // Date patterns (Spanish and English)
    (message.match(/(?:ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic|jan|apr|aug|dec)\.\s*\d{4}/gi) || []).length >= 2,
    (message.match(/\d{4}\s*-\s*(actualidad|presente|present|current)/gi) || []).length >= 1,
    (message.match(/\d{4}\s*-\s*\d{4}/g) || []).length >= 1,

    // Length indicator
    message.length > 300,

    // Multiple companies/roles mentioned
    (message.match(/(?:empresa|company|trabajé|worked|puesto|position|rol|role)/gi) || []).length >= 1
  ]

  const matchCount = indicators.filter(Boolean).length
  return matchCount >= 3
}

// Alias para compatibilidad
export const isLinkedInBulkData = isBulkCvData

/**
 * Parsea texto de LinkedIn y extrae datos estructurados
 */
export function parseLinkedInData(message: string): LinkedInParseResult {
  const result: LinkedInParseResult = {
    header: {
      fullName: '',
      headline: '',
      location: '',
      email: '',
      phone: '',
      links: []
    },
    summary: '',
    experience: [],
    education: [],
    skills: { hard: [], soft: [] },
    certifications: [],
    isLinkedInData: isLinkedInBulkData(message),
    confidence: 0
  }

  let confidencePoints = 0

  // ========================================
  // 1. EXTRAER NOMBRE
  // ========================================
  // Patrón: Primera línea con nombre propio (mayúscula inicial)
  const namePatterns = [
    // Nombre al inicio del texto
    /^([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)+)/m,
    // Nombre seguido de "Información de contacto"
    /([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)+)\s*\n\s*Información de contacto/i,
    // Nombre repetido (común en LinkedIn)
    /([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)+)\s*\n\s*\1/
  ]

  for (const pattern of namePatterns) {
    const match = message.match(pattern)
    if (match && match[1]) {
      result.header.fullName = match[1].trim()
      confidencePoints += 15
      break
    }
  }

  // ========================================
  // 2. EXTRAER HEADLINE/TÍTULO
  // ========================================
  const headlinePatterns = [
    // Patrón: "Software Developer | AI & Process Optimization"
    /(?:Software|Developer|Engineer|Analyst|Manager|Lead|Director|Programador|Desarrollador|Analista|Líder)[^\n|]*(?:\|[^\n|]*)?/i,
    // Línea después del nombre con keywords de tech
    /(?<=\n)([^\n]+(?:Developer|Engineer|Analyst|Manager|Lead|Programador|Desarrollador|Analista)[^\n]*)/i
  ]

  for (const pattern of headlinePatterns) {
    const match = message.match(pattern)
    if (match) {
      result.header.headline = match[0].trim().replace(/\s+/g, ' ')
      confidencePoints += 10
      break
    }
  }

  // ========================================
  // 3. EXTRAER EMAIL
  // ========================================
  const emailMatch = message.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i)
  if (emailMatch) {
    result.header.email = emailMatch[1]
    confidencePoints += 10
  }

  // ========================================
  // 4. EXTRAER UBICACIÓN
  // ========================================
  const locationPatterns = [
    /(?:Dirección|Ubicación)\s*\n\s*([^\n]+)/i,
    /(Panamá(?:,\s*Panamá)?|Ciudad de Panamá|México(?:,\s*D\.?F\.?)?|Colombia|España|Argentina|Chile)[^\n·]*/i,
    /([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:,\s*[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)?)\s*·?\s*(?:Híbrido|Presencial|En remoto)/i
  ]

  for (const pattern of locationPatterns) {
    const match = message.match(pattern)
    if (match) {
      result.header.location = match[1]?.trim() || match[0].trim()
      confidencePoints += 5
      break
    }
  }

  // ========================================
  // 5. EXTRAER LINKS
  // ========================================
  const links: { label: string; url: string }[] = []

  const linkedinMatch = message.match(/linkedin\.com\/in\/([a-zA-Z0-9-]+)/i)
  if (linkedinMatch) {
    links.push({ label: 'LinkedIn', url: `https://linkedin.com/in/${linkedinMatch[1]}` })
    confidencePoints += 5
  }

  const githubMatch = message.match(/github\.com\/([a-zA-Z0-9-]+)/i)
  if (githubMatch) {
    links.push({ label: 'GitHub', url: `https://github.com/${githubMatch[1]}` })
    confidencePoints += 5
  }

  const webMatches = message.match(/([a-z0-9-]+\.(?:vercel|netlify)\.app)/gi)
  if (webMatches) {
    webMatches.forEach(web => {
      links.push({ label: 'Portfolio', url: `https://${web}` })
    })
    confidencePoints += 3
  }

  result.header.links = links

  // ========================================
  // 6. EXTRAER EXPERIENCIAS (MÁS IMPORTANTE)
  // ========================================
  result.experience = extractExperiences(message)
  if (result.experience.length > 0) {
    confidencePoints += result.experience.length * 10
  }

  // ========================================
  // 7. EXTRAER RESUMEN/ABOUT
  // ========================================
  const aboutMatch = message.match(/(?:Acerca de|About)\s*(?:Acerca de|About)?\s*\n([^]*?)(?=\n(?:Experiencia|Experience|Reconocimientos|Logotipo de|\n\n))/i)
  if (aboutMatch && aboutMatch[1]) {
    result.summary = aboutMatch[1].trim().substring(0, 500)
    confidencePoints += 10
  }

  // ========================================
  // 8. EXTRAER SKILLS
  // ========================================
  const allSkills = new Set<string>()
  const skillsMatches = message.matchAll(/Aptitudes:\s*([^\n]+)/gi)
  for (const match of skillsMatches) {
    const skills = match[1].split('·').map(s => s.trim()).filter(s => s.length > 1 && s.length < 50)
    skills.forEach(s => allSkills.add(s))
  }

  // Skills comunes de tech
  const techSkills = ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'PHP',
    'MongoDB', 'PostgreSQL', 'MySQL', 'Docker', 'AWS', 'Git', 'HTML', 'CSS', 'MEAN Stack',
    'Full Stack', 'Frontend', 'Backend', 'AI', 'Machine Learning', 'Data Analysis']

  techSkills.forEach(skill => {
    if (message.toLowerCase().includes(skill.toLowerCase())) {
      allSkills.add(skill)
    }
  })

  result.skills.hard = Array.from(allSkills).slice(0, 20)
  if (result.skills.hard.length > 0) {
    confidencePoints += 5
  }

  // ========================================
  // 9. EXTRAER EDUCACIÓN
  // ========================================
  result.education = extractEducation(message)
  if (result.education.length > 0) {
    confidencePoints += 5
  }

  // ========================================
  // 10. EXTRAER CERTIFICACIONES
  // ========================================
  result.certifications = extractCertifications(message)
  if (result.certifications.length > 0) {
    confidencePoints += 5
  }

  result.confidence = Math.min(100, confidencePoints)

  return result
}

/**
 * Extrae experiencias laborales del texto de LinkedIn
 */
function extractExperiences(message: string): CvJson['experience'] {
  const experiences: CvJson['experience'] = []

  // Dividir por bloques de experiencia
  // LinkedIn típicamente tiene: "Logotipo de X" o "Rol\nEmpresa · Tipo"
  const sections = message.split(/(?=Logotipo de\s+)/i)

  // También buscar el patrón de roles directos
  const roleBlocks = message.split(/(?=(?:^|\n\n)(?:[A-ZÁÉÍÓÚÑ][a-záéíóúñ\s\/]+)\n[A-Za-záéíóúñ\s]+\s*·\s*(?:Jornada completa|Contrato temporal|Temporal))/gm)

  const allBlocks = [...sections, ...roleBlocks].filter(block =>
    block.includes('Jornada completa') ||
    block.includes('Contrato temporal') ||
    block.includes('· Temporal') ||
    block.match(/(?:ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\.\s*\d{4}/i)
  )

  // Set para evitar duplicados
  const seenCompanies = new Set<string>()

  allBlocks.forEach((block, index) => {
    // Extraer empresa
    let company = ''
    const companyPatterns = [
      /Logotipo de\s+([^\n]+)/i,
      /^([A-ZÁÉÍÓÚÑ][A-Za-záéíóúñ\s]+?)\s*·\s*(?:Jornada|Contrato|Temporal)/im,
      /\n([A-ZÁÉÍÓÚÑ][A-Za-záéíóúñ\s]+?)\s*·\s*(?:Jornada|Contrato|Temporal)/i
    ]

    for (const pattern of companyPatterns) {
      const match = block.match(pattern)
      if (match && match[1]) {
        company = match[1].trim()
        break
      }
    }

    // Si no encontramos empresa, intentar con nombres conocidos
    const knownCompanies = ['Hypernova Labs', 'IEEE', 'COOPERATIVA RL', 'Universidad de Panamá',
      'BEERMARKT', 'Webs-pa', 'Senacyt']
    for (const known of knownCompanies) {
      if (block.includes(known) && !company) {
        company = known
        break
      }
    }

    if (!company || seenCompanies.has(company.toLowerCase())) return
    seenCompanies.add(company.toLowerCase())

    // Extraer rol
    let role = ''
    const rolePatterns = [
      /([A-Za-záéíóúñÁÉÍÓÚÑ\s\/]+(?:programador|desarrollador|analista|líder|web master|manager|engineer|developer|encargado|soporte|técnico))/i,
      /^([A-ZÁÉÍÓÚÑ][a-záéíóúñ\s\/]+)\n/m
    ]

    for (const pattern of rolePatterns) {
      const match = block.match(pattern)
      if (match && match[1] && match[1].length < 100) {
        role = match[1].trim()
        break
      }
    }

    // Extraer fechas
    const dateMatch = block.match(/((?:ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\.\s*\d{4})\s*-\s*(actualidad|presente|(?:ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\.\s*\d{4})/i)
    const startDate = dateMatch?.[1] || ''
    const endDateRaw = dateMatch?.[2]?.toLowerCase()
    const endDate = endDateRaw?.includes('actualidad') || endDateRaw?.includes('presente') ? null : endDateRaw || null

    // Extraer ubicación
    const locMatch = block.match(/((?:Panamá|México|Colombia|España|Argentina|Chile)[^·\n]*|Híbrido|Presencial|En remoto)/i)
    const location = locMatch?.[0]?.trim() || 'Panamá'

    // Extraer descripción
    const bullets: string[] = []
    const descMatch = block.match(/(?:Híbrido|Presencial|En remoto)[^\n]*\n([^]*?)(?=Aptitudes:|Logotipo de|$)/i)
    if (descMatch && descMatch[1]) {
      const desc = descMatch[1].trim()
      if (desc.length > 20) {
        // Dividir en puntos si hay 🔹 o bullets
        const points = desc.split(/🔹|•|·/).filter(p => p.trim().length > 10)
        if (points.length > 0) {
          points.forEach(p => {
            if (p.trim().length > 10 && p.trim().length < 300) {
              bullets.push(p.trim())
            }
          })
        } else {
          // Tomar primeros 200 chars como un bullet
          bullets.push(desc.substring(0, 200).trim())
        }
      }
    }

    // Si no hay bullets, agregar placeholder
    if (bullets.length === 0) {
      bullets.push('Pendiente de agregar logros con métricas')
    }

    experiences.push({
      id: `exp-${index + 1}-${Date.now()}`,
      company,
      role: role || 'Rol por confirmar',
      startDate,
      endDate,
      location,
      bullets
    })
  })

  // Ordenar por fecha (más reciente primero)
  return experiences.sort((a, b) => {
    if (!a.startDate || !b.startDate) return 0
    return b.startDate.localeCompare(a.startDate)
  })
}

/**
 * Extrae educación del texto
 */
function extractEducation(message: string): CvJson['education'] {
  const education: CvJson['education'] = []

  // Buscar sección de educación
  const eduMatch = message.match(/(?:Educación|Education|Formación)[^]*?(?=Experiencia|Experience|Aptitudes|Skills|$)/i)
  if (!eduMatch) return education

  const eduBlock = eduMatch[0]

  // Buscar universidades/instituciones
  const institutions = [
    /Universidad\s+(?:de\s+)?([^\n·]+)/gi,
    /Instituto\s+([^\n·]+)/gi,
    /(UTP|USMA|UNACHI|UP)\b/gi
  ]

  institutions.forEach((pattern, i) => {
    const matches = eduBlock.matchAll(pattern)
    for (const match of matches) {
      education.push({
        id: `edu-${i + 1}-${Date.now()}`,
        institution: match[1]?.trim() || match[0].trim(),
        degree: 'Por confirmar',
        field: '',
        dates: ''
      })
    }
  })

  return education
}

/**
 * Extrae certificaciones del texto
 */
function extractCertifications(message: string): CvJson['certifications'] {
  const certs: CvJson['certifications'] = []

  // Buscar sección de certificaciones/reconocimientos
  const certMatch = message.match(/(?:Reconocimientos|Certificaciones|Licencias|Certifications)[^]*?(?=Experiencia|Experience|Educación|Education|$)/i)
  if (!certMatch) return certs

  const certBlock = certMatch[0]

  // Buscar certificaciones
  const certPatterns = [
    /Mención\s+([^\n]+)/gi,
    /Certificado?\s+([^\n]+)/gi,
    /CollegeBoard\s+([^\n]+)/gi
  ]

  let certIndex = 0
  certPatterns.forEach(pattern => {
    const matches = certBlock.matchAll(pattern)
    for (const match of matches) {
      certs.push({
        id: `cert-${++certIndex}`,
        name: match[1]?.trim() || match[0].trim(),
        issuer: 'Por confirmar',
        date: ''
      })
    }
  })

  return certs.slice(0, 5) // Limitar a 5
}

/**
 * Convierte el resultado del parser a un CvUpdateResult
 */
export function linkedInParseResultToCvUpdate(parsed: LinkedInParseResult): {
  action: 'update_section' | 'full_update'
  section?: string
  data: Partial<CvJson>
  readinessScore: number
  feedback: string
} | null {
  if (!parsed.isLinkedInData || parsed.confidence < 20) {
    return null
  }

  // Calcular readiness score basado en lo extraído
  let score = 0
  if (parsed.header.fullName) score += 10
  if (parsed.header.headline) score += 5
  if (parsed.header.email) score += 5
  if (parsed.header.location) score += 3
  if (parsed.header.links && parsed.header.links.length > 0) score += 2
  if (parsed.summary) score += 10
  if (parsed.experience.length > 0) score += Math.min(30, parsed.experience.length * 8)
  if (parsed.skills.hard.length > 0) score += 5
  if (parsed.education.length > 0) score += 5
  if (parsed.certifications.length > 0) score += 3

  const feedback = `✓ Datos de LinkedIn procesados: ${parsed.experience.length} experiencias, ${parsed.skills.hard.length} skills`

  return {
    action: 'full_update',
    data: {
      header: parsed.header as CvJson['header'],
      summary: parsed.summary,
      experience: parsed.experience,
      education: parsed.education,
      skills: parsed.skills,
      certifications: parsed.certifications
    },
    readinessScore: Math.min(100, score),
    feedback
  }
}
