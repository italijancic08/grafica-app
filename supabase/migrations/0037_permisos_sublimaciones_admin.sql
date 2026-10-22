-- Alinear las políticas de la BD con los botones exclusivos de administración.
DROP POLICY IF EXISTS "Usuarios autenticados crean sublimaciones" ON public.lista_sublimaciones;
DROP POLICY IF EXISTS "Usuarios autenticados actualizan sublimaciones" ON public.lista_sublimaciones;
DROP POLICY IF EXISTS "Usuarios autenticados eliminan sublimaciones" ON public.lista_sublimaciones;
DROP POLICY IF EXISTS "Administradores crean sublimaciones" ON public.lista_sublimaciones;
DROP POLICY IF EXISTS "Administradores actualizan sublimaciones" ON public.lista_sublimaciones;
DROP POLICY IF EXISTS "Administradores eliminan sublimaciones" ON public.lista_sublimaciones;
CREATE POLICY "Administradores crean sublimaciones" ON public.lista_sublimaciones FOR INSERT TO authenticated WITH CHECK (public.es_administrador());
CREATE POLICY "Administradores actualizan sublimaciones" ON public.lista_sublimaciones FOR UPDATE TO authenticated USING (public.es_administrador()) WITH CHECK (public.es_administrador());
CREATE POLICY "Administradores eliminan sublimaciones" ON public.lista_sublimaciones FOR DELETE TO authenticated USING (public.es_administrador());
