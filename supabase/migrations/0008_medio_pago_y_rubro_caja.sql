-- ============================================================
-- MIGRACIÓN 0008 — Forma de pago y rubro en caja_movimientos
-- ============================================================
-- Se agregan dos columnas a "caja_movimientos":
-- - medio_pago: misma lista que en "pagos" (efectivo, transferencia,
--   tarjeta, mixto, otro). Permite calcular la "caja física" (solo
--   efectivo).
-- - rubro: categoría del movimiento, según el rubro de negocio de
--   la gráfica.
--
-- El trigger que genera automáticamente un ingreso en caja al
-- registrar un pago (Fase 4) ahora copia también el medio_pago del
-- pago, y asigna el rubro "trabajos_imprenta" por defecto.
-- ============================================================

alter table caja_movimientos add column medio_pago text
  check (medio_pago in ('efectivo', 'transferencia', 'tarjeta', 'mixto', 'otro'));

alter table caja_movimientos add column rubro text
  check (rubro in (
    'caja', 'dif_caja', 'reposicion_caja', 'accesorios_terminaciones', 'carteleria',
    'articulos_sublimados', 'banners', 'calcomanias_impresas', 'calcomanias_rotuladas',
    'cartel_corrugado', 'corporeo_polifan', 'comisiones', 'disenos_graficos', 'fletes',
    'folleteria_tarjeteria', 'frentes_comerciales', 'grabado_vidrios', 'indumentaria',
    'libreria', 'limpieza', 'otros_varios', 'pagos_ld', 'pagos_carlos_insumos',
    'pago_proveedores', 'pagos_varios', 'patentes', 'ploteo', 'ploteo_vehicular',
    'polarizado', 'posicionador', 'retiro_dinero', 'rigidos', 'sellos', 'supermercado',
    'trabajos_imprenta', 'termotransferible_corte', 'venta_lamina', 'venta_materiales',
    'vinilo_aerosol'
  ));

create or replace function generar_ingreso_caja_desde_pago()
returns trigger as $$
begin
  insert into caja_movimientos (tipo, monto, concepto, trabajo_id, usuario_id, medio_pago, rubro)
  values (
    'ingreso',
    new.importe,
    'Pago trabajo ' || (select numero from trabajos where id = new.trabajo_id),
    new.trabajo_id,
    new.usuario_id,
    new.medio_pago,
    'trabajos_imprenta'
  );
  return new;
end;
$$ language plpgsql;

-- ============================================================
-- FIN DE LA MIGRACIÓN 0008
-- ============================================================
