-- ════════════════════════════════════════════════════════════════
--  RECLAMOS — quién está a cargo, respuestas del proveedor y fechas editables
--  · reclamos.responsable: quién lleva el ticket. Arranca con quien lo cargó y se puede
--    traspasar a otro usuario (queda en el historial: "Traspaso: A → B").
--  · Respuesta del proveedor: movimiento nuevo con su fecha + contador reclamos.respuestas.
--  · "Reclamar de nuevo" y "Respuesta del proveedor" aceptan una fecha (para cargar cosas
--    que pasaron antes) y la fecha de reiteraciones, respuestas y comentarios se puede corregir
--    después (se guarda la fecha original).
--  Correr una sola vez en Supabase > SQL Editor.
-- ════════════════════════════════════════════════════════════════

alter table reclamos add column if not exists responsable text;
alter table reclamos add column if not exists respuestas int not null default 0;
update reclamos set responsable = creado_por where responsable is null;

alter table reclamos_eventos add column if not exists fecha_original timestamptz;

alter table reclamos_eventos drop constraint if exists reclamos_eventos_tipo_check;
alter table reclamos_eventos add constraint reclamos_eventos_tipo_check
  check (tipo in ('alta', 'estado', 'edicion', 'comentario', 'reiteracion', 'derivacion',
                  'anulacion', 'restauracion', 'asignacion', 'respuesta'));

-- Los tickets nuevos quedan a cargo de quien los carga (después se pueden traspasar).
create or replace function reclamos_responsable_inicial_() returns trigger
language plpgsql as $$
begin
  new.responsable := coalesce(new.responsable, new.creado_por);
  return new;
end $$;
drop trigger if exists reclamos_responsable_inicial on reclamos;
create trigger reclamos_responsable_inicial before insert on reclamos
  for each row execute function reclamos_responsable_inicial_();

-- Fecha de un movimiento: hoy → ahora; otro día → ese día al mediodía (hora Argentina). Nunca futura.
create or replace function reclamos_fecha_evento_(p_fecha date) returns timestamptz
language plpgsql stable as $$
declare v_hoy date := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
begin
  if p_fecha is null or p_fecha = v_hoy then return now(); end if;
  if p_fecha > v_hoy then raise exception 'La fecha no puede ser futura'; end if;
  return (p_fecha + time '12:00') at time zone 'America/Argentina/Buenos_Aires';
end $$;

-- ── Reclamar de nuevo (ahora con fecha) ──────────────────────────
drop function if exists reiterar_reclamo(text, text, text);
create or replace function reiterar_reclamo(p_usuario text, p_id text, p_comentario text default null, p_fecha date default null)
returns int
language plpgsql security definer set search_path = public as $$
declare v_n int; v_fecha timestamptz := reclamos_fecha_evento_(p_fecha);
begin
  if reclamos_rol_(p_usuario) is null then raise exception 'Usuario no habilitado'; end if;
  update reclamos set reiteraciones = reiteraciones + 1, actualizado_at = now()
   where id = p_id and estado <> 'Cerrado' returning reiteraciones into v_n;
  if v_n is null then raise exception 'El reclamo % no existe o está cerrado', p_id; end if;
  insert into reclamos_eventos (reclamo_id, usuario, tipo, comentario, fecha)
  values (p_id, lower(trim(p_usuario)), 'reiteracion', 'Reclamado de nuevo (vez ' || (v_n + 1) || ')' ||
          coalesce(' · ' || nullif(trim(p_comentario), ''), ''), v_fecha);
  return v_n;
end $$;

-- ── Respuesta del proveedor ──────────────────────────────────────
create or replace function responder_reclamo(p_usuario text, p_id text, p_texto text, p_fecha date default null)
returns int
language plpgsql security definer set search_path = public as $$
declare v_n int; v_fecha timestamptz := reclamos_fecha_evento_(p_fecha);
begin
  if reclamos_rol_(p_usuario) is null then raise exception 'Usuario no habilitado'; end if;
  if coalesce(trim(p_texto), '') = '' then raise exception 'Escribí qué respondió el proveedor'; end if;
  update reclamos set respuestas = respuestas + 1, actualizado_at = now()
   where id = p_id and estado <> 'Cerrado' returning respuestas into v_n;
  if v_n is null then raise exception 'El reclamo % no existe o está cerrado', p_id; end if;
  insert into reclamos_eventos (reclamo_id, usuario, tipo, comentario, fecha)
  values (p_id, lower(trim(p_usuario)), 'respuesta', trim(p_texto), v_fecha);
  return v_n;
end $$;

