-- ════════════════════════════════════════════════════════════════
--  RECLAMOS — anular un reclamo cargado por error (y restaurarlo)
--  · No se borra: queda marcado con quién, cuándo y por qué, y deja de contar
--    en la lista, los KPIs, el seguimiento y el backup.
--  · Sólo gestores. Se puede restaurar.
--  Correr una sola vez en Supabase > SQL Editor.
-- ════════════════════════════════════════════════════════════════

alter table reclamos add column if not exists anulado boolean not null default false;
alter table reclamos add column if not exists anulado_por text;
alter table reclamos add column if not exists anulado_at timestamptz;
alter table reclamos add column if not exists anulado_motivo text;

alter table reclamos_eventos drop constraint if exists reclamos_eventos_tipo_check;
alter table reclamos_eventos add constraint reclamos_eventos_tipo_check
  check (tipo in ('alta', 'estado', 'edicion', 'comentario', 'reiteracion', 'derivacion', 'anulacion', 'restauracion'));

create or replace function anular_reclamo(p_usuario text, p_id text, p_motivo text default null) returns void
language plpgsql security definer set search_path = public as $$
declare r reclamos%rowtype;
begin
  if reclamos_rol_(p_usuario) is distinct from 'gestor' then raise exception 'Sólo un gestor puede anular un reclamo'; end if;
  select * into r from reclamos where id = p_id for update;
  if r.id is null then raise exception 'No existe el reclamo %', p_id; end if;
  if r.anulado then raise exception 'El reclamo ya estaba anulado'; end if;
  update reclamos set anulado = true, anulado_por = lower(trim(p_usuario)), anulado_at = now(),
         anulado_motivo = nullif(trim(p_motivo), ''), actualizado_at = now()
   where id = p_id;
  insert into reclamos_eventos (reclamo_id, usuario, tipo, comentario)
  values (p_id, lower(trim(p_usuario)), 'anulacion', 'Anuló el reclamo' || coalesce(' · ' || nullif(trim(p_motivo), ''), ''));
end $$;

create or replace function restaurar_reclamo(p_usuario text, p_id text) returns void
language plpgsql security definer set search_path = public as $$
declare r reclamos%rowtype;
begin
  if reclamos_rol_(p_usuario) is distinct from 'gestor' then raise exception 'Sólo un gestor puede restaurar un reclamo'; end if;
  select * into r from reclamos where id = p_id for update;
  if r.id is null then raise exception 'No existe el reclamo %', p_id; end if;
  if not r.anulado then raise exception 'El reclamo no está anulado'; end if;
  update reclamos set anulado = false, anulado_por = null, anulado_at = null, anulado_motivo = null, actualizado_at = now()
   where id = p_id;
  insert into reclamos_eventos (reclamo_id, usuario, tipo, comentario)
  values (p_id, lower(trim(p_usuario)), 'restauracion', 'Restauró el reclamo');
end $$;

-- Un comentario de restauración tampoco se edita (igual que las anulaciones).
create or replace function editar_comentario_evento(p_usuario text, p_evento_id bigint, p_texto text) returns void
language plpgsql security definer set search_path = public as $$
declare e reclamos_eventos%rowtype; v_rol text := reclamos_rol_(p_usuario);
begin
  if v_rol is null then raise exception 'Usuario no habilitado'; end if;
  select * into e from reclamos_eventos where id = p_evento_id for update;
  if e.id is null then raise exception 'No existe el movimiento'; end if;
  if e.anulado then raise exception 'No se puede editar un movimiento anulado'; end if;
  if e.tipo in ('alta', 'edicion', 'anulacion', 'restauracion') then raise exception 'Este movimiento no tiene comentario editable'; end if;
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

grant execute on function anular_reclamo(text, text, text) to anon;
grant execute on function restaurar_reclamo(text, text) to anon;
