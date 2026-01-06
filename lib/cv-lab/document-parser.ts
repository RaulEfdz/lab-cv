import mammoth from 'mammoth'

// =============================================================================
// DOCUMENT PARSER FOR CV LAB
// Extracts text from PDF and DOCX files
// =============================================================================

/**
 * Extract text from a DOCX file buffer
 */
export async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  } catch (error) {
    console.error('Failed to extract text from DOCX:', error)
    throw new Error('No se pudo extraer el texto del archivo DOCX')
  }
}

/**
 * Extract text from a PDF file buffer
 * Note: For PDF extraction, we use a simpler approach since pdf-parse
 * has some compatibility issues. In production, consider using pdf.js
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import to avoid SSR issues
    const pdfParse = (await import('pdf-parse')).default
    const data = await pdfParse(buffer)
    return data.text
  } catch (error) {
    console.error('Failed to extract text from PDF:', error)
    // Return a helpful message instead of throwing
    return '[Error: No se pudo extraer el texto del PDF. Por favor, copia y pega el contenido manualmente.]'
  }
}

/**
 * Parse a document from a URL
 */
export async function parseDocumentFromUrl(
  url: string,
  mimeType?: string
): Promise<string> {
  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Failed to fetch document: ${response.statusText}`)
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    const contentType = mimeType || response.headers.get('content-type') || ''

    // Determine file type
    if (contentType.includes('pdf') || url.toLowerCase().endsWith('.pdf')) {
      return extractTextFromPdf(buffer)
    }

    if (
      contentType.includes('wordprocessingml') ||
      contentType.includes('msword') ||
      url.toLowerCase().endsWith('.docx') ||
      url.toLowerCase().endsWith('.doc')
    ) {
      return extractTextFromDocx(buffer)
    }

    // If it's plain text
    if (contentType.includes('text/plain')) {
      return buffer.toString('utf-8')
    }

    throw new Error(`Tipo de archivo no soportado: ${contentType}`)
  } catch (error) {
    console.error('Failed to parse document from URL:', error)
    throw error
  }
}

/**
 * Clean and normalize extracted text
 */
export function cleanExtractedText(text: string): string {
  return text
    // Normalize whitespace
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove excessive newlines
    .replace(/\n{3,}/g, '\n\n')
    // Remove excessive spaces
    .replace(/ {2,}/g, ' ')
    // Trim each line
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    // Final trim
    .trim()
}

/**
 * Detect the language of the text (simple heuristic)
 */
export function detectLanguage(text: string): 'es' | 'en' {
  const spanishWords = [
    'experiencia', 'educación', 'habilidades', 'trabajo',
    'empresa', 'puesto', 'responsabilidades', 'logros',
    'universidad', 'licenciatura', 'maestría', 'ingeniero'
  ]

  const englishWords = [
    'experience', 'education', 'skills', 'work',
    'company', 'position', 'responsibilities', 'achievements',
    'university', 'bachelor', 'master', 'engineer'
  ]

  const lowerText = text.toLowerCase()

  const spanishCount = spanishWords.filter(word =>
    lowerText.includes(word)
  ).length

  const englishCount = englishWords.filter(word =>
    lowerText.includes(word)
  ).length

  return spanishCount >= englishCount ? 'es' : 'en'
}

/**
 * Extract sections from raw text (heuristic-based)
 */
export function extractSections(text: string): {
  possibleName: string | null
  possibleEmail: string | null
  possiblePhone: string | null
  sections: { title: string; content: string }[]
} {
  // Try to find email
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/)
  const possibleEmail = emailMatch ? emailMatch[0] : null

  // Try to find phone
  const phoneMatch = text.match(/[\+]?[(]?[0-9]{1,3}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}/)
  const possiblePhone = phoneMatch ? phoneMatch[0] : null

  // First line is often the name
  const lines = text.split('\n').filter(line => line.trim())
  const possibleName = lines[0]?.trim() || null

  // Common section headers
  const sectionPatterns = [
    /^(experiencia|experience|work|empleo|trabajo)/i,
    /^(educación|education|formación|academic)/i,
    /^(habilidades|skills|competencias|conocimientos)/i,
    /^(resumen|summary|perfil|profile|sobre mí|about)/i,
    /^(certificaciones|certifications|cursos|courses)/i,
    /^(proyectos|projects)/i,
    /^(idiomas|languages)/i
  ]

  const sections: { title: string; content: string }[] = []
  let currentSection: { title: string; content: string } | null = null

  for (const line of lines) {
    const trimmedLine = line.trim()

    // Check if this line is a section header
    const isHeader = sectionPatterns.some(pattern => pattern.test(trimmedLine))

    if (isHeader) {
      if (currentSection) {
        sections.push(currentSection)
      }
      currentSection = { title: trimmedLine, content: '' }
    } else if (currentSection) {
      currentSection.content += trimmedLine + '\n'
    }
  }

  if (currentSection) {
    sections.push(currentSection)
  }

  return {
    possibleName,
    possibleEmail,
    possiblePhone,
    sections
  }
}
