import { z } from 'zod'

export const empresaClienteSchema = z.object({
  nombre: z.string().min(2, 'El nombre de la empresa es obligatorio'),
  telefono: z.string().optional(),
  email: z.email('Email inválido').optional().or(z.literal('')),
  cuit: z.string().optional(),
  domicilio: z.string().optional(),
  localidad: z.string().optional(),
  provincia: z.string().optional(),
  notas: z.string().optional(),
})

export type EmpresaClienteInput = z.infer<typeof empresaClienteSchema>
