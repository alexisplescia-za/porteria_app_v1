-- ════════════════════════════════════════════════════════════════
--  RECLAMOS — eliminar un movimiento del historial (de verdad, sin vuelta atrás)
--  Hasta ahora sólo se podía "Anular" (queda tachado, guardado, se puede
--  restaurar). Esto agrega "Eliminar": borra la fila para siempre.
--
--  Reglas (sólo gestor, y siempre con motivo obligatorio):
--  · El alta del reclamo no se puede eliminar (para borrar el reclamo entero
--    existe "Anular reclamo").
--  · Si el movimiento ya estaba anulado, sus efectos (contadores, estado)
--    ya se habían revertido al anularlo: se borra sin más.
--  · Si todavía estaba activo y es de un tipo con efecto en el reclamo
--    (reiteración, respuesta, traspaso, derivación, cambio de estado), se
--    revierte ese efecto antes de borrar — mismas reglas que "Anular"
--    (traspaso/derivación/estado: sólo el último de su tipo).
--  · Comentario, edición, anulación y restauración no tienen contador
--    asociado (son sólo texto en el historial): se pueden eliminar directo.
--
--  Correr una sola vez en Supabase > SQL Editor.
-- ════════════════════════════════════════════════════════════════

create or replace function eliminar_evento(p_usuario text, p_evento_id bigint, p_motivo text) returns void
language plpgsql security definer set search_path = public as $$
declare e reclamos_eventos%rowtype; r reclamos%rowtype; v_ultimo bigint;
begin
  if reclamos_rol_(p_usuario) is distinct from 'gestor' then raise exception 'Sólo un gestor puede eliminar movimientos'; end if;
  if coalesce(trim(p_motivo), '') = '' then raise exception 'Escribí el motivo de la eliminación'; end if;
  select * into e from reclamos_eventos where id = p_evento_id for update;
  if e.id is null then raise exception 'No existe el movimiento'; end if;
  if e.tipo = 'alta' then raise exception 'El alta del reclamo no se puede eliminar (para eso está anular el reclamo completo)'; end if;

  -- Si ya estaba anulado, sus efectos ya se revirtieron: se borra sin más.
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

grant execute on function eliminar_evento(text, bigint, text) to anon;
