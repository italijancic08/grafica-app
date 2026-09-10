-- supabase/migrations/0016_rls_y_seed_configuracion.sql
-- ============================================================
-- MIGRACIÓN 0016 — Política RLS faltante en configuracion + umbral de caja baja
-- ============================================================
-- Mismo problema que clientes (0003) y empresas (0014): la tabla
-- "configuracion" quedó con RLS activado y solo política de SELECT
-- (migración 0001). Nunca se había usado para escritura hasta ahora
-- (Fase 23: umbral configurable de "poco dinero" en caja).
-- ============================================================

create policy "usuarios autenticados pueden gestionar configuracion"
  on configuracion for all
  to authenticated
  using (true)
  with check (true);

insert into configuracion (clave, valor)
values ('umbral_caja_baja', '10000'::jsonb)
on conflict (clave) do nothing;

-- ============================================================
-- FIN DE LA MIGRACIÓN 0016
-- ============================================================