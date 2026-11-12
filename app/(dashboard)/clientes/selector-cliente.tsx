'use client'

import { useMemo, useState } from 'react'
import type { Cliente } from '@/lib/types/cliente'
import FormularioCliente from './formulario-cliente'

function normalizar(texto: string) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

export default function SelectorCliente({
  clientes,
  clienteId,
  onChange,
}: {
  clientes: Cliente[]
  clienteId: string
  onChange: (id: string) => void
}) {
  const [lista, setLista] = useState(clientes)
  const [busqueda, setBusqueda] = useState('')
  const [abierto, setAbierto] = useState(false)

  const [mostrarClienteNuevo, setMostrarClienteNuevo] = useState(false)

  const seleccionado = lista.find((c) => c.id === clienteId)

  const filtrados = useMemo(() => {
    const q = normalizar(busqueda.trim())
    if (!q) return lista
    return lista.filter((c) =>
      normalizar([c.nombre_razon_social, c.telefono ?? '', c.cuit_cuil ?? ''].join(' ')).includes(q)
    )
  }, [lista, busqueda])

  function seleccionar(id: string) {
    onChange(id)
    setBusqueda('')
    setAbierto(false)
  }

  function handleClienteCreado(nuevo: Cliente) {
    setLista((prev) => [...prev, nuevo])
    seleccionar(nuevo.id)
    setMostrarClienteNuevo(false)
  }

  return (
    <div>
      <div className="flex gap-2">
        <div className="relative w-full">
          {seleccionado && !abierto ? (
            <div className="flex items-center justify-between rounded-md border border-gray-300 px-3 py-2 text-sm">
              <span className="text-gray-900">{seleccionado.nombre_razon_social}</span>
              <button
                type="button"
                onClick={() => {
                  onChange('')
                  setBusqueda('')
                  setAbierto(true)
                }}
                className="text-xs font-medium text-gray-600 hover:underline"
              >
                Cambiar
              </button>
            </div>
          ) : (
            <>
              <input
                type="text"
                autoFocus={!!clienteId === false && abierto}
                value={busqueda}
                placeholder="Buscar cliente por nombre, teléfono o CUIT..."
                onChange={(e) => {
                  setBusqueda(e.target.value)
                  setAbierto(true)
                }}
                onFocus={() => setAbierto(true)}
                onBlur={() => setAbierto(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    if (filtrados.length > 0) seleccionar(filtrados[0].id)
                  }
                }}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
              />

              {abierto && (
                <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-sm">
                  {filtrados.length === 0 && (
                    <li className="px-3 py-2 text-sm text-gray-500">No se encontraron clientes.</li>
                  )}
                  {filtrados.map((c) => (
                    <li
                      key={c.id}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        seleccionar(c.id)
                      }}
                      className="cursor-pointer px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      <span className="text-gray-900">{c.nombre_razon_social}</span>
                      {(c.telefono || c.cuit_cuil) && (
                        <span className="ml-2 text-xs text-gray-400">
                          {[c.telefono, c.cuit_cuil].filter(Boolean).join(' · ')}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMostrarClienteNuevo((v) => !v)}
          className="whitespace-nowrap rounded-md border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50"
        >
          + Nuevo cliente
        </button>
      </div>

      {mostrarClienteNuevo && (
        <div className="mt-3">
          <FormularioCliente
            onCreado={handleClienteCreado}
            onCancelar={() => setMostrarClienteNuevo(false)}
          />
        </div>
      )}
    </div>
  )
}