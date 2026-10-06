// Carga de Frío Alimentario — frontend conectado directo a Supabase.
// Reemplaza a Codigo.gs + JavaScript.html de la versión en Apps Script.

var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

var STEPPERS_MT = [
  { key: 'centralesMT', col: 'centrales_mt', label: 'Centrales MT' },
  { key: 'camarasAutocontMT', col: 'camaras_autocont_mt', label: 'Cámaras autocontenidas MT' },
  { key: 'gondolasAutocontMT', col: 'gondolas_autocont_mt', label: 'Góndolas autocontenidas MT' },
  { key: 'pozosMT', col: 'pozos_mt', label: 'Pozos MT' },
  { key: 'centralesDual', col: 'centrales_dual', label: 'Centrales Dual (MT+BT)' },
  { key: 'autocontMTCarnes', col: 'autocont_mt_carnes', label: 'Autocontenidos MT carnes', soloExpress: true },
  { key: 'autocontMTR404', col: 'autocont_mt_r404', label: 'Autocontenidos MT con R404', soloExpress: true }
];
var STEPPERS_BT = [
  { key: 'centralesBT', col: 'centrales_bt', label: 'Centrales BT' },
  { key: 'camarasAutocontBT', col: 'camaras_autocont_bt', label: 'Cámaras autocontenidas BT' },
  { key: 'gondolasAutocontBT', col: 'gondolas_autocont_bt', label: 'Góndolas autocontenidas BT' },
  { key: 'pozosBT', col: 'pozos_bt', label: 'Pozos BT' },
  { key: 'camarasMTBTDual', col: 'camaras_mtbt_dual', label: 'Cámaras MT+BT (Dual)' },
  { key: 'autocontReemplazoBT', col: 'autocont_reemplazo_bt', label: 'Autocont. que reemplazaron central BT' },
  { key: 'autocontBTR404', col: 'autocont_bt_r404', label: 'Autocontenidos BT con R404', soloExpress: true }
];
var EQUIPOS = STEPPERS_MT.concat(STEPPERS_BT);
var GRUPOS = [
  { key: 'HMM', label: 'Hiper / Market / Maxi' },
  { key: 'EXPRESS', label: 'Express' }
];
// Lo que suma capacidad instalada: los 6 tipos de equipo del Excel. Los demás campos del
// relevamiento se cargan igual pero no suman kg. En Express, los autocontenidos con R404 y
// los de carnes son góndolas autocontenidas con otro refrigerante/carga.
var CATEGORIAS_CAPACIDAD = [
  { label: 'Centrales MT', cols: ['centrales_mt'] },
  { label: 'Centrales BT', cols: ['centrales_bt'] },
  { label: 'Góndolas autocontenidas MT', cols: ['gondolas_autocont_mt', 'autocont_mt_r404', 'autocont_mt_carnes'] },
  { label: 'Góndolas autocontenidas BT', cols: ['gondolas_autocont_bt', 'autocont_bt_r404'] },
  { label: 'Pozos BT', cols: ['pozos_bt'] },
  { label: 'Cámaras autocontenidas MT+BT', cols: ['camaras_mtbt_dual'] }
];
var COLS_CAPACIDAD = CATEGORIAS_CAPACIDAD.reduce(function (a, c) { return a.concat(c.cols); }, []);

// Equipos que aplican a una tienda/grupo (algunos existen sólo en Express).
function equiposDe_(lista, grupo) {
  return lista.filter(function (eq) { return !eq.soloExpress || grupo === 'EXPRESS'; });
}

var REFRIGERANTES = ['R22', 'R404', 'R290', 'R448A', 'R449A', 'R507', 'R134a', 'CO2'];

function formVacio() {
  return {
    cambioMT: 'No', centralesMT: 0, camarasAutocontMT: 0, gondolasAutocontMT: 0, pozosMT: 0, centralesDual: 0, autocontMTCarnes: 0, autocontMTR404: 0, autocontBTR404: 0,
    cambioBT: 'No', centralesBT: 0, camarasAutocontBT: 0, gondolasAutocontBT: 0, pozosBT: 0, camarasMTBTDual: 0, autocontReemplazoBT: 0,
    observaciones: ''
  };
}

var STATE = { email: '', jefe: '', esMaestro: false, tiendas: [], tienda: null, form: formVacio(), params: [] };

document.addEventListener('DOMContentLoaded', function () {
  wireUpEvents_();
  irA('login');
});

