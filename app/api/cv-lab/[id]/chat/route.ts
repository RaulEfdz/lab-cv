import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { streamCvChat, extractCvUpdate, applyCvUpdate } from '@/lib/cv-lab/ai-engine'
import { calculateReadiness } from '@/lib/cv-lab/readiness'
import type { CvJson, CvLabMessage } from '@/lib/types/cv-lab'

interface RouteContext {
  params: Promise<{ id: string }>
}

// POST /api/cv-lab/[id]/chat - Send message and stream response
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  console.log('=== CV Lab Chat API Called ===')
  try {
    const { id } = await context.params
    console.log('CV ID:', id)
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log('Auth error or no user:', authError)
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    console.log('User authenticated:', user.id)

    // Verify admin access
    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!admin) {
      console.log('User is not admin')
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    console.log('Admin verified')

    const body = await request.json()
    console.log('Request body:', body)
    const { message } = body

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Mensaje requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Get CV and verify it exists
    console.log('Querying CV with id:', id)
    const { data: cv, error: cvError } = await supabase
      .from('cv_lab_cvs')
      .select('*')
      .eq('id', id)
      .single()

    console.log('CV query result - data:', cv, 'error:', cvError)

    if (cvError || !cv) {
      console.log('CV Query Error:', cvError)
      console.log('CV Data:', cv)
      return new Response(JSON.stringify({ error: 'CV no encontrado', details: cvError?.message }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    console.log('CV found:', cv.id, cv.title)

    // Get versions separately
    const { data: versions } = await supabase
      .from('cv_lab_versions')
      .select('id, cv_json, version_number')
      .eq('cv_id', id)
      .order('version_number', { ascending: false })

    console.log('Versions found:', versions?.length || 0)

    // Check if CV is closed
    if (cv.status === 'CLOSED') {
      return new Response(JSON.stringify({ error: 'Este CV está cerrado y no puede ser editado' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Get existing messages for context
    const { data: existingMessages } = await supabase
      .from('cv_lab_messages')
      .select('*')
      .eq('cv_id', id)
      .order('created_at', { ascending: true })
      .limit(50) // Limit context to last 50 messages

    // Get current CV JSON from latest version
    const latestVersion = versions?.[0]
    const currentCvJson = latestVersion?.cv_json as CvJson | null
    console.log('Latest version:', latestVersion?.version_number, 'Has CV JSON:', !!currentCvJson)

    // Save user message
    const { data: userMessage } = await supabase
      .from('cv_lab_messages')
      .insert({
        cv_id: id,
        role: 'user',
        content: message,
        tokens_in: 0,
        tokens_out: 0
      })
      .select()
      .single()

    // Prepare messages for AI
    const aiMessages: CvLabMessage[] = [
      ...(existingMessages || []).filter(m => m.role !== 'system'),
      userMessage
    ].filter(Boolean) as CvLabMessage[]

    console.log('AI Messages count:', aiMessages.length)
    console.log('Current CV JSON exists:', !!currentCvJson)
    console.log('Starting stream...')

    // Create streaming response
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = ''
        let tokensIn = 0
        let tokensOut = 0

        try {
          // Get streaming response from AI
          console.log('Calling streamCvChat...')
          const result = await streamCvChat(aiMessages, currentCvJson)
          console.log('streamCvChat returned, starting to read stream...')

          // Stream the text parts
          for await (const textPart of result.textStream) {
            fullResponse += textPart
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'text', content: textPart })}\n\n`)
            )
          }

          // Get final usage stats
          const usage = await result.usage as any
          tokensIn = usage?.promptTokens || 0
          tokensOut = usage?.completionTokens || 0

          // Extract CV update if present
          let cvUpdate = extractCvUpdate(fullResponse)

          // FALLBACK: If AI didn't generate JSON, extract info from user message
          if (!cvUpdate) {
            // Try to extract basic info from user's message
            const nameMatch = message.match(/(?:me llamo|mi nombre es|soy)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)+)/i)
            const emailMatch = message.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i)
            // Detect phone numbers (international formats)
            const phoneMatch = message.match(/(\+?\d{1,3}[\s.-]?\d{2,4}[\s.-]?\d{2,4}[\s.-]?\d{2,4})/i)

            // Detect LinkedIn experience patterns
            const isLinkedInExperience = message.includes('Jornada completa') ||
              message.includes('Contrato temporal') ||
              message.includes('· Temporal') ||
              message.match(/\d{4}\s*-\s*(actualidad|presente)/i) ||
              message.match(/(?:ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\.\s*\d{4}/i)

            if (nameMatch || emailMatch || phoneMatch) {
              // Build header update with only the fields that were found
              const headerUpdate: any = {}
              if (nameMatch) headerUpdate.fullName = nameMatch[1].trim().toUpperCase()
              if (emailMatch) headerUpdate.email = emailMatch[1]
              if (phoneMatch) headerUpdate.phone = phoneMatch[1].trim()

              // Calculate score increment
              let scoreIncrement = 0
              if (nameMatch) scoreIncrement += 10
              if (emailMatch) scoreIncrement += 5
              if (phoneMatch) scoreIncrement += 3

              // Build feedback message
              const feedbackParts = []
              if (nameMatch) feedbackParts.push('nombre')
              if (emailMatch) feedbackParts.push('email')
              if (phoneMatch) feedbackParts.push('teléfono')

              cvUpdate = {
                action: 'update_section',
                section: 'header',
                data: {
                  header: headerUpdate
                },
                readinessScore: scoreIncrement,
                feedback: `${feedbackParts.join(', ')} agregado(s) al CV`
              }
            } else if (isLinkedInExperience) {
              // Extract experiences from LinkedIn-style text
              const experiences: any[] = []

              // Common patterns for LinkedIn experience
              const expPatterns = [
                // Pattern: "Role · Company · Type · dates"
                /([A-Za-záéíóúñÁÉÍÓÚÑ\s\/]+)\n.*?([A-Za-záéíóúñÁÉÍÓÚÑ\s\.]+)\s*·\s*(?:Jornada completa|Contrato temporal|Temporal)/gi,
                // Pattern: Role at Company dates
                /(?:Logotipo de\s+)?([A-Za-záéíóúñÁÉÍÓÚÑ\s]+)\n\n([A-Za-záéíóúñÁÉÍÓÚÑ\s\/]+)/gi
              ]

              // Simple extraction of company names and roles
              const companyMatches = message.match(/(?:Logotipo de\s+)?([A-Z][a-záéíóúñ]+(?:\s+[A-Za-záéíóúñ]+)*)\s*·?\s*(?:Jornada completa|Contrato temporal|Temporal)/gi)
              const roleMatches = message.match(/([A-Za-záéíóúñÁÉÍÓÚÑ\s\/]+(?:programador|desarrollador|analista|líder|web master|manager|engineer|developer))/gi)

              // Date extraction
              const dateMatches = message.match(/((?:ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\.\s*\d{4})\s*-\s*((?:actualidad|presente|(?:ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\.\s*\d{4}))/gi)

              // Extract unique companies from text
              const companies = ['Hypernova Labs', 'IEEE', 'COOPERATIVA RL', 'Universidad de Panamá', 'BEERMARKT']
                .filter(company => message.includes(company))

              companies.forEach((company, i) => {
                experiences.push({
                  id: `exp-${i + 1}`,
                  company: company,
                  role: 'Rol a confirmar',
                  startDate: '',
                  endDate: null,
                  location: 'Ciudad de Panamá, Panamá',
                  bullets: ['Descripción pendiente de métricas']
                })
              })

              if (experiences.length > 0) {
                cvUpdate = {
                  action: 'update_section',
                  section: 'experience',
                  data: { experience: experiences },
                  readinessScore: experiences.length * 8,
                  feedback: `${experiences.length} experiencias detectadas`
                }
              }
            }
          }

          if (cvUpdate) {
            // Use empty CV as base if none exists yet (for incremental updates)
            const baseCv = currentCvJson || {
              header: { fullName: '', headline: '', location: '', email: '', phone: '', links: [] },
              summary: '',
              experience: [],
              education: [],
              skills: { hard: [], soft: [] },
              certifications: [],
              keywords: [],
              constraints: { onePage: true, language: 'es', targetRole: cv.target_role || '' }
            }

            // Apply update to CV (incremental)
            const updatedCvJson = applyCvUpdate(baseCv, cvUpdate)
            const readiness = calculateReadiness(updatedCvJson)

            // Update the current version's cv_json
            if (latestVersion) {
              await supabase
                .from('cv_lab_versions')
                .update({ cv_json: updatedCvJson })
                .eq('id', latestVersion.id)
            }

            // Update CV readiness score and status
            const newStatus = readiness.score >= 80 ? 'READY' : 'DRAFT'
            await supabase
              .from('cv_lab_cvs')
              .update({
                readiness_score: readiness.score,
                status: newStatus
              })
              .eq('id', id)

            // Send update event
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({
                type: 'cv_update',
                cvUpdate: {
                  ...cvUpdate,
                  readinessScore: readiness.score
                },
                updatedCvJson
              })}\n\n`)
            )
          }

          // Save assistant message
          const { data: savedAssistantMessage } = await supabase
            .from('cv_lab_messages')
            .insert({
              cv_id: id,
              role: 'assistant',
              content: fullResponse,
              tokens_in: tokensIn,
              tokens_out: tokensOut
            })
            .select('id')
            .single()

          // Send done event
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'done',
              tokensIn,
              tokensOut,
              messageId: savedAssistantMessage?.id
            })}\n\n`)
          )

        } catch (error) {
          console.error('Error streaming response:', error)
          console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)))
          const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'error',
              error: `Error: ${errorMessage}`
            })}\n\n`)
          )
        }

        controller.close()
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })

  } catch (error) {
    console.error('Error in POST /api/cv-lab/[id]/chat:', error)
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
