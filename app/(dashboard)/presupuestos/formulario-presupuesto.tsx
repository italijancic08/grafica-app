'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { crearPresupuesto } from '@/lib/services/presupuestos'
import { crearCliente } from '@/lib/services/clientes'
import type { Cliente } from '@/lib/types/cliente'

export default function FormularioPresupuesto({ clientes }: { clientes: Cliente[] }) {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [clienteId, setClienteId] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [monto, setMonto] = useState('')
  const [anchoCm, setAnchoCm] = useState('')
  const [largoCm, setLargoCm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  const [mostrarClienteNuevo, setMostrarClienteNuevo] = useState(false)
  const [nombreClienteNuevo, setNombreClienteNuevo] = useState('')
  const [telefonoClienteNuevo, setTelefonoClienteNuevo] = useState('')
  const [listaClientes, setListaClientes] = useState(clientes)
  const [creandoCliente, setCreandoCliente] = useState(false)

  const m2 = Number(anchoCm) > 0 && Number(largoCm) > 0
    ? (Number(anchoCm) / 100) * (Number(largoCm) / 100)
    : null

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
      const resultado = await crearPresupuesto({
        cliente_id: clienteId,
        descripcion,
        monto: Number(monto),
        ancho_cm: anchoCm ? Number(anchoCm) : undefined,
        largo_cm: largoCm ? Number(largoCm) : undefined,
      })

      if (resultado.error) {
        setError(resultado.error)
        return
      }

      setClienteId('')
      setDescripcion('')
      setMonto('')
      setAnchoCm('')
      setLargoCm('')
      setAbierto(false)
      router.refresh()
    } catch (err) {
      console.error(err)
      setError('Ocurrió un error inesperado.')
    } finally {
      setCargando(false)
    }
  }

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
      >
        + Nuevo presupuesto
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-gray-200 p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Cliente</label>
          <div className="flex gap-2">
            <select
              required
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            >
              <option value="">Seleccionar cliente...</option>
              {listaClientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre_razon_social}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setMostrarClienteNuevo((v) => !v)}
              className="whitespace-nowrap rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
            >
              + Nuevo
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Descripción</label>
          <input
            required
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="w-64 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Monto</label>
          <input
            type="number"
            step="0.01"
            min="0"
            required
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="w-32 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Ancho (cm)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={anchoCm}
            onChange={(e) => setAnchoCm(e.target.value)}
            className="w-24 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Largo (cm)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={largoCm}
            onChange={(e) => setLargoCm(e.target.value)}
            className="w-24 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>
        {m2 !== null && (
          <p className="pb-2 text-sm text-gray-500">= {m2.toFixed(2)} m²</p>
        )}

        <button
          type="submit"
          disabled={cargando}
          className="rounded-md bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {cargando ? 'Guardando...' : 'Guardar'}
        </button>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="rounded-md border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </button>
      </div>

      {mostrarClienteNuevo && (
        <div className="flex flex-wrap items-end gap-2 rounded-md border border-gray-200 bg-gray-50 p-3">
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

      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  )
}