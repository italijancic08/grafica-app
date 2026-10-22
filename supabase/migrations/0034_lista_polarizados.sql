CREATE TABLE IF NOT EXISTS public.lista_polarizados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  vehiculo text NOT NULL,
  categoria text,
  efectivo numeric(12,2) NOT NULL DEFAULT 0 CHECK (efectivo >= 0),
  recargo_tarjeta numeric(5,4) NOT NULL DEFAULT 0.6
    CHECK (recargo_tarjeta >= 0 AND recargo_tarjeta <= 5),
  creado_en timestamptz NOT NULL DEFAULT now(),
  modificado_en timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lista_polarizados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados leen polarizados"
ON public.lista_polarizados
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Administradores crean polarizados"
ON public.lista_polarizados
FOR INSERT TO authenticated
WITH CHECK (public.es_administrador());

CREATE POLICY "Administradores actualizan polarizados"
ON public.lista_polarizados
FOR UPDATE TO authenticated
USING (public.es_administrador())
WITH CHECK (public.es_administrador());

CREATE POLICY "Administradores eliminan polarizados"
ON public.lista_polarizados
FOR DELETE TO authenticated
USING (public.es_administrador());