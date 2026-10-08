-- ════════════════════════════════════════════════════════════════
--  RECLAMOS A PROVEEDORES — Eficiencia Energética
--  Central Mantenimiento App · mismo proyecto de Supabase que Frío Alimentario
--  Correr una sola vez en: Supabase > SQL Editor > New query > Run.
-- ════════════════════════════════════════════════════════════════

-- Quién puede entrar. gestor = carga, cambia estados y cierra · carga = sólo carga y comenta.
create table if not exists reclamos_usuarios (
  email  text primary key,
  nombre text,
  rol    text not null default 'gestor' check (rol in ('gestor', 'carga')),
  activo boolean not null default true
);

create table if not exists reclamos_proveedores (
  nombre    text primary key,
  contacto  text,
  mail      text,
  sla_alta  int not null default 2,    -- días máximos según prioridad (para la Fase 2)
  sla_media int not null default 5,
  sla_baja  int not null default 10,
  orden     int not null default 0,
  activo    boolean not null default true
);

create table if not exists reclamos_categorias (
  nombre text primary key,
  orden  int not null default 0,
  activo boolean not null default true
);

create table if not exists reclamos (
  id               text primary key,                 -- REC-AAAAMMDD-NN (lo genera crear_reclamo)
  fecha_alta       timestamptz not null default now(),
  proveedor        text not null references reclamos_proveedores(nombre) on update cascade,
  tienda_numero    int references tiendas(numero),
  categoria        text not null,
  descripcion      text not null,
  prioridad        text not null default 'Media' check (prioridad in ('Alta', 'Media', 'Baja')),
  canal            text,
  estado           text not null default 'Nuevo' check (estado in
                     ('Nuevo', 'Enviado al proveedor', 'Respuesta proveedor', 'En resolución',
                      'Pendiente validación', 'Escalado', 'Reabierto', 'Cerrado')),
  responsable      text,
  fecha_compromiso date,
  fecha_cierre     timestamptz,
  referencia       text,                              -- OT SAP, ticket Mantech, asunto del mail
  reaperturas      int not null default 0,
  creado_por       text,
  actualizado_at   timestamptz not null default now()
);
create index if not exists idx_reclamos_estado on reclamos (estado);
create index if not exists idx_reclamos_proveedor on reclamos (proveedor);

-- Historial: cada alta, cambio de estado, edición o comentario.
create table if not exists reclamos_eventos (
  id              bigserial primary key,
  reclamo_id      text not null references reclamos(id) on delete cascade,
  fecha           timestamptz not null default now(),
  usuario         text,
  tipo            text not null default 'estado' check (tipo in ('alta', 'estado', 'edicion', 'comentario')),
  estado_anterior text,
  estado_nuevo    text,
  comentario      text
);
create index if not exists idx_reclamos_eventos on reclamos_eventos (reclamo_id, fecha);

-- ── Seguridad ────────────────────────────────────────────────────
-- Lectura pública (igual que el resto de la app, sin login real).
-- Nadie escribe directo en las tablas: todo pasa por las funciones de abajo, que validan
-- que el mail esté habilitado, generan el ID sin choques y dejan el historial.
alter table reclamos_usuarios    enable row level security;
alter table reclamos_proveedores enable row level security;
alter table reclamos_categorias  enable row level security;
alter table reclamos             enable row level security;
alter table reclamos_eventos     enable row level security;

create policy "lectura reclamos_usuarios"    on reclamos_usuarios    for select using (true);
create policy "lectura reclamos_proveedores" on reclamos_proveedores for select using (true);
create policy "lectura reclamos_categorias"  on reclamos_categorias  for select using (true);
create policy "lectura reclamos"             on reclamos             for select using (true);
create policy "lectura reclamos_eventos"     on reclamos_eventos     for select using (true);

-- ── Funciones ────────────────────────────────────────────────────
create or replace function reclamos_rol_(p_usuario text) returns text
language sql stable security definer set search_path = public as $$
  select rol from reclamos_usuarios where email = lower(trim(p_usuario)) and activo
$$;

create or replace function crear_reclamo(
  p_usuario text, p_proveedor text, p_tienda int, p_categoria text, p_descripcion text,
  p_prioridad text default 'Media', p_canal text default null, p_responsable text default null,
  p_compromiso date default null, p_referencia text default null
) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_dia text := to_char(now() at time zone 'America/Argentina/Buenos_Aires', 'YYYYMMDD');
  v_n   int;
  v_id  text;
