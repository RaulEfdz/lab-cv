// =============================================================================
// LinkedIn OAuth Callback
// Recibe el código de autorización, obtiene datos del usuario y actualiza el CV
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface LinkedInTokenResponse {
  access_token: string
  expires_in: number
  scope: string
  token_type: string
  id_token: string
}

interface LinkedInUserInfo {
  sub: string
  name: string
  given_name: string
  family_name: string
  picture: string
  email: string
  email_verified: boolean
  locale: string
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Base URL para redirecciones
  const baseUrl = process.env.NODE_ENV === 'production'
    ? 'https://portfolio-rf.vercel.app'
    : 'http://localhost:3000'

  // Manejar errores de LinkedIn
  if (error) {
    console.error('LinkedIn OAuth error:', error, errorDescription)
    return NextResponse.redirect(
      `${baseUrl}/admin/cv-lab?error=linkedin_denied&message=${encodeURIComponent(errorDescription || 'Acceso denegado')}`
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${baseUrl}/admin/cv-lab?error=invalid_request&message=${encodeURIComponent('Parámetros faltantes')}`
    )
  }

  // Decodificar state para obtener cv_id
  let cvId: string | null = null
  try {
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString())
    cvId = stateData.cv_id
  } catch (e) {
    console.error('Error decoding state:', e)
  }

  try {
    // 1. Intercambiar código por access token
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.NEXT_PUBLIC_LINKEDIN_REDIRECT_URI!,
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Token exchange failed:', errorText)
      throw new Error('Error al obtener token de LinkedIn')
    }

    const tokenData: LinkedInTokenResponse = await tokenResponse.json()

    // 2. Obtener información del usuario
    const userInfoResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    })

    if (!userInfoResponse.ok) {
      throw new Error('Error al obtener datos de LinkedIn')
    }

    const userInfo: LinkedInUserInfo = await userInfoResponse.json()

    // 3. Si tenemos cv_id, actualizar el CV con los datos
    if (cvId) {
      const supabase = await createClient()

      // Obtener CV actual
      const { data: cv, error: cvError } = await supabase
        .from('cv_lab_cvs')
        .select('cv_data')
        .eq('id', cvId)
        .single()

      if (cvError) {
        console.error('Error fetching CV:', cvError)
      } else {
        // Actualizar header con datos de LinkedIn
        const currentData = cv.cv_data || {}
        const currentHeader = currentData.header || {}

        const updatedData = {
          ...currentData,
          header: {
            ...currentHeader,
            fullName: currentHeader.fullName || userInfo.name || `${userInfo.given_name} ${userInfo.family_name}`,
            email: currentHeader.email || userInfo.email,
            photo: userInfo.picture || currentHeader.photo,
            links: [
              ...(currentHeader.links || []).filter((l: any) => l.label !== 'LinkedIn'),
              { label: 'LinkedIn', url: `https://linkedin.com/in/${userInfo.sub}` }
            ]
          },
          linkedinConnected: true,
          linkedinData: {
            sub: userInfo.sub,
            name: userInfo.name,
            email: userInfo.email,
            picture: userInfo.picture,
            connectedAt: new Date().toISOString()
          }
        }

        // Guardar actualización
        const { error: updateError } = await supabase
          .from('cv_lab_cvs')
          .update({
            cv_data: updatedData,
            updated_at: new Date().toISOString()
          })
          .eq('id', cvId)

        if (updateError) {
          console.error('Error updating CV:', updateError)
        }

        // Agregar mensaje del sistema al chat
        await supabase.from('cv_lab_messages').insert({
          cv_id: cvId,
          role: 'system',
          content: `✅ LinkedIn conectado exitosamente. Datos importados:
• Nombre: ${userInfo.name}
• Email: ${userInfo.email}
• Foto de perfil: ${userInfo.picture ? 'Sí' : 'No disponible'}

Para importar tu experiencia laboral, copia el contenido de tu perfil de LinkedIn y pégalo aquí. Por políticas de LinkedIn, no puedo acceder a esa información automáticamente.`
        })
      }

      return NextResponse.redirect(`${baseUrl}/admin/cv-lab/${cvId}?linkedin=connected`)
    }

    // Si no hay cv_id, redirigir a la lista con los datos en query params
    return NextResponse.redirect(
      `${baseUrl}/admin/cv-lab?linkedin=connected&name=${encodeURIComponent(userInfo.name)}&email=${encodeURIComponent(userInfo.email)}`
    )

  } catch (error) {
    console.error('LinkedIn OAuth error:', error)
    const redirectUrl = cvId
      ? `${baseUrl}/admin/cv-lab/${cvId}?error=linkedin_failed`
      : `${baseUrl}/admin/cv-lab?error=linkedin_failed`
    return NextResponse.redirect(redirectUrl)
  }
}
