import { NextResponse } from 'next/server'
import { getYappyClientConfig } from '@/lib/payments/yappy'

/**
 * GET /api/payments/yappy/config
 * Devuelve la configuración del cliente de Yappy para el frontend
 */
export async function GET() {
  try {
    const config = getYappyClientConfig()
    return NextResponse.json(config)
  } catch (error) {
    console.error('Error getting Yappy config:', error)
    return NextResponse.json(
      { error: 'Error obteniendo configuración' },
      { status: 500 }
    )
  }
}
