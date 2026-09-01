'use client'

import { useRouter } from 'next/navigation'

export default function SelectorMes({ mesActual }: { mesActual: string }) {
  const router = useRouter()

  function handleChange(mes: string) {
    router.push(`/caja?mes=${mes}`)
  }

  return (
    <input
      type="month"
      defaultValue={mesActual}
      onChange={(e) => handleChange(e.target.value)}
      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
    />
  )
}