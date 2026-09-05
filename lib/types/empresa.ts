export interface Empresa {
  id: string
  nombre: string
  logo_url: string | null
  cuit: string | null
  direccion: string | null
  telefono: string | null
  email: string | null
  creado_en: string
}