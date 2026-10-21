-- ============================================================
-- MIGRACIÓN 0029 — Código de seguimiento en tercerizaciones
-- ============================================================
-- Código opcional que da el proveedor/transporte para rastrear
-- el envío del trabajo tercerizado.
-- ============================================================

alter table public.tercerizaciones
  add column if not exists codigo_seguimiento text
    check (codigo_seguimiento is null or length(trim(codigo_seguimiento)) > 0);