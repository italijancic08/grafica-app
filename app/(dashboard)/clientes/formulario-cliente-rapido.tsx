'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import FormularioCliente from './formulario-cliente'

export default function FormularioClienteRapido() {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
      >
        + Nuevo cliente
      </button>
    )
  }

  return (
    <FormularioCliente
      onCreado={() => {
        setAbierto(false)
        router.refresh()
      }}
      onCancelar={() => setAbierto(false)}
    />
  )
}