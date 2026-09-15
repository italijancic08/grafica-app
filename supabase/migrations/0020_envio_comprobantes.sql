-- ============================================================
-- MIGRACIÓN 0020 — Envío automático de comprobantes
-- ============================================================

create table factura_envios (
  id uuid primary key default gen_random_uuid(),

  factura_id uuid not null
    references facturas(id)
    on delete cascade,

  canal text not null
    check (canal in ('WHATSAPP', 'EMAIL')),

  estado text not null
    check (estado in ('PENDIENTE', 'ENVIADO', 'FALLIDO')),

  destinatario text,

  proveedor_id text,

  codigo_error text,

  detalle_error text,

  intentos integer not null default 1
    check (intentos >= 1),

  creado_en timestamptz not null default now(),

  enviado_en timestamptz,

  actualizado_en timestamptz not null default now()
);

create index idx_factura_envios_factura
  on factura_envios(factura_id);

create index idx_factura_envios_estado
  on factura_envios(estado);

create index idx_factura_envios_canal
  on factura_envios(canal);

create index idx_factura_envios_creado
  on factura_envios(creado_en desc);


-- ============================================================
-- Estado resumido del envío dentro de la factura
-- ============================================================

alter table facturas
  add column if not exists estado_envio text
    not null default 'PENDIENTE'
    check (
      estado_envio in (
        'PENDIENTE',
        'ENVIADO_WHATSAPP',
        'ENVIADO_EMAIL',
        'NO_ENVIADO'
      )
    );

alter table facturas
  add column if not exists canal_envio text
    check (
      canal_envio is null
      or canal_envio in ('WHATSAPP', 'EMAIL')
    );

alter table facturas
  add column if not exists error_envio text;

alter table facturas
  add column if not exists enviado_en timestamptz;


-- ============================================================
-- RLS
-- ============================================================

alter table factura_envios enable row level security;

create policy "usuarios autenticados pueden ver envios de facturas"
  on factura_envios
  for select
  to authenticated
  using (true);

-- Los INSERT/UPDATE se realizan desde Server Actions
-- utilizando SUPABASE_SECRET_KEY.
--
-- No damos permisos de escritura al navegador.