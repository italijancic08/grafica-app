import { z } from 'zod'

export const RUBROS_TRABAJO = [
  'carteleria', 'articulos_sublimados', 'banners', 'calcomanias_impresas', 'calcomanias_rotuladas',
  'cartel_corrugado', 'corporeo_polifan', 'disenos_graficos', 'fletes', 'folleteria_tarjeteria',
  'frentes_comerciales', 'grabado_vidrios', 'otros_varios', 'patentes', 'ploteo', 'ploteo_vehicular',
  'polarizado', 'posicionador', 'rigidos', 'sellos', 'supermercado', 'trabajos_imprenta',
  'termotransferible_corte', 'venta_lamina', 'venta_materiales', 'vinilo_aerosol',
] as const

export const trabajoSchema = z.object({
  cliente_id: z.uuid('Seleccioná un cliente'),
  descripcion: z.string().min(3, 'La descripción es obligatoria'),
  rubro: z.enum(RUBROS_TRABAJO, { error: 'Seleccioná un rubro' }),
  fecha_maxima: z.string().optional(),
  precio_final: z.coerce.number({ error: 'Ingresá un número válido' }).min(0, 'El precio no puede ser negativo'),
  sena: z.coerce.number({ error: 'Ingresá un número válido' }).min(0, 'La seña no puede ser negativa'),
  medio_pago_sena: z.enum(['efectivo', 'transferencia', 'tarjeta', 'mixto', 'otro']).optional(),
  detalle_medio_pago_sena: z.string().optional(),
}).refine(
  (data) => {
    if (data.sena <= 0) return true
    if (!data.medio_pago_sena) return false
    if (data.medio_pago_sena === 'tarjeta') return !!data.detalle_medio_pago_sena
    if (data.medio_pago_sena === 'otro') return !!data.detalle_medio_pago_sena?.trim()
    return true
  },
  {
    message: 'Especificá el medio de pago de la seña',
    path: ['medio_pago_sena'],
  }
)

export type TrabajoInput = z.infer<typeof trabajoSchema>

// Campos editables desde la ficha del trabajo. No incluye cliente_id ni seña:
// el cliente no se reasigna acá, y la seña ya se registró como un pago real
// (se edita, si hace falta, desde la sección de Pagos).
export const trabajoEditSchema = z.object({
  descripcion: z.string().min(3, 'La descripción es obligatoria'),
  rubro: z.enum(RUBROS_TRABAJO, { error: 'Seleccioná un rubro' }),
  fecha_maxima: z.string().optional(),
  precio_final: z.coerce.number({ error: 'Ingresá un número válido' }).min(0, 'El precio no puede ser negativo'),
})

export type TrabajoEditInput = z.infer<typeof trabajoEditSchema>