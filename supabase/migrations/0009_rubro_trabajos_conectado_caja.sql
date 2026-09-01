-- ============================================================
-- MIGRACIÓN 0009 — Rubro en trabajos, conectado a caja
-- ============================================================
-- Se agrega "rubro" a la tabla "trabajos", restringido a los
-- rubros que efectivamente aplican a un trabajo (subconjunto de
-- los rubros de caja — se excluyen rubros de gestión de caja como
-- "caja", "retiro_dinero", "libreria", "comisiones", etc.).
--
-- El trigger generar_ingreso_caja_desde_pago() ahora toma el
-- rubro real del trabajo (con "trabajos_imprenta" como valor por
-- defecto si el trabajo no tiene rubro asignado), en vez de un
-- valor fijo como se dejó en la migración 0008.
-- ============================================================

alter table trabajos add column rubro text
  check (rubro in (
    'carteleria', 'articulos_sublimados', 'banners', 'calcomanias_impresas', 'calcomanias_rotuladas',
    'cartel_corrugado', 'corporeo_polifan', 'disenos_graficos', 'fletes', 'folleteria_tarjeteria',
    'frentes_comerciales', 'grabado_vidrios', 'otros_varios', 'patentes', 'ploteo', 'ploteo_vehicular',
    'polarizado', 'posicionador', 'rigidos', 'sellos', 'supermercado', 'trabajos_imprenta',
    'termotransferible_corte', 'venta_lamina', 'venta_materiales', 'vinilo_aerosol'
  ));

create or replace function generar_ingreso_caja_desde_pago()
returns trigger as $$
declare
  v_rubro text;
begin
  select coalesce(rubro, 'trabajos_imprenta') into v_rubro
  from trabajos where id = new.trabajo_id;

  insert into caja_movimientos (tipo, monto, concepto, trabajo_id, usuario_id, medio_pago, rubro)
  values (
    'ingreso',
    new.importe,
    'Pago trabajo ' || (select numero from trabajos where id = new.trabajo_id),
    new.trabajo_id,
    new.usuario_id,
    new.medio_pago,
    v_rubro
  );
  return new;
end;
$$ language plpgsql;

-- ============================================================
-- FIN DE LA MIGRACIÓN 0009
-- ============================================================
