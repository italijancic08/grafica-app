-- MIGRACIÓN 0041 — Trabajos que ingresan solo por una empresa (sin cliente)
alter table public.trabajos  alter column cliente_id drop not null;
alter table public.pagos     alter column cliente_id drop not null;
alter table public.facturas  alter column cliente_id drop not null;

alter table public.trabajos
  drop constraint if exists trabajos_cliente_o_empresa_check;

alter table public.trabajos
  add constraint trabajos_cliente_o_empresa_check
  check (cliente_id is not null or empresa_cliente_id is not null);