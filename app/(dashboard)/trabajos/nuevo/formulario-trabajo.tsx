'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { crearTrabajo } from '@/lib/services/trabajos'
import { crearCliente } from '@/lib/services/clientes'
import type { Cliente } from '@/lib/types/cliente'

export default function FormularioTrabajo({ clientes }: { clientes: Cliente[] }) {
  const router = useRouter()

  const [clienteId, setClienteId] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [fechaMaxima, setFechaMaxima] = useState('')
  const [precioFinal, setPrecioFinal] = useState('')
  const [sena, setSena] = useState('0')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  // Cliente nuevo, sin salir del formulario
  const [mostrarClienteNuevo, setMostrarClienteNuevo] = useState(false)
  const [nombreClienteNuevo, setNombreClienteNuevo] = useState('')
  const [telefonoClienteNuevo, setTelefonoClienteNuevo] = useState('')
  const [listaClientes, setListaClientes] = useState(clientes)
  const [creandoCliente, setCreandoCliente] = useState(false)

  async function handleCrearClienteRapido() {
    setCreandoCliente(true)
    const resultado = await crearCliente({
      nombre_razon_social: nombreClienteNuevo,
      telefono: telefonoClienteNuevo,
    })
    setCreandoCliente(false)

    if (resultado.error || !resultado.data) {
      setError(resultado.error ?? 'No se pudo crear el cliente')
      return
    }

    setListaClientes((prev) => [...prev, resultado.data])
    setClienteId(resultado.data.id)
    setMostrarClienteNuevo(false)
    setNombreClienteNuevo('')
    setTelefonoClienteNuevo('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setCargando(true)

    try {
      const resultado = await crearTrabajo({
        cliente_id: clienteId,
        descripcion,
        fecha_maxima: fechaMaxima,
        precio_final: Number(precioFinal),
        sena: Number(sena),
      })

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
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4 rounded-lg border border-gray-200 p-6">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Cliente</label>
        <div className="flex gap-2">
          <select
            required
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Seleccionar cliente...</option>
            {listaClientes.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre_razon_social}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setMostrarClienteNuevo((v) => !v)}
            className="whitespace-nowrap rounded-md border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50"
          >
            + Nuevo
          </button>
        </div>

        {mostrarClienteNuevo && (
          <div className="mt-3 flex flex-wrap items-end gap-2 rounded-md border border-gray-200 bg-gray-50 p-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Nombre</label>
              <input
                value={nombreClienteNuevo}
                onChange={(e) => setNombreClienteNuevo(e.target.value)}
                className="rounded-md border border-gray-300 px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Teléfono</label>
              <input
                value={telefonoClienteNuevo}
                onChange={(e) => setTelefonoClienteNuevo(e.target.value)}
                className="rounded-md border border-gray-300 px-2 py-1 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={handleCrearClienteRapido}
              disabled={creandoCliente || !nombreClienteNuevo}
              className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {creandoCliente ? 'Creando...' : 'Crear y usar'}
            </button>
          </div>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Descripción del trabajo</label>
        <textarea
          required
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Fecha máxima</label>
          <input
            type="date"
            value={fechaMaxima}
            onChange={(e) => setFechaMaxima(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Precio final</label>
          <input
            type="number"
            step="0.01"
            min="0"
            required
            value={precioFinal}
            onChange={(e) => setPrecioFinal(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Seña</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={sena}
            onChange={(e) => setSena(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={cargando}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {cargando ? 'Guardando...' : 'Crear trabajo'}
      </button>
    </form>
  )
}