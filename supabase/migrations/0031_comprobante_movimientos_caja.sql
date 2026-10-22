-- ============================================================
-- MIGRACIÓN 0031 — Comprobante en movimientos de caja por transferencia
-- ============================================================
-- Los comprobantes de los movimientos MANUALES de caja se guardan en el
-- bucket privado "comprobantes" (migración 0013), dentro de la carpeta
-- caja/<movimiento_id>/.
--
--   comprobante_url -> ruta del archivo en el bucket (NULL = sin cargar)
--
-- Los movimientos que vienen de un pago de trabajo (pago_id no nulo)
-- NO usan esta columna: su comprobante se sigue guardando en
-- pagos.comprobante_url (migración 0030), así hay una sola fuente de
-- verdad y la alerta "Pago sin comprobante" sigue funcionando.
-- ============================================================

alter table public.caja_movimientos
  add column if not exists comprobante_url text;