function wireUpEvents_() {
  document.getElementById('btn-login').onclick = enviarLogin;
  document.getElementById('login-input').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') enviarLogin();
  });
  document.getElementById('link-cambiar-cuenta').onclick = function (e) { e.preventDefault(); cambiarCuenta(); };
  document.getElementById('home-buscar-input').oninput = function () { filtrarHome(this.value); };
  document.getElementById('btn-volver-home').onclick = function () { irA('home'); };
  document.getElementById('ficha-btn').onclick = comenzarCarga;
  document.getElementById('btn-volver-ficha').onclick = function () { irA('ficha'); };
  document.getElementById('btn-ir-bt').onclick = avanzarABT;
  document.getElementById('btn-volver-mt').onclick = function () { irA('mt'); };
  document.getElementById('btn-ir-revision').onclick = avanzarARevision;
  document.getElementById('btn-volver-bt').onclick = function () { irA('bt'); };
  document.getElementById('link-editar-mt').onclick = function (e) { e.preventDefault(); irA('mt'); };
  document.getElementById('link-editar-bt').onclick = function (e) { e.preventDefault(); irA('bt'); };
  document.getElementById('btn-enviar').onclick = enviarRelevamiento;
  document.getElementById('btn-volver-mis-tiendas').onclick = cargarInicio;
  document.getElementById('btn-cargar-otra').onclick = function () { irA('home'); };
  document.getElementById('buscar-jefe').oninput = function () { buscarJefeInput(this.value); };
  document.getElementById('btn-ir-params').onclick = abrirParametros;
  document.getElementById('btn-volver-params').onclick = function () { irA('home'); };
  document.getElementById('btn-guardar-params').onclick = guardarParametros;
  document.getElementById('btn-ir-dashboard').onclick = abrirDashboard;
  document.getElementById('btn-volver-dashboard').onclick = function () { irA('home'); };
  document.getElementById('btn-exportar-dashboard').onclick = exportarDashboardCSV;
}

// ---------------------------------------------------------------
// Login
// ---------------------------------------------------------------

function enviarLogin() {
  var email = document.getElementById('login-input').value;
  entrar(email);
}

async function entrar(email) {
  document.getElementById('login-error').style.display = 'none';
  irA('loading');
  try {
    var r = await Promise.all([entrarConEmail(email), cargarParametros_()]);
    STATE.params = r[1];
    onEntrar_(r[0]);
  } catch (err) {
    irA('login');
    onError(err);
  }
}

function onEntrar_(res) {
  if (!res.ok) {
    document.getElementById('login-error').style.display = 'block';
    irA('login');
    return;
  }
  STATE.email = res.email;
  STATE.jefe = res.jefe;
  STATE.esMaestro = !!res.esMaestro;
  STATE.tiendas = res.tiendas;

  if (!res.tiendas || res.tiendas.length === 0) {
    irA('empty');
    return;
  }
  renderHome();
  irA('home');
}

function onError(err) {
  mostrarError_(err && err.message ? err.message : String(err));
}

function mostrarError_(mensaje) {
  var el = document.getElementById('toast-error');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast-error';
    el.className = 'toast-error';
    document.body.appendChild(el);
  }
  el.textContent = mensaje;
  el.classList.remove('ok');
  el.classList.add('show');
  clearTimeout(mostrarError_._t);
  mostrarError_._t = setTimeout(function () { el.classList.remove('show'); }, 4500);
}

// ---------------------------------------------------------------
// Datos (Supabase) — reemplaza a Codigo.gs
// ---------------------------------------------------------------

async function entrarConEmail(email) {
  email = (email || '').toString().trim().toLowerCase();
  if (!/^[^\s@]+@carrefour\.com$/.test(email)) {
    return { ok: false, motivo: 'dominio' };
  }
  var maestro = await esCuentaMaestra_(email);
  var res = maestro ? await todasLasTiendas_() : await tiendasPorMail_(email);
  res.ok = true;
  res.email = email;
  return res;
}

async function esCuentaMaestra_(email) {
  var r = await supabase.from('cuentas_maestras').select('email').eq('email', email).maybeSingle();
  if (r.error) throw r.error;
  return !!r.data;
}

async function tiendasPorMail_(email) {
  email = (email || '').toLowerCase().trim();
  var r = await supabase.from('tiendas').select('*').ilike('jefe_mail', email);
  if (r.error) throw r.error;
  var tiendas = r.data || [];
  var relevamientos = await obtenerRelevamientos_(tiendas.map(function (t) { return t.numero; }));
  var jefeNombre = tiendas.length ? tiendas[0].jefe_nombre : '';
  return {
    jefe: jefeNombre,
    esMaestro: false,
    tiendas: tiendas.map(function (t) { return armarTienda_(t, relevamientos[t.numero], false); })
  };
}

async function todasLasTiendas_() {
  var r = await supabase.from('tiendas').select('*');
  if (r.error) throw r.error;
  var tiendas = r.data || [];
  var relevamientos = await obtenerRelevamientos_(tiendas.map(function (t) { return t.numero; }));
  return {
    jefe: 'Todas las tiendas',
    esMaestro: true,
    tiendas: tiendas.map(function (t) { return armarTienda_(t, relevamientos[t.numero], true); })
  };
}

async function obtenerRelevamientos_(numeros) {
  if (!numeros.length) return {};
  var r = await supabase.from('relevamientos').select('*').in('tienda_numero', numeros);
  if (r.error) throw r.error;
  var map = {};
  (r.data || []).forEach(function (row) { map[row.tienda_numero] = row; });
  return map;
}

function armarTienda_(t, rel, incluirJefe) {
  var obj = {
    tienda: t.numero,
    local: t.local,
    formato: t.formato,
    region: t.region,
    direccion: t.domicilio,
    m2: t.m2,
    estado: rel ? rel.estado : null,
    fecha: rel ? formatearFecha_(rel.ultima_carga) : null,
    rel: rel || null
  };
  if (incluirJefe) obj.jefeNombre = t.jefe_nombre;
  return obj;
}

function formatearFecha_(iso) {
  if (!iso) return null;
  var d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  var dd = String(d.getDate()).padStart(2, '0');
  var mm = String(d.getMonth() + 1).padStart(2, '0');
  return dd + '/' + mm;
}

