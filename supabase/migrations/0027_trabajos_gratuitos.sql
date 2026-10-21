
-- Autorizar trabajos gratuitos por cliente o empresa.

ALTER TABLE public.clientes
ADD COLUMN IF NOT EXISTS permite_trabajos_gratis boolean
NOT NULL DEFAULT false;

ALTER TABLE public.empresas_clientes
ADD COLUMN IF NOT EXISTS permite_trabajos_gratis boolean
NOT NULL DEFAULT false;

-- Impide que usuarios comunes cambien esta autorización
-- incluso mediante llamadas directas a Supabase.
CREATE OR REPLACE FUNCTION public.proteger_permiso_gratuito()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.permite_trabajos_gratis IS DISTINCT FROM
     OLD.permite_trabajos_gratis
     AND NOT public.es_administrador() THEN
    RAISE EXCEPTION
      'Solo un administrador puede modificar esta autorización.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS proteger_gratis_cliente ON public.clientes;

CREATE TRIGGER proteger_gratis_cliente
BEFORE UPDATE ON public.clientes
FOR EACH ROW
EXECUTE FUNCTION public.proteger_permiso_gratuito();

DROP TRIGGER IF EXISTS proteger_gratis_empresa
ON public.empresas_clientes;

CREATE TRIGGER proteger_gratis_empresa
BEFORE UPDATE ON public.empresas_clientes
FOR EACH ROW
EXECUTE FUNCTION public.proteger_permiso_gratuito();

-- Comprueba si el destinatario del trabajo tiene autorización.
CREATE OR REPLACE FUNCTION public.cliente_puede_recibir_gratis(
  p_cliente_id uuid,
  p_empresa_id uuid
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    EXISTS (
      SELECT 1 FROM public.clientes
      WHERE id = p_cliente_id
      AND permite_trabajos_gratis = true
    )
    OR (
      p_empresa_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM public.empresas_clientes
        WHERE id = p_empresa_id
        AND permite_trabajos_gratis = true
      )
    );
$$;

-- Validación adicional a nivel de base de datos.
-- Un trabajo aceptado con precio cero debe estar autorizado.
CREATE OR REPLACE FUNCTION public.validar_precio_gratuito()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.precio_final = 0
     AND NEW.estado_operativo NOT IN (
       'PRESUPUESTO', 'RECHAZADO', 'CANCELADO'
     )
     AND (
       TG_OP = 'INSERT'
       OR OLD.precio_final IS DISTINCT FROM NEW.precio_final
       OR OLD.estado_operativo IS DISTINCT FROM NEW.estado_operativo
       OR OLD.cliente_id IS DISTINCT FROM NEW.cliente_id
       OR OLD.empresa_cliente_id IS DISTINCT FROM NEW.empresa_cliente_id
     )
     AND NOT public.cliente_puede_recibir_gratis(
       NEW.cliente_id, NEW.empresa_cliente_id
     ) THEN
    RAISE EXCEPTION
      'El cliente o empresa no tiene autorización para trabajos gratuitos.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validar_gratis_trabajo ON public.trabajos;

CREATE TRIGGER validar_gratis_trabajo
BEFORE INSERT OR UPDATE ON public.trabajos
FOR EACH ROW
EXECUTE FUNCTION public.validar_precio_gratuito();

-- Precio cero, sin pagos, equivale a trabajo pagado
-- a efectos de no generar deuda.
CREATE OR REPLACE VIEW public.trabajos_con_saldo AS
SELECT
  t.*,
  COALESCE(p.total_pagado, 0) AS total_pagado,
  t.precio_final - COALESCE(p.total_pagado, 0) AS saldo,
  CASE
    WHEN t.precio_final = 0
         AND t.estado_operativo NOT IN ('PRESUPUESTO', 'RECHAZADO')
      THEN 'PAGADO'
    WHEN COALESCE(p.total_pagado, 0) = 0
      THEN 'SIN_PAGAR'
    WHEN COALESCE(p.total_pagado, 0) >= t.precio_final
      THEN 'PAGADO'
    ELSE 'PAGO_PARCIAL'
  END AS estado_financiero
FROM public.trabajos t
LEFT JOIN (
  SELECT trabajo_id, SUM(importe) AS total_pagado
  FROM public.pagos
  GROUP BY trabajo_id
) p ON p.trabajo_id = t.id;

GRANT SELECT ON public.trabajos_con_saldo TO authenticated;
