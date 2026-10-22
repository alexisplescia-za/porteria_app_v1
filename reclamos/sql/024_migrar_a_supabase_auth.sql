-- ════════════════════════════════════════════════════════════════
--  RECLAMOS — migración a Supabase Auth de verdad
--  Hasta ahora, el login (de ayer) tapaba la pantalla de entrada, pero cada
--  función de la base seguía confiando en un parámetro p_usuario que manda
--  el navegador, sin verificar sesión. El 22/10/2026 alguien lo aprovechó:
--  usó una IA para llamar a la API directo (sin pasar por el login) y creó
--  4 reclamos falsos en menos de 1 segundo, usando el mail de un compañero.
--
--  Esto cierra la puerta de verdad:
--  · Cada función de escritura deja de recibir p_usuario y usa auth.email()
--    (que sale del token JWT verificado por Supabase, no de lo que mande
--    el cliente). Se les saca el grant a "anon" y se les da sólo a
--    "authenticated" — sin sesión real, ni siquiera se puede intentar.
--  · La lectura también pasa a exigir sesión (antes era pública, "using
--    (true)", igual que el resto de la app).
--  · Se borra el sistema de contraseña/sesión de ayer (password_hash,
--    reclamos_sesiones y las 7 funciones de login) — Supabase Auth lo
--    reemplaza entero, con su propio manejo de sesión y "recordarme".
--
--  reclamos_usuarios SIGUE siendo la fuente de nombre/rol/activo (Supabase
--  Auth no sabe nada de eso) — sólo se le saca password_hash.
--
--  Requiere que los 6 usuarios ya existan en Supabase Auth (Authentication
--  → Users), con el mismo mail que tienen en reclamos_usuarios.
--
--  Correr una sola vez en Supabase > SQL Editor, DESPUÉS de desplegar el
--  código nuevo (ver el resto del plan: el código viejo deja de funcionar
--  en cuanto se corre esto).
-- ════════════════════════════════════════════════════════════════

-- ── 1) Sacar las firmas viejas (todas reciben p_usuario como primer parámetro) ──
drop function if exists reclamos_rol_(text);
drop function if exists crear_reclamo(text, text, int, text, text, text, text, text, date, text, text, text, int[]);
drop function if exists editar_reclamo(text, text, text, date, text, text, text, text, text, text, int, text, text, int[]);
drop function if exists comentar_reclamo(text, text, text);
drop function if exists cambiar_estado_reclamo(text, text, text, text);
drop function if exists reiterar_reclamo(text, text, text, date);
drop function if exists responder_reclamo(text, text, text, date);
drop function if exists asignar_reclamo(text, text, text, text);
drop function if exists derivar_reclamo(text, text, text, text);
drop function if exists editar_evento(text, bigint, text, date);
drop function if exists anular_evento(text, bigint, text);
drop function if exists eliminar_evento(text, bigint, text);
drop function if exists anular_reclamo(text, text, text);
drop function if exists restaurar_reclamo(text, text);
drop function if exists crear_tarea(text, text, text, text, text);
drop function if exists actualizar_tarea(text, bigint, text, text, text, text, text);
-- Muerta: ya no la llama el cliente (editar_evento la reemplazó en el 017), pero seguía otorgada a anon.
drop function if exists editar_comentario_evento(text, bigint, text);

-- ── 2) reclamos_rol_ primero: todas las demás la llaman ─────────────
create or replace function reclamos_rol_() returns text
language sql stable security definer set search_path = public as $$
  select rol from reclamos_usuarios where email = lower(auth.email()) and activo
$$;

-- ── 3) Alta y edición de reclamos ────────────────────────────────
create or replace function crear_reclamo(
  p_proveedor text, p_tienda int, p_categoria text, p_descripcion text,
  p_prioridad text default 'Media', p_via text default null, p_solicitante text default null,
  p_compromiso date default null, p_referencia text default null,
  p_tipo text default null, p_motivo text default null, p_tiendas int[] default null
) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_usuario text := lower(auth.email());
  v_dia text := to_char(now() at time zone 'America/Argentina/Buenos_Aires', 'YYYYMMDD');
  v_n   int;
  v_id  text;
  v_grupo int[] := reclamos_lista_tiendas_(p_tiendas);