async function getDatosTienda(numero) {
  var r = await supabase.from('relevamientos').select('*').eq('tienda_numero', numero).maybeSingle();
  if (r.error) throw r.error;
  var v = r.data;
  if (!v) return null;
  return {
    estado: v.estado,
    cambioMT: v.cambio_mt || 'No', centralesMT: v.centrales_mt || 0, camarasAutocontMT: v.camaras_autocont_mt || 0,
    gondolasAutocontMT: v.gondolas_autocont_mt || 0, pozosMT: v.pozos_mt || 0, centralesDual: v.centrales_dual || 0,
    cambioBT: v.cambio_bt || 'No', centralesBT: v.centrales_bt || 0, camarasAutocontBT: v.camaras_autocont_bt || 0,
    gondolasAutocontBT: v.gondolas_autocont_bt || 0, pozosBT: v.pozos_bt || 0, camarasMTBTDual: v.camaras_mtbt_dual || 0, autocontMTCarnes: v.autocont_mt_carnes || 0,
    autocontMTR404: v.autocont_mt_r404 || 0, autocontBTR404: v.autocont_bt_r404 || 0,
    autocontReemplazoBT: v.autocont_reemplazo_bt || 0, observaciones: v.observaciones || ''
  };
}

async function guardarRelevamiento(payload) {
  var estado = payload.pozosGondolasIncompleto ? 'PENDIENTE POZOS Y GONDOLAS' : 'ACTUALIZADO';
  var row = {
    tienda_numero: payload.tienda,
    estado: estado,
    cambio_mt: payload.cambioMT,
    centrales_mt: payload.centralesMT,
    camaras_autocont_mt: payload.camarasAutocontMT,
    gondolas_autocont_mt: payload.gondolasAutocontMT,
    pozos_mt: payload.pozosMT,
    centrales_dual: payload.centralesDual,
    cambio_bt: payload.cambioBT,
    centrales_bt: payload.centralesBT,
    camaras_autocont_bt: payload.camarasAutocontBT,
    gondolas_autocont_bt: payload.gondolasAutocontBT,
    pozos_bt: payload.pozosBT,
    camaras_mtbt_dual: payload.camarasMTBTDual,
    autocont_reemplazo_bt: payload.autocontReemplazoBT,
    observaciones: payload.observaciones,
    ultima_carga: new Date().toISOString(),
    cargado_por: payload.email || ''
  };
  // La columna sólo se manda para Express: así las demás tiendas no dependen de ella.
  if (payload.esExpress) {
    row.autocont_mt_carnes = payload.autocontMTCarnes || 0;
    row.autocont_mt_r404 = payload.autocontMTR404 || 0;
    row.autocont_bt_r404 = payload.autocontBTR404 || 0;
  }
  var r = await supabase.from('relevamientos').upsert(row, { onConflict: 'tienda_numero' });
  if (r.error) throw r.error;
  return { ok: true, estado: estado, row: row };
}

async function buscarJefes(query) {
  query = (query || '').toLowerCase().trim();
  if (query.length < 2) return [];
  var r = await supabase.from('tiendas').select('jefe_nombre, jefe_mail, region').ilike('jefe_nombre', '%' + query + '%');
  if (r.error) throw r.error;
  var vistos = {};
  var out = [];
  (r.data || []).forEach(function (row) {
    if (!row.jefe_nombre || !row.jefe_mail || vistos[row.jefe_mail]) return;
    vistos[row.jefe_mail] = true;
    out.push({ nombre: row.jefe_nombre, mail: row.jefe_mail, region: row.region });
  });
  return out.slice(0, 8);
}

async function getTiendasDeMail(mail) {
  return tiendasPorMail_(mail);
}

async function cargarParametros_() {
  var r = await supabase.from('parametros_kg').select('*');
  // Si la tabla todavía no existe, la carga sigue funcionando sin cálculo de kg.
  if (r.error) { console.warn('parametros_kg:', r.error.message); return []; }
  return r.data || [];
}

// ---------------------------------------------------------------
// Capacidad instalada (kg de refrigerante)
// ---------------------------------------------------------------

function grupoDeFormato_(formato) {
  return String(formato || '').trim().toUpperCase() === 'EXPRESS' ? 'EXPRESS' : 'HMM';
}

// Devuelve el tramo que aplica: el primero (ordenado por m2_hasta) donde m2 <= m2_hasta.
// Un tramo sin tope (m2_hasta null) va último.
function buscarParametro_(params, grupo, col, m2) {
  var tramos = params
    .filter(function (p) { return p.grupo === grupo && p.equipo === col; })
    .sort(function (a, b) {
      if (a.m2_hasta == null) return 1;
      if (b.m2_hasta == null) return -1;
      return a.m2_hasta - b.m2_hasta;
    });
  if (!tramos.length) return null;
  if (tramos.length === 1) return tramos[0];
  if (m2 == null || m2 === '') return null;
  for (var i = 0; i < tramos.length; i++) {
    if (tramos[i].m2_hasta == null || Number(m2) <= Number(tramos[i].m2_hasta)) return tramos[i];
  }
  return null;
}

