-- ════════════════════════════════════════════════════════════════
--  RECLAMOS — tipo, motivo, vía, solicitante y seguimiento
--  (reiteraciones y devoluciones entre proveedor / compras / mantenimiento)
--  Conserva los reclamos ya cargados. Correr una sola vez en Supabase > SQL Editor.
-- ════════════════════════════════════════════════════════════════

-- 1) Proveedores: se suman PREDIAL y CONSUMO ENERGÉTICO; "Otro" pasa a "OTRO" (los reclamos se actualizan solos).
update reclamos_proveedores set nombre = 'OTRO', orden = 9 where nombre = 'Otro';
insert into reclamos_proveedores (nombre, orden) values
  ('BMS', 1), ('PME', 2), ('PREDIAL', 3), ('CONSUMO ENERGÉTICO', 4), ('OTRO', 9)
on conflict (nombre) do update set orden = excluded.orden, activo = true;

-- 2) Listas editables para los desplegables nuevos (Supabase > Table editor > reclamos_opciones).
create table if not exists reclamos_opciones (
  lista  text not null check (lista in ('tipo', 'motivo', 'via', 'area')),
  valor  text not null,
  orden  int not null default 0,
  activo boolean not null default true,
  primary key (lista, valor)
);
alter table reclamos_opciones enable row level security;
create policy "lectura reclamos_opciones" on reclamos_opciones for select using (true);

insert into reclamos_opciones (lista, valor, orden) values
  ('tipo', 'AG CONTROL', 1), ('tipo', 'XONET', 2), ('tipo', 'COMPRAS', 3),
  ('tipo', 'MANTENIMIENTO OFICINA TÉCNICA', 4), ('tipo', 'MANTENIMIENTO JEFES', 5), ('tipo', 'OTRO', 9),
  ('motivo', 'RECLAMO', 1), ('motivo', 'SOLICITUD', 2), ('motivo', 'CAMBIOS TEMP./HORARIOS', 3), ('motivo', 'OTRO', 9),
  ('via', 'MAIL', 1), ('via', 'WHATSAPP', 2), ('via', 'AMBOS', 3),
  ('area', 'PROVEEDOR', 1), ('area', 'COMPRAS', 2), ('area', 'MANTENIMIENTO', 3)
on conflict (lista, valor) do nothing;

-- 3) Columnas nuevas en reclamos
alter table reclamos rename column responsable to solicitante;   -- persona que realizó el reclamo/solicitud
alter table reclamos add column if not exists tipo text;
alter table reclamos add column if not exists motivo text;
alter table reclamos add column if not exists area_actual text not null default 'PROVEEDOR';  -- en manos de
alter table reclamos add column if not exists reiteraciones int not null default 0;            -- veces reclamado de nuevo
alter table reclamos add column if not exists devoluciones int not null default 0;             -- pases entre proveedor/compras/mantenimiento
update reclamos set canal = upper(canal) where canal is not null;

-- 4) Historial: dos tipos de evento nuevos
alter table reclamos_eventos drop constraint if exists reclamos_eventos_tipo_check;
alter table reclamos_eventos add constraint reclamos_eventos_tipo_check
  check (tipo in ('alta', 'estado', 'edicion', 'comentario', 'reiteracion', 'derivacion'));

-- 5) Funciones (se reemplazan las de alta y edición por versiones con los campos nuevos)
drop function if exists crear_reclamo(text, text, int, text, text, text, text, text, date, text);
drop function if exists editar_reclamo(text, text, text, date, text, text);

create or replace function crear_reclamo(
  p_usuario text, p_proveedor text, p_tienda int, p_categoria text, p_descripcion text,
  p_prioridad text default 'Media', p_via text default null, p_solicitante text default null,
  p_compromiso date default null, p_referencia text default null,
  p_tipo text default null, p_motivo text default null
) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_dia text := to_char(now() at time zone 'America/Argentina/Buenos_Aires', 'YYYYMMDD');
  v_n   int;
  v_id  text;
begin
  if reclamos_rol_(p_usuario) is null then raise exception 'Usuario no habilitado para cargar reclamos'; end if;
  if coalesce(trim(p_descripcion), '') = '' then raise exception 'Falta la descripción'; end if;
  perform pg_advisory_xact_lock(hashtext('reclamos_' || v_dia));
  select coalesce(max(split_part(id, '-', 3)::int), 0) + 1 into v_n
    from reclamos where id like 'REC-' || v_dia || '-%';
  v_id := 'REC-' || v_dia || '-' || lpad(v_n::text, 2, '0');
  insert into reclamos (id, proveedor, tienda_numero, categoria, descripcion, prioridad, canal,
                        solicitante, fecha_compromiso, referencia, tipo, motivo, creado_por)
  values (v_id, p_proveedor, p_tienda, p_categoria, trim(p_descripcion), coalesce(p_prioridad, 'Media'), p_via,
          coalesce(nullif(trim(p_solicitante), ''),
                   (select nombre from reclamos_usuarios where email = lower(trim(p_usuario))),
                   lower(trim(p_usuario))),
          p_compromiso, nullif(trim(p_referencia), ''), p_tipo, p_motivo, lower(trim(p_usuario)));
  insert into reclamos_eventos (reclamo_id, usuario, tipo, estado_nuevo, comentario)
  values (v_id, lower(trim(p_usuario)), 'alta', 'Nuevo', 'Reclamo creado');
  return v_id;
