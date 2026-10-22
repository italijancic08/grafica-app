'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  obtenerUrlDescargaComprobante,
  regenerarComprobante,
  regenerarTodosLosComprobantes,
} from '@/lib/services/facturas'
import {
  ETIQUETAS_TIPO_COMPROBANTE,
  type Factura,
} from '@/lib/types/factura'
import {
  formatearMoneda,
  formatearFecha,
} from '@/lib/utils/formato'

type FacturaConRelaciones = Factura & {
  trabajos:
    | { numero: string }
    | { numero: string }[]
    | null
  clientes:
    | { nombre_razon_social: string }
    | { nombre_razon_social: string }[]
    | null
}

export default function ListaFacturas({
  facturas,
  administrador = false,
}: {
  facturas: FacturaConRelaciones[]
  administrador?: boolean
}) {
  const router = useRouter()

  const [regenerando, setRegenerando] =
    useState<string | null>(null)

  const [regenerandoTodos, setRegenerandoTodos] =
    useState(false)

  const [mensaje, setMensaje] =
    useState<string | null>(null)
  const [descargando, setDescargando] =
    useState<string | null>(null)

  const [error, setError] =
    useState<string | null>(null)

  async function handleDescargar(
    factura: Factura
  ) {
    if (!factura.archivo_pdf_url) return

    setError(null)
    setDescargando(factura.id)

    try {
      const resultado =
        await obtenerUrlDescargaComprobante(
          factura.archivo_pdf_url
        )

      if (
        resultado.error ||
        !resultado.data
      ) {
        setError(
          resultado.error ??
            'No se pudo generar el link de descarga'
        )
        return
      }

      window.open(
        resultado.data,
        '_blank'
      )
    } catch (err) {
      console.error(err)

      setError(
        'Ocurrió un error inesperado.'
      )
    } finally {
      setDescargando(null)
    }
  }

  async function handleRegenerar(
    factura: Factura
  ) {
    setError(null)
    setMensaje(null)
    setRegenerando(factura.id)

    try {
      const resultado =
        await regenerarComprobante(factura.id)

      if (resultado.error) {
        setError(resultado.error)
        return
      }

      setMensaje(
        `El PDF de ${factura.numero ?? 'el comprobante'} se actualizó al diseño actual.`
      )
      router.refresh()
    } catch (err) {
      console.error(err)
      setError('Ocurrió un error inesperado.')
    } finally {
      setRegenerando(null)
    }
  }

  async function handleRegenerarTodos() {
    if (
      !window.confirm(
        'Se van a volver a generar los PDF de TODOS los comprobantes con el diseño actual. Los números, fechas y montos no cambian. ¿Continuar?'
      )
    ) {
      return
    }

    setError(null)
    setMensaje(null)
    setRegenerandoTodos(true)

    try {
      const resultado =
        await regenerarTodosLosComprobantes()

      if (resultado.error) {
        setError(resultado.error)
        return
      }

      const fallidos = resultado.fallidos ?? []
      setMensaje(
        `Se actualizaron ${resultado.actualizados} comprobantes.` +
          (fallidos.length > 0
            ? ` No se pudieron actualizar ${fallidos.length}: ${fallidos.join(' | ')}`
            : '')
      )
      router.refresh()
    } catch (err) {
      console.error(err)
      setError('Ocurrió un error inesperado.')
    } finally {
      setRegenerandoTodos(false)
    }
  }

  if (facturas.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Todavía no se generó ningún comprobante.
      </p>
    )
  }

  return (
    <>
    {administrador && (
      <div className="mb-3">
        <button
          onClick={handleRegenerarTodos}
          disabled={regenerandoTodos}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {regenerandoTodos
            ? 'Actualizando comprobantes...'
            : 'Actualizar todos al diseño nuevo'}
        </button>
      </div>
    )}

    {mensaje && (
      <p className="mb-3 text-sm text-green-700">
        {mensaje}
      </p>
    )}

    <div className="divide-y divide-gray-200 rounded-lg border border-gray-200">
      {facturas.map((f) => {
        const trabajo = Array.isArray(
          f.trabajos
        )
          ? f.trabajos[0]
          : f.trabajos

        const cliente = Array.isArray(
          f.clientes
        )
          ? f.clientes[0]
          : f.clientes

        return (
          <div
            key={f.id}
            className="flex items-center justify-between gap-4 p-3 text-sm"
          >
            <div className="min-w-0">
              <p className="font-medium">
                {f.numero ??
                  '(sin número)'}
              </p>

              <p className="text-xs text-gray-500">
                {
                  ETIQUETAS_TIPO_COMPROBANTE[
                    f.tipo_comprobante
                  ]
                }
                {' · '}
                {formatearFecha(f.fecha)}
                {' · '}
                {formatearMoneda(f.monto)}

                {cliente &&
                  ` · ${cliente.nombre_razon_social}`}

                {trabajo &&
                  ` · ${trabajo.numero}`}
              </p>
            </div>

            <div className="flex items-center gap-4">
              {f.archivo_pdf_url ? (
                <button
                  onClick={() =>
                    handleDescargar(f)
                  }
                  disabled={
                    descargando === f.id
                  }
                  className="whitespace-nowrap text-xs font-medium text-gray-600 hover:underline disabled:opacity-50"
                >
                  {descargando === f.id
                    ? 'Generando link...'
                    : 'Descargar PDF'}
                </button>
              ) : (
                <span className="whitespace-nowrap text-xs text-gray-400">
                  PDF no disponible
                </span>
              )}

              <button
                onClick={() =>
                  handleRegenerar(f)
                }
                disabled={
                  regenerando === f.id ||
                  regenerandoTodos
                }
                className="whitespace-nowrap text-xs font-medium text-gray-600 hover:underline disabled:opacity-50"
              >
                {regenerando === f.id
                  ? 'Actualizando...'
                  : f.archivo_pdf_url
                    ? 'Actualizar diseño'
                    : 'Generar PDF'}
              </button>
            </div>
          </div>
        )
      })}

      {error && (
        <p className="p-3 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
    </>
  )
}