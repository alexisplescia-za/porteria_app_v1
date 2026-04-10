/**
 * ════════════════════════════════════════════════════════════════
 *  PORTERÍA CARREFOUR — Google Apps Script Backend v2.0
 *  Desarrollado por: alexis plescia, 2026
 * ════════════════════════════════════════════════════════════════
 *
 *  HOJAS REQUERIDAS (se crean automáticamente si no existen):
 *    • REGISTRO    → registros de ingresos/egresos
 *    • CONFIG      → valores dinámicos de los formularios
 *    • AUDITORIA   → log de todas las acciones
 *
 *  CÓMO DEPLOYAR:
 *    1. Abrí este script en script.google.com
 *    2. Menú → Implementar → Nueva implementación
 *    3. Tipo: Aplicación web
 *    4. Ejecutar como: Yo (tu cuenta)
 *    5. Quién tiene acceso: Cualquier persona (o tu organización)
 *    6. Implementar → Copiá la URL → pegala en el Panel de Admin de la app
 */

// ════════════════════════════════════════════════════════════════
//  NOMBRES DE HOJAS Y ENCABEZADOS
// ════════════════════════════════════════════════════════════════

const NOMBRE_REGISTRO  = "REGISTRO";
const NOMBRE_CONFIG    = "CONFIG";
const NOMBRE_AUDITORIA = "AUDITORIA";

const COLS_REGISTRO = [
  "ID Operación",
  "Fecha y Hora",
  "Tipo Op",
  "Perfil",
  "Nombre / Empresa",
  "Remito / OT",
  "Detalle Material",
  "Estado",
  "Observaciones",
  "Módulo",
  "Egreso Temprano",
  "Grupo ID",
  "Usuario Carga",
  "Timestamp Sistema",
];

const COLS_CONFIG    = ["Categoría", "Valor", "Activo"];
const COLS_AUDITORIA = ["Timestamp", "Acción", "Usuario", "Detalle"];

// ════════════════════════════════════════════════════════════════
//  ENTRY POINTS — doPost y doGet
// ════════════════════════════════════════════════════════════════

/**
 * Recibe peticiones POST desde la app React.
 *
 * La app envía un JSON con la forma:
 *   { action: "...", data: ... }
 *
 * Acciones soportadas:
 *   guardar_registro   → guarda un único registro
 *   guardar_lote       → guarda un array de registros (ej: egreso temprano)
 *   guardar_config     → actualiza la hoja CONFIG
 *   get_config         → devuelve toda la configuración
 *   get_registros      → devuelve registros con filtros opcionales
 *
 * Para compatibilidad con versiones anteriores:
 *   si el body no tiene "action", se trata como guardar_registro directo.
 */
function doPost(e) {
  // Bloqueo para evitar escrituras simultáneas duplicadas
  const lock = LockService.getScriptLock();
  lock.tryLock(12000);

  try {
    // ── Parseo robusto ────────────────────────────────────────────────
    // La app envía Content-Type: text/plain con no-cors para evitar el
    // preflight OPTIONS que GAS rechaza cuando se llama desde file://.
    // e.postData.contents llega igual independientemente del Content-Type.
    const raw = e.postData ? e.postData.contents : "{}";
    const body = JSON.parse(raw);
    let resultado;

    switch (body.action) {
      case "guardar_registro":
        resultado = guardarRegistro(body.data);
        break;

      case "guardar_lote":
        resultado = guardarLote(body.data);
        break;

      case "guardar_config":
        resultado = guardarConfig(body.data);
        break;

      case "get_config":
        resultado = getConfig();
        break;

      case "get_registros":
        resultado = getRegistros(body.filtros || {});
        break;

      default:
        // Compatibilidad: body sin "action" → guardar directamente
        resultado = guardarRegistro(body);
    }

    return respuestaOk(resultado);

  } catch (err) {
    registrarAuditoria("ERROR_SISTEMA", "sistema", err.toString());
    return respuestaError(err.toString());

  } finally {
    lock.releaseLock();
  }
}

