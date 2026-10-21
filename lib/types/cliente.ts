export interface Cliente {
  id: string
  nombre_razon_social: string
  telefono: string | null
  whatsapp: string | null
  email: string | null
  cuit_cuil: string | null
  domicilio: string | null
  localidad: string | null
  provincia: string | null
  notas: string | null
  empresa_cliente_id: string | null
  empresas_clientes?: { nombre: string } | null
  creado_en: string
  modificado_en: string
  permite_trabajos_gratis: boolean
}