-- ============================================================
-- MIGRACIÓN 0024 — Empresas de clientes
-- ============================================================
-- Una empresa (ej: Grido) puede tener varios clientes/contactos
-- (ej: Walter, el dueño). Cada trabajo puede ingresar:
--   - a nombre del cliente (empresa_cliente_id = null), o
--   - por parte de una empresa (empresa_cliente_id = id de la empresa).
--
-- OJO: la tabla "empresas" ya existe y guarda los datos de la gráfica
-- (membrete de los comprobantes). Por eso esta tabla nueva se llama
-- "empresas_clientes".
-- ============================================================

-- 1. Tabla de empresas de clientes
create table empresas_clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  telefono text,
  email text,
  cuit text,
  domicilio text,
  localidad text,
  provincia text,
  notas text,
  creado_en timestamptz not null default now(),
  modificado_en timestamptz not null default now()
);

alter table empresas_clientes enable row level security;

create policy "usuarios autenticados pueden ver empresas de clientes"
  on empresas_clientes for select
  to authenticated
  using (true);

create policy "usuarios autenticados pueden gestionar empresas de clientes"
  on empresas_clientes for all
  to authenticated
  using (true)
  with check (true);

-- 2. Un cliente puede pertenecer a una empresa (opcional)
alter table clientes
  add column empresa_cliente_id uuid references empresas_clientes(id) on delete set null;

create index idx_clientes_empresa_cliente_id on clientes(empresa_cliente_id);

-- 3. Un trabajo puede ingresar por parte de una empresa (opcional)
alter table trabajos
  add column empresa_cliente_id uuid references empresas_clientes(id) on delete set null;

create index idx_trabajos_empresa_cliente_id on trabajos(empresa_cliente_id);

-- 4. Recrear la vista para que incluya la columna nueva de trabajos
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

-- ============================================================
-- FIN DE LA MIGRACIÓN 0023
-- ============================================================