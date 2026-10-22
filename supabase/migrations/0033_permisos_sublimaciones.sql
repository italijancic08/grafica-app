
DROP POLICY IF EXISTS "Administradores crean sublimaciones"
ON public.lista_sublimaciones;

DROP POLICY IF EXISTS "Administradores actualizan sublimaciones"
ON public.lista_sublimaciones;

DROP POLICY IF EXISTS "Administradores eliminan sublimaciones"
ON public.lista_sublimaciones;

CREATE POLICY "Usuarios autenticados crean sublimaciones"
ON public.lista_sublimaciones
FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados actualizan sublimaciones"
ON public.lista_sublimaciones
FOR UPDATE TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados eliminan sublimaciones"
ON public.lista_sublimaciones
FOR DELETE TO authenticated
USING (auth.uid() IS NOT NULL);
