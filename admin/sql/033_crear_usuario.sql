-- 033 — Crear usuario desde el panel de admin
-- Inserta directamente en auth.users y auth.identities con security definer.
-- El password se hashea con pgcrypto (bcrypt) como lo hace Supabase Auth.

CREATE OR REPLACE FUNCTION public.admin_crear_usuario(
  p_email     TEXT,
  p_password  TEXT,
  p_modulos   TEXT[] DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_user_id      UUID;
  v_encrypted_pw TEXT;
  v_mod          TEXT;
BEGIN
  IF NOT public.es_admin() THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = lower(p_email)) THEN
    RAISE EXCEPTION 'Ya existe un usuario con ese email';
  END IF;

  v_user_id      := gen_random_uuid();
  v_encrypted_pw := crypt(p_password, gen_salt('bf'));

  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    aud, role
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    lower(p_email),
    v_encrypted_pw,
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    'authenticated',
    'authenticated'
  );

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id,
    created_at, updated_at, last_sign_in_at
  ) VALUES (
    v_user_id::text,
    v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', lower(p_email)),
    'email',
    v_user_id::text,
    now(), now(), now()
  );

  -- Registrar en el log de contraseñas
  INSERT INTO public.admin_password_log (user_id, password_plain, changed_by)
  VALUES (v_user_id, p_password, auth.uid());

  -- Asignar módulos
  FOREACH v_mod IN ARRAY p_modulos LOOP
    INSERT INTO public.accesos_modulo (user_id, modulo, habilitado)
    VALUES (v_user_id, v_mod, true)
    ON CONFLICT (user_id, modulo) DO UPDATE SET habilitado = true;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'user_id', v_user_id, 'email', lower(p_email));
END;
$$;
