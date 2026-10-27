import { z } from 'zod'

export const RUBROS_TRABAJO = [
  'carteleria', 'articulos_sublimados', 'banners', 'calcomanias_impresas', 'calcomanias_rotuladas',
  'cartel_corrugado', 'corporeo_polifan', 'disenos_graficos', 'fletes', 'folleteria_tarjeteria',
  'frentes_comerciales', 'grabado_vidrios', 'otros_varios', 'patentes', 'ploteo', 'ploteo_vehicular',
  'polarizado', 'posicionador', 'rigidos', 'sellos', 'supermercado', 'trabajos_imprenta',
  'termotransferible_corte', 'venta_lamina', 'venta_materiales', 'vinilo_aerosol',
] as const

export const TIPOS_DESCUENTO = ['PORCENTAJE', 'MONTO'] as const

// Alta: todo trabajo nace como PRESUPUESTO. El rubro y el precio son
// opcionales en esta fase; se exigen recién al aceptarlo.
export const trabajoSchema = z.object({
  // El cliente es opcional si el trabajo ingresa por parte de una empresa
  cliente_id: z.uuid('Cliente inválido').optional().or(z.literal('')),
  empresa_cliente_id: z.uuid('Empresa inválida').optional().or(z.literal('')),
  descripcion: z.string().min(3, 'La descripción es obligatoria'),
  rubro: z.enum(RUBROS_TRABAJO, { error: 'Rubro inválido' }).optional(),
  fecha_maxima: z.string().optional(),
  // Precio ANTES del descuento. El precio final se calcula en el servicio.
  precio_base: z.coerce.number({ error: 'Ingresá un número válido' }).min(0, 'El precio no puede ser negativo').optional(),
  descuento_tipo: z.enum(TIPOS_DESCUENTO, { error: 'Tipo de descuento inválido' }).optional(),
  descuento_valor: z.coerce.number({ error: 'Ingresá un descuento válido' }).min(0, 'El descuento no puede ser negativo').optional(),
  ancho_cm: z.coerce.number().min(0, 'El ancho no puede ser negativo').optional(),
  largo_cm: z.coerce.number().min(0, 'El largo no puede ser negativo').optional(),
  requiere_turno: z.boolean().optional().default(false),
  turno_fecha: z.string().optional(),
  turno_hora: z.string().optional(),
  instalador_id: z.uuid().optional().or(z.literal('')),
}).refine((datos) => !!datos.cliente_id || !!datos.empresa_cliente_id, {
  message: 'Seleccioná un cliente o una empresa',
  path: ['cliente_id'],
})

export type TrabajoInput = z.infer<typeof trabajoSchema>

// Campos editables desde la ficha. El cliente solo se puede cambiar
// mientras el trabajo siga en fase de presupuesto (lo valida el servicio).
export const trabajoEditSchema = z.object({
  // Vacío = sin cliente (solo válido si el trabajo queda a nombre de una empresa)
  cliente_id: z.uuid('Cliente inválido').optional().or(z.literal('')),
  empresa_cliente_id: z.uuid('Empresa inválida').optional().or(z.literal('')),
  descripcion: z.string().min(3, 'La descripción es obligatoria'),
  rubro: z.enum(RUBROS_TRABAJO, { error: 'Rubro inválido' }).optional(),
  fecha_maxima: z.string().optional(),
  // Precio ANTES del descuento. El precio final se calcula en el servicio.
  precio_base: z.coerce.number({ error: 'Ingresá un número válido' }).min(0, 'El precio no puede ser negativo'),
  descuento_tipo: z.enum(TIPOS_DESCUENTO, { error: 'Tipo de descuento inválido' }).optional(),
  descuento_valor: z.coerce.number({ error: 'Ingresá un descuento válido' }).min(0, 'El descuento no puede ser negativo').optional(),
  ancho_cm: z.coerce.number().min(0, 'El ancho no puede ser negativo').optional(),
  largo_cm: z.coerce.number().min(0, 'El largo no puede ser negativo').optional(),
})

export type TrabajoEditInput = z.infer<typeof trabajoEditSchema>