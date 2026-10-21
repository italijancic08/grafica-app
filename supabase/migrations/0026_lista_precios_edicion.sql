-- Cambios persistentes sobre la lista original importada desde Excel.
create table if not exists public.lista_precios_cambios (
  id uuid primary key default gen_random_uuid(),
  indice_original integer unique check (indice_original is null or indice_original >= 0),
  eliminado boolean not null default false,
  rubro text not null,
  nombre text not null,
  medida text,
  material text,
  cantidad text,
  precio numeric(14,2) check (precio is null or precio >= 0),
  "precioTexto" text,
  minimo numeric(14,2) check (minimo is null or minimo >= 0),
  "minimoTexto" text,
  nota text,
  modificado_en timestamptz not null default now()
);

alter table public.lista_precios_cambios enable row level security;

create policy "Usuarios autenticados leen lista de precios"
on public.lista_precios_cambios for select to authenticated using (true);

create policy "Administradores crean precios"
on public.lista_precios_cambios for insert to authenticated
with check (public.es_administrador());

create policy "Administradores actualizan precios"
on public.lista_precios_cambios for update to authenticated
using (public.es_administrador()) with check (public.es_administrador());

create policy "Administradores eliminan precios"
on public.lista_precios_cambios for delete to authenticated
using (public.es_administrador());
