import { z } from 'zod'

export const umbralCajaBajaSchema = z.object({
  monto: z.coerce.number({ error: 'Ingresá un número válido' }).min(0, 'No puede ser negativo'),
})

export type UmbralCajaBajaInput = z.infer<typeof umbralCajaBajaSchema>