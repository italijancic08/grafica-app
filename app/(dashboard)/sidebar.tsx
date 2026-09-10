'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Package, Receipt, BarChart3, AlertCircle,
  UserCircle, Settings, History,
} from 'lucide-react'

const NAV_PRINCIPAL = [
  { nombre: 'Panel', href: '/', icono: LayoutDashboard },
  { nombre: 'Usuarios', href: '/usuarios', icono: Users },
  { nombre: 'Stock', href: '/stock', icono: Package },
  { nombre: 'Facturas', href: '/facturas', icono: Receipt },
  { nombre: 'Reportes', href: '/reportes', icono: BarChart3 },
  { nombre: 'Alertas', href: '/alertas', icono: AlertCircle },
  { nombre: 'Auditoría', href: '/auditoria', icono: History },
]

const NAV_SECUNDARIA = [
  { nombre: 'Mi cuenta', href: '/mi-cuenta', icono: UserCircle },
  { nombre: 'Configuración', href: '/configuracion', icono: Settings },
]

export default function Sidebar({ nombre, rol }: { nombre: string; rol: string }) {
  const pathname = usePathname()

  function esActivo(href: string) {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  function ItemNav({ nombre: label, href, icono: Icono }: { nombre: string; href: string; icono: typeof LayoutDashboard }) {
    const activo = esActivo(href)
    return (
      <Link
        href={href}
        className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
          activo ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
        }`}
      >
        <Icono size={18} strokeWidth={1.75} />
        {label}
      </Link>
    )
  }

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col justify-between bg-zinc-900 px-3 py-6">
      <div>
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-700">
            <UserCircle size={32} className="text-zinc-300" />
          </div>
          <p className="text-sm font-medium text-white">{nombre}</p>
          <p className="text-xs capitalize text-zinc-400">{rol}</p>
        </div>

        <nav className="space-y-1">
          {NAV_PRINCIPAL.map((item) => <ItemNav key={item.href} {...item} />)}
        </nav>
      </div>

      <div>
        <div className="mb-2 border-t border-zinc-700" />
        <nav className="space-y-1">
          {NAV_SECUNDARIA.map((item) => <ItemNav key={item.href} {...item} />)}
        </nav>
      </div>
    </aside>
  )
}