function calcularCapacidad_(tienda, form, params) {
  var grupo = grupoDeFormato_(tienda.formato);
  var porRef = {};
  var total = 0;
  var faltantes = [];
  var detalle = CATEGORIAS_CAPACIDAD.map(function (cat) {
    var item = { label: cat.label, cant: 0, kg: 0, partes: [] };
    cat.cols.forEach(function (col) {
      var eq = EQUIPOS.find(function (e) { return e.col === col; });
      var cant = Number(form[eq.key]) || 0;
      if (!cant) return;
      var p = buscarParametro_(params, grupo, col, tienda.m2);
      if (!p) { faltantes.push(eq.label); return; }
      var kg = cant * Number(p.kg);
      porRef[p.refrigerante] = (porRef[p.refrigerante] || 0) + kg;
      total += kg;
      item.cant += cant;
      item.kg += kg;
      item.partes.push({ cant: cant, kgUnidad: Number(p.kg), refrigerante: p.refrigerante, kg: kg });
    });
    return item;
  });
  return { grupo: grupo, porRef: porRef, total: total, faltantes: faltantes, detalle: detalle };
}

// Capacidad instalada de una tienda de la lista, a partir de su relevamiento guardado.
function capacidadTienda_(t) {
  if (!t.rel || !STATE.params.length) return null;
  var form = {};
  EQUIPOS.forEach(function (eq) { form[eq.key] = t.rel[eq.col] || 0; });
  return calcularCapacidad_(t, form, STATE.params);
}

function fmtKg_(n) {
  return (Math.round(n * 100) / 100).toLocaleString('es-AR') + ' kg';
}

// ---------------------------------------------------------------
// Navegación
// ---------------------------------------------------------------

function irA(vista) {
  document.querySelectorAll('.view').forEach(function (v) { v.classList.remove('active'); });
  document.getElementById('view-' + vista).classList.add('active');
  document.querySelector('.frame').classList.toggle('wide', vista === 'dashboard');
  window.scrollTo(0, 0);
}

function cargarInicio() {
  STATE.tienda = null;
  STATE.form = formVacio();
  entrar(STATE.email);
}

function cambiarCuenta() {
  STATE.email = '';
  document.getElementById('login-input').value = '';
  irA('login');
}

// ---------------------------------------------------------------
// Home: Mis tiendas
// ---------------------------------------------------------------

function renderHome() {
  if (STATE.esMaestro) {
    document.getElementById('home-avatar').textContent = '★';
    document.getElementById('home-saludo').textContent = 'Vista maestra';
    document.getElementById('home-titulo-lista').textContent = 'Todas las tiendas (' + STATE.tiendas.length + ')';
    document.getElementById('home-buscador').style.display = 'block';
    document.getElementById('home-acciones-maestro').style.display = 'block';
  } else {
    var partes = (STATE.jefe || '').trim().split(' ');
    var iniciales = ((partes[0] || '')[0] || '') + ((partes[1] || '')[0] || '');
    document.getElementById('home-avatar').textContent = iniciales.toUpperCase();
    document.getElementById('home-saludo').textContent = 'Hola, ' + (partes[0] || STATE.jefe);
    document.getElementById('home-titulo-lista').textContent = 'Tus tiendas a cargo';
    document.getElementById('home-buscador').style.display = 'none';
    document.getElementById('home-acciones-maestro').style.display = 'none';
  }
  pintarListaHome_(STATE.tiendas);
}

function filtrarHome(query) {
  query = (query || '').toLowerCase().trim();
  if (!query) { pintarListaHome_(STATE.tiendas); return; }
  var filtradas = STATE.tiendas.filter(function (t) {
    return String(t.tienda).indexOf(query) !== -1 ||
      (t.local || '').toLowerCase().indexOf(query) !== -1 ||
      (t.jefeNombre || '').toLowerCase().indexOf(query) !== -1;
  });
  pintarListaHome_(filtradas);
}

function pintarListaHome_(lista) {
  var cont = document.getElementById('home-lista');
  cont.innerHTML = '';
  lista.forEach(function (t) {
    var info = infoEstado_(t.estado);
    var meta = t.estado
      ? (info.label + (t.fecha ? ' · Cargado ' + t.fecha : ''))
      : 'Sin carga registrada';
    if (t.jefeNombre) meta += ' · ' + t.jefeNombre;
    var cap = capacidadTienda_(t);
    var card = document.createElement('div');
    card.className = 'card tienda-card';
    card.onclick = function () { abrirFicha(t); };
    card.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">' +
        '<div>' +
          '<div style="font-family:var(--font-display);font-weight:800;font-size:15.5px;">' + t.tienda + ' · ' + esc_(t.local) + '</div>' +
          '<div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap;"><span class="chip">' + esc_(t.formato) + '</span>' +
            (cap ? '<span class="chip chip-kg">' + fmtKg_(cap.total) + ' instalados</span>' : '') + '</div>' +
        '</div>' +
        '<span class="badge ' + info.cls + '">' + info.label + '</span>' +
      '</div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border);padding-top:10px;">' +
        '<div style="font-size:12.5px;color:var(--text-2);">' + esc_(meta) + '</div>' +
        '<span style="color:var(--text-3);">›</span>' +
      '</div>';
    cont.appendChild(card);
  });
}

function infoEstado_(estado) {
  if (estado === 'ACTUALIZADO' || estado === 'SIN NOVEDADES') return { cls: 'badge-actualizado', label: 'Actualizado' };
  if (estado === 'PENDIENTE POZOS Y GONDOLAS') return { cls: 'badge-parcial', label: 'Parcial' };
  return { cls: 'badge-pendiente', label: 'Pendiente' };
}