begin
  if reclamos_rol_() is null then raise exception 'Usuario no habilitado para cargar reclamos'; end if;
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
                   (select nombre from reclamos_usuarios where email = v_usuario),
                   v_usuario),
          p_compromiso, nullif(trim(p_referencia), ''), p_tipo, p_motivo, v_usuario);
  insert into reclamos_eventos (reclamo_id, usuario, tipo, estado_nuevo, comentario)
  values (v_id, v_usuario, 'alta', 'Nuevo',
          'Reclamo creado' || case when v_grupo is not null then ' · grupo de ' || cardinality(v_grupo) || ' tiendas' else '' end);
  return v_id;
end $$;
grant execute on function crear_reclamo(text, int, text, text, text, text, text, date, text, text, text, int[]) to authenticated;

create or replace function editar_reclamo(
  p_id text, p_solicitante text, p_compromiso date, p_prioridad text, p_referencia text,
  p_tipo text, p_motivo text, p_via text,
  p_proveedor text default null, p_tienda int default null, p_categoria text default null, p_descripcion text default null,
  p_tiendas int[] default null
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_usuario text := lower(auth.email());
  r reclamos%rowtype; v_cambios text := '';
  v_grupo int[]; v_tienda int;
begin
  if reclamos_rol_() is distinct from 'gestor' then raise exception 'Sólo un gestor puede editar'; end if;
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
  values (p_id, v_usuario, 'edicion', 'Editó: ' || rtrim(v_cambios, ' · '));
end $$;
grant execute on function editar_reclamo(text, text, date, text, text, text, text, text, text, int, text, text, int[]) to authenticated;

create or replace function comentar_reclamo(p_id text, p_comentario text) returns void
language plpgsql security definer set search_path = public as $$
declare v_usuario text := lower(auth.email());
begin
  if reclamos_rol_() is null then raise exception 'Usuario no habilitado'; end if;
  if coalesce(trim(p_comentario), '') = '' then raise exception 'El comentario está vacío'; end if;
  insert into reclamos_eventos (reclamo_id, usuario, tipo, comentario)
  values (p_id, v_usuario, 'comentario', trim(p_comentario));
  update reclamos set actualizado_at = now() where id = p_id;
end $$;
grant execute on function comentar_reclamo(text, text) to authenticated;

create or replace function cambiar_estado_reclamo(p_id text, p_estado text, p_comentario text default null) returns void
language plpgsql security definer set search_path = public as $$
declare v_usuario text := lower(auth.email()); v_ant text;
begin
  if reclamos_rol_() is distinct from 'gestor' then raise exception 'Sólo un gestor puede cambiar el estado'; end if;
  select estado into v_ant from reclamos where id = p_id for update;
  if v_ant is null then raise exception 'No existe el reclamo %', p_id; end if;
  if v_ant = p_estado then return; end if;
  update reclamos set
    estado = p_estado,
    fecha_cierre = case when p_estado = 'Cerrado' then now() else null end,
    reaperturas = reaperturas + case when v_ant = 'Cerrado' then 1 else 0 end,
    actualizado_at = now()
  where id = p_id;
  insert into reclamos_eventos (reclamo_id, usuario, tipo, estado_anterior, estado_nuevo, comentario)
  values (p_id, v_usuario, 'estado', v_ant, p_estado, nullif(trim(p_comentario), ''));
end $$;
grant execute on function cambiar_estado_reclamo(text, text, text) to authenticated;

-- ── 4) Seguimiento: reiterar, responder, traspasar, derivar ──────
create or replace function reiterar_reclamo(p_id text, p_comentario text default null, p_fecha date default null) returns int
language plpgsql security definer set search_path = public as $$
declare v_usuario text := lower(auth.email()); v_n int; v_fecha timestamptz := reclamos_fecha_evento_(p_fecha);
begin
  if reclamos_rol_() is null then raise exception 'Usuario no habilitado'; end if;
  update reclamos set reiteraciones = reiteraciones + 1, actualizado_at = now()
   where id = p_id and estado <> 'Cerrado' returning reiteraciones into v_n;
  if v_n is null then raise exception 'El reclamo % no existe o está cerrado', p_id; end if;
  insert into reclamos_eventos (reclamo_id, usuario, tipo, comentario, fecha)
  values (p_id, v_usuario, 'reiteracion', 'Reclamado de nuevo (vez ' || (v_n + 1) || ')' ||
          coalesce(' · ' || nullif(trim(p_comentario), ''), ''), v_fecha);
  return v_n;
end $$;
grant execute on function reiterar_reclamo(text, text, date) to authenticated;

