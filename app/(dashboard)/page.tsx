import Link from 'next/link'
import {
  ClipboardList,
  Users,
  PackageCheck,
  Wallet,
  Truck,
  Boxes,
  Banknote,
  Calculator,
  FileSpreadsheet,
  AlertCircle,
  Settings,
  Tags,
  CalendarDays,
  Search,
  Clock3,
  Receipt,
} from 'lucide-react'

import { obtenerResumenDashboard } from '@/lib/services/dashboard'
import { obtenerUmbralCajaBaja } from '@/lib/services/configuracion'
import { listarTrabajos, listarTurnos } from '@/lib/services/trabajos'

import {
  formatearMoneda,
  formatearFecha,
  fechaHoyArgentina,
} from '@/lib/utils/formato'

import BuscadorClientesDashboard from './buscador-clientes-dashboard'

const MODULOS = [
  { nombre: 'Trabajos', href: '/trabajos', icono: ClipboardList },
  { nombre: 'Clientes', href: '/clientes', icono: Users },
  { nombre: 'Para retirar', href: '/para-retirar', icono: PackageCheck },
  { nombre: 'Pendientes de pago', href: '/deudas', icono: Wallet },
  { nombre: 'Tercerizados', href: '/tercerizados', icono: Truck },
  { nombre: 'Stock', href: '/stock', icono: Boxes },
  { nombre: 'Caja', href: '/caja', icono: Banknote },
  { nombre: 'Calculadoras', href: '/calculadoras', icono: Calculator },
  { nombre: 'Presupuestos', href: '/presupuestos', icono: FileSpreadsheet },
  { nombre: 'Alertas', href: '/alertas', icono: AlertCircle },
  { nombre: 'Usuarios', href: '/usuarios', icono: Users },
  { nombre: 'Configuración', href: '/configuracion', icono: Settings },
  { nombre: 'Lista de precios', href: '/lista-precios', icono: Tags },
]

function diasEntreFechas(fechaInicial: string, fechaFinal: string) {
  const [anioInicial, mesInicial, diaInicial] = fechaInicial
    .split('-')
    .map(Number)

  const [anioFinal, mesFinal, diaFinal] = fechaFinal
    .split('-')
    .map(Number)

  const inicial = Date.UTC(anioInicial, mesInicial - 1, diaInicial)
  const final = Date.UTC(anioFinal, mesFinal - 1, diaFinal)

  return Math.round((final - inicial) / 86400000)
}

function fechaHoraArgentina() {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date())

  const parte = (tipo: string) =>
    partes.find((item) => item.type === tipo)?.value ?? ''

  return `${parte('year')}-${parte('month')}-${parte('day')}T${parte('hour')}:${parte('minute')}`
}

