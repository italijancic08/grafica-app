-- ============================================================
-- MIGRACIÓN 0006 — Fix: verificar stock antes de restar
-- ============================================================
-- Problema: el trigger registrar_movimiento_stock() restaba
-- cantidad_actual y RECIÉN DESPUÉS comprobaba si había quedado
-- negativa. Postgres aplica la restricción
-- "check (cantidad_actual >= 0)" en el momento del update, antes
-- de que la lógica de "raise exception" personalizada llegara a
-- ejecutarse — por lo tanto, en vez del mensaje amigable
-- "Stock insuficiente para este movimiento", el usuario veía el
-- error crudo de Postgres:
-- "new row for relation materiales violates check constraint
-- materiales_cantidad_actual_check".
--
-- Solución: el trigger ahora consulta el stock actual PRIMERO,
-- compara contra la cantidad del egreso, y solo si alcanza
-- ejecuta el update. Así el mensaje personalizado se dispara
-- correctamente antes de llegar a violar la restricción.
-- ============================================================

create or replace function registrar_movimiento_stock()
returns trigger as $$
declare
  v_stock_actual numeric;
begin
  if new.tipo = 'ingreso' then
    update materiales
    set cantidad_actual = cantidad_actual + new.cantidad
    where id = new.material_id;

  elsif new.tipo = 'egreso' then
    select cantidad_actual into v_stock_actual
    from materiales
    where id = new.material_id;

    if v_stock_actual < new.cantidad then
      raise exception 'Stock insuficiente para este movimiento';
    end if;

    update materiales
    set cantidad_actual = cantidad_actual - new.cantidad
    where id = new.material_id;
  end if;

  return new;
end;
$$ language plpgsql;

-- ============================================================
-- FIN DE LA MIGRACIÓN 0006
-- ============================================================
