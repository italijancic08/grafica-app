export type Rol = 'administrador' | 'supervisor' | 'empleado'

export interface Usuario {
  id: string
  nombre: string
  email: string
  rol: Rol
  activo: boolean
  creado_en: string
}