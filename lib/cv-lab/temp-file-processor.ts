/**
 * Procesador Temporal de Archivos
 *
 * Este módulo procesa PDFs e imágenes de CVs usando OpenAI Vision:
 * 1. Recibe el archivo temporalmente
 * 2. Extrae texto/información usando GPT-5-mini con visión
 * 3. Analiza con IA
 * 4. ELIMINA el archivo inmediatamente
 *
 * NO se almacenan archivos permanentemente
 * NO requiere librerías adicionales (usa OpenAI Vision API)
 */

import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { extractCvFromText } from './ai-engine'

// Tipos de archivos permitidos
const ALLOWED_TYPES = {
  PDF: ['application/pdf'],
  IMAGE: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

// Inicializar cliente de OpenAI usando AI SDK
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'

export interface ExtractedInfo {
  text: string
  language: 'es' | 'en'
  extractedData: {
    header?: {
      fullName?: string
      email?: string
      phone?: string
      location?: string
      links?: string[]
    }
    experience?: Array<{
      company: string
      role: string
      startDate: string
      endDate?: string
      description: string
    }>
    education?: Array<{
      institution: string
      degree: string
      field?: string
      startDate?: string
      endDate?: string
    }>
    skills?: string[]
  }
  questions: string[]
}

/**
 * Procesa un PDF de CV temporalmente
 *
 * @param file - Buffer del archivo PDF
 * @param filename - Nombre del archivo (para logging)
 * @returns Información extraída
 */
export async function processPdfTemporarily(
  fileBuffer: Buffer,
  filename: string
): Promise<ExtractedInfo> {
  try {
    // Validar tamaño
    if (fileBuffer.length > MAX_FILE_SIZE) {
      throw new Error('Archivo demasiado grande. Máximo 10MB.')
    }

    // Convertir PDF a base64 para OpenAI Vision API
    const base64Pdf = fileBuffer.toString('base64')

    console.log(`📄 Procesando PDF con OpenAI Vision: ${filename}`)

    // Usar AI SDK para extraer texto del PDF
    const { text: extractedText } = await generateText({
      model: openai(MODEL),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Extrae TODO el texto de este CV en PDF. Incluye:
- Información de contacto (nombre, email, teléfono, ubicación, LinkedIn, etc.)
- Resumen profesional
- Experiencia laboral (empresa, puesto, fechas, descripción)
- Educación (institución, título, fechas)
- Habilidades técnicas y blandas
- Certificaciones
- Idiomas

Devuelve el texto completo tal como aparece en el documento.`
            },
            {
              type: 'image',
              image: base64Pdf,
              mimeType: 'application/pdf'
            }
          ]
        }
      ],
      maxTokens: 4000
    })

    if (!extractedText) {
      throw new Error('No se pudo extraer texto del PDF')
    }

    console.log(`✅ Texto extraído (${extractedText.length} caracteres)`)

    // Detectar idioma
    const language = detectLanguage(extractedText)

    // Analizar con IA
    const aiResult = await extractCvFromText(extractedText, language)

    return {
      text: extractedText.substring(0, 5000),
      language,
      extractedData: aiResult.extractedData || {},
      questions: aiResult.questions || []
    }
  } catch (error) {
    console.error('Error procesando PDF:', error)
    throw new Error(`Error al procesar PDF: ${error instanceof Error ? error.message : 'Error desconocido'}`)
  }
}

/**
 * Procesa una imagen de CV temporalmente (con OCR)
 *
 * @param file - Buffer del archivo de imagen
 * @param filename - Nombre del archivo
 * @returns Información extraída
 */
export async function processImageTemporarily(
  fileBuffer: Buffer,
  filename: string
): Promise<ExtractedInfo> {
  try {
    // Validar tamaño
    if (fileBuffer.length > MAX_FILE_SIZE) {
      throw new Error('Imagen demasiado grande. Máximo 10MB.')
    }

    // Convertir imagen a base64 para OpenAI Vision API
    const base64Image = fileBuffer.toString('base64')

    // Detectar tipo de imagen
    const mimeType = filename.toLowerCase().endsWith('.png') ? 'image/png' :
                     filename.toLowerCase().endsWith('.jpg') || filename.toLowerCase().endsWith('.jpeg') ? 'image/jpeg' :
                     filename.toLowerCase().endsWith('.webp') ? 'image/webp' : 'image/jpeg'

    console.log(`🖼️  Procesando imagen con OpenAI Vision: ${filename}`)

    // Usar AI SDK para extraer texto de la imagen
    const { text: extractedText } = await generateText({
      model: openai(MODEL),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Lee y extrae TODO el texto de esta imagen de CV. Incluye:
- Información de contacto (nombre, email, teléfono, ubicación, LinkedIn, etc.)
- Resumen profesional
- Experiencia laboral (empresa, puesto, fechas, descripción)
- Educación (institución, título, fechas)
- Habilidades técnicas y blandas
- Certificaciones
- Idiomas

Devuelve el texto completo tal como aparece en la imagen, respetando el formato original.`
            },
            {
              type: 'image',
              image: base64Image,
              mimeType: mimeType
            }
          ]
        }
      ],
      maxTokens: 4000
    })

    if (!extractedText) {
      throw new Error('No se pudo extraer texto de la imagen')
    }

    console.log(`✅ Texto extraído (${extractedText.length} caracteres)`)

    // Detectar idioma
    const language = detectLanguage(extractedText)

    // Analizar con IA
    const aiResult = await extractCvFromText(extractedText, language)

    return {
      text: extractedText.substring(0, 5000),
      language,
      extractedData: aiResult.extractedData || {},
      questions: aiResult.questions || []
    }
  } catch (error) {
    console.error('Error procesando imagen:', error)
    throw new Error(`Error al procesar imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`)
  }
}

// Ya no necesitamos estas funciones - OpenAI Vision las reemplaza

/**
 * Detecta el idioma del texto
 */
function detectLanguage(text: string): 'es' | 'en' {
  const spanishWords = ['experiencia', 'educación', 'habilidades', 'puesto', 'empresa']
  const englishWords = ['experience', 'education', 'skills', 'position', 'company']

  const lowerText = text.toLowerCase()

  const spanishCount = spanishWords.filter(word => lowerText.includes(word)).length
  const englishCount = englishWords.filter(word => lowerText.includes(word)).length

  return spanishCount >= englishCount ? 'es' : 'en'
}

/**
 * Valida el tipo de archivo
 */
export function validateFileType(mimeType: string): 'pdf' | 'image' | 'invalid' {
  if (ALLOWED_TYPES.PDF.includes(mimeType)) return 'pdf'
  if (ALLOWED_TYPES.IMAGE.includes(mimeType)) return 'image'
  return 'invalid'
}

/**
 * Valida el tamaño del archivo
 */
export function validateFileSize(sizeInBytes: number): boolean {
  return sizeInBytes <= MAX_FILE_SIZE
}
