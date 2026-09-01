import { z } from 'zod'

export const trabajoSchema = z.object({
  cliente_id: z.uuid('Seleccioná un cliente'),
  descripcion: z.string().min(3, 'La descripción es obligatoria'),
  fecha_maxima: z.string().optional(),
  precio_final: z.coerce.number({ error: 'Ingresá un número válido' }).min(0, 'El precio no puede ser negativo'),
  sena: z.coerce.number({ error: 'Ingresá un número válido' }).min(0, 'La seña no puede ser negativa'),
  medio_pago_sena: z.enum(['efectivo', 'transferencia', 'tarjeta', 'mixto', 'otro']).optional(),
  detalle_medio_pago_sena: z.string().optional(),
}).refine(
  (data) => {
    if (data.sena <= 0) return true
    if (!data.medio_pago_sena) return false
    if (data.medio_pago_sena === 'tarjeta') return !!data.detalle_medio_pago_sena
    if (data.medio_pago_sena === 'otro') return !!data.detalle_medio_pago_sena?.trim()
    return true
  },
  {
    message: 'Especificá el medio de pago de la seña',
    path: ['medio_pago_sena'],
  }
)

export type TrabajoInput = z.infer<typeof trabajoSchema>