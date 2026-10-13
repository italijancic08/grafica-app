export type Rol = 'administrador' | 'empleado'

export interface Usuario {
  id: string
  nombre: string
  email: string
  rol: Rol
  activo: boolean
  creado_en: string
}