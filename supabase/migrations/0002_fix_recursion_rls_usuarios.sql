-- ============================================================
-- MIGRACIÓN 0002 — Arreglo de recursión infinita en RLS de usuarios
-- ============================================================
-- Problema: las políticas de "usuarios" creadas en la Fase 5
-- consultaban la propia tabla "usuarios" dentro de su condición,
-- generando el error 42P17 "infinite recursion detected in
-- policy for relation usuarios".
--
-- Solución: mover la verificación de "es administrador" a una
-- función security definer, que no vuelve a pasar por RLS.
-- ============================================================

-- Eliminar las políticas problemáticas
drop policy if exists "administradores pueden ver todos los usuarios" on usuarios;
drop policy if exists "administradores pueden gestionar usuarios" on usuarios;

-- Función que verifica si el usuario actual es administrador,
-- sin volver a disparar las políticas RLS de "usuarios"
create or replace function es_administrador()
returns boolean as $$
  select exists (
    select 1 from usuarios
    where id = auth.uid() and rol = 'administrador'
  );
$$ language sql security definer stable;

-- Recrear las políticas usando la función
create policy "administradores pueden ver todos los usuarios"
  on usuarios for select
  to authenticated
  using (es_administrador());

create policy "administradores pueden gestionar usuarios"
  on usuarios for all
  to authenticated
  using (es_administrador())
  with check (es_administrador());

-- ============================================================
-- FIN DE LA MIGRACIÓN 0002
-- ============================================================
