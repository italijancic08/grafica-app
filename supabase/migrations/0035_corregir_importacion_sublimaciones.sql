-- Ajustes a registros importados, únicamente si conservan los valores erróneos.
UPDATE public.lista_sublimaciones SET articulo = 'buzo algodon', tela = 'tela sublimable', modificado_en = now()
WHERE articulo = 'buzo algodon tela sublimable' AND tela IS NULL;
UPDATE public.lista_sublimaciones SET tela = 'VINILO', material = 'DORADO/CROMADO', modificado_en = now()
WHERE articulo = 'VINILO METALICO' AND tela = 'VINILO DORADO/CROMADO' AND material IS NULL;
