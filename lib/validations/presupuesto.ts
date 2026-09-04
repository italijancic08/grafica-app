import { z } from 'zod'

export const presupuestoSchema = z.object({
  cliente_id: z.uuid('Seleccioná un cliente'),
  descripcion: z.string().min(3, 'La descripción es obligatoria'),
  monto: z.coerce.number({ error: 'Ingresá un número válido' }).min(0, 'El monto no puede ser negativo'),
})

export type PresupuestoInput = z.infer<typeof presupuestoSchema>