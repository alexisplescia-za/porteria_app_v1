/**
 * BACKUP SEMANAL DE CENTRAL MANTENIMIENTO APP → GOOGLE SHEETS + DRIVE
 * Portería (registros) + Reclamos a Proveedores EE · Desarrollado por Alexis Plescia
 *
 * PORTERÍA — qué hace cada vez que corre:
 *   1. Despierta el backend de Portería (Render se duerme cuando no se usa).
 *   2. Trae sólo los registros nuevos desde el último backup y los agrega a la hoja "Registros"
 *      (sin duplicar: se controla por ID).
 *   3. Copia completa de "Configuración" y "Usuarios" (los usuarios SIN contraseñas).
 *   4. Guarda un CSV de respaldo con fecha en la carpeta de Drive "Backups Portería".
 *   5. Anota el resultado en "Log de backups" y, si algo falla, te manda un mail.
 *
 * RECLAMOS — lee la app de Reclamos (Supabase) y reescribe las hojas "Reclamos" (formato del tracker),
 *   "Tablero Reclamos", "Historial Reclamos" y "Listas Reclamos", más un CSV en la misma carpeta.
 *
 * FRÍO ALIMENTARIO — copia completa de relevamientos, tiendas (organigrama), parámetros de kg y cuentas maestras.
 *
 * USUARIOS AUTH — emails, contraseñas, módulos de todos los usuarios de Supabase Auth.
 *
 * Cada sección se respalda por separado: si una falla, las otras igual se guardan (y llega el mail).
 * ANTI-PAUSA — un activador diario hace una consulta mínima a Supabase para que el proyecto de
 *   Frío + Reclamos no se pause por inactividad (el plan gratis pausa a los 7 días sin uso).
 * Instalación: ver INSTRUCCIONES.md (misma carpeta).
 */

const CONFIG = {
  URL_BACKEND: 'https://porteria-backend.onrender.com',
  CARPETA_DRIVE: 'Backups Portería',
  TAMANIO_PAGINA: 2000,          // registros por pedido al backend
  DIA_SEMANAL: ScriptApp.WeekDay.MONDAY,
  HORA_SEMANAL: 7,               // entre las 7 y las 8 (Google elige el minuto)
  // Reclamos: API de lectura de Supabase. Es la misma clave pública que usa la app en el navegador
  // (sólo lee; las escrituras están bloqueadas por la base). No es la clave del backend de Portería.
  SUPABASE_URL: 'https://dztcpzmvfmvjcwpnpcjy.supabase.co',
  SUPABASE_ANON_KEY: '*******'
};

const HOJA_REGISTROS = 'Registros';
const HOJA_CONFIG = 'Configuración';
const HOJA_USUARIOS = 'Usuarios';
const HOJA_USUARIOS_AUTH = 'Usuarios Auth';
const HOJA_LOG = 'Log de backups';

// Columnas de la hoja Registros: [encabezado, campo del backend, tipo]
const COLUMNAS_REGISTROS = [
  ['ID', 'id', 'texto'],
  ['Fecha y hora', 'fecha_hora', 'fecha'],
  ['Tipo', 'tipo_op', 'texto'],
  ['Perfil', 'perfil', 'texto'],
  ['Nombre / Empresa', 'nombre', 'texto'],
  ['Remito / OT', 'remito', 'texto'],
  ['Detalle', 'detalle', 'texto'],
  ['Motivo', 'estado', 'texto'],
  ['Observaciones', 'obs', 'texto'],
  ['Módulo', 'modulo', 'texto'],
  ['Egreso temprano', 'egreso_temprano', 'sino'],
  ['Grupo', 'grupo_id', 'texto'],
  ['Usuario', 'usuario', 'texto'],
  ['Alta en la base', 'created_at', 'fecha']
];

// ---------------------------------------------------------------
// Menú
// ---------------------------------------------------------------

function onOpenViejo_() {
  SpreadsheetApp.getUi()
    .createMenu('Backups')
    .addItem('Hacer backup ahora (Portería + Reclamos)', 'hacerBackupManual')
    .addItem('Sólo Reclamos ahora', 'hacerBackupReclamosManual')
    .addItem('Sólo Frío Alimentario ahora', 'hacerBackupFrioManual')
    .addItem('Sólo Usuarios Auth ahora', 'hacerBackupUsuariosManual')
    .addSeparator()
    .addItem('Activar backup semanal + anti-pausa diario', 'activarBackupSemanal')
    .addItem('Desactivar backup semanal y anti-pausa', 'desactivarBackupSemanal')
    .addItem('Ver estado', 'verEstado')
    .addSeparator()
    .addItem('Configurar clave del backend de Portería', 'configurarClave')
    .addToUi();
}

