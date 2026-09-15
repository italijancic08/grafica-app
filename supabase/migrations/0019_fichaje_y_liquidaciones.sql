-- ============================================================
-- MIGRACIÓN 0019 — Fichaje y liquidaciones semanales
-- ============================================================

-- ============================================================
-- 1. FICHAJES
-- ============================================================

create table fichajes (
  id uuid primary key default gen_random_uuid(),

  usuario_id uuid not null references usuarios(id) on delete cascade,

  entrada timestamptz not null,
  salida timestamptz,

  horas_trabajadas numeric(10,2),

  creado_en timestamptz not null default now(),
  modificado_en timestamptz not null default now(),

  constraint fichaje_salida_mayor_entrada
    check (salida is null or salida >= entrada),

  constraint fichaje_horas_no_negativas
    check (horas_trabajadas is null or horas_trabajadas >= 0)
);

create index idx_fichajes_usuario on fichajes(usuario_id);
create index idx_fichajes_entrada on fichajes(entrada);
create index idx_fichajes_salida on fichajes(salida);

-- ============================================================
-- 2. EVITAR DOS FICHAJES ABIERTOS PARA EL MISMO EMPLEADO
-- ============================================================

create unique index idx_fichaje_unico_abierto
on fichajes(usuario_id)
where salida is null;


-- ============================================================
-- 3. LIQUIDACIONES SEMANALES
-- ============================================================

create table liquidaciones_semanales (
  id uuid primary key default gen_random_uuid(),

  semana_inicio date not null,
  semana_fin date not null,

  generado_en timestamptz not null default now(),

  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'liquidada')),

  valor_hora numeric(12,2) not null default 0,

  total_horas numeric(12,2) not null default 0,
  total_pagar numeric(12,2) not null default 0,

  archivo_path text,

  creado_por uuid references usuarios(id),

  creado_en_registro timestamptz not null default now(),

  constraint liquidacion_rango_valido
    check (semana_fin >= semana_inicio),

  unique (semana_inicio, semana_fin)
);

create index idx_liquidaciones_semana
on liquidaciones_semanales(semana_inicio, semana_fin);

create index idx_liquidaciones_estado
on liquidaciones_semanales(estado);


-- ============================================================
-- 4. DETALLE DE CADA EMPLEADO EN LA LIQUIDACIÓN
-- ============================================================

create table liquidaciones_empleados (
  id uuid primary key default gen_random_uuid(),

  liquidacion_id uuid not null
    references liquidaciones_semanales(id)
    on delete cascade,

  usuario_id uuid not null
    references usuarios(id),

  horas numeric(12,2) not null default 0,

  valor_hora numeric(12,2) not null default 0,

  importe numeric(12,2) not null default 0,

  unique (liquidacion_id, usuario_id)
);

create index idx_liquidaciones_empleados_liquidacion
on liquidaciones_empleados(liquidacion_id);

create index idx_liquidaciones_empleados_usuario
on liquidaciones_empleados(usuario_id);


-- ============================================================
-- 5. BUCKET PARA LOS EXCEL DE LIQUIDACIONES
-- ============================================================

insert into storage.buckets (id, name, public)
values ('documentos', 'documentos', false)
on conflict (id) do nothing;


-- ============================================================
-- 6. POLÍTICAS STORAGE
-- ============================================================

create policy "usuarios autenticados pueden subir documentos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'documentos'
);

create policy "usuarios autenticados pueden ver documentos"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'documentos'
);

create policy "usuarios autenticados pueden actualizar documentos"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'documentos'
);

create policy "usuarios autenticados pueden eliminar documentos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'documentos'
);


-- ============================================================
-- 7. RLS
-- ============================================================

alter table fichajes enable row level security;
alter table liquidaciones_semanales enable row level security;
alter table liquidaciones_empleados enable row level security;


-- ============================================================
-- FICHAJES
-- ============================================================

create policy "usuarios autenticados pueden ver fichajes"
on fichajes
for select
to authenticated
using (true);

create policy "usuarios autenticados pueden registrar fichajes"
on fichajes
for insert
to authenticated
with check (true);

create policy "usuarios autenticados pueden actualizar fichajes"
on fichajes
for update
to authenticated
using (true)
with check (true);


-- ============================================================
-- LIQUIDACIONES
-- ============================================================

create policy "usuarios autenticados pueden ver liquidaciones"
on liquidaciones_semanales
for select
to authenticated
using (true);

create policy "usuarios autenticados pueden crear liquidaciones"
on liquidaciones_semanales
for insert
to authenticated
with check (true);

create policy "usuarios autenticados pueden actualizar liquidaciones"
on liquidaciones_semanales
for update
to authenticated
using (true)
with check (true);


-- ============================================================
-- DETALLE LIQUIDACIONES
-- ============================================================

create policy "usuarios autenticados pueden ver detalle liquidaciones"
on liquidaciones_empleados
for select
to authenticated
using (true);

create policy "usuarios autenticados pueden crear detalle liquidaciones"
on liquidaciones_empleados
for insert
to authenticated
with check (true);

create policy "usuarios autenticados pueden actualizar detalle liquidaciones"
on liquidaciones_empleados
for update
to authenticated
using (true)
with check (true);


-- ============================================================
-- CONFIGURACIÓN: VALOR HORA
-- ============================================================

insert into configuracion (clave, valor)
values ('valor_hora_trabajador', '0'::jsonb)
on conflict (clave) do nothing;


-- ============================================================
-- FIN
-- ============================================================