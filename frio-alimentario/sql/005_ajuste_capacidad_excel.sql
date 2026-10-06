-- Ajustes para que la capacidad instalada coincida con la hoja "CAPACIDAD INSTALADA - FA" del Excel.
-- Correr en: Supabase > SQL Editor > New query > Run.

-- 1) Autocontenidos de Express que usan R404 (1,5 kg) en lugar de R290 (0,15 kg).
--    El Excel lo define tienda por tienda ("Identificar cuáles son 404 y cuáles R290").
alter table relevamientos add column if not exists autocont_bt_r404 int default 0;
alter table relevamientos add column if not exists autocont_mt_r404 int default 0;

insert into parametros_kg (grupo, equipo, m2_hasta, refrigerante, kg) values
  ('EXPRESS', 'autocont_bt_r404', null, 'R404', 1.5),
  ('EXPRESS', 'autocont_mt_r404', null, 'R404', 1.5),
  ('HMM',     'autocont_bt_r404', null, 'R404', 0),
  ('HMM',     'autocont_mt_r404', null, 'R404', 0)
on conflict do nothing;

-- 2) Tiendas que el Excel cuenta pero no están en el organigrama ene-sep 2026
--    (datos tomados de la hoja "CAPACIDAD INSTALADA - FA").
insert into tiendas (numero, sap, local, formato, m2, region, jefe_nombre, jefe_mail) values
  (143,  '143',  '143 - Market Río Gallegos',                'MARKET',  1111, 'Interior Sur', 'Daniel Ponce',      'eulogio_ponce@carrefour.com'),
  (472,  '472',  '472 - Jauretche 1125',                     'Express', 179,  '2',            'Gonzalo Mena',      'gonzalo_hernan_mena@carrefour.com'),
  (691,  '691',  '691 - Avenida La Plata 716',               'Express', 129,  '11',           'Hugo Villalba',     'hugo_ariel_villalba@carrefour.com'),
  (694,  '694',  '694 - Tucuman 1541',                       'Express', 140,  '12',           'Juan Aloe',         'juan_aloe@carrefour.com'),
  (826,  '826',  '826 - Avenida Francisco Beiro 5418',       'Express', 138,  '6',            'Daniel Triacca',    'daniel_triacca@carrefour.com'),
  (6021, '6021', '6021 - Godoy Cruz 178, Ciudad de Mza',     'Express', 345,  '17',           'Nicolas Buttaccio', 'nicolas_emiliano_buttaccio@carrefour.com'),
  (6024, '6024', '6024 - Agustín Alvarez 37, Ciudad de Mza', 'Express', 112,  '17',           'Nicolas Buttaccio', 'nicolas_emiliano_buttaccio@carrefour.com'),
  (6028, '6028', '6028 - Sgo del Estero 1200, Godoy Cruz',   'Express', 131,  '17',           'Nicolas Buttaccio', 'nicolas_emiliano_buttaccio@carrefour.com')
on conflict (numero) do nothing;
