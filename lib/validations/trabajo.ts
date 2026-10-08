import { z } from 'zod'

export const RUBROS_TRABAJO = [
  'carteleria', 'articulos_sublimados', 'banners', 'calcomanias_impresas', 'calcomanias_rotuladas',
  'cartel_corrugado', 'corporeo_polifan', 'disenos_graficos', 'fletes', 'folleteria_tarjeteria',
  'frentes_comerciales', 'grabado_vidrios', 'otros_varios', 'patentes', 'ploteo', 'ploteo_vehicular',
  'polarizado', 'posicionador', 'rigidos', 'sellos', 'supermercado', 'trabajos_imprenta',
  'termotransferible_corte', 'venta_lamina', 'venta_materiales', 'vinilo_aerosol',
] as const

// Alta: todo trabajo nace como PRESUPUESTO. El rubro y el precio son
// opcionales en esta fase; se exigen recién al aceptarlo.
export const trabajoSchema = z.object({
  cliente_id: z.uuid('Seleccioná un cliente'),
  descripcion: z.string().min(3, 'La descripción es obligatoria'),
  rubro: z.enum(RUBROS_TRABAJO, { error: 'Rubro inválido' }).optional(),
  fecha_maxima: z.string().optional(),
  precio_final: z.coerce.number({ error: 'Ingresá un número válido' }).min(0, 'El precio no puede ser negativo').optional(),
  ancho_cm: z.coerce.number().min(0, 'El ancho no puede ser negativo').optional(),
  largo_cm: z.coerce.number().min(0, 'El largo no puede ser negativo').optional(),
})

export type TrabajoInput = z.infer<typeof trabajoSchema>

// Campos editables desde la ficha. El cliente solo se puede cambiar
// mientras el trabajo siga en fase de presupuesto (lo valida el servicio).
export const trabajoEditSchema = z.object({
  cliente_id: z.uuid('Seleccioná un cliente').optional(),
  descripcion: z.string().min(3, 'La descripción es obligatoria'),
  rubro: z.enum(RUBROS_TRABAJO, { error: 'Rubro inválido' }).optional(),
  fecha_maxima: z.string().optional(),
  precio_final: z.coerce.number({ error: 'Ingresá un número válido' }).min(0, 'El precio no puede ser negativo'),
  ancho_cm: z.coerce.number().min(0, 'El ancho no puede ser negativo').optional(),
  largo_cm: z.coerce.number().min(0, 'El largo no puede ser negativo').optional(),
})

export type TrabajoEditInput = z.infer<typeof trabajoEditSchema>