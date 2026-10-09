
-- MIGRACIÓN 0023 — Turnos e instaladores

alter table public.trabajos
  add column if not exists requiere_turno
  boolean not null default false;

create table if not exists public.instaladores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null
    check (length(trim(nombre)) > 0),
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

create table if not exists public.turnos (
  id uuid primary key default gen_random_uuid(),

  trabajo_id uuid not null unique
    references public.trabajos(id) on delete cascade,

  fecha date,
  hora time,

  instalador_id uuid
    references public.instaladores(id)
    on delete set null,

  estado text not null default 'PENDIENTE'
    check (
      estado in (
        'PENDIENTE',
        'CONFIRMADO',
        'REALIZADO',
        'CANCELADO'
      )
    ),

  notas text,

  creado_en timestamptz not null default now(),
  modificado_en timestamptz not null default now()
);

create index if not exists idx_turnos_fecha_hora
  on public.turnos(fecha, hora);

create index if not exists idx_turnos_instalador
  on public.turnos(instalador_id);

alter table public.instaladores
  enable row level security;

alter table public.turnos
  enable row level security;

drop policy if exists
  "usuarios autenticados pueden gestionar instaladores"
  on public.instaladores;

create policy
  "usuarios autenticados pueden gestionar instaladores"
  on public.instaladores
  for all to authenticated
  using (true)
  with check (true);

drop policy if exists
  "usuarios autenticados pueden gestionar turnos"
  on public.turnos;

create policy
  "usuarios autenticados pueden gestionar turnos"
  on public.turnos
  for all to authenticated
  using (true)
  with check (true);

-- Crear turnos para trabajos que ya estén marcados
-- como trabajos con turno, si todavía no tienen uno.
insert into public.turnos (trabajo_id)
select id
from public.trabajos
where requiere_turno = true
on conflict (trabajo_id) do nothing;