function configurarClave() {
  const ui = SpreadsheetApp.getUi();
  const r = ui.prompt('Clave del backup',
    'Pegá la clave BACKUP_KEY (la misma que está cargada en Render).', ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  const clave = r.getResponseText().trim();
  if (clave.length < 20) { ui.alert('La clave parece incompleta. No se guardó.'); return; }
  PropertiesService.getScriptProperties().setProperty('BACKUP_KEY', clave);
  ui.alert('Clave guardada. Ahora probá con Backups → Hacer backup ahora.');
}

function activarBackupSemanal() {
  borrarActivadores_();
  ScriptApp.newTrigger('hacerBackup')
    .timeBased().onWeekDay(CONFIG.DIA_SEMANAL).atHour(CONFIG.HORA_SEMANAL).create();
  ScriptApp.newTrigger('mantenerActivo').timeBased().everyDays(1).atHour(6).create();
  mantenerActivo();
  SpreadsheetApp.getUi().alert('Listo:\n\n• Backup semanal: todos los lunes entre las 7 y las 8 hs.\n' +
    '• Anti-pausa: todos los días a las 6 hs, una consulta mínima a Supabase para que no se pause.');
}

function desactivarBackupSemanal() {
  const n = borrarActivadores_();
  SpreadsheetApp.getUi().alert(n ? 'Backup semanal y anti-pausa desactivados.' : 'No había activadores.');
}

function verEstado() {
  const props = PropertiesService.getScriptProperties();
  const triggers = ScriptApp.getProjectTriggers().map(function (t) { return t.getHandlerFunction(); });
  const activo = triggers.indexOf('hacerBackup') !== -1;
  const antiPausa = triggers.indexOf('mantenerActivo') !== -1;
  const log = hoja_(HOJA_LOG);
  const filas = log.getLastRow() > 1 ? log.getRange(2, 1, log.getLastRow() - 1, 8).getDisplayValues() : [];
  const ultimoDe = function (seccion) {
    for (let i = filas.length - 1; i >= 0; i--) if ((filas[i][7] || 'Portería') === seccion) return filas[i];
    return null;
  };
  const linea = function (seccion) {
    const u = ultimoDe(seccion);
    return seccion + ': ' + (u ? u[0] + ' · ' + u[1] : 'todavía sin backup');
  };
  SpreadsheetApp.getUi().alert(
    'Backup semanal: ' + (activo ? 'ACTIVO (lunes 7 hs)' : 'desactivado') + '\n' +
    'Anti-pausa diario: ' + (antiPausa ? 'ACTIVO (6 hs) · último: ' + (props.getProperty('ULTIMO_ANTIPAUSA') || '—') : 'desactivado (usá "Activar backup semanal + anti-pausa")') + '\n' +
    'Clave del backend de Portería: ' + (props.getProperty('BACKUP_KEY') ? 'sí' : 'NO') + '\n\n' +
    'Registros de Portería en la hoja: ' + Math.max(hoja_(HOJA_REGISTROS).getLastRow() - 1, 0) + '\n' +
    'Reclamos en la hoja: ' + Math.max(hoja_(HOJA_RECLAMOS).getLastRow() - 1, 0) + '\n\n' +
    'Último backup\n' + linea('Portería') + '\n' + linea('Reclamos') + '\n' + linea('Frío') + '\n' + linea('Usuarios Auth'));
}

function hacerBackupManual() {
  const ui = SpreadsheetApp.getUi();
  let r;
  try { r = hacerBackup(); } catch (e) { ui.alert('El backup falló:\n\n' + e.message + '\n\nQuedó anotado en "' + HOJA_LOG + '".'); return; }
  const p = r.porteria, k = r.reclamos;
  ui.alert('Resultado del backup\n\n' +
    'PORTERÍA: ' + (p.ok ? 'OK · ' + p.nuevos + ' registros nuevos · ' + p.total + ' en total' : 'ERROR · ' + p.error) + '\n' +
    'RECLAMOS: ' + (k.ok ? 'OK · ' + k.reclamos + ' reclamos (' + k.abiertos + ' abiertos)' : 'ERROR · ' + k.error) + '\n' +
    'FRÍO: ' + (r.frio.ok ? 'OK · ' + r.frio.relevamientos + ' relevamientos · ' + r.frio.tiendas + ' tiendas' : 'ERROR · ' + r.frio.error) + '\n' +
    'USUARIOS AUTH: ' + (r.usuarios.ok ? 'OK · ' + r.usuarios.usuarios + ' usuarios' : 'ERROR · ' + r.usuarios.error) +
    '\n\nDetalle en "' + HOJA_LOG + '".');
}

// ---------------------------------------------------------------
// Backup
// ---------------------------------------------------------------

// Corre las secciones por separado; una falla no impide las otras.
function hacerBackupBase_() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) throw new Error('Ya hay un backup corriendo.');
  const res = {};
  const errores = [];
  try {
    let inicio = new Date();
    try {
      const p = backupPorteria_();
      log_(inicio, 'OK', p.nuevos, p.total, p.archivo.getUrl(), '', 'Portería');
      res.porteria = { ok: true, nuevos: p.nuevos, total: p.total };
    } catch (e) {
      log_(inicio, 'ERROR', 0, Math.max(hoja_(HOJA_REGISTROS).getLastRow() - 1, 0), '', e.message, 'Portería');
      res.porteria = { ok: false, error: e.message };
      errores.push('Portería: ' + e.message);
    }
    inicio = new Date();
    try {
      const k = backupReclamos_();
      log_(inicio, 'OK', k.reclamos, k.reclamos, k.archivo.getUrl(), '', 'Reclamos');
      res.reclamos = { ok: true, reclamos: k.reclamos, abiertos: k.abiertos };
    } catch (e) {
      log_(inicio, 'ERROR', 0, 0, '', e.message, 'Reclamos');
      res.reclamos = { ok: false, error: e.message };
      errores.push('Reclamos: ' + e.message);
    }
    inicio = new Date();
    try {
      const f = backupFrio_();
      log_(inicio, 'OK', f.relevamientos, f.tiendas, f.archivo.getUrl(), '', 'Frío');
      res.frio = { ok: true, relevamientos: f.relevamientos, tiendas: f.tiendas };
    } catch (e) {
      log_(inicio, 'ERROR', 0, 0, '', e.message, 'Frío');
      res.frio = { ok: false, error: e.message };
      errores.push('Frío Alimentario: ' + e.message);
    }
    inicio = new Date();
    try {
      const u = backupUsuariosAuth_();
      log_(inicio, 'OK', u.usuarios, u.usuarios, '', '', 'Usuarios Auth');
      res.usuarios = { ok: true, usuarios: u.usuarios };
    } catch (e) {
      log_(inicio, 'ERROR', 0, 0, '', e.message, 'Usuarios Auth');
      res.usuarios = { ok: false, error: e.message };
      errores.push('Usuarios Auth: ' + e.message);
    }
    if (errores.length) avisarError_(new Error(errores.join('\n')));
    return res;
  } finally {
    lock.releaseLock();
  }
}

