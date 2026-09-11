-- supabase/migrations/0018_medidas_ancho_largo.sql
-- ============================================================
-- MIGRACIÓN 0018 — Medidas (ancho x largo en cm) en trabajos y presupuestos
-- ============================================================
-- Campos opcionales: no todos los trabajos/presupuestos tienen
-- medidas (ej: sellos, fletes, diseños gráficos). Se guardan en
-- centímetros, igual que en la calculadora de materiales.
-- ============================================================

alter table trabajos
  add column ancho_cm numeric(10, 2),
  add column largo_cm numeric(10, 2);

alter table presupuestos
  add column ancho_cm numeric(10, 2),
  add column largo_cm numeric(10, 2);

-- ============================================================
-- FIN DE LA MIGRACIÓN 0018
-- ============================================================