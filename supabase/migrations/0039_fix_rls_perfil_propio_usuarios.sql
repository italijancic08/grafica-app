-- Garantiza que cada usuario autenticado (empleado o administrador)
-- pueda leer su propia fila en "usuarios" (nombre y rol en la sidebar).
drop policy if exists "usuarios pueden ver su propio perfil" on usuarios;
create policy "usuarios pueden ver su propio perfil"
  on usuarios for select to authenticated using (auth.uid() = id);
