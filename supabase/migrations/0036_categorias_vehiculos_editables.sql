-- Categorías administrables, inicialmente idénticas a la guía estática.
CREATE TABLE IF NOT EXISTS public.categorias_vehiculos (
  numero integer PRIMARY KEY CHECK (numero > 0),
  nota text,
  fotos text[] NOT NULL DEFAULT '{}'::text[]
);
ALTER TABLE public.categorias_vehiculos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios autenticados leen categorias" ON public.categorias_vehiculos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Administradores crean categorias" ON public.categorias_vehiculos FOR INSERT TO authenticated WITH CHECK (public.es_administrador());
CREATE POLICY "Administradores actualizan categorias" ON public.categorias_vehiculos FOR UPDATE TO authenticated USING (public.es_administrador()) WITH CHECK (public.es_administrador());
CREATE POLICY "Administradores eliminan categorias" ON public.categorias_vehiculos FOR DELETE TO authenticated USING (public.es_administrador());
INSERT INTO public.categorias_vehiculos (numero, nota, fotos) VALUES
  (1, NULL, ARRAY['/categorias/categoria-01-1.jpg','/categorias/categoria-01-2.jpg','/categorias/categoria-01-3.jpg','/categorias/categoria-01-4.jpg','/categorias/categoria-01-5.jpg']),
  (2, 'Si tiene luneta entra en esta categoría', ARRAY['/categorias/categoria-02-1.jpg','/categorias/categoria-02-2.jpg','/categorias/categoria-02-3.jpg']),
  (3, NULL, ARRAY['/categorias/categoria-03-1.jpg','/categorias/categoria-03-2.jpg','/categorias/categoria-03-3.jpg','/categorias/categoria-03-4.jpg']),
  (4, NULL, ARRAY['/categorias/categoria-04-1.jpg','/categorias/categoria-04-2.jpg']),
  (5, NULL, ARRAY['/categorias/categoria-05-1.jpg','/categorias/categoria-05-2.jpg','/categorias/categoria-05-3.jpg']),
  (6, NULL, ARRAY['/categorias/categoria-06-1.jpg','/categorias/categoria-06-2.jpg']),
  (7, NULL, ARRAY['/categorias/categoria-07-1.jpg']),
  (8, NULL, ARRAY['/categorias/categoria-08-1.jpg']),
  (9, NULL, ARRAY['/categorias/categoria-09-1.jpg','/categorias/categoria-09-2.jpg','/categorias/categoria-09-3.jpg','/categorias/categoria-09-4.jpg']),
  (10, NULL, ARRAY['/categorias/categoria-10-1.jpg','/categorias/categoria-10-2.jpg','/categorias/categoria-10-3.jpg']),
  (11, NULL, ARRAY['/categorias/categoria-11-1.jpg'])
ON CONFLICT (numero) DO NOTHING;
