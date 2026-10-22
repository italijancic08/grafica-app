// Guía de categorías de vehículos (hoja CATEGORIAS del Excel de polarizados).
export interface CategoriaVehiculo {
  numero: number
  fotos: string[]
  nota?: string
}

// Cantidad de fotos que hay en public/categorias/ por cada categoría.
const CANTIDAD_FOTOS: Record<number, number> = {
  1: 5, 2: 3, 3: 4, 4: 2, 5: 3, 6: 2, 7: 1, 8: 1, 9: 4, 10: 3, 11: 1,
}

const NOTAS: Record<number, string> = {
  2: 'Si tiene luneta entra en esta categoría',
}

export const CATEGORIAS_VEHICULOS: CategoriaVehiculo[] = Object.entries(CANTIDAD_FOTOS).map(
  ([numero, cantidad]) => ({
    numero: Number(numero),
    fotos: Array.from({ length: cantidad }, (_, i) =>
      `/categorias/categoria-${String(numero).padStart(2, '0')}-${i + 1}.jpg`),
    nota: NOTAS[Number(numero)],
  })
)