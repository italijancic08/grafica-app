-- ============================================================
-- MIGRACIÓN 0028 — Descuentos en trabajos + estados de turno
-- ============================================================
-- 1. Descuentos: precio_final sigue siendo lo que paga el cliente
--    (así saldo, pagos, caja y reportes no cambian). Si hay descuento,
--    se guarda además el precio original y cómo se calculó:
--      precio_base     -> precio antes del descuento (NULL = sin descuento)
--      descuento_tipo  -> 'PORCENTAJE' | 'MONTO'
--      descuento_valor -> el % o el monto elegido
-- 2. Estados nuevos: A_COORDINAR y TURNO_AGENDADO.
-- ============================================================

-- 1. Columnas de descuento
alter table public.trabajos
  add column if not exists precio_base numeric(12,2)
    check (precio_base is null or precio_base >= 0),
  add column if not exists descuento_tipo text
    check (descuento_tipo in ('PORCENTAJE', 'MONTO')),
  add column if not exists descuento_valor numeric(12,2) not null default 0
    check (descuento_valor >= 0);

alter table public.trabajos
  drop constraint if exists trabajos_descuento_coherente;

alter table public.trabajos
  add constraint trabajos_descuento_coherente check (
    (descuento_tipo is null and descuento_valor = 0 and precio_base is null)
    or (
      descuento_tipo is not null
      and descuento_valor > 0
      and precio_base is not null
      and precio_base >= precio_final
      and (descuento_tipo <> 'PORCENTAJE' or descuento_valor <= 100)
    )
  );

-- 2. Nuevos estados permitidos
alter table public.trabajos
  drop constraint if exists trabajos_estado_operativo_check;

alter table public.trabajos
  add constraint trabajos_estado_operativo_check
  check (estado_operativo in (
    'PRESUPUESTO','RECHAZADO',
    'INGRESADO','EN_PRODUCCION','TERCERIZADO',
    'TERMINADO','A_COORDINAR','TURNO_AGENDADO',
    'PARA_RETIRAR','RETIRADO','CANCELADO'
  ));

-- 3. Recrear la vista para que incluya las columnas nuevas de trabajos
--    (misma definición que la migración 0027)
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

-- 4. Alertas: un trabajo hecho que espera coordinar/realizar el turno
--    sigue contando como "listo y no retirado" si pasó su fecha máxima
drop view if exists public.trabajos_no_retirados;

create view public.trabajos_no_retirados as
select *
from public.trabajos
where fecha_maxima is not null
  and fecha_maxima < current_date
  and estado_operativo in ('TERMINADO', 'A_COORDINAR', 'TURNO_AGENDADO', 'PARA_RETIRAR');

-- ============================================================
-- FIN DE LA MIGRACIÓN 0028
-- ============================================================