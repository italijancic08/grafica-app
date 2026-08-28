-- ============================================================
-- MIGRACIÓN 0001 — Esquema inicial
-- Sistema de gestión para gráfica
-- ============================================================
-- Este archivo documenta, en orden, todo el SQL ejecutado
-- durante la Fase 4 en el SQL Editor de Supabase.
-- ============================================================


-- ============================================================
-- 1. EMPRESAS, USUARIOS, CLIENTES
-- ============================================================

-- Configuración general de la empresa
create table empresas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  logo_url text,
  cuit text,
  direccion text,
  telefono text,
  email text,
  creado_en timestamptz not null default now()
);

-- Usuarios del sistema (vinculados a Supabase Auth)
create table usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  email text not null,
  rol text not null default 'empleado' check (rol in ('administrador', 'supervisor', 'empleado')),
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

-- Clientes
create table clientes (
  id uuid primary key default gen_random_uuid(),
  nombre_razon_social text not null,
  telefono text,
  whatsapp text,
  email text,
  cuit_cuil text,
  domicilio text,
  localidad text,
  provincia text,
  notas text,
  creado_en timestamptz not null default now(),
  modificado_en timestamptz not null default now()
);

-- RLS: empresas, usuarios, clientes
alter table empresas enable row level security;
alter table usuarios enable row level security;
alter table clientes enable row level security;

create policy "usuarios autenticados pueden ver empresas"
  on empresas for select to authenticated using (true);
create policy "usuarios autenticados pueden editar empresas"
  on empresas for all to authenticated using (true) with check (true);

create policy "usuarios pueden ver su propio perfil"
  on usuarios for select to authenticated using (auth.uid() = id);

create policy "usuarios autenticados pueden ver clientes"
  on clientes for select to authenticated using (true);
create policy "usuarios autenticados pueden gestionar clientes"
  on clientes for all to authenticated using (true) with check (true);


-- ============================================================
-- 2. TRABAJOS (con numeración automática)
-- ============================================================

-- Contador de numeración, uno por año
create table contador_trabajos (
  anio int primary key,
  ultimo_numero int not null default 0
);

-- Tabla principal de trabajos
create table trabajos (
  id uuid primary key default gen_random_uuid(),
  numero text unique,
  cliente_id uuid not null references clientes(id),
  descripcion text not null,
  fecha_entrada date not null default current_date,
  fecha_maxima date,
  fecha_finalizacion date,
  fecha_retiro date,
  precio_final numeric(12,2) not null default 0 check (precio_final >= 0),
  sena numeric(12,2) not null default 0 check (sena >= 0),
  estado_operativo text not null default 'INGRESADO'
    check (estado_operativo in (
      'INGRESADO','EN_PRODUCCION','TERCERIZADO',
      'TERMINADO','PARA_RETIRAR','RETIRADO','CANCELADO'
    )),
  usuario_carga_id uuid references usuarios(id),
  usuario_responsable_id uuid references usuarios(id),
  creado_en timestamptz not null default now(),
  modificado_en timestamptz not null default now()
);

create index idx_trabajos_cliente on trabajos(cliente_id);
create index idx_trabajos_estado on trabajos(estado_operativo);

-- Función que genera el número automáticamente
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
$$ language plpgsql;

create trigger trg_generar_numero_trabajo
before insert on trabajos
for each row
when (new.numero is null)
execute function generar_numero_trabajo();

-- RLS: trabajos, contador_trabajos
alter table trabajos enable row level security;
alter table contador_trabajos enable row level security;

create policy "usuarios autenticados pueden ver trabajos"
  on trabajos for select to authenticated using (true);
create policy "usuarios autenticados pueden gestionar trabajos"
  on trabajos for all to authenticated using (true) with check (true);

create policy "bloquear acceso directo al contador"
  on contador_trabajos for all to authenticated using (false);


-- ============================================================
-- 3. PAGOS + CÁLCULO DE SALDO / ESTADO FINANCIERO
-- ============================================================

-- Registro de pagos
create table pagos (
  id uuid primary key default gen_random_uuid(),
  trabajo_id uuid not null references trabajos(id),
  cliente_id uuid not null references clientes(id),
  fecha date not null default current_date,
  hora time not null default current_time,
  importe numeric(12,2) not null check (importe > 0),
  medio_pago text not null check (medio_pago in (
    'efectivo','transferencia','mercado_pago','tarjeta','otro'
  )),
  usuario_id uuid references usuarios(id),
  observacion text,
  creado_en timestamptz not null default now()
);

create index idx_pagos_trabajo on pagos(trabajo_id);
create index idx_pagos_cliente on pagos(cliente_id);

-- Función central: única fuente de verdad para saldo y estado financiero
create or replace function estado_financiero_trabajo(p_trabajo_id uuid)
returns table (
  total_pagado numeric,
  saldo numeric,
  estado_financiero text
) as $$
declare
  v_precio numeric;
  v_total_pagado numeric;
