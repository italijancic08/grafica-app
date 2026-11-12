import { notFound } from 'next/navigation'
import Link from 'next/link'
import { obtenerCliente, obtenerTrabajosDeCliente } from '@/lib/services/clientes'
import { listarEmpresasClientes } from '@/lib/services/empresas-clientes'
import FormularioEditarCliente from '../formulario-editar-cliente'
import AutorizacionGratuitos from '../autorizacion-gratuitos'
import { esAdministrador } from '@/lib/auth/roles'
import { ETIQUETAS_ESTADO_OPERATIVO } from '@/lib/types/trabajo'
import { formatearFecha } from '@/lib/utils/formato'
import { etiquetaEstadoPresupuesto } from '@/lib/utils/estado-presupuesto'

function formatearMoneda(valor: number) {
  return valor.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })
}

export default async function FichaClientePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { data: cliente, error } = await obtenerCliente(id)

  if (error || !cliente) notFound()

  const { data: trabajos } = await obtenerTrabajosDeCliente(id)
  const { data: empresas } = await listarEmpresasClientes()
  const administrador = await esAdministrador()

  // Los presupuestos (pendientes o rechazados) no cuentan como compra ni como deuda
  const trabajosAceptados = trabajos?.filter(
    (t) => t.estado_operativo !== 'PRESUPUESTO' && t.estado_operativo !== 'RECHAZADO'
  ) ?? []
  // Saldo neto: positivo = el cliente debe, negativo = tiene saldo a favor
  const saldoTotal =
    Math.round(trabajosAceptados.reduce((acc, t) => acc + t.saldo, 0) * 100) / 100

  return (
    <div className="p-6">
      <div className="mb-1 flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-gray-900">{cliente.nombre_razon_social}</h1>
        <FormularioEditarCliente cliente={cliente} empresas={empresas ?? []} />
      </div>
      <p className="mb-1 text-sm text-gray-500">
        {cliente.telefono ?? 'Sin teléfono'} {cliente.email ? `· ${cliente.email}` : ''}
        {cliente.cuit_cuil ? ` · CUIT/DNI: ${cliente.cuit_cuil}` : ''}
        {cliente.empresa_cliente_id && cliente.empresas_clientes && (
          <>
            {' · Empresa: '}
            <Link href={`/clientes/empresas/${cliente.empresa_cliente_id}`} className="font-medium text-gray-700 hover:underline">
              {cliente.empresas_clientes.nombre}
            </Link>
          </>
        )}
      </p>

      {(cliente.domicilio || cliente.localidad || cliente.notas) && (
        <p className="mb-1 text-sm text-gray-500">
          {[cliente.domicilio, cliente.localidad].filter(Boolean).join(', ')}
          {cliente.notas
            ? `${cliente.domicilio || cliente.localidad ? ' · ' : ''}${cliente.notas}`
            : ''}
        </p>
      )}
      <div className="mb-5" />

      <AutorizacionGratuitos
        tipo="cliente"
        id={cliente.id}
        permitido={cliente.permite_trabajos_gratis ?? false}
        administrador={administrador}
      />

      <div className="mb-6">
        {saldoTotal > 0 ? (
          <div className="inline-block rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-xs text-red-700">Deuda</p>
            <p className="text-lg font-semibold text-red-700">{formatearMoneda(saldoTotal)}</p>
          </div>
        ) : saldoTotal < 0 ? (
          <div className="inline-block rounded-lg border border-green-200 bg-green-50 px-4 py-3">
            <p className="text-xs text-green-700">Saldo a favor</p>
            <p className="text-lg font-semibold text-green-700">{formatearMoneda(Math.abs(saldoTotal))}</p>
          </div>
        ) : (
          <div className="inline-block rounded-lg border border-green-200 bg-green-50 px-4 py-3">
            <p className="text-lg font-semibold text-green-700">Cliente al día</p>
          </div>
        )}
      </div>

      <h2 className="mb-3 text-sm font-semibold text-gray-900">Trabajos</h2>
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Orden Nº</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Fecha de ingreso</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Cliente</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Descripción</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Estado</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Fecha finalizado</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Saldo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {trabajos?.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-3 text-gray-500">Sin trabajos todavía.</td></tr>
            )}
            {trabajos?.map((t) => {
              const esPresupuesto =
                t.estado_operativo === 'PRESUPUESTO' || t.estado_operativo === 'RECHAZADO'

              return (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">
                    <Link href={`/trabajos/${t.id}`} className="hover:underline">
                      {t.numero}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{formatearFecha(t.fecha_entrada)}</td>
                  <td className="px-4 py-2">
                    {cliente.nombre_razon_social}
                    {t.empresas_clientes?.nombre && (
                      <span className="block text-xs text-gray-400">
                        vía {t.empresas_clientes.nombre}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <Link href={`/trabajos/${t.id}`} className="hover:underline">
                      {t.descripcion}
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    {t.estado_operativo === 'PRESUPUESTO'
                      ? etiquetaEstadoPresupuesto(t.fecha_envio_presupuesto)
                      : ETIQUETAS_ESTADO_OPERATIVO[t.estado_operativo as keyof typeof ETIQUETAS_ESTADO_OPERATIVO]}
                  </td>
                  <td className="px-4 py-2">{formatearFecha(t.fecha_finalizacion)}</td>
                  <td className={`px-4 py-2 ${!esPresupuesto && t.saldo > 0 ? 'text-red-600' : ''}`}>
                    {esPresupuesto ? '—' : formatearMoneda(t.saldo)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}