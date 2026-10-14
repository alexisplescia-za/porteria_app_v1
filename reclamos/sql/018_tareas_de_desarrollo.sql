-- ════════════════════════════════════════════════════════════════
--  PANEL DE DESARROLLO — tareas pendientes del proyecto (Central Mantenimiento App)
--  · Tabla dev_tareas: lectura pública como el resto; se escribe sólo con funciones
--    que validan que el usuario sea gestor de Reclamos.
--  · Se carga con las tareas pendientes al 14/10/2026 (sólo si la tabla está vacía).
--  Correr una sola vez en Supabase > SQL Editor.
-- ════════════════════════════════════════════════════════════════

create table if not exists dev_tareas (
  id             bigserial primary key,
  titulo         text not null,
  detalle        text,
  area           text not null default 'General'
                 check (area in ('Reclamos', 'Frío', 'Portería', 'Seguridad', 'Backup', 'General')),
  prioridad      text not null default 'Media' check (prioridad in ('Alta', 'Media', 'Baja')),
  estado         text not null default 'Pendiente' check (estado in ('Pendiente', 'En curso', 'Hecho', 'Descartada')),
  creado_por     text,
  creado_at      timestamptz not null default now(),
  actualizado_at timestamptz not null default now(),
  completado_por text,
  completado_at  timestamptz
);
alter table dev_tareas enable row level security;
drop policy if exists "lectura dev_tareas" on dev_tareas;
create policy "lectura dev_tareas" on dev_tareas for select using (true);

create or replace function crear_tarea(p_usuario text, p_titulo text, p_detalle text default null,
  p_area text default 'General', p_prioridad text default 'Media') returns bigint
language plpgsql security definer set search_path = public as $$
declare v_id bigint;
begin
  if reclamos_rol_(p_usuario) is distinct from 'gestor' then raise exception 'Sólo un gestor puede cargar tareas'; end if;
  if coalesce(trim(p_titulo), '') = '' then raise exception 'Falta el título de la tarea'; end if;
  insert into dev_tareas (titulo, detalle, area, prioridad, creado_por)
  values (trim(p_titulo), nullif(trim(p_detalle), ''), coalesce(nullif(p_area, ''), 'General'),
          coalesce(nullif(p_prioridad, ''), 'Media'), lower(trim(p_usuario)))
  returning id into v_id;
  return v_id;
end $$;

-- Cambia el estado (y opcionalmente el resto de los campos: null = no cambia).
create or replace function actualizar_tarea(p_usuario text, p_id bigint, p_estado text default null,
  p_titulo text default null, p_detalle text default null, p_area text default null, p_prioridad text default null)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if reclamos_rol_(p_usuario) is distinct from 'gestor' then raise exception 'Sólo un gestor puede modificar tareas'; end if;
  if p_titulo is not null and trim(p_titulo) = '' then raise exception 'El título no puede quedar vacío'; end if;
  update dev_tareas set
    estado = coalesce(p_estado, estado),
    titulo = coalesce(trim(p_titulo), titulo),
    detalle = case when p_detalle is null then detalle else nullif(trim(p_detalle), '') end,
    area = coalesce(p_area, area),
    prioridad = coalesce(p_prioridad, prioridad),
    completado_por = case when p_estado = 'Hecho' then lower(trim(p_usuario))
                          when p_estado is not null then null else completado_por end,
    completado_at = case when p_estado = 'Hecho' then now()
                         when p_estado is not null then null else completado_at end,
    actualizado_at = now()
  where id = p_id;
  if not found then raise exception 'No existe la tarea %', p_id; end if;
end $$;

grant execute on function crear_tarea(text, text, text, text, text) to anon;
grant execute on function actualizar_tarea(text, bigint, text, text, text, text, text) to anon;

-- Tareas pendientes al 14/10/2026
insert into dev_tareas (titulo, detalle, area, prioridad, creado_por)
select t.titulo, t.detalle, t.area, t.prioridad, 'alexis_plescia@carrefour.com'
from (values
  ('Cargar AUTH_SECRET en Render y publicar el backend con login seguro',
   'Render → porteria-backend → Environment → AUTH_SECRET (Generate). Después publicar el backend (ya está listo y probado).', 'Seguridad', 'Alta'),
  ('Cambiar las contraseñas de ejemplo de Portería',
   'Cualquier usuario con contraseña de ejemplo (admin123, porteria1…) tiene que cambiarla desde el panel de administración.', 'Seguridad', 'Alta'),
  ('Traspasar las cuentas a un usuario de la oficina',
   'GitHub, Vercel, Supabase, Render, cron-job.org y la planilla de backup a nombre de la oficina, con Alexis como colaborador.', 'General', 'Alta'),
  ('Login real con link al mail para Frío y Reclamos',
   'Supabase Auth: elimina la suplantación de identidad. Hace falta un servicio de envío de mails para uso real.', 'Seguridad', 'Alta'),
  ('Cerrar las escrituras públicas de Frío',
   'Parámetros de kg, objetivos, consumos y relevamientos se escriben directo desde el navegador: pasarlos a funciones que validen.', 'Seguridad', 'Alta'),
  ('Encabezados de seguridad en Vercel',
   'CSP, protección contra iframes, X-Content-Type-Options y Referrer-Policy en vercel.json.', 'Seguridad', 'Media'),
  ('Pegar la última versión del script de backup en la planilla',
   'backup_porteria.gs ahora copia Sistema, A cargo, respuestas, quién cargó/editó y excluye anulados.', 'Backup', 'Media'),
  ('Anular los tickets de prueba',
   'REC-20261008-03, REC-20261009-02 y REC-20261009-03 con "Anular este reclamo…".', 'Reclamos', 'Media'),
  ('Historial de cambios del relevamiento de Frío',
   'Hoy cada guardado pisa la fila: sólo queda el último que cargó.', 'Frío', 'Media'),
  ('Portería: cargar sólo los últimos 30–60 días y paginar el historial',
   'Hoy descarga todo el historial al abrir: con ~14.000 registros deja de guardar la copia local.', 'Portería', 'Media'),
  ('Renombrar "Tipo" a "Sector" en formulario, detalle y filtro', 'A confirmar.', 'Reclamos', 'Baja'),
  ('¿Las Centrales Dual piden compresores por central?', 'A confirmar.', 'Frío', 'Baja'),
  ('Definir Express 6044/6045 y 508 Bella Vista',
   '1,8 kg de diferencia con el Excel; 508 figura cerrada pero tiene consumo 2026.', 'Frío', 'Baja'),
  ('Actualizar la presentación de beneficios',
   'Compresores ya implementados, Reclamos (Sistema, Sector, motivos, anulación, a cargo, respuestas) y capacitaciones.', 'General', 'Baja'),
  ('Medir los tiempos reales del proceso manual', 'Para validar el ahorro de horas de la presentación y el informe.', 'General', 'Baja'),
  ('Subir los commits del segundo cerebro', 'gh auth login con la cuenta personal y Commit-and-sync.', 'General', 'Baja')
) as t(titulo, detalle, area, prioridad)
where not exists (select 1 from dev_tareas);

select area, prioridad, titulo from dev_tareas order by id;
