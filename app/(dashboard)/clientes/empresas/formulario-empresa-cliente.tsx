'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  crearEmpresaCliente,
  actualizarEmpresaCliente,
} from '@/lib/services/empresas-clientes'
import type { EmpresaCliente } from '@/lib/types/empresa-cliente'

// Sin la prop "empresa" funciona como alta; con "empresa" funciona como edición.
export default function FormularioEmpresaCliente({ empresa }: { empresa?: EmpresaCliente }) {
  const router = useRouter()
  const esEdicion = !!empresa

  const [abierto, setAbierto] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [nombre, setNombre] = useState(empresa?.nombre ?? '')
  const [telefono, setTelefono] = useState(empresa?.telefono ?? '')
  const [email, setEmail] = useState(empresa?.email ?? '')
  const [cuit, setCuit] = useState(empresa?.cuit ?? '')
  const [domicilio, setDomicilio] = useState(empresa?.domicilio ?? '')
  const [localidad, setLocalidad] = useState(empresa?.localidad ?? '')
  const [provincia, setProvincia] = useState(empresa?.provincia ?? '')
  const [notas, setNotas] = useState(empresa?.notas ?? '')

  function restablecer() {
    setNombre(empresa?.nombre ?? '')
    setTelefono(empresa?.telefono ?? '')
    setEmail(empresa?.email ?? '')
    setCuit(empresa?.cuit ?? '')
    setDomicilio(empresa?.domicilio ?? '')
    setLocalidad(empresa?.localidad ?? '')
    setProvincia(empresa?.provincia ?? '')
    setNotas(empresa?.notas ?? '')
  }

  function cancelar() {
    restablecer()
    setError(null)
    setAbierto(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setCargando(true)

    const datos = { nombre, telefono, email, cuit, domicilio, localidad, provincia, notas }

    const resultado = esEdicion
      ? await actualizarEmpresaCliente(empresa.id, datos)
      : await crearEmpresaCliente(datos)

    setCargando(false)

    if (resultado.error) {
      setError(resultado.error)
      return
    }

    if (!esEdicion) {
      setNombre('')
      setTelefono('')
      setEmail('')
      setCuit('')
      setDomicilio('')
      setLocalidad('')
      setProvincia('')
      setNotas('')
    }

    setAbierto(false)
    router.refresh()
  }

  if (!abierto) {
    return esEdicion ? (
      <button
        onClick={() => setAbierto(true)}
        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Editar empresa
      </button>
    ) : (
      <button
        onClick={() => setAbierto(true)}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
      >
        + Nueva empresa
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4"
    >
      <p className="text-sm font-semibold text-gray-900">
        {esEdicion ? 'Editar datos de la empresa' : 'Nueva empresa'}
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Nombre de la empresa</label>
          <input
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Teléfono</label>
          <input
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">CUIT</label>
          <input
            value={cuit}
            onChange={(e) => setCuit(e.target.value)}
            placeholder="30-12345678-9"
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Domicilio</label>
          <input
            value={domicilio}
            onChange={(e) => setDomicilio(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Localidad</label>
          <input
            value={localidad}
            onChange={(e) => setLocalidad(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Provincia</label>
          <input
            value={provincia}
            onChange={(e) => setProvincia(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Notas</label>
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={cargando}
          className="rounded-md bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {cargando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Guardar'}
        </button>
        <button
          type="button"
          onClick={cancelar}
          className="rounded-md border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  )
}
