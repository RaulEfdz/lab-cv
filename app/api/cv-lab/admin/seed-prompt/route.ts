import { createClient as createServerClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const DEFAULT_PROMPT = `Eres un experto en redacción de CVs y currículums profesionales. Tu rol es ayudar a crear, editar y optimizar CVs para aplicaciones de trabajo.

## REGLAS ABSOLUTAS:
1. NUNCA inventes datos - si falta información, PREGUNTA
2. SIEMPRE pide métricas cuantificables (%, $, números)
3. Formato STAR para logros (Situación, Tarea, Acción, Resultado)
4. Optimiza para ATS (keywords del puesto)
5. Tono profesional consistente

## VERBOS DE ACCIÓN:
Logré, Aumenté, Reduje, Implementé, Desarrollé, Lideré, Optimicé, Automaticé

## FORMATO DE RESPUESTA:
Usa este formato JSON al final de cada respuesta cuando hagas cambios al CV:

\`\`\`cv_update
{
  "header": { "fullName": "...", "headline": "...", etc },
  "summary": "...",
  "experience": [...],
  "education": [...],
  "skills": { "hard": [...], "soft": [...] },
  "certifications": [...],
  "keywords": [...]
}
\`\`\`

## READINESS SCORE:
+10 summary claro | +20 experiencias con bullets | +20 métricas | +10 skills | +10 header completo
Umbral "Listo": 80+

## INTERACCIÓN:
- Sé conciso pero amable
- Haz una pregunta a la vez
- Confirma antes de agregar logros o datos
- Celebra los avances del usuario`

export async function POST() {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Check if there's already an active prompt
    const { data: existingPrompt } = await supabase
      .from('cv_lab_prompt_versions')
      .select('*')
      .eq('is_active', true)
      .maybeSingle()

    if (existingPrompt) {
      return NextResponse.json({
        message: 'Active prompt already exists',
        prompt: {
          id: existingPrompt.id,
          version: existingPrompt.version,
          created_at: existingPrompt.created_at
        }
      })
    }

    // Create the default prompt
    const { data: newPrompt, error } = await supabase
      .from('cv_lab_prompt_versions')
      .insert({
        version: 'v1.0',
        system_prompt: DEFAULT_PROMPT,
        is_active: true,
        avg_rating: 0,
        total_ratings: 0,
        positive_ratings: 0,
        negative_ratings: 0,
        changelog: 'Versión inicial del prompt para CV Lab'
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create prompt', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Prompt v1.0 created successfully',
      prompt: {
        id: newPrompt.id,
        version: newPrompt.version,
        length: DEFAULT_PROMPT.length
      }
    })
  } catch (error) {
    console.error('Error in POST /api/cv-lab/admin/seed-prompt:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
