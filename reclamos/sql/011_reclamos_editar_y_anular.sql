-- ════════════════════════════════════════════════════════════════
--  RECLAMOS — editar el reclamo completo y corregir el historial
--  · editar_reclamo suma proveedor, tienda, categoría y descripción
--  · anular_evento: deshace una reiteración, derivación o cambio de estado hecho por error
--    (no se borra: queda tachado con quién, cuándo y por qué)
--  · editar_comentario_evento: corrige el texto de un comentario (guarda el original)
--  Correr una sola vez en Supabase > SQL Editor.
-- ════════════════════════════════════════════════════════════════

alter table reclamos_eventos add column if not exists anulado boolean not null default false;
alter table reclamos_eventos add column if not exists anulado_por text;
alter table reclamos_eventos add column if not exists anulado_at timestamptz;
alter table reclamos_eventos add column if not exists comentario_original text;
alter table reclamos_eventos add column if not exists editado_por text;
alter table reclamos_eventos add column if not exists editado_at timestamptz;

alter table reclamos_eventos drop constraint if exists reclamos_eventos_tipo_check;
alter table reclamos_eventos add constraint reclamos_eventos_tipo_check
  check (tipo in ('alta', 'estado', 'edicion', 'comentario', 'reiteracion', 'derivacion', 'anulacion'));

-- ── Editar el reclamo completo ───────────────────────────────────
drop function if exists editar_reclamo(text, text, text, date, text, text, text, text, text);

create or replace function editar_reclamo(
  p_usuario text, p_id text, p_solicitante text, p_compromiso date, p_prioridad text, p_referencia text,
  p_tipo text, p_motivo text, p_via text,
  p_proveedor text default null, p_tienda int default null, p_categoria text default null, p_descripcion text default null
) returns void
language plpgsql security definer set search_path = public as $$
declare r reclamos%rowtype; v_cambios text := '';
begin
  if reclamos_rol_(p_usuario) is distinct from 'gestor' then raise exception 'Sólo un gestor puede editar'; end if;
  select * into r from reclamos where id = p_id for update;
  if r.id is null then raise exception 'No existe el reclamo %', p_id; end if;
  if p_descripcion is not null and trim(p_descripcion) = '' then raise exception 'La descripción no puede quedar vacía'; end if;
  if p_proveedor is not null and r.proveedor is distinct from p_proveedor then v_cambios := v_cambios || 'proveedor · '; end if;
  if p_tienda is not null and r.tienda_numero is distinct from p_tienda then v_cambios := v_cambios || 'tienda · '; end if;
  if p_categoria is not null and r.categoria is distinct from p_categoria then v_cambios := v_cambios || 'categoría · '; end if;
  if p_descripcion is not null and r.descripcion is distinct from trim(p_descripcion) then v_cambios := v_cambios || 'descripción · '; end if;
  if r.solicitante is distinct from nullif(trim(p_solicitante), '') then v_cambios := v_cambios || 'quién reclamó · '; end if;
  if r.fecha_compromiso is distinct from p_compromiso then v_cambios := v_cambios || 'fecha compromiso · '; end if;
  if r.prioridad is distinct from p_prioridad then v_cambios := v_cambios || 'prioridad · '; end if;
  if r.referencia is distinct from nullif(trim(p_referencia), '') then v_cambios := v_cambios || 'referencia · '; end if;
  if r.tipo is distinct from nullif(p_tipo, '') then v_cambios := v_cambios || 'tipo · '; end if;
  if r.motivo is distinct from nullif(p_motivo, '') then v_cambios := v_cambios || 'motivo · '; end if;
  if r.canal is distinct from nullif(p_via, '') then v_cambios := v_cambios || 'vía · '; end if;
  if v_cambios = '' then return; end if;
  update reclamos set
    proveedor = coalesce(p_proveedor, proveedor),
    tienda_numero = coalesce(p_tienda, tienda_numero),
    categoria = coalesce(p_categoria, categoria),
    descripcion = coalesce(trim(p_descripcion), descripcion),
    solicitante = nullif(trim(p_solicitante), ''), fecha_compromiso = p_compromiso,
    prioridad = p_prioridad, referencia = nullif(trim(p_referencia), ''),
    tipo = nullif(p_tipo, ''), motivo = nullif(p_motivo, ''), canal = nullif(p_via, ''), actualizado_at = now()
  where id = p_id;
  insert into reclamos_eventos (reclamo_id, usuario, tipo, comentario)
  values (p_id, lower(trim(p_usuario)), 'edicion', 'Editó: ' || rtrim(v_cambios, ' · '));
end $$;