begin
  select precio_final into v_precio from trabajos where id = p_trabajo_id;
  select coalesce(sum(importe), 0) into v_total_pagado from pagos where trabajo_id = p_trabajo_id;

  return query
  select
    v_total_pagado,
    v_precio - v_total_pagado,
    case
      when v_total_pagado = 0 then 'SIN_PAGAR'
      when v_total_pagado >= v_precio then 'PAGADO'
      when v_total_pagado > 0 and v_total_pagado < v_precio then 'PAGO_PARCIAL'
      else 'SIN_PAGAR'
    end;
end;
$$ language plpgsql stable;

-- Vista: trabajos con su saldo ya calculado
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

-- RLS: pagos
alter table pagos enable row level security;

create policy "usuarios autenticados pueden ver pagos"
  on pagos for select to authenticated using (true);
create policy "usuarios autenticados pueden registrar pagos"
  on pagos for all to authenticated using (true) with check (true);


-- ============================================================
-- 4. STOCK Y MOVIMIENTOS DE STOCK
-- ============================================================

-- Materiales / insumos
create table materiales (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  unidad_medida text not null,
  cantidad_actual numeric(12,2) not null default 0 check (cantidad_actual >= 0),
  stock_minimo numeric(12,2) not null default 0 check (stock_minimo >= 0),
  creado_en timestamptz not null default now()
);

-- Movimientos de stock (histórico)
create table movimientos_stock (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references materiales(id),
  trabajo_id uuid references trabajos(id),
  tipo text not null check (tipo in ('ingreso', 'egreso')),
  cantidad numeric(12,2) not null check (cantidad > 0),
  fecha timestamptz not null default now(),
  usuario_id uuid references usuarios(id),
  observacion text
);

create index idx_movimientos_material on movimientos_stock(material_id);
create index idx_movimientos_trabajo on movimientos_stock(trabajo_id);

-- Función central: única función que actualiza cantidad_actual
create or replace function registrar_movimiento_stock()
returns trigger as $$
begin
  if new.tipo = 'ingreso' then
    update materiales
    set cantidad_actual = cantidad_actual + new.cantidad
    where id = new.material_id;
  elsif new.tipo = 'egreso' then
    update materiales
    set cantidad_actual = cantidad_actual - new.cantidad
    where id = new.material_id;

    if (select cantidad_actual from materiales where id = new.material_id) < 0 then
      raise exception 'Stock insuficiente para este movimiento';
    end if;
  end if;

  return new;
end;
$$ language plpgsql;

create trigger trg_registrar_movimiento_stock
after insert on movimientos_stock
for each row
execute function registrar_movimiento_stock();

-- Vista: materiales con stock bajo
create view materiales_stock_bajo as
select *
from materiales
where cantidad_actual <= stock_minimo;

-- RLS: materiales, movimientos_stock
alter table materiales enable row level security;
alter table movimientos_stock enable row level security;

create policy "usuarios autenticados pueden ver materiales"
  on materiales for select to authenticated using (true);
create policy "usuarios autenticados pueden gestionar materiales"
  on materiales for all to authenticated using (true) with check (true);

create policy "usuarios autenticados pueden ver movimientos"
  on movimientos_stock for select to authenticated using (true);
create policy "usuarios autenticados pueden registrar movimientos"
  on movimientos_stock for all to authenticated using (true) with check (true);


-- ============================================================
-- 5. TERCERIZACIONES
-- ============================================================

create table tercerizaciones (
  id uuid primary key default gen_random_uuid(),
  trabajo_id uuid not null references trabajos(id),
  proveedor text not null,
  fecha_envio date not null default current_date,
  fecha_estimada_vuelta date,
  fecha_real_vuelta date,
  costo numeric(12,2) check (costo >= 0),
  estado text not null default 'ENVIADO'
    check (estado in ('ENVIADO', 'EN_PROVEEDOR', 'VUELTO', 'DEMORADO')),
  creado_en timestamptz not null default now()
);

create index idx_tercerizaciones_trabajo on tercerizaciones(trabajo_id);

-- Vista: tercerizaciones demoradas
create view tercerizaciones_demoradas as
select *
from tercerizaciones
where estado in ('ENVIADO', 'EN_PROVEEDOR')
  and fecha_estimada_vuelta is not null
  and fecha_estimada_vuelta < current_date;

-- RLS: tercerizaciones
alter table tercerizaciones enable row level security;

create policy "usuarios autenticados pueden ver tercerizaciones"
  on tercerizaciones for select to authenticated using (true);
create policy "usuarios autenticados pueden gestionar tercerizaciones"
  on tercerizaciones for all to authenticated using (true) with check (true);


-- ============================================================
-- 6. CAJA Y CAJA MENSUAL
-- ============================================================

create table caja_movimientos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('ingreso', 'egreso')),
  monto numeric(12,2) not null check (monto > 0),
  concepto text not null,
  fecha timestamptz not null default now(),
  trabajo_id uuid references trabajos(id),
  usuario_id uuid references usuarios(id)
);

