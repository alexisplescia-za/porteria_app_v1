-- Consumo real de refrigerante (salidas de almacén SAP) y objetivos anuales por tienda.
-- Fuente inicial: base_de_datos_sin_topes_por_mes.xlsx (ene-2024 a jul-2026).
-- Correr en: Supabase > SQL Editor > New query > Run.

create table if not exists consumos_refrigerante (
  id bigserial primary key,
  tienda_numero int not null,          -- "Local" de SAP (sin FK: hay locales que no están en tiendas)
  fecha date not null,                 -- fecha de documento
  refrigerante text not null,          -- R22, R404, R410A, R134a
  tipo text not null,                  -- FA = frío alimentario, SC = climatización
  kg numeric not null,                 -- negativo en devoluciones (clase de movimiento 262)
  importe numeric,
  material text,
  documento text,
  orden text,
  lote text not null                   -- identifica cada importación, para poder rehacerla
);
create index if not exists idx_consumos_tienda_fecha on consumos_refrigerante (tienda_numero, fecha);

create table if not exists objetivos_tienda (
  tienda_numero int not null,
  anio int not null,
  objetivo_kg numeric,                 -- "Objetivo topes" anual
  capacidad_topes_kg numeric,          -- capacidad instalada que usa la planilla de topes (referencia)
  primary key (tienda_numero, anio)
);

alter table consumos_refrigerante enable row level security;
alter table objetivos_tienda enable row level security;

create policy "lectura publica consumos" on consumos_refrigerante for select using (true);
create policy "alta publica consumos" on consumos_refrigerante for insert with check (true);
create policy "lectura publica objetivos" on objetivos_tienda for select using (true);
create policy "alta publica objetivos" on objetivos_tienda for insert with check (true);
create policy "edicion publica objetivos" on objetivos_tienda for update using (true) with check (true);

-- Consumo agregado por tienda y mes: es lo que lee el dashboard (menos filas que el detalle).
create or replace view consumos_mensuales as
  select tienda_numero,
         extract(year from fecha)::int as anio,
         extract(month from fecha)::int as mes,
         refrigerante, tipo,
         sum(kg) as kg,
         sum(importe) as importe
  from consumos_refrigerante
  group by 1, 2, 3, 4, 5;
