-- supabase/migrations/0017_rls_auditoria.sql
-- ============================================================
-- MIGRACIÓN 0017 — Política RLS faltante en auditoria (Fase 24)
-- ============================================================
-- Mismo problema que clientes (0003), empresas (0014) y configuracion
-- (0016): "auditoria" quedó con RLS activado y solo política de SELECT
-- (migración 0001). Todos los insert que ya existían en el código
-- (caja, pagos, stock, trabajos, tercerizaciones, cierre de caja mensual)
-- venían fallando en silencio, porque ninguno revisaba el error de vuelta.
-- ============================================================

create policy "usuarios autenticados pueden registrar auditoria"
  on auditoria for insert
  to authenticated
  with check (true);

-- ============================================================
-- FIN DE LA MIGRACIÓN 0017
-- ============================================================