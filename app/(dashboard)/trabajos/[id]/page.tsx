import { notFound } from 'next/navigation'
import { obtenerTrabajo } from '@/lib/services/trabajos'
import { listarPagosDeTrabajo } from '@/lib/services/pagos'
import { listarTercerizacionesDeTrabajo } from '@/lib/services/tercerizaciones'
import { listarComprobantesDeTrabajo } from '@/lib/services/facturas'
import { ETIQUETAS_ESTADO_OPERATIVO, ETIQUETAS_ESTADO_FINANCIERO } from '@/lib/types/trabajo'
import { formatearMoneda, formatearFecha } from '@/lib/utils/formato'
import CambiarEstado from './cambiar-estado'
import SeccionPagos from './pagos'
import SeccionTercerizacion from './tercerizar'
import EditarTrabajo from './editar-trabajo'
import SeccionComprobantes from './comprobantes'
import { listarMesesCerrados } from '@/lib/services/caja-mensual'

export default async function DetalleTrabajoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { data: t, error } = await obtenerTrabajo(id)

  if (error || !t) notFound()

  const { data: pagos } = await listarPagosDeTrabajo(id)
  const { data: tercerizaciones } = await listarTercerizacionesDeTrabajo(id)
  const { data: mesesCerrados } = await listarMesesCerrados()
  const { data: comprobantes } = await listarComprobantesDeTrabajo(id)

  return (
    <div className="p-6">
      <h1 className="mb-1 text-xl font-semibold text-gray-900">{t.numero}</h1>
      <p className="mb-6 text-sm text-gray-500">
        {t.clientes?.nombre_razon_social} · {t.clientes?.telefono}
      </p>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Estado</p>
          <p className="text-lg font-semibold">{ETIQUETAS_ESTADO_OPERATIVO[t.estado_operativo as keyof typeof ETIQUETAS_ESTADO_OPERATIVO]}</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Estado de pago</p>
          <p className="text-lg font-semibold">{ETIQUETAS_ESTADO_FINANCIERO[t.estado_financiero as keyof typeof ETIQUETAS_ESTADO_FINANCIERO]}</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Precio</p>
          <p className="text-lg font-semibold">{formatearMoneda(t.precio_final)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Saldo</p>
          <p className={`text-lg font-semibold ${t.saldo > 0 ? 'text-red-600' : ''}`}>
            {formatearMoneda(t.saldo)}
          </p>
        </div>
      </div>

      <EditarTrabajo
        trabajoId={t.id}
        descripcion={t.descripcion}
        rubro={t.rubro}
        fechaMaxima={t.fecha_maxima}
        precioFinal={t.precio_final}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
        <div><span className="text-gray-500">Fecha de entrada:</span> {formatearFecha(t.fecha_entrada)}</div>
        <div><span className="text-gray-500">Fecha máxima:</span> {formatearFecha(t.fecha_maxima)}</div>
        <div><span className="text-gray-500">Fecha de finalización:</span> {formatearFecha(t.fecha_finalizacion)}</div>
        <div><span className="text-gray-500">Fecha de retiro:</span> {formatearFecha(t.fecha_retiro)}</div>
      </div>

      <div className="mb-6">
        <SeccionPagos
          trabajoId={t.id}
          clienteId={t.cliente_id}
          saldo={t.saldo}
          pagos={pagos ?? []}
          mesesCerrados={mesesCerrados ?? []}
        />
      </div>

      <div className="mb-6">
        <SeccionTercerizacion trabajoId={t.id} tercerizaciones={tercerizaciones ?? []} />
      </div>

      <SeccionComprobantes comprobantes={comprobantes ?? []} />

      <div className="rounded-lg border border-gray-200 p-4">
        <CambiarEstado trabajoId={t.id} estadoActual={t.estado_operativo} />
      </div>
    </div>
  )
}