function backupPorteriaViejo_() {
  {
    const props = PropertiesService.getScriptProperties();
    const clave = props.getProperty('BACKUP_KEY');
    if (!clave) throw new Error('Falta la clave. Usá Portería → Configurar clave del backend.');

    despertarBackend_();

    // 1) Registros nuevos (paginado)
    const desde = props.getProperty('ULTIMA_ALTA');
    const traidos = [];
    let offset = 0, total = 0;
    do {
      const url = CONFIG.URL_BACKEND + '/api/backup/registros?limit=' + CONFIG.TAMANIO_PAGINA + '&offset=' + offset +
        (desde ? '&desde=' + encodeURIComponent(desde) : '');
      const resp = pedir_(url, clave);
      total = resp.total;
      Array.prototype.push.apply(traidos, resp.data);
      offset += resp.data.length;
      if (!resp.data.length) break;
    } while (offset < total);

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
    // Próximo backup arranca desde el alta más nueva que se trajo.
    if (traidos.length) {
      const maxAlta = traidos.reduce(function (m, r) { return r.created_at > m ? r.created_at : m; }, desde || '');
      props.setProperty('ULTIMA_ALTA', maxAlta);
    }

    // 2) Configuración y usuarios (copia completa, se pisa cada vez)
    volcarTabla_(HOJA_CONFIG, pedir_(CONFIG.URL_BACKEND + '/api/backup/config', clave).data,
      [['ID', 'id'], ['Categoría', 'categoria'], ['Valor', 'valor'], ['Activo', 'activo']]);
    volcarTabla_(HOJA_USUARIOS, pedir_(CONFIG.URL_BACKEND + '/api/backup/usuarios', clave).data,
      [['ID', 'id'], ['Usuario', 'username'], ['Rol', 'rol'], ['Activo', 'activo']]);

    // 3) CSV de respaldo en Drive
    const archivo = guardarCsvDe_(hReg, 'porteria_registros_');
    return { nuevos: nuevos.length, total: hReg.getLastRow() - 1, archivo: archivo };
  }
}

// ---------------------------------------------------------------
// Auxiliares
// ---------------------------------------------------------------

// Render free se duerme: el primer pedido puede tardar hasta ~1 minuto. Reintenta hasta 4 veces.
function despertarBackend_() {
  for (let i = 0; i < 4; i++) {
    try {
      const r = UrlFetchApp.fetch(CONFIG.URL_BACKEND + '/api/ping', { muteHttpExceptions: true });
      if (r.getResponseCode() === 200) return;
    } catch (e) { /* timeout mientras despierta */ }
    Utilities.sleep(20000);
  }
  throw new Error('El backend de Portería no responde (probé 4 veces durante ~2 minutos).');
}

function pedir_(url, clave) {
  let ultimoError = '';
  for (let i = 0; i < 3; i++) {
    const r = UrlFetchApp.fetch(url, { headers: { 'x-backup-key': clave }, muteHttpExceptions: true });
    const codigo = r.getResponseCode();
    if (codigo === 200) return JSON.parse(r.getContentText());
    if (codigo === 403) throw new Error('El backend rechazó la clave (403). Revisá que sea la misma que en Render.');
    if (codigo === 503) throw new Error('El backend no tiene configurada la clave BACKUP_KEY en Render (503).');
    ultimoError = 'HTTP ' + codigo + ': ' + r.getContentText().slice(0, 200);
    Utilities.sleep(5000);
  }
  throw new Error('Falló el pedido al backend: ' + ultimoError);
}