export default async function DashboardPage() {
  const [
    resumen,
    umbral,
    resultadoPresupuestos,
    resultadoTurnos,
  ] = await Promise.all([
    obtenerResumenDashboard(),
    obtenerUmbralCajaBaja(),
    listarTrabajos(['PRESUPUESTO']),
    listarTurnos(),
  ])

  const presupuestosSinPrecio = resultadoPresupuestos.error
    ? []
    : (resultadoPresupuestos.data ?? []).filter(
        (trabajo) => Number(trabajo.precio_final ?? 0) <= 0
      )

  const hoy = fechaHoyArgentina()
  const ahora = fechaHoraArgentina()

  const turnosFuturos = resultadoTurnos.error
    ? []
    : (resultadoTurnos.data ?? [])
        .filter((turno) => {
          if (!turno.fecha || !turno.hora) return false

          if (
            turno.estado === 'CANCELADO' ||
            turno.trabajos.estado_operativo === 'CANCELADO' ||
            turno.trabajos.estado_operativo === 'RETIRADO' ||
            turno.trabajos.estado_operativo === 'RECHAZADO'
          ) {
            return false
          }

          return `${turno.fecha}T${turno.hora.slice(0, 5)}` >= ahora
        })
        .sort((a, b) => {
          const fechaA = `${a.fecha}T${a.hora}`
          const fechaB = `${b.fecha}T${b.hora}`

          return fechaA.localeCompare(fechaB)
        })

  const proximoTurno = turnosFuturos[0] ?? null

  const diasRestantes = proximoTurno?.fecha
    ? diasEntreFechas(hoy, proximoTurno.fecha)
    : null

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-lg font-semibold text-gray-900">
          Fecha: {formatearFecha(hoy)}
        </h1>

        <Link
          href="/documentos"
          className="rounded-full bg-gray-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
        >
          Documentos
        </Link>
      </div>

      {/* Tarjetas principales */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {/* Balance del mes */}
        <Link
          href="/caja"
          className="min-w-0 rounded-xl bg-gray-200/70 p-4 transition-colors hover:bg-gray-200"
        >
          <p className="text-xs font-medium text-gray-600">
            Balance del mes
          </p>

          <p
            className={`mt-1 text-2xl font-semibold ${
              resumen.cajaMes.balance >= 0
                ? 'text-green-700'
                : 'text-red-600'
            }`}
          >
            {formatearMoneda(resumen.cajaMes.balance)}
          </p>

          <div className="mt-2 flex flex-wrap items-baseline gap-2 border-t border-gray-300/60 pt-2">
            <p className="text-xs font-medium text-gray-600">
              Caja física:
            </p>

            <p
              className={`text-sm font-semibold ${
                resumen.cajaMes.cajaFisica < umbral
                  ? 'text-red-600'
                  : 'text-green-700'
              }`}
            >
              {formatearMoneda(resumen.cajaMes.cajaFisica)}
            </p>
          </div>

          {resumen.cajaMes.cajaFisica < umbral && (
            <p className="mt-1 text-xs text-red-600">
              Poco dinero en la caja
            </p>
          )}
        </Link>

        {/* Pendientes de pago */}
        <Link
          href="/deudas"
          className="min-w-0 rounded-xl bg-gray-200/70 p-4 transition-colors hover:bg-gray-200"
        >
          <p className="text-xs font-medium text-gray-600">
            Pendientes de pago
          </p>

          <p className="mt-1 text-3xl font-semibold text-gray-900">
            {resumen.deudas.cantidad}
          </p>

          <p className="text-xs font-medium text-red-600">
            {formatearMoneda(resumen.deudas.totalAdeudado)}
          </p>
        </Link>

        {/* Presupuestos sin precio */}
        <Link
          href="/presupuestos"
          className="min-w-0 rounded-xl bg-gray-200/70 p-4 transition-colors hover:bg-gray-200"
        >
          <p className="text-xs font-medium text-gray-600">
            Presupuestos pendientes
          </p>

          <p
            className={`mt-1 text-3xl font-semibold ${
              presupuestosSinPrecio.length > 0
                ? 'text-red-600'
                : 'text-gray-900'
            }`}
          >
            {presupuestosSinPrecio.length}
          </p>
        </Link>

        {/* Trabajos en producción */}
        <Link
          href="/trabajos"
          className="min-w-0 rounded-xl bg-gray-200/70 p-4 transition-colors hover:bg-gray-200"
        >
          <p className="text-xs font-medium text-gray-600">
            Trabajos en producción
          </p>

          <p className="mt-1 text-3xl font-semibold text-gray-900">
            {resumen.trabajosEnProduccion}
          </p>
        </Link>

        {/* Buscador de clientes */}
        <div className="flex min-w-0 flex-col justify-center rounded-xl bg-gray-200/70 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Search size={17} className="text-gray-700" />

            <h2 className="text-sm font-semibold text-gray-900">
              Clientes
            </h2>
          </div>

          <BuscadorClientesDashboard />
        </div>

        {/* Próximo turno */}
        <Link
          href="/turnos"
          className="flex min-w-0 flex-col rounded-xl bg-gray-200/70 p-4 transition-colors hover:bg-gray-200"
        >
          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="text-gray-600" />

            <p className="text-xs font-medium text-gray-600">
              Próximo turno
            </p>
          </div>

          {proximoTurno ? (
            <>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {formatearFecha(proximoTurno.fecha)}
              </p>

              <p className="mt-1 text-sm font-medium text-gray-700">
                {proximoTurno.hora?.slice(0, 5)}
                {' · '}
                {proximoTurno.trabajos.clientes?.nombre_razon_social ??
                  'Cliente sin nombre'}
              </p>

              {diasRestantes === 0 ? (
                <p className="mt-1 text-xs font-semibold text-red-600">
                  ¡El turno es hoy!
                </p>
              ) : (
                <p className="mt-1 text-xs font-semibold text-green-700">
                  {diasRestantes === 1
                    ? 'Falta 1 día'
                    : `Faltan ${diasRestantes} días`}
                </p>
              )}
            </>
          ) : (
            <p className="mt-3 text-sm font-medium text-gray-600">
              No hay turnos próximos
            </p>
          )}
        </Link>
      </div>

      {/* Accesos rápidos originales */}
      <div className="rounded-2xl bg-gray-200/50 p-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {MODULOS.map((modulo) => (
            <Link
              key={modulo.href}
              href={modulo.href}
              className="flex items-center gap-2 rounded-full bg-gray-800 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-700"
            >
              <modulo.icono size={16} strokeWidth={1.75} />
              {modulo.nombre}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}