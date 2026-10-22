-- Lista de sublimaciones: artículo, tela, material, temperatura, tiempo, presión y nota.
create table if not exists public.lista_sublimaciones (
  id uuid primary key default gen_random_uuid(),
  articulo text not null,
  tela text,
  material text,
  temperatura text,
  tiempo text,
  presion text,
  nota text,
  creado_en timestamptz not null default now(),
  modificado_en timestamptz not null default now()
);

alter table public.lista_sublimaciones enable row level security;

create policy "Usuarios autenticados leen sublimaciones"
on public.lista_sublimaciones for select to authenticated using (true);

create policy "Administradores crean sublimaciones"
on public.lista_sublimaciones for insert to authenticated
with check (public.es_administrador());

create policy "Administradores actualizan sublimaciones"
on public.lista_sublimaciones for update to authenticated
using (public.es_administrador()) with check (public.es_administrador());

create policy "Administradores eliminan sublimaciones"
on public.lista_sublimaciones for delete to authenticated
using (public.es_administrador());