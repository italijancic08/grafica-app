import { z } from 'zod'

export const tercerizacionSchema = z.object({
  trabajo_id: z.uuid(),
  proveedor: z.string().min(2, 'El proveedor es obligatorio'),
  fecha_estimada_vuelta: z.string().optional(),
  costo: z.coerce.number().min(0).optional(),
})

export type TercerizacionInput = z.infer<typeof tercerizacionSchema>