-- ============================================================
-- MIGRACIÓN 0014 — Arreglo de políticas RLS faltantes en empresas
-- ============================================================
-- Mismo problema que ya se había dado con "clientes" en la
-- migración 0003: la tabla "empresas" quedó con RLS activado
-- pero sin ninguna política creada (el statement se cortó antes
-- de llegar a estas líneas en el script original de la Fase 4).
-- Como nunca se había usado la tabla hasta la Fase 21
-- (Facturación), recién ahora se notó.
--
-- Solución: recrear las políticas de "empresas".
-- ============================================================

drop policy if exists "usuarios autenticados pueden ver empresas" on empresas;
drop policy if exists "usuarios autenticados pueden editar empresas" on empresas;

create policy "usuarios autenticados pueden ver empresas"
  on empresas for select
  to authenticated
  using (true);

create policy "usuarios autenticados pueden editar empresas"
  on empresas for all
  to authenticated
  using (true)
  with check (true);

-- ============================================================
-- FIN DE LA MIGRACIÓN 0014
-- ============================================================