-- ============================================================
-- MIGRACIÓN 0012 — Numeración automática de comprobantes
-- ============================================================
-- Agrega un contador anual (mismo patrón que contador_trabajos)
-- y un trigger que le asigna número correlativo tipo
-- REC-2026-000001 a cada fila que se inserta en "facturas",
-- salvo que ya venga con un número asignado explícitamente.
-- ============================================================

create table contador_comprobantes (
  anio int primary key,
  ultimo_numero int not null default 0
);

alter table contador_comprobantes enable row level security;

create policy "bloquear acceso directo al contador de comprobantes"
  on contador_comprobantes for all to authenticated using (false);

create or replace function generar_numero_comprobante()
returns trigger as $$
declare
  anio_actual int := extract(year from now())::int;
  siguiente int;
begin
  if new.numero is not null then
    return new;
  end if;

  insert into contador_comprobantes (anio, ultimo_numero)
  values (anio_actual, 1)
  on conflict (anio) do update set ultimo_numero = contador_comprobantes.ultimo_numero + 1
  returning ultimo_numero into siguiente;

  new.numero := 'REC-' || anio_actual || '-' || lpad(siguiente::text, 6, '0');
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_generar_numero_comprobante
before insert on facturas
for each row
execute function generar_numero_comprobante();

-- ============================================================
-- FIN DE LA MIGRACIÓN 0012
-- ============================================================