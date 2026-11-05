/**
 * CENTRAL MANTENIMIENTO APP — BASE NUEVA (cuenta de la oficina)
 * Va en el MISMO proyecto de Apps Script que backup_porteria.gs, como archivo aparte.
 *
 * · Restauración inicial (una sola vez): llena la base nueva con
 *     - Frío (tiendas, relevamientos, parámetros, cuentas maestras, consumos, objetivos): de la base vieja (lectura pública)
 *     - Reclamos (+ historial, listas, gestores, tareas): de la base vieja, con el login de un gestor
 *     - Portería (registros, configuración): de esta planilla
 *     - Usuarios: de la hoja "Usuarios Auth" (mismo mail y contraseña)
 * · Backup: igual que antes, pero lee todo directo de Supabase (también Portería, ya no pasa por Render)
 *   y además guarda "Datos - <tabla>" con las tablas crudas, para poder restaurar de verdad.
 *
 * Clave: Propiedades del script → SUPABASE_SECRET_KEY = la clave secreta (sb_secret_…) del proyecto nuevo.
 * Se carga con el menú Backups → Configurar clave de Supabase. Nunca en el código.
 */

// Base vieja (proyecto de Alexis): sólo se lee, para la restauración inicial.
const ORIGEN = {
  SUPABASE_URL: 'https://uufwqjjcmoawlzjqlpvf.supabase.co',
  SUPABASE_ANON_KEY: '*******'
};

// Tablas crudas que se respaldan además de las hojas de siempre (sirven para restaurar).
const TABLAS_CRUDAS = [
  ['reclamos', 'id.asc'], ['reclamos_eventos', 'id.asc'], ['reclamos_usuarios', 'email.asc'],
  ['reclamos_proveedores', 'orden.asc'], ['reclamos_categorias', 'orden.asc'], ['reclamos_opciones', 'lista.asc,orden.asc'],
  ['dev_tareas', 'id.asc'], ['consumos_refrigerante', 'id.asc'], ['objetivos_tienda', 'tienda_numero.asc,anio.asc'],
  ['admins', 'email.asc'], ['accesos_modulos', 'email.asc,modulo.asc']
];

// ---------------------------------------------------------------
// Menú
// ---------------------------------------------------------------
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Backups')
    .addItem('Hacer backup ahora (todo)', 'hacerBackupManual')
    .addItem('Sólo Reclamos ahora', 'hacerBackupReclamosManual')
    .addItem('Sólo Frío Alimentario ahora', 'hacerBackupFrioManual')
    .addItem('Sólo Usuarios Auth ahora', 'hacerBackupUsuariosManual')
    .addSeparator()
    .addItem('Activar backup semanal + anti-pausa diario', 'activarBackupSemanal')
    .addItem('Desactivar backup semanal y anti-pausa', 'desactivarBackupSemanal')
    .addItem('Ver estado', 'verEstado')
    .addSeparator()
    .addItem('Configurar clave de Supabase (secreta)', 'configurarClaveSupabase')
    .addItem('Restaurar en la base nueva (una sola vez)', 'restaurarEnBaseNueva')
    .addToUi();
}

