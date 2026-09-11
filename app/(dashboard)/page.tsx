import Link from 'next/link'
import {
  ClipboardList, Users, PackageCheck, Wallet, Truck, Boxes,
  Banknote, Calculator, FileSpreadsheet, AlertCircle, Settings,
} from 'lucide-react'
import { obtenerResumenDashboard } from '@/lib/services/dashboard'
import { formatearMoneda, formatearFecha, fechaHoyArgentina } from '@/lib/utils/formato'
import { obtenerUmbralCajaBaja } from '@/lib/services/configuracion'
import {Tags} from 'lucide-react'

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

export default async function DashboardPage() {
  const resumen = await obtenerResumenDashboard()
  const umbral = await obtenerUmbralCajaBaja()

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">
          Fecha: {formatearFecha(fechaHoyArgentina())}
        </h1>
        <Link
          href="/documentos"
          className="rounded-full bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Documentos
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-gray-200/70 p-4">
          <p className="text-xs font-medium text-gray-600">Balance del mes</p>
          <p className={`mt-1 text-2xl font-semibold ${resumen.cajaMes.balance >= 0 ? 'text-green-700' : 'text-red-600'}`}>
            {formatearMoneda(resumen.cajaMes.balance)}
          </p>
          <div className="mt-2 flex items-baseline gap-2 border-t border-gray-300/60 pt-2">
            <p className="text-xs font-medium text-gray-600">Caja física:</p>
            <p className={`text-sm font-semibold ${resumen.cajaMes.cajaFisica < umbral ? 'text-red-600' : 'text-green-700'}`}>
              {formatearMoneda(resumen.cajaMes.cajaFisica)}
            </p>
          </div>
          {resumen.cajaMes.cajaFisica < umbral && (
            <p className="mt-1 text-xs text-red-600">poco dinero en la caja</p>
          )}
        </div>

        <div className="rounded-xl bg-gray-200/70 p-4">
          <p className="text-xs font-medium text-gray-600">Pendientes de pago</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{resumen.deudas.cantidad}</p>
          <p className="text-xs font-medium text-red-600">{formatearMoneda(resumen.deudas.totalAdeudado)}</p>
        </div>

        <div className="rounded-xl bg-gray-200/70 p-4">
          <p className="text-xs font-medium text-gray-600">Alertas activas</p>
          <p className={`mt-1 text-2xl font-semibold ${resumen.alertasActivas > 0 ? 'text-red-600' : 'text-gray-900'}`}>
            {resumen.alertasActivas}
          </p>
        </div>

        <div className="rounded-xl bg-gray-200/70 p-4">
          <p className="text-xs font-medium text-gray-600">Trabajos en producción</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{resumen.trabajosEnProduccion}</p>
        </div>

        <div className="rounded-xl bg-gray-200/70 p-4">
          <p className="text-xs font-medium text-gray-600">Trabajos tercerizados</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{resumen.tercerizacionesEnCurso}</p>
        </div>

        <div className="rounded-xl bg-gray-200/70 p-4">
          <p className="text-xs font-medium text-gray-600">Para retirar</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{resumen.paraRetirar}</p>
        </div>
      </div>

      <div className="rounded-2xl bg-gray-200/50 p-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {MODULOS.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="flex items-center gap-2 rounded-full bg-gray-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-700"
            >
              <m.icono size={16} strokeWidth={1.75} />
              {m.nombre}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}