/**
 * Maneja peticiones GET (para probar conexión o leer datos).
 *
 * Parámetros de URL:
 *   ?action=ping           → devuelve { status: "OK" }
 *   ?action=get_config     → devuelve la configuración
 *   ?action=get_registros  → devuelve todos los registros
 */
function doGet(e) {
  const action = (e.parameter && e.parameter.action) || "ping";

  try {
    if (action === "ping")          return respuestaOk({ status: "OK", timestamp: new Date().toISOString() });
    if (action === "get_config")    return respuestaOk(getConfig());
    if (action === "get_registros") return respuestaOk(getRegistros({}));

    return respuestaError("Acción no reconocida: " + action);
  } catch (err) {
    return respuestaError(err.toString());
  }
}

// ════════════════════════════════════════════════════════════════
//  REGISTRO — guardar y leer
// ════════════════════════════════════════════════════════════════

function guardarRegistro(data) {
  const ss   = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = obtenerOCrearHoja(ss, NOMBRE_REGISTRO, COLS_REGISTRO);

  // Generar ID si la app no lo envió (compatibilidad)
  if (!data.id) {
    data.id = generarId(data.tipoOp || "INGRESO", contarRegistros(hoja) + 1);
  }

  const fila = [
    data.id,
    data.fechaHora ? new Date(data.fechaHora) : new Date(),
    data.tipoOp    || "INGRESO",
    data.perfil    || "",
    data.nombre    || "",
    data.remito    || "N/A",
    data.detalle   || "N/A",
    data.estado    || "N/A",
    data.obs       || "N/A",
    data.modulo    || "general",
    data.egresoTemprano ? "Sí" : "No",
    data.grupoId   || data.id || "",
    data.usuario   || obtenerEmailSeguro(),
    new Date(),    // timestamp real de carga en el servidor
  ];

  hoja.appendRow(fila);
  aplicarFormatoFila(hoja, hoja.getLastRow(), data.tipoOp, data.egresoTemprano);
  registrarAuditoria("GUARDADO", data.usuario || "app", `ID:${data.id} | ${data.tipoOp} | ${data.nombre}`);

  return {
    success: true,
    id:      data.id,
    fila:    hoja.getLastRow(),
    mensaje: "Registro " + data.id + " guardado correctamente",
  };
}

/**
 * Guarda un array de registros en orden.
 * Usado cuando la app envía ingreso + egreso temprano juntos.
 */
function guardarLote(registros) {
  if (!Array.isArray(registros) || registros.length === 0) {
    throw new Error("El lote está vacío o tiene un formato inválido.");
  }

  const resultados = registros.map(r => guardarRegistro(r));

  return {
    success:  true,
    guardados: resultados.length,
    ids:      resultados.map(r => r.id),
    mensaje:  resultados.length + " registro(s) guardados correctamente",
  };
}

/**
 * Lee todos los registros de la hoja REGISTRO y los devuelve como array de objetos.
 * Acepta filtros opcionales: { tipoOp, perfil, modulo, desde, hasta }
 */
function getRegistros(filtros) {
  const ss   = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = ss.getSheetByName(NOMBRE_REGISTRO);

  if (!hoja || hoja.getLastRow() <= 1) {
    return { success: true, data: [], total: 0 };
  }

  const filas = hoja
    .getRange(2, 1, hoja.getLastRow() - 1, COLS_REGISTRO.length)
    .getValues();

  const registros = filas
    .filter(f => f[0] !== "")
    .map(f => ({
      id:             f[0],
      fechaHora:      f[1] ? new Date(f[1]).toISOString() : null,
      tipoOp:         f[2],
      perfil:         f[3],
      nombre:         f[4],
      remito:         f[5],
      detalle:        f[6],
      estado:         f[7],
      obs:            f[8],
      modulo:         f[9],
      egresoTemprano: f[10] === "Sí",
      grupoId:        f[11],
      usuario:        f[12],
    }))
    .filter(r => {
      if (filtros.tipoOp  && r.tipoOp  !== filtros.tipoOp)  return false;
      if (filtros.perfil  && r.perfil  !== filtros.perfil)   return false;
      if (filtros.modulo  && r.modulo  !== filtros.modulo)   return false;
      if (filtros.desde   && new Date(r.fechaHora) < new Date(filtros.desde)) return false;
      if (filtros.hasta   && new Date(r.fechaHora) > new Date(filtros.hasta)) return false;
      return true;
    });

  return { success: true, data: registros, total: registros.length };
}

