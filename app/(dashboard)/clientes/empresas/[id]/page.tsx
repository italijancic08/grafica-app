import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  obtenerEmpresaCliente,
  listarClientesDeEmpresa,
  obtenerTrabajosDeEmpresa,
} from '@/lib/services/empresas-clientes'
import { ETIQUETAS_ESTADO_OPERATIVO } from '@/lib/types/trabajo'
import { formatearMoneda } from '@/lib/utils/formato'
import FormularioEmpresaCliente from '../formulario-empresa-cliente'

export default async function FichaEmpresaClientePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { data: empresa, error } = await obtenerEmpresaCliente(id)

  if (error || !empresa) notFound()

  const { data: clientes } = await listarClientesDeEmpresa(id)
  const { data: trabajos } = await obtenerTrabajosDeEmpresa(id)

  // Los presupuestos (pendientes o rechazados) no cuentan como compra ni como deuda
  const trabajosAceptados = trabajos?.filter(
    (t) => t.estado_operativo !== 'PRESUPUESTO' && t.estado_operativo !== 'RECHAZADO'
  ) ?? []
  const totalComprado = trabajosAceptados.reduce((acc, t) => acc + t.precio_final, 0)
  const deudaActual = trabajosAceptados.reduce((acc, t) => acc + Math.max(t.saldo, 0), 0)

  return (
    <div className="p-6">
      <Link href="/clientes/empresas" className="mb-2 inline-block text-xs text-gray-500 hover:underline">
        ← Volver a empresas
      </Link>

      <div className="mb-1 flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-gray-900">{empresa.nombre}</h1>
        <FormularioEmpresaCliente empresa={empresa} />
      </div>
      <p className="mb-6 text-sm text-gray-500">
        {empresa.telefono ?? 'Sin teléfono'} {empresa.email ? `· ${empresa.email}` : ''}
      </p>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Total comprado</p>
          <p className="text-lg font-semibold">{formatearMoneda(totalComprado)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Deuda actual</p>
          <p className="text-lg font-semibold text-red-600">{formatearMoneda(deudaActual)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500">CUIT</p>
          <p className="text-lg font-semibold">{empresa.cuit ?? '—'}</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Localidad</p>
          <p className="text-lg font-semibold">{empresa.localidad ?? '—'}</p>
        </div>
      </div>

      <h2 className="mb-3 text-sm font-semibold text-gray-900">Clientes de esta empresa</h2>
      <div className="mb-6 overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Nombre</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Teléfono</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">CUIT/CUIL/DNI</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {clientes?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-3 text-gray-500">
                  Todavía no hay clientes asociados a esta empresa.
                </td>
              </tr>
            )}
            {clientes?.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-2">{c.nombre_razon_social}</td>
                <td className="px-4 py-2">{c.telefono ?? '—'}</td>
                <td className="px-4 py-2">{c.cuit_cuil ?? '—'}</td>
                <td className="px-4 py-2 text-right">
                  <Link href={`/clientes/${c.id}`} className="text-sm font-medium text-gray-900 hover:underline">
                    Ver ficha
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mb-3 text-sm font-semibold text-gray-900">Trabajos por parte de la empresa</h2>
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Número</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Cliente</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Descripción</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Estado</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Precio</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Saldo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {trabajos?.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-3 text-gray-500">Sin trabajos todavía.</td></tr>
            )}
            {trabajos?.map((t) => (
              <tr key={t.id}>
                <td className="px-4 py-2 font-medium">
                  <Link href={`/trabajos/${t.id}`} className="hover:underline">{t.numero}</Link>
                </td>
                <td className="px-4 py-2">{t.clientes?.nombre_razon_social}</td>
                <td className="px-4 py-2">{t.descripcion}</td>
                <td className="px-4 py-2">{ETIQUETAS_ESTADO_OPERATIVO[t.estado_operativo as keyof typeof ETIQUETAS_ESTADO_OPERATIVO]}</td>
                <td className="px-4 py-2">{formatearMoneda(t.precio_final)}</td>
                <td className={`px-4 py-2 ${t.saldo > 0 ? 'text-red-600' : ''}`}>
                  {formatearMoneda(t.saldo)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
