import { z } from 'zod'

export const crearUsuarioSchema = z.object({
  nombre: z.string().min(2, 'El nombre es obligatorio'),
  email: z.email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  rol: z.enum(['administrador', 'empleado']),
})

export type CrearUsuarioInput = z.infer<typeof crearUsuarioSchema>

export const editarUsuarioSchema = z.object({
  nombre: z.string().min(2, 'El nombre es obligatorio'),
  email: z.email('Email inválido'),
  rol: z.enum(['administrador', 'empleado']),
  activo: z.boolean(),
  // Vacío = no cambiar la contraseña
  password: z
    .string()
    .refine(
      (valor) => valor === '' || valor.length >= 6,
      'La contraseña debe tener al menos 6 caracteres'
    )
    .optional(),
})

export type EditarUsuarioInput = z.infer<typeof editarUsuarioSchema>