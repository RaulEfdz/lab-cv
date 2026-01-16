import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  processPdfTemporarily,
  processImageTemporarily,
  validateFileType,
  validateFileSize
} from '@/lib/cv-lab/temp-file-processor'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * POST /api/cv-lab/[id]/upload-temp
 *
 * Sube un PDF o imagen de CV temporalmente:
 * 1. Recibe el archivo
 * 2. Extrae información con OCR/PDF parser
 * 3. Analiza con OCTAVIA
 * 4. Elimina el archivo INMEDIATAMENTE
 * 5. Retorna solo la información extraída
 *
 * NO se almacenan archivos permanentemente
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: cvId } = await context.params
    const supabase = await createClient()

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Verificar que el CV existe y el usuario tiene acceso
    // RLS automáticamente valida que user_id = auth.uid()
    const { data: cv, error: cvError } = await supabase
      .from('cv_lab_cvs')
      .select('id, user_id')
      .eq('id', cvId)
      .single()

    if (cvError || !cv) {
      return NextResponse.json(
        { error: 'CV no encontrado o no tienes acceso' },
        { status: 404 }
      )
    }

    // Obtener el archivo del FormData
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No se envió ningún archivo' },
        { status: 400 }
      )
    }

    // Validar tipo de archivo
    const fileType = validateFileType(file.type)
    if (fileType === 'invalid') {
      return NextResponse.json(
        {
          error: 'Tipo de archivo no permitido',
          message: 'Solo se permiten PDFs e imágenes (JPG, PNG, WEBP)'
        },
        { status: 400 }
      )
    }

    // Validar tamaño
    if (!validateFileSize(file.size)) {
      return NextResponse.json(
        {
          error: 'Archivo demasiado grande',
          message: 'El tamaño máximo es 10MB'
        },
        { status: 400 }
      )
    }

    // Convertir archivo a buffer
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)

    // Procesar temporalmente según el tipo
    let extractedInfo

    if (fileType === 'pdf') {
      console.log(`📄 Procesando PDF temporal: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`)
      extractedInfo = await processPdfTemporarily(fileBuffer, file.name)
    } else {
      console.log(`🖼️  Procesando imagen temporal: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`)
      extractedInfo = await processImageTemporarily(fileBuffer, file.name)
    }

    // Crear un mensaje del sistema indicando que se procesó el archivo
    await supabase
      .from('cv_lab_messages')
      .insert({
        cv_id: cvId,
        role: 'system',
        content: `Archivo procesado: ${file.name}. Información extraída exitosamente.`,
        tokens_in: 0,
        tokens_out: 0
      })

    console.log(`✅ Archivo procesado y eliminado: ${file.name}`)

    // Retornar solo la información extraída
    // El archivo ya fue eliminado por el procesador
    return NextResponse.json({
      success: true,
      message: `Archivo "${file.name}" procesado exitosamente`,
      fileName: file.name,
      fileType,
      extractedInfo: {
        language: extractedInfo.language,
        textPreview: extractedInfo.text.substring(0, 500) + '...',
        data: extractedInfo.extractedData,
        questions: extractedInfo.questions
      }
    })

  } catch (error) {
    console.error('Error en upload-temp:', error)

    return NextResponse.json(
      {
        error: 'Error procesando archivo',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

/**
 * GET - No permitido
 */
export async function GET() {
  return NextResponse.json(
    { error: 'Método no permitido' },
    { status: 405 }
  )
}
