-- ============================================================
-- MIGRACIÓN 0010 — Función de cierre de caja mensual
-- ============================================================
-- Cierra un mes de forma atómica: calcula los totales de
-- ingresos/egresos (todas las formas) y de caja física (solo
-- efectivo), guarda el cierre en "caja_mensual" (marcándolo
-- como cerrado), y migra automáticamente el saldo de caja
-- física como un ingreso (o egreso, si diera negativo) al
-- primer día del mes siguiente, con rubro "caja".
--
-- Se usa "security definer" porque la tabla "caja_mensual" tiene
-- bloqueada la escritura directa de usuarios autenticados (ver
-- migración 0001) — solo esta función puede escribir en ella.
-- ============================================================

create or replace function cerrar_caja_mensual(p_mes int, p_anio int)
returns void as $$
declare
  v_inicio date := make_date(p_anio, p_mes, 1);
  v_fin date := (v_inicio + interval '1 month')::date;
  v_total_ingresos numeric;
  v_total_egresos numeric;
  v_saldo numeric;
  v_caja_fisica numeric;
  v_mes_siguiente int;
  v_anio_siguiente int;
  v_ya_cerrado boolean;
begin
  -- Evitar cerrar un mes que ya está cerrado
  select cerrado into v_ya_cerrado
  from caja_mensual where mes = p_mes and anio = p_anio;

  if v_ya_cerrado then
    raise exception 'Este mes ya fue cerrado anteriormente';
  end if;

  -- Totales generales del mes (todas las formas de pago)
  select
    coalesce(sum(monto) filter (where tipo = 'ingreso'), 0),
    coalesce(sum(monto) filter (where tipo = 'egreso'), 0)
  into v_total_ingresos, v_total_egresos
  from caja_movimientos
  where fecha >= v_inicio and fecha < v_fin;

  v_saldo := v_total_ingresos - v_total_egresos;

  -- Caja física del mes (solo efectivo) — esto es lo que se traslada
  select
    coalesce(sum(monto) filter (where tipo = 'ingreso' and medio_pago = 'efectivo'), 0)
    - coalesce(sum(monto) filter (where tipo = 'egreso' and medio_pago = 'efectivo'), 0)
  into v_caja_fisica
  from caja_movimientos
  where fecha >= v_inicio and fecha < v_fin;

  -- Guardar el cierre (crea la fila si no existía, o la actualiza)
  insert into caja_mensual (mes, anio, total_ingresos, total_egresos, saldo, cerrado, fecha_cierre)
  values (p_mes, p_anio, v_total_ingresos, v_total_egresos, v_saldo, true, now())
  on conflict (mes, anio) do update set
    total_ingresos = excluded.total_ingresos,
    total_egresos = excluded.total_egresos,
    saldo = excluded.saldo,
    cerrado = true,
    fecha_cierre = now();

  -- Calcular el mes siguiente
  if p_mes = 12 then
    v_mes_siguiente := 1;
    v_anio_siguiente := p_anio + 1;
  else
    v_mes_siguiente := p_mes + 1;
    v_anio_siguiente := p_anio;
  end if;

  -- Migrar la caja física como ingreso al primer día del mes siguiente,
  -- solo si hay algo que migrar (positivo o negativo, pero no cero)
  if v_caja_fisica <> 0 then
    insert into caja_movimientos (tipo, monto, concepto, medio_pago, rubro, fecha)
    values (
      case when v_caja_fisica > 0 then 'ingreso' else 'egreso' end,
      abs(v_caja_fisica),
      'Saldo de caja física migrado de ' || to_char(v_inicio, 'MM/YYYY'),
      'efectivo',
      'caja',
      make_date(v_anio_siguiente, v_mes_siguiente, 1)
    );
  end if;
end;
$$ language plpgsql security definer;

-- ============================================================
-- FIN DE LA MIGRACIÓN 0010
-- ============================================================
