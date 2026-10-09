-- Nuevas cuentas maestras de Frío Alimentario (mismos permisos que alexis_plescia@carrefour.com):
-- ven todas las tiendas, el dashboard de capacidad instalada y los parámetros de kg.
-- Correr en: Supabase > SQL Editor > New query > Run.

insert into cuentas_maestras (email) values
  ('monica_berclaz@carrefour.com'),
  ('gustavo_granero@carrefour.com'),
  ('lucas_concetti@carrefour.com')
on conflict (email) do nothing;

-- Para verificar:
select email from cuentas_maestras order by email;