create index idx_caja_fecha on caja_movimientos(fecha);
create index idx_caja_trabajo on caja_movimientos(trabajo_id);

create table caja_mensual (
  id uuid primary key default gen_random_uuid(),
  mes int not null check (mes between 1 and 12),
  anio int not null,
  total_ingresos numeric(12,2) not null default 0,
  total_egresos numeric(12,2) not null default 0,
  saldo numeric(12,2) not null default 0,
  cerrado boolean not null default false,
  fecha_cierre timestamptz,
  unique (mes, anio)
);

-- Función: cada pago genera automáticamente un ingreso en caja
create or replace function generar_ingreso_caja_desde_pago()
returns trigger as $$
begin
  insert into caja_movimientos (tipo, monto, concepto, trabajo_id, usuario_id)
  values (
    'ingreso',
    new.importe,
    'Pago trabajo ' || (select numero from trabajos where id = new.trabajo_id),
    new.trabajo_id,
    new.usuario_id
  );
  return new;
end;
$$ language plpgsql;

create trigger trg_ingreso_caja_desde_pago
after insert on pagos
for each row
execute function generar_ingreso_caja_desde_pago();

-- RLS: caja_movimientos, caja_mensual
alter table caja_movimientos enable row level security;
alter table caja_mensual enable row level security;

create policy "usuarios autenticados pueden ver caja"
  on caja_movimientos for select to authenticated using (true);
create policy "usuarios autenticados pueden registrar en caja"
  on caja_movimientos for all to authenticated using (true) with check (true);

create policy "usuarios autenticados pueden ver caja mensual"
  on caja_mensual for select to authenticated using (true);
create policy "bloquear escritura directa en caja mensual"
  on caja_mensual for insert to authenticated with check (false);


-- ============================================================
-- 7. PRESUPUESTOS, FACTURAS, ALERTAS, AUDITORÍA, CONFIGURACIÓN
-- ============================================================

create table presupuestos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id),
  descripcion text not null,
  monto numeric(12,2) not null check (monto >= 0),
  fecha date not null default current_date,
  estado text not null default 'PENDIENTE'
    check (estado in ('PENDIENTE', 'APROBADO', 'RECHAZADO')),
  trabajo_id uuid references trabajos(id),
  creado_en timestamptz not null default now()
);

create index idx_presupuestos_cliente on presupuestos(cliente_id);

create table facturas (
  id uuid primary key default gen_random_uuid(),
  trabajo_id uuid not null references trabajos(id),
  cliente_id uuid not null references clientes(id),
  tipo_comprobante text not null default 'RECIBO'
    check (tipo_comprobante in ('RECIBO', 'FACTURA_A', 'FACTURA_B', 'FACTURA_C')),
  numero text,
  fecha date not null default current_date,
  monto numeric(12,2) not null check (monto >= 0),
  archivo_pdf_url text,
  creado_en timestamptz not null default now()
);

create index idx_facturas_trabajo on facturas(trabajo_id);

create table alertas (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in (
    'STOCK_BAJO', 'TRABAJO_DEMORADO', 'TERCERIZACION_DEMORADA'
  )),
  referencia_id uuid not null,
  mensaje text not null,
  creado_en timestamptz not null default now(),
  resuelta boolean not null default false
);

create index idx_alertas_resuelta on alertas(resuelta);

create table auditoria (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references usuarios(id),
  accion text not null,
  entidad text not null,
  entidad_id uuid,
  detalle jsonb,
  fecha timestamptz not null default now()
);

create index idx_auditoria_entidad on auditoria(entidad, entidad_id);
create index idx_auditoria_fecha on auditoria(fecha);

create table configuracion (
  clave text primary key,
  valor jsonb not null
);

-- RLS: presupuestos, facturas, alertas, auditoria, configuracion
alter table presupuestos enable row level security;
alter table facturas enable row level security;
alter table alertas enable row level security;
alter table auditoria enable row level security;
alter table configuracion enable row level security;

create policy "usuarios autenticados pueden ver presupuestos"
  on presupuestos for select to authenticated using (true);
create policy "usuarios autenticados pueden gestionar presupuestos"
  on presupuestos for all to authenticated using (true) with check (true);

create policy "usuarios autenticados pueden ver facturas"
  on facturas for select to authenticated using (true);
create policy "usuarios autenticados pueden gestionar facturas"
  on facturas for all to authenticated using (true) with check (true);

create policy "usuarios autenticados pueden ver alertas"
  on alertas for select to authenticated using (true);
create policy "usuarios autenticados pueden actualizar alertas"
  on alertas for update to authenticated using (true) with check (true);

create policy "usuarios autenticados pueden ver auditoria"
  on auditoria for select to authenticated using (true);

create policy "usuarios autenticados pueden ver configuracion"
  on configuracion for select to authenticated using (true);

-- ============================================================
-- FIN DE LA MIGRACIÓN 0001
-- ============================================================
