'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  actualizarTurno,
  crearInstalador,
} from '@/lib/services/trabajos'
import {
  ETIQUETAS_ESTADO_OPERATIVO,
  type EstadoOperativo,
} from '@/lib/types/trabajo'
import { formatearMoneda } from '@/lib/utils/formato'

type Instalador = {
  id: string
  nombre: string
}

type Turno = {
  id: string
  trabajo_id: string
  fecha: string | null
  hora: string | null
  estado: string
  instalador_id: string | null
  instaladores: {
    id: string
    nombre: string
  } | null
  trabajos: {
    id: string
    numero: string
    descripcion: string
    precio_final: number
    estado_operativo: EstadoOperativo
    clientes: {
      nombre_razon_social: string
      telefono: string | null
    } | null
  }
}

const ESTADOS_TURNO: EstadoOperativo[] = [
  'INGRESADO',
  'EN_PRODUCCION',
  'TERCERIZADO',
  'TERMINADO',
  'PARA_RETIRAR',
  'RETIRADO',
  'CANCELADO',
]

export default function GestorTurnos({
  turnos,
  instaladores,
}: {
  turnos: Turno[]
  instaladores: Instalador[]
}) {
  const router = useRouter()

  const [nuevoInstalador, setNuevoInstalador] = useState('')
  const [guardandoInstalador, setGuardandoInstalador] =
    useState(false)
  const [error, setError] = useState('')
  const [guardandoId, setGuardandoId] = useState('')

  async function agregarInstalador(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault()
    setError('')
    setGuardandoInstalador(true)

    try {
      const resultado = await crearInstalador(nuevoInstalador)

      if (resultado.error) {
        setError(resultado.error)
        return
      }

      setNuevoInstalador('')
      router.refresh()
    } catch {
      setError('No se pudo agregar el instalador.')
    } finally {
      setGuardandoInstalador(false)
    }
  }

  async function guardarTurno(
    e: React.FormEvent<HTMLFormElement>,
    turno: Turno
  ) {
    e.preventDefault()
    setError('')
    setGuardandoId(turno.id)

    const form = new FormData(e.currentTarget)

    try {
      const resultado = await actualizarTurno({
        id: turno.id,
        trabajo_id: turno.trabajos.id,
        fecha: String(form.get('fecha') ?? ''),
        hora: String(form.get('hora') ?? ''),
        instalador_id: String(
          form.get('instalador_id') ?? ''
        ),
        estado: String(
          form.get('estado') ?? turno.trabajos.estado_operativo
        ),
      })

      if (resultado.error) {
        setError(resultado.error)
        return
      }

      router.refresh()
    } catch {
      setError('No se pudieron guardar los cambios del turno.')
    } finally {
      setGuardandoId('')
    }
  }

  return (
    <div className="space-y-6">
      {/* Instaladores */}
      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">
          Instaladores
        </h2>

        <div className="mb-3 flex flex-wrap gap-2">
          {instaladores.map((instalador) => (
            <span
              key={instalador.id}
              className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
            >
              {instalador.nombre}
            </span>
          ))}

          {instaladores.length === 0 && (
            <p className="text-sm text-gray-500">
              Todavía no hay instaladores cargados.
            </p>
          )}
        </div>

        <form
          onSubmit={agregarInstalador}
          className="flex max-w-lg gap-2"
        >
          <input
            value={nuevoInstalador}
            onChange={(e) => setNuevoInstalador(e.target.value)}
            placeholder="Nombre del instalador"
            className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
            required
          />

          <button
            type="submit"
            disabled={guardandoInstalador}
            className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {guardandoInstalador ? 'Agregando…' : 'Agregar'}
          </button>
        </form>
      </section>

      {error && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* Listado de turnos */}
      <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-900">
            Turnos
          </h2>
        </div>

        {turnos.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">
            No hay turnos aceptados. Los presupuestos marcados
            como trabajos con turno aparecerán acá cuando sean
            aceptados.
          </p>
        ) : (
          <div className="divide-y divide-gray-200">
            {turnos.map((turno) => (
              <form
                key={turno.id}
                onSubmit={(e) => guardarTurno(e, turno)}
                className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)_auto] lg:items-center"
              >
                {/* Cliente y trabajo */}
                <div className="min-w-0">
                  <Link
                    href={`/trabajos/${turno.trabajos.id}`}
                    className="text-sm font-semibold text-gray-900 hover:underline"
                  >
                    {turno.trabajos.numero}
                  </Link>

                  <p className="mt-1 text-sm text-gray-700">
                    {turno.trabajos.clientes?.nombre_razon_social ??
                      'Cliente sin nombre'}
                  </p>

                  {turno.trabajos.clientes?.telefono && (
                    <p className="mt-1 text-xs text-gray-500">
                      Teléfono: {turno.trabajos.clientes.telefono}
                    </p>
                  )}

                  <p className="mt-2 text-sm text-gray-500">
                    {turno.trabajos.descripcion}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Precio:{' '}
                    {formatearMoneda(
                      turno.trabajos.precio_final
                    )}
                  </p>
                </div>

                {/* Datos del turno y estado del trabajo */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <label className="text-xs text-gray-500">
                    Día
                    <input
                      name="fecha"
                      type="date"
                      defaultValue={turno.fecha ?? ''}
                      className="mt-1 w-full rounded-md border border-gray-300 px-2 py-2 text-sm text-gray-800"
                    />
                  </label>

                  <label className="text-xs text-gray-500">
                    Hora
                    <input
                      name="hora"
                      type="time"
                      defaultValue={turno.hora?.slice(0, 5) ?? ''}
                      className="mt-1 w-full rounded-md border border-gray-300 px-2 py-2 text-sm text-gray-800"
                    />
                  </label>

                  <label className="text-xs text-gray-500">
                    Instalador
                    <select
                      name="instalador_id"
                      defaultValue={turno.instalador_id ?? ''}
                      className="mt-1 w-full rounded-md border border-gray-300 px-2 py-2 text-sm text-gray-800"
                    >
                      <option value="">Sin asignar</option>

                      {instaladores.map((instalador) => (
                        <option
                          key={instalador.id}
                          value={instalador.id}
                        >
                          {instalador.nombre}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="text-xs text-gray-500">
                    Estado del trabajo
                    <select
                      name="estado"
                      defaultValue={
                        turno.trabajos.estado_operativo
                      }
                      className="mt-1 w-full rounded-md border border-gray-300 px-2 py-2 text-sm text-gray-800"
                    >
                      {ESTADOS_TURNO.map((estado) => (
                        <option key={estado} value={estado}>
                          {ETIQUETAS_ESTADO_OPERATIVO[estado]}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {/* Guardar cambios */}
                <button
                  type="submit"
                  disabled={guardandoId === turno.id}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  {guardandoId === turno.id
                    ? 'Guardando…'
                    : 'Guardar'}
                </button>
              </form>
            ))}
          </div>
        )}
      </section>

      <p className="text-xs text-gray-500">
        Los turnos y los trabajos comparten el mismo estado
        operativo. Los cambios realizados acá también se
        reflejan en la sección Trabajos.
      </p>
    </div>
  )
}