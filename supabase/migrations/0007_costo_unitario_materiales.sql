-- ============================================================
-- MIGRACIÓN 0007 — Costo unitario de materiales
-- ============================================================
-- Se agrega costo_unitario a "materiales" para que la calculadora
-- de materiales pueda mostrar el costo total del material
-- consumido en un trabajo (cantidad calculada x costo_unitario).
-- ============================================================

alter table materiales add column costo_unitario numeric(12,2) not null default 0 check (costo_unitario >= 0);

-- ============================================================
-- FIN DE LA MIGRACIÓN 0007
-- ============================================================
