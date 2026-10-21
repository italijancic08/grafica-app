'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
  WalletCards,
  BarChart3,
  History,
  Settings,
  LogOut,
  Bell,
  Menu,
  X,
} from 'lucide-react'

import { cerrarSesion } from '@/lib/services/auth'

const NAV_COMPARTIDA = [
  { nombre: 'Panel', href: '/', icono: LayoutDashboard },
  { nombre: 'Trabajos', href: '/trabajos', icono: ClipboardList },
  { nombre: 'Clientes', href: '/clientes', icono: Users },
  { nombre: 'Presupuestos', href: '/presupuestos', icono: FileSpreadsheet },
  { nombre: 'Turnos', href: '/turnos', icono: CalendarDays },
  { nombre: 'Para retirar', href: '/para-retirar', icono: PackageCheck },
  { nombre: 'Deudores', href: '/deudas', icono: Wallet },
  { nombre: 'Caja', href: '/caja', icono: Banknote },
  { nombre: 'Fichaje', href: '/fichaje', icono: Clock3 },
  { nombre: 'Stock', href: '/stock', icono: Package },
  { nombre: 'Lista de precios', href: '/lista-precios', icono: Tags },
  { nombre: 'Tercerizaciones', href: '/tercerizados', icono: Truck },
  { nombre: 'Calculadoras', href: '/calculadoras', icono: Calculator },
  { nombre: 'Facturas', href: '/facturas', icono: Receipt },
]

const NAV_ADMINISTRADOR = [
  { nombre: 'Usuarios', href: '/usuarios', icono: Users },
  { nombre: 'Paga', href: '/paga', icono: WalletCards },
  { nombre: 'Reportes', href: '/reportes', icono: BarChart3 },
  { nombre: 'Auditoría', href: '/auditoria', icono: History },
  { nombre: 'Configuración', href: '/configuracion', icono: Settings },
]

const NAV_CUENTA = [
  { nombre: 'Mi cuenta', href: '/mi-cuenta', icono: UserCircle },
  { nombre: 'Notificaciones', href: '/alertas', icono: Bell },
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
  const [abierto, setAbierto] = useState(false)

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
        onClick={() => setAbierto(false)}
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
    <>
    {/* Barra superior: solo en celular */}
    <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-3 bg-zinc-900 px-3 md:hidden">
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-label="Abrir menú"
        aria-expanded={abierto}
        className="rounded-lg p-2 text-zinc-300 transition-colors hover:bg-white/[0.07] hover:text-white"
      >
        <Menu size={22} strokeWidth={1.75} />
      </button>

      <Image
        src="/logo.png"
        alt="Logo del negocio"
        width={32}
        height={32}
        className="h-8 w-auto shrink-0 object-contain"
      />

      <div className="min-w-0 leading-tight">
        <p className="truncate text-sm font-medium text-white">{nombre}</p>
        <p className="text-xs capitalize text-zinc-400">{rol}</p>
      </div>
    </header>

    {/* Fondo oscuro detrás del menú: solo en celular */}
    {abierto && (
      <div
        className="fixed inset-0 z-40 bg-black/50 md:hidden"
        onClick={() => setAbierto(false)}
        aria-hidden="true"
      />
    )}

    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-zinc-900 px-3 py-5 transition-transform duration-200 md:static md:z-auto md:h-screen md:w-56 md:shrink-0 md:translate-x-0 ${
        abierto ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <button
        type="button"
        onClick={() => setAbierto(false)}
        aria-label="Cerrar menú"
        className="absolute right-2 top-2 rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/[0.07] hover:text-white md:hidden"
      >
        <X size={20} strokeWidth={1.75} />
      </button>
      <div className="mb-5 flex shrink-0 flex-col items-center text-center">
        <Image
          src="/logo.png"
          alt="Logo del negocio"
          width={120}
          height={120}
          priority
          className="mb-3 h-16 w-auto object-contain"
        />

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

      <nav className="mt-3 shrink-0 space-y-1 border-t border-zinc-700 pt-3">
        {NAV_CUENTA.map((item) => (
          <ItemNav key={item.href} {...item} />
        ))}
      </nav>

      <form action={cerrarSesion} className="mt-1 shrink-0">
        <button
          type="submit"
          title="Cerrar sesión"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/[0.07] hover:text-white"
        >
          <LogOut size={18} strokeWidth={1.75} className="shrink-0" />
          <span>Cerrar sesión</span>
        </button>
      </form>
    </aside>
    </>
  )
}