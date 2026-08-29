-- ============================================================
-- MIGRACIÓN 0004 — Fix: security definer en generar_numero_trabajo
-- ============================================================
-- Problema: la función generar_numero_trabajo() necesita insertar
-- en "contador_trabajos" desde un trigger, pero esa tabla tiene
-- una política que bloquea cualquier acceso directo de usuarios
-- autenticados. Como la función corría con los permisos del
-- usuario que dispara el insert (no con permisos elevados), la
-- política también la bloqueaba a ella, arrojando:
-- "new row violates row-level security policy for table
-- contador_trabajos".
--
-- Solución: marcar la función como "security definer", para que
-- se ejecute con los permisos de quien la creó, sin pasar por
-- las políticas RLS del usuario que la dispara. Es seguro porque
-- la función solo genera un número correlativo, no expone ni
-- modifica ningún otro dato.
-- ============================================================

create or replace function generar_numero_trabajo()
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
$$ language plpgsql security definer;

-- ============================================================
-- FIN DE LA MIGRACIÓN 0004
-- ============================================================
