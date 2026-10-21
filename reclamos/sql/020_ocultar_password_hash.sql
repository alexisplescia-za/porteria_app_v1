-- ════════════════════════════════════════════════════════════════
--  RECLAMOS — tapar un agujero del 019: password_hash se podía leer
--  El revoke de 019 se lo sacó a anon/authenticated, pero el permiso de
--  lectura de esta base viene de un grant a PUBLIC (aplica a todos los
--  roles, incluido anon), así que no alcanzaba. Esto lo corrige.
--  Correr una sola vez en Supabase > SQL Editor.
-- ════════════════════════════════════════════════════════════════

revoke select (password_hash) on reclamos_usuarios from public;