// ---------------------------------------------------------------
// Ficha de tienda
// ---------------------------------------------------------------

function abrirFicha(t) {
  STATE.tienda = t;
  document.getElementById('ficha-titulo').textContent = t.tienda + ' · ' + t.local;
  document.getElementById('ficha-formato').textContent = t.formato;
  document.getElementById('ficha-direccion').textContent = t.direccion || '—';
  document.getElementById('ficha-region').textContent = t.region || '—';
  document.getElementById('ficha-m2').textContent = (t.m2 ? t.m2 + ' m²' : '—');
  renderCapacidadFicha_(t);

  var info = infoEstado_(t.estado);
  document.getElementById('ficha-estado').innerHTML = '<span class="badge ' + info.cls + '">' + info.label + '</span>';

  var aviso = document.getElementById('ficha-aviso');
  var btn = document.getElementById('ficha-btn');
  if (t.estado) {
    aviso.querySelector('p').textContent = 'Ya hay un relevamiento cargado para esta tienda. Podés revisarlo y editarlo.';
    btn.textContent = 'Editar carga';
  } else {
    aviso.querySelector('p').textContent = 'Todavía no hay un relevamiento cargado para esta tienda. Te va a llevar 2 pasos: Media Temperatura y Baja Temperatura.';
    btn.textContent = 'Comenzar carga';
  }
  irA('ficha');
}

function renderCapacidadFicha_(t) {
  var cont = document.getElementById('ficha-capacidad');
  var cap = capacidadTienda_(t);
  if (!cap) { cont.style.display = 'none'; return; }
  cont.style.display = 'block';
  var html = '<div class="cap-cabecera"><div><div class="section-title" style="margin-bottom:4px;">Capacidad instalada</div>' +
    '<div class="cap-total">' + fmtKg_(cap.total) + '</div></div>' +
    '<div class="cap-refs">' + Object.keys(cap.porRef).sort().map(function (ref) {
      return '<span class="chip">' + esc_(ref) + ' · ' + fmtKg_(cap.porRef[ref]) + '</span>';
    }).join('') + '</div></div>';
  html += cap.detalle.map(function (d) {
    var calc = d.partes.length
      ? d.partes.map(function (p) { return p.cant + ' × ' + p.kgUnidad.toLocaleString('es-AR') + ' kg ' + esc_(p.refrigerante); }).join(' + ')
      : 'Sin equipos';
    return '<div class="resumen-fila"><span>' + esc_(d.label) + ' <span class="cap-calc">' + calc + '</span></span><span>' + fmtKg_(d.kg) + '</span></div>';
  }).join('');
  if (cap.faltantes.length) {
    html += '<p class="nota-aviso">Sin parámetro para: ' + esc_(cap.faltantes.join(', ')) + '.</p>';
  }
  cont.innerHTML = html;
}

async function comenzarCarga() {
  if (!STATE.tienda) return;
  if (STATE.tienda.estado) {
    try {
      var datos = await getDatosTienda(STATE.tienda.tienda);
      STATE.form = datos || formVacio();
      abrirPasoMT();
    } catch (err) {
      onError(err);
    }
  } else {
    STATE.form = formVacio();
    abrirPasoMT();
  }
}

function abrirPasoMT() {
  document.getElementById('mt-tienda').textContent = STATE.tienda.tienda + ' · ' + STATE.tienda.local;
  setToggle('toggle-cambioMT', STATE.form.cambioMT);
  renderSteppers('steppers-mt', STEPPERS_MT);
  irA('mt');
}

// ---------------------------------------------------------------
// Steppers y toggles (compartido por MT y BT)
// ---------------------------------------------------------------

function renderSteppers(contId, config) {
  var cont = document.getElementById(contId);
  cont.innerHTML = '';
  equiposDe_(config, grupoDeFormato_(STATE.tienda.formato)).forEach(function (it) {
    var row = document.createElement('div');
    row.className = 'stepper-row';
    row.innerHTML =
      '<div class="stepper-label">' + it.label + '</div>' +
      '<div class="stepper-control">' +
        '<button class="stepper-btn" data-dir="-1">−</button>' +
        '<div class="stepper-value" id="val-' + it.key + '">' + STATE.form[it.key] + '</div>' +
        '<button class="stepper-btn" data-dir="1">+</button>' +
      '</div>';
    var btns = row.querySelectorAll('.stepper-btn');
    btns[0].onclick = function () { cambiarStepper(it.key, -1); };
    btns[1].onclick = function () { cambiarStepper(it.key, 1); };
    cont.appendChild(row);
  });
}

function cambiarStepper(key, delta) {
  var nuevo = Math.max(0, (STATE.form[key] || 0) + delta);
  STATE.form[key] = nuevo;
  document.getElementById('val-' + key).textContent = nuevo;
}

function setToggle(contId, valor) {
  var cont = document.getElementById(contId);
  var opts = cont.querySelectorAll('.segmented-opt');
  opts.forEach(function (o) {
    o.classList.toggle('active', o.dataset.val === valor);
    o.onclick = function () {
      var key = contId === 'toggle-cambioMT' ? 'cambioMT' : 'cambioBT';
      STATE.form[key] = o.dataset.val;
      setToggle(contId, o.dataset.val);
    };
  });
}

// ---------------------------------------------------------------
// Paso BT
// ---------------------------------------------------------------

