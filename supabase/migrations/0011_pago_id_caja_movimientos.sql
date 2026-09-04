-- Vincula cada movimiento de caja generado desde un pago, con ese pago.
-- Permite mantener sincronizado el movimiento de caja cuando se edita
-- un pago ya registrado (importe, medio de pago).
alter table caja_movimientos add column pago_id uuid references pagos(id);

-- Actualiza el trigger que genera el ingreso de caja al registrar un pago,
-- para que también guarde la referencia al pago de origen.
create or replace function generar_ingreso_caja_desde_pago()
returns trigger as $$
declare
  v_rubro text;
begin
  select coalesce(rubro, 'trabajos_imprenta') into v_rubro
  from trabajos where id = new.trabajo_id;

  insert into caja_movimientos (tipo, monto, concepto, trabajo_id, usuario_id, medio_pago, rubro, pago_id)
  values (
    'ingreso',
    new.importe,
    'Pago trabajo ' || (select numero from trabajos where id = new.trabajo_id),
    new.trabajo_id,
    new.usuario_id,
    new.medio_pago,
    v_rubro,
    new.id
  );
  return new;
end;
$$ language plpgsql;