// ════════════════════════════════════════════════════════════════
//  CONFIG — leer y guardar
// ════════════════════════════════════════════════════════════════

/**
 * Lee la hoja CONFIG y devuelve un objeto con las categorías como keys
 * y arrays de valores como values.
 *
 * Ejemplo de resultado:
 *   {
 *     proveedores:      ["Empresa A", "Empresa B", ...],
 *     oficinaTecnica:   ["Nombre 1", ...],
 *     jefes:            [...],
 *     estadosMaterial:  [...],
 *     motivosGenerador: [...],
 *   }
 */
function getConfig() {
  const ss   = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = ss.getSheetByName(NOMBRE_CONFIG);

  if (!hoja || hoja.getLastRow() <= 1) {
    return { success: true, data: {} };
  }

  const filas = hoja
    .getRange(2, 1, hoja.getLastRow() - 1, 3)
    .getValues();

  const cfg = {};
  for (const [categoria, valor, activo] of filas) {
    if (!categoria || activo === false) continue;
    const key = categoria.toString().trim();
    if (!cfg[key]) cfg[key] = [];
    if (valor) cfg[key].push(valor.toString().trim());
  }

  return { success: true, data: cfg };
}

/**
 * Recibe el objeto de configuración de la app y lo escribe en la hoja CONFIG.
 * Reemplaza todo el contenido existente.
 */
function guardarConfig(cfg) {
  const ss   = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = obtenerOCrearHoja(ss, NOMBRE_CONFIG, COLS_CONFIG);

  // Limpiar filas de datos (mantener encabezado)
  if (hoja.getLastRow() > 1) {
    hoja.getRange(2, 1, hoja.getLastRow() - 1, 3).clearContent();
  }

  const filas = [];
  const ignorar = ["gsUrl"]; // propiedades de la app que no van en Sheets

  for (const [categoria, valores] of Object.entries(cfg)) {
    if (ignorar.includes(categoria)) continue;
    if (!Array.isArray(valores))     continue;
    for (const v of valores) {
      if (v) filas.push([categoria, v.toString().trim(), true]);
    }
  }

  if (filas.length > 0) {
    hoja.getRange(2, 1, filas.length, 3).setValues(filas);
    // Colorear la columna de categorías
    colorearColumnaCategorias(hoja);
  }

  registrarAuditoria("CONFIG_GUARDADA", "admin", filas.length + " valores guardados");
  return { success: true, mensaje: "Configuración guardada. " + filas.length + " valores." };
}

// ════════════════════════════════════════════════════════════════
//  AUDITORÍA
// ════════════════════════════════════════════════════════════════

function registrarAuditoria(accion, usuario, detalle) {
  try {
    const ss   = SpreadsheetApp.getActiveSpreadsheet();
    const hoja = obtenerOCrearHoja(ss, NOMBRE_AUDITORIA, COLS_AUDITORIA);
    hoja.appendRow([new Date(), accion, usuario, detalle]);
  } catch (_) {
    // Silencioso: la auditoría no debe bloquear la operación principal
  }
}

// ════════════════════════════════════════════════════════════════
//  FORMATO Y ESTILO DE HOJAS
// ════════════════════════════════════════════════════════════════

/**
 * Retorna la hoja si existe; si no, la crea con encabezados formateados.
 */
