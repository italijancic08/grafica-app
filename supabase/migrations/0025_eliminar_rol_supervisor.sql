-- ============================================================
-- MIGRACIÓN 0025 — Eliminar el rol "supervisor"
-- ============================================================
-- Los usuarios que hoy son supervisores pasan a "empleado".
-- Luego se reemplaza la restricción para permitir solo
-- 'administrador' y 'empleado'.
-- ============================================================

update usuarios
set rol = 'empleado'
where rol = 'supervisor';

alter table usuarios
  drop constraint if exists usuarios_rol_check;

alter table usuarios
  add constraint usuarios_rol_check
  check (rol in ('administrador', 'empleado'));

-- ============================================================
-- FIN DE LA MIGRACIÓN 0025
-- ============================================================