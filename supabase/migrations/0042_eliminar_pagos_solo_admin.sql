-- MIGRACIÓN 0042 — Eliminar pagos de trabajos (solo administradores)
--
-- La política original de pagos era "for all" (select/insert/update/delete
-- para cualquier usuario autenticado). Se separa para que solo un
-- administrador pueda eliminar, igual que en caja_movimientos (0040).
drop policy if exists "usuarios autenticados pueden registrar pagos" on pagos;

create policy "usuarios autenticados pueden registrar pagos"
  on pagos for insert
  to authenticated
  with check (true);

create policy "usuarios autenticados pueden actualizar pagos"
  on pagos for update
  to authenticated
  using (true)
  with check (true);

create policy "solo administradores pueden eliminar pagos"
  on pagos for delete
  to authenticated
  using (public.es_administrador());

-- Elimina un pago junto con el movimiento de caja que generó, en una sola
-- transacción (si falla una parte, no se borra nada). SECURITY INVOKER: se
-- aplican las políticas RLS del usuario que la llama, por lo que solo un
-- administrador logra borrar. Devuelve true si se eliminó el pago.
create or replace function eliminar_pago(p_pago_id uuid)
returns boolean as $$
declare
  v_borrados int;
begin
  delete from caja_movimientos where pago_id = p_pago_id;
  delete from pagos where id = p_pago_id;
  get diagnostics v_borrados = row_count;

  if v_borrados = 0 then
    raise exception 'No se pudo eliminar el pago (inexistente o sin permiso)';
  end if;

  return true;
end;
$$ language plpgsql security invoker;
