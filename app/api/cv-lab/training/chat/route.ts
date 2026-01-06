import { createClient as createServerClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { streamCvChat, extractCvUpdate, applyCvUpdate } from '@/lib/cv-lab/ai-engine'
import type { CvJson, CvLabMessage } from '@/lib/types/cv-lab'

// POST /api/cv-lab/training/chat - Send message and get AI response
// Body: { sessionId?: string, message: string, cvState?: CvJson }
// Public endpoint for training purposes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, message, cvState } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'message is required and must be a string' },
        { status: 400 }
      )
    }

    // Use service role for public access (training purposes)
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

    // Create or get training session
    let trainingSessionId = sessionId

    if (!trainingSessionId) {
      // Create new training session
      const { data: newSession, error: sessionError } = await supabase
        .from('cv_lab_training_sessions')
        .insert({
          name: `Training ${new Date().toISOString()}`,
          metadata: { source: 'api', startedAt: new Date().toISOString() }
        })
        .select()
        .single()

      if (sessionError || !newSession) {
        return NextResponse.json(
          { error: 'Failed to create training session' },
          { status: 500 }
        )
      }

      trainingSessionId = newSession.id
    }

    // Get conversation history for this session
    const { data: history } = await supabase
      .from('cv_lab_training_messages')
      .select('*')
      .eq('session_id', trainingSessionId)
      .order('created_at', { ascending: true })

    // Build messages array
    const messages: CvLabMessage[] = [
      ...(history || []).map((m: any) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
        createdAt: m.created_at
      })),
      {
        role: 'user' as const,
        content: message,
        createdAt: new Date().toISOString()
      }
    ]

    // Get current CV state
    const currentCv: CvJson = cvState || {
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
      keywords: []
    }

    // ====== PERFORMANCE METRICS (Level 11+) ======
    const startTime = Date.now()

    // Stream chat response (pass service role client for DB access)
    const result = await streamCvChat(messages, currentCv, supabase)
    let fullResponse = ''

    for await (const chunk of result.textStream) {
      fullResponse += chunk
    }

    // Calculate latency
    const latencyMs = Date.now() - startTime

    // Estimate token count (rough: ~4 chars per token for Spanish/English)
    const estimatedTokens = Math.ceil(fullResponse.length / 4)

    // Count words
    const wordCount = fullResponse.trim().split(/\s+/).length

    // Save user message
    await supabase.from('cv_lab_training_messages').insert({
      session_id: trainingSessionId,
      role: 'user',
      content: message
    })

    // Save assistant response
    const { data: assistantMsg } = await supabase
      .from('cv_lab_training_messages')
      .insert({
        session_id: trainingSessionId,
        role: 'assistant',
        content: fullResponse
      })
      .select()
      .single()

    // ====== TOOL USAGE DETECTION (Level 12) ======
    const cvUpdate = extractCvUpdate(fullResponse)
    let updatedCv = currentCv
    let toolUsed: 'cv_update' | 'text_response' = 'text_response'

    if (cvUpdate) {
      updatedCv = applyCvUpdate(currentCv, cvUpdate)
      toolUsed = 'cv_update'
    }

    // Detect which schema sections were updated
    const schemasUsed: string[] = []
    if (cvUpdate?.data?.header) schemasUsed.push('header')
    if (cvUpdate?.data?.summary) schemasUsed.push('summary')
    if (cvUpdate?.data?.experience?.length) schemasUsed.push('experience')
    if (cvUpdate?.data?.education?.length) schemasUsed.push('education')
    if (cvUpdate?.data?.skills) schemasUsed.push('skills')
    if (cvUpdate?.data?.certifications?.length) schemasUsed.push('certifications')

    // Check JSON validity if cv_update was attempted
    let jsonValid = true
    let jsonError: string | null = null
    if (fullResponse.includes('```cv_update') || fullResponse.includes('```json')) {
      try {
        const jsonMatch = fullResponse.match(/```(?:cv_update|json)\n([\s\S]*?)\n```/)
        if (jsonMatch) {
          JSON.parse(jsonMatch[1])
        }
      } catch (e) {
        jsonValid = false
        jsonError = e instanceof Error ? e.message : 'Invalid JSON'
      }
    }

    return NextResponse.json({
      sessionId: trainingSessionId,
      messageId: assistantMsg?.id,
      response: fullResponse,
      cvUpdate: cvUpdate || null,
      updatedCv,
      extractedUpdate: !!cvUpdate,
      // Performance metrics (Level 11)
      metrics: {
        latencyMs,
        estimatedTokens,
        wordCount,
        charactersCount: fullResponse.length
      },
      // Tool usage info (Level 12)
      toolInfo: {
        toolUsed,
        schemasUsed,
        jsonValid,
        jsonError
      }
    })
  } catch (error) {
    console.error('Error in POST /api/cv-lab/training/chat:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