function avanzarABT() {
  document.getElementById('bt-tienda').textContent = STATE.tienda.tienda + ' · ' + STATE.tienda.local;
  setToggle('toggle-cambioBT', STATE.form.cambioBT);
  renderSteppers('steppers-bt', STEPPERS_BT);
  irA('bt');
}

function avanzarARevision() {
  document.getElementById('revision-tienda').textContent = STATE.tienda.tienda + ' · ' + STATE.tienda.local;
  document.getElementById('revision-observaciones').value = STATE.form.observaciones || '';

  var mtCont = document.getElementById('revision-mt');
  mtCont.innerHTML = '';
  equiposDe_(STEPPERS_MT, grupoDeFormato_(STATE.tienda.formato)).forEach(function (it) {
    mtCont.innerHTML += '<div class="resumen-fila"><span>' + it.label + '</span><span>' + STATE.form[it.key] + '</span></div>';
  });

  var btCont = document.getElementById('revision-bt');
  btCont.innerHTML = '';
  equiposDe_(STEPPERS_BT, grupoDeFormato_(STATE.tienda.formato)).forEach(function (it) {
    btCont.innerHTML += '<div class="resumen-fila"><span>' + it.label + '</span><span>' + STATE.form[it.key] + '</span></div>';
  });

  renderCapacidadRevision_();
  irA('revision');
}

function renderCapacidadRevision_() {
  var cont = document.getElementById('revision-kg');
  if (!STATE.params.length) { cont.parentNode.style.display = 'none'; return; }
  cont.parentNode.style.display = 'block';
  var cap = calcularCapacidad_(STATE.tienda, STATE.form, STATE.params);
  var html = '';
  Object.keys(cap.porRef).sort().forEach(function (ref) {
    html += '<div class="resumen-fila"><span>' + esc_(ref) + '</span><span>' + fmtKg_(cap.porRef[ref]) + '</span></div>';
  });
  html += '<div class="resumen-fila resumen-total"><span>Total</span><span>' + fmtKg_(cap.total) + '</span></div>';
  if (cap.faltantes.length) {
    html += '<p class="nota-aviso">Sin parámetro para: ' + esc_(cap.faltantes.join(', ')) +
      (STATE.tienda.m2 ? '' : ' (la tienda no tiene m² cargados)') + '.</p>';
  }
  cont.innerHTML = html;
}

async function enviarRelevamiento() {
  STATE.form.observaciones = document.getElementById('revision-observaciones').value;
  var payload = Object.assign({}, STATE.form, {
    tienda: STATE.tienda.tienda,
    email: STATE.email,
    esExpress: grupoDeFormato_(STATE.tienda.formato) === 'EXPRESS',
    pozosGondolasIncompleto: false
  });

  var btn = document.getElementById('btn-enviar');
  btn.disabled = true;
  btn.textContent = 'Enviando…';

  try {
    var res = await guardarRelevamiento(payload);
    onEnviado_(res);
  } catch (err) {
    btn.disabled = false;
    btn.textContent = 'Confirmar y enviar';
    onError(err);
  }
}

function onEnviado_(res) {
  STATE.tienda.rel = Object.assign({}, STATE.tienda.rel, res.row);
  STATE.tienda.estado = res.estado;
  STATE.tienda.fecha = formatearFecha_(res.row.ultima_carga);
  pintarListaHome_(STATE.tiendas);
  document.getElementById('confirm-tienda').textContent = STATE.tienda.tienda + ' · ' + STATE.tienda.local;
  document.getElementById('confirm-msg').innerHTML =
    'El relevamiento de <strong>' + STATE.tienda.tienda + ' · ' + esc_(STATE.tienda.local) + '</strong> se envió correctamente.';
  var info = infoEstado_(res.estado);
  document.getElementById('confirm-badge').className = 'badge ' + info.cls;
  document.getElementById('confirm-badge').textContent = info.label + ' · hoy';
  irA('confirm');
}

// ---------------------------------------------------------------
// Parámetros de kg (sólo cuentas maestras)
// ---------------------------------------------------------------

var PARAMS_EDIT = { grupo: 'HMM', filas: [], borrados: [] };
var _tmpId = 0;

async function abrirParametros() {
  irA('loading');
  try {
    STATE.params = await cargarParametros_();
  } catch (err) {
    onError(err);
  }
  PARAMS_EDIT.filas = STATE.params.map(function (p) { return Object.assign({}, p); });
  PARAMS_EDIT.borrados = [];
  renderParametros_();
  irA('params');
}

function ordenarTramos_(a, b) {
  if (a.m2_hasta == null) return 1;
  if (b.m2_hasta == null) return -1;
  return a.m2_hasta - b.m2_hasta;
}