-- ── Anular un movimiento del historial ───────────────────────────
-- Reiteración: baja el contador. Derivación y cambio de estado: sólo el último de su tipo,
-- y vuelve al valor anterior. Comentario: queda tachado. Alta y ediciones no se anulan
-- (una edición se corrige editando de nuevo).
create or replace function anular_evento(p_usuario text, p_evento_id bigint, p_motivo text default null) returns void
language plpgsql security definer set search_path = public as $$
declare e reclamos_eventos%rowtype; r reclamos%rowtype; v_ultimo bigint; v_desc text;
begin
  if reclamos_rol_(p_usuario) is distinct from 'gestor' then raise exception 'Sólo un gestor puede anular movimientos'; end if;
  select * into e from reclamos_eventos where id = p_evento_id for update;
  if e.id is null then raise exception 'No existe el movimiento'; end if;
  if e.anulado then raise exception 'Ese movimiento ya estaba anulado'; end if;
  if e.tipo in ('alta', 'edicion', 'anulacion') then
    raise exception 'Este tipo de movimiento no se puede anular%', case when e.tipo = 'edicion' then ' (para deshacer una edición, editá de nuevo)' else '' end;
  end if;
  select * into r from reclamos where id = e.reclamo_id for update;

  if e.tipo = 'reiteracion' then
    update reclamos set reiteraciones = greatest(reiteraciones - 1, 0), actualizado_at = now() where id = r.id;
    v_desc := 'un "reclamar de nuevo"';
  elsif e.tipo = 'derivacion' then
    select id into v_ultimo from reclamos_eventos
     where reclamo_id = r.id and tipo = 'derivacion' and not anulado order by fecha desc, id desc limit 1;
    if v_ultimo <> e.id or r.area_actual is distinct from e.estado_nuevo then
      raise exception 'Sólo se puede anular la última derivación';
    end if;
    update reclamos set area_actual = e.estado_anterior, devoluciones = greatest(devoluciones - 1, 0), actualizado_at = now() where id = r.id;
    v_desc := 'la derivación ' || e.estado_anterior || ' → ' || e.estado_nuevo;
  elsif e.tipo = 'estado' then
    select id into v_ultimo from reclamos_eventos
     where reclamo_id = r.id and tipo = 'estado' and not anulado order by fecha desc, id desc limit 1;
    if v_ultimo <> e.id or r.estado is distinct from e.estado_nuevo then
      raise exception 'Sólo se puede anular el último cambio de estado';
    end if;
    update reclamos set
      estado = e.estado_anterior,
      fecha_cierre = case when e.estado_anterior = 'Cerrado' then
                       (select max(fecha) from reclamos_eventos where reclamo_id = r.id and tipo = 'estado'
                         and estado_nuevo = 'Cerrado' and not anulado and id <> e.id)
                     else null end,
      reaperturas = greatest(reaperturas - case when e.estado_anterior = 'Cerrado' then 1 else 0 end, 0),
      actualizado_at = now()
    where id = r.id;
    v_desc := 'el cambio de estado ' || e.estado_anterior || ' → ' || e.estado_nuevo;
  else
    v_desc := 'un comentario';
  end if;

  update reclamos_eventos set anulado = true, anulado_por = lower(trim(p_usuario)), anulado_at = now() where id = e.id;
  insert into reclamos_eventos (reclamo_id, usuario, tipo, comentario)
  values (r.id, lower(trim(p_usuario)), 'anulacion', 'Anuló ' || v_desc || coalesce(' · ' || nullif(trim(p_motivo), ''), ''));
end $$;

-- ── Corregir el texto de un comentario ───────────────────────────
create or replace function editar_comentario_evento(p_usuario text, p_evento_id bigint, p_texto text) returns void
language plpgsql security definer set search_path = public as $$
declare e reclamos_eventos%rowtype; v_rol text := reclamos_rol_(p_usuario);
begin
  if v_rol is null then raise exception 'Usuario no habilitado'; end if;
  select * into e from reclamos_eventos where id = p_evento_id for update;
  if e.id is null then raise exception 'No existe el movimiento'; end if;
  if e.anulado then raise exception 'No se puede editar un movimiento anulado'; end if;
  if e.tipo in ('alta', 'edicion', 'anulacion') then raise exception 'Este movimiento no tiene comentario editable'; end if;
  if v_rol <> 'gestor' and e.usuario is distinct from lower(trim(p_usuario)) then
    raise exception 'Sólo podés editar tus propios comentarios';
  end if;
  if e.tipo = 'comentario' and coalesce(trim(p_texto), '') = '' then raise exception 'El comentario no puede quedar vacío'; end if;
  update reclamos_eventos set
    comentario_original = coalesce(comentario_original, comentario),
    comentario = nullif(trim(p_texto), ''),
    editado_por = lower(trim(p_usuario)), editado_at = now()
  where id = e.id;
end $$;

grant execute on function editar_reclamo(text, text, text, date, text, text, text, text, text, text, int, text, text) to anon;
grant execute on function anular_evento(text, bigint, text) to anon;
grant execute on function editar_comentario_evento(text, bigint, text) to anon;
