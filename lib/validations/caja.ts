import { z } from 'zod'

export const movimientoCajaSchema = z.object({
  tipo: z.enum(['ingreso', 'egreso']),
  monto: z.coerce.number({ error: 'Ingresá un número válido' }).positive('El monto debe ser mayor a 0'),
  concepto: z.string().min(2, 'El concepto es obligatorio'),
  medio_pago: z.enum(['efectivo', 'transferencia', 'tarjeta', 'mixto', 'otro']),
  rubro: z.string().min(1, 'Seleccioná un rubro'),
})

export type MovimientoCajaInput = z.infer<typeof movimientoCajaSchema>