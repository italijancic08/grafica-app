'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function BuscadorClientes() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [valor, setValor] = useState(searchParams.get('q') ?? '')
  const [, startTransition] = useTransition()

  function handleChange(v: string) {
    setValor(v)
    startTransition(() => {
      const params = new URLSearchParams(searchParams)
      if (v) params.set('q', v)
      else params.delete('q')
      router.push(`/clientes?${params.toString()}`)
    })
  }

  return (
    <input
      type="text"
      placeholder="Buscar por nombre, teléfono o CUIT..."
      value={valor}
      onChange={(e) => handleChange(e.target.value)}
      className="w-full max-w-sm rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
    />
  )
}