function obtenerOCrearHoja(ss, nombre, headers) {
  let hoja = ss.getSheetByName(nombre);

  if (!hoja) {
    hoja = ss.insertSheet(nombre);
    const rango = hoja.getRange(1, 1, 1, headers.length);
    rango.setValues([headers]);
    rango.setBackground("#0b0d16");
    rango.setFontColor("#4a8fff");
    rango.setFontWeight("bold");
    rango.setFontSize(11);
    rango.setBorder(true, true, true, true, true, true, "#252840", SpreadsheetApp.BorderStyle.SOLID);
    hoja.setFrozenRows(1);
    hoja.setTabColor("#4a8fff");

    // Anchos de columna personalizados para REGISTRO
    if (nombre === NOMBRE_REGISTRO) {
      hoja.setColumnWidth(1, 110);  // ID
      hoja.setColumnWidth(2, 160);  // Fecha
      hoja.setColumnWidth(3, 90);   // Tipo Op
      hoja.setColumnWidth(4, 120);  // Perfil
      hoja.setColumnWidth(5, 220);  // Nombre
      hoja.setColumnWidth(6, 120);  // Remito
      hoja.setColumnWidth(7, 200);  // Detalle
      hoja.setColumnWidth(8, 110);  // Estado
      hoja.setColumnWidth(9, 220);  // Observaciones
      hoja.setColumnWidth(10, 90);  // Módulo
      hoja.setColumnWidth(11, 110); // Egreso Temprano
      hoja.setColumnWidth(12, 110); // Grupo ID
      hoja.setColumnWidth(13, 200); // Usuario
      hoja.setColumnWidth(14, 160); // Timestamp
    }
  }

  return hoja;
}

/**
 * Colorea la última fila de REGISTRO según el tipo de operación.
 */
function aplicarFormatoFila(hoja, numFila, tipoOp, egresoTemprano) {
  try {
    const rango = hoja.getRange(numFila, 1, 1, COLS_REGISTRO.length);

    // Color de fondo sutil por tipo
    const bgColor = tipoOp === "INGRESO" ? "#e8f5e9" : "#ffebee";
    rango.setBackground(bgColor);

    // Celda de Tipo Op con color más intenso
    const celdaTipo = hoja.getRange(numFila, 3);
    if (tipoOp === "INGRESO") {
      celdaTipo.setBackground("#27500a").setFontColor("#4ade80").setFontWeight("bold");
    } else {
      celdaTipo.setBackground("#791f1f").setFontColor("#f87171").setFontWeight("bold");
    }

    // Marcar egreso temprano con fondo ámbar
    if (egresoTemprano) {
      hoja.getRange(numFila, 11).setBackground("#f59e0b").setFontColor("#412402").setFontWeight("bold");
    }

    // Formato de fecha
    hoja.getRange(numFila, 2).setNumberFormat("dd/mm/yyyy hh:mm");
    hoja.getRange(numFila, 14).setNumberFormat("dd/mm/yyyy hh:mm:ss");

  } catch (_) {}
}

/**
 * Colorea la columna de categorías en la hoja CONFIG.
 */
function colorearColumnaCategorias(hoja) {
  try {
    if (hoja.getLastRow() <= 1) return;

    const colores = {
      proveedores:      { bg: "#e8f0fe", font: "#1a73e8" },
      oficinaTecnica:   { bg: "#e6f4ea", font: "#137333" },
      jefes:            { bg: "#fce8e6", font: "#c5221f" },
      estadosMaterial:  { bg: "#fef7e0", font: "#b06000" },
      motivosGenerador: { bg: "#f3e8fd", font: "#8430ce" },
    };

    const filas = hoja.getRange(2, 1, hoja.getLastRow() - 1, 1).getValues();
    filas.forEach(([cat], i) => {
      const cfg = colores[cat];
      if (cfg) {
        hoja.getRange(i + 2, 1).setBackground(cfg.bg).setFontColor(cfg.font);
      }
    });
  } catch (_) {}
}

// ════════════════════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════════════════════

function generarId(tipoOp, numero) {
  const prefijo = tipoOp === "INGRESO" ? "IN" : "EG";
  return prefijo + "-" + String(numero).padStart(4, "0");
}

function contarRegistros(hoja) {
  return Math.max(hoja.getLastRow() - 1, 0);
}

function obtenerEmailSeguro() {
  try { return Session.getActiveUser().getEmail() || "sistema"; }
  catch (_) { return "sistema"; }
}

function respuestaOk(data) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, ...data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function respuestaError(mensaje) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: false, error: mensaje }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ════════════════════════════════════════════════════════════════
//  FUNCIÓN DE SETUP INICIAL (ejecutar UNA sola vez)
// ════════════════════════════════════════════════════════════════

