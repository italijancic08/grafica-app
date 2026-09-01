import { z } from 'zod'

export const pagoSchema = z.object({
  trabajo_id: z.uuid(),
  cliente_id: z.uuid(),
  importe: z.coerce.number({ error: 'Ingresá un número válido' }).positive('El importe debe ser mayor a 0'),
  medio_pago: z.enum(['efectivo', 'transferencia', 'tarjeta', 'mixto', 'otro']),
  detalle_medio_pago: z.string().optional(),
  observacion: z.string().optional(),
}).refine(
  (data) => {
    if (data.medio_pago === 'tarjeta') return !!data.detalle_medio_pago
    if (data.medio_pago === 'otro') return !!data.detalle_medio_pago && data.detalle_medio_pago.trim().length > 0
    return true
  },
  {
    message: 'Este medio de pago requiere especificar un detalle',
    path: ['detalle_medio_pago'],
  }
)

export type PagoInput = z.infer<typeof pagoSchema>