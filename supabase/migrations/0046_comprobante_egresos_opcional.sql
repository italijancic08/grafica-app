-- ============================================================
-- MIGRACIÓN 0046 — Comprobante (RC) opcional en salidas de dinero
-- ============================================================
-- Antes el RC era obligatorio en toda salida de dinero. Ahora es opcional,
-- pero si falta aparece una alerta en Notificaciones ("Egreso sin
-- comprobante") hasta que se adjunte, igual que pasa con las
-- transferencias de los pagos (migración 0030).
--
--   comprobante_exento -> true para egresos ANTERIORES a esta función que
--                         no tienen comprobante, así no generan alertas
--                         por el historial.
--
-- Los movimientos automáticos del cierre de caja (rubro 'caja') no
-- generan alerta: se filtran en la consulta de alertas.
-- ============================================================

alter table public.caja_movimientos
  add column if not exists comprobante_exento boolean not null default false;

-- Ejecutar UNA sola vez: marca como exentos los egresos que ya existían
-- y no tienen comprobante.
update public.caja_movimientos
set comprobante_exento = true
where tipo = 'egreso'
  and comprobante_url is null;

-- ============================================================
-- FIN DE LA MIGRACIÓN 0046
-- ============================================================
