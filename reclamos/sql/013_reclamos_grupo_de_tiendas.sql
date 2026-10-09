-- ════════════════════════════════════════════════════════════════
--  RECLAMOS — un reclamo puede abarcar un grupo de tiendas
--  · reclamos.tiendas_grupo: lista de tiendas (null = una sola tienda).
--    La primera del grupo queda también en tienda_numero (filtros, CSV, backup).
--  · crear_reclamo y editar_reclamo suman p_tiendas int[]
--  Correr una sola vez en Supabase > SQL Editor.
-- ════════════════════════════════════════════════════════════════

alter table reclamos add column if not exists tiendas_grupo int[];

-- Saca repetidos y nulos manteniendo el orden en que se eligieron.
create or replace function reclamos_lista_tiendas_(p int[]) returns int[]
language sql immutable as $$
  select array_agg(x order by ord) from (
    select distinct on (x) x, ord from unnest(p) with ordinality u(x, ord) where x is not null order by x, ord
  ) s
$$;

-- ── Alta ─────────────────────────────────────────────────────────
drop function if exists crear_reclamo(text, text, int, text, text, text, text, text, date, text, text, text);

create or replace function crear_reclamo(
  p_usuario text, p_proveedor text, p_tienda int, p_categoria text, p_descripcion text,
  p_prioridad text default 'Media', p_via text default null, p_solicitante text default null,
  p_compromiso date default null, p_referencia text default null,
  p_tipo text default null, p_motivo text default null, p_tiendas int[] default null
) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_dia text := to_char(now() at time zone 'America/Argentina/Buenos_Aires', 'YYYYMMDD');
  v_n   int;
  v_id  text;
  v_grupo int[] := reclamos_lista_tiendas_(p_tiendas);
begin
  if reclamos_rol_(p_usuario) is null then raise exception 'Usuario no habilitado para cargar reclamos'; end if;
  if coalesce(trim(p_descripcion), '') = '' then raise exception 'Falta la descripción'; end if;
  if coalesce(cardinality(v_grupo), 0) < 2 then v_grupo := null; end if;
  perform pg_advisory_xact_lock(hashtext('reclamos_' || v_dia));
  select coalesce(max(split_part(id, '-', 3)::int), 0) + 1 into v_n
    from reclamos where id like 'REC-' || v_dia || '-%';
  v_id := 'REC-' || v_dia || '-' || lpad(v_n::text, 2, '0');
  insert into reclamos (id, proveedor, tienda_numero, tiendas_grupo, categoria, descripcion, prioridad, canal,
                        solicitante, fecha_compromiso, referencia, tipo, motivo, creado_por)
  values (v_id, p_proveedor, coalesce(v_grupo[1], p_tienda), v_grupo, p_categoria, trim(p_descripcion),
          coalesce(p_prioridad, 'Media'), p_via,
          coalesce(nullif(trim(p_solicitante), ''),
                   (select nombre from reclamos_usuarios where email = lower(trim(p_usuario))),
                   lower(trim(p_usuario))),
          p_compromiso, nullif(trim(p_referencia), ''), p_tipo, p_motivo, lower(trim(p_usuario)));
  insert into reclamos_eventos (reclamo_id, usuario, tipo, estado_nuevo, comentario)
  values (v_id, lower(trim(p_usuario)), 'alta', 'Nuevo',
          'Reclamo creado' || case when v_grupo is not null then ' · grupo de ' || cardinality(v_grupo) || ' tiendas' else '' end);
  return v_id;
end $$;

-- ── Edición ──────────────────────────────────────────────────────
-- p_tiendas: null = no cambia; lista de 2 o más = grupo; vacía o de 1 = vuelve a una sola tienda.
drop function if exists editar_reclamo(text, text, text, date, text, text, text, text, text, text, int, text, text);

