import GestionPrecios from './gestion-precios'
import { listarListaPrecios } from '@/lib/services/lista-precios'
import { esAdministrador } from '@/lib/auth/roles'

export default async function ListaPreciosPage() {
  const [resultado, administrador] = await Promise.all([
    listarListaPrecios(), esAdministrador(),
  ])

  if (resultado.error) {
    return <div className="p-6 text-sm text-red-600">
      No se pudo cargar la lista de precios: {resultado.error}.
      Verificá que se haya ejecutado la migración 0026.
    </div>
  }

  return <GestionPrecios iniciales={resultado.data ?? []} administrador={administrador} />
}
