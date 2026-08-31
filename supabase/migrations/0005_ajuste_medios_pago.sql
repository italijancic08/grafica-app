-- ============================================================
-- MIGRACIÓN 0005 — Ajuste de medios de pago
-- ============================================================
-- Cambios:
-- 1. Se quita "mercado_pago" de los medios de pago válidos.
-- 2. Se agrega "mixto" como nuevo medio de pago.
-- 3. Se agrega la columna "detalle_medio_pago": se usa para
--    guardar "debito"/"credito" cuando el medio es "tarjeta",
--    y texto libre cuando el medio es "otro".
-- ============================================================

alter table pagos drop constraint pagos_medio_pago_check;

alter table pagos add constraint pagos_medio_pago_check
  check (medio_pago in ('efectivo', 'transferencia', 'tarjeta', 'mixto', 'otro'));

alter table pagos add column detalle_medio_pago text;

-- ============================================================
-- FIN DE LA MIGRACIÓN 0005
-- ============================================================