// Llama a una función RPC de Supabase (POST).
function supabaseRpcViejo_(nombre) {
  const url = CONFIG.SUPABASE_URL + '/rest/v1/rpc/' + nombre;
  const r = UrlFetchApp.fetch(url, {
    method: 'post',
    headers: { apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + CONFIG.SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    payload: '{}',
    muteHttpExceptions: true
  });
  const codigo = r.getResponseCode();
  if (codigo !== 200) throw new Error('Supabase RPC ' + nombre + ' respondió HTTP ' + codigo + ': ' + r.getContentText().slice(0, 200));
  return JSON.parse(r.getContentText());
}

function convertir_(v, tipo) {
  if (v === null || v === undefined) return '';
  if (tipo === 'fecha') return new Date(v);
  if (tipo === 'sino') return v ? 'Sí' : 'No';
  return String(v);
}

function hoja_(nombre) {
  const ss = SpreadsheetApp.getActive();
  return ss.getSheetByName(nombre) || ss.insertSheet(nombre);
}

function asegurarEncabezados_(h, encabezados) {
  if (h.getLastRow() === 0) {
    h.getRange(1, 1, 1, encabezados.length).setValues([encabezados]).setFontWeight('bold').setBackground('#E5EFFA');
    h.setFrozenRows(1);
  }
}

function volcarTabla_(nombre, filas, columnas) {
  const h = hoja_(nombre);
  h.clearContents();
  const datos = [columnas.map(function (c) { return c[0]; })].concat(filas.map(function (f) {
    return columnas.map(function (c) {
      const v = f[c[1]];
      if (typeof v === 'boolean') return v ? 'Sí' : 'No';
      return v === null || v === undefined ? '' : v;
    });
  }));
  h.getRange(1, 1, datos.length, columnas.length).setValues(datos);
  h.getRange(1, 1, 1, columnas.length).setFontWeight('bold').setBackground('#E5EFFA');
  h.setFrozenRows(1);
}

// CSV con ";" y coma decimal (locale español), con BOM para que Excel respete las tildes.
function guardarCsvDe_(hoja, prefijo) {
  const tz = Session.getScriptTimeZone();
  const valores = hoja.getDataRange().getValues();
  const csv = valores.map(function (fila) {
    return fila.map(function (v) {
      if (v instanceof Date) v = Utilities.formatDate(v, tz, 'dd/MM/yyyy HH:mm:ss');
      v = String(v);
      return /[;"\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
    }).join(';');
  }).join('\r\n');
  const carpetas = DriveApp.getFoldersByName(CONFIG.CARPETA_DRIVE);
  const carpeta = carpetas.hasNext() ? carpetas.next() : DriveApp.createFolder(CONFIG.CARPETA_DRIVE);
  const nombre = prefijo + Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd') + '.csv';
  const previos = carpeta.getFilesByName(nombre);
  if (previos.hasNext()) {
    const f = previos.next();
    f.setContent('' + csv);
    return f;
  }
  return carpeta.createFile(nombre, '' + csv, MimeType.CSV);
}

function log_(inicio, estado, nuevos, total, archivo, error, seccion) {
  const h = hoja_(HOJA_LOG);
  asegurarEncabezados_(h, ['Fecha', 'Estado', 'Registros nuevos', 'Total en la hoja', 'CSV', 'Error', 'Duración (s)', 'Sección']);
  if (h.getRange(1, 8).getValue() === '') h.getRange(1, 8).setValue('Sección').setFontWeight('bold').setBackground('#E5EFFA');
  h.appendRow([inicio, estado, nuevos, total, archivo, error, Math.round((new Date() - inicio) / 1000), seccion || 'Portería']);
  h.getRange(h.getLastRow(), 1).setNumberFormat('dd/MM/yyyy HH:mm');
}

function avisarError_(e) {
  try {
    const mail = Session.getEffectiveUser().getEmail();
    if (!mail) return;
    MailApp.sendEmail(mail, '⚠️ Falló el backup de Central Mantenimiento App',
      'El backup semanal no se pudo completar.\n\n' + e.message +
      '\n\nPlanilla: ' + SpreadsheetApp.getActive().getUrl() +
      '\n\nLos datos ya respaldados siguen en la planilla y en la carpeta "' + CONFIG.CARPETA_DRIVE + '" de Drive.');
  } catch (err) { /* si no se puede mandar el mail, queda el log */ }
}

function borrarActivadores_() {
  let n = 0;
  ScriptApp.getProjectTriggers().forEach(function (t) {
    const f = t.getHandlerFunction();
    if (f === 'hacerBackup' || f === 'mantenerActivo') { ScriptApp.deleteTrigger(t); n++; }
  });
  return n;
}

// ---------------------------------------------------------------
// USUARIOS AUTH (Supabase) → emails, contraseñas, módulos
// ---------------------------------------------------------------

function hacerBackupUsuariosManual() {
  const ui = SpreadsheetApp.getUi();
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) { ui.alert('Ya hay un backup corriendo.'); return; }
  const inicio = new Date();
  try {
    const u = backupUsuariosAuth_();
    log_(inicio, 'OK', u.usuarios, u.usuarios, '', '', 'Usuarios Auth');
    ui.alert('Backup de Usuarios Auth OK\n\n' + u.usuarios + ' usuarios respaldados en la pestaña "' + HOJA_USUARIOS_AUTH + '".');
  } catch (e) {
    log_(inicio, 'ERROR', 0, 0, '', e.message, 'Usuarios Auth');
    ui.alert('El backup de Usuarios Auth falló:\n\n' + e.message);
  } finally {
    lock.releaseLock();
  }
}

function backupUsuariosAuth_() {
  const datos = supabaseRpc_('backup_usuarios');
  const enc = ['Email', 'Contraseña', 'Tipo', 'Módulos', 'Último ingreso', 'Creado'];
  const h = hoja_(HOJA_USUARIOS_AUTH);
  h.clear();
  h.getRange(1, 1, 1, enc.length).setValues([enc])
    .setBackground(COLOR_ENCABEZADO).setFontColor('#FFFFFF').setFontWeight('bold');
  if (datos.length) {
    h.getRange(2, 1, datos.length, enc.length).setValues(datos.map(function (u) {
      return [u.email, u.password, u.tipo, u.modulos, u.ultimo_ingreso, u.creado];
    }));
  }
  h.setFrozenRows(1);
  return { usuarios: datos.length };
}

// ---------------------------------------------------------------
// RECLAMOS A PROVEEDORES (Supabase) → hojas del tracker
// ---------------------------------------------------------------
// Los reclamos cambian de estado, así que en cada backup las hojas se reescriben completas
// con la foto actual (no se acumulan como los registros de Portería).

const HOJA_RECLAMOS = 'Reclamos';
const HOJA_TABLERO_RECLAMOS = 'Tablero Reclamos';
const HOJA_HISTORIAL_RECLAMOS = 'Historial Reclamos';
const HOJA_LISTAS_RECLAMOS = 'Listas Reclamos';

const ESTADOS_RECLAMO = ['Nuevo', 'Enviado al proveedor', 'Respuesta proveedor', 'En resolución', 'Pendiente validación', 'Escalado', 'Reabierto', 'Cerrado'];
const TRAMOS_RECLAMO = ['0-7 días', '8-15 días', '16-30 días', '+30 días'];
const COLOR_TRAMO = { '0-7 días': null, '8-15 días': '#FFF3C4', '16-30 días': '#FFDDBF', '+30 días': '#F8CACA', 'Cerrado': '#D7F0DF' };
const COLOR_ENCABEZADO = '#1F3A5F';

// Columnas en el mismo orden que el tracker de reclamos; al final, datos extra para tableros.
const COLUMNAS_RECLAMOS = ['ID', 'Fecha alta', 'Sistema', 'Tipo', 'Motivo', 'Tienda', 'Categoría', 'Descripción del problema', 'Prioridad',
  'Vía', 'Estado', 'Persona que realizó el reclamo/solicitud', 'Compromiso proveedor', 'Fecha cierre', 'Días abiertos', 'Antigüedad',
  'Plazo', 'Próxima acción / comentarios', 'Referencia (OT SAP, Mantech, asunto mail)', 'En manos de', 'Veces reclamado',
  'Devoluciones', 'Formato', 'Región', 'Reaperturas', 'Última actualización',
  'Cargado por', 'Último cambio por', 'Último cambio', 'Tiendas del grupo', 'A cargo de', 'Respuestas del proveedor'];

function hacerBackupReclamosManual() {
  const ui = SpreadsheetApp.getUi();
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) { ui.alert('Ya hay un backup corriendo.'); return; }
  const inicio = new Date();
  try {
    const r = backupReclamos_();
    log_(inicio, 'OK', r.reclamos, r.reclamos, r.archivo.getUrl(), '', 'Reclamos');
    ui.alert('Backup de Reclamos OK\n\nReclamos: ' + r.reclamos + ' (' + r.abiertos + ' abiertos)\nCSV: ' + r.archivo.getName());
  } catch (e) {
    log_(inicio, 'ERROR', 0, 0, '', e.message, 'Reclamos');
    ui.alert('El backup de Reclamos falló:\n\n' + e.message);
  } finally {
    lock.releaseLock();
  }
}

