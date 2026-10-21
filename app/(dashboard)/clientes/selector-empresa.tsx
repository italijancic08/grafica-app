'use client'

import { useState } from 'react'
import { crearEmpresaCliente } from '@/lib/services/empresas-clientes'
import type { EmpresaCliente } from '@/lib/types/empresa-cliente'

// Select reutilizable de empresas. Si se pasa "destacadaId", esa empresa
// aparece primera en la lista (ej: la empresa a la que pertenece el cliente).
// Con "permitirCrear" se muestra el botón "+ Nueva empresa" para crear una
// sin salir del formulario (igual que en el selector de clientes).
export default function SelectorEmpresa({
  empresas,
  valor,
  onChange,
  etiquetaVacia = 'Sin empresa',
  destacadaId,
  className = 'w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm',
  permitirCrear = false,
}: {
  empresas: EmpresaCliente[]
  valor: string
  onChange: (id: string) => void
  etiquetaVacia?: string
  destacadaId?: string
  className?: string
  permitirCrear?: boolean
}) {
  const [creadas, setCreadas] = useState<EmpresaCliente[]>([])
  const [mostrarNueva, setMostrarNueva] = useState(false)
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [cuit, setCuit] = useState('')
  const [localidad, setLocalidad] = useState('')
  const [creando, setCreando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Las empresas recién creadas se suman a la lista que llegó por props
  const todas = [...empresas, ...creadas.filter((c) => !empresas.some((e) => e.id === c.id))]
  const destacada = destacadaId ? todas.find((e) => e.id === destacadaId) : undefined
  const resto = todas.filter((e) => e.id !== destacada?.id)

  async function handleCrear() {
    setError(null)
    setCreando(true)

    const resultado = await crearEmpresaCliente({ nombre, telefono, cuit, localidad })

    setCreando(false)

    if (resultado.error || !resultado.data) {
      setError(resultado.error ?? 'No se pudo crear la empresa')
      return
    }

    setCreadas((prev) => [...prev, resultado.data as EmpresaCliente])
    onChange(resultado.data.id)
    setMostrarNueva(false)
    setNombre('')
    setTelefono('')
    setCuit('')
    setLocalidad('')
  }

  // Enter dentro de estos campos no debe enviar el formulario de carga
  function alApretarTecla(e: React.KeyboardEvent) {
    if (e.key !== 'Enter') return
    e.preventDefault()
    if (nombre.trim() && !creando) handleCrear()
  }

  const selector = (
    <select value={valor} onChange={(e) => onChange(e.target.value)} className={className}>
      <option value="">{etiquetaVacia}</option>
      {destacada && (
        <option value={destacada.id}>{destacada.nombre} (empresa del cliente)</option>
      )}
      {resto.map((e) => (
        <option key={e.id} value={e.id}>{e.nombre}</option>
      ))}
    </select>
  )

  if (!permitirCrear) return selector

  return (
    <div>
      <div className="flex gap-2">
        {selector}
        <button
          type="button"
          onClick={() => setMostrarNueva((v) => !v)}
          className="whitespace-nowrap rounded-md border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50"
        >
          + Nueva empresa
        </button>
      </div>

      {mostrarNueva && (
        <div className="mt-3 flex flex-wrap items-end gap-2 rounded-md border border-gray-200 bg-gray-50 p-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Nombre</label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              onKeyDown={alApretarTecla}
              className="rounded-md border border-gray-300 px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Teléfono</label>
            <input
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              onKeyDown={alApretarTecla}
              className="rounded-md border border-gray-300 px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">CUIT</label>
            <input
              value={cuit}
              onChange={(e) => setCuit(e.target.value)}
              onKeyDown={alApretarTecla}
              placeholder="30-12345678-9"
              className="rounded-md border border-gray-300 px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Localidad</label>
            <input
              value={localidad}
              onChange={(e) => setLocalidad(e.target.value)}
              onKeyDown={alApretarTecla}
              className="rounded-md border border-gray-300 px-2 py-1 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleCrear}
            disabled={creando || !nombre.trim()}
            className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {creando ? 'Creando...' : 'Crear y usar'}
          </button>
          {error && <p className="w-full text-sm text-red-600">{error}</p>}
        </div>
      )}
    </div>
  )
}