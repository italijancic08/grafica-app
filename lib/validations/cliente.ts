import { z } from 'zod'

export const clienteSchema = z.object({
  nombre_razon_social: z.string().min(2, 'El nombre es obligatorio'),
  telefono: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.email('Email inválido').optional().or(z.literal('')),
  cuit_cuil: z.string().optional(),
  domicilio: z.string().optional(),
  localidad: z.string().optional(),
  provincia: z.string().optional(),
  notas: z.string().optional(),
})

export type ClienteInput = z.infer<typeof clienteSchema>