function backupReclamos_() {
  const tz = Session.getScriptTimeZone();
  const datos = {
    reclamos: supabaseTodo_('reclamos', '*', 'fecha_alta.desc'),
    eventos: supabaseTodo_('reclamos_eventos', '*', 'fecha.asc'),
    provs: supabaseTodo_('reclamos_proveedores', 'nombre,activo,orden', 'orden.asc'),
    cats: supabaseTodo_('reclamos_categorias', 'nombre,activo,orden', 'orden.asc'),
    opciones: supabaseTodo_('reclamos_opciones', 'lista,valor,activo,orden', 'orden.asc'),
    tiendas: supabaseTodo_('tiendas', 'numero,local,formato,region', 'numero.asc')
  };
  const tiendas = {};
  datos.tiendas.forEach(function (t) { tiendas[t.numero] = t; });
  const ultimoComentario = {};
  datos.eventos.forEach(function (e) { if (e.comentario && e.tipo !== 'alta') ultimoComentario[e.reclamo_id] = e.comentario; });
  // Quién tocó el reclamo por última vez (los eventos vienen ordenados por fecha).
  const ultimoEvento = {};
  const QUE = { alta: 'Alta', estado: 'Cambio de estado', edicion: 'Edición', comentario: 'Comentario', reiteracion: 'Reclamó de nuevo',
    derivacion: 'Derivación', anulacion: 'Anulación', restauracion: 'Restauración', asignacion: 'Traspaso', respuesta: 'Respuesta del proveedor' };
  datos.eventos.forEach(function (e) { ultimoEvento[e.reclamo_id] = e; });

  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const DIA = 864e5;
  const soloFecha = function (x) { const d = new Date(x); d.setHours(0, 0, 0, 0); return d; };
  const fechaLocal = function (ymd) { if (!ymd) return null; const p = ymd.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); };
  const regionDe = function (t) { return !t ? '' : String(t.formato).toUpperCase() === 'EXPRESS' ? 'Express' : (t.region || ''); };

  // Los reclamos anulados (cargas de prueba, duplicados) no van a la hoja ni al tablero; su historial sí queda.
  datos.reclamos = datos.reclamos.filter(function (r) { return !r.anulado; });
  const calc = datos.reclamos.map(function (r) {
    const t = tiendas[r.tienda_numero];
    const cerrado = r.estado === 'Cerrado';
    const dias = Math.round(((cerrado && r.fecha_cierre ? soloFecha(r.fecha_cierre) : hoy) - soloFecha(r.fecha_alta)) / DIA);
    const comp = fechaLocal(r.fecha_compromiso);
    const antig = cerrado ? 'Cerrado' : dias <= 7 ? '0-7 días' : dias <= 15 ? '8-15 días' : dias <= 30 ? '16-30 días' : '+30 días';
    const plazo = cerrado ? 'Cerrado' : !comp ? 'Sin fecha' : hoy > comp ? 'VENCIDO' : 'En plazo';
    return { r: r, t: t, dias: dias, antig: antig, plazo: plazo, region: regionDe(t) };
  });

  // 1) Hoja Reclamos (formato del tracker)
  const filas = calc.map(function (c) {
    const r = c.r;
    return [r.id, new Date(r.fecha_alta), r.proveedor, r.tipo || '', r.motivo || '', c.t ? c.t.local : (r.tienda_numero || ''),
      r.categoria, r.descripcion, r.prioridad, r.canal || '', r.estado, r.solicitante || r.responsable || '',
      fechaLocal(r.fecha_compromiso) || '', r.fecha_cierre ? new Date(r.fecha_cierre) : '', c.dias, c.antig, c.plazo,
      ultimoComentario[r.id] || '', r.referencia || '', r.area_actual || '', 1 + (r.reiteraciones || 0), r.devoluciones || 0,
      c.t ? c.t.formato : '', c.region, r.reaperturas || 0, new Date(r.actualizado_at),
      r.creado_por || '', (ultimoEvento[r.id] || {}).usuario || '',
      ultimoEvento[r.id] ? (QUE[ultimoEvento[r.id].tipo] || ultimoEvento[r.id].tipo) + ' · ' + Utilities.formatDate(new Date(ultimoEvento[r.id].fecha), 'America/Argentina/Buenos_Aires', 'dd/MM/yyyy HH:mm') : '',
      (r.tiendas_grupo && r.tiendas_grupo.length > 1) ? r.tiendas_grupo.map(function (n) { return tiendas[n] ? tiendas[n].local : n; }).join(' | ') : '',
      r.responsable || '', r.respuestas || 0];
  });
  const hR = hoja_(HOJA_RECLAMOS);
  escribirTablaFormateada_(hR, COLUMNAS_RECLAMOS, filas);
  if (filas.length) {
    [2, 13, 14].forEach(function (col) { hR.getRange(2, col, filas.length, 1).setNumberFormat('dd/MM/yyyy'); });
    hR.getRange(2, 26, filas.length, 1).setNumberFormat('dd/MM/yyyy HH:mm');
    const fondos = calc.map(function (c) { return [COLOR_TRAMO[c.antig] || null]; });
    hR.getRange(2, 16, filas.length, 1).setBackgrounds(fondos);
    const plazos = calc.map(function (c) { return [c.plazo === 'VENCIDO' ? '#C0262D' : null]; });
    hR.getRange(2, 17, filas.length, 1).setFontColors(plazos).setFontWeight('bold');
  }

  // 2) Historial
  const hH = hoja_(HOJA_HISTORIAL_RECLAMOS);
  escribirTablaFormateada_(hH, ['ID reclamo', 'Fecha', 'Usuario', 'Tipo', 'Estado anterior', 'Estado nuevo', 'Comentario'],
    datos.eventos.map(function (e) {
      return [e.reclamo_id, new Date(e.fecha), e.usuario || '', e.tipo, e.estado_anterior || '', e.estado_nuevo || '', e.comentario || ''];
    }));
  if (datos.eventos.length) hH.getRange(2, 2, datos.eventos.length, 1).setNumberFormat('dd/MM/yyyy HH:mm');

  // 3) Listas (copia de lo configurado en la app)
  const provs = datos.provs.filter(function (p) { return p.activo; }).map(function (p) { return p.nombre; });
  const cats = datos.cats.filter(function (c) { return c.activo; }).map(function (c) { return c.nombre; });
  const op = function (lista) { return datos.opciones.filter(function (o) { return o.lista === lista && o.activo; }).map(function (o) { return o.valor; }); };
  const listas = [provs, op('tipo'), op('motivo'), op('via'), op('area'), cats, ESTADOS_RECLAMO, ['Alta', 'Media', 'Baja']];
  const largo = Math.max.apply(null, listas.map(function (l) { return l.length; }));
  const filasListas = [];
  for (let i = 0; i < largo; i++) filasListas.push(listas.map(function (l) { return l[i] || ''; }));
  const hL = hoja_(HOJA_LISTAS_RECLAMOS);
  escribirTablaFormateada_(hL, ['Proveedores', 'Tipos', 'Motivos', 'Vías', 'En manos de', 'Categorías', 'Estados', 'Prioridad'], filasListas);
  hL.getRange(largo + 3, 1).setValue('Copia de lo configurado en la app. Para agregar opciones: Supabase → Table editor → reclamos_proveedores, reclamos_categorias o reclamos_opciones (tipos, motivos, vías). Aparecen acá en el próximo backup.')
    .setFontStyle('italic').setFontColor('#5A6B82');

  // 4) Tablero
  const todosProvs = provs.slice();
  calc.forEach(function (c) { if (todosProvs.indexOf(c.r.proveedor) === -1) todosProvs.push(c.r.proveedor); });
  armarTableroReclamos_(calc, todosProvs, tz);

  // 5) CSV en Drive
  const archivo = guardarCsvDe_(hR, 'reclamos_');
  return { reclamos: calc.length, abiertos: calc.filter(function (c) { return c.r.estado !== 'Cerrado'; }).length, archivo: archivo };
}

