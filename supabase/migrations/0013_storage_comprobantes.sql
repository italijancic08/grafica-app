-- ============================================================
-- MIGRACIÓN 0013 — Storage: bucket de comprobantes (PDF)
-- ============================================================
-- Bucket PRIVADO (los recibos tienen datos del cliente y montos,
-- no deben quedar accesibles con una URL pública). El acceso se
-- hace siempre generando una signed URL de corta duración desde
-- el servidor (ver lib/services/facturas.ts).
-- ============================================================

insert into storage.buckets (id, name, public)
values ('comprobantes', 'comprobantes', false)
on conflict (id) do nothing;

create policy "usuarios autenticados pueden subir comprobantes"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'comprobantes');

create policy "usuarios autenticados pueden ver comprobantes"
  on storage.objects for select to authenticated
  using (bucket_id = 'comprobantes');

create policy "usuarios autenticados pueden actualizar comprobantes"
  on storage.objects for update to authenticated
  using (bucket_id = 'comprobantes');

-- ============================================================
-- FIN DE LA MIGRACIÓN 0013
-- ============================================================