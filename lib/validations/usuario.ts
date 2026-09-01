import { z } from 'zod'

export const crearUsuarioSchema = z.object({
  nombre: z.string().min(2, 'El nombre es obligatorio'),
  email: z.email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  rol: z.enum(['administrador', 'supervisor', 'empleado']),
})

export type CrearUsuarioInput = z.infer<typeof crearUsuarioSchema>