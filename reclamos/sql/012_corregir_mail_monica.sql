-- ════════════════════════════════════════════════════════════════
--  Corrige el mail de Mónica: Belcraz → Berclaz
--  (Frío Alimentario: cuentas_maestras · Reclamos: reclamos_usuarios)
--  Correr una sola vez en Supabase > SQL Editor.
-- ════════════════════════════════════════════════════════════════

update cuentas_maestras set email = 'monica_berclaz@carrefour.com'
 where email = 'monica_belcraz@carrefour.com';

update reclamos_usuarios set email = 'monica_berclaz@carrefour.com', nombre = 'Mónica Berclaz'
 where email = 'monica_belcraz@carrefour.com';

-- Por si ya hubiera movimientos con el mail viejo
update reclamos_eventos set usuario = 'monica_berclaz@carrefour.com'
 where usuario = 'monica_belcraz@carrefour.com';

select 'cuentas_maestras' as tabla, email from cuentas_maestras where email like 'monica%'
union all
select 'reclamos_usuarios', email from reclamos_usuarios where email like 'monica%';
