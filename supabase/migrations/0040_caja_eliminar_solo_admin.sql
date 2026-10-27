-- MIGRACIÓN 0040 — Solo los administradores pueden eliminar movimientos de caja
drop policy if exists "usuarios autenticados pueden registrar en caja" on caja_movimientos;

create policy "usuarios autenticados pueden registrar en caja"
  on caja_movimientos for insert
  to authenticated
  with check (true);

create policy "usuarios autenticados pueden actualizar caja"
  on caja_movimientos for update
  to authenticated
  using (true)
  with check (true);

create policy "solo administradores pueden eliminar de caja"
  on caja_movimientos for delete
  to authenticated
  using (public.es_administrador());