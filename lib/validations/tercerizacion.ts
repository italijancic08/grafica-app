import { z } from 'zod'

export const tercerizacionSchema = z.object({
  trabajo_id: z.uuid(),
  proveedor: z.string().min(2, 'El proveedor es obligatorio'),
  fecha_estimada_vuelta: z.string().optional(),
  costo: z.coerce.number().min(0).optional(),
})

export type TercerizacionInput = z.infer<typeof tercerizacionSchema>

export const editarTercerizacionSchema = z.object({
  proveedor: z.string().trim().min(2, 'El proveedor es obligatorio'),
  fecha_envio: z.iso.date(),
  fecha_estimada_vuelta: z.iso.date().nullable(),
  fecha_real_vuelta: z.iso.date().nullable(),
  costo: z.number().min(0, 'El costo no puede ser negativo').nullable(),
})

export type EditarTercerizacionInput = z.infer<
  typeof editarTercerizacionSchema
>