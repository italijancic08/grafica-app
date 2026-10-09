'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  FileSpreadsheet,
  CalendarDays,
  PackageCheck,
  Wallet,
  UserCircle,
  Banknote,
  Clock3,
  Package,
  Tags,
  Truck,
  Calculator,
  Receipt,
  AlertCircle,
  WalletCards,
  BarChart3,
  History,
  Settings,
} from 'lucide-react'

const NAV_COMPARTIDA = [
  { nombre: 'Panel', href: '/', icono: LayoutDashboard },
  { nombre: 'Trabajos', href: '/trabajos', icono: ClipboardList },
  { nombre: 'Clientes', href: '/clientes', icono: Users },
  { nombre: 'Presupuestos', href: '/presupuestos', icono: FileSpreadsheet },
  { nombre: 'Turnos', href: '/turnos', icono: CalendarDays },
  { nombre: 'Para retirar', href: '/para-retirar', icono: PackageCheck },
  { nombre: 'Pendientes de pago', href: '/deudas', icono: Wallet },
  { nombre: 'Mi cuenta', href: '/mi-cuenta', icono: UserCircle },
  { nombre: 'Caja', href: '/caja', icono: Banknote },
  { nombre: 'Fichaje', href: '/fichaje', icono: Clock3 },
  { nombre: 'Stock', href: '/stock', icono: Package },
  { nombre: 'Lista de precios', href: '/lista-precios', icono: Tags },
  { nombre: 'Tercerizaciones', href: '/tercerizados', icono: Truck },
  { nombre: 'Calculadoras', href: '/calculadoras', icono: Calculator },
  { nombre: 'Facturas', href: '/facturas', icono: Receipt },
  { nombre: 'Alertas', href: '/alertas', icono: AlertCircle },
]

const NAV_ADMINISTRADOR = [
  { nombre: 'Usuarios', href: '/usuarios', icono: Users },
  { nombre: 'Paga', href: '/paga', icono: WalletCards },
  { nombre: 'Reportes', href: '/reportes', icono: BarChart3 },
  { nombre: 'Auditoría', href: '/auditoria', icono: History },
  { nombre: 'Configuración', href: '/configuracion', icono: Settings },
]

type ItemNavegacion = {
  nombre: string
  href: string
  icono: typeof LayoutDashboard
}

export default function Sidebar({
  nombre,
  rol,
}: {
  nombre: string
  rol: string
}) {
  const pathname = usePathname()
  const esAdministrador = rol === 'administrador'

  function esActivo(href: string) {
    if (href === '/') return pathname === '/'

    return pathname === href || pathname.startsWith(`${href}/`)
  }

  function ItemNav({
    nombre,
    href,
    icono: Icono,
  }: ItemNavegacion) {
    const activo = esActivo(href)

    return (
      <Link
        href={href}
        title={nombre}
        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
          activo
            ? 'bg-white/10 text-white'
            : 'text-zinc-400 hover:bg-white/[0.07] hover:text-white'
        }`}
      >
        <Icono size={18} strokeWidth={1.75} className="shrink-0" />
        <span>{nombre}</span>
      </Link>
    )
  }

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col bg-zinc-900 px-3 py-5">
      <div className="mb-5 flex shrink-0 flex-col items-center text-center">
        <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-700">
          <UserCircle size={32} className="text-zinc-300" />
        </div>

        <p className="text-sm font-medium text-white">{nombre}</p>

        <p className="text-xs capitalize text-zinc-400">{rol}</p>
      </div>

      <div className="sidebar-scrollbar-left min-h-0 flex-1 overflow-y-auto">
        <div className="sidebar-scrollbar-content">
          <nav className="space-y-1">
            {NAV_COMPARTIDA.map((item) => (
              <ItemNav key={item.href} {...item} />
            ))}
          </nav>

          {esAdministrador && (
            <>
              <div className="my-4 border-t border-zinc-700" />

              <nav className="space-y-1">
                {NAV_ADMINISTRADOR.map((item) => (
                  <ItemNav key={item.href} {...item} />
                ))}
              </nav>
            </>
          )}
        </div>
      </div>
    </aside>
  )
}