function armarTableroReclamos_(calc, provs, tz) {
  const h = hoja_(HOJA_TABLERO_RECLAMOS);
  h.clear();
  h.getRange('A1').setValue('Tablero de reclamos a proveedores — Eficiencia Energética').setFontSize(14).setFontWeight('bold').setFontColor(COLOR_ENCABEZADO);
  h.getRange('A2').setValue('Actualizado al ' + Utilities.formatDate(new Date(), tz, 'dd/MM/yyyy HH:mm')).setFontStyle('italic');

  const enc = ['Sistema', 'Total', 'Abiertos', 'Vencidos', '0-7 días', '8-15 días', '16-30 días', '+30 días', 'Escalados', 'Cerrados',
    'Veces reclamado', 'Reclamados +1 vez', 'Devoluciones', 'Prom. días resolución'];
  const fila = function (lista, nombre) {
    const ab = lista.filter(function (c) { return c.r.estado !== 'Cerrado'; });
    const ce = lista.filter(function (c) { return c.r.estado === 'Cerrado'; });
    return [nombre, lista.length, ab.length, ab.filter(function (c) { return c.plazo === 'VENCIDO'; }).length]
      .concat(TRAMOS_RECLAMO.map(function (t) { return ab.filter(function (c) { return c.antig === t; }).length; }))
      .concat([ab.filter(function (c) { return c.r.estado === 'Escalado'; }).length, ce.length,
        lista.reduce(function (s, c) { return s + 1 + (c.r.reiteraciones || 0); }, 0),
        lista.filter(function (c) { return (c.r.reiteraciones || 0) > 0; }).length,
        lista.reduce(function (s, c) { return s + (c.r.devoluciones || 0); }, 0),
        ce.length ? Math.round(ce.reduce(function (s, c) { return s + c.dias; }, 0) / ce.length * 10) / 10 : '-']);
  };
  let f = 4;
  const bloque = function (titulo, encabezados, filas, conTotal) {
    h.getRange(f, 1).setValue(titulo).setFontWeight('bold').setFontColor(COLOR_ENCABEZADO);
    f++;
    h.getRange(f, 1, 1, encabezados.length).setValues([encabezados]).setBackground(COLOR_ENCABEZADO).setFontColor('#FFFFFF').setFontWeight('bold');
    if (filas.length) h.getRange(f + 1, 1, filas.length, encabezados.length).setValues(filas);
    f += filas.length + 1;
    if (conTotal) {
      h.getRange(f, 1, 1, encabezados.length).setValues([conTotal]).setFontWeight('bold').setBackground('#EAF0F7');
      f++;
    }
    f += 2;
  };
  bloque('Por sistema', enc, provs.map(function (p) { return fila(calc.filter(function (c) { return c.r.proveedor === p; }), p); }), fila(calc, 'TOTAL'));
  bloque('Por estado', ['Estado', 'Cantidad'], ESTADOS_RECLAMO.map(function (e) { return [e, calc.filter(function (c) { return c.r.estado === e; }).length]; }));
  const regiones = [];
  calc.forEach(function (c) { if (regiones.indexOf(c.region || 'Sin región') === -1) regiones.push(c.region || 'Sin región'); });
  bloque('Por región', enc.map(function (x, i) { return i === 0 ? 'Región' : x; }),
    regiones.sort().map(function (rg) { return fila(calc.filter(function (c) { return (c.region || 'Sin región') === rg; }), rg); }));
  const agrupar = function (titulo, campo) {
    const valores = [];
    calc.forEach(function (c) { const v = c.r[campo] || 'Sin dato'; if (valores.indexOf(v) === -1) valores.push(v); });
    bloque(titulo, enc.map(function (x, i) { return i === 0 ? titulo.replace('Por ', '').replace(/^./, function (m) { return m.toUpperCase(); }) : x; }),
      valores.sort().map(function (v) { return fila(calc.filter(function (c) { return (c.r[campo] || 'Sin dato') === v; }), v); }));
  };
  agrupar('Por tipo', 'tipo');
  agrupar('Por motivo', 'motivo');
  agrupar('Por vía', 'canal');
  agrupar('En manos de', 'area_actual');
  const cats = [];
  calc.forEach(function (c) { if (cats.indexOf(c.r.categoria) === -1) cats.push(c.r.categoria); });
  bloque('Por categoría', ['Categoría', 'Abiertos', 'Cerrados', 'Total'], cats.sort().map(function (k) {
    const l = calc.filter(function (c) { return c.r.categoria === k; });
    const ab = l.filter(function (c) { return c.r.estado !== 'Cerrado'; }).length;
    return [k, ab, l.length - ab, l.length];
  }));
  h.setColumnWidth(1, 220);
  h.setFrozenRows(0);
}

