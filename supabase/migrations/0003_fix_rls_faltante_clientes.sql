-- ============================================================
-- MIGRACIÓN 0003 — Arreglo de políticas RLS faltantes en clientes
-- ============================================================
-- Problema: la tabla "clientes" tenía RLS activado pero sin
-- ninguna política creada (probablemente un statement anterior
-- del script original de la Fase 4 se cortó antes de llegar a
-- estas líneas). Resultado: ninguna fila era visible, aunque
-- existieran datos y el usuario estuviera autenticado.
--
-- Solución: recrear las políticas de "clientes".
-- ============================================================

create policy "usuarios autenticados pueden ver clientes"
  on clientes for select
  to authenticated
  using (true);

create policy "usuarios autenticados pueden gestionar clientes"
  on clientes for all
  to authenticated
  using (true)
  with check (true);

-- ============================================================
-- FIN DE LA MIGRACIÓN 0003
-- ============================================================