/**
 * Ejecutá esta función desde el editor de Apps Script para:
 *   - Crear todas las hojas con formato
 *   - Cargar la configuración base en CONFIG
 *
 * Menú: Ejecutar → inicializarSistema
 */
function inicializarSistema() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Crear hojas
  obtenerOCrearHoja(ss, NOMBRE_REGISTRO,  COLS_REGISTRO);
  obtenerOCrearHoja(ss, NOMBRE_CONFIG,    COLS_CONFIG);
  obtenerOCrearHoja(ss, NOMBRE_AUDITORIA, COLS_AUDITORIA);

  // Cargar config base en CONFIG
  guardarConfig({
    proveedores: [
      "A.G. Pruden & Cia. S.A.(AGP)", "Abl S.A.", "Arenas Ascensores SRL",
      "Autobat S.A.C.I.", "B.G.H. S.A. (Eco Smart)", "Bertolotto Srl",
      "CLP SRL", "Damitech Argentina SRL", "Del Sur Fumigaciones SRL",
      "Electricidad Serrano Sa", "Electromantenimiento SRL", "Emda Solucion Inteligente S.A",
      "Energia Controlada Srl (Enercon)", "Epta Argentina Sa",
      "Ferreteria Industrial Bottero Sa", "Ferreteria Industrial Tc Srl",
      "Global Clima S.R.L.", "Ingerpro S.A.", "Kunas SRL",
      "Matafuegos Donny Srl", "Mil Equipos S.A.", "Morini Srl",
      "Q Electric S.R.L", "Refrigeracion Lope De Vega S.R.L.",
      "Segusur Matafuegos SRL", "Simplia S.A", "Sistemas Electrificados S.R.L",
      "T.C.L. Sa (Alto Energy)", "Tecnoge Srl", "TK Elevadores Argentina (TEKNICA Elevación S.A.)",
      "Toyota Material Handling Mercosur C", "Trane De Argentina Sa",
      "V&V Servicios y Mantenimientos S.A", "Xonet Automacion Srl",
    ],
    oficinaTecnica: [
      "Matías Dávalos", "Maximiliano Canosa", "Luis Ramírez", "Pablo Fernández",
    ],
    jefes: [
      "Juan Pérez", "Carlos López", "Ana García", "Roberto Silva",
    ],
    estadosMaterial: [
      "Nuevo", "Usado", "A Reparar", "Reparado", "Para Baja", "En garantía",
    ],
    motivosGenerador: [
      "Mantenimiento preventivo", "Reparación", "Instalación",
      "Retiro definitivo", "Prueba técnica", "Actualización",
    ],
  });

  SpreadsheetApp.getUi().alert("✅ Sistema inicializado correctamente.\n\nHojas creadas:\n• REGISTRO\n• CONFIG\n• AUDITORIA\n\nPodés deployar la app web ahora.");
}

// ════════════════════════════════════════════════════════════════
//  FUNCIÓN DE PRUEBA
// ════════════════════════════════════════════════════════════════

/**
 * Ejecutá esta función para probar que todo funciona antes de deployar.
 */
function probarSistema() {
  const testData = {
    action: "guardar_lote",
    data: [
      {
        id: "IN-TEST",
        grupoId: "GRP-TEST",
        fechaHora: new Date().toISOString(),
        tipoOp: "INGRESO",
        perfil: "Proveedor",
        nombre: "Empresa de Prueba S.A.",
        remito: "TEST-001",
        detalle: "Material de prueba",
        estado: "Nuevo",
        obs: "Registro de prueba - se puede borrar",
        modulo: "general",
        egresoTemprano: false,
        usuario: "test@sistema.com",
      },
    ],
  };

  // Simular doPost
  const fakeEvent = { postData: { contents: JSON.stringify(testData) } };
  const resultado = doPost(fakeEvent);
  Logger.log("Resultado prueba: " + resultado.getContent());
  SpreadsheetApp.getUi().alert("✅ Prueba completada. Revisá la hoja REGISTRO.\n\n" + resultado.getContent());
}
