import Link from 'next/link'

export default function PestanasClientes({
  activa,
}: {
  activa: 'clientes' | 'empresas'
}) {
  const tab = (esActiva: boolean) =>
    `rounded-md px-3 py-1.5 text-sm font-medium ${
      esActiva ? 'bg-gray-900 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
    }`

  return (
    <div className="mb-4 flex gap-2">
      <Link href="/clientes" className={tab(activa === 'clientes')}>Clientes</Link>
      <Link href="/clientes/empresas" className={tab(activa === 'empresas')}>Empresas</Link>
    </div>
  )
}
