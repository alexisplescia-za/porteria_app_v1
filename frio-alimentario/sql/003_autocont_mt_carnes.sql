-- Agrega "Autocontenidos MT carnes" (equipo propio de Express en el Excel de capacidad instalada).
-- Correr en: Supabase > SQL Editor > New query > Run (después de 002_parametros_kg.sql).

alter table relevamientos add column if not exists autocont_mt_carnes int default 0;

insert into parametros_kg (grupo, equipo, m2_hasta, refrigerante, kg) values
  ('EXPRESS', 'autocont_mt_carnes', null, 'R404', 1.2),
  ('HMM',     'autocont_mt_carnes', null, 'R404', 0)
on conflict do nothing;
