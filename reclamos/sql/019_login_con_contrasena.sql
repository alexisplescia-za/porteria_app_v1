-- ════════════════════════════════════════════════════════════════
--  RECLAMOS — login con contraseña
--  Hasta ahora alcanzaba con escribir cualquier mail habilitado para entrar
--  como esa persona. Ahora cada usuario elige su contraseña la primera vez
--  que entra ("primer ingreso") y la usa de ahí en más.
--
--  · La contraseña se guarda hasheada (bcrypt, vía pgcrypto). La columna
--    password_hash nunca es legible por el cliente (ni con el anon key):
--    sólo las funciones de abajo —que corren con permisos propios— pueden
--    leerla y compararla.
--  · "Recordame en este navegador": al entrar con contraseña se genera un
--    token al azar (reclamos_sesiones) que el navegador guarda; la próxima
--    vez entra sin pedir contraseña de nuevo EN ESE navegador. La tabla de
--    sesiones no tiene política de lectura: nadie puede leerla directo.
--  · Para resetear la contraseña de alguien (la olvidó, cambió de persona
--    el mail, etc.): Supabase > Table editor > reclamos_usuarios > poner
--    su password_hash en NULL. En su próximo ingreso vuelve a pedirle que
--    elija una.
--
--  Importante (léase antes de asumir que esto cierra todos los problemas):
--  las funciones de reclamos (cambiar_estado_reclamo, anular_reclamo, etc.)
--  siguen confiando en el mail que les manda el navegador como parámetro,
--  sin verificar sesión. Esto tapa la puerta de entrada (ya no alcanza con
--  escribir el mail de otro para entrar a la app), pero no impide que
--  alguien con conocimientos técnicos llame a esas funciones directo con
--  el anon key. Cerrar eso del todo requiere migrar a sesiones reales
--  (Supabase Auth) — pendiente, no es parte de este cambio.
--
--  Correr una sola vez en Supabase > SQL Editor.
-- ════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

alter table reclamos_usuarios add column if not exists password_hash text;

-- La columna de la contraseña nunca se puede pedir por select, ni con el anon key.
revoke select (password_hash) on reclamos_usuarios from anon, authenticated;

create table if not exists reclamos_sesiones (
  token_hash text primary key,
  email      text not null references reclamos_usuarios(email) on delete cascade,
  creado_at  timestamptz not null default now()
);
create index if not exists idx_reclamos_sesiones_email on reclamos_sesiones (email);
alter table reclamos_sesiones enable row level security;
-- Sin política de lectura a propósito: nadie la puede leer directo, ni con el anon key.
-- Sólo se accede a través de las funciones de abajo (corren con permisos propios).

-- ── Funciones ────────────────────────────────────────────────────

-- Nunca confiar sólo en la validación del navegador.
create or replace function reclamos_password_valida_(p_password text) returns boolean
language sql immutable as $$
  select p_password is not null
    and length(p_password) >= 8
    and p_password ~ '[A-Z]'
    and p_password ~ '[a-z]'
    and p_password ~ '[0-9]';
$$;

-- Token al azar para "recordame en este navegador". Sólo se usa desde adentro
-- de las dos funciones de abajo (no se expone como RPC propio).
create or replace function reclamos_crear_sesion_(p_email text) returns text
language plpgsql security definer set search_path = public as $$
declare v_token text := encode(gen_random_bytes(32), 'hex');
begin
  insert into reclamos_sesiones (token_hash, email) values (encode(digest(v_token, 'sha256'), 'hex'), p_email);
  return v_token;
end $$;
revoke execute on function reclamos_crear_sesion_(text) from public;

-- Primer paso del login: ¿el mail existe y ya eligió contraseña o es su primera vez?
create or replace function reclamos_estado_login(p_email text) returns json
language plpgsql security definer set search_path = public as $$
declare u reclamos_usuarios%rowtype;
begin
  select * into u from reclamos_usuarios where email = lower(trim(p_email)) and activo;
  if not found then return json_build_object('existe', false); end if;
  return json_build_object('existe', true, 'primer_ingreso', u.password_hash is null);
end $$;

-- Primer ingreso: elige contraseña. Sólo funciona si todavía no tiene una.
create or replace function reclamos_crear_password(p_email text, p_password text) returns json
language plpgsql security definer set search_path = public as $$
declare u reclamos_usuarios%rowtype; v_token text;
begin
  select * into u from reclamos_usuarios where email = lower(trim(p_email)) and activo for update;
  if not found then raise exception 'Mail no habilitado'; end if;
  if u.password_hash is not null then raise exception 'Ya elegiste tu contraseña. Iniciá sesión con ella.'; end if;
  if not reclamos_password_valida_(p_password) then
    raise exception 'La contraseña tiene que tener al menos 8 caracteres, una mayúscula, una minúscula y un número.';
  end if;
  update reclamos_usuarios set password_hash = crypt(p_password, gen_salt('bf')) where email = u.email;
  v_token := reclamos_crear_sesion_(u.email);
  return json_build_object('email', u.email, 'nombre', u.nombre, 'rol', u.rol, 'sesion', v_token);
end $$;

-- Ingresos siguientes: valida la contraseña elegida.
create or replace function reclamos_verificar_login(p_email text, p_password text) returns json
language plpgsql security definer set search_path = public as $$
declare u reclamos_usuarios%rowtype; v_token text;
begin
  select * into u from reclamos_usuarios where email = lower(trim(p_email)) and activo;
  if not found or u.password_hash is null then raise exception 'Mail o contraseña incorrectos.'; end if;
  if crypt(p_password, u.password_hash) is distinct from u.password_hash then
    raise exception 'Mail o contraseña incorrectos.';
  end if;
  v_token := reclamos_crear_sesion_(u.email);
  return json_build_object('email', u.email, 'nombre', u.nombre, 'rol', u.rol, 'sesion', v_token);
end $$;

-- "Recordame": valida el token guardado en el navegador. Expira solo a los 180 días.
create or replace function reclamos_verificar_sesion(p_token text) returns json
language plpgsql security definer set search_path = public as $$
declare u reclamos_usuarios%rowtype; v_hash text := encode(digest(coalesce(p_token, ''), 'sha256'), 'hex');
begin
  select u2.* into u from reclamos_sesiones s join reclamos_usuarios u2 on u2.email = s.email
   where s.token_hash = v_hash and s.creado_at > now() - interval '180 days' and u2.activo;
  if not found then return json_build_object('ok', false); end if;
  return json_build_object('ok', true, 'email', u.email, 'nombre', u.nombre, 'rol', u.rol);
end $$;

-- Al tocar "Salir" se invalida el token para que no se pueda reusar.
create or replace function reclamos_cerrar_sesion(p_token text) returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from reclamos_sesiones where token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex');
end $$;

grant execute on function reclamos_estado_login(text) to anon;
grant execute on function reclamos_crear_password(text, text) to anon;
grant execute on function reclamos_verificar_login(text, text) to anon;
grant execute on function reclamos_verificar_sesion(text) to anon;
grant execute on function reclamos_cerrar_sesion(text) to anon;
