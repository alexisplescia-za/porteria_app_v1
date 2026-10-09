-- ════════════════════════════════════════════════════════════════
--  FRÍO ALIMENTARIO — cantidad de compresores por central
--  Una lista por tienda: posición 1 = central 1, posición 2 = central 2, etc.
--  Ej.: centrales_mt = 2 y compresores_mt = {4,3} → central MT 1 con 4 compresores, central MT 2 con 3.
--  No cambia el cálculo de capacidad (sigue siendo por central).
--  Correr una sola vez en Supabase > SQL Editor.
-- ════════════════════════════════════════════════════════════════

alter table relevamientos add column if not exists compresores_mt int[];
alter table relevamientos add column if not exists compresores_bt int[];

comment on column relevamientos.compresores_mt is 'Compresores de cada central MT, en orden (central 1, 2, ...)';
comment on column relevamientos.compresores_bt is 'Compresores de cada central BT, en orden (central 1, 2, ...)';
