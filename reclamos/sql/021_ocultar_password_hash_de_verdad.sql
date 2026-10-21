-- ════════════════════════════════════════════════════════════════
--  RECLAMOS — ahora sí: tapar password_hash
--  Los dos intentos anteriores (019, 020) no alcanzaban porque anon tenía
--  un permiso de SELECT a NIVEL DE TABLA ENTERA (cubre todas las columnas
--  sin excepción). Un revoke a nivel de columna no puede recortar un
--  permiso de tabla completa — sólo sirve para dar acceso a columnas
--  puntuales cuando NO hay ese permiso general. Por eso password_hash
--  seguía siendo legible pese al revoke.
--  La solución: sacar el permiso de la tabla entera y volver a darlo sólo
--  en las columnas que sí tienen que ser públicas.
--  Correr una sola vez en Supabase > SQL Editor.
-- ════════════════════════════════════════════════════════════════

revoke select on reclamos_usuarios from anon, authenticated, public;
grant select (email, nombre, rol, activo) on reclamos_usuarios to anon, authenticated;

notify pgrst, 'reload schema';