create or replace function editar_reclamo(
  p_usuario text, p_id text, p_solicitante text, p_compromiso date, p_prioridad text, p_referencia text,
  p_tipo text, p_motivo text, p_via text,
  p_proveedor text default null, p_tienda int default null, p_categoria text default null, p_descripcion text default null,
  p_tiendas int[] default null
) returns void
language plpgsql security definer set search_path = public as $$
declare
  r reclamos%rowtype; v_cambios text := '';
  v_grupo int[]; v_tienda int;
begin
  if reclamos_rol_(p_usuario) is distinct from 'gestor' then raise exception 'Sólo un gestor puede editar'; end if;
  select * into r from reclamos where id = p_id for update;
  if r.id is null then raise exception 'No existe el reclamo %', p_id; end if;
  if p_descripcion is not null and trim(p_descripcion) = '' then raise exception 'La descripción no puede quedar vacía'; end if;

  if p_tiendas is null then
    v_grupo := r.tiendas_grupo;
  else
    v_grupo := reclamos_lista_tiendas_(p_tiendas);
    if coalesce(cardinality(v_grupo), 0) < 2 then v_grupo := null; end if;
  end if;
  v_tienda := coalesce(v_grupo[1], p_tienda, r.tienda_numero);

  if p_proveedor is not null and r.proveedor is distinct from p_proveedor then v_cambios := v_cambios || 'proveedor · '; end if;
  if r.tienda_numero is distinct from v_tienda then v_cambios := v_cambios || 'tienda · '; end if;
  if r.tiendas_grupo is distinct from v_grupo then v_cambios := v_cambios || 'grupo de tiendas · '; end if;
  if p_categoria is not null and r.categoria is distinct from p_categoria then v_cambios := v_cambios || 'categoría · '; end if;
  if p_descripcion is not null and r.descripcion is distinct from trim(p_descripcion) then v_cambios := v_cambios || 'descripción · '; end if;
  if r.solicitante is distinct from nullif(trim(p_solicitante), '') then v_cambios := v_cambios || 'quién reclamó · '; end if;
  if r.fecha_compromiso is distinct from p_compromiso then v_cambios := v_cambios || 'fecha compromiso · '; end if;
  if r.prioridad is distinct from p_prioridad then v_cambios := v_cambios || 'prioridad · '; end if;
  if r.referencia is distinct from nullif(trim(p_referencia), '') then v_cambios := v_cambios || 'referencia · '; end if;
  if r.tipo is distinct from nullif(p_tipo, '') then v_cambios := v_cambios || 'sector · '; end if;
  if r.motivo is distinct from nullif(p_motivo, '') then v_cambios := v_cambios || 'motivo · '; end if;
  if r.canal is distinct from nullif(p_via, '') then v_cambios := v_cambios || 'vía · '; end if;
  if v_cambios = '' then return; end if;

  update reclamos set
    proveedor = coalesce(p_proveedor, proveedor),
    tienda_numero = v_tienda,
    tiendas_grupo = v_grupo,
    categoria = coalesce(p_categoria, categoria),
    descripcion = coalesce(trim(p_descripcion), descripcion),
    solicitante = nullif(trim(p_solicitante), ''), fecha_compromiso = p_compromiso,
    prioridad = p_prioridad, referencia = nullif(trim(p_referencia), ''),
    tipo = nullif(p_tipo, ''), motivo = nullif(p_motivo, ''), canal = nullif(p_via, ''), actualizado_at = now()
  where id = p_id;
  insert into reclamos_eventos (reclamo_id, usuario, tipo, comentario)
  values (p_id, lower(trim(p_usuario)), 'edicion', 'Editó: ' || rtrim(v_cambios, ' · '));
end $$;

grant execute on function crear_reclamo(text, text, int, text, text, text, text, text, date, text, text, text, int[]) to anon;
grant execute on function editar_reclamo(text, text, text, date, text, text, text, text, text, text, int, text, text, int[]) to anon;
