-- Parámetros editables para calcular la capacidad instalada (kg de refrigerante).
-- Reemplaza al cuadro "Kg R22 por Central de frío" / "Kg R404 por equipo" del Excel.
-- Correr una sola vez en: Supabase > SQL Editor > New query > Run.
--
-- Cómo se usa: para cada tienda y cada equipo del relevamiento se busca la fila
-- con su grupo (HMM = Hiper/Market/Maxi, EXPRESS) y el primer tramo donde
-- m² salón <= m2_hasta (m2_hasta vacío = sin tope). kg tienda = cantidad × kg.

create table if not exists parametros_kg (
  id bigserial primary key,
  grupo text not null check (grupo in ('HMM', 'EXPRESS')),
  equipo text not null,          -- nombre de la columna en relevamientos
  m2_hasta numeric,              -- null = sin tope (último tramo)
  refrigerante text not null,
  kg numeric not null default 0 check (kg >= 0),
  actualizado_por text,
  actualizado_at timestamptz default now(),
  unique nulls not distinct (grupo, equipo, m2_hasta)
);

alter table parametros_kg enable row level security;

-- Mismo nivel de seguridad que relevamientos (sin login real). La pantalla de
-- edición sólo se muestra a cuentas maestras, pero la base no lo puede verificar.
create policy "lectura publica parametros_kg" on parametros_kg for select using (true);
create policy "alta publica parametros_kg" on parametros_kg for insert with check (true);
create policy "edicion publica parametros_kg" on parametros_kg for update using (true) with check (true);
create policy "baja publica parametros_kg" on parametros_kg for delete using (true);

-- Valores iniciales tomados del Excel "Capacidad Instalada Refrigerantes _ AA y FA".
insert into parametros_kg (grupo, equipo, m2_hasta, refrigerante, kg) values
  -- Hiper / Market / Maxi: centrales según m² salón
  ('HMM', 'centrales_mt', 499,  'R22', 50),
  ('HMM', 'centrales_mt', 2000, 'R22', 250),
  ('HMM', 'centrales_mt', 5000, 'R22', 350),
  ('HMM', 'centrales_mt', 8000, 'R22', 400),
  ('HMM', 'centrales_mt', null, 'R22', 500),
  ('HMM', 'centrales_bt', 499,  'R22', 50),
  ('HMM', 'centrales_bt', 2000, 'R22', 95),
  ('HMM', 'centrales_bt', 5000, 'R22', 95),
  ('HMM', 'centrales_bt', 8000, 'R22', 95),
  ('HMM', 'centrales_bt', null, 'R22', 95),
  -- Hiper / Market / Maxi: equipos autocontenidos
  ('HMM', 'gondolas_autocont_mt', null, 'R404', 3),
  ('HMM', 'gondolas_autocont_bt', null, 'R404', 3),
  ('HMM', 'pozos_bt',             null, 'R404', 0.5),
  ('HMM', 'camaras_mtbt_dual',    null, 'R404', 13),
  -- Hiper / Market / Maxi: el Excel no los valoriza todavía (kg a definir)
  ('HMM', 'camaras_autocont_mt',   null, 'R404', 0),
  ('HMM', 'camaras_autocont_bt',   null, 'R404', 0),
  ('HMM', 'pozos_mt',              null, 'R404', 0),
  ('HMM', 'centrales_dual',        null, 'R22',  0),
  ('HMM', 'autocont_reemplazo_bt', null, 'R404', 0),
  -- Express: valores fijos
  ('EXPRESS', 'centrales_mt',         null, 'R22',  27.2),
  ('EXPRESS', 'centrales_bt',         null, 'R22',  13.6),
  ('EXPRESS', 'gondolas_autocont_mt', null, 'R290', 0.15),
  ('EXPRESS', 'gondolas_autocont_bt', null, 'R290', 0.15),
  ('EXPRESS', 'pozos_bt',             null, 'R404', 1),
  ('EXPRESS', 'camaras_mtbt_dual',    null, 'R404', 3),
  ('EXPRESS', 'camaras_autocont_mt',   null, 'R404', 0),
  ('EXPRESS', 'camaras_autocont_bt',   null, 'R404', 0),
  ('EXPRESS', 'pozos_mt',              null, 'R404', 0),
  ('EXPRESS', 'centrales_dual',        null, 'R22',  0),
  ('EXPRESS', 'autocont_reemplazo_bt', null, 'R404', 0)
on conflict do nothing;
