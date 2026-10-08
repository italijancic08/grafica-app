'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { actualizarCliente } from '@/lib/services/clientes'
import type { Cliente } from '@/lib/types/cliente'

export default function FormularioEditarCliente({ cliente }: { cliente: Cliente }) {
  const router = useRouter()
  const [editando, setEditando] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [nombre, setNombre] = useState(cliente.nombre_razon_social)
  const [telefono, setTelefono] = useState(cliente.telefono ?? '')
  const [whatsapp, setWhatsapp] = useState(cliente.whatsapp ?? '')
  const [email, setEmail] = useState(cliente.email ?? '')
  const [cuitCuil, setCuitCuil] = useState(cliente.cuit_cuil ?? '')
  const [domicilio, setDomicilio] = useState(cliente.domicilio ?? '')
  const [localidad, setLocalidad] = useState(cliente.localidad ?? '')
  const [provincia, setProvincia] = useState(cliente.provincia ?? '')
  const [notas, setNotas] = useState(cliente.notas ?? '')

  function cancelar() {
    setEditando(false)
    setError(null)
    setNombre(cliente.nombre_razon_social)
    setTelefono(cliente.telefono ?? '')
    setWhatsapp(cliente.whatsapp ?? '')
    setEmail(cliente.email ?? '')
    setCuitCuil(cliente.cuit_cuil ?? '')
    setDomicilio(cliente.domicilio ?? '')
    setLocalidad(cliente.localidad ?? '')
    setProvincia(cliente.provincia ?? '')
    setNotas(cliente.notas ?? '')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setCargando(true)

    const resultado = await actualizarCliente(cliente.id, {
      nombre_razon_social: nombre,
      telefono,
      whatsapp,
      email,
      cuit_cuil: cuitCuil,
      domicilio,
      localidad,
      provincia,
      notas,
    })

    setCargando(false)

    if (resultado.error) {
      setError(resultado.error)
      return
    }

    setEditando(false)
    router.refresh()
  }

  if (!editando) {
    return (
      <button
        onClick={() => setEditando(true)}
        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Editar cliente
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4"
    >
      <p className="text-sm font-semibold text-gray-900">Editar datos del cliente</p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Nombre / Razón social</label>
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
          <label className="mb-1 block text-xs font-medium text-gray-700">WhatsApp</label>
          <input
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
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
          <label className="mb-1 block text-xs font-medium text-gray-700">CUIT/CUIL/DNI</label>
          <input
            value={cuitCuil}
            onChange={(e) => setCuitCuil(e.target.value)}
            placeholder="20-12345678-9"
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
          {cargando ? 'Guardando...' : 'Guardar cambios'}
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