'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cambiarEstadoPresupuesto, convertirEnTrabajo } from '@/lib/services/presupuestos'
import { ETIQUETAS_ESTADO_PRESUPUESTO, type Presupuesto, type EstadoPresupuesto } from '@/lib/types/presupuesto'
import { ETIQUETAS_RUBRO_TRABAJO, type RubroTrabajo } from '@/lib/types/trabajo'
import { formatearMoneda, formatearFecha } from '@/lib/utils/formato'

function badgeEstado(estado: EstadoPresupuesto) {
  const colores: Record<EstadoPresupuesto, string> = {
    PENDIENTE: 'bg-yellow-100 text-yellow-700',
    APROBADO: 'bg-green-100 text-green-700',
    RECHAZADO: 'bg-red-100 text-red-700',
  }
  return colores[estado]
}

export default function FilaPresupuesto({ presupuesto }: { presupuesto: Presupuesto }) {
  const router = useRouter()
  const [convirtiendo, setConvirtiendo] = useState(false)
  const [rubro, setRubro] = useState<RubroTrabajo | ''>('')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  async function handleCambiarEstado(estado: EstadoPresupuesto) {
    setCargando(true)
    try {
      await cambiarEstadoPresupuesto(presupuesto.id, estado)
      router.refresh()
    } finally {
      setCargando(false)
    }
  }

  async function handleConvertir(e: React.FormEvent) {
    e.preventDefault()
    if (!rubro) return
    setError(null)
    setCargando(true)

    try {
      const resultado = await convertirEnTrabajo(presupuesto.id, rubro)
      if (resultado.error) {
        setError(resultado.error)
        return
      }
      router.push(`/trabajos/${resultado.data.id}`)
    } catch (err) {
      console.error(err)
      setError('Ocurrió un error inesperado.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <>
      <tr className="hover:bg-gray-50">
        <td className="px-4 py-2">{formatearFecha(presupuesto.fecha)}</td>
        <td className="px-4 py-2">{presupuesto.clientes?.nombre_razon_social}</td>
        <td className="px-4 py-2 max-w-xs truncate">{presupuesto.descripcion}</td>
        <td className="px-4 py-2">{formatearMoneda(presupuesto.monto)}</td>
        <td className="px-4 py-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeEstado(presupuesto.estado)}`}>
            {ETIQUETAS_ESTADO_PRESUPUESTO[presupuesto.estado]}
          </span>
        </td>
        <td className="px-4 py-2 text-right">
          {presupuesto.trabajo_id ? (
            <Link href={`/trabajos/${presupuesto.trabajo_id}`} className="text-sm font-medium text-gray-900 hover:underline">
              Ver trabajo
            </Link>
          ) : presupuesto.estado === 'PENDIENTE' ? (
            <div className="flex justify-end gap-2">
              <button
                onClick={() => handleCambiarEstado('APROBADO')}
                disabled={cargando}
                className="text-xs font-medium text-green-700 hover:underline disabled:opacity-50"
              >
                Aprobar
              </button>
              <button
                onClick={() => handleCambiarEstado('RECHAZADO')}
                disabled={cargando}
                className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
              >
                Rechazar
              </button>
            </div>
          ) : presupuesto.estado === 'APROBADO' ? (
            <button
              onClick={() => setConvirtiendo(true)}
              className="text-xs font-medium text-gray-900 hover:underline"
            >
              Convertir en trabajo
            </button>
          ) : null}
        </td>
      </tr>
      {convirtiendo && (
        <tr>
          <td colSpan={6} className="bg-gray-50 px-4 py-3">
            <form onSubmit={handleConvertir} className="flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Rubro del trabajo</label>
                <select
                  required
                  value={rubro}
                  onChange={(e) => setRubro(e.target.value as RubroTrabajo)}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                >
                  <option value="">Seleccionar rubro...</option>
                  {Object.entries(ETIQUETAS_RUBRO_TRABAJO).map(([valor, etiqueta]) => (
                    <option key={valor} value={valor}>{etiqueta}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={cargando}
                className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {cargando ? 'Convirtiendo...' : 'Confirmar conversión'}
              </button>
              <button
                type="button"
                onClick={() => setConvirtiendo(false)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
              >
                Cancelar
              </button>
              {error && <p className="w-full text-sm text-red-600">{error}</p>}
            </form>
          </td>
        </tr>
      )}
    </>
  )
}