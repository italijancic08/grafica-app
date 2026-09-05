import { z } from 'zod'

export const empresaSchema = z.object({
  nombre: z.string().min(2, 'El nombre / razón social es obligatorio'),
  cuit: z.string().optional(),
  direccion: z.string().optional(),
  telefono: z.string().optional(),
  email: z.email('Email inválido').optional().or(z.literal('')),
})

export type EmpresaInput = z.infer<typeof empresaSchema>