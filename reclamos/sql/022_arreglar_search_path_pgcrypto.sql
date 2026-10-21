-- ════════════════════════════════════════════════════════════════
--  RECLAMOS — arregla "function gen_salt(unknown) does not exist"
--  pgcrypto en Supabase se instala por defecto en el esquema "extensions",
--  no en "public". Las funciones de 019 tenían fijado search_path = public
--  a secas, así que no encontraban gen_salt/crypt/gen_random_bytes/digest.
--  Se les agrega "extensions" al search_path.
--  Correr una sola vez en Supabase > SQL Editor.
-- ════════════════════════════════════════════════════════════════

alter function reclamos_crear_sesion_(text) set search_path = public, extensions;
alter function reclamos_crear_password(text, text) set search_path = public, extensions;
alter function reclamos_verificar_login(text, text) set search_path = public, extensions;
alter function reclamos_verificar_sesion(text) set search_path = public, extensions;
alter function reclamos_cerrar_sesion(text) set search_path = public, extensions;
