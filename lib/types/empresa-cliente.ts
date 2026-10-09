export interface EmpresaCliente {
  id: string
  nombre: string
  telefono: string | null
  email: string | null
  cuit: string | null
  domicilio: string | null
  localidad: string | null
  provincia: string | null
  notas: string | null
  creado_en: string
  modificado_en: string
}
