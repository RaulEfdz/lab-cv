import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { parseDocumentFromUrl, cleanExtractedText, detectLanguage } from '@/lib/cv-lab/document-parser'
import { extractCvFromText } from '@/lib/cv-lab/ai-engine'

interface RouteContext {
  params: Promise<{ id: string }>
}

// POST /api/cv-lab/[id]/assets - Upload and process a document
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Get CV and verify it exists
    // RLS policy automáticamente valida que user_id = auth.uid()
    const { data: cv, error: cvError } = await supabase
      .from('cv_lab_cvs')
      .select('*')
      .eq('id', id)
      .single()

    if (cvError || !cv) {
      return NextResponse.json({ error: 'CV no encontrado' }, { status: 404 })
    }

    // Get body
    const body = await request.json()
    const { fileName, fileUrl, fileKey, mimeType } = body

    if (!fileName || !fileUrl || !fileKey) {
      return NextResponse.json(
        { error: 'fileName, fileUrl y fileKey son requeridos' },
        { status: 400 }
      )
    }

    // Parse the document to extract text
    let extractedText = ''
    try {
      const rawText = await parseDocumentFromUrl(fileUrl, mimeType)
      extractedText = cleanExtractedText(rawText)
    } catch (parseError) {
      console.error('Error parsing document:', parseError)
      // Continue even if parsing fails - we'll store the asset anyway
    }

    // Save the asset
    const { data: asset, error: assetError } = await supabase
      .from('cv_lab_assets')
      .insert({
        cv_id: id,
        file_name: fileName,
        file_url: fileUrl,
        file_key: fileKey,
        mime_type: mimeType,
        extracted_text: extractedText || null
      })
      .select()
      .single()

    if (assetError) {
      console.error('Error saving asset:', assetError)
      return NextResponse.json({ error: assetError.message }, { status: 500 })
    }

    // If we have extracted text, try to extract CV data using AI
    let extractedData = null
    let questions: string[] = []

    if (extractedText && extractedText.length > 100) {
      try {
        const language = detectLanguage(extractedText)
        const aiResult = await extractCvFromText(extractedText, language)
        extractedData = aiResult.extractedData
        questions = aiResult.questions
      } catch (aiError) {
        console.error('Error extracting CV data with AI:', aiError)
        // Continue without AI extraction
      }
    }

    return NextResponse.json({
      asset,
      extractedText: extractedText ? extractedText.substring(0, 1000) : null,
      extractedData,
      questions,
      message: 'Documento procesado correctamente'
    }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/cv-lab/[id]/assets:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// GET /api/cv-lab/[id]/assets - List all assets
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // RLS policy automáticamente filtra assets por CV accesible al usuario
    const { data: assets, error } = await supabase
      .from('cv_lab_assets')
      .select('*')
      .eq('cv_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching assets:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ assets })

  } catch (error) {
    console.error('Error in GET /api/cv-lab/[id]/assets:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// DELETE /api/cv-lab/[id]/assets?assetId=xxx - Delete an asset
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // RLS policy valida que solo el dueño o admins pueden eliminar assets
    const assetId = request.nextUrl.searchParams.get('assetId')
    if (!assetId) {
      return NextResponse.json({ error: 'assetId es requerido' }, { status: 400 })
    }

    // Get asset to delete from storage
    const { data: asset } = await supabase
      .from('cv_lab_assets')
      .select('file_key')
      .eq('id', assetId)
      .eq('cv_id', id)
      .single()

    if (asset?.file_key) {
      try {
        const { UTApi } = await import('uploadthing/server')
        const utapi = new UTApi()
        await utapi.deleteFiles(asset.file_key)
      } catch (utError) {
        console.error('Error deleting file from UploadThing:', utError)
      }
    }

    // Delete from database
    const { error } = await supabase
      .from('cv_lab_assets')
      .delete()
      .eq('id', assetId)
      .eq('cv_id', id)

    if (error) {
      console.error('Error deleting asset:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in DELETE /api/cv-lab/[id]/assets:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
