-- ============================================================
-- MIGRACIÓN 0045 — Rubros nuevos de caja (salidas de dinero)
-- ============================================================
-- Agrega 5 rubros permitidos: compras, articulos_materiales, servicios,
-- adelantos y sueldos. Los rubros viejos se conservan todos.
-- No modifica ningún dato existente.
-- ============================================================

-- Se eliminan los checks de la columna "rubro" (sea cual sea su nombre)
-- y se vuelve a crear uno con la lista ampliada.
do $$
declare
  r record;
begin
  for r in
    select conname
    from pg_constraint
    where conrelid = 'public.caja_movimientos'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%rubro%'
  loop
    execute format('alter table public.caja_movimientos drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.caja_movimientos
  add constraint caja_movimientos_rubro_check
  check (rubro in (
    'caja', 'dif_caja', 'reposicion_caja', 'accesorios_terminaciones', 'carteleria',
    'articulos_sublimados', 'banners', 'calcomanias_impresas', 'calcomanias_rotuladas',
    'cartel_corrugado', 'corporeo_polifan', 'comisiones', 'disenos_graficos', 'fletes',
    'folleteria_tarjeteria', 'frentes_comerciales', 'grabado_vidrios', 'indumentaria',
    'libreria', 'limpieza', 'otros_varios', 'pagos_ld', 'pagos_carlos_insumos',
    'pago_proveedores', 'pagos_varios', 'patentes', 'ploteo', 'ploteo_vehicular',
    'polarizado', 'posicionador', 'retiro_dinero', 'rigidos', 'sellos', 'supermercado',
    'trabajos_imprenta', 'termotransferible_corte', 'venta_lamina', 'venta_materiales',
    'vinilo_aerosol',
    -- nuevos
    'compras', 'articulos_materiales', 'servicios', 'adelantos', 'sueldos'
  ));

-- ============================================================
-- FIN DE LA MIGRACIÓN 0045
-- ============================================================