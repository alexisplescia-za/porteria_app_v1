// Carga de Frío Alimentario — frontend conectado directo a Supabase.
// Reemplaza a Codigo.gs + JavaScript.html de la versión en Apps Script.

var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

var STEPPERS_MT = [
  { key: 'centralesMT', label: 'Centrales MT' },
  { key: 'camarasAutocontMT', label: 'Cámaras autocontenidas MT' },
  { key: 'gondolasAutocontMT', label: 'Góndolas autocontenidas MT' },
  { key: 'pozosMT', label: 'Pozos MT' },
  { key: 'centralesDual', label: 'Centrales Dual (MT+BT)' }
];
var STEPPERS_BT = [
  { key: 'centralesBT', label: 'Centrales BT' },
  { key: 'camarasAutocontBT', label: 'Cámaras autocontenidas BT' },
  { key: 'gondolasAutocontBT', label: 'Góndolas autocontenidas BT' },
  { key: 'pozosBT', label: 'Pozos BT' },
  { key: 'camarasMTBTDual', label: 'Cámaras MT+BT (Dual)' },
  { key: 'autocontReemplazoBT', label: 'Autocont. que reemplazaron central BT' }
];

function formVacio() {
  return {
    cambioMT: 'No', centralesMT: 0, camarasAutocontMT: 0, gondolasAutocontMT: 0, pozosMT: 0, centralesDual: 0,
    cambioBT: 'No', centralesBT: 0, camarasAutocontBT: 0, gondolasAutocontBT: 0, pozosBT: 0, camarasMTBTDual: 0, autocontReemplazoBT: 0,
    observaciones: ''
  };
}

var STATE = { email: '', jefe: '', esMaestro: false, tiendas: [], tienda: null, form: formVacio() };

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
    var res = await entrarConEmail(email);
    onEntrar_(res);
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
    fecha: rel ? formatearFecha_(rel.ultima_carga) : null
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
    gondolasAutocontBT: v.gondolas_autocont_bt || 0, pozosBT: v.pozos_bt || 0, camarasMTBTDual: v.camaras_mtbt_dual || 0,
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
  var r = await supabase.from('relevamientos').upsert(row, { onConflict: 'tienda_numero' });
  if (r.error) throw r.error;
  return { ok: true, estado: estado };
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

// ---------------------------------------------------------------
// Navegación
// ---------------------------------------------------------------

function irA(vista) {
  document.querySelectorAll('.view').forEach(function (v) { v.classList.remove('active'); });
  document.getElementById('view-' + vista).classList.add('active');
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
  } else {
    var partes = (STATE.jefe || '').trim().split(' ');
    var iniciales = ((partes[0] || '')[0] || '') + ((partes[1] || '')[0] || '');
    document.getElementById('home-avatar').textContent = iniciales.toUpperCase();
    document.getElementById('home-saludo').textContent = 'Hola, ' + (partes[0] || STATE.jefe);
    document.getElementById('home-titulo-lista').textContent = 'Tus tiendas a cargo';
    document.getElementById('home-buscador').style.display = 'none';
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
    var card = document.createElement('div');
    card.className = 'card tienda-card';
    card.onclick = function () { abrirFicha(t); };
    card.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">' +
        '<div>' +
          '<div style="font-family:var(--font-display);font-weight:800;font-size:15.5px;">' + t.tienda + ' · ' + esc_(t.local) + '</div>' +
          '<div style="margin-top:6px;"><span class="chip">' + esc_(t.formato) + '</span></div>' +
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
  config.forEach(function (it) {
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
  STEPPERS_MT.forEach(function (it) {
    mtCont.innerHTML += '<div class="resumen-fila"><span>' + it.label + '</span><span>' + STATE.form[it.key] + '</span></div>';
  });

  var btCont = document.getElementById('revision-bt');
  btCont.innerHTML = '';
  STEPPERS_BT.forEach(function (it) {
    btCont.innerHTML += '<div class="resumen-fila"><span>' + it.label + '</span><span>' + STATE.form[it.key] + '</span></div>';
  });

  irA('revision');
}

async function enviarRelevamiento() {
  STATE.form.observaciones = document.getElementById('revision-observaciones').value;
  var payload = Object.assign({}, STATE.form, {
    tienda: STATE.tienda.tienda,
    email: STATE.email,
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
  document.getElementById('confirm-tienda').textContent = STATE.tienda.tienda + ' · ' + STATE.tienda.local;
  document.getElementById('confirm-msg').innerHTML =
    'El relevamiento de <strong>' + STATE.tienda.tienda + ' · ' + esc_(STATE.tienda.local) + '</strong> se envió correctamente.';
  var info = infoEstado_(res.estado);
  document.getElementById('confirm-badge').className = 'badge ' + info.cls;
  document.getElementById('confirm-badge').textContent = info.label + ' · hoy';
  irA('confirm');
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
