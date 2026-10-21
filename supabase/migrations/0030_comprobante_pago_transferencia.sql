-- ============================================================
-- MIGRACIÓN 0030 — Comprobante de pago en transferencias
-- ============================================================
-- Los comprobantes se guardan en el bucket privado "comprobantes"
-- (migración 0013), dentro de la carpeta pagos/<trabajo_id>/.
-- Adjuntarlo es opcional: si una transferencia no lo tiene, aparece
-- una alerta en Notificaciones hasta que se cargue.
--
--   comprobante_url    -> ruta del archivo en el bucket (NULL = sin cargar)
--   comprobante_exento -> true para transferencias ANTERIORES a esta
--                         función, así no generan alertas por el historial
-- ============================================================

alter table public.pagos
  add column if not exists comprobante_url text,
  add column if not exists comprobante_exento boolean not null default false;

-- Ejecutar UNA sola vez: marca como exentas las transferencias que ya
-- existían y no tienen comprobante.
update public.pagos
set comprobante_exento = true
where medio_pago = 'transferencia'
  and comprobante_url is null;