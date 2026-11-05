-- 032 — Asignar tiendas de Frío Alimentario a usuarios (jefes)
-- Tabla many-to-many + RPCs para que el admin pueda gestionar qué tiendas
-- ve cada usuario en el módulo de Frío Alimentario.

-- ── Tabla ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.usuario_tiendas (
  user_id       UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tienda_numero INT     NOT NULL REFERENCES public.tiendas(numero) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, tienda_numero)
);

ALTER TABLE public.usuario_tiendas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Solo admins leen usuario_tiendas"
  ON public.usuario_tiendas FOR SELECT
  USING (public.es_admin());

CREATE POLICY "Solo admins escriben usuario_tiendas"
  ON public.usuario_tiendas FOR ALL
  USING (public.es_admin());

-- ── Listar tiendas asignadas a un usuario ─────────────
CREATE OR REPLACE FUNCTION public.admin_tiendas_de_usuario(p_user_id UUID)
RETURNS INT[]
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT COALESCE(array_agg(tienda_numero ORDER BY tienda_numero), '{}')
  FROM public.usuario_tiendas
  WHERE user_id = p_user_id;
$$;

-- ── Asignar tiendas (reemplaza las anteriores) ────────
CREATE OR REPLACE FUNCTION public.admin_asignar_tiendas(
  p_user_id  UUID,
  p_tiendas  INT[]
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.es_admin() THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  DELETE FROM public.usuario_tiendas WHERE user_id = p_user_id;

  IF array_length(p_tiendas, 1) > 0 THEN
    INSERT INTO public.usuario_tiendas (user_id, tienda_numero)
    SELECT p_user_id, unnest(p_tiendas);
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'asignadas', COALESCE(array_length(p_tiendas, 1), 0)
  );
END;
$$;

-- ── Listar usuarios con sus tiendas asignadas ─────────
CREATE OR REPLACE FUNCTION public.admin_listar_usuario_tiendas()
RETURNS TABLE(user_id UUID, email TEXT, tiendas INT[])
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT
    u.id,
    u.email,
    COALESCE(array_agg(ut.tienda_numero ORDER BY ut.tienda_numero)
             FILTER (WHERE ut.tienda_numero IS NOT NULL), '{}')
  FROM auth.users u
  LEFT JOIN public.usuario_tiendas ut ON ut.user_id = u.id
  -- Solo usuarios con acceso a Frío
  INNER JOIN public.accesos_modulo am ON am.user_id = u.id
    AND am.modulo = 'frio' AND am.habilitado = true
  GROUP BY u.id, u.email
  ORDER BY u.email;
$$;
