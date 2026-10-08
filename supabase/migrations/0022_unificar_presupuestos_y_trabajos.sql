-- ============================================================
-- MIGRACIÓN 0022 — Unificar presupuestos y trabajos
-- ============================================================
-- Un presupuesto pasa a ser un trabajo en estado PRESUPUESTO.
--   PRESUPUESTO -> (aceptar) INGRESADO -> flujo normal
--   PRESUPUESTO -> (rechazar) RECHAZADO
-- Numeración: PR-AAAA-NNNNNN mientras es presupuesto; al aceptarse
-- recibe su número TR-AAAA-NNNNNN. Los rechazados no consumen números TR.
-- ============================================================

-- 1. Nuevos estados permitidos
do $$
declare r record;
begin
  for r in
    select conname from pg_constraint
    where conrelid = 'trabajos'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%estado_operativo%'
  loop
    execute format('alter table trabajos drop constraint %I', r.conname);
  end loop;
end $$;

alter table trabajos add constraint trabajos_estado_operativo_check
  check (estado_operativo in (
    'PRESUPUESTO','RECHAZADO',
    'INGRESADO','EN_PRODUCCION','TERCERIZADO',
    'TERMINADO','PARA_RETIRAR','RETIRADO','CANCELADO'
  ));

-- 2. Contador propio para presupuestos
create table if not exists contador_presupuestos (
  anio int primary key,
  ultimo_numero int not null default 0
);
alter table contador_presupuestos enable row level security;

-- 3. Numeración al insertar (PR para presupuestos/rechazados, TR para el resto)
create or replace function generar_numero_trabajo()
returns trigger as $$
declare
  anio_actual int := extract(year from now())::int;
  siguiente int;
begin
  if new.estado_operativo in ('PRESUPUESTO', 'RECHAZADO') then
    insert into contador_presupuestos (anio, ultimo_numero)
    values (anio_actual, 1)
    on conflict (anio) do update set ultimo_numero = contador_presupuestos.ultimo_numero + 1
    returning ultimo_numero into siguiente;

    new.numero := 'PR-' || anio_actual || '-' || lpad(siguiente::text, 6, '0');
  else
    insert into contador_trabajos (anio, ultimo_numero)
    values (anio_actual, 1)
    on conflict (anio) do update set ultimo_numero = contador_trabajos.ultimo_numero + 1
    returning ultimo_numero into siguiente;

    new.numero := 'TR-' || anio_actual || '-' || lpad(siguiente::text, 6, '0');
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- 4. Al aceptar un presupuesto, se le asigna su número de trabajo
create or replace function asignar_numero_al_aceptar_presupuesto()
returns trigger as $$
declare
  anio_actual int := extract(year from now())::int;
  siguiente int;
begin
  insert into contador_trabajos (anio, ultimo_numero)
  values (anio_actual, 1)
  on conflict (anio) do update set ultimo_numero = contador_trabajos.ultimo_numero + 1
  returning ultimo_numero into siguiente;

  new.numero := 'TR-' || anio_actual || '-' || lpad(siguiente::text, 6, '0');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_numero_al_aceptar_presupuesto on trabajos;
create trigger trg_numero_al_aceptar_presupuesto
before update of estado_operativo on trabajos
for each row
when (
  old.estado_operativo = 'PRESUPUESTO'
  and new.estado_operativo not in ('PRESUPUESTO', 'RECHAZADO')
)
execute function asignar_numero_al_aceptar_presupuesto();

-- 5. Pasar los presupuestos viejos (que no se hayan convertido) a la tabla trabajos.
--    Los aprobados con trabajo_id ya existen como trabajos: no se tocan.
insert into trabajos (cliente_id, descripcion, precio_final, ancho_cm, largo_cm,
                      fecha_entrada, creado_en, estado_operativo)
select p.cliente_id, p.descripcion, coalesce(p.monto, 0), p.ancho_cm, p.largo_cm,
       p.fecha, p.creado_en,
       case when p.estado = 'RECHAZADO' then 'RECHAZADO' else 'PRESUPUESTO' end
from presupuestos p
where p.trabajo_id is null
order by p.creado_en;

-- 6. Recrear la vista para que incluya todas las columnas actuales de trabajos
drop view if exists trabajos_con_saldo;

create view trabajos_con_saldo as
select
  t.*,
  coalesce(p.total_pagado, 0) as total_pagado,
  t.precio_final - coalesce(p.total_pagado, 0) as saldo,
  case
    when coalesce(p.total_pagado, 0) = 0 then 'SIN_PAGAR'
    when coalesce(p.total_pagado, 0) >= t.precio_final then 'PAGADO'
    else 'PAGO_PARCIAL'
  end as estado_financiero
from trabajos t
left join (
  select trabajo_id, sum(importe) as total_pagado
  from pagos
  group by trabajo_id
) p on p.trabajo_id = t.id;

-- La tabla "presupuestos" queda sin uso. Cuando verifiques que todo anda bien:
-- drop table presupuestos;