-- ── Traspasar el ticket a otro usuario ───────────────────────────
-- Lo puede hacer un gestor o quien lo tiene a cargo. El destino tiene que ser un usuario activo.
create or replace function asignar_reclamo(p_usuario text, p_id text, p_responsable text, p_comentario text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare r reclamos%rowtype; v_yo text := lower(trim(p_usuario)); v_dest text := lower(trim(p_responsable));
begin
  if reclamos_rol_(p_usuario) is null then raise exception 'Usuario no habilitado'; end if;
  select * into r from reclamos where id = p_id for update;
  if r.id is null then raise exception 'No existe el reclamo %', p_id; end if;
  if reclamos_rol_(p_usuario) <> 'gestor' and r.responsable is distinct from v_yo then
    raise exception 'Sólo un gestor o quien tiene el ticket a cargo puede traspasarlo';
  end if;
  if not exists (select 1 from reclamos_usuarios where email = v_dest and activo) then
    raise exception 'El usuario % no está habilitado', v_dest;
  end if;
  if r.responsable is not distinct from v_dest then return; end if;
  update reclamos set responsable = v_dest, actualizado_at = now() where id = p_id;
  insert into reclamos_eventos (reclamo_id, usuario, tipo, estado_anterior, estado_nuevo, comentario)
  values (p_id, v_yo, 'asignacion', coalesce(r.responsable, 'sin asignar'), v_dest, nullif(trim(p_comentario), ''));
end $$;

-- ── Editar un movimiento: texto y, en reiteraciones/respuestas/comentarios, la fecha ──
create or replace function editar_evento(p_usuario text, p_evento_id bigint, p_texto text, p_fecha date default null)
returns void
language plpgsql security definer set search_path = public as $$
declare e reclamos_eventos%rowtype; v_rol text := reclamos_rol_(p_usuario); v_fecha timestamptz;
begin
  if v_rol is null then raise exception 'Usuario no habilitado'; end if;
  select * into e from reclamos_eventos where id = p_evento_id for update;
  if e.id is null then raise exception 'No existe el movimiento'; end if;
  if e.anulado then raise exception 'No se puede editar un movimiento anulado'; end if;
  if e.tipo in ('alta', 'edicion', 'anulacion', 'restauracion') then raise exception 'Este movimiento no se puede editar'; end if;
  if v_rol <> 'gestor' and e.usuario is distinct from lower(trim(p_usuario)) then
    raise exception 'Sólo podés editar tus propios movimientos';
  end if;
  if e.tipo in ('comentario', 'respuesta') and coalesce(trim(p_texto), '') = '' then raise exception 'El texto no puede quedar vacío'; end if;
  if p_fecha is not null then
    if e.tipo not in ('comentario', 'reiteracion', 'respuesta') then
      raise exception 'Sólo se puede cambiar la fecha de reiteraciones, respuestas y comentarios';
    end if;
    v_fecha := reclamos_fecha_evento_(p_fecha);
  end if;
  update reclamos_eventos set
    comentario_original = case when comentario is distinct from nullif(trim(p_texto), '')
                               then coalesce(comentario_original, comentario) else comentario_original end,
    comentario = nullif(trim(p_texto), ''),
    fecha_original = case when v_fecha is not null then coalesce(fecha_original, fecha) else fecha_original end,
    fecha = coalesce(v_fecha, fecha),
    editado_por = lower(trim(p_usuario)), editado_at = now()
  where id = e.id;
end $$;

-- ── Anular: suma respuestas y traspasos ──────────────────────────
create or replace function anular_evento(p_usuario text, p_evento_id bigint, p_motivo text default null) returns void
language plpgsql security definer set search_path = public as $$
declare e reclamos_eventos%rowtype; r reclamos%rowtype; v_ultimo bigint; v_desc text;
begin
  if reclamos_rol_(p_usuario) is distinct from 'gestor' then raise exception 'Sólo un gestor puede anular movimientos'; end if;
  select * into e from reclamos_eventos where id = p_evento_id for update;
  if e.id is null then raise exception 'No existe el movimiento'; end if;
  if e.anulado then raise exception 'Ese movimiento ya estaba anulado'; end if;
  if e.tipo in ('alta', 'edicion', 'anulacion', 'restauracion') then
    raise exception 'Este tipo de movimiento no se puede anular%', case when e.tipo = 'edicion' then ' (para deshacer una edición, editá de nuevo)' else '' end;
  end if;
  select * into r from reclamos where id = e.reclamo_id for update;

  if e.tipo = 'reiteracion' then
    update reclamos set reiteraciones = greatest(reiteraciones - 1, 0), actualizado_at = now() where id = r.id;
    v_desc := 'un "reclamar de nuevo"';
  elsif e.tipo = 'respuesta' then
    update reclamos set respuestas = greatest(respuestas - 1, 0), actualizado_at = now() where id = r.id;
    v_desc := 'una respuesta del proveedor';
  elsif e.tipo = 'asignacion' then
    select id into v_ultimo from reclamos_eventos
     where reclamo_id = r.id and tipo = 'asignacion' and not anulado order by fecha desc, id desc limit 1;
    if v_ultimo <> e.id or r.responsable is distinct from e.estado_nuevo then
      raise exception 'Sólo se puede anular el último traspaso';
    end if;
    update reclamos set responsable = nullif(e.estado_anterior, 'sin asignar'), actualizado_at = now() where id = r.id;
    v_desc := 'el traspaso ' || e.estado_anterior || ' → ' || e.estado_nuevo;
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

grant execute on function reiterar_reclamo(text, text, text, date) to anon;
grant execute on function responder_reclamo(text, text, text, date) to anon;
grant execute on function asignar_reclamo(text, text, text, text) to anon;
grant execute on function editar_evento(text, bigint, text, date) to anon;