end $$;

create or replace function editar_reclamo(
  p_usuario text, p_id text, p_solicitante text, p_compromiso date, p_prioridad text, p_referencia text,
  p_tipo text, p_motivo text, p_via text
) returns void
language plpgsql security definer set search_path = public as $$
declare r reclamos%rowtype; v_cambios text := '';
begin
  if reclamos_rol_(p_usuario) is distinct from 'gestor' then raise exception 'Sólo un gestor puede editar'; end if;
  select * into r from reclamos where id = p_id for update;
  if r.id is null then raise exception 'No existe el reclamo %', p_id; end if;
  if r.solicitante is distinct from nullif(trim(p_solicitante), '') then v_cambios := v_cambios || 'quién reclamó · '; end if;
  if r.fecha_compromiso is distinct from p_compromiso then v_cambios := v_cambios || 'fecha compromiso · '; end if;
  if r.prioridad is distinct from p_prioridad then v_cambios := v_cambios || 'prioridad · '; end if;
  if r.referencia is distinct from nullif(trim(p_referencia), '') then v_cambios := v_cambios || 'referencia · '; end if;
  if r.tipo is distinct from nullif(p_tipo, '') then v_cambios := v_cambios || 'tipo · '; end if;
  if r.motivo is distinct from nullif(p_motivo, '') then v_cambios := v_cambios || 'motivo · '; end if;
  if r.canal is distinct from nullif(p_via, '') then v_cambios := v_cambios || 'vía · '; end if;
  if v_cambios = '' then return; end if;
  update reclamos set solicitante = nullif(trim(p_solicitante), ''), fecha_compromiso = p_compromiso,
         prioridad = p_prioridad, referencia = nullif(trim(p_referencia), ''),
         tipo = nullif(p_tipo, ''), motivo = nullif(p_motivo, ''), canal = nullif(p_via, ''), actualizado_at = now()
   where id = p_id;
  insert into reclamos_eventos (reclamo_id, usuario, tipo, comentario)
  values (p_id, lower(trim(p_usuario)), 'edicion', 'Editó: ' || rtrim(v_cambios, ' · '));
end $$;

-- "Reclamar de nuevo": suma una reiteración con fecha y comentario.
create or replace function reiterar_reclamo(p_usuario text, p_id text, p_comentario text default null) returns int
language plpgsql security definer set search_path = public as $$
declare v_n int;
begin
  if reclamos_rol_(p_usuario) is null then raise exception 'Usuario no habilitado'; end if;
  update reclamos set reiteraciones = reiteraciones + 1, actualizado_at = now()
   where id = p_id and estado <> 'Cerrado' returning reiteraciones into v_n;
  if v_n is null then raise exception 'El reclamo % no existe o está cerrado', p_id; end if;
  insert into reclamos_eventos (reclamo_id, usuario, tipo, comentario)
  values (p_id, lower(trim(p_usuario)), 'reiteracion', 'Reclamado de nuevo (vez ' || (v_n + 1) || ')' ||
          coalesce(' · ' || nullif(trim(p_comentario), ''), ''));
  return v_n;
end $$;

-- "Derivar a": cambia quién lo tiene (proveedor / compras / mantenimiento) y cuenta la devolución.
create or replace function derivar_reclamo(p_usuario text, p_id text, p_area text, p_comentario text default null) returns int
language plpgsql security definer set search_path = public as $$
declare v_ant text; v_n int;
begin
  if reclamos_rol_(p_usuario) is distinct from 'gestor' then raise exception 'Sólo un gestor puede derivar'; end if;
  if not exists (select 1 from reclamos_opciones where lista = 'area' and valor = p_area and activo) then
    raise exception 'Área no válida: %', p_area;
  end if;
  select area_actual into v_ant from reclamos where id = p_id for update;
  if v_ant is null then raise exception 'No existe el reclamo %', p_id; end if;
  if v_ant = p_area then return null; end if;
  update reclamos set area_actual = p_area, devoluciones = devoluciones + 1, actualizado_at = now()
   where id = p_id returning devoluciones into v_n;
  insert into reclamos_eventos (reclamo_id, usuario, tipo, estado_anterior, estado_nuevo, comentario)
  values (p_id, lower(trim(p_usuario)), 'derivacion', v_ant, p_area, nullif(trim(p_comentario), ''));
  return v_n;
end $$;

grant execute on function crear_reclamo(text, text, int, text, text, text, text, text, date, text, text, text) to anon;
grant execute on function editar_reclamo(text, text, text, date, text, text, text, text, text) to anon;
grant execute on function reiterar_reclamo(text, text, text) to anon;
grant execute on function derivar_reclamo(text, text, text, text) to anon;
