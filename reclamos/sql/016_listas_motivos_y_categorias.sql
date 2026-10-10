-- ════════════════════════════════════════════════════════════════
--  RECLAMOS — ajuste de listas (motivos y categorías)
--  · Categoría: se saca "Grupo electrógeno" (queda inactiva; los reclamos viejos no cambian).
--  · Motivo: "CAMBIOS TEMP./HORARIOS" se separa en "CAMBIO SETEO AIRE" y "CAMBIO DE HORARIOS",
--    y se suman motivos nuevos. Los reclamos que ya tenían el motivo viejo lo conservan.
--  Correr una sola vez en Supabase > SQL Editor.
-- ════════════════════════════════════════════════════════════════

update reclamos_categorias set activo = false where nombre = 'Grupo electrógeno';

update reclamos_opciones set activo = false where lista = 'motivo' and valor = 'CAMBIOS TEMP./HORARIOS';

insert into reclamos_opciones (lista, valor, orden, activo) values
  ('motivo', 'RECLAMO', 1, true),
  ('motivo', 'SOLICITUD', 2, true),
  ('motivo', 'CAMBIO SETEO AIRE', 3, true),
  ('motivo', 'CAMBIO DE HORARIOS', 4, true),
  ('motivo', 'FALLAS DE CONTROLADOR DE AIRE', 5, true),
  ('motivo', 'FALLAS DE CONTROLADOR DE ILUMINACIÓN', 6, true),
  ('motivo', 'FALLAS FÍSICAS DEL EQUIPO', 7, true),
  ('motivo', 'MEDICIÓN DE LECTURA', 8, true),
  ('motivo', 'VINCULACIÓN DE AIRE', 9, true),
  ('motivo', 'TIENDAS FUERA DE LÍNEA', 10, true),
  ('motivo', 'PLANES DE ACCIÓN', 11, true),
  ('motivo', 'FACTURAS PENDIENTES', 12, true),
  ('motivo', 'PRESUPUESTOS PENDIENTES', 13, true),
  ('motivo', 'OTRO', 99, true)
on conflict (lista, valor) do update set orden = excluded.orden, activo = true;

select valor, orden from reclamos_opciones where lista = 'motivo' and activo order by orden;