function renderParametros_() {
  var tabs = document.getElementById('params-tabs');
  tabs.innerHTML = '';
  GRUPOS.forEach(function (g) {
    var opt = document.createElement('div');
    opt.className = 'segmented-opt' + (PARAMS_EDIT.grupo === g.key ? ' active' : '');
    opt.textContent = g.label;
    opt.onclick = function () { leerInputsParams_(); PARAMS_EDIT.grupo = g.key; renderParametros_(); };
    tabs.appendChild(opt);
  });

  var cont = document.getElementById('params-lista');
  cont.innerHTML = '';
  if (!PARAMS_EDIT.filas.length) {
    cont.innerHTML = '<div class="card"><p class="nota-aviso" style="margin:0;">Todavía no existe la tabla <strong>parametros_kg</strong> en Supabase. ' +
      'Hay que correr el script <code>frio-alimentario/sql/002_parametros_kg.sql</code> en el SQL Editor.</p></div>';
    return;
  }

  equiposDe_(EQUIPOS, PARAMS_EDIT.grupo).filter(function (eq) { return COLS_CAPACIDAD.indexOf(eq.col) !== -1; }).forEach(function (eq) {
    var filas = PARAMS_EDIT.filas
      .filter(function (f) { return f.grupo === PARAMS_EDIT.grupo && f.equipo === eq.col; })
      .sort(ordenarTramos_);
    var conTramos = filas.length > 1;
    var card = document.createElement('div');
    card.className = 'card param-card';
    var html = '<div class="param-titulo">' + esc_(eq.label) + '</div>';
    if (conTramos) {
      html += '<div class="param-row param-head"><span>Hasta m²</span><span>Refrig.</span><span>Kg por equipo</span><span></span></div>';
    }
    filas.forEach(function (f) {
      var fid = f.id != null ? f.id : f._tmp;
      html += '<div class="param-row" data-fid="' + fid + '">' +
        (conTramos
          ? '<input class="param-input" data-campo="m2_hasta" type="number" min="0" step="1" placeholder="sin tope" value="' + (f.m2_hasta == null ? '' : f.m2_hasta) + '">'
          : '<span class="param-sin-tramo">Todos los m²</span>') +
        '<select class="param-input" data-campo="refrigerante">' + opcionesRefrigerante_(f.refrigerante) + '</select>' +
        '<input class="param-input" data-campo="kg" type="number" min="0" step="0.01" value="' + f.kg + '">' +
        (conTramos ? '<button class="param-borrar" title="Borrar tramo">×</button>' : '<span></span>') +
      '</div>';
    });
    html += '<a href="#" class="param-agregar">+ Agregar tramo por m²</a>';
    card.innerHTML = html;

    card.querySelectorAll('.param-borrar').forEach(function (btn) {
      btn.onclick = function () {
        leerInputsParams_();
        borrarFilaParam_(btn.parentNode.dataset.fid);
        renderParametros_();
      };
    });
    card.querySelector('.param-agregar').onclick = function (e) {
      e.preventDefault();
      leerInputsParams_();
      agregarTramo_(eq.col, filas);
      renderParametros_();
    };
    cont.appendChild(card);
  });
}

function opcionesRefrigerante_(actual) {
  var lista = REFRIGERANTES.slice();
  if (actual && lista.indexOf(actual) === -1) lista.push(actual);
  return lista.map(function (r) {
    return '<option' + (r === actual ? ' selected' : '') + '>' + esc_(r) + '</option>';
  }).join('');
}

function buscarFilaParam_(fid) {
  return PARAMS_EDIT.filas.find(function (f) { return String(f.id != null ? f.id : f._tmp) === String(fid); });
}

// Vuelca lo escrito en pantalla al estado antes de re-renderizar o guardar.
function leerInputsParams_() {
  document.querySelectorAll('#params-lista .param-row[data-fid]').forEach(function (row) {
    var f = buscarFilaParam_(row.dataset.fid);
    if (!f) return;
    row.querySelectorAll('.param-input').forEach(function (inp) {
      var campo = inp.dataset.campo;
      if (campo === 'refrigerante') f.refrigerante = inp.value;
      else if (campo === 'kg') f.kg = inp.value === '' ? 0 : Number(inp.value);
      else if (campo === 'm2_hasta') f.m2_hasta = inp.value === '' ? null : Number(inp.value);
    });
  });
}

function borrarFilaParam_(fid) {
  var f = buscarFilaParam_(fid);
  if (!f) return;
  if (f.id != null) PARAMS_EDIT.borrados.push(f.id);
  PARAMS_EDIT.filas.splice(PARAMS_EDIT.filas.indexOf(f), 1);
  // Si queda un solo tramo, pasa a valer para todos los m².
  var resto = PARAMS_EDIT.filas.filter(function (x) { return x.grupo === f.grupo && x.equipo === f.equipo; });
  if (resto.length === 1) resto[0].m2_hasta = null;
}

// El tramo sin tope sigue siendo el último; el nuevo se agrega con un tope a completar.
function agregarTramo_(col, filas) {
  var base = filas[filas.length - 1] || { refrigerante: 'R22', kg: 0 };
  var topes = filas.map(function (f) { return f.m2_hasta; }).filter(function (v) { return v != null; });
  var nuevoTope = topes.length ? Math.max.apply(null, topes) + 1000 : 1000;
  if (!filas.length) {
    PARAMS_EDIT.filas.push({ _tmp: 'n' + (++_tmpId), grupo: PARAMS_EDIT.grupo, equipo: col, m2_hasta: null, refrigerante: 'R22', kg: 0 });
  }
  PARAMS_EDIT.filas.push({
    _tmp: 'n' + (++_tmpId), grupo: PARAMS_EDIT.grupo, equipo: col,
    m2_hasta: nuevoTope, refrigerante: base.refrigerante, kg: base.kg
  });
}

