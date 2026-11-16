'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { liquidarPeriodo } from '@/lib/services/liquidaciones'
import { fechaHoyArgentina } from '@/lib/utils/formato'

type Aviso = {
  tipo: 'ok' | 'error'
  texto: string
  pendiente?: boolean
  solapamiento?: boolean
}

export default function LiquidarPeriodo() {
  const router = useRouter()
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState(fechaHoyArgentina())
  const [cargando, setCargando] = useState(false)
  const [aviso, setAviso] = useState<Aviso | null>(null)

  async function liquidar(opciones?: {
    permitirIncompleta?: boolean
    confirmarSolapamiento?: boolean
  }) {
    setAviso(null)
    setCargando(true)

    try {
      const resultado = await liquidarPeriodo(desde, hasta, opciones)

      if (resultado.error) {
        setAviso({
          tipo: 'error',
          texto: resultado.error,
          pendiente: !!resultado.pendiente,
          solapamiento: !!resultado.solapamiento,
        })
        return
      }

      const abiertos = resultado.fichajesAbiertos?.length ?? 0

      setAviso({
        tipo: 'ok',
        texto:
          abiertos > 0
            ? 'La liquidación quedó pendiente: hay fichajes abiertos que no suman horas hasta que se registre su salida. Podés volver a liquidar el mismo período más tarde.'
            : 'Liquidación generada. Ya podés descargar el Excel desde la lista de abajo.',
      })
      router.refresh()
    } catch (err) {
      console.error(err)
      setAviso({ tipo: 'error', texto: 'Ocurrió un error inesperado.' })
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-gray-900">Liquidar un período</h2>
      <p className="mb-3 mt-1 text-xs text-gray-500">
        Elegí desde qué día hasta qué día querés liquidar (los dos días incluidos).
      </p>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Desde</label>
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Hasta</label>
          <input
            type="date"
            value={hasta}
            max={fechaHoyArgentina()}
            onChange={(e) => setHasta(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>

        <button
          type="button"
          onClick={() => liquidar()}
          disabled={cargando || !desde || !hasta}
          className="rounded-md bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {cargando ? 'Liquidando...' : 'Liquidar período'}
        </button>
      </div>

      {aviso && (
        <div
          className={`mt-3 rounded-md p-3 text-sm ${
            aviso.tipo === 'ok' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'
          }`}
        >
          <p>{aviso.texto}</p>

          {aviso.solapamiento && (
            <button
              type="button"
              onClick={() => liquidar({ confirmarSolapamiento: true })}
              disabled={cargando}
              className="mt-2 rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              Liquidar de todas formas
            </button>
          )}

          {aviso.pendiente && (
            <button
              type="button"
              onClick={() => liquidar({ permitirIncompleta: true, confirmarSolapamiento: true })}
              disabled={cargando}
              className="mt-2 rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              Liquidar igual (sin contar los fichajes abiertos)
            </button>
          )}
        </div>
      )}
    </div>
  )
}