begin
  if reclamos_rol_(p_usuario) is null then raise exception 'Usuario no habilitado para cargar reclamos'; end if;
  if coalesce(trim(p_descripcion), '') = '' then raise exception 'Falta la descripción'; end if;
  -- Un candado por día: dos altas simultáneas nunca reciben el mismo número.
  perform pg_advisory_xact_lock(hashtext('reclamos_' || v_dia));
  select coalesce(max(split_part(id, '-', 3)::int), 0) + 1 into v_n
    from reclamos where id like 'REC-' || v_dia || '-%';
  v_id := 'REC-' || v_dia || '-' || lpad(v_n::text, 2, '0');
  insert into reclamos (id, proveedor, tienda_numero, categoria, descripcion, prioridad, canal,
                        responsable, fecha_compromiso, referencia, creado_por)
  values (v_id, p_proveedor, p_tienda, p_categoria, trim(p_descripcion), coalesce(p_prioridad, 'Media'),
          p_canal, coalesce(nullif(trim(p_responsable), ''),
                            (select nombre from reclamos_usuarios where email = lower(trim(p_usuario))),
                            lower(trim(p_usuario))), p_compromiso,
          nullif(trim(p_referencia), ''), lower(trim(p_usuario)));
  insert into reclamos_eventos (reclamo_id, usuario, tipo, estado_nuevo, comentario)
  values (v_id, lower(trim(p_usuario)), 'alta', 'Nuevo', 'Reclamo creado');
  return v_id;
end $$;

create or replace function cambiar_estado_reclamo(
  p_usuario text, p_id text, p_estado text, p_comentario text default null
) returns void
language plpgsql security definer set search_path = public as $$
declare v_ant text;
begin
  if reclamos_rol_(p_usuario) is distinct from 'gestor' then raise exception 'Sólo un gestor puede cambiar el estado'; end if;
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
  values (p_id, lower(trim(p_usuario)), 'estado', v_ant, p_estado, nullif(trim(p_comentario), ''));
end $$;

create or replace function editar_reclamo(
  p_usuario text, p_id text, p_responsable text, p_compromiso date, p_prioridad text, p_referencia text
) returns void
language plpgsql security definer set search_path = public as $$
declare r reclamos%rowtype; v_cambios text := '';
begin
  if reclamos_rol_(p_usuario) is distinct from 'gestor' then raise exception 'Sólo un gestor puede editar'; end if;
  select * into r from reclamos where id = p_id for update;
  if r.id is null then raise exception 'No existe el reclamo %', p_id; end if;
  if r.responsable is distinct from nullif(trim(p_responsable), '') then v_cambios := v_cambios || 'responsable · '; end if;
  if r.fecha_compromiso is distinct from p_compromiso then v_cambios := v_cambios || 'fecha compromiso · '; end if;
  if r.prioridad is distinct from p_prioridad then v_cambios := v_cambios || 'prioridad · '; end if;
  if r.referencia is distinct from nullif(trim(p_referencia), '') then v_cambios := v_cambios || 'referencia · '; end if;
  if v_cambios = '' then return; end if;
  update reclamos set responsable = nullif(trim(p_responsable), ''), fecha_compromiso = p_compromiso,
         prioridad = p_prioridad, referencia = nullif(trim(p_referencia), ''), actualizado_at = now()
   where id = p_id;
  insert into reclamos_eventos (reclamo_id, usuario, tipo, comentario)
  values (p_id, lower(trim(p_usuario)), 'edicion', 'Editó: ' || rtrim(v_cambios, ' · '));
end $$;

create or replace function comentar_reclamo(p_usuario text, p_id text, p_comentario text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if reclamos_rol_(p_usuario) is null then raise exception 'Usuario no habilitado'; end if;
  if coalesce(trim(p_comentario), '') = '' then raise exception 'El comentario está vacío'; end if;
  insert into reclamos_eventos (reclamo_id, usuario, tipo, comentario)
  values (p_id, lower(trim(p_usuario)), 'comentario', trim(p_comentario));
  update reclamos set actualizado_at = now() where id = p_id;
end $$;

grant execute on function crear_reclamo(text, text, int, text, text, text, text, text, date, text) to anon;
grant execute on function cambiar_estado_reclamo(text, text, text, text) to anon;
grant execute on function editar_reclamo(text, text, text, date, text, text) to anon;
grant execute on function comentar_reclamo(text, text, text) to anon;

-- ── Datos iniciales (se editan desde Supabase > Table editor) ────
insert into reclamos_usuarios (email, nombre, rol) values
  ('alexis_plescia@carrefour.com', 'Alexis Plescia', 'gestor'),
  ('gustavo_granero@carrefour.com', 'Gustavo Granero', 'gestor'),
  ('lucas_concetti@carrefour.com', 'Lucas Concetti', 'gestor'),
  ('monica_belcraz@carrefour.com', 'Mónica Belcraz', 'gestor')
on conflict (email) do nothing;

insert into reclamos_proveedores (nombre, orden) values ('BMS', 1), ('PME', 2), ('Otro', 9)
on conflict (nombre) do nothing;

insert into reclamos_categorias (nombre, orden) values
  ('Sin comunicación / telegestión', 1),
  ('Medición o lectura de energía', 2),
  ('Iluminación', 3),
  ('Climatización / HVAC', 4),
  ('Refrigeración', 5),
  ('Energía reactiva / capacitores', 6),
  ('Grupo electrógeno', 7),
  ('Datos / reportes / facturación', 8)
on conflict (nombre) do nothing;
