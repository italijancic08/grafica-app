import GestionPrecios from './gestion-precios'
import ListasSlides from './listas-slides'
import ListaPolarizados from './lista-polarizados'
import Sublimaciones from './sublimaciones'
import CategoriasVehiculos from './categorias-vehiculos'

import { listarListaPrecios } from '@/lib/services/lista-precios'
import { listarSublimaciones } from '@/lib/services/sublimaciones'
import { esAdministrador } from '@/lib/auth/roles'

export default async function ListaPreciosPage() {
  const [resultado, sublimaciones, administrador] = await Promise.all([
    listarListaPrecios(),
    listarSublimaciones(),
    esAdministrador(),
  ])

  if (resultado.error) {
    return (
      <div className="p-6 text-sm text-red-600">
        No se pudo cargar la lista de precios: {resultado.error}.
        Verificá que se haya ejecutado la migración 0026.
      </div>
    )
  }

  return (
    <ListasSlides
      slides={[
        {
          id: 'grafica',
          titulo: 'Lista de precios gráfica',
          contenido: (
            <GestionPrecios
              iniciales={resultado.data ?? []}
              administrador={administrador}
            />
          ),
        },
        {
          id: 'polarizados',
          titulo: 'Lista de precios polarizados',
          contenido: <ListaPolarizados />,
        },
        {
          id: 'sublimaciones',
          titulo: 'Sublimaciones',
          contenido: (
            <Sublimaciones
              items={sublimaciones.data ?? []}
              administrador={administrador}
              error={sublimaciones.error}
            />
          ),
        },
        {
          id: 'categorias',
          titulo: 'Categorías de vehículos',
          contenido: <CategoriasVehiculos />,
        },
      ]}
    />
  )
}