// Lee una tabla de Supabase por su API REST, paginando de a 1000 filas.
function supabaseTodoViejo_(tabla, columnas, orden) {
  const out = [];
  for (let desde = 0; ; desde += 1000) {
    const url = CONFIG.SUPABASE_URL + '/rest/v1/' + tabla + '?select=' + encodeURIComponent(columnas) + (orden ? '&order=' + orden : '');
    const r = UrlFetchApp.fetch(url, {
      headers: { apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + CONFIG.SUPABASE_ANON_KEY, Range: desde + '-' + (desde + 999) },
      muteHttpExceptions: true
    });
    const codigo = r.getResponseCode();
    if (codigo !== 200 && codigo !== 206) throw new Error('Supabase (' + tabla + ') respondió HTTP ' + codigo + ': ' + r.getContentText().slice(0, 200));
    const lote = JSON.parse(r.getContentText());
    Array.prototype.push.apply(out, lote);
    if (lote.length < 1000) return out;
  }
}

function escribirTablaFormateada_(h, encabezados, filas) {
  h.clear();
  h.getRange(1, 1, 1, encabezados.length).setValues([encabezados])
    .setBackground(COLOR_ENCABEZADO).setFontColor('#FFFFFF').setFontWeight('bold').setWrap(true);
  if (filas.length) h.getRange(2, 1, filas.length, encabezados.length).setValues(filas);
  h.setFrozenRows(1);
}

