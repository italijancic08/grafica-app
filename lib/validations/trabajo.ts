import { z } from 'zod'

export const trabajoSchema = z.object({
  cliente_id: z.string().uuid('Seleccioná un cliente'),
  descripcion: z.string().min(3, 'La descripción es obligatoria'),
  fecha_maxima: z.string().optional(),
  precio_final: z.coerce.number().min(0, 'El precio no puede ser negativo'),
  sena: z.coerce.number().min(0, 'La seña no puede ser negativa'),
})

export type TrabajoInput = z.infer<typeof trabajoSchema>