-- ============================================================
-- MIGRACIÓN 0044 — Presupuestos: fecha de envío y fotos
-- ============================================================
-- Solo AGREGA (no modifica ni borra datos existentes):
--   1. trabajos.fecha_envio_presupuesto
--   2. tabla trabajo_fotos (fotos de cada presupuesto/trabajo)
--   3. bucket privado "fotos-trabajos" en Storage
-- ============================================================

-- 1. Fecha en que se envió el presupuesto al cliente
alter table public.trabajos
  add column if not exists fecha_envio_presupuesto date;

-- Recrear la vista para que incluya la columna nueva
-- (misma definición que la migración 0043)
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

-- 2. Fotos de cada trabajo / presupuesto
create table if not exists public.trabajo_fotos (
  id uuid primary key default gen_random_uuid(),
  trabajo_id uuid not null references public.trabajos(id) on delete cascade,
  ruta text not null,
  nombre text,
  creado_en timestamptz not null default now(),
  creado_por uuid default auth.uid()
);

create index if not exists idx_trabajo_fotos_trabajo
  on public.trabajo_fotos(trabajo_id);

alter table public.trabajo_fotos enable row level security;

create policy "usuarios autenticados pueden gestionar fotos de trabajos"
  on public.trabajo_fotos for all to authenticated
  using (true) with check (true);

-- 3. Bucket PRIVADO para las fotos (se accede con links temporales)
insert into storage.buckets (id, name, public)
values ('fotos-trabajos', 'fotos-trabajos', false)
on conflict (id) do nothing;

create policy "usuarios autenticados pueden subir fotos de trabajos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos-trabajos');

create policy "usuarios autenticados pueden ver fotos de trabajos"
  on storage.objects for select to authenticated
  using (bucket_id = 'fotos-trabajos');

create policy "usuarios autenticados pueden borrar fotos de trabajos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'fotos-trabajos');

-- ============================================================
-- FIN DE LA MIGRACIÓN 0044
-- ============================================================