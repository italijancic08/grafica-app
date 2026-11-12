'use client'

import { useEffect, useState } from 'react'
import { crearCliente } from '@/lib/services/clientes'
import { listarEmpresasClientes } from '@/lib/services/empresas-clientes'
import type { Cliente } from '@/lib/types/cliente'
import type { EmpresaCliente } from '@/lib/types/empresa-cliente'
import SelectorEmpresa from './selector-empresa'

// Formulario único de "Nuevo cliente". Se usa en la sección Clientes y al
// cargar un trabajo/presupuesto. No usa <form> porque a veces se muestra
// dentro de otro formulario (el de cargar trabajo).
export default function FormularioCliente({
  onCreado,
  onCancelar,
}: {
  onCreado: (cliente: Cliente) => void
  onCancelar: () => void
}) {
  const [empresas, setEmpresas] = useState<EmpresaCliente[]>([])
  const [nombre, setNombre] = useState('')
  const [empresaId, setEmpresaId] = useState('')
  const [telefono, setTelefono] = useState('')
  const [cuitCuil, setCuitCuil] = useState('')
  const [domicilio, setDomicilio] = useState('')
  const [localidad, setLocalidad] = useState('')
  const [email, setEmail] = useState('')
  const [notas, setNotas] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    let activo = true

    listarEmpresasClientes().then((resultado) => {
      if (activo && resultado.data) {
        setEmpresas(resultado.data as EmpresaCliente[])
      }
    })

    return () => {
      activo = false
    }
  }, [])

  async function guardar() {
    setError(null)

    if (nombre.trim().length < 2) {
      setError('El nombre y apellido es obligatorio')
      return
    }

    if (!telefono.trim()) {
      setError('El teléfono es obligatorio')
      return
    }

    setCargando(true)

    const resultado = await crearCliente({
      nombre_razon_social: nombre.trim(),
      empresa_cliente_id: empresaId,
      telefono: telefono.trim(),
      cuit_cuil: cuitCuil,
      domicilio,
      localidad,
      email,
      notas,
    })

    setCargando(false)

    if (resultado.error || !resultado.data) {
      setError(resultado.error ?? 'No se pudo crear el cliente')
      return
    }

    onCreado(resultado.data as Cliente)
  }

  // Enter en un campo de una sola línea guarda (sin enviar el formulario de afuera)
  function alApretarTecla(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== 'Enter') return
    if ((e.target as HTMLElement).tagName !== 'INPUT') return

    e.preventDefault()
    if (!cargando) guardar()
  }

  const clasesInput =
    'w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm'

  return (
    <div
      onKeyDown={alApretarTecla}
      className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4"
    >
      <p className="text-sm font-semibold text-gray-900">Nuevo cliente</p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Nombre y apellido *
          </label>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className={clasesInput}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Empresa
          </label>
          <SelectorEmpresa
            empresas={empresas}
            valor={empresaId}
            onChange={setEmpresaId}
            permitirCrear
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Teléfono *
          </label>
          <input
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            className={clasesInput}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            CUIT / DNI
          </label>
          <input
            value={cuitCuil}
            onChange={(e) => setCuitCuil(e.target.value)}
            className={clasesInput}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Domicilio
          </label>
          <input
            value={domicilio}
            onChange={(e) => setDomicilio(e.target.value)}
            className={clasesInput}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Localidad
          </label>
          <input
            value={localidad}
            onChange={(e) => setLocalidad(e.target.value)}
            className={clasesInput}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={clasesInput}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">
          Notas
        </label>
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={2}
          className={clasesInput}
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={guardar}
          disabled={cargando}
          className="rounded-md bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {cargando ? 'Guardando...' : 'Guardar cliente'}
        </button>

        <button
          type="button"
          onClick={onCancelar}
          className="rounded-md border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}