create or replace function responder_reclamo(p_id text, p_texto text, p_fecha date default null) returns int
language plpgsql security definer set search_path = public as $$
declare v_usuario text := lower(auth.email()); v_n int; v_fecha timestamptz := reclamos_fecha_evento_(p_fecha);
begin
  if reclamos_rol_() is null then raise exception 'Usuario no habilitado'; end if;
  if coalesce(trim(p_texto), '') = '' then raise exception 'Escribí qué respondió el proveedor'; end if;
  update reclamos set respuestas = respuestas + 1, actualizado_at = now()
   where id = p_id and estado <> 'Cerrado' returning respuestas into v_n;
  if v_n is null then raise exception 'El reclamo % no existe o está cerrado', p_id; end if;
  insert into reclamos_eventos (reclamo_id, usuario, tipo, comentario, fecha)
  values (p_id, v_usuario, 'respuesta', trim(p_texto), v_fecha);
  return v_n;
end $$;
grant execute on function responder_reclamo(text, text, date) to authenticated;

create or replace function asignar_reclamo(p_id text, p_responsable text, p_comentario text default null) returns void
language plpgsql security definer set search_path = public as $$
declare v_yo text := lower(auth.email()); v_dest text := lower(trim(p_responsable)); r reclamos%rowtype;
begin
  if reclamos_rol_() is null then raise exception 'Usuario no habilitado'; end if;
  select * into r from reclamos where id = p_id for update;
  if r.id is null then raise exception 'No existe el reclamo %', p_id; end if;
  if reclamos_rol_() <> 'gestor' and r.responsable is distinct from v_yo then
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
grant execute on function asignar_reclamo(text, text, text) to authenticated;

create or replace function derivar_reclamo(p_id text, p_area text, p_comentario text default null) returns int
language plpgsql security definer set search_path = public as $$
declare v_usuario text := lower(auth.email()); v_ant text; v_n int;
begin
  if reclamos_rol_() is distinct from 'gestor' then raise exception 'Sólo un gestor puede derivar'; end if;
  if not exists (select 1 from reclamos_opciones where lista = 'area' and valor = p_area and activo) then
    raise exception 'Área no válida: %', p_area;
  end if;
  select area_actual into v_ant from reclamos where id = p_id for update;
  if v_ant is null then raise exception 'No existe el reclamo %', p_id; end if;
  if v_ant = p_area then return null; end if;
  update reclamos set area_actual = p_area, devoluciones = devoluciones + 1, actualizado_at = now()
   where id = p_id returning devoluciones into v_n;
  insert into reclamos_eventos (reclamo_id, usuario, tipo, estado_anterior, estado_nuevo, comentario)
  values (p_id, v_usuario, 'derivacion', v_ant, p_area, nullif(trim(p_comentario), ''));
  return v_n;
end $$;
grant execute on function derivar_reclamo(text, text, text) to authenticated;

-- ── 5) Historial: editar, anular, eliminar movimientos ───────────
create or replace function editar_evento(p_evento_id bigint, p_texto text, p_fecha date default null) returns void
language plpgsql security definer set search_path = public as $$
declare v_usuario text := lower(auth.email()); e reclamos_eventos%rowtype; v_rol text := reclamos_rol_(); v_fecha timestamptz;
begin
  if v_rol is null then raise exception 'Usuario no habilitado'; end if;
  select * into e from reclamos_eventos where id = p_evento_id for update;
  if e.id is null then raise exception 'No existe el movimiento'; end if;
  if e.anulado then raise exception 'No se puede editar un movimiento anulado'; end if;
  if e.tipo in ('alta', 'edicion', 'anulacion', 'restauracion') then raise exception 'Este movimiento no se puede editar'; end if;
  if v_rol <> 'gestor' and e.usuario is distinct from v_usuario then
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
    editado_por = v_usuario, editado_at = now()
  where id = e.id;
end $$;
grant execute on function editar_evento(bigint, text, date) to authenticated;

create or replace function anular_evento(p_evento_id bigint, p_motivo text default null) returns void
language plpgsql security definer set search_path = public as $$
declare v_usuario text := lower(auth.email()); e reclamos_eventos%rowtype; r reclamos%rowtype; v_ultimo bigint; v_desc text;
begin
  if reclamos_rol_() is distinct from 'gestor' then raise exception 'Sólo un gestor puede anular movimientos'; end if;
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

  update reclamos_eventos set anulado = true, anulado_por = v_usuario, anulado_at = now() where id = e.id;
  insert into reclamos_eventos (reclamo_id, usuario, tipo, comentario)
  values (r.id, v_usuario, 'anulacion', 'Anuló ' || v_desc || coalesce(' · ' || nullif(trim(p_motivo), ''), ''));
end $$;
grant execute on function anular_evento(bigint, text) to authenticated;

