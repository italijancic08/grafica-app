import { z } from 'zod'

export const materialSchema = z.object({
  nombre: z.string().min(2, 'El nombre es obligatorio'),
  unidad_medida: z.string().min(1, 'La unidad de medida es obligatoria'),
  cantidad_actual: z.coerce.number({ error: 'Ingresá un número válido' }).min(0, 'No puede ser negativo'),
  stock_minimo: z.coerce.number({ error: 'Ingresá un número válido' }).min(0, 'No puede ser negativo'),
  costo_unitario: z.coerce.number({ error: 'Ingresá un número válido' }).min(0, 'No puede ser negativo').default(0),
})

export type MaterialInput = z.input<typeof materialSchema>

// En la edición no se toca cantidad_actual: el stock solo cambia con movimientos.
export const materialEdicionSchema = materialSchema.omit({ cantidad_actual: true })

export type MaterialEdicionInput = z.input<typeof materialEdicionSchema>

export const movimientoSchema = z.object({
  material_id: z.uuid(),
  tipo: z.enum(['ingreso', 'egreso']),
  cantidad: z.coerce.number({ error: 'Ingresá un número válido' }).positive('La cantidad debe ser mayor a 0'),
  observacion: z.string().optional(),
})

export type MovimientoInput = z.infer<typeof movimientoSchema>