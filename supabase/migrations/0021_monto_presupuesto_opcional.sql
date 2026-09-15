-- El precio de un presupuesto puede quedar vacío mientras
-- el presupuesto todavía no haya sido aprobado.

alter table presupuestos
  alter column monto drop not null;