function configurarClaveSupabase() {
  const ui = SpreadsheetApp.getUi();
  const r = ui.prompt('Clave secreta de Supabase',
    'Pegá la clave secreta del proyecto nuevo (Supabase → Project Settings → API Keys → Secret keys, empieza con sb_secret_).',
    ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  const clave = r.getResponseText().trim();
  if (!/^sb_secret_/.test(clave) && clave.split('.').length !== 3) { ui.alert('No parece una clave secreta de Supabase. No se guardó.'); return; }
  PropertiesService.getScriptProperties().setProperty('SUPABASE_SECRET_KEY', clave);
  ui.alert('Clave guardada. Ya podés usar "Restaurar en la base nueva" y "Hacer backup ahora".');
}

// ---------------------------------------------------------------
// Acceso a Supabase (base nueva)
// ---------------------------------------------------------------
function claveSupabase_() {
  const k = PropertiesService.getScriptProperties().getProperty('SUPABASE_SECRET_KEY');
  if (!k) throw new Error('Falta la clave secreta de Supabase. Usá Backups → Configurar clave de Supabase.');
  return k;
}

// Las claves nuevas (sb_...) van sólo en "apikey"; las viejas (JWT) también en Authorization.
function headersSupabase_(clave, token) {
  const h = { apikey: clave };
  if (token) h.Authorization = 'Bearer ' + token;
  else if (!/^sb_/.test(clave)) h.Authorization = 'Bearer ' + clave;
  return h;
}

// Lee una tabla completa, de a 1000 filas. "filtro" es un query string extra de PostgREST (ej. "created_at=gt.2026-01-01").
function leerTabla_(base, clave, token, tabla, columnas, orden, filtro) {
  const out = [];
  for (let desde = 0; ; desde += 1000) {
    const url = base + '/rest/v1/' + tabla + '?select=' + encodeURIComponent(columnas) +
      (orden ? '&order=' + orden : '') + (filtro ? '&' + filtro : '');
    const h = headersSupabase_(clave, token);
    h.Range = desde + '-' + (desde + 999);
    const r = UrlFetchApp.fetch(url, { headers: h, muteHttpExceptions: true });
    const codigo = r.getResponseCode();
    if (codigo !== 200 && codigo !== 206) throw new Error('Supabase (' + tabla + ') respondió HTTP ' + codigo + ': ' + r.getContentText().slice(0, 200));
    const lote = JSON.parse(r.getContentText());
    Array.prototype.push.apply(out, lote);
    if (lote.length < 1000) return out;
  }
}

// Reemplazan a las del archivo viejo (renombradas a *Viejo_): ahora usan la base nueva y la clave secreta.
function supabaseTodo_(tabla, columnas, orden, filtro) {
  return leerTabla_(CONFIG.SUPABASE_URL, claveSupabase_(), null, tabla, columnas, orden, filtro);
}

function supabaseRpc_(nombre, args) {
  const h = headersSupabase_(claveSupabase_());
  h['Content-Type'] = 'application/json';
  const r = UrlFetchApp.fetch(CONFIG.SUPABASE_URL + '/rest/v1/rpc/' + nombre, {
    method: 'post', headers: h, payload: JSON.stringify(args || {}), muteHttpExceptions: true
  });
  const codigo = r.getResponseCode();
  if (codigo !== 200) throw new Error('Supabase RPC ' + nombre + ' respondió HTTP ' + codigo + ': ' + r.getContentText().slice(0, 200));
  return JSON.parse(r.getContentText());
}

// Inserta o actualiza en la base nueva, de a 500 filas.
function subir_(tabla, filas, conflicto) {
  const h = headersSupabase_(claveSupabase_());
  h['Content-Type'] = 'application/json';
  h.Prefer = 'resolution=merge-duplicates,return=minimal';
  for (let i = 0; i < filas.length; i += 500) {
    const r = UrlFetchApp.fetch(CONFIG.SUPABASE_URL + '/rest/v1/' + tabla + (conflicto ? '?on_conflict=' + conflicto : ''), {
      method: 'post', headers: h, payload: JSON.stringify(filas.slice(i, i + 500)), muteHttpExceptions: true
    });
    const codigo = r.getResponseCode();
    if (codigo >= 300) throw new Error('No se pudo cargar ' + tabla + ' (HTTP ' + codigo + '): ' + r.getContentText().slice(0, 300));
  }
  return filas.length;
}

// ---------------------------------------------------------------
// Backup (reemplaza a hacerBackup y backupPorteria_ del archivo viejo)
// ---------------------------------------------------------------
function hacerBackup() {
  const res = hacerBackupBase_();
  const inicio = new Date();
  try {
    const c = backupTablasCrudas_();
    log_(inicio, 'OK', c.filas, c.tablas, '', '', 'Tablas crudas');
    res.crudas = { ok: true, tablas: c.tablas, filas: c.filas };
  } catch (e) {
    log_(inicio, 'ERROR', 0, 0, '', e.message, 'Tablas crudas');
    res.crudas = { ok: false, error: e.message };
    avisarError_(new Error('Tablas crudas: ' + e.message));
  }
  return res;
}

// Portería ahora vive en la misma base: se lee directo (sin Render ni BACKUP_KEY).
function backupPorteria_() {
  const props = PropertiesService.getScriptProperties();
  const desde = props.getProperty('ULTIMA_ALTA_BASE_NUEVA');
  const traidos = supabaseTodo_('registros', COLUMNAS_REGISTROS.map(function (c) { return c[1]; }).join(','),
    'created_at.asc,id.asc', desde ? 'created_at=gt.' + encodeURIComponent(desde) : '');

  const hReg = hoja_(HOJA_REGISTROS);
  asegurarEncabezados_(hReg, COLUMNAS_REGISTROS.map(function (c) { return c[0]; }));
  const existentes = new Set();
  if (hReg.getLastRow() > 1) {
    hReg.getRange(2, 1, hReg.getLastRow() - 1, 1).getValues().forEach(function (f) { existentes.add(String(f[0])); });
  }
  const nuevos = traidos.filter(function (r) { return !existentes.has(String(r.id)); });
  if (nuevos.length) {
    const filas = nuevos.map(function (r) { return COLUMNAS_REGISTROS.map(function (c) { return convertir_(r[c[1]], c[2]); }); });
    hReg.getRange(hReg.getLastRow() + 1, 1, filas.length, COLUMNAS_REGISTROS.length).setValues(filas);
    hReg.getRange(2, 2, hReg.getLastRow() - 1, 1).setNumberFormat('dd/MM/yyyy HH:mm');
    hReg.getRange(2, 14, hReg.getLastRow() - 1, 1).setNumberFormat('dd/MM/yyyy HH:mm');
  }
  if (traidos.length) {
    const maxAlta = traidos.reduce(function (m, r) { return r.created_at > m ? r.created_at : m; }, desde || '');
    props.setProperty('ULTIMA_ALTA_BASE_NUEVA', maxAlta);
  }

  volcarTabla_(HOJA_CONFIG, supabaseTodo_('config', 'id,categoria,valor,activo', 'categoria.asc,valor.asc'),
    [['ID', 'id'], ['Categoría', 'categoria'], ['Valor', 'valor'], ['Activo', 'activo']]);

  // Quiénes entran a Portería (accesos de Central Mantenimiento)
  const accesos = supabaseTodo_('accesos_modulos', 'email,modulo', 'email.asc');
  const admins = supabaseTodo_('admins', 'email', 'email.asc').map(function (a) { return String(a.email).toLowerCase(); });
  const mails = {};
  accesos.forEach(function (a) { if (a.modulo === 'porteria' || a.modulo === 'admin') mails[a.email] = true; });
  admins.forEach(function (m) { mails[m] = true; });
  const usuarios = Object.keys(mails).sort().map(function (m, i) {
    return { id: i + 1, username: m, rol: admins.indexOf(m) !== -1 ? 'admin' : 'porteria', activo: true };
  });
  volcarTabla_(HOJA_USUARIOS, usuarios, [['ID', 'id'], ['Usuario', 'username'], ['Rol', 'rol'], ['Activo', 'activo']]);

  const archivo = guardarCsvDe_(hReg, 'porteria_registros_');
  return { nuevos: nuevos.length, total: hReg.getLastRow() - 1, archivo: archivo };
}

function backupTablasCrudas_() {
  let filas = 0;
  TABLAS_CRUDAS.forEach(function (t) {
    const datos = supabaseTodo_(t[0], '*', t[1]);
    volcarSupabase_('Datos - ' + t[0], datos);
    filas += datos.length;
  });
  return { tablas: TABLAS_CRUDAS.length, filas: filas };
}

// ---------------------------------------------------------------
// Restauración inicial en la base nueva
// ---------------------------------------------------------------
function restaurarEnBaseNueva() {
  const ui = SpreadsheetApp.getUi();
  claveSupabase_();
  const ok = ui.alert('Restaurar en la base nueva',
    'Esto copia a la base nueva (' + CONFIG.SUPABASE_URL + '):\n\n' +
    '• Frío: de la base vieja\n• Reclamos: de la base vieja (te pido el login de un gestor)\n' +
    '• Portería: de las hojas "' + HOJA_REGISTROS + '" y "' + HOJA_CONFIG + '"\n' +
    '• Usuarios: de la hoja "' + HOJA_USUARIOS_AUTH + '" (mismo mail y contraseña)\n\n' +
    'Si algo ya existe, se actualiza (no se duplica). ¿Seguimos?', ui.ButtonSet.YES_NO);
  if (ok !== ui.Button.YES) return;

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) { ui.alert('Ya hay un backup o restauración corriendo.'); return; }
  const r = {};
  try {
    // 1) Frío (lectura pública de la base vieja). El orden respeta las claves foráneas.
    const leerViejo = function (t, orden) { return leerTabla_(ORIGEN.SUPABASE_URL, ORIGEN.SUPABASE_ANON_KEY, null, t, '*', orden); };
    r.tiendas = subir_('tiendas', leerViejo('tiendas', 'numero.asc'), 'numero');
    r.relevamientos = subir_('relevamientos', leerViejo('relevamientos', 'tienda_numero.asc'), 'tienda_numero');
    r.cuentas_maestras = subir_('cuentas_maestras', leerViejo('cuentas_maestras', 'email.asc'), 'email');
    r.parametros_kg = subir_('parametros_kg', leerViejo('parametros_kg', 'id.asc'), 'id');
    r.consumos = subir_('consumos_refrigerante', leerViejo('consumos_refrigerante', 'id.asc'), 'id');
    r.objetivos = subir_('objetivos_tienda', leerViejo('objetivos_tienda', 'tienda_numero.asc,anio.asc'), 'tienda_numero,anio');

    // 2) Reclamos (la base vieja exige sesión para leerlos)
    r.reclamos = restaurarReclamos_(ui);

    // 3) Portería desde esta planilla
    r.registros = subir_('registros', leerRegistrosDeHoja_(), 'id');
    r.config = subir_('config', leerConfigDeHoja_(), 'id');

    // 4) Usuarios
    r.usuarios = restaurarUsuarios_();

    // 5) Contadores de IDs
    supabaseRpc_('restauracion_cierre_');
  } catch (e) {
    ui.alert('La restauración se cortó:\n\n' + e.message + '\n\nLo ya cargado quedó en la base. Podés volver a correrla: no duplica.');
    return;
  } finally {
    lock.releaseLock();
  }
  ui.alert('Restauración completa\n\n' +
    'Tiendas: ' + r.tiendas + ' · Relevamientos: ' + r.relevamientos + '\n' +
    'Cuentas maestras: ' + r.cuentas_maestras + ' · Parámetros kg: ' + r.parametros_kg + '\n' +
    'Consumos: ' + r.consumos + ' · Objetivos: ' + r.objetivos + '\n' +
    'Reclamos: ' + (r.reclamos ? r.reclamos.reclamos + ' reclamos + ' + r.reclamos.eventos + ' eventos' : 'omitido') + '\n' +
    'Registros Portería: ' + r.registros + ' · Config: ' + r.config + '\n' +
    'Usuarios: ' + r.usuarios);
}

