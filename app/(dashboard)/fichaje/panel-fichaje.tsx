'use client'

import { useEffect, useState } from 'react'
import {
  ficharEntrada,
  ficharSalida,
  obtenerFichajeAbierto,
} from '@/lib/services/fichaje'

export default function PanelFichaje() {
  const [abierto, setAbierto] =
    useState<any>(null)

  const [cargando, setCargando] =
    useState(true)

  const [procesando, setProcesando] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  const [mensaje, setMensaje] =
    useState<string | null>(null)

  async function cargarEstado() {
    const resultado =
      await obtenerFichajeAbierto()

    if (resultado.error) {
      setError(resultado.error)
    } else {
      setAbierto(resultado.data ?? null)
    }

    setCargando(false)
  }

  useEffect(() => {
    cargarEstado()
  }, [])

  async function entrada() {
    setProcesando(true)
    setError(null)
    setMensaje(null)

    try {
      const resultado =
        await ficharEntrada()

      if (resultado.error) {
        setError(resultado.error)
        return
      }

      setMensaje(
        'Entrada registrada correctamente.'
      )

      await cargarEstado()
    } finally {
      setProcesando(false)
    }
  }

  async function salida() {
    setProcesando(true)
    setError(null)
    setMensaje(null)

    try {
      const resultado =
        await ficharSalida()

      if (resultado.error) {
        setError(resultado.error)
        return
      }

      setMensaje(
        'Salida registrada correctamente.'
      )

      await cargarEstado()
    } finally {
      setProcesando(false)
    }
  }

  if (cargando) {
    return (
      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-500">
          Cargando fichaje...
        </p>
      </div>
    )
  }

  return (
    <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-gray-500">
            Estado actual
          </p>

          {abierto ? (
            <>
              <p className="mt-1 text-lg font-semibold text-green-700">
                Jornada en curso
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Entrada registrada:{' '}
                {new Date(
                  abierto.entrada
                ).toLocaleString('es-AR')}
              </p>
            </>
          ) : (
            <>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                Sin jornada activa
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Todavía no registraste tu entrada.
              </p>
            </>
          )}
        </div>

        <div className="flex gap-3">
          {!abierto ? (
            <button
              type="button"
              onClick={entrada}
              disabled={procesando}
              className="rounded-md bg-green-600 px-6 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
              {procesando
                ? 'Registrando...'
                : 'Fichar entrada'}
            </button>
          ) : (
            <button
              type="button"
              onClick={salida}
              disabled={procesando}
              className="rounded-md bg-red-600 px-6 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {procesando
                ? 'Registrando...'
                : 'Fichar salida'}
            </button>
          )}
        </div>
      </div>

      {mensaje && (
        <p className="mt-4 text-sm text-green-600">
          {mensaje}
        </p>
      )}

      {error && (
        <p className="mt-4 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}