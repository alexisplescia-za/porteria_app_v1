-- Borra el consumo cargado desde "base_de_datos_sin_topes_por_mes.xlsx" (llegaba hasta el 15/07/2026)
-- para recargarlo completo desde "INDICADOR DE IMPUTACIONES DE REFRIGERANTE _ Q3 (1).xlsx",
-- hoja "Base todos los años" (ene-2024 a sep-2026).
-- Correr en: Supabase > SQL Editor > New query > Run. Después avisar para recargar.

delete from consumos_refrigerante;
