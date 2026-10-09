'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

export default function BuscadorClientesDashboard() {
  const router = useRouter()
  const [busqueda, setBusqueda] = useState('')

  function buscarClientes(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()

    const termino = busqueda.trim()

    if (!termino) {
      router.push('/clientes')
      return
    }

    router.push(`/clientes?q=${encodeURIComponent(termino)}`)
  }

  return (
    <form
      onSubmit={buscarClientes}
      className="flex w-full items-center gap-2"
    >
      <label
        htmlFor="buscar-clientes-dashboard"
        className="sr-only"
      >
        Buscar clientes
      </label>

      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-2.5 focus-within:border-gray-500">
        <Search
          size={17}
          className="shrink-0 text-gray-600"
        />

        <input
          id="buscar-clientes-dashboard"
          type="search"
          value={busqueda}
          onChange={(evento) => setBusqueda(evento.target.value)}
          placeholder="Buscar clientes..."
          className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-500"
        />
      </div>

      <button
        type="submit"
        className="shrink-0 rounded-full bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-700"
      >
        Buscar
      </button>
    </form>
  )
}