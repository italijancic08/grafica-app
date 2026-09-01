'use client'

import { useState } from 'react'
import CalculadoraMateriales from './calculadora-materiales'
import CalculadoraPrecio from './calculadora-precio'
import type { Material } from '@/lib/types/material'

export default function SelectorCalculadoras({ materiales }: { materiales: Material[] }) {
  const [tab, setTab] = useState<'materiales' | 'precio'>('materiales')

  return (
    <div>
      <div className="mb-4 flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setTab('materiales')}
          className={`border-b-2 px-4 py-2 text-sm font-medium ${
            tab === 'materiales' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500'
          }`}
        >
          Materiales
        </button>
        <button
          onClick={() => setTab('precio')}
          className={`border-b-2 px-4 py-2 text-sm font-medium ${
            tab === 'precio' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500'
          }`}
        >
          Precio del trabajo
        </button>
      </div>

      {tab === 'materiales' ? (
        <CalculadoraMateriales materiales={materiales} />
      ) : (
        <CalculadoraPrecio />
      )}
    </div>
  )
}