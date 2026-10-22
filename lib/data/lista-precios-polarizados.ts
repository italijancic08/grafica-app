// Generado a partir de LISTA_DE_PRECIOS_POLARIZADOS.xlsx (hoja PRECIOS).
// El precio con tarjeta (6 pagos sin interés) = efectivo + recargo, igual que la fórmula del Excel.
export const RECARGO_TARJETA = 0.6

export interface ItemPolarizado {
  vehiculo: string
  categoria: string | null
  efectivo: number
}

export interface GrupoPolarizado {
  titulo: string
  etiquetaCategoria?: string
  recargoTarjeta: number
  items: ItemPolarizado[]
}

export function precioTarjeta(efectivo: number, recargo: number): number {
  return Math.round(efectivo * (1 + recargo))
}

const R = RECARGO_TARJETA

export const LISTA_POLARIZADOS: GrupoPolarizado[] = [
  {
    titulo: 'Polarizado de vehículos', recargoTarjeta: R, items: [
      { vehiculo: 'CAMIONETA CABINA SIMPLE / UTILITARIO FURGON', categoria: '1', efectivo: 60000 },
      { vehiculo: 'CAMIONETA CABINA SIMPLE HABITACULO GRANDE', categoria: '2', efectivo: 65000 },
      { vehiculo: 'CAMIONETA DOBLE CABINA / UTILITARIOS CON ASIENTOS ATRAS', categoria: '3', efectivo: 70000 },
      { vehiculo: 'AUTO (4 ventanas + luneta + franja de 20cm)', categoria: '4', efectivo: 70000 },
      { vehiculo: 'MONO VOLUMEN / AUTOS CON UNA VENTANA ADICIONAL', categoria: '5', efectivo: 75000 },
      { vehiculo: 'UTILITARIOS TOTALMENTE VIDRIADOS', categoria: '6', efectivo: 80000 },
      { vehiculo: 'TRAFFIC O SIMILAR VIDRIADA (6 VENTANAS + LUNETA + FRANJA)', categoria: '7', efectivo: 85000 },
      { vehiculo: 'TRAFFIC O SIMILAR VIDRIADA (8 VENTANAS + LUNETA + FRANJA)', categoria: '8', efectivo: 95000 },
      { vehiculo: 'LIMPIEZA COMPLETA (SI TIENE EL PARABRISA COMPLETO $3000 adicionales)', categoria: '1 a 6', efectivo: 20000 },
      { vehiculo: 'LIMPIEZA COMPLETA TRAFFIC O SIMILAR 6 U 8 VENTANAS', categoria: '7 y 8', efectivo: 30000 },
    ],
  },
  {
    titulo: 'Polarizado de partes de vehículos', recargoTarjeta: R, items: [
      { vehiculo: 'LUNETA (VIDRIO TRASERO)', categoria: '1 a 8', efectivo: 18000 },
      { vehiculo: 'PARABRISA (si supera los 70 cm de alto cobrar $3000 adicionales)', categoria: '1 a 8', efectivo: 38000 },
      { vehiculo: 'VENTANA', categoria: '1 a 8', efectivo: 10500 },
      { vehiculo: 'FRANJA PARA SOL HASTA 20 CM', categoria: '1 a 8', efectivo: 12000 },
      { vehiculo: 'FRANJA 10 CM ADICIONALES', categoria: '1 a 8', efectivo: 6000 },
      { vehiculo: 'VENTILUZ', categoria: '1 a 8', efectivo: 6000 },
      { vehiculo: 'FRANJA CROMADA', categoria: '1 a 8', efectivo: 6000 },
      { vehiculo: 'LIMPIEZA PARABRISA COMPLETO', categoria: '1 a 8', efectivo: 15000 },
      { vehiculo: 'LIMPIEZA FRANJA', categoria: '1 a 8', efectivo: 7000 },
      { vehiculo: 'LIMPIEZA VENTANA', categoria: '1 a 8', efectivo: 3000 },
      { vehiculo: 'LIMPIEZA LUNETA', categoria: '1 a 8', efectivo: 15000 },
    ],
  },
  {
    titulo: 'Camiones', recargoTarjeta: R, items: [
      { vehiculo: 'CAMION CHICO', categoria: '9', efectivo: 70000 },
      { vehiculo: 'CAMION GRANDE', categoria: '10', efectivo: 70000 },
      { vehiculo: 'LIMPIEZA COMPLETA', categoria: null, efectivo: 15000 },
    ],
  },
  {
    titulo: 'Polarizado de partes de camiones', recargoTarjeta: R, items: [
      { vehiculo: 'VENTANA CAMION CHICO', categoria: '9 y 10', efectivo: 17500 },
      { vehiculo: 'VENTANA CAMION GRANDE', categoria: '9 y 10', efectivo: 23500 },
      { vehiculo: 'PARABRISA COMPLETO', categoria: '9 y 10', efectivo: 36000 },
      { vehiculo: 'FRANJA HASTA 30 CM', categoria: '9 y 10', efectivo: 23500 },
      { vehiculo: 'FRANJA 10 CM ADICIONALES', categoria: '9 y 10', efectivo: 12000 },
      { vehiculo: 'VENTILUZ', categoria: '9 y 10', efectivo: 6000 },
      { vehiculo: 'FRANJA CROMADA', categoria: '9 y 10', efectivo: 9000 },
      { vehiculo: 'LIMPIEZA PARABRISA COMPLETO', categoria: '9 y 10', efectivo: 15000 },
      { vehiculo: 'LIMPIEZA FRANJA', categoria: '9 y 10', efectivo: 7000 },
      { vehiculo: 'LIMPIEZA VENTANA', categoria: '9 y 10', efectivo: 4000 },
      { vehiculo: 'LIMPIEZA VENTILUZ', categoria: '9 y 10', efectivo: 2000 },
    ],
  },
  {
    titulo: 'Polarizado de lanchas', recargoTarjeta: R, items: [
      { vehiculo: 'POLARIZADO COMPLETO', categoria: '11', efectivo: 50000 },
      { vehiculo: 'LIMPIEZA COMPLETA', categoria: '11', efectivo: 10000 },
    ],
  },
  {
    titulo: 'Polarizado de ventanas de casas u oficinas', recargoTarjeta: R, items: [
      { vehiculo: 'EN NUESTRO LOCAL', categoria: 'Costo por m²', efectivo: 20000 },
      { vehiculo: 'EN DOMICILIO', categoria: 'Costo por m²', efectivo: 25000 },
      { vehiculo: 'EN DOMICILIO EN ALTURA', categoria: 'Costo por m²', efectivo: 35000 },
    ],
  },
  {
    titulo: 'Venta de lámina polarizada', etiquetaCategoria: 'Tono', recargoTarjeta: R, items: [
      { vehiculo: 'METRO LINEAL X EL ANCHO (152CM)', categoria: 'Intermedio', efectivo: 17000 },
      { vehiculo: 'METRO LINEAL X EL ANCHO (152CM)', categoria: 'Oscuro', efectivo: 17000 },
      { vehiculo: 'METRO LINEAL X EL ANCHO (152CM)', categoria: 'Claro', efectivo: 17000 },
    ],
  },
]