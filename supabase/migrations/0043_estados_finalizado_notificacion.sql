-- ============================================================
-- MIGRACIÓN 0043 — Estados Finalizado / Pendiente de notificación
-- ============================================================
-- Solo AGREGA: dos estados permitidos nuevos y dos columnas nuevas.
-- No modifica ni borra ningún dato existente.
--   fecha_notificacion     -> cuándo se le avisó al cliente que el trabajo está terminado
--   fecha_muestra_enviada  -> cuándo se le envió la muestra (se usa en la parte 3B)
-- ============================================================

-- 1. Estados permitidos (los viejos se conservan todos)
alter table public.trabajos
  drop constraint if exists trabajos_estado_operativo_check;

alter table public.trabajos
  add constraint trabajos_estado_operativo_check
  check (estado_operativo in (
    'PRESUPUESTO','RECHAZADO',
    'INGRESADO','EN_PRODUCCION','TERCERIZADO',
    'TERMINADO','A_COORDINAR','TURNO_AGENDADO',
    'PARA_RETIRAR','RETIRADO','CANCELADO',
    'PENDIENTE_NOTIFICACION','FINALIZADO'
  ));

-- 2. Columnas nuevas
alter table public.trabajos
  add column if not exists fecha_notificacion date,
  add column if not exists fecha_muestra_enviada date;

-- 3. Recrear la vista para que incluya las columnas nuevas
--    (misma definición que la migración 0028)
drop view if exists public.trabajos_con_saldo;

create view public.trabajos_con_saldo as
select
  t.*,
  coalesce(p.total_pagado, 0) as total_pagado,
  t.precio_final - coalesce(p.total_pagado, 0) as saldo,
  case
    when t.precio_final = 0
         and t.estado_operativo not in ('PRESUPUESTO', 'RECHAZADO')
      then 'PAGADO'
    when coalesce(p.total_pagado, 0) = 0
      then 'SIN_PAGAR'
    when coalesce(p.total_pagado, 0) >= t.precio_final
      then 'PAGADO'
    else 'PAGO_PARCIAL'
  end as estado_financiero
from public.trabajos t
left join (
  select trabajo_id, sum(importe) as total_pagado
  from public.pagos
  group by trabajo_id
) p on p.trabajo_id = t.id;

grant select on public.trabajos_con_saldo to authenticated;

-- ============================================================
-- FIN DE LA MIGRACIÓN 0043
-- ============================================================