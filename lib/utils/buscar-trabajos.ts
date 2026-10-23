import { ETIQUETAS_ESTADO_OPERATIVO, ETIQUETAS_RUBRO_TRABAJO } from '@/lib/types/trabajo'

interface TrabajoBuscable {
  numero: string
  descripcion: string
  rubro: string | null
  estado_operativo: string
  clientes?: { nombre_razon_social?: string | null; telefono?: string | null } | null
  empresas_clientes?: { nombre?: string | null } | null
}

// Minúsculas y sin tildes, para que "produccion" encuentre "En producción"
function normalizar(texto: string) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function filtrarTrabajosPorBusqueda<T extends TrabajoBuscable>(
  trabajos: T[],
  busqueda: string
): T[] {
  const palabras = normalizar(busqueda).split(/\s+/).filter(Boolean)
  if (palabras.length === 0) return trabajos

  return trabajos.filter((t) => {
    const rubro = t.rubro
      ? ETIQUETAS_RUBRO_TRABAJO[t.rubro as keyof typeof ETIQUETAS_RUBRO_TRABAJO] ?? t.rubro
      : ''
    const estado =
      ETIQUETAS_ESTADO_OPERATIVO[t.estado_operativo as keyof typeof ETIQUETAS_ESTADO_OPERATIVO] ??
      t.estado_operativo

    const texto = normalizar(
      [
        t.numero,
        t.clientes?.nombre_razon_social,
        t.clientes?.telefono,
        t.empresas_clientes?.nombre,
        t.descripcion,
        rubro,
        estado,
      ]
        .filter(Boolean)
        .join(' ')
    )

    // Todas las palabras tienen que aparecer
    return palabras.every((p) => texto.includes(p))
  })
}