create or replace function eliminar_evento(p_evento_id bigint, p_motivo text) returns void
language plpgsql security definer set search_path = public as $$
declare v_usuario text := lower(auth.email()); e reclamos_eventos%rowtype; r reclamos%rowtype; v_ultimo bigint;
begin
  if reclamos_rol_() is distinct from 'gestor' then raise exception 'Sólo un gestor puede eliminar movimientos'; end if;
  if coalesce(trim(p_motivo), '') = '' then raise exception 'Escribí el motivo de la eliminación'; end if;
  select * into e from reclamos_eventos where id = p_evento_id for update;
  if e.id is null then raise exception 'No existe el movimiento'; end if;
  if e.tipo = 'alta' then raise exception 'El alta del reclamo no se puede eliminar (para eso está anular el reclamo completo)'; end if;

  if not e.anulado then
    select * into r from reclamos where id = e.reclamo_id for update;
    if e.tipo = 'reiteracion' then
      update reclamos set reiteraciones = greatest(reiteraciones - 1, 0), actualizado_at = now() where id = r.id;
    elsif e.tipo = 'respuesta' then
      update reclamos set respuestas = greatest(respuestas - 1, 0), actualizado_at = now() where id = r.id;
    elsif e.tipo = 'asignacion' then
      select id into v_ultimo from reclamos_eventos
       where reclamo_id = r.id and tipo = 'asignacion' and not anulado order by fecha desc, id desc limit 1;
      if v_ultimo <> e.id or r.responsable is distinct from e.estado_nuevo then
        raise exception 'Sólo se puede eliminar el último traspaso (o anularlo primero)';
      end if;
      update reclamos set responsable = nullif(e.estado_anterior, 'sin asignar'), actualizado_at = now() where id = r.id;
    elsif e.tipo = 'derivacion' then
      select id into v_ultimo from reclamos_eventos
       where reclamo_id = r.id and tipo = 'derivacion' and not anulado order by fecha desc, id desc limit 1;
      if v_ultimo <> e.id or r.area_actual is distinct from e.estado_nuevo then
        raise exception 'Sólo se puede eliminar la última derivación (o anularla primero)';
      end if;
      update reclamos set area_actual = e.estado_anterior, devoluciones = greatest(devoluciones - 1, 0), actualizado_at = now() where id = r.id;
    elsif e.tipo = 'estado' then
      select id into v_ultimo from reclamos_eventos
       where reclamo_id = r.id and tipo = 'estado' and not anulado order by fecha desc, id desc limit 1;
      if v_ultimo <> e.id or r.estado is distinct from e.estado_nuevo then
        raise exception 'Sólo se puede eliminar el último cambio de estado (o anularlo primero)';
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
    end if;
  end if;

  delete from reclamos_eventos where id = e.id;
end $$;
grant execute on function eliminar_evento(bigint, text) to authenticated;

-- ── 6) Anular / restaurar el reclamo completo ────────────────────
create or replace function anular_reclamo(p_id text, p_motivo text default null) returns void
language plpgsql security definer set search_path = public as $$
declare v_usuario text := lower(auth.email()); r reclamos%rowtype;
begin
  if reclamos_rol_() is distinct from 'gestor' then raise exception 'Sólo un gestor puede anular un reclamo'; end if;
  select * into r from reclamos where id = p_id for update;
  if r.id is null then raise exception 'No existe el reclamo %', p_id; end if;
  if r.anulado then raise exception 'El reclamo ya estaba anulado'; end if;
  update reclamos set anulado = true, anulado_por = v_usuario, anulado_at = now(),
         anulado_motivo = nullif(trim(p_motivo), ''), actualizado_at = now()
   where id = p_id;
  insert into reclamos_eventos (reclamo_id, usuario, tipo, comentario)
  values (p_id, v_usuario, 'anulacion', 'Anuló el reclamo' || coalesce(' · ' || nullif(trim(p_motivo), ''), ''));
end $$;
grant execute on function anular_reclamo(text, text) to authenticated;

create or replace function restaurar_reclamo(p_id text) returns void
language plpgsql security definer set search_path = public as $$
declare v_usuario text := lower(auth.email()); r reclamos%rowtype;
begin
  if reclamos_rol_() is distinct from 'gestor' then raise exception 'Sólo un gestor puede restaurar un reclamo'; end if;
  select * into r from reclamos where id = p_id for update;
  if r.id is null then raise exception 'No existe el reclamo %', p_id; end if;
  if not r.anulado then raise exception 'El reclamo no está anulado'; end if;
  update reclamos set anulado = false, anulado_por = null, anulado_at = null, anulado_motivo = null, actualizado_at = now()
   where id = p_id;
  insert into reclamos_eventos (reclamo_id, usuario, tipo, comentario)
  values (p_id, v_usuario, 'restauracion', 'Restauró el reclamo');
