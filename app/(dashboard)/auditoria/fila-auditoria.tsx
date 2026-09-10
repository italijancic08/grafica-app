'use client'

import { useState } from 'react'
import type { Auditoria } from '@/lib/types/auditoria'
import { ETIQUETAS_ACCION, ETIQUETAS_ENTIDAD } from '@/lib/types/auditoria'
import { ETIQUETAS_RUBRO, type Rubro } from '@/lib/types/caja'
import { ETIQUETAS_MEDIO_PAGO, type MedioPago } from '@/lib/types/pago'
import { formatearFechaHora, formatearMoneda } from '@/lib/utils/formato'

type RegistroConUsuario = Auditoria & { usuarios: { nombre: string } | { nombre: string }[] | null }

const CLAVES_MONEDA = new Set([
  'monto', 'importe', 'precio_final', 'saldo', 'costo', 'valor', 'total_pagado', 'total_adeudado',
])

function formatearClave(clave: string): string {
  const texto = clave.replace(/_/g, ' ')
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

function formatearValor(clave: string, valor: unknown): string {
  if (valor === null || valor === undefined || valor === '') return '—'
  if (typeof valor === 'boolean') return valor ? 'Sí' : 'No'
  if (clave === 'rubro' && typeof valor === 'string' && valor in ETIQUETAS_RUBRO) {
    return ETIQUETAS_RUBRO[valor as Rubro]
  }
  if (clave === 'medio_pago' && typeof valor === 'string' && valor in ETIQUETAS_MEDIO_PAGO) {
    return ETIQUETAS_MEDIO_PAGO[valor as MedioPago]
  }
  if (clave === 'tipo' && (valor === 'ingreso' || valor === 'egreso')) {
    return valor === 'ingreso' ? 'Ingreso' : 'Egreso'
  }
  if (typeof valor === 'number' && CLAVES_MONEDA.has(clave)) return formatearMoneda(valor)
  return String(valor)
}

function DetalleAuditoria({ detalle }: { detalle: Record<string, unknown> }) {
  return (
    <dl className="space-y-1">
      {Object.entries(detalle).map(([clave, valor]) => {
        if (valor !== null && typeof valor === 'object' && !Array.isArray(valor)) {
          return (
            <div key={clave}>
              <dt className="text-xs font-semibold text-gray-600">{formatearClave(clave)}</dt>
              <dd className="ml-3 border-l border-gray-200 pl-2">
                <DetalleAuditoria detalle={valor as Record<string, unknown>} />
              </dd>
            </div>
          )
        }
        return (
          <div key={clave} className="flex gap-1 text-xs">
            <dt className="font-medium text-gray-600">{formatearClave(clave)}:</dt>
            <dd className="text-gray-800">{formatearValor(clave, valor)}</dd>
          </div>
        )
      })}
    </dl>
  )
}

export default function FilaAuditoria({ registro }: { registro: RegistroConUsuario }) {
  const [expandido, setExpandido] = useState(false)
  const usuario = Array.isArray(registro.usuarios) ? registro.usuarios[0] : registro.usuarios

  return (
    <tr className="align-top">
      <td className="whitespace-nowrap px-4 py-2 text-gray-600">{formatearFechaHora(registro.fecha)}</td>
      <td className="whitespace-nowrap px-4 py-2">{usuario?.nombre ?? '—'}</td>
      <td className="whitespace-nowrap px-4 py-2">{ETIQUETAS_ACCION[registro.accion] ?? registro.accion}</td>
      <td className="whitespace-nowrap px-4 py-2">{ETIQUETAS_ENTIDAD[registro.entidad] ?? registro.entidad}</td>
      <td className="px-4 py-2">
        {registro.detalle ? (
          <button onClick={() => setExpandido(!expandido)} className="text-xs text-gray-500 hover:underline">
            {expandido ? 'Ocultar detalle' : 'Ver detalle'}
          </button>
        ) : '—'}
        {expandido && registro.detalle && (
          <div className="mt-1 max-w-md rounded bg-gray-50 p-2">
            <DetalleAuditoria detalle={registro.detalle} />
          </div>
        )}
      </td>
    </tr>
  )
}