function validarParams_() {
  var errores = [];
  GRUPOS.forEach(function (g) {
    EQUIPOS.forEach(function (eq) {
      var filas = PARAMS_EDIT.filas.filter(function (f) { return f.grupo === g.key && f.equipo === eq.col; });
      if (filas.length < 2) return;
      var sinTope = filas.filter(function (f) { return f.m2_hasta == null; }).length;
      var topes = filas.map(function (f) { return f.m2_hasta; }).filter(function (v) { return v != null; });
      var repetidos = topes.some(function (v, i) { return topes.indexOf(v) !== i; });
      if (sinTope !== 1) errores.push(g.label + ' · ' + eq.label + ': tiene que haber un solo tramo "sin tope" (m² vacío).');
      if (repetidos) errores.push(g.label + ' · ' + eq.label + ': hay dos tramos con el mismo tope de m².');
    });
  });
  return errores;
}

async function guardarParametros() {
  leerInputsParams_();
  var errores = validarParams_();
  if (errores.length) { mostrarError_(errores[0]); return; }

  var originales = {};
  STATE.params.forEach(function (p) { originales[p.id] = p; });
  var ahora = new Date().toISOString();
  var cambiados = [];
  var nuevos = [];
  PARAMS_EDIT.filas.forEach(function (f) {
    var row = {
      grupo: f.grupo, equipo: f.equipo, m2_hasta: f.m2_hasta,
      refrigerante: f.refrigerante, kg: Number(f.kg) || 0,
      actualizado_por: STATE.email, actualizado_at: ahora
    };
    if (f.id == null) { nuevos.push(row); return; }
    var o = originales[f.id];
    var m2Orig = o.m2_hasta == null ? null : Number(o.m2_hasta);
    if (m2Orig === f.m2_hasta && o.refrigerante === f.refrigerante && Number(o.kg) === Number(f.kg)) return;
    row.id = f.id;
    cambiados.push(row);
  });

  if (!cambiados.length && !nuevos.length && !PARAMS_EDIT.borrados.length) {
    mostrarError_('No hay cambios para guardar.');
    return;
  }

  var btn = document.getElementById('btn-guardar-params');
  btn.disabled = true;
  btn.textContent = 'Guardando…';
  try {
    // Orden: borrar, actualizar y recién después insertar, para no chocar con la
    // restricción de tramo único (grupo, equipo, m2_hasta).
    if (PARAMS_EDIT.borrados.length) {
      var d = await supabase.from('parametros_kg').delete().in('id', PARAMS_EDIT.borrados);
      if (d.error) throw d.error;
    }
    for (var i = 0; i < cambiados.length; i++) {
      var u = await supabase.from('parametros_kg').update(cambiados[i]).eq('id', cambiados[i].id);
      if (u.error) throw u.error;
    }
    if (nuevos.length) {
      var ins = await supabase.from('parametros_kg').insert(nuevos);
      if (ins.error) throw ins.error;
    }
    mostrarOk_('Parámetros guardados');
  } catch (err) {
    onError(err);
  } finally {
    // Se recarga siempre, para que la pantalla refleje lo que quedó en la base.
    STATE.params = await cargarParametros_();
    PARAMS_EDIT.filas = STATE.params.map(function (p) { return Object.assign({}, p); });
    PARAMS_EDIT.borrados = [];
    renderParametros_();
    btn.disabled = false;
    btn.textContent = 'Guardar cambios';
  }
}

function mostrarOk_(mensaje) {
  mostrarError_(mensaje);
  document.getElementById('toast-error').classList.add('ok');
}

// ---------------------------------------------------------------
// Fallback: sin tiendas asignadas
// ---------------------------------------------------------------

var _buscarTimeout = null;
function buscarJefeInput(valor) {
  clearTimeout(_buscarTimeout);
  _buscarTimeout = setTimeout(async function () {
    try {
      var lista = await buscarJefes(valor);
      renderResultadosJefe_(lista);
    } catch (err) {
      onError(err);
    }
  }, 250);
}

function renderResultadosJefe_(lista) {
  var cont = document.getElementById('empty-resultados');
  cont.innerHTML = '';
  lista.forEach(function (j) {
    var partes = j.nombre.trim().split(' ');
    var iniciales = ((partes[0] || '')[0] || '') + ((partes[1] || '')[0] || '');
    var card = document.createElement('div');
    card.className = 'card';
    card.style.cssText = 'display:flex;align-items:center;gap:12px;padding:12px 16px;cursor:pointer;';
    card.innerHTML =
      '<div class="avatar" style="background:var(--cf-green-tint);color:var(--cf-green-dark);width:38px;height:38px;font-size:13px;">' + iniciales.toUpperCase() + '</div>' +
      '<div><div style="font-size:13.5px;font-weight:700;">' + esc_(j.nombre) + '</div><div style="font-size:12px;color:var(--text-2);">' + esc_(j.region) + '</div></div>';
    card.onclick = async function () {
      irA('loading');
      try {
        var res = await getTiendasDeMail(j.mail);
        STATE.email = j.mail;
        STATE.jefe = res.jefe;
        STATE.esMaestro = !!res.esMaestro;
        STATE.tiendas = res.tiendas;
        renderHome();
        irA('home');
      } catch (err) {
        irA('empty');
        onError(err);
      }
    };
    cont.appendChild(card);
  });
}

// ---------------------------------------------------------------
// Utils
// ---------------------------------------------------------------

function esc_(s) {
  var div = document.createElement('div');
  div.textContent = s == null ? '' : String(s);
  return div.innerHTML;
}
