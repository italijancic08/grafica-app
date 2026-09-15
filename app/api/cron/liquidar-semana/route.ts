import { NextRequest, NextResponse } from 'next/server'
import {
  generarLiquidacionSemanaAnterior,
} from '@/lib/services/liquidaciones'

export async function GET(
  request: NextRequest
) {
  const authHeader =
    request.headers.get('authorization')

  const secret =
    process.env.CRON_SECRET

  if (
    !secret ||
    authHeader !== `Bearer ${secret}`
  ) {
    return NextResponse.json(
      {
        error: 'No autorizado',
      },
      {
        status: 401,
      }
    )
  }

  try {
    const resultado =
      await generarLiquidacionSemanaAnterior()

    if (resultado.error) {
      return NextResponse.json(
        resultado,
        {
          status:
            resultado.pendiente
              ? 200
              : 500,
        }
      )
    }

    return NextResponse.json({
      success: true,
      resultado,
    })
  } catch (error) {
    console.error(
      'Error en cron de liquidación:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Error interno generando la liquidación.',
      },
      {
        status: 500,
      }
    )
  }
}