end $$;
grant execute on function restaurar_reclamo(text) to authenticated;

-- ── 7) Tareas de Desarrollo ───────────────────────────────────────
create or replace function crear_tarea(p_titulo text, p_detalle text default null,
  p_area text default 'General', p_prioridad text default 'Media') returns bigint
language plpgsql security definer set search_path = public as $$
declare v_usuario text := lower(auth.email()); v_id bigint;
begin
  if reclamos_rol_() is distinct from 'gestor' then raise exception 'Sólo un gestor puede cargar tareas'; end if;
  if coalesce(trim(p_titulo), '') = '' then raise exception 'Falta el título de la tarea'; end if;
  insert into dev_tareas (titulo, detalle, area, prioridad, creado_por)
  values (trim(p_titulo), nullif(trim(p_detalle), ''), coalesce(nullif(p_area, ''), 'General'),
          coalesce(nullif(p_prioridad, ''), 'Media'), v_usuario)
  returning id into v_id;
  return v_id;
end $$;
grant execute on function crear_tarea(text, text, text, text) to authenticated;

create or replace function actualizar_tarea(p_id bigint, p_estado text default null,
  p_titulo text default null, p_detalle text default null, p_area text default null, p_prioridad text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare v_usuario text := lower(auth.email());
begin
  if reclamos_rol_() is distinct from 'gestor' then raise exception 'Sólo un gestor puede modificar tareas'; end if;
  if p_titulo is not null and trim(p_titulo) = '' then raise exception 'El título no puede quedar vacío'; end if;
  update dev_tareas set
    estado = coalesce(p_estado, estado),
    titulo = coalesce(trim(p_titulo), titulo),
    detalle = case when p_detalle is null then detalle else nullif(trim(p_detalle), '') end,
    area = coalesce(p_area, area),
    prioridad = coalesce(p_prioridad, prioridad),
    completado_por = case when p_estado = 'Hecho' then v_usuario
                          when p_estado is not null then null else completado_por end,
    completado_at = case when p_estado = 'Hecho' then now()
                         when p_estado is not null then null else completado_at end,
    actualizado_at = now()
  where id = p_id;
  if not found then raise exception 'No existe la tarea %', p_id; end if;
end $$;
grant execute on function actualizar_tarea(bigint, text, text, text, text, text) to authenticated;

-- ── 8) Borrar el sistema de login/sesión de ayer ─────────────────
drop function if exists reclamos_password_valida_(text);
drop function if exists reclamos_crear_sesion_(text);
drop function if exists reclamos_estado_login(text);
drop function if exists reclamos_crear_password(text, text);
drop function if exists reclamos_verificar_login(text, text);
drop function if exists reclamos_verificar_sesion(text);
drop function if exists reclamos_cerrar_sesion(text);

drop table if exists reclamos_sesiones;

alter table reclamos_usuarios drop column if exists password_hash;

-- ── 9) La lectura también exige sesión (antes era pública) ───────
drop policy if exists "lectura reclamos_usuarios" on reclamos_usuarios;
create policy "lectura reclamos_usuarios" on reclamos_usuarios for select using (auth.role() = 'authenticated');

drop policy if exists "lectura reclamos_proveedores" on reclamos_proveedores;
create policy "lectura reclamos_proveedores" on reclamos_proveedores for select using (auth.role() = 'authenticated');

drop policy if exists "lectura reclamos_categorias" on reclamos_categorias;
create policy "lectura reclamos_categorias" on reclamos_categorias for select using (auth.role() = 'authenticated');

drop policy if exists "lectura reclamos" on reclamos;
create policy "lectura reclamos" on reclamos for select using (auth.role() = 'authenticated');

drop policy if exists "lectura reclamos_eventos" on reclamos_eventos;
create policy "lectura reclamos_eventos" on reclamos_eventos for select using (auth.role() = 'authenticated');

drop policy if exists "lectura reclamos_opciones" on reclamos_opciones;
create policy "lectura reclamos_opciones" on reclamos_opciones for select using (auth.role() = 'authenticated');

drop policy if exists "lectura dev_tareas" on dev_tareas;
create policy "lectura dev_tareas" on dev_tareas for select using (auth.role() = 'authenticated');

notify pgrst, 'reload schema';