// ---------------------------------------------------------------
// FRÍO ALIMENTARIO (Supabase) → copia completa
// ---------------------------------------------------------------

const HOJA_FRIO_RELEVAMIENTOS = 'Frío - Relevamientos';
const HOJA_FRIO_TIENDAS = 'Frío - Tiendas';
const HOJA_FRIO_PARAMETROS = 'Frío - Parámetros kg';
const HOJA_FRIO_MAESTRAS = 'Frío - Cuentas maestras';

function hacerBackupFrioManual() {
  const ui = SpreadsheetApp.getUi();
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) { ui.alert('Ya hay un backup corriendo.'); return; }
  const inicio = new Date();
  try {
    const f = backupFrio_();
    log_(inicio, 'OK', f.relevamientos, f.tiendas, f.archivo.getUrl(), '', 'Frío');
    ui.alert('Backup de Frío Alimentario OK\n\nRelevamientos: ' + f.relevamientos + '\nTiendas: ' + f.tiendas + '\nCSV: ' + f.archivo.getName());
  } catch (e) {
    log_(inicio, 'ERROR', 0, 0, '', e.message, 'Frío');
    ui.alert('El backup de Frío falló:\n\n' + e.message);
  } finally {
    lock.releaseLock();
  }
}

// Copia todas las columnas tal cual están en la base (si mañana se agrega una columna, se copia sola).
function backupFrio_() {
  const tiendas = supabaseTodo_('tiendas', '*', 'numero.asc');
  const rel = supabaseTodo_('relevamientos', '*', 'tienda_numero.asc');
  const params = supabaseTodo_('parametros_kg', '*', 'grupo.asc,equipo.asc,m2_hasta.asc.nullslast');
  const maestras = supabaseTodo_('cuentas_maestras', '*', 'email.asc');

  const porNumero = {};
  tiendas.forEach(function (t) { porNumero[t.numero] = t; });
  // Relevamientos con el nombre, formato y región de la tienda adelante, para que se lean solos.
  const relConTienda = rel.map(function (r) {
    const t = porNumero[r.tienda_numero] || {};
    const fila = { tienda_numero: r.tienda_numero, local: t.local || '', formato: t.formato || '', region: t.region || '',
      'Último en cargar o editar': r.cargado_por || '', 'Fecha última carga': r.ultima_carga || '' };
    Object.keys(r).forEach(function (k) { if (k !== 'tienda_numero' && k !== 'cargado_por' && k !== 'ultima_carga') fila[k] = r[k]; });
    return fila;
  });

  const hRel = volcarSupabase_(HOJA_FRIO_RELEVAMIENTOS, relConTienda);
  volcarSupabase_(HOJA_FRIO_TIENDAS, tiendas);
  volcarSupabase_(HOJA_FRIO_PARAMETROS, params);
  volcarSupabase_(HOJA_FRIO_MAESTRAS, maestras);
  const archivo = guardarCsvDe_(hRel, 'frio_relevamientos_');
  return { relevamientos: rel.length, tiendas: tiendas.length, archivo: archivo };
}

function volcarSupabase_(nombre, filas) {
  const columnas = [];
  filas.forEach(function (f) { Object.keys(f).forEach(function (k) { if (columnas.indexOf(k) === -1) columnas.push(k); }); });
  const h = hoja_(nombre);
  if (!columnas.length) { h.clear(); h.getRange(1, 1).setValue('(sin datos)'); return h; }
  const esFecha = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
  escribirTablaFormateada_(h, columnas, filas.map(function (f) {
    return columnas.map(function (c) {
      const v = f[c];
      if (v === null || v === undefined) return '';
      if (typeof v === 'boolean') return v ? 'Sí' : 'No';
      if (Array.isArray(v)) return v.join(' · ');   // ej. compresores por central: 4 · 3
      if (typeof v === 'string' && esFecha.test(v)) return new Date(v);
      return v;
    });
  }));
  return h;
}

// ---------------------------------------------------------------
// ANTI-PAUSA: consulta mínima diaria a Supabase (proyecto de Frío + Reclamos)
// ---------------------------------------------------------------

function mantenerActivo() {
  const props = PropertiesService.getScriptProperties();
  try {
    supabaseTodo_('reclamos_categorias', 'nombre', null);
    props.setProperty('ULTIMO_ANTIPAUSA', Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm'));
    props.deleteProperty('FALLAS_ANTIPAUSA');
  } catch (e) {
    // Avisa por mail recién al segundo día seguido de falla, para no mandar alarmas por un corte de un rato.
    const fallas = Number(props.getProperty('FALLAS_ANTIPAUSA') || 0) + 1;
    props.setProperty('FALLAS_ANTIPAUSA', String(fallas));
    if (fallas === 2) avisarError_(new Error('El anti-pausa de Supabase falló dos días seguidos: ' + e.message +
      '. Si el proyecto quedó pausado, reactivalo desde el panel de Supabase (Restore project).'));
  }
}