function restaurarReclamos_(ui) {
  const rta = ui.prompt('Login de gestor de reclamos',
    'Los reclamos de la base vieja están protegidos. Poné el mail de un gestor de reclamos para leerlos.',
    ui.ButtonSet.OK_CANCEL);
  if (rta.getSelectedButton() !== ui.Button.OK) return null;
  const email = rta.getResponseText().trim();
  const rta2 = ui.prompt('Contraseña', 'Contraseña de ' + email + ' en la app de reclamos.', ui.ButtonSet.OK_CANCEL);
  if (rta2.getSelectedButton() !== ui.Button.OK) return null;
  const password = rta2.getResponseText();

  // Login en la base vieja
  const login = UrlFetchApp.fetch(ORIGEN.SUPABASE_URL + '/auth/v1/token?grant_type=password', {
    method: 'post',
    headers: { apikey: ORIGEN.SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    payload: JSON.stringify({ email: email, password: password }),
    muteHttpExceptions: true
  });
  if (login.getResponseCode() !== 200) throw new Error('No se pudo entrar con ' + email + ': ' + login.getContentText().slice(0, 200));
  const token = JSON.parse(login.getContentText()).access_token;

  const leer = function (t, orden) { return leerTabla_(ORIGEN.SUPABASE_URL, ORIGEN.SUPABASE_ANON_KEY, token, t, '*', orden); };
  const reclamos = leer('reclamos', 'id.asc');
  const eventos = leer('reclamos_eventos', 'id.asc');
  const provs = leer('reclamos_proveedores', 'orden.asc');
  const cats = leer('reclamos_categorias', 'orden.asc');
  const opciones = leer('reclamos_opciones', 'orden.asc');
  const usuarios = leer('reclamos_usuarios', 'email.asc');
  const tareas = leer('dev_tareas', 'id.asc');

  subir_('reclamos_proveedores', provs, 'id');
  subir_('reclamos_categorias', cats, 'id');
  subir_('reclamos_opciones', opciones, 'id');
  subir_('reclamos_usuarios', usuarios, 'email');
  subir_('reclamos', reclamos, 'id');
  subir_('reclamos_eventos', eventos, 'id');
  subir_('dev_tareas', tareas, 'id');
  return { reclamos: reclamos.length, eventos: eventos.length };
}

function leerRegistrosDeHoja_() {
  const h = hoja_(HOJA_REGISTROS);
  if (h.getLastRow() <= 1) return [];
  const enc = h.getRange(1, 1, 1, h.getLastColumn()).getValues()[0];
  const datos = h.getRange(2, 1, h.getLastRow() - 1, h.getLastColumn()).getValues();
  const camposDe = {};
  COLUMNAS_REGISTROS.forEach(function (c) { camposDe[c[0]] = c[1]; });
  return datos.map(function (fila) {
    const obj = {};
    enc.forEach(function (e, i) {
      const campo = camposDe[e];
      if (!campo) return;
      let v = fila[i];
      if (v instanceof Date) v = v.toISOString();
      if (v === 'Sí') v = true;
      if (v === 'No') v = false;
      if (v === '') v = null;
      obj[campo] = v;
    });
    return obj;
  });
}

function leerConfigDeHoja_() {
  const h = hoja_(HOJA_CONFIG);
  if (h.getLastRow() <= 1) return [];
  const datos = h.getRange(2, 1, h.getLastRow() - 1, 4).getValues();
  return datos.map(function (f) {
    return { id: f[0], categoria: f[1], valor: f[2], activo: f[3] === 'Sí' || f[3] === true };
  });
}

function restaurarUsuarios_() {
  const h = hoja_(HOJA_USUARIOS_AUTH);
  if (h.getLastRow() <= 1) return 0;
  const datos = h.getRange(2, 1, h.getLastRow() - 1, 6).getValues();
  let n = 0;
  datos.forEach(function (fila) {
    const email = String(fila[0]).trim();
    const password = String(fila[1]).trim();
    if (!email || !password) return;
    const modulos = String(fila[3] || '').split(',').map(function (m) { return m.trim(); }).filter(Boolean);
    try {
      supabaseRpc_('restaurar_usuario', { p_email: email, p_password: password, p_modulos: modulos });
      n++;
    } catch (e) {
      Logger.log('No se pudo restaurar ' + email + ': ' + e.message);
    }
  });
  return n;
}
