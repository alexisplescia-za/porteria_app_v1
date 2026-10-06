-- Tiendas cerradas que tienen consumo de refrigerante en 2025/2026 según el
-- "INDICADOR DE IMPUTACIONES DE REFRIGERANTE _ Q3 (1).xlsx" (figuran #N/A o ya no están en el
-- organigrama). Se dan de alta como CERRADAS para que su consumo cuente en los totales país,
-- igual que en el indicador. Nombres tomados de las hojas "ORG. Octubre" y "Org. Febrero".
-- Correr en: Supabase > SQL Editor > New query > Run.

insert into tiendas (numero, sap, local, formato, region, jefe_nombre) values
  (112, '112', '112 - Salta Centro',                  'HIPERMERCADO', 'Interior Norte', 'Omar Carrizo'),
  (150, '150', '150 - Market Vidt',                   'MARKET',       'AMBA Sur',       'Diego Portela'),
  (287, '287', '287 - Mendoza Suipacha',              'MARKET',       'Interior Sur',   'Carlos Herrera'),
  (288, '288', '288 - Mendoza Sexta',                 'MARKET',       'Interior Sur',   'Carlos Herrera'),
  (461, '461', '461 - Salta 160',                     'Express',      'Express',        'Hugo Villalba'),
  (536, '536', '536 - Ricardo Balbin 4189',           'Express',      'Express',        'Daniel Triacca'),
  (735, '735', '735 - Pueyrredon 2120',               'Express',      'Express',        'Gonzalo Mena'),
  (792, '792', '792 - Av. Independencia 3802 (CABA)', 'Express',      'Express',        'Hugo Villalba')
on conflict (numero) do nothing;

insert into relevamientos (tienda_numero, estado, observaciones, cargado_por) values
  (112, 'CERRADA', 'Tienda cerrada (consumo histórico en el Indicador de imputaciones Q3)', 'importacion_indicador_q3'),
  (150, 'CERRADA', 'Tienda cerrada (consumo histórico en el Indicador de imputaciones Q3)', 'importacion_indicador_q3'),
  (287, 'CERRADA', 'Tienda cerrada (consumo histórico en el Indicador de imputaciones Q3)', 'importacion_indicador_q3'),
  (288, 'CERRADA', 'Tienda cerrada (consumo histórico en el Indicador de imputaciones Q3)', 'importacion_indicador_q3'),
  (461, 'CERRADA', 'Tienda cerrada (consumo histórico en el Indicador de imputaciones Q3)', 'importacion_indicador_q3'),
  (536, 'CERRADA', 'Tienda cerrada (consumo histórico en el Indicador de imputaciones Q3)', 'importacion_indicador_q3'),
  (735, 'CERRADA', 'Tienda cerrada (consumo histórico en el Indicador de imputaciones Q3)', 'importacion_indicador_q3'),
  (792, 'CERRADA', 'Tienda cerrada (consumo histórico en el Indicador de imputaciones Q3)', 'importacion_indicador_q3')
on conflict (tienda_numero) do nothing;
