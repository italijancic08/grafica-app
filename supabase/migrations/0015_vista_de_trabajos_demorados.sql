-- ============================================================
-- MIGRACIÓN 0015 — Vistas de trabajos demorados y no retirados
-- ============================================================
-- Dos situaciones distintas, aunque ambas parten de una fecha
-- máxima vencida:
-- - trabajos_demorados: el trabajo sigue en producción (todavía
--   no está terminado ni para retirar). El atraso es nuestro.
-- - trabajos_no_retirados: el trabajo ya está terminado o para
--   retirar, pero el cliente todavía no lo pasó a buscar.
-- ============================================================

drop view if exists trabajos_demorados;

create view trabajos_demorados as
select *
from trabajos
where fecha_maxima is not null
  and fecha_maxima < current_date
  and estado_operativo in ('INGRESADO', 'EN_PRODUCCION', 'TERCERIZADO');

create view trabajos_no_retirados as
select *
from trabajos
where fecha_maxima is not null
  and fecha_maxima < current_date
  and estado_operativo in ('TERMINADO', 'PARA_RETIRAR');

-- ============================================================
-- FIN DE LA MIGRACIÓN 0015
-- ============================================================