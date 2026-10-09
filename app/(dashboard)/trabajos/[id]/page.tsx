import { notFound } from 'next/navigation'
import { obtenerTrabajo } from '@/lib/services/trabajos'
import { listarClientes } from '@/lib/services/clientes'
import { listarEmpresasClientes } from '@/lib/services/empresas-clientes'
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
import AccionesPresupuesto from './acciones-presupuesto'
import { listarMesesCerrados } from '@/lib/services/caja-mensual'

export default async function DetalleTrabajoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { data: t, error } = await obtenerTrabajo(id)

  if (error || !t) notFound()

  const esPresupuesto = t.estado_operativo === 'PRESUPUESTO'
  const esRechazado = t.estado_operativo === 'RECHAZADO'
  const esTrabajo = !esPresupuesto && !esRechazado

  // La lista de clientes solo hace falta para poder cambiar el cliente de un presupuesto
  const { data: clientes } = esPresupuesto ? await listarClientes() : { data: [] }
  const { data: empresas } = await listarEmpresasClientes()

  // Pagos, tercerizaciones y comprobantes solo existen una vez aceptado el trabajo
  const { data: pagos } = esTrabajo ? await listarPagosDeTrabajo(id) : { data: [] }
  const { data: tercerizaciones } = esTrabajo ? await listarTercerizacionesDeTrabajo(id) : { data: [] }
  const { data: mesesCerrados } = esTrabajo ? await listarMesesCerrados() : { data: [] }
  const { data: comprobantes } = esTrabajo ? await listarComprobantesDeTrabajo(id) : { data: [] }

  return (
    <div className="p-6">
      <div className="mb-1 flex items-center gap-3">
        <h1 className="text-xl font-semibold text-gray-900">{t.numero}</h1>
        {esPresupuesto && (
          <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
            Presupuesto
          </span>
        )}
        {esRechazado && (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
            Rechazado
          </span>
        )}
      </div>
      <p className="mb-6 text-sm text-gray-500">
        {t.clientes?.nombre_razon_social} · {t.clientes?.telefono}
        {t.empresas_clientes && ` · Por parte de ${t.empresas_clientes.nombre}`}
      </p>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Estado</p>
          <p className="text-lg font-semibold">{ETIQUETAS_ESTADO_OPERATIVO[t.estado_operativo as keyof typeof ETIQUETAS_ESTADO_OPERATIVO]}</p>
        </div>
        {esTrabajo && (
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-500">Estado de pago</p>
            <p className="text-lg font-semibold">{ETIQUETAS_ESTADO_FINANCIERO[t.estado_financiero as keyof typeof ETIQUETAS_ESTADO_FINANCIERO]}</p>
          </div>
        )}
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Precio</p>
          <p className="text-lg font-semibold">
            {t.precio_final > 0 || esTrabajo ? formatearMoneda(t.precio_final) : 'Sin definir'}
          </p>
        </div>
        {esTrabajo && (
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-500">Saldo</p>
            <p className={`text-lg font-semibold ${t.saldo > 0 ? 'text-red-600' : ''}`}>
              {formatearMoneda(t.saldo)}
            </p>
          </div>
        )}
      </div>

      <EditarTrabajo
        trabajoId={t.id}
        estado={t.estado_operativo}
        clienteId={t.cliente_id}
        clientes={clientes ?? []}
        empresaClienteId={t.empresa_cliente_id ?? null}
        empresas={empresas ?? []}
        descripcion={t.descripcion}
        rubro={t.rubro}
        fechaMaxima={t.fecha_maxima}
        precioFinal={t.precio_final}
        anchoCm={t.ancho_cm ?? null}
        largoCm={t.largo_cm ?? null}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
        <div>
          <span className="text-gray-500">{esTrabajo ? 'Fecha de entrada:' : 'Fecha del presupuesto:'}</span>{' '}
          {formatearFecha(t.fecha_entrada)}
        </div>
        <div><span className="text-gray-500">Plazo de entrega:</span> {formatearFecha(t.fecha_maxima)}</div>
        {esTrabajo && (
          <>
            <div><span className="text-gray-500">Fecha de finalización:</span> {formatearFecha(t.fecha_finalizacion)}</div>
            <div><span className="text-gray-500">Fecha de retiro:</span> {formatearFecha(t.fecha_retiro)}</div>
          </>
        )}
      </div>

      {esPresupuesto && (
        <div className="rounded-lg border border-gray-200 p-4">
          <AccionesPresupuesto
            trabajoId={t.id}
            precioFinal={t.precio_final}
            tieneRubro={!!t.rubro}
          />
        </div>
      )}

      {esRechazado && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Este presupuesto fue rechazado y se descartó. Ya no admite cambios.
        </div>
      )}

      {esTrabajo && (
        <>
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
